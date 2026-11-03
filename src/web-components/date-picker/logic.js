/**
 * date-picker: Form-associated calendar date picker with combobox text entry
 *
 * Progressive enhancement over <input type="date">.
 * Renders a text input (combobox) with calendar icon and calendar popup.
 * Users can type a date directly or pick from the calendar grid.
 * Participates in native form submission via ElementInternals.
 *
 * @attr {string}  name                   - Form field name. A `name` on the inner input is moved here on upgrade so exactly one value is submitted.
 * @attr {boolean} disabled               - Disables the picker (also follows a disabled <fieldset>). A `disabled` on the inner input is moved here on upgrade.
 * @attr {boolean} required               - Makes selection required (a `required` on the inner input works too)
 * @attr {string}  data-disabled-dates    - Comma-separated ISO dates to disable (optionally with reason: "2026-04-05:booked")
 * @attr {string}  data-highlight-dates   - Comma-separated ISO dates to highlight (optionally with category: "2026-12-25:holiday")
 * @attr {string}  data-label-toggle      - Accessible name for the calendar icon button (default "Toggle calendar")
 * @attr {string}  data-label-dialog      - Accessible name for the calendar popup (default "Choose date")
 * @attr {string}  data-label-prev        - Accessible name for the previous-month button (default "Previous month")
 * @attr {string}  data-label-next        - Accessible name for the next-month button (default "Next month")
 * @attr {string}  data-label-year        - Accessible name for the year select (default "Year")
 * @attr {string}  data-label-placeholder - Placeholder for the text input (default "Type a date…")
 * @attr {string}  data-label-required    - Validation message when required and empty (default "Please select a date")
 * @attr {string}  data-label-range-underflow - Validation message when the value is before min; "{date}" is replaced by the formatted min (default "Choose a date on or after {date}")
 * @attr {string}  data-label-range-overflow  - Validation message when the value is after max; "{date}" is replaced by the formatted max (default "Choose a date on or before {date}")
 * @attr {string}  data-label-input       - Accessible name for the text input when no <label> or aria-label exists (default "Date")
 *
 * The wrapped <input type="date"> provides min, max, and value.
 *
 * Typed input accepts ISO (2026-04-15, 2026/04/15), month names in English
 * or the picker's locale (April 15, 2026 / 15 Apr 2026 / April 2026), CJK
 * numeric dates (2026年4月15日) and Japanese era dates (令和8年4月15日,
 * 令和元年5月1日, R8/4/15). Full-width digits are accepted in the CJK forms.
 *
 * Validity: the host owns it (ElementInternals: valueMissing,
 * rangeUnderflow, rangeOverflow) anchored on the visible combobox, so
 * requestSubmit()/reportValidity() focus something real. Changing min/max
 * never rewrites the value: an out-of-range value is kept and marked
 * invalid. Once upgraded the hidden native input is detached from the form
 * (it can never block submission or submit a second value) but mirrors the
 * host's message via setCustomValidity, so a wrapping <form-field> still
 * reads a real validity state and message from it.
 *
 * @example
 * <label for="dob">Date of birth</label>
 * <date-picker>
 *   <input type="date" id="dob" name="dob" min="1920-01-01" max="2025-12-31">
 * </date-picker>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { supportsPopover } from '../../utils/popover-support.js';
import { parseWareki, parseCJKNumeric } from '../../lib/date-japanese.js';
import { usableLocale } from '../../lib/i18n.js';

const EN_MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

let datePickerSeq = 0;

/** Format a Date to ISO date string YYYY-MM-DD */
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Build a local Date, or null when the parts do not name a real calendar
 * day (2026-02-31, April 31): `new Date()` would silently roll those over.
 * @param {number} y
 * @param {number} m  0-based month
 * @param {number} d
 * @returns {Date | null}
 */
function makeDate(y, m, d) {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  const date = new Date(y, m, d);
  if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null;
  return date;
}

/**
 * Parse an ISO date string (YYYY-MM-DD) to a local Date; null when empty,
 * malformed or impossible.
 * @param {string | null | undefined} str
 */
function fromISO(str) {
  if (!str) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str).trim());
  if (!m) return null;
  return makeDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Get number of days in a month */
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Same day-of-month `n` months away, clamped to the target month's length
 * (Jan 31 + 1 month = Feb 28/29, never Mar 3).
 * @param {Date} date
 * @param {number} n
 */
function addMonths(date, n) {
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const y = target.getFullYear();
  const m = target.getMonth();
  return new Date(y, m, Math.min(date.getDate(), daysInMonth(y, m)));
}

