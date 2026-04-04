/**
 * date-picker: Form-associated calendar date picker with combobox text entry
 *
 * Progressive enhancement over <input type="date">.
 * Renders a text input (combobox) with calendar icon and calendar popup.
 * Users can type a date directly or pick from the calendar grid.
 * Participates in native form submission via ElementInternals.
 *
 * @attr {string}  name              - Form field name
 * @attr {boolean} disabled          - Disables the picker
 * @attr {boolean} required          - Makes selection required
 * @attr {string}  data-disabled-dates  - Comma-separated ISO dates to disable (optionally with reason: "2026-04-05:booked")
 * @attr {string}  data-highlight-dates - Comma-separated ISO dates to highlight (optionally with category: "2026-12-25:holiday")
 *
 * The wrapped <input type="date"> provides min, max, and value.
 *
 * @example
 * <date-picker name="dob">
 *   <input type="date" min="1920-01-01" max="2025-12-31">
 * </date-picker>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { supportsPopover } from '../../utils/popover-support.js';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAYS_ABBR = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EN_MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/** Format a Date to ISO date string YYYY-MM-DD */
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse ISO date string to Date (local) */
function fromISO(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Get number of days in a month */
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/** Get the first day of week for a locale (0=Sun, 1=Mon, etc.) */
function getFirstDayOfWeek() {
  try {
    const locale = new Intl.Locale(navigator.language);
    if (locale.weekInfo) return locale.weekInfo.firstDay % 7;
  } catch { /* fallback */ }
  return 0; // Sunday
}

/** Format a date for display using Intl */
function formatDisplay(date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(date);
  } catch {
    return toISO(date);
  }
}

/** Check if two dates are the same calendar day */
function sameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/**
 * Build a month-name → index map for the current locale + English fallback.
 * Keys are lowercase, values are 0-based month indices.
 */
function buildMonthMap() {
  const map = new Map();
  // Always include English
  EN_MONTHS.forEach((name, i) => {
    map.set(name, i);
    map.set(name.slice(0, 3), i); // "jan", "feb", etc.
  });
  // Add locale-specific names
  try {
    for (let m = 0; m < 12; m++) {
      const long = new Intl.DateTimeFormat(undefined, { month: 'long' })
        .format(new Date(2000, m, 1)).toLowerCase();
      const short = new Intl.DateTimeFormat(undefined, { month: 'short' })
        .format(new Date(2000, m, 1)).toLowerCase().replace('.', '');
      map.set(long, m);
      map.set(short, m);
    }
  } catch { /* use English only */ }
  return map;
}

const MONTH_MAP = buildMonthMap();

/**
 * Parse user-typed text into a date or partial date.
 * @param {string} text - User input
 * @returns {{ date: Date|null, partial: { year: number, month: number }|null }}
 */
function parseUserDate(text) {
  const t = text.trim();
  if (!t) return { date: null, partial: null };

  // 1. ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = fromISO(t);
    return d && !isNaN(d.getTime()) ? { date: d, partial: null } : { date: null, partial: null };
  }

  // 2. ISO with slashes: YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(t)) {
    const d = fromISO(t.replace(/\//g, '-'));
    return d && !isNaN(d.getTime()) ? { date: d, partial: null } : { date: null, partial: null };
  }

  // 3. Month-name formats: "Apr 15 2026", "April 15, 2026", "15 Apr 2026"
  // Pattern A: Month Day Year
  const patA = /^([a-z\u00C0-\u024F]+)\s+(\d{1,2}),?\s+(\d{4})$/i;
  let m = t.match(patA);
  if (m) {
    const monthIdx = MONTH_MAP.get(m[1].toLowerCase());
    if (monthIdx !== undefined) {
      const d = new Date(Number(m[3]), monthIdx, Number(m[2]));
      if (!isNaN(d.getTime())) return { date: d, partial: null };
    }
  }

  // Pattern B: Day Month Year
  const patB = /^(\d{1,2})\s+([a-z\u00C0-\u024F]+)\s+(\d{4})$/i;
  m = t.match(patB);
  if (m) {
    const monthIdx = MONTH_MAP.get(m[2].toLowerCase());
    if (monthIdx !== undefined) {
      const d = new Date(Number(m[3]), monthIdx, Number(m[1]));
      if (!isNaN(d.getTime())) return { date: d, partial: null };
    }
  }

  // 4. Partial: "April 2026", "Apr 2026"
  const patPartial = /^([a-z\u00C0-\u024F]+)\s+(\d{4})$/i;
  m = t.match(patPartial);
  if (m) {
    const monthIdx = MONTH_MAP.get(m[1].toLowerCase());
    if (monthIdx !== undefined) {
      return { date: null, partial: { year: Number(m[2]), month: monthIdx } };
    }
  }

  return { date: null, partial: null };
}


