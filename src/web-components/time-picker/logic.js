/**
 * time-picker: Form-associated time input with combobox text entry
 *
 * Progressive enhancement over <input type="time">.
 * Renders a text input (combobox) with clock icon and a spinbutton popup.
 * Users can type a time directly or use the spinbuttons.
 * Participates in native form submission via ElementInternals.
 *
 * @attr {string}  name                       - Form field name. A `name` on the inner input is moved here on upgrade so exactly one value is submitted.
 * @attr {string}  data-format                - "12h" or "24h" (default: from the nearest [lang]'s hour cycle)
 * @attr {boolean} disabled                   - Disables the picker (also follows a disabled <fieldset>). A `disabled` on the inner input is moved here on upgrade.
 * @attr {boolean} required                   - Makes a time required (a `required` on the inner input works too)
 * @attr {string}  data-label-input           - Accessible name for the text input when no <label> or aria-label exists (default "Time")
 * @attr {string}  data-label-placeholder     - Placeholder for the text input (default "Type a time…")
 * @attr {string}  data-label-toggle          - Accessible name for the clock button (default "Toggle time spinners")
 * @attr {string}  data-label-dialog          - Accessible name for the spinner popup (default "Choose time")
 * @attr {string}  data-label-hours           - Hours spinbutton name (default "Hours")
 * @attr {string}  data-label-minutes         - Minutes spinbutton name (default "Minutes")
 * @attr {string}  data-label-seconds         - Seconds spinbutton name (default "Seconds")
 * @attr {string}  data-label-period          - AM/PM button name prefix (default "AM/PM")
 * @attr {string}  data-label-empty           - Spinbutton value text while no time is set (default "Not set")
 * @attr {string}  data-label-required        - Validation message when required and empty (default "Please select a time")
 * @attr {string}  data-label-range-underflow - Message when before min; {time} = formatted min (default "Choose a time at or after {time}")
 * @attr {string}  data-label-range-overflow  - Message when after max; {time} = formatted max (default "Choose a time at or before {time}")
 * @attr {string}  data-label-step-mismatch   - Message when off-step; {lower}/{upper} = nearest valid times (default "Choose a valid time. The nearest are {lower} and {upper}")
 *
 * The wrapped <input type="time"> provides value (the reset default), min, max and step.
 *
 * Validity: the host owns it (valueMissing, rangeUnderflow, rangeOverflow,
 * stepMismatch) anchored on the text input. Typed values are kept as typed
 * and flagged; the spinbuttons snap to the step (counted from min) and stay
 * inside min..max. A min later than max is an overnight range (22:00–06:00).
 * The hidden native input is detached from the form and mirrors the host's
 * message via setCustomValidity so a wrapping <form-field> can read it.
 *
 * @example
 * <label for="meeting">Meeting</label>
 * <time-picker name="meeting" data-format="12h">
 *   <input type="time" id="meeting" min="09:00" max="17:00" step="900">
 * </time-picker>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const DAY = 86400;
let timePickerSeq = 0;

/** Pad a number to two digits */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Parse "HH:MM" or "HH:MM:SS" into seconds since midnight; null when empty
 * or malformed.
 * @param {string | null | undefined} str
 * @returns {number | null}
 */