/**
 * First day of the week (0 = Sunday) for a BCP 47 locale. Uses
 * Intl.Locale#getWeekInfo() where shipped, falling back to the older
 * `weekInfo` accessor.
 * @param {string} localeTag
 */
function getFirstDayOfWeek(localeTag) {
  try {
    const locale = /** @type {Intl.Locale & { getWeekInfo?: () => { firstDay: number }, weekInfo?: { firstDay: number } }} */ (new Intl.Locale(localeTag));
    const info = locale.getWeekInfo?.() ?? locale.weekInfo;
    if (info) return info.firstDay % 7;
  } catch { /* fallback */ }
  return 0; // Sunday
}

const _dayCache = new Map();

/**
 * 7 weekday names (index 0 = Sunday) for a locale.
 * @param {string} locale
 * @param {'short'|'long'} style
 * @returns {string[]}
 */
function getWeekdays(locale, style) {
  const key = `${locale}:${style}`;
  if (_dayCache.has(key)) return _dayCache.get(key);
  let days;
  try {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: style });
    // Jan 4 2026 is a Sunday — iterate 7 consecutive days
    days = Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2026, 0, 4 + i)));
  } catch {
    days = style === 'long'
      ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }
  _dayCache.set(key, days);
  return days;
}

/** Format a date for display using Intl */
function formatDisplay(date, locale) {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(date);
  } catch {
    return toISO(date);
  }
}

/** Check if two dates are the same calendar day */
function sameDay(a, b) {
  return Boolean(a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate());
}

const _monthMapCache = new Map();

/**
 * Month-name → index map for a locale plus an English fallback.
 * Keys are lowercase, values are 0-based month indices.
 * @param {string} locale
 * @returns {Map<string, number>}
 */
function getMonthMap(locale) {
  if (_monthMapCache.has(locale)) return _monthMapCache.get(locale);
  const map = new Map();
  EN_MONTHS.forEach((name, i) => {
    map.set(name, i);
    map.set(name.slice(0, 3), i); // "jan", "feb", etc.
  });
  try {
    const long = new Intl.DateTimeFormat(locale, { month: 'long' });
    const short = new Intl.DateTimeFormat(locale, { month: 'short' });
    for (let m = 0; m < 12; m++) {
      const d = new Date(2000, m, 1);
      map.set(long.format(d).toLowerCase(), m);
      map.set(short.format(d).toLowerCase().replace('.', ''), m);
    }
  } catch { /* English only */ }
  _monthMapCache.set(locale, map);
  return map;
}

/**
 * Parse user-typed text into a date or partial date. Impossible dates
 * (2026-02-31) are rejected rather than rolled over.
 * @param {string} text - User input
 * @param {string} locale
 * @returns {{ date: Date|null, partial: { year: number, month: number }|null }}
 */