class DatePicker extends VBElement {
  static formAssociated = true;

  #internals;
  #input;
  #textInput;
  #iconBtn;
  #triggerContainer;
  #calendar;
  #calendarId;
  #grid;
  #monthLabel;
  #yearSelect;
  #isOpen = false;
  #usePopover = false;

  #selectedDate = null;
  #focusedDate = null;
  #viewYear;
  #viewMonth;
  #minDate = null;
  #maxDate = null;
  #disabledDates = new Map();
  #highlightDates = new Map();
  #initialValue;
  #firstDayOfWeek;

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  setup() {
    this.#input = this.querySelector(':scope > input[type="date"]');
    if (!this.#input) return false;

    // Read constraints
    this.#minDate = fromISO(this.#input.getAttribute('min'));
    this.#maxDate = fromISO(this.#input.getAttribute('max'));
    this.#firstDayOfWeek = getFirstDayOfWeek();

    // Disabled dates — supports "YYYY-MM-DD" or "YYYY-MM-DD:reason"
    const disabled = this.getAttribute('data-disabled-dates');
    if (disabled) {
      disabled.split(',').forEach(entry => {
        const [date, reason] = entry.trim().split(':');
        this.#disabledDates.set(date, reason || null);
      });
    }

    // Highlighted dates — supports "YYYY-MM-DD" or "YYYY-MM-DD:category"
    const highlights = this.getAttribute('data-highlight-dates');
    if (highlights) {
      highlights.split(',').forEach(entry => {
        const [date, category] = entry.trim().split(':');
        this.#highlightDates.set(date, category || null);
      });
    }

    // Initial value
    this.#selectedDate = fromISO(this.#input.value);
    this.#initialValue = this.#input.value;

    let fallback = new Date();
    // Clamp fallback to min/max range
    if (this.#maxDate && fallback > this.#maxDate) fallback = this.#maxDate;
    if (this.#minDate && fallback < this.#minDate) fallback = this.#minDate;

    this.#viewYear = this.#selectedDate ? this.#selectedDate.getFullYear() : fallback.getFullYear();
    this.#viewMonth = this.#selectedDate ? this.#selectedDate.getMonth() : fallback.getMonth();
    this.#focusedDate = this.#selectedDate || fallback;

    // Hide native input
    this.#input.setAttribute('tabindex', '-1');
    this.#input.setAttribute('aria-hidden', 'true');
    this.#input.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;';

    this.#buildTrigger();
    this.#buildCalendar();
    this.#updateTrigger();
    this.#syncFormValue();
    this.#validate();

    // Popover support
    this.#usePopover = supportsPopover;
    if (this.#usePopover) {
      this.#calendar.setAttribute('popover', 'manual');
    }

    // Close on outside click
    this.listen(document, 'click', this.#handleOutsideClick);

    // Disabled state
    if (this.#input.disabled || this.hasAttribute('disabled')) {
      this.setAttribute('data-disabled', '');
      this.#textInput.disabled = true;
    }
  }

  teardown() {
    window.removeEventListener('scroll', this.#onReposition, { capture: true });
    window.removeEventListener('resize', this.#onReposition);
  }

  #buildTrigger() {
    this.#triggerContainer = document.createElement('div');
    this.#triggerContainer.className = 'date-trigger';

    // Text input — primary focusable element
    this.#textInput = document.createElement('input');
    this.#textInput.type = 'text';
    this.#textInput.className = 'date-input';
    this.#textInput.setAttribute('role', 'combobox');
    this.#textInput.setAttribute('aria-haspopup', 'dialog');
    this.#textInput.setAttribute('aria-expanded', 'false');
    this.#textInput.setAttribute('autocomplete', 'off');
    this.#textInput.setAttribute('placeholder', 'Type a date\u2026');
    this.#triggerContainer.appendChild(this.#textInput);

    // Calendar icon button
    this.#iconBtn = document.createElement('button');
    this.#iconBtn.type = 'button';
    this.#iconBtn.className = 'date-trigger-icon';
    this.#iconBtn.setAttribute('aria-label', 'Toggle calendar');
    this.#iconBtn.setAttribute('tabindex', '-1');
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'calendar');
    icon.setAttribute('size', 'sm');
    icon.setAttribute('aria-hidden', 'true');
    this.#iconBtn.appendChild(icon);
    this.#triggerContainer.appendChild(this.#iconBtn);

    this.appendChild(this.#triggerContainer);

    // Icon button toggles calendar
    this.listen(this.#iconBtn, 'click', (e) => {
      e.stopPropagation();
      this.#isOpen ? this.#close() : this.#open();
      this.#textInput.focus();
    });

    // Text input events
    this.listen(this.#textInput, 'focus', () => this.#textInput.select());
    this.listen(this.#textInput, 'input', this.#handleTextInput);
    this.listen(this.#textInput, 'keydown', this.#handleTextKeydown);
    this.listen(this.#textInput, 'blur', this.#handleTextBlur);
  }

  #buildCalendar() {
    this.#calendarId = `dp-${Math.random().toString(36).slice(2, 8)}`;

    this.#calendar = document.createElement('div');
    this.#calendar.className = 'calendar';
    this.#calendar.id = this.#calendarId;
    this.#calendar.setAttribute('role', 'dialog');
    this.#calendar.setAttribute('aria-modal', 'false');
    this.#calendar.setAttribute('aria-label', 'Choose date');
    this.#calendar.hidden = true;

    // Link combobox to calendar
    this.#textInput.setAttribute('aria-controls', this.#calendarId);

    // Header
    const header = document.createElement('div');
    header.className = 'calendar-header';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'calendar-nav';
    prevBtn.setAttribute('aria-label', 'Previous month');
    const prevIcon = document.createElement('icon-wc');
    prevIcon.setAttribute('name', 'chevron-left');
    prevIcon.setAttribute('size', 'sm');
    prevIcon.setAttribute('aria-hidden', 'true');
    prevBtn.appendChild(prevIcon);

    // Title area: month label + year dropdown
    const titleArea = document.createElement('span');
    titleArea.className = 'calendar-title';
    titleArea.id = `${this.#calendarId}-title`;
    titleArea.setAttribute('aria-live', 'polite');

    this.#monthLabel = document.createElement('span');
    this.#monthLabel.className = 'calendar-month';

    this.#yearSelect = document.createElement('select');
    this.#yearSelect.className = 'calendar-year';
    this.#yearSelect.setAttribute('aria-label', 'Year');
    this.#buildYearOptions();

    titleArea.appendChild(this.#monthLabel);
    titleArea.appendChild(this.#yearSelect);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'calendar-nav';
    nextBtn.setAttribute('aria-label', 'Next month');
    const nextIcon = document.createElement('icon-wc');
    nextIcon.setAttribute('name', 'chevron-right');
    nextIcon.setAttribute('size', 'sm');
    nextIcon.setAttribute('aria-hidden', 'true');
    nextBtn.appendChild(nextIcon);

    header.appendChild(prevBtn);
    header.appendChild(titleArea);
    header.appendChild(nextBtn);
    this.#calendar.appendChild(header);

    // Grid
    const table = document.createElement('table');
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-labelledby', `${this.#calendarId}-title`);

    // Day headers
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (let i = 0; i < 7; i++) {
      const dayIdx = (this.#firstDayOfWeek + i) % 7;
      const th = document.createElement('th');
      th.setAttribute('abbr', DAYS_ABBR[dayIdx]);
      th.setAttribute('scope', 'col');
      th.textContent = DAYS[dayIdx];
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    this.#grid = document.createElement('tbody');
    table.appendChild(this.#grid);
    this.#calendar.appendChild(table);

    this.appendChild(this.#calendar);

    // Render initial month
    this.#renderMonth();

    // Event handlers
    this.listen(prevBtn, 'click', () => this.#navigateMonth(-1));
    this.listen(nextBtn, 'click', () => this.#navigateMonth(1));
    this.listen(this.#yearSelect, 'change', () => {
      this.#viewYear = Number(this.#yearSelect.value);
      const maxDay = daysInMonth(this.#viewYear, this.#viewMonth);
      const day = Math.min(this.#focusedDate.getDate(), maxDay);
      this.#focusedDate = new Date(this.#viewYear, this.#viewMonth, day);
      this.#renderMonth();
    });
    this.listen(this.#grid, 'click', this.#handleGridClick);
    this.listen(this.#calendar, 'keydown', this.#handleCalendarKeydown);
  }

  #renderMonth() {
    // Update month label
    try {
      this.#monthLabel.textContent = new Intl.DateTimeFormat(undefined, { month: 'long' })
        .format(new Date(this.#viewYear, this.#viewMonth, 1));
    } catch {
      this.#monthLabel.textContent = EN_MONTHS[this.#viewMonth].charAt(0).toUpperCase()
        + EN_MONTHS[this.#viewMonth].slice(1);
    }

    // Update year select — ensure current year is in the options
    if (!this.#yearSelect.querySelector(`option[value="${this.#viewYear}"]`)) {
      this.#buildYearOptions();
    }
    this.#yearSelect.value = String(this.#viewYear);

    // Clear grid
    this.#grid.innerHTML = '';

    const totalDays = daysInMonth(this.#viewYear, this.#viewMonth);
    const firstDay = new Date(this.#viewYear, this.#viewMonth, 1).getDay();
    const startOffset = (firstDay - this.#firstDayOfWeek + 7) % 7;
    const today = new Date();

    let row = document.createElement('tr');

    // Empty cells before first day
    for (let i = 0; i < startOffset; i++) {
      row.appendChild(document.createElement('td'));
    }

    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(this.#viewYear, this.#viewMonth, day);
      const iso = toISO(cellDate);
      const td = document.createElement('td');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-date', iso);
      btn.textContent = String(day);

      // Today
      if (sameDay(cellDate, today)) {
        btn.setAttribute('aria-current', 'date');
      }

      // Selected
      if (sameDay(cellDate, this.#selectedDate)) {
        btn.setAttribute('aria-selected', 'true');
      }

      // Disabled
      const status = this.#getDateStatus(cellDate, iso);
      if (status.disabled) {
        btn.setAttribute('aria-disabled', 'true');
        btn.setAttribute('disabled', '');
        if (status.reason) btn.setAttribute('data-disabled-reason', status.reason);
      }

      // Highlighted dates
      if (this.#highlightDates.has(iso)) {
        const category = this.#highlightDates.get(iso);
        btn.setAttribute('data-highlight', category || '');
      }

      // Focus management — mark the focused date for visual preview
      if (sameDay(cellDate, this.#focusedDate)) {
        btn.setAttribute('tabindex', '0');
        if (!sameDay(cellDate, this.#selectedDate)) {
          btn.setAttribute('data-focused', '');
        }
      } else {
        btn.setAttribute('tabindex', '-1');
      }

      td.appendChild(btn);
      row.appendChild(td);

      // End of week row
      if ((startOffset + day) % 7 === 0) {
        this.#grid.appendChild(row);
        row = document.createElement('tr');
      }
    }

    // Pad remaining cells
    const remaining = (startOffset + totalDays) % 7;
    if (remaining > 0) {
      for (let i = remaining; i < 7; i++) {
        row.appendChild(document.createElement('td'));
      }
      this.#grid.appendChild(row);
    }
  }

  #isDateDisabled(date, iso) {
    return this.#getDateStatus(date, iso).disabled;
  }

  /** Returns { disabled, reason } for a given date */
  #getDateStatus(date, iso) {
    if (this.#disabledDates.has(iso)) {
      return { disabled: true, reason: this.#disabledDates.get(iso) };
    }
    if (this.#minDate && date < this.#minDate) return { disabled: true, reason: null };
    if (this.#maxDate && date > this.#maxDate) return { disabled: true, reason: null };
    return { disabled: false, reason: null };
  }

  #buildYearOptions() {
    this.#yearSelect.innerHTML = '';
    const now = new Date().getFullYear();
    const minYear = this.#minDate ? this.#minDate.getFullYear() : now - 100;
    const maxYear = this.#maxDate ? this.#maxDate.getFullYear() : now + 10;
    for (let y = minYear; y <= maxYear; y++) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      this.#yearSelect.appendChild(opt);
    }
  }

  #navigateMonth(delta) {
    this.#viewMonth += delta;
    if (this.#viewMonth > 11) {
      this.#viewMonth = 0;
      this.#viewYear++;
    } else if (this.#viewMonth < 0) {
      this.#viewMonth = 11;
      this.#viewYear--;
    }

    // Keep focused date in the new month
    const maxDay = daysInMonth(this.#viewYear, this.#viewMonth);
    const day = Math.min(this.#focusedDate.getDate(), maxDay);
    this.#focusedDate = new Date(this.#viewYear, this.#viewMonth, day);

    this.#renderMonth();
    this.#focusDate(this.#focusedDate);
  }

  #selectDate(date) {
    const iso = toISO(date);
    if (this.#isDateDisabled(date, iso)) return;

    this.#selectedDate = date;
    this.#focusedDate = date;
    this.#updateTrigger();
    this.#syncFormValue();
    this.#validate();
    this.#renderMonth();
    this.#close();
    this.#textInput.focus();

    this.dispatchEvent(new CustomEvent('date-picker:change', {
      bubbles: true,
      detail: { value: iso, date: new Date(date) },
    }));
  }

  #focusDate(date) {
    const iso = toISO(date);
    const btn = this.#grid.querySelector(`[data-date="${iso}"]`);
    if (btn) {
      // Reset all tabindex
      this.#grid.querySelectorAll('button[tabindex="0"]').forEach(b => {
        b.setAttribute('tabindex', '-1');
      });
      btn.setAttribute('tabindex', '0');
      btn.focus();
    }
  }

  #updateTrigger() {
    if (this.#selectedDate) {
      this.#textInput.value = formatDisplay(this.#selectedDate);
    } else {
      this.#textInput.value = '';
    }
  }

  // --- Open/Close ---

  #open() {
    if (this.#isOpen) return;
    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#textInput.setAttribute('aria-expanded', 'true');
    this.#calendar.hidden = false;

    // Ensure focused date is in view
    this.#viewYear = this.#focusedDate.getFullYear();
    this.#viewMonth = this.#focusedDate.getMonth();
    this.#renderMonth();

    if (this.#usePopover) {
      try { this.#calendar.showPopover(); } catch { /* already open */ }
      this.#positionCalendar();
      window.addEventListener('scroll', this.#onReposition, { capture: true, passive: true });
      window.addEventListener('resize', this.#onReposition, { passive: true });
    }

    this.dispatchEvent(new CustomEvent('date-picker:open', { bubbles: true }));
  }

  #close() {
    if (!this.#isOpen) return;
    this.#isOpen = false;
    this.removeAttribute('open');
    this.#textInput.setAttribute('aria-expanded', 'false');
    this.#calendar.hidden = true;

    if (this.#usePopover) {
      try { this.#calendar.hidePopover(); } catch { /* already closed */ }
      window.removeEventListener('scroll', this.#onReposition, { capture: true });
      window.removeEventListener('resize', this.#onReposition);
    }

    this.dispatchEvent(new CustomEvent('date-picker:close', { bubbles: true }));
  }

  #positionCalendar() {
    if (!this.#usePopover) return;
    const triggerRect = this.#triggerContainer.getBoundingClientRect();
    const calRect = this.#calendar.getBoundingClientRect();
    const gap = 4;
    const edgeMargin = 8;
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // Vertical: flip above if not enough space below and more space above
    const spaceBelow = vh - triggerRect.bottom - edgeMargin;
    const spaceAbove = triggerRect.top - edgeMargin;
    let top;

    if (spaceBelow < calRect.height && spaceAbove > spaceBelow) {
      top = triggerRect.top - calRect.height - gap;
      this.#calendar.dataset.placement = 'top';
    } else {
      top = triggerRect.bottom + gap;
      delete this.#calendar.dataset.placement;
    }

    // Horizontal: shift to stay within viewport
    let left = triggerRect.left;
    if (left + calRect.width > vw - edgeMargin) {
      left = vw - calRect.width - edgeMargin;
    }
    if (left < edgeMargin) left = edgeMargin;

    this.#calendar.style.setProperty('--calendar-top', `${top}px`);
    this.#calendar.style.setProperty('--calendar-left', `${left}px`);
  }

  #onReposition = () => {
    if (this.#isOpen) this.#positionCalendar();
  };

  // --- Text Input Handlers ---

  #handleTextInput = () => {
    const text = this.#textInput.value;
    const { date, partial } = parseUserDate(text);

    if (date) {
      // Full date parsed — navigate calendar to that date
      this.#focusedDate = date;
      this.#viewYear = date.getFullYear();
      this.#viewMonth = date.getMonth();
      this.#renderMonth();
    } else if (partial) {
      // Partial (month + year) — navigate calendar to that month
      this.#viewYear = partial.year;
      this.#viewMonth = partial.month;
      const maxDay = daysInMonth(partial.year, partial.month);
      const day = Math.min(this.#focusedDate.getDate(), maxDay);
      this.#focusedDate = new Date(partial.year, partial.month, day);
      this.#renderMonth();
    }

    // Open calendar as user types
    if (!this.#isOpen && text.length > 0) {
      this.#open();
    }
  };

  #handleTextKeydown = (e) => {
    switch (e.key) {
      case 'Enter': {
        e.preventDefault();
        e.stopPropagation();
        const { date } = parseUserDate(this.#textInput.value);
        if (date && !this.#isDateDisabled(date, toISO(date))) {
          this.#selectDate(date);
        }
        return;
      }
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        if (!this.#isOpen) this.#open();
        requestAnimationFrame(() => this.#focusDate(this.#focusedDate));
        return;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        if (this.#isOpen) {
          this.#close();
        }
        // Revert text to selected date display
        this.#updateTrigger();
        return;
      case 'Tab':
        // Let Tab leave the component naturally
        if (this.#isOpen) this.#close();
        return;
    }
  };

  #handleTextBlur = (e) => {
    // If focus moved inside the component (icon button, calendar), ignore
    if (e.relatedTarget && this.contains(e.relatedTarget)) return;

    // Try to parse and commit
    const text = this.#textInput.value.trim();
    if (text) {
      const { date } = parseUserDate(text);
      if (date && !this.#isDateDisabled(date, toISO(date))) {
        this.#selectedDate = date;
        this.#focusedDate = date;
        this.#syncFormValue();
        this.#validate();

        this.dispatchEvent(new CustomEvent('date-picker:change', {
          bubbles: true,
          detail: { value: toISO(date), date: new Date(date) },
        }));
      }
    }

    // Revert display to the current selected value (or clear)
    this.#updateTrigger();
    if (this.#isOpen) this.#close();

    // Trigger form-field validation
    this.#input.dispatchEvent(new Event('blur', { bubbles: true }));
  };

  // --- Calendar Event Handlers ---

  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(e.target)) {
      this.#close();
    }
  };

  #handleGridClick = (e) => {
    const btn = e.target.closest('button[data-date]');
    if (!btn || btn.hasAttribute('disabled')) return;
    this.#selectDate(fromISO(btn.getAttribute('data-date')));
  };

  #handleCalendarKeydown = (e) => {
    // Combobox pattern: Tab closes calendar and leaves the component
    if (e.key === 'Tab') {
      this.#close();
      return; // don't preventDefault — let browser handle Tab naturally
    }

    const fd = this.#focusedDate;
    let next;

    switch (e.key) {
      case 'ArrowRight':
        next = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate() + 1);
        break;
      case 'ArrowLeft':
        next = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate() - 1);
        break;
      case 'ArrowDown':
        next = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate() + 7);
        break;
      case 'ArrowUp':
        next = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate() - 7);
        break;
      case 'PageDown':
        if (e.shiftKey) {
          next = new Date(fd.getFullYear() + 1, fd.getMonth(), fd.getDate());
        } else {
          next = new Date(fd.getFullYear(), fd.getMonth() + 1, fd.getDate());
        }
        break;
      case 'PageUp':
        if (e.shiftKey) {
          next = new Date(fd.getFullYear() - 1, fd.getMonth(), fd.getDate());
        } else {
          next = new Date(fd.getFullYear(), fd.getMonth() - 1, fd.getDate());
        }
        break;
      case 'Home':
        next = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate() - fd.getDay() + this.#firstDayOfWeek);
        break;
      case 'End':
        next = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate() + (6 - fd.getDay() + this.#firstDayOfWeek));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        e.stopPropagation();
        this.#selectDate(fd);
        return;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        this.#close();
        this.#textInput.focus();
        return;
      default:
        return;
    }

    // All handled keys: stop propagation and default
    e.preventDefault();
    e.stopPropagation();

    if (next) {
      // Clamp to min/max
      if (this.#minDate && next < this.#minDate) next = this.#minDate;
      if (this.#maxDate && next > this.#maxDate) next = this.#maxDate;

      this.#focusedDate = next;

      // Switch month if needed
      if (next.getMonth() !== this.#viewMonth || next.getFullYear() !== this.#viewYear) {
        this.#viewMonth = next.getMonth();
        this.#viewYear = next.getFullYear();
        this.#renderMonth();
      }

      this.#focusDate(next);
    }
  };

  // --- Form integration ---

  #syncFormValue() {
    const val = this.#selectedDate ? toISO(this.#selectedDate) : '';
    this.#internals.setFormValue(val || null);
    this.#input.value = val;
    this.#input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  #validate() {
    if ((this.hasAttribute('required') || this.#input.hasAttribute('required')) && !this.#selectedDate) {
      this.#internals.setValidity(
        { valueMissing: true },
        'Please select a date',
        this.#textInput || this,
      );
    } else {
      this.#internals.setValidity({});
    }
  }

  formResetCallback() {
    this.#selectedDate = fromISO(this.#initialValue);
    const today = new Date();
    this.#focusedDate = this.#selectedDate || today;
    this.#viewYear = this.#focusedDate.getFullYear();
    this.#viewMonth = this.#focusedDate.getMonth();
    this.#updateTrigger();
    this.#syncFormValue();
    this.#validate();
    if (this.#isOpen) this.#renderMonth();
  }

  formStateRestoreCallback(state) {
    if (!state) return;
    this.#selectedDate = fromISO(state);
    if (this.#selectedDate) {
      this.#focusedDate = this.#selectedDate;
      this.#viewYear = this.#selectedDate.getFullYear();
      this.#viewMonth = this.#selectedDate.getMonth();
      this.#updateTrigger();
      this.#syncFormValue();
      this.#validate();
    }
  }

  get value() {
    return this.#selectedDate ? toISO(this.#selectedDate) : '';
  }

  set value(val) {
    const date = fromISO(val);
    if (date) {
      this.#selectDate(date);
    }
  }

  get min() {
    return this.#minDate ? toISO(this.#minDate) : '';
  }

  set min(val) {
    this.#minDate = val ? fromISO(val) : null;
    if (this.#input) this.#input.setAttribute('min', val || '');
    this.#renderMonth();
  }

  get max() {
    return this.#maxDate ? toISO(this.#maxDate) : '';
  }

  set max(val) {
    this.#maxDate = val ? fromISO(val) : null;
    if (this.#input) this.#input.setAttribute('max', val || '');
    this.#renderMonth();
  }
}

registerComponent('date-picker', DatePicker);

export { DatePicker };
