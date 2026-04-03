/**
 * time-picker: Form-associated time input with combobox text entry
 *
 * Progressive enhancement over <input type="time">.
 * Renders a text input (combobox) with clock icon and spinbutton dropdown.
 * Users can type a time directly or use the spinbutton panel.
 * Participates in native form submission via ElementInternals.
 *
 * @attr {string}  name        - Form field name
 * @attr {string}  data-format - "12h" or "24h" (default: locale-detected)
 * @attr {boolean} disabled    - Disables the picker
 * @attr {boolean} required    - Makes selection required
 *
 * The wrapped <input type="time"> provides min, max, step, and value.
 *
 * @example
 * <time-picker name="meeting" data-format="12h">
 *   <input type="time" min="09:00" max="17:00" step="900">
 * </time-picker>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { setRole } from '../../utils/form-internals.js';

/** Detect whether the user's locale prefers 12h format */
function detectFormat() {
  try {
    const resolved = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
    return resolved.hourCycle === 'h12' || resolved.hourCycle === 'h11' ? '12h' : '24h';
  } catch {
    return '12h';
  }
}

/** Pad a number to two digits */
function pad(n) {
  return String(n).padStart(2, '0');
}

/** Parse "HH:MM" or "HH:MM:SS" into { h, m, s } */
function parseTime(str) {
  if (!str) return null;
  const parts = str.split(':').map(Number);
  return { h: parts[0] || 0, m: parts[1] || 0, s: parts[2] || 0 };
}