function parseUserDate(text, locale) {
  const t = text.trim();
  const none = { date: null, partial: null };
  if (!t) return none;

  // 1. ISO: YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(t)) {
    const date = fromISO(t.replace(/\//g, '-'));
    return date ? { date, partial: null } : none;
  }

  // 1a. Japanese era: 令和8年10月21日, R8/10/21
  const wareki = parseWareki(t);
  if (wareki) return { date: wareki, partial: null };

  // 1b. CJK numeric: 2026年10月21日
  const cjk = parseCJKNumeric(t);
  if (cjk) return { date: cjk, partial: null };

  const months = getMonthMap(locale);

  // 2. Month Day Year: "Apr 15 2026", "April 15, 2026"
  let m = t.match(/^([a-zÀ-ɏ]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (m) {
    const monthIdx = months.get(m[1].toLowerCase());
    if (monthIdx === undefined) return none;
    const date = makeDate(Number(m[3]), monthIdx, Number(m[2]));
    return date ? { date, partial: null } : none;
  }

  // 3. Day Month Year: "15 Apr 2026"
  m = t.match(/^(\d{1,2})\.?\s+([a-zÀ-ɏ]+)\.?\s+(\d{4})$/i);
  if (m) {
    const monthIdx = months.get(m[2].toLowerCase());
    if (monthIdx === undefined) return none;
    const date = makeDate(Number(m[3]), monthIdx, Number(m[1]));
    return date ? { date, partial: null } : none;
  }

  // 4. Partial: "April 2026", "Apr 2026"
  m = t.match(/^([a-zÀ-ɏ]+)\.?\s+(\d{4})$/i);
  if (m) {
    const monthIdx = months.get(m[1].toLowerCase());
    if (monthIdx !== undefined) {
      return { date: null, partial: { year: Number(m[2]), month: monthIdx } };
    }
  }

  return none;
}

/**
 * Parse "YYYY-MM-DD[:note],…" into a Map of ISO → note.
 * @param {string | null} attr
 */
function parseDateList(attr) {
  const map = new Map();
  if (!attr) return map;
  for (const entry of attr.split(',')) {
    const [date, note] = entry.trim().split(':');
    if (date) map.set(date, note || '');
  }
  return map;
}


class DatePicker extends VBElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ['disabled', 'required'];
  }

  #internals;
  #uid = `dp${++datePickerSeq}`;
  #built = false;
  /** @type {HTMLInputElement} */
  #input;
  /** @type {HTMLInputElement} */
  #textInput;
  /** @type {HTMLButtonElement} */
  #iconBtn;
  /** @type {HTMLElement} */
  #triggerContainer;
  /** @type {HTMLElement} */
  #calendar;
  /** @type {HTMLTableSectionElement} */
  #grid;
  /** @type {HTMLElement} */
  #monthLabel;
  /** @type {HTMLSelectElement} */
  #yearSelect;
  #isOpen = false;
  #usePopover = false;
  #locale = 'en-US';

  /** @type {Date | null} */
  #selectedDate = null;
  /** @type {Date | null} */
  #focusedDate = null;
  /** @type {number} */
  #viewYear = new Date().getFullYear();
  /** @type {number} */
  #viewMonth = new Date().getMonth();
  /** @type {Date | null} */
  #minDate = null;
  /** @type {Date | null} */
  #maxDate = null;
  /** @type {Map<string, string>} */
  #disabledDates = new Map();
  /** @type {Map<string, string>} */
  #highlightDates = new Map();
  /** Form-reset target: the inner input's value ATTRIBUTE, captured once
   *  (its .value is synced on every commit, so re-reading it would drift).
   *  @type {string | undefined} */
  #initialValue;
  /** Value assigned through the API before the first upgrade.
   *  @type {string | undefined} */
  #pendingValue;
  /** @type {number} */
  #firstDayOfWeek = 0;
  /** Message last mirrored onto the inner input via setCustomValidity.
   *  @type {string} */
  #mirroredMessage = '';
  /** User left the field or submission found it invalid (cleared on reset). */
  #touched = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    const input = /** @type {HTMLInputElement | null} */ (this.querySelector(':scope > input[type="date"]'));
    if (!input) return false;
    this.#input = input;

    this.#locale = usableLocale(/** @type {HTMLElement | null} */ (this.closest('[lang]'))?.lang || navigator.language);
    this.#firstDayOfWeek = getFirstDayOfWeek(this.#locale);

    // Constraints (fresh maps every setup: no accumulation across reconnects)
    this.#minDate = fromISO(input.getAttribute('min'));
    this.#maxDate = fromISO(input.getAttribute('max'));
    this.#disabledDates = parseDateList(this.getAttribute('data-disabled-dates'));
    this.#highlightDates = parseDateList(this.getAttribute('data-highlight-dates'));

    // PE submission path: without JS the inner input submits under its own
    // name. Once upgraded the host submits via ElementInternals, so move the
    // name (host wins if both are set) — exactly one value is submitted.
    // Same for an authored `disabled`.
    const innerName = input.getAttribute('name');
    if (innerName) {
      if (!this.hasAttribute('name')) this.setAttribute('name', innerName);
      input.removeAttribute('name');
    }
    if (input.hasAttribute('disabled')) {
      input.removeAttribute('disabled');
      if (!this.hasAttribute('disabled')) this.setAttribute('disabled', '');
    }
    // Detach the hidden input from its form: a `form` attribute naming no
    // element leaves it formless, so its constraints (required/min/max) can
    // never block submission with "An invalid form control is not
    // focusable" and it is never in FormData. An authored `form` moves to
    // the host (form-associated, so it honours the attribute).
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

    // Current value: the inner input's live .value carries state across a
    // move/reconnect.
    this.#selectedDate = fromISO(input.value);

    let fallback = new Date();
    if (this.#maxDate && fallback > this.#maxDate) fallback = this.#maxDate;
    if (this.#minDate && fallback < this.#minDate) fallback = this.#minDate;
    this.#focusedDate = this.#selectedDate || fallback;
    this.#viewYear = this.#focusedDate.getFullYear();
    this.#viewMonth = this.#focusedDate.getMonth();

    // Hide native input; anything that focuses or clicks it (a <label for>)
    // is redirected to the combobox.
    input.setAttribute('tabindex', '-1');
    input.setAttribute('aria-hidden', 'true');
    input.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;';
    this.listen(input, 'click', this.#handleInputClick);
    this.listen(input, 'focus', this.#focusTextInput);

    this.#buildTrigger();
    this.#buildCalendar();
    this.#built = true;
    this.#applyAccessibleName();
    this.#updateTrigger();
    this.#syncFormValue(false);
    this.#validate();

    this.#usePopover = supportsPopover;
    if (this.#usePopover) {
      this.#calendar.setAttribute('popover', 'manual');
    }

    this.listen(document, 'click', this.#handleOutsideClick);
    // Form submission / reportValidity found the host invalid: let a
    // wrapping <form-field> show its message (it listens on the inner input).
    this.listen(this, 'invalid', this.#notifyFieldValidate);

    this.#applyDisabled(this.matches(':disabled'));
    return true;
  }

  teardown() {
    // Built UI is removed so the next setup() (move/reconnect, _reinit)
    // rebuilds exactly one trigger + calendar with fresh listeners.
    this.#isOpen = false;
    this.removeAttribute('open');
    window.removeEventListener('scroll', this.#onReposition, { capture: true });
    window.removeEventListener('resize', this.#onReposition);
    this.#triggerContainer?.remove();
    this.#calendar?.remove();
    this.#disabledDates = new Map();
    this.#highlightDates = new Map();
    this.#built = false;
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

  /**
   * Author-overridable UI string from a data-label-* attribute.
   * @param {string} key  dataset key suffix, e.g. 'Prev' for data-label-prev
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
   * name nothing. Forward every label — of the inner input and of the host
   * (form-associated, so <label for="host-id"> works too) — to the combobox
   * via aria-labelledby; else fall back to an aria-label / aria-labelledby
   * authored on the input or host.
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
      // Host labels have no activation target; send their clicks here.
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
        || this.getAttribute('aria-label') || this.#label('Input', 'Date'));
    }
    const describedBy = this.#input.getAttribute('aria-describedby');
    if (describedBy) ti.setAttribute('aria-describedby', describedBy);
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
    this.#textInput.setAttribute('placeholder', this.#label('Placeholder', 'Type a date…'));
    this.#triggerContainer.appendChild(this.#textInput);

    // Calendar icon button
    this.#iconBtn = document.createElement('button');
    this.#iconBtn.type = 'button';
    this.#iconBtn.className = 'date-trigger-icon';
    this.#iconBtn.setAttribute('aria-label', this.#label('Toggle', 'Toggle calendar'));
    this.#iconBtn.setAttribute('tabindex', '-1');
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'calendar');
    icon.setAttribute('size', 'sm');
    icon.setAttribute('aria-hidden', 'true');
    this.#iconBtn.appendChild(icon);
    this.#triggerContainer.appendChild(this.#iconBtn);

    this.appendChild(this.#triggerContainer);

    this.listen(this.#iconBtn, 'click', (e) => {
      e.stopPropagation();
      this.#isOpen ? this.#close() : this.#open();
      this.#textInput.focus();
    });

    this.listen(this.#textInput, 'focus', () => this.#textInput.select());
    this.listen(this.#textInput, 'input', this.#handleTextInput);
    this.listen(this.#textInput, 'keydown', this.#handleTextKeydown);
    this.listen(this.#textInput, 'blur', this.#handleTextBlur);
  }

  #buildCalendar() {
    const calendarId = `${this.#uid}-calendar`;

    this.#calendar = document.createElement('div');
    this.#calendar.className = 'calendar';
    this.#calendar.id = calendarId;
    this.#calendar.setAttribute('role', 'dialog');
    this.#calendar.setAttribute('aria-modal', 'false');
    this.#calendar.setAttribute('aria-label', this.#label('Dialog', 'Choose date'));
    this.#calendar.hidden = true;

    this.#textInput.setAttribute('aria-controls', calendarId);

    // Header
    const header = document.createElement('div');
    header.className = 'calendar-header';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'calendar-nav';
    prevBtn.setAttribute('aria-label', this.#label('Prev', 'Previous month'));
    const prevIcon = document.createElement('icon-wc');
    prevIcon.setAttribute('name', 'chevron-left');
    prevIcon.setAttribute('size', 'sm');
    prevIcon.setAttribute('aria-hidden', 'true');
    prevBtn.appendChild(prevIcon);

    // Title area: month label + year dropdown
    const titleArea = document.createElement('span');
    titleArea.className = 'calendar-title';
    titleArea.id = `${calendarId}-title`;
    titleArea.setAttribute('aria-live', 'polite');

    this.#monthLabel = document.createElement('span');
    this.#monthLabel.className = 'calendar-month';

    this.#yearSelect = document.createElement('select');
    this.#yearSelect.className = 'calendar-year';
    this.#yearSelect.setAttribute('aria-label', this.#label('Year', 'Year'));
    this.#buildYearOptions();

    titleArea.appendChild(this.#monthLabel);
    titleArea.appendChild(this.#yearSelect);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'calendar-nav';
    nextBtn.setAttribute('aria-label', this.#label('Next', 'Next month'));
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
    table.setAttribute('aria-labelledby', `${calendarId}-title`);

    // Locale-aware weekday headers, rotated to the locale's first day
    const shortDays = getWeekdays(this.#locale, 'short');
    const longDays = getWeekdays(this.#locale, 'long');
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (let i = 0; i < 7; i++) {
      const dayIdx = (this.#firstDayOfWeek + i) % 7;
      const th = document.createElement('th');
      th.setAttribute('abbr', longDays[dayIdx]);
      th.setAttribute('scope', 'col');
      th.textContent = shortDays[dayIdx];
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    this.#grid = document.createElement('tbody');
    table.appendChild(this.#grid);
    this.#calendar.appendChild(table);

    this.appendChild(this.#calendar);

    this.#renderMonth();

    this.listen(prevBtn, 'click', () => this.#navigateMonth(-1));
    this.listen(nextBtn, 'click', () => this.#navigateMonth(1));
    this.listen(this.#yearSelect, 'change', () => {
      this.#viewYear = Number(this.#yearSelect.value);
      const maxDay = daysInMonth(this.#viewYear, this.#viewMonth);
      const day = Math.min(this.#focusedDate?.getDate() ?? 1, maxDay);
      this.#focusedDate = new Date(this.#viewYear, this.#viewMonth, day);
      this.#renderMonth();
    });
    this.listen(this.#grid, 'click', this.#handleGridClick);
    this.listen(this.#calendar, 'keydown', this.#handleCalendarKeydown);
  }

  #renderMonth() {
    try {
      this.#monthLabel.textContent = new Intl.DateTimeFormat(this.#locale, { month: 'long' })
        .format(new Date(this.#viewYear, this.#viewMonth, 1));
    } catch {
      this.#monthLabel.textContent = EN_MONTHS[this.#viewMonth].charAt(0).toUpperCase()
        + EN_MONTHS[this.#viewMonth].slice(1);
    }

    if (!this.#yearSelect.querySelector(`option[value="${this.#viewYear}"]`)) {
      this.#buildYearOptions();
    }
    this.#yearSelect.value = String(this.#viewYear);

    this.#grid.replaceChildren();

    const totalDays = daysInMonth(this.#viewYear, this.#viewMonth);
    const firstDay = new Date(this.#viewYear, this.#viewMonth, 1).getDay();
    const startOffset = (firstDay - this.#firstDayOfWeek + 7) % 7;
    const today = new Date();

    let row = document.createElement('tr');

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

      if (sameDay(cellDate, today)) {
        btn.setAttribute('aria-current', 'date');
      }

      // aria-selected lives on the gridcell (<td>): <button> does not
      // support it. Every in-month cell carries an explicit true/false.
      const selected = sameDay(cellDate, this.#selectedDate);
      td.setAttribute('aria-selected', String(selected));

      // Disabled days stay focusable (aria-disabled, not native disabled)
      // so roving focus never lands on an unfocusable button; selection
      // paths refuse them.
      const status = this.#getDateStatus(cellDate, iso);
      if (status.disabled) {
        btn.setAttribute('aria-disabled', 'true');
        if (status.reason) btn.setAttribute('data-disabled-reason', status.reason);
      }

      if (this.#highlightDates.has(iso)) {
        btn.setAttribute('data-highlight', this.#highlightDates.get(iso) || '');
      }

      if (sameDay(cellDate, this.#focusedDate)) {
        btn.setAttribute('tabindex', '0');
        if (!selected) btn.setAttribute('data-focused', '');
      } else {
        btn.setAttribute('tabindex', '-1');
      }

      td.appendChild(btn);
      row.appendChild(td);

      if ((startOffset + day) % 7 === 0) {
        this.#grid.appendChild(row);
        row = document.createElement('tr');
      }
    }

    const remaining = (startOffset + totalDays) % 7;
    if (remaining > 0) {
      for (let i = remaining; i < 7; i++) {
        row.appendChild(document.createElement('td'));
      }
      this.#grid.appendChild(row);
    }
  }

  /** @param {Date} date */
  #isDateDisabled(date) {
    return this.#getDateStatus(date, toISO(date)).disabled;
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
    this.#yearSelect.replaceChildren();
    const now = new Date().getFullYear();
    let minYear = this.#minDate ? this.#minDate.getFullYear() : now - 100;
    let maxYear = this.#maxDate ? this.#maxDate.getFullYear() : now + 10;
    minYear = Math.min(minYear, this.#viewYear);
    maxYear = Math.max(maxYear, this.#viewYear);
    for (let y = minYear; y <= maxYear; y++) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      this.#yearSelect.appendChild(opt);
    }
  }

  #navigateMonth(delta) {
    const base = this.#focusedDate ?? new Date(this.#viewYear, this.#viewMonth, 1);
    // Re-anchor on the viewed month first so the header buttons always move
    // exactly one month from what is on screen.
    const anchored = new Date(this.#viewYear, this.#viewMonth,
      Math.min(base.getDate(), daysInMonth(this.#viewYear, this.#viewMonth)));
    this.#focusedDate = addMonths(anchored, delta);
    this.#viewYear = this.#focusedDate.getFullYear();
    this.#viewMonth = this.#focusedDate.getMonth();
    this.#renderMonth();
    this.#focusDate(this.#focusedDate);
  }

  /**
   * Set (or clear) the selected date. Updates the trigger, form value and
   * validity, and fires date-picker:change only when the value changed.
   * @param {Date | null} date
   * @param {'api' | 'pointer' | 'keyboard'} source
   * @returns {boolean} whether the value changed
   */
  #commit(date, source) {
    if (date && this.#isDateDisabled(date)) return false;
    const prev = this.value;
    const iso = date ? toISO(date) : '';
    this.#selectedDate = date;
    if (date) this.#focusedDate = date;
    this.#updateTrigger();
    if (iso === prev) return false;

    this.#syncFormValue();
    this.#validate();
    if (date && source === 'api') {
      this.#viewYear = date.getFullYear();
      this.#viewMonth = date.getMonth();
    }
    if (this.#isOpen || source === 'api') this.#renderMonth();

    this.dispatchEvent(new CustomEvent('date-picker:change', {
      bubbles: true,
      detail: { value: iso, date: date ? new Date(date) : null, source },
    }));
    return true;
  }

  /**
   * Pick a date from the grid / Enter: commit, close and return focus to the
   * text input. Re-picking the current date still closes.
   * @param {Date} date
   * @param {'pointer' | 'keyboard'} source
   */
  #selectDate(date, source) {
    if (this.#isDateDisabled(date)) return;
    this.#commit(date, source);
    this.#close();
    this.#textInput.focus();
  }

  #focusDate(date) {
    const btn = /** @type {HTMLButtonElement | null} */ (this.#grid.querySelector(`[data-date="${toISO(date)}"]`));
    if (!btn) return;
    for (const b of this.#grid.querySelectorAll('button[data-date]')) {
      b.setAttribute('tabindex', b === btn ? '0' : '-1');
      if (b !== btn) b.removeAttribute('data-focused');
    }
    if (btn.closest('td')?.getAttribute('aria-selected') !== 'true') btn.setAttribute('data-focused', '');
    btn.focus();
  }

  #updateTrigger() {
    this.#textInput.value = this.#selectedDate ? formatDisplay(this.#selectedDate, this.#locale) : '';
  }

  // --- Open/Close ---

  #open() {
    if (this.#isOpen || this.#textInput.disabled) return;
    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#textInput.setAttribute('aria-expanded', 'true');
    this.#calendar.hidden = false;

    if (this.#focusedDate) {
      this.#viewYear = this.#focusedDate.getFullYear();
      this.#viewMonth = this.#focusedDate.getMonth();
    }
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
    const { date, partial } = parseUserDate(text, this.#locale);

    if (date) {
      this.#focusedDate = date;
      this.#viewYear = date.getFullYear();
      this.#viewMonth = date.getMonth();
      this.#renderMonth();
    } else if (partial) {
      this.#viewYear = partial.year;
      this.#viewMonth = partial.month;
      const maxDay = daysInMonth(partial.year, partial.month);
      const day = Math.min(this.#focusedDate?.getDate() ?? 1, maxDay);
      this.#focusedDate = new Date(partial.year, partial.month, day);
      this.#renderMonth();
    }

    if (!this.#isOpen && text.length > 0) {
      this.#open();
    }
  };

  /** @param {KeyboardEvent} e */
  #handleTextKeydown = (e) => {
    switch (e.key) {
      case 'Enter': {
        e.preventDefault();
        e.stopPropagation();
        const text = this.#textInput.value.trim();
        if (!text) {
          this.#commit(null, 'keyboard');
          this.#close();
          return;
        }
        const { date } = parseUserDate(text, this.#locale);
        if (date && !this.#isDateDisabled(date)) {
          this.#selectDate(date, 'keyboard');
        }
        return;
      }
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        if (!this.#isOpen) this.#open();
        requestAnimationFrame(() => { if (this.#focusedDate) this.#focusDate(this.#focusedDate); });
        return;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        if (this.#isOpen) this.#close();
        this.#updateTrigger();
        return;
      case 'Tab':
        if (this.#isOpen) this.#close();
        return;
    }
  };

  /** @param {FocusEvent} e */
  #handleTextBlur = (e) => {
    // Focus moved inside the component (icon button, calendar): ignore
    if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;

    // Commit: empty text clears; a valid, enabled date selects; anything
    // else (unparseable, impossible, disabled) is rejected and reverts.
    const text = this.#textInput.value.trim();
    if (!text) {
      this.#commit(null, 'keyboard');
    } else {
      const { date } = parseUserDate(text, this.#locale);
      if (date && !this.#isDateDisabled(date)) this.#commit(date, 'keyboard');
    }

    this.#updateTrigger();
    if (this.#isOpen) this.#close();

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

  // --- Calendar Event Handlers ---

  /** @param {Event} e */
  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(/** @type {Node} */ (e.target))) {
      this.#close();
    }
  };

  /** @type {(e: Event) => void} */
  #handleGridClick = (e) => {
    const target = /** @type {Element | null} */ (e.target);
    const btn = target?.closest('button[data-date]');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    const date = fromISO(btn.getAttribute('data-date'));
    if (date) this.#selectDate(date, 'pointer');
  };

  /** @type {(e: KeyboardEvent) => void} */
  #handleCalendarKeydown = (e) => {
    // Combobox pattern: Tab closes calendar and leaves the component
    if (e.key === 'Tab') {
      this.#close();
      return;
    }

    // Only the day grid owns arrow/Home/End/Page keys; the year select and
    // header buttons keep their native behaviour.
    const fromGrid = e.target instanceof Element && this.#grid.contains(e.target);

    const fd = this.#focusedDate;
    if (!fd) return;
    /** @type {Date | undefined} */
    let next;
    // Column of the focused day relative to the locale's first weekday
    const col = (fd.getDay() - this.#firstDayOfWeek + 7) % 7;

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
        next = addMonths(fd, e.shiftKey ? 12 : 1);
        break;
      case 'PageUp':
        next = addMonths(fd, e.shiftKey ? -12 : -1);
        break;
      case 'Home':
        next = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate() - col);
        break;
      case 'End':
        next = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate() + (6 - col));
        break;
      case 'Enter':
      case ' ':
        if (!fromGrid) return;
        e.preventDefault();
        e.stopPropagation();
        this.#selectDate(fd, 'keyboard');
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

    if (!fromGrid) return;
    e.preventDefault();
    e.stopPropagation();

    if (this.#minDate && next < this.#minDate) next = this.#minDate;
    if (this.#maxDate && next > this.#maxDate) next = this.#maxDate;

    this.#focusedDate = next;
    if (next.getMonth() !== this.#viewMonth || next.getFullYear() !== this.#viewYear) {
      this.#viewMonth = next.getMonth();
      this.#viewYear = next.getFullYear();
      this.#renderMonth();
    }
    this.#focusDate(next);
  };

  // --- Form integration ---

  /** @param {boolean} [notify=true] dispatch `input` on the inner input (form-field listens) */
  #syncFormValue(notify = true) {
    const val = this.#selectedDate ? toISO(this.#selectedDate) : '';
    this.#internals.setFormValue(val || null);
    this.#input.value = val;
    if (notify) this.#input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Message for a failing constraint: an authored data-message-* on the inner
   * input (what <form-field> reads too) wins, then the host's data-label-*.
   * @param {'valueMissing' | 'rangeUnderflow' | 'rangeOverflow'} key
   * @param {string} labelKey
   * @param {string} fallback
   * @param {Date | null} [date] substituted for "{date}"
   */
  #message(key, labelKey, fallback, date = null) {
    const msg = this.#input.getAttribute(`data-message-${key.toLowerCase()}`)
      ?? this.#label(labelKey, fallback);
    return date ? msg.replaceAll('{date}', formatDisplay(date, this.#locale)) : msg;
  }

  /**
   * Recompute validity on the host and mirror it onto the inner input.
   * @returns {boolean} whether the validity state changed
   */
  #validate() {
    if (!this.#built) return false;
    const required = this.hasAttribute('required') || this.#input.hasAttribute('required');
    if (required) this.#textInput.setAttribute('aria-required', 'true');
    else this.#textInput.removeAttribute('aria-required');

    const date = this.#selectedDate;
    /** @type {ValidityStateFlags} */
    let flags = {};
    let message = '';
    if (required && !date) {
      flags = { valueMissing: true };
      message = this.#message('valueMissing', 'Required', 'Please select a date');
    } else if (date && this.#minDate && date < this.#minDate) {
      flags = { rangeUnderflow: true };
      message = this.#message('rangeUnderflow', 'RangeUnderflow', 'Choose a date on or after {date}', this.#minDate);
    } else if (date && this.#maxDate && date > this.#maxDate) {
      flags = { rangeOverflow: true };
      message = this.#message('rangeOverflow', 'RangeOverflow', 'Choose a date on or before {date}', this.#maxDate);
    }

    const before = this.#internals.validationMessage;
    if (message) this.#internals.setValidity(flags, message, this.#textInput);
    else this.#internals.setValidity({});
    // Expose invalid on the combobox (the inner input is aria-hidden) once
    // it is meaningful: a value is out of range, or the user has left /
    // tried to submit the field (an untouched empty required field is not
    // announced as an error).
    if (message && (date || this.#touched)) this.#textInput.setAttribute('aria-invalid', 'true');
    else this.#textInput.removeAttribute('aria-invalid');

    // Mirror for <form-field>. Leave a foreign custom error (form-field's
    // setError) alone; replace or clear only our own.
    const own = this.#input.validationMessage === this.#mirroredMessage || !this.#input.validity.customError;
    if (own) {
      this.#input.setCustomValidity(message);
      this.#mirroredMessage = message;
    }
    return before !== message;
  }

  /** min/max changed: re-render, re-validate, and nudge <form-field> if validity flipped. */
  #constraintsChanged() {
    if (!this.#built) return;
    this.#renderMonth();
    if (this.#validate()) this.#input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** Restore without firing date-picker:change (resets are not user edits). */
  /** @param {Date | null} date */
  #setSilently(date) {
    const focus = date || new Date();
    this.#selectedDate = date;
    this.#focusedDate = focus;
    this.#viewYear = focus.getFullYear();
    this.#viewMonth = focus.getMonth();
    this.#updateTrigger();
    this.#syncFormValue();
    this.#validate();
    this.#renderMonth();
  }

  formResetCallback() {
    if (!this.#built) return;
    this.#touched = false;
    this.#setSilently(fromISO(this.#initialValue));
  }

  formStateRestoreCallback(state) {
    if (!this.#built || typeof state !== 'string') return;
    this.#setSilently(fromISO(state));
  }

  get form() { return this.#internals.form; }
  get validity() { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }
  get willValidate() { return this.#internals.willValidate; }
  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }

  get value() {
    if (!this.#built) return this.#pendingValue ?? '';
    return this.#selectedDate ? toISO(this.#selectedDate) : '';
  }

  /** ISO date string; '' (or null) clears. Malformed/impossible values are ignored. */
  set value(val) {
    const str = val == null ? '' : String(val).trim();
    const date = str ? fromISO(str) : null;
    if (str && !date) return;
    if (!this.#built) {
      this.#pendingValue = str;
      return;
    }
    this.#commit(date, 'api');
  }

  get min() {
    return this.#minDate ? toISO(this.#minDate) : '';
  }

  set min(val) {
    this.#minDate = fromISO(val);
    if (this.#input) {
      if (this.#minDate) this.#input.setAttribute('min', toISO(this.#minDate));
      else this.#input.removeAttribute('min');
    }
    this.#constraintsChanged();
  }

  get max() {
    return this.#maxDate ? toISO(this.#maxDate) : '';
  }

  set max(val) {
    this.#maxDate = fromISO(val);
    if (this.#input) {
      if (this.#maxDate) this.#input.setAttribute('max', toISO(this.#maxDate));
      else this.#input.removeAttribute('max');
    }
    this.#constraintsChanged();
  }
}

registerComponent('date-picker', DatePicker);

export { DatePicker };