function parseTime(str) {
  if (!str) return null;
  const m = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(String(str).trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  const s = Number(m[3] || 0);
  if (h > 23 || mi > 59 || s > 59) return null;
  return h * 3600 + mi * 60 + s;
}

/** Seconds since midnight → "HH:MM" or "HH:MM:SS" */
function formatTime(t, showSeconds) {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return showSeconds ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}`;
}

/** Positive modulo */
function mod(n, m) {
  return ((n % m) + m) % m;
}

/**
 * Hour cycle preferred by a locale.
 * @param {string} lang
 * @returns {'12h' | '24h'}
 */
function detectFormat(lang) {
  try {
    const { hourCycle } = new Intl.DateTimeFormat(lang || undefined, { hour: 'numeric' }).resolvedOptions();
    return hourCycle === 'h12' || hourCycle === 'h11' ? '12h' : '24h';
  } catch {
    return '24h';
  }
}

/**
 * Locale data for formatting and parsing: localised AM/PM strings and
 * whether the day period comes before the hour (ja, ko, zh).
 * @param {string} lang
 */
function localeInfo(lang) {
  const info = { am: 'AM', pm: 'PM', periodFirst: false };
  try {
    const fmt = new Intl.DateTimeFormat(lang || undefined, { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' });
    const amParts = fmt.formatToParts(new Date(2000, 0, 1, 9, 0));
    const pmParts = fmt.formatToParts(new Date(2000, 0, 1, 21, 0));
    const am = amParts.find(p => p.type === 'dayPeriod')?.value;
    const pm = pmParts.find(p => p.type === 'dayPeriod')?.value;
    if (am && pm) {
      info.am = am;
      info.pm = pm;
      const types = amParts.map(p => p.type);
      info.periodFirst = types.indexOf('dayPeriod') < types.indexOf('hour');
    }
  } catch { /* English fallback */ }
  return info;
}

/**
 * Parse user-typed text into seconds since midnight.
 * Supports "2:30 PM", "2:30pm", "14:30", "2pm", "14", "2:30:15 pm",
 * "14.30" and the locale's own day-period words before or after the time
 * ("午後2:30").
 * @param {string} text
 * @param {{ am: string, pm: string }} periods
 * @returns {number | null}
 */
function parseUserTime(text, periods) {
  let t = text.trim().toLowerCase();
  if (!t) return null;

  /** @type {'AM' | 'PM' | null} */
  let period = null;
  const words = [
    [periods.am.toLowerCase(), 'AM'], [periods.pm.toLowerCase(), 'PM'],
    ['a.m.', 'AM'], ['p.m.', 'PM'], ['am', 'AM'], ['pm', 'PM'], ['a', 'AM'], ['p', 'PM'],
  ].sort((x, y) => y[0].length - x[0].length);
  for (const [word, p] of words) {
    if (!word) continue;
    if (t.endsWith(word)) { period = /** @type {'AM'|'PM'} */ (p); t = t.slice(0, -word.length).trim(); break; }
    if (t.startsWith(word)) { period = /** @type {'AM'|'PM'} */ (p); t = t.slice(word.length).trim(); break; }
  }

  if (!/^\d{1,2}(?:[:.]\d{1,2}){0,2}$/.test(t)) return null;
  const parts = t.split(/[:.]/).map(Number);
  let h = parts[0];
  const m = parts[1] ?? 0;
  const s = parts[2] ?? 0;
  if (m > 59 || s > 59) return null;

  if (period) {
    if (h < 1 || h > 12) return null;
    if (period === 'AM') h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
  } else if (h > 23) {
    return null;
  }
  return h * 3600 + m * 60 + s;
}

/**
 * @typedef {{ unit: 'hour' | 'minute' | 'second', el: HTMLElement, valueEl: HTMLElement,
 *   incBtn: HTMLButtonElement, decBtn: HTMLButtonElement, min: number, max: number,
 *   delta: number, readOnly: boolean }} Spinner
 */

class TimePicker extends VBElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['disabled', 'required'];
  }

  #internals;
  #uid = `tp${++timePickerSeq}`;
  #built = false;
  /** @type {HTMLInputElement} */
  #input;
  /** @type {HTMLInputElement} */
  #textInput;
  /** @type {HTMLElement} */
  #trigger;
  /** @type {HTMLButtonElement} */
  #iconBtn;
  /** @type {HTMLElement} */
  #panel;
  /** @type {Spinner[]} */
  #spinners = [];
  /** @type {HTMLButtonElement | null} */
  #periodBtn = null;
  /** Focusable panel segments in DOM order (spinners + period button). @type {HTMLElement[]} */
  #segments = [];
  /** @type {'12h' | '24h'} */
  #format = '24h';
  #lang = '';
  #locale = { am: 'AM', pm: 'PM', periodFirst: false };
  #showSeconds = false;
  /** Current value in seconds since midnight; null = no time set. @type {number | null} */
  #time = null;
  /** @type {number | null} */
  #min = null;
  /** @type {number | null} */
  #max = null;
  /** Step in seconds; null for step="any". @type {number | null} */
  #step = 60;
  /** Form-reset target: the inner input's value ATTRIBUTE, captured once. @type {string | undefined} */
  #initialValue;
  /** Value assigned through the API before the first upgrade. @type {string | undefined} */
  #pendingValue;
  #isOpen = false;
  #mirroredMessage = '';
  #touched = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    const input = /** @type {HTMLInputElement | null} */ (this.querySelector(':scope > input[type="time"]'));
    if (!input) return false;
    this.#input = input;

    this.#lang = /** @type {HTMLElement | null} */ (this.closest('[lang]'))?.lang || navigator.language || 'en-US';
    this.#locale = localeInfo(this.#lang);
    const fmt = this.getAttribute('data-format');
    this.#format = fmt === '12h' || fmt === '24h' ? fmt : detectFormat(this.#lang);

    this.#readConstraints();

    // PE submission path: without JS the inner input submits under its own
    // name. Once upgraded the host submits, so move name/disabled/form to it.
    const innerName = input.getAttribute('name');
    if (innerName) {
      if (!this.hasAttribute('name')) this.setAttribute('name', innerName);
      input.removeAttribute('name');
    }
    if (input.hasAttribute('disabled')) {
      input.removeAttribute('disabled');
      if (!this.hasAttribute('disabled')) this.setAttribute('disabled', '');
    }
    const detachedId = `${this.#uid}-no-form`;
    const innerForm = input.getAttribute('form');
    if (innerForm && innerForm !== detachedId && !this.hasAttribute('form')) {
      this.setAttribute('form', innerForm);
    }
    input.setAttribute('form', detachedId);

    if (this.#initialValue === undefined) this.#initialValue = input.defaultValue;
    if (this.#pendingValue !== undefined) {
      input.value = this.#pendingValue;
      this.#pendingValue = undefined;
    }
    // The inner input's live .value carries state across a move/reconnect.
    this.#time = parseTime(input.value);

    // Hide the native input; a <label for> click/focus goes to the combobox.
    input.setAttribute('tabindex', '-1');
    input.setAttribute('aria-hidden', 'true');
    input.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;';
    this.listen(input, 'click', this.#handleInputClick);
    this.listen(input, 'focus', this.#focusTextInput);

    this.#buildTrigger();
    this.#buildPanel();
    this.#built = true;
    this.#applyAccessibleName();
    this.#render();
    this.#syncFormValue(false);
    this.#validate();

    this.listen(document, 'click', this.#handleOutsideClick);
    this.listen(this, 'focusout', this.#handleFocusOut);
    this.listen(this, 'invalid', this.#notifyFieldValidate);

    this.#applyDisabled(this.matches(':disabled'));
    return true;
  }

  teardown() {
    // Built UI is removed so the next setup() (move/reconnect) rebuilds
    // exactly one trigger + panel with fresh listeners.
    this.#isOpen = false;
    this.#trigger?.remove();
    this.#panel?.remove();
    this.#spinners = [];
    this.#segments = [];
    this.#periodBtn = null;
    this.#built = false;
    clearTimeout(this.#digitTimer);
    this.#digitBuffer = '';
  }

  attributeChangedCallback(name) {
    if (!this.#built) return;
    if (name === 'disabled') this.#applyDisabled(this.matches(':disabled'));
    if (name === 'required') this.#validate();
  }

  formDisabledCallback(disabled) {
    if (this.#built) this.#applyDisabled(disabled);
  }

  /** @param {boolean} disabled */
  #applyDisabled(disabled) {
    this.#textInput.disabled = disabled;
    this.#iconBtn.disabled = disabled;
    if (disabled) this.#close();
  }

  #readConstraints() {
    const stepAttr = this.#input.getAttribute('step');
    if (stepAttr && stepAttr.trim().toLowerCase() === 'any') {
      this.#step = null;
    } else {
      const n = Number(stepAttr);
      this.#step = Number.isFinite(n) && n > 0 ? Math.max(1, Math.round(n)) : 60;
    }
    this.#min = parseTime(this.#input.getAttribute('min'));
    this.#max = parseTime(this.#input.getAttribute('max'));
    const value = parseTime(this.#input.value);
    this.#showSeconds = (this.#step !== null && this.#step % 60 !== 0)
      || (value !== null && value % 60 !== 0);
  }

  /**
   * Author-overridable UI string from a data-label-* attribute.
   * @param {string} key  dataset key suffix, e.g. 'Toggle' for data-label-toggle
   * @param {string} fallback
   */
  #label(key, fallback) {
    return this.dataset[`label${key}`] || fallback;
  }

  #focusTextInput = () => {
    if (this.#built && !this.#textInput.disabled) this.#textInput.focus();
  };

  /** @param {Event} e */
  #handleInputClick = (e) => {
    e.preventDefault();
    this.#focusTextInput();
  };

  /**
   * The native input is aria-hidden after upgrade, so its <label for> would
   * name nothing. Forward its labels (and host labels) to the combobox via
   * aria-labelledby; else fall back to an authored aria-label(ledby).
   */
  #applyAccessibleName() {
    const labels = new Set(/** @type {HTMLElement[]} */ ([
      ...Array.from(this.#input.labels || []),
      ...Array.from(this.#internals.labels || []),
    ]));
    const ids = [];
    for (const label of labels) {
      if (!label.id) label.id = `${this.#uid}-label-${ids.length}`;
      ids.push(label.id);
      this.listen(label, 'click', this.#focusTextInput);
    }
    const ti = this.#textInput;
    const labelledBy = ids.join(' ')
      || this.#input.getAttribute('aria-labelledby')
      || this.getAttribute('aria-labelledby');
    if (labelledBy) {
      ti.setAttribute('aria-labelledby', labelledBy);
    } else {
      ti.setAttribute('aria-label', this.#input.getAttribute('aria-label')
        || this.getAttribute('aria-label') || this.#label('Input', 'Time'));
    }
    const describedBy = this.#input.getAttribute('aria-describedby');
    if (describedBy) ti.setAttribute('aria-describedby', describedBy);
  }

  #buildTrigger() {
    this.#trigger = document.createElement('div');
    this.#trigger.className = 'time-trigger';

    const ti = document.createElement('input');
    ti.type = 'text';
    ti.className = 'time-input';
    ti.setAttribute('role', 'combobox');
    ti.setAttribute('aria-haspopup', 'dialog');
    ti.setAttribute('aria-expanded', 'false');
    ti.setAttribute('autocomplete', 'off');
    ti.setAttribute('placeholder', this.#label('Placeholder', 'Type a time…'));
    this.#textInput = ti;
    this.#trigger.appendChild(ti);

    this.#iconBtn = document.createElement('button');
    this.#iconBtn.type = 'button';
    this.#iconBtn.className = 'time-trigger-icon';
    this.#iconBtn.setAttribute('aria-label', this.#label('Toggle', 'Toggle time spinners'));
    this.#iconBtn.setAttribute('tabindex', '-1');
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'clock');
    icon.setAttribute('size', 'sm');
    icon.setAttribute('aria-hidden', 'true');
    this.#iconBtn.appendChild(icon);
    this.#trigger.appendChild(this.#iconBtn);

    this.appendChild(this.#trigger);

    this.listen(this.#iconBtn, 'click', (e) => {
      e.stopPropagation();
      this.#isOpen ? this.#close() : this.#open();
      this.#textInput.focus();
    });
    this.listen(ti, 'focus', () => ti.select());
    this.listen(ti, 'keydown', this.#handleTextKeydown);
    this.listen(ti, 'blur', this.#handleTextBlur);
  }

  #buildPanel() {
    const panelId = `${this.#uid}-panel`;
    this.#panel = document.createElement('div');
    this.#panel.className = 'time-panel';
    this.#panel.id = panelId;
    this.#panel.setAttribute('role', 'dialog');
    this.#panel.setAttribute('aria-modal', 'false');
    this.#panel.setAttribute('aria-label', this.#label('Dialog', 'Choose time'));
    this.#textInput.setAttribute('aria-controls', panelId);

    const step = this.#step ?? 60;
    const hourDelta = step >= 3600 && step % 3600 === 0 ? step / 3600 : 1;
    const minuteDelta = step >= 60 && step < 3600 && step % 60 === 0 ? step / 60 : 1;
    const secondDelta = step < 60 ? step : 1;
    const minutesReadOnly = step >= 3600 && step % 3600 === 0;

    const twelve = this.#format === '12h';
    /** @type {HTMLButtonElement | null} */
    let periodBtn = null;
    if (twelve) {
      periodBtn = document.createElement('button');
      periodBtn.type = 'button';
      periodBtn.className = 'period-toggle';
    }
    this.#periodBtn = periodBtn;
    if (periodBtn && this.#locale.periodFirst) this.#panel.appendChild(periodBtn);

    // 24h hours advertise the min..max hours (spinning is clamped to the
    // range anyway); an overnight range keeps the full day.
    const ranged = !twelve && this.#min !== null && this.#max !== null && this.#min <= this.#max;
    this.#spinners = [];
    this.#spinners.push(this.#createSpinner('hour', this.#label('Hours', 'Hours'),
      twelve ? 1 : (ranged ? Math.floor(/** @type {number} */ (this.#min) / 3600) : 0),
      twelve ? 12 : (ranged ? Math.floor(/** @type {number} */ (this.#max) / 3600) : 23),
      hourDelta, false));
    this.#panel.appendChild(this.#createSep());
    this.#spinners.push(this.#createSpinner('minute', this.#label('Minutes', 'Minutes'),
      0, 59, minuteDelta, minutesReadOnly));
    if (this.#showSeconds) {
      this.#panel.appendChild(this.#createSep());
      this.#spinners.push(this.#createSpinner('second', this.#label('Seconds', 'Seconds'),
        0, 59, secondDelta, false));
    }

    if (periodBtn && !this.#locale.periodFirst) this.#panel.appendChild(periodBtn);
    this.#segments = /** @type {HTMLElement[]} */ ([...this.#panel.querySelectorAll('.time-spinner, .period-toggle')]);

    this.appendChild(this.#panel);

    for (const spinner of this.#spinners) {
      this.listen(spinner.incBtn, 'click', () => this.#adjust(spinner, spinner.delta, 'pointer'));
      this.listen(spinner.decBtn, 'click', () => this.#adjust(spinner, -spinner.delta, 'pointer'));
      this.listen(spinner.el, 'keydown', (e) => this.#handleSpinnerKey(/** @type {KeyboardEvent} */ (e), spinner));
    }
    if (this.#periodBtn) {
      const btn = this.#periodBtn;
      this.listen(btn, 'click', (e) => {
        this.#togglePeriod(/** @type {MouseEvent} */ (e).detail === 0 ? 'keyboard' : 'pointer');
      });
      this.listen(btn, 'keydown', (e) => this.#handleSegmentNav(/** @type {KeyboardEvent} */ (e), btn));
    }
  }

  /**
   * @param {'hour' | 'minute' | 'second'} unit
   * @param {string} label
   * @param {number} min
   * @param {number} max
   * @param {number} delta
   * @param {boolean} readOnly
   * @returns {Spinner}
   */
  #createSpinner(unit, label, min, max, delta, readOnly) {
    const el = document.createElement('div');
    el.className = 'time-spinner';
    el.dataset.unit = unit;
    el.setAttribute('role', 'spinbutton');
    el.setAttribute('aria-label', label);
    el.setAttribute('aria-valuemin', String(min));
    el.setAttribute('aria-valuemax', String(max));
    if (readOnly) el.setAttribute('aria-readonly', 'true');
    el.setAttribute('tabindex', '0');

    const incBtn = document.createElement('button');
    incBtn.type = 'button';
    incBtn.className = 'time-inc';
    incBtn.setAttribute('aria-hidden', 'true');
    incBtn.setAttribute('tabindex', '-1');
    incBtn.textContent = '▲';
    if (readOnly) incBtn.disabled = true;

    const valueEl = document.createElement('span');
    valueEl.className = 'time-value';

    const decBtn = document.createElement('button');
    decBtn.type = 'button';
    decBtn.className = 'time-dec';
    decBtn.setAttribute('aria-hidden', 'true');
    decBtn.setAttribute('tabindex', '-1');
    decBtn.textContent = '▼';
    if (readOnly) decBtn.disabled = true;

    el.append(incBtn, valueEl, decBtn);
    this.#panel.appendChild(el);
    return { unit, el, valueEl, incBtn, decBtn, min, max, delta, readOnly };
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
    if (this.#isOpen || this.#textInput.disabled) return;
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

  /** @param {Event} e */
  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(/** @type {Node} */ (e.target))) this.#close();
  };

  /** Focus left the component (Tab out of a spinner, etc.): close. */
  /** @param {FocusEvent} e */
  #handleFocusOut = (e) => {
    const next = e.relatedTarget;
    if (next instanceof Node && this.contains(next)) return;
    this.#close();
  };

  // --- Formatting ---

  /**
   * Localised display text, e.g. "2:30 PM", "14:30", "午後2:30".
   * @param {number} t seconds since midnight
   */
  #formatDisplay(t) {
    try {
      const d = new Date(2000, 0, 1, Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60);
      /** @type {Intl.DateTimeFormatOptions} */
      const opts = {
        hour: this.#format === '12h' ? 'numeric' : '2-digit',
        minute: '2-digit',
        hourCycle: this.#format === '12h' ? 'h12' : 'h23',
      };
      if (this.#showSeconds) opts.second = '2-digit';
      return new Intl.DateTimeFormat(this.#lang, opts).format(d);
    } catch {
      return formatTime(t, this.#showSeconds);
    }
  }

  // --- Text Input Handlers ---

  /** @param {KeyboardEvent} e */
  #handleTextKeydown = (e) => {
    switch (e.key) {
      case 'Enter': {
        e.preventDefault();
        e.stopPropagation();
        this.#commitText();
        if (this.#isOpen) this.#close();
        return;
      }
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        if (!this.#isOpen) this.#open();
        this.#segments[0]?.focus();
        return;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        if (this.#isOpen) this.#close();
        this.#render();
        return;
    }
  };

  /** Commit the typed text: empty clears, parseable sets, anything else reverts. */
  #commitText() {
    const text = this.#textInput.value.trim();
    if (!text) {
      this.#commit(null, 'keyboard');
    } else {
      const t = parseUserTime(text, this.#locale);
      if (t !== null) this.#commit(t, 'keyboard');
    }
    this.#render();
  }

  /** @param {FocusEvent} e */
  #handleTextBlur = (e) => {
    if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
    this.#commitText();
    this.#notifyFieldValidate();
  };

  /** Ask a wrapping <form-field> (which listens on the inner input) to validate. */
  #notifyFieldValidate = () => {
    if (!this.#built) return;
    if (!this.#touched) {
      this.#touched = true;
      this.#validate();
    }
    this.#input.dispatchEvent(new Event('blur', { bubbles: true }));
  };

  // --- Spinner Handlers ---

  /**
   * Arrow-key movement between panel segments, in visual order.
   * @param {KeyboardEvent} e
   * @param {HTMLElement} from
   * @returns {boolean} handled
   */
  #handleSegmentNav(e, from) {
    const idx = this.#segments.indexOf(from);
    const rtl = getComputedStyle(this).direction === 'rtl';
    const fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === fwd || e.key === back) {
      e.preventDefault();
      this.#segments[idx + (e.key === fwd ? 1 : -1)]?.focus();
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.#close();
      this.#textInput.focus();
      return true;
    }
    return false;
  }

  /**
   * @param {KeyboardEvent} e
   * @param {Spinner} spinner
   */
  #handleSpinnerKey(e, spinner) {
    if (this.#handleSegmentNav(e, spinner.el)) return;
    const page = spinner.unit === 'hour' ? spinner.delta : spinner.delta * 10;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); this.#adjust(spinner, spinner.delta, 'keyboard'); break;
      case 'ArrowDown': e.preventDefault(); this.#adjust(spinner, -spinner.delta, 'keyboard'); break;
      case 'PageUp': e.preventDefault(); this.#adjust(spinner, page, 'keyboard'); break;
      case 'PageDown': e.preventDefault(); this.#adjust(spinner, -page, 'keyboard'); break;
      case 'Home': e.preventDefault(); this.#setUnit(spinner, spinner.min, 1, 'keyboard'); break;
      case 'End': e.preventDefault(); this.#setUnit(spinner, spinner.max, -1, 'keyboard'); break;
      default:
        if (/^\d$/.test(e.key)) {
          e.preventDefault();
          this.#handleDigitEntry(e.key, spinner);
        }
    }
  }

  /** Buffer for direct number entry */
  #digitBuffer = '';
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #digitTimer;

  /**
   * @param {string} digit
   * @param {Spinner} spinner
   */
  #handleDigitEntry(digit, spinner) {
    clearTimeout(this.#digitTimer);
    this.#digitBuffer += digit;
    const flush = () => {
      const v = Math.min(Math.max(Number(this.#digitBuffer), spinner.min), spinner.max);
      this.#digitBuffer = '';
      this.#setUnit(spinner, v, 0, 'keyboard');
    };
    if (this.#digitBuffer.length >= 2 || Number(this.#digitBuffer) * 10 > spinner.max) flush();
    else this.#digitTimer = setTimeout(flush, 800);
  }

  /** Where spinning starts from when no time is set: min, else midnight. */
  #baseTime() {
    return this.#snap(this.#min ?? 0, 1);
  }

  /**
   * Snap to the step grid (counted from min) and keep inside min..max.
   * @param {number} t
   * @param {number} dir  >0 rounds down, <0 rounds up, 0 nearest
   */
  #snap(t, dir) {
    let v = mod(t, DAY);
    const step = this.#step;
    if (step) {
      const base = this.#min ?? 0;
      const k = (v - base) / step;
      const n = dir > 0 ? Math.floor(k) : dir < 0 ? Math.ceil(k) : Math.round(k);
      v = mod(base + n * step, DAY);
    }
    const min = this.#min;
    const max = this.#max;
    if (min !== null && max !== null && min <= max) {
      if (v < min) v = min;
      if (v > max) v = step ? min + Math.floor((max - min) / step) * step : max;
    } else if (min !== null && max === null && v < min) {
      v = min;
    } else if (max !== null && min === null && v > max) {
      v = step ? Math.floor(max / step) * step : max;
    }
    return v;
  }

  /**
   * @param {Spinner} spinner
   * @param {number} delta
   * @param {'pointer' | 'keyboard'} source
   */
  #adjust(spinner, delta, source) {
    if (spinner.readOnly) return;
    if (this.#time === null) {
      this.#commit(this.#baseTime(), source);
      return;
    }
    const t = this.#time;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    let next;
    if (spinner.unit === 'hour') {
      const nh = this.#format === '12h'
        ? mod((h % 12) + delta, 12) + (h >= 12 ? 12 : 0)
        : mod(h + delta, 24);
      next = nh * 3600 + m * 60 + s;
    } else if (spinner.unit === 'minute') {
      next = h * 3600 + mod(m + delta, 60) * 60 + s;
    } else {
      next = h * 3600 + m * 60 + mod(s + delta, 60);
    }
    this.#commit(this.#snap(next, delta), source);
  }

  /**
   * Set one unit to a display value (Home/End/digits).
   * @param {Spinner} spinner
   * @param {number} val   display value (1–12 for 12h hours)
   * @param {number} dir   snap direction
   * @param {'keyboard'} source
   */
  #setUnit(spinner, val, dir, source) {
    if (spinner.readOnly) return;
    const t = this.#time ?? this.#baseTime();
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    let next;
    if (spinner.unit === 'hour') {
      const nh = this.#format === '12h' ? (val % 12) + (h >= 12 ? 12 : 0) : val;
      next = nh * 3600 + m * 60 + s;
    } else if (spinner.unit === 'minute') {
      next = h * 3600 + val * 60 + s;
    } else {
      next = h * 3600 + m * 60 + val;
    }
    this.#commit(this.#snap(next, dir), source);
  }

  /** @param {'pointer' | 'keyboard'} source */
  #togglePeriod(source) {
    const t = this.#time ?? this.#baseTime();
    this.#commit(this.#snap(mod(t + 12 * 3600, DAY), 0), source);
  }

  // --- State ---

  /**
   * Set (or clear) the time. Renders, syncs the form value and validity,
   * and fires time-picker:change only when the value changed.
   * @param {number | null} t
   * @param {'api' | 'pointer' | 'keyboard'} source
   * @returns {boolean} whether the value changed
   */
  #commit(t, source) {
    const prev = this.value;
    this.#time = t;
    if (t !== null && t % 60 !== 0 && !this.#showSeconds) this.#showSeconds = true;
    this.#render();
    if (this.value === prev) return false;
    this.#syncFormValue();
    this.#validate();
    this.dispatchEvent(new CustomEvent('time-picker:change', {
      bubbles: true,
      detail: { ...this.#detail(), source },
    }));
    return true;
  }

  #detail() {
    const t = this.#time;
    return t === null
      ? { value: '', hours: null, minutes: null, seconds: null }
      : { value: this.value, hours: Math.floor(t / 3600), minutes: Math.floor((t % 3600) / 60), seconds: t % 60 };
  }

  #render() {
    if (!this.#built) return;
    const t = this.#time;
    this.#textInput.value = t === null ? '' : this.#formatDisplay(t);
    const empty = this.#label('Empty', 'Not set');
    const h = t === null ? null : Math.floor(t / 3600);
    const units = {
      hour: h === null ? null : (this.#format === '12h' ? (h % 12 || 12) : h),
      minute: t === null ? null : Math.floor((t % 3600) / 60),
      second: t === null ? null : t % 60,
    };
    const period = h === null ? '' : (h >= 12 ? this.#locale.pm : this.#locale.am);
    for (const sp of this.#spinners) {
      const v = units[sp.unit];
      sp.valueEl.textContent = v === null ? '--' : pad(v);
      if (v === null) {
        sp.el.removeAttribute('aria-valuenow');
        sp.el.setAttribute('aria-valuetext', empty);
        continue;
      }
      sp.el.setAttribute('aria-valuenow', String(v));
      let text;
      try {
        text = sp.unit === 'hour' && this.#format === '12h'
          // "2 PM" / "午後2時": the localised hour with its day period
          ? new Intl.DateTimeFormat(this.#lang, { hour: 'numeric', hourCycle: 'h12' })
            .format(new Date(2000, 0, 1, /** @type {number} */ (h)))
          : new Intl.NumberFormat(this.#lang, { style: 'unit', unit: sp.unit, unitDisplay: 'long' }).format(v);
      } catch {
        text = sp.unit === 'hour' && period ? `${v} ${period}` : String(v);
      }
      sp.el.setAttribute('aria-valuetext', text);
    }
    if (this.#periodBtn) {
      this.#periodBtn.textContent = period || '--';
      this.#periodBtn.setAttribute('aria-label', `${this.#label('Period', 'AM/PM')}: ${period || empty}`);
    }
  }

  // --- Form integration ---

  /** @param {boolean} [notify=true] dispatch `input` on the inner input (form-field listens) */
  #syncFormValue(notify = true) {
    const val = this.value;
    this.#internals.setFormValue(val || null);
    this.#input.value = val;
    if (notify) this.#input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * @param {string} key  data-message-* suffix on the inner input
   * @param {string} labelKey
   * @param {string} fallback
   * @param {Record<string, string>} [vars]
   */
  #message(key, labelKey, fallback, vars = {}) {
    let msg = this.#input.getAttribute(`data-message-${key.toLowerCase()}`) ?? this.#label(labelKey, fallback);
    for (const [k, v] of Object.entries(vars)) msg = msg.replaceAll(`{${k}}`, v);
    return msg;
  }

  /**
   * Recompute validity on the host and mirror it onto the inner input.
   * @returns {boolean} whether the validity message changed
   */
  #validate() {
    if (!this.#built) return false;
    const required = this.hasAttribute('required') || this.#input.hasAttribute('required');
    if (required) this.#textInput.setAttribute('aria-required', 'true');
    else this.#textInput.removeAttribute('aria-required');

    const t = this.#time;
    const min = this.#min;
    const max = this.#max;
    /** @type {ValidityStateFlags} */
    let flags = {};
    let message = '';
    if (t === null) {
      if (required) {
        flags = { valueMissing: true };
        message = this.#message('valueMissing', 'Required', 'Please select a time');
      }
    } else {
      const reversed = min !== null && max !== null && min > max;
      const under = min !== null && t < min;
      const over = max !== null && t > max;
      if (reversed ? (under && over) : under) {
        flags = reversed ? { rangeUnderflow: true, rangeOverflow: true } : { rangeUnderflow: true };
        message = this.#message('rangeUnderflow', 'RangeUnderflow', 'Choose a time at or after {time}',
          { time: this.#formatDisplay(/** @type {number} */ (min)) });
      } else if (!reversed && over) {
        flags = { rangeOverflow: true };
        message = this.#message('rangeOverflow', 'RangeOverflow', 'Choose a time at or before {time}',
          { time: this.#formatDisplay(/** @type {number} */ (max)) });
      } else if (this.#step && mod(t - (min ?? 0), this.#step) !== 0) {
        const lower = this.#snap(t, 1);
        const upper = mod(lower + this.#step, DAY);
        flags = { stepMismatch: true };
        message = this.#message('stepMismatch', 'StepMismatch', 'Choose a valid time. The nearest are {lower} and {upper}',
          { lower: this.#formatDisplay(lower), upper: this.#formatDisplay(upper) });
      }
    }

    const before = this.#internals.validationMessage;
    if (message) this.#internals.setValidity(flags, message, this.#textInput);
    else this.#internals.setValidity({});
    if (message && (t !== null || this.#touched)) this.#textInput.setAttribute('aria-invalid', 'true');
    else this.#textInput.removeAttribute('aria-invalid');

    // Mirror for <form-field>; leave a foreign custom error alone.
    const own = this.#input.validationMessage === this.#mirroredMessage || !this.#input.validity.customError;
    if (own) {
      this.#input.setCustomValidity(message);
      this.#mirroredMessage = message;
    }
    return before !== message;
  }

  /** Restore without firing time-picker:change (resets are not user edits). */
  /** @param {number | null} t */
  #setSilently(t) {
    this.#time = t;
    this.#render();
    this.#syncFormValue();
    this.#validate();
  }

  formResetCallback() {
    if (!this.#built) return;
    this.#touched = false;
    this.#setSilently(parseTime(this.#initialValue));
  }

  formStateRestoreCallback(state) {
    if (!this.#built || typeof state !== 'string') return;
    this.#setSilently(parseTime(state));
  }

  get form() { return this.#internals.form; }
  get validity() { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }
  get willValidate() { return this.#internals.willValidate; }
  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }

  /**
   * "HH:MM" (or "HH:MM:SS" when seconds are shown); '' when no time is set.
   * @returns {string}
   */
  get value() {
    if (!this.#built) return this.#pendingValue ?? '';
    return this.#time === null ? '' : formatTime(this.#time, this.#showSeconds);
  }

  /** "HH:MM[:SS]"; '' or null clears. Malformed values are ignored. */
  set value(val) {
    const str = val == null ? '' : String(val).trim();
    const t = str ? parseTime(str) : null;
    if (str && t === null) return;
    if (!this.#built) {
      this.#pendingValue = str;
      return;
    }
    this.#commit(t, 'api');
  }
}

registerComponent('time-picker', TimePicker);

export { TimePicker };