/** Format { h, m, s } to "HH:MM" or "HH:MM:SS" */
function formatTime(h, m, s, showSeconds) {
  return showSeconds ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}`;
}

/** Format time for display in the text input */
function formatDisplay(h, m, s, showSeconds, format) {
  if (format === '12h') {
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 || 12;
    return showSeconds
      ? `${dh}:${pad(m)}:${pad(s)} ${period}`
      : `${dh}:${pad(m)} ${period}`;
  }
  return formatTime(h, m, s, showSeconds);
}

/**
 * Parse user-typed text into a time value.
 * Supports: "2:30 PM", "2:30pm", "14:30", "2pm", "14", "2:30:15 pm", etc.
 * @returns {{ h: number, m: number, s: number }|null}
 */
function parseUserTime(text) {
  const t = text.trim();
  if (!t) return null;

  // Extract AM/PM marker
  const periodMatch = t.match(/\s*(am|pm|a\.m\.|p\.m\.|a|p)\s*$/i);
  let period = null;
  let timePart = t;
  if (periodMatch) {
    const raw = periodMatch[1].toLowerCase().replace(/\./g, '');
    period = raw.startsWith('p') ? 'PM' : 'AM';
    timePart = t.slice(0, periodMatch.index).trim();
  }

  // Split on : or . separator
  const parts = timePart.split(/[:.]/);
  if (parts.length < 1 || parts.length > 3) return null;

  const hours = Number(parts[0]);
  const minutes = parts.length > 1 ? Number(parts[1]) : 0;
  const seconds = parts.length > 2 ? Number(parts[2]) : 0;

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
  if (minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) return null;

  let h = hours;
  if (period) {
    // 12h input
    if (h < 1 || h > 12) return null;
    if (period === 'AM') h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
  } else {
    // 24h input
    if (h < 0 || h > 23) return null;
  }

  return { h, m: minutes, s: seconds };
}

/** Clamp value within [min, max], wrapping around */
function wrapClamp(val, min, max) {
  if (val > max) return min;
  if (val < min) return max;
  return val;
}

class TimePicker extends VBElement {
  static formAssociated = true;

  #internals;
  #input;          // original <input type="time">
  #textInput;      // combobox text input
  #trigger;        // .time-trigger container
  #iconBtn;        // clock icon button
  #panel;          // .time-panel dropdown
  #spinners = [];  // { el, role, min, max, step }
  #periodBtn;      // AM/PM toggle button
  #format;         // "12h" or "24h"
  #showSeconds;    // true if step < 60
  #hours = 0;
  #minutes = 0;
  #seconds = 0;
  #period = 'AM';  // only used in 12h mode
  #minTime = null; // { h, m, s }
  #maxTime = null;
  #step = 60;      // seconds
  #initialValue;
  #focusedIndex = 0;
  #isOpen = false;
  #panelId;

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  setup() {
    this.#input = this.querySelector(':scope > input[type="time"]');
    if (!this.#input) return false;

    // Read attributes from input
    this.#step = Number(this.#input.getAttribute('step')) || 60;
    this.#showSeconds = this.#step < 60;
    this.#minTime = parseTime(this.#input.getAttribute('min'));
    this.#maxTime = parseTime(this.#input.getAttribute('max'));
    this.#format = this.getAttribute('data-format') || detectFormat();

    // Parse initial value
    const initial = parseTime(this.#input.value);
    if (initial) {
      this.#hours = initial.h;
      this.#minutes = initial.m;
      this.#seconds = initial.s;
    }
    this.#initialValue = this.#input.value;

    // Convert to 12h if needed
    if (this.#format === '12h') {
      this.#period = this.#hours >= 12 ? 'PM' : 'AM';
    }

    // Hide native input
    this.#input.setAttribute('tabindex', '-1');
    this.#input.setAttribute('aria-hidden', 'true');
    this.#input.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;';

    this.#buildTrigger();
    this.#buildPanel();
    this.#updateDisplay();
    this.#updateTextInput();
    this.#syncFormValue();
    this.#validate();

    // Outside click to close
    this.listen(document, 'click', this.#handleOutsideClick);

    // Disabled state
    if (this.#input.disabled || this.hasAttribute('disabled')) {
      this.setAttribute('data-disabled', '');
      this.#textInput.disabled = true;
    }
  }

  #buildTrigger() {
    this.#trigger = document.createElement('div');
    this.#trigger.className = 'time-trigger';

    // Text input — primary focusable element
    this.#textInput = document.createElement('input');
    this.#textInput.type = 'text';
    this.#textInput.className = 'time-input';
    this.#textInput.setAttribute('role', 'combobox');
    this.#textInput.setAttribute('aria-haspopup', 'listbox');
    this.#textInput.setAttribute('aria-expanded', 'false');
    this.#textInput.setAttribute('autocomplete', 'off');
    this.#textInput.setAttribute('placeholder', 'Type a time\u2026');
    this.#trigger.appendChild(this.#textInput);

    // Clock icon button
    this.#iconBtn = document.createElement('button');
    this.#iconBtn.type = 'button';
    this.#iconBtn.className = 'time-trigger-icon';
    this.#iconBtn.setAttribute('aria-label', 'Toggle time spinner');
    this.#iconBtn.setAttribute('tabindex', '-1');
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'clock');
    icon.setAttribute('size', 'sm');
    icon.setAttribute('aria-hidden', 'true');
    this.#iconBtn.appendChild(icon);
    this.#trigger.appendChild(this.#iconBtn);

    this.appendChild(this.#trigger);

    // Icon button toggles panel
    this.listen(this.#iconBtn, 'click', (e) => {
      e.stopPropagation();
      this.#isOpen ? this.#close() : this.#open();
      this.#textInput.focus();
    });

    // Text input events
    this.listen(this.#textInput, 'focus', () => this.#textInput.select());
    this.listen(this.#textInput, 'keydown', this.#handleTextKeydown);
    this.listen(this.#textInput, 'blur', this.#handleTextBlur);
  }

  #buildPanel() {
    this.#panelId = `tp-${Math.random().toString(36).slice(2, 8)}`;

    this.#panel = document.createElement('div');
    this.#panel.className = 'time-panel';
    this.#panel.id = this.#panelId;
    this.#panel.setAttribute('role', 'group');
    this.#panel.setAttribute('aria-label', 'Time spinners');

    // Link combobox to panel
    this.#textInput.setAttribute('aria-controls', this.#panelId);

    // Hours spinner
    const hourMin = this.#format === '12h' ? 1 : 0;
    const hourMax = this.#format === '12h' ? 12 : 23;
    const hourSpinner = this.#createSpinner('Hours', hourMin, hourMax, 1);
    this.#panel.appendChild(hourSpinner.el);
    this.#spinners.push(hourSpinner);

    // Separator
    this.#panel.appendChild(this.#createSep());

    // Minutes spinner
    const minuteStep = this.#step >= 60 ? Math.max(1, Math.round(this.#step / 60)) : 1;
    const minuteSpinner = this.#createSpinner('Minutes', 0, 59, minuteStep);
    this.#panel.appendChild(minuteSpinner.el);
    this.#spinners.push(minuteSpinner);

    // Seconds spinner (if step < 60)
    if (this.#showSeconds) {
      this.#panel.appendChild(this.#createSep());
      const secSpinner = this.#createSpinner('Seconds', 0, 59, this.#step);
      this.#panel.appendChild(secSpinner.el);
      this.#spinners.push(secSpinner);
    }

    // AM/PM toggle (12h only)
    if (this.#format === '12h') {
      this.#periodBtn = document.createElement('button');
      this.#periodBtn.type = 'button';
      this.#periodBtn.className = 'period-toggle';
      this.#periodBtn.setAttribute('aria-label', 'Toggle AM/PM');
      this.#periodBtn.textContent = this.#period;
      this.#panel.appendChild(this.#periodBtn);

      this.listen(this.#periodBtn, 'click', () => {
        this.#period = this.#period === 'AM' ? 'PM' : 'AM';
        this.#periodBtn.textContent = this.#period;
        this.#hours = this.#to24h(this.#displayHour(), this.#period);
        this.#commit();
      });

      this.listen(this.#periodBtn, 'keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.#focusSpinner(this.#spinners.length - 1);
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.#close();
          this.#textInput.focus();
        }
      });
    }

    this.appendChild(this.#panel);
  }

  #createSpinner(label, min, max, step) {
    const wrapper = document.createElement('div');
    wrapper.className = 'time-spinner';
    wrapper.setAttribute('role', 'spinbutton');
    wrapper.setAttribute('aria-label', label);
    wrapper.setAttribute('aria-valuemin', String(min));
    wrapper.setAttribute('aria-valuemax', String(max));
    wrapper.setAttribute('tabindex', '0');

    const incBtn = document.createElement('button');
    incBtn.type = 'button';
    incBtn.className = 'time-inc';
    incBtn.setAttribute('aria-hidden', 'true');
    incBtn.setAttribute('tabindex', '-1');
    incBtn.innerHTML = '&#x25B2;';

    const valueEl = document.createElement('span');
    valueEl.className = 'time-value';

    const decBtn = document.createElement('button');
    decBtn.type = 'button';
    decBtn.className = 'time-dec';
    decBtn.setAttribute('aria-hidden', 'true');
    decBtn.setAttribute('tabindex', '-1');
    decBtn.innerHTML = '&#x25BC;';

    wrapper.appendChild(incBtn);
    wrapper.appendChild(valueEl);
    wrapper.appendChild(decBtn);

    const spinner = { el: wrapper, valueEl, label, min, max, step };

    this.listen(incBtn, 'click', () => {
      this.#adjustSpinner(spinner, step);
    });

    this.listen(decBtn, 'click', () => {
      this.#adjustSpinner(spinner, -step);
    });

    this.listen(wrapper, 'keydown', (e) => {
      this.#handleSpinnerKey(e, spinner);
    });

    this.listen(wrapper, 'focus', () => {
      this.#focusedIndex = this.#spinners.indexOf(spinner);
    });

    return spinner;
  }

  #createSep() {
    const sep = document.createElement('span');
    sep.className = 'time-sep';
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = ':';
    return sep;
  }

  // --- Open / Close ---

  #open() {
    if (this.#isOpen) return;
    this.#isOpen = true;
    this.#panel.setAttribute('data-open', '');
    this.#textInput.setAttribute('aria-expanded', 'true');
  }

  #close() {
    if (!this.#isOpen) return;
    this.#isOpen = false;
    this.#panel.removeAttribute('data-open');
    this.#textInput.setAttribute('aria-expanded', 'false');
  }

  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(e.target)) {
      this.#close();
    }
  };

  // --- Text Input Handlers ---

  #handleTextKeydown = (e) => {
    switch (e.key) {
      case 'Enter': {
        e.preventDefault();
        e.stopPropagation();
        const parsed = parseUserTime(this.#textInput.value);
        if (parsed) {
          this.#hours = parsed.h;
          this.#minutes = parsed.m;
          this.#seconds = parsed.s;
          if (this.#format === '12h') {
            this.#period = this.#hours >= 12 ? 'PM' : 'AM';
          }
          this.#commit();
        }
        this.#updateTextInput();
        if (this.#isOpen) this.#close();
        return;
      }
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        if (!this.#isOpen) this.#open();
        requestAnimationFrame(() => this.#focusSpinner(0));
        return;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        if (this.#isOpen) this.#close();
        this.#updateTextInput();
        return;
      case 'Tab':
        if (this.#isOpen) this.#close();
        return;
    }
  };

  #handleTextBlur = (e) => {
    // If focus moved inside the component (icon button, panel), ignore
    if (e.relatedTarget && this.contains(e.relatedTarget)) return;

    // Try to parse and commit
    const text = this.#textInput.value.trim();
    if (text) {
      const parsed = parseUserTime(text);
      if (parsed) {
        this.#hours = parsed.h;
        this.#minutes = parsed.m;
        this.#seconds = parsed.s;
        if (this.#format === '12h') {
          this.#period = this.#hours >= 12 ? 'PM' : 'AM';
        }
        this.#syncFormValue();
        this.#validate();
        this.dispatchEvent(new CustomEvent('time-picker:change', {
          bubbles: true,
          detail: {
            value: formatTime(this.#hours, this.#minutes, this.#seconds, this.#showSeconds),
            hours: this.#hours,
            minutes: this.#minutes,
            seconds: this.#seconds,
          },
        }));
      }
    }

    // Revert display to current value
    this.#updateTextInput();
    if (this.#isOpen) this.#close();

    // Trigger form-field validation
    this.#input.dispatchEvent(new Event('blur', { bubbles: true }));
  };

  // --- Spinner Handlers ---

  #handleSpinnerKey = (e, spinner) => {
    const idx = this.#spinners.indexOf(spinner);

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.#adjustSpinner(spinner, spinner.step);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.#adjustSpinner(spinner, -spinner.step);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (idx < this.#spinners.length - 1) {
          this.#focusSpinner(idx + 1);
        } else if (this.#periodBtn) {
          this.#periodBtn.focus();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (idx > 0) {
          this.#focusSpinner(idx - 1);
        }
        break;
      case 'PageUp':
        e.preventDefault();
        this.#adjustSpinner(spinner, spinner.step * (spinner.label === 'Hours' ? 1 : 10));
        break;
      case 'PageDown':
        e.preventDefault();
        this.#adjustSpinner(spinner, -spinner.step * (spinner.label === 'Hours' ? 1 : 10));
        break;
      case 'Home':
        e.preventDefault();
        this.#setSpinnerValue(spinner, spinner.min);
        break;
      case 'End':
        e.preventDefault();
        this.#setSpinnerValue(spinner, spinner.max);
        break;
      case 'Escape':
        e.preventDefault();
        this.#close();
        this.#textInput.focus();
        break;
      default:
        // Direct number entry
        if (/^\d$/.test(e.key)) {
          e.preventDefault();
          this.#handleDigitEntry(e.key, spinner);
        }
    }
  };

  /** Buffer for direct number entry */
  #digitBuffer = '';
  #digitTimer = 0;

  #handleDigitEntry(digit, spinner) {
    clearTimeout(this.#digitTimer);
    this.#digitBuffer += digit;

    const val = Number(this.#digitBuffer);

    // If 2 digits or value already exceeds max with any next digit, commit
    if (this.#digitBuffer.length >= 2 || val * 10 > spinner.max) {
      const clamped = Math.min(Math.max(val, spinner.min), spinner.max);
      this.#setSpinnerValue(spinner, clamped);
      this.#digitBuffer = '';
    } else {
      // Wait for second digit
      this.#digitTimer = setTimeout(() => {
        const v = Number(this.#digitBuffer);
        const clamped = Math.min(Math.max(v, spinner.min), spinner.max);
        this.#setSpinnerValue(spinner, clamped);
        this.#digitBuffer = '';
      }, 800);
    }
  }

  #adjustSpinner(spinner, delta) {
    let current;
    if (spinner.label === 'Hours') {
      current = this.#format === '12h' ? this.#displayHour() : this.#hours;
    } else if (spinner.label === 'Minutes') {
      current = this.#minutes;
    } else {
      current = this.#seconds;
    }

    const next = wrapClamp(current + delta, spinner.min, spinner.max);
    this.#setSpinnerValue(spinner, next);
  }

  #setSpinnerValue(spinner, val) {
    if (spinner.label === 'Hours') {
      if (this.#format === '12h') {
        this.#hours = this.#to24h(val, this.#period);
      } else {
        this.#hours = val;
      }
    } else if (spinner.label === 'Minutes') {
      this.#minutes = val;
    } else {
      this.#seconds = val;
    }
    this.#commit();
  }

  #commit() {
    this.#updateDisplay();
    this.#updateTextInput();
    this.#syncFormValue();
    this.#validate();
    this.dispatchEvent(new CustomEvent('time-picker:change', {
      bubbles: true,
      detail: {
        value: formatTime(this.#hours, this.#minutes, this.#seconds, this.#showSeconds),
        hours: this.#hours,
        minutes: this.#minutes,
        seconds: this.#seconds,
      },
    }));
  }

  #updateDisplay() {
    const hourVal = this.#format === '12h' ? this.#displayHour() : this.#hours;

    this.#spinners[0].valueEl.textContent = pad(hourVal);
    this.#spinners[0].el.setAttribute('aria-valuenow', String(hourVal));
    this.#spinners[0].el.setAttribute('aria-valuetext',
      this.#format === '12h' ? `${hourVal} ${this.#period}` : String(hourVal));

    this.#spinners[1].valueEl.textContent = pad(this.#minutes);
    this.#spinners[1].el.setAttribute('aria-valuenow', String(this.#minutes));

    if (this.#showSeconds && this.#spinners[2]) {
      this.#spinners[2].valueEl.textContent = pad(this.#seconds);
      this.#spinners[2].el.setAttribute('aria-valuenow', String(this.#seconds));
    }

    if (this.#periodBtn) {
      this.#periodBtn.textContent = this.#period;
    }
  }

  #updateTextInput() {
    if (this.#hours !== undefined) {
      this.#textInput.value = formatDisplay(
        this.#hours, this.#minutes, this.#seconds,
        this.#showSeconds, this.#format,
      );
    }
  }

  #syncFormValue() {
    const val = formatTime(this.#hours, this.#minutes, this.#seconds, this.#showSeconds);
    this.#internals.setFormValue(val);
    // Keep native input in sync for form-field validation
    this.#input.value = val;
    this.#input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  #validate() {
    if (this.hasAttribute('required') || this.#input.hasAttribute('required')) {
      if (!this.#input.value) {
        this.#internals.setValidity(
          { valueMissing: true },
          'Please select a time',
          this.#textInput || this,
        );
        return;
      }
    }
    this.#internals.setValidity({});
  }

  /** Convert 12h display hour to 24h internal hour */
  #to24h(displayHour, period) {
    if (period === 'AM') {
      return displayHour === 12 ? 0 : displayHour;
    }
    return displayHour === 12 ? 12 : displayHour + 12;
  }

  /** Convert 24h internal hour to 12h display hour */
  #displayHour() {
    if (this.#format === '24h') return this.#hours;
    const h = this.#hours % 12;
    return h === 0 ? 12 : h;
  }

  #focusSpinner(index) {
    this.#spinners[index]?.el.focus();
  }

  formResetCallback() {
    const initial = parseTime(this.#initialValue);
    if (initial) {
      this.#hours = initial.h;
      this.#minutes = initial.m;
      this.#seconds = initial.s;
    } else {
      this.#hours = 0;
      this.#minutes = 0;
      this.#seconds = 0;
    }
    if (this.#format === '12h') {
      this.#period = this.#hours >= 12 ? 'PM' : 'AM';
    }
    this.#commit();
  }

  formStateRestoreCallback(state) {
    if (!state) return;
    const parsed = parseTime(state);
    if (parsed) {
      this.#hours = parsed.h;
      this.#minutes = parsed.m;
      this.#seconds = parsed.s;
      if (this.#format === '12h') {
        this.#period = this.#hours >= 12 ? 'PM' : 'AM';
      }
      this.#commit();
    }
  }

  get value() {
    return formatTime(this.#hours, this.#minutes, this.#seconds, this.#showSeconds);
  }

  set value(val) {
    const parsed = parseTime(val);
    if (!parsed) return;
    this.#hours = parsed.h;
    this.#minutes = parsed.m;
    this.#seconds = parsed.s;
    if (this.#format === '12h') {
      this.#period = this.#hours >= 12 ? 'PM' : 'AM';
    }
    this.#commit();
  }
}

registerComponent('time-picker', TimePicker);

export { TimePicker };
