/**
 * calendar-wc: Standalone calendar display with rich cell content
 *
 * Display component for showing events, availability, or annotations on
 * dates. NOT a form input — use date-picker for date selection in forms.
 * Supports single and range selection, event dots/labels, size variants,
 * year dropdown, day detail overlay, and keyboard navigation.
 *
 * @attr {string}  data-month           - Initial month (1-12). Defaults to current.
 * @attr {string}  data-year            - Initial year. Defaults to current.
 * @attr {string}  data-events          - JSON: events keyed by ISO date. Values can be:
 *   - string: "Team meeting"
 *   - object: { "label": "...", "color": "...", "icon": "...", "time": "09:00" }
 *   - array:  [{ "label": "...", "time": "..." }, ...]
 * @attr {string}  data-selection       - Selection mode: "none" (default), "single", "range", "multi"
 * @attr {string}  data-size            - Size: "compact", "default", "large"
 * @attr {string}  data-min-date        - Earliest selectable/navigable date (ISO string)
 * @attr {string}  data-max-date        - Latest selectable/navigable date (ISO string)
 * @attr {string}  data-disabled-dates  - Comma-separated ISO dates to disable
 * @attr {string}  data-highlight-dates - Comma-separated ISO dates to highlight (optionally with :category)
 * @attr {string}  data-months          - Number of adjacent months to show (1-12). Defaults to 1.
 * @attr {string}  name                - Form participation name (enables ElementInternals form value)
 *
 * @example
 * <calendar-wc data-size="large"
 *   data-events='{"2026-04-10":[{"label":"Standup","time":"09:00","icon":"users"},{"label":"Review","time":"14:00"}]}'>
 * </calendar-wc>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

// ── Date utilities ──────────────────────────────────────────────────

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromISO(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function sameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getFirstDayOfWeek() {
  try {
    const locale = new Intl.Locale(navigator.language);
    if (locale.weekInfo) return locale.weekInfo.firstDay % 7;
  } catch { /* fallback */ }
  return 0;
}

/** Normalize event data to always be an array of event objects */
function normalizeEvents(data) {
  if (!data) return [];
  if (typeof data === 'string') return [{ label: data }];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return [data];
  return [];
}

// ── Locale-aware label helpers ──────────────────────────────────────

const _dayCache = new Map();
const _hourCache = new Map();

/**
 * Return an array of 7 weekday names (index 0 = Sunday) for the given locale.
 * @param {string} locale  BCP 47 locale string
 * @param {'short'|'narrow'|'long'} style  Intl weekday format
 */
function getLocalizedDays(locale, style = 'short') {
  const key = `${locale}:${style}`;
  if (_dayCache.has(key)) return _dayCache.get(key);
  const fmt = new Intl.DateTimeFormat(locale, { weekday: style });
  // Jan 4 2026 is a Sunday — iterate 7 consecutive days
  const days = Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(2026, 0, 4 + i))
  );
  _dayCache.set(key, days);
  return days;
}

/**
 * Return an array of 24 hour labels for the given locale.
 * @param {string} locale  BCP 47 locale string
 */
function getLocalizedHours(locale) {
  if (_hourCache.has(locale)) return _hourCache.get(locale);
  const fmt = new Intl.DateTimeFormat(locale, { hour: 'numeric' });
  const hours = Array.from({ length: 24 }, (_, i) =>
    fmt.format(new Date(2026, 0, 4, i))
  );
  _hourCache.set(locale, hours);
  return hours;
}

// ── Component ───────────────────────────────────────────────────────

class CalendarWc extends VBElement {
  static formAssociated = true;

  #internals;
  #locale;
  #viewMonth;
  #viewYear;
  #firstDayOfWeek;
  #events = {};
  #minDate = null;
  #maxDate = null;
  #disabledDates = new Set();
  #highlightDates = new Map();
  #selectedDate = null;
  #selectedDates = new Set();
  #rangeStart = null;
  #rangeEnd = null;
  #hoverDate = null;
  #selectionMode = 'none';
  #size = 'default';
  #monthCount = 1;

  /** JS-only callback: (date: Date) => boolean. If it returns true, the date is disabled. */
  isDateDisallowed = null;

  /** JS-only callback: (date: Date) => string | string[] | null. Return value set as data-day-part on the cell. */
  getDayParts = null;

  // DOM refs
  #header;
  #titleContainer;
  #monthLabel;
  #yearSelect;
  #grid;
  #monthsWrap;
  #prevBtn;
  #nextBtn;
  #detailOverlay = null;

  constructor() {
    super();
    if (typeof this.attachInternals === 'function') {
      this.#internals = this.attachInternals();
    }
  }

  setup() {
    this.#locale = this.closest('[lang]')?.lang || navigator.language;
    const today = new Date();
    this.#viewMonth = parseInt(this.getAttribute('data-month'), 10) - 1;
    if (isNaN(this.#viewMonth)) this.#viewMonth = today.getMonth();
    this.#viewYear = parseInt(this.getAttribute('data-year'), 10);
    if (isNaN(this.#viewYear)) this.#viewYear = today.getFullYear();
    this.#firstDayOfWeek = getFirstDayOfWeek();
    this.#selectionMode = this.getAttribute('data-selection') || 'none';
    this.#size = this.getAttribute('data-size') || 'default';
    this.#monthCount = Math.max(1, Math.min(12, parseInt(this.dataset.months, 10) || 1));

    // Parse events
    const eventsAttr = this.getAttribute('data-events');
    if (eventsAttr) {
      try { this.#events = JSON.parse(eventsAttr); } catch { /* ignore */ }
    }

    // Parse min/max date constraints
    this.#minDate = fromISO(this.dataset.minDate);
    this.#maxDate = fromISO(this.dataset.maxDate);

    // Parse disabled dates
    const disabled = this.getAttribute('data-disabled-dates');
    if (disabled) {
      disabled.split(',').forEach(d => this.#disabledDates.add(d.trim()));
    }

    // Parse highlighted dates
    const highlights = this.getAttribute('data-highlight-dates');
    if (highlights) {
      highlights.split(',').forEach(entry => {
        const [date, category] = entry.trim().split(':');
        this.#highlightDates.set(date, category || null);
      });
    }

    this.#build();
    this.#renderMonth();
  }

  #build() {
    // Header
    this.#header = document.createElement('header');

    this.#prevBtn = document.createElement('button');
    this.#prevBtn.type = 'button';
    this.#prevBtn.setAttribute('aria-label', 'Previous month');
    this.#prevBtn.textContent = '\u2039';
    this.listen(this.#prevBtn, 'click', () => this.#navigate(-1));

    // Title area: month label + year dropdown
    this.#titleContainer = document.createElement('span');
    this.#titleContainer.className = 'calendar-title';
    this.#titleContainer.setAttribute('aria-live', 'polite');

    this.#monthLabel = document.createElement('span');
    this.#monthLabel.className = 'calendar-month';

    this.#yearSelect = document.createElement('select');
    this.#yearSelect.className = 'calendar-year';
    this.#yearSelect.setAttribute('aria-label', 'Year');
    this.listen(this.#yearSelect, 'change', () => {
      this.#viewYear = parseInt(this.#yearSelect.value, 10);
      this.#renderMonth();
      this.dispatchEvent(new CustomEvent('calendar:navigate', {
        bubbles: true, detail: { year: this.#viewYear, month: this.#viewMonth + 1 }
      }));
    });

    const yearWrap = document.createElement('span');
    yearWrap.className = 'calendar-year-wrap';
    yearWrap.appendChild(this.#yearSelect);
    this.#titleContainer.append(this.#monthLabel, ' ', yearWrap);

    this.#nextBtn = document.createElement('button');
    this.#nextBtn.type = 'button';
    this.#nextBtn.setAttribute('aria-label', 'Next month');
    this.#nextBtn.textContent = '\u203A';
    this.listen(this.#nextBtn, 'click', () => this.#navigate(1));

    this.#header.append(this.#prevBtn, this.#titleContainer, this.#nextBtn);
    this.appendChild(this.#header);

    // Banner — purely decorative surface for theme imagery
    const banner = document.createElement('div');
    banner.className = 'calendar-banner';
    banner.setAttribute('aria-hidden', 'true');
    this.appendChild(banner);

    // Months wrapper — holds 1..N month grids side by side
    this.#monthsWrap = document.createElement('div');
    this.#monthsWrap.className = 'cal-months';
    this.appendChild(this.#monthsWrap);

    // Click delegation — select or open day detail (not both)
    this.listen(this.#monthsWrap, 'click', (e) => {
      const btn = e.target.closest('button[data-date]');
      if (!btn || btn.disabled) return;
      const iso = btn.getAttribute('data-date');

      if (this.#selectionMode !== 'none') {
        this.#handleSelect(iso);
      } else {
        // Display-only mode: open day detail if events exist
        const events = normalizeEvents(this.#events[iso]);
        if (events.length) this.#openDayDetail(iso, events);
      }
    });

    // Keyboard navigation — delegated on the wrapper
    this.listen(this.#monthsWrap, 'keydown', (e) => this.#handleKey(e));

    // Hover for range preview — in-place attribute update, no re-render
    if (this.#selectionMode === 'range') {
      this.listen(this.#monthsWrap, 'mouseover', (e) => {
        const btn = e.target.closest('button[data-date]');
        if (btn && this.#rangeStart && !this.#rangeEnd) {
          this.#hoverDate = fromISO(btn.getAttribute('data-date'));
          this.#updateSelectionUI();
        }
      });
    }
  }

  #buildYearOptions() {
    this.#yearSelect.innerHTML = '';
    const currentYear = new Date().getFullYear();
    const minYear = this.#minDate ? this.#minDate.getFullYear() : currentYear - 10;
    const maxYear = this.#maxDate ? this.#maxDate.getFullYear() : currentYear + 10;
    for (let y = minYear; y <= maxYear; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === this.#viewYear) opt.selected = true;
      this.#yearSelect.appendChild(opt);
    }
  }

  #navigate(direction) {
    this.#viewMonth += direction;
    if (this.#viewMonth < 0) { this.#viewMonth = 11; this.#viewYear--; }
    if (this.#viewMonth > 11) { this.#viewMonth = 0; this.#viewYear++; }
    this.#renderMonth();
    this.dispatchEvent(new CustomEvent('calendar:navigate', {
      bubbles: true,
      detail: { year: this.#viewYear, month: this.#viewMonth + 1 }
    }));
  }

  #handleSelect(iso) {
    if (this.#selectionMode === 'none') return;
    const date = fromISO(iso);

    if (this.#selectionMode === 'single') {
      this.#selectedDate = date;
      this.#updateSelectionUI();
      this.#syncFormValue();
      this.dispatchEvent(new CustomEvent('calendar:select', {
        bubbles: true, detail: { value: iso, date }
      }));
    } else if (this.#selectionMode === 'range') {
      if (!this.#rangeStart || this.#rangeEnd) {
        this.#rangeStart = date;
        this.#rangeEnd = null;
        this.#hoverDate = null;
        this.dataset.tentative = toISO(this.#rangeStart);
      } else {
        this.#rangeEnd = date;
        if (this.#rangeStart > this.#rangeEnd) {
          [this.#rangeStart, this.#rangeEnd] = [this.#rangeEnd, this.#rangeStart];
        }
        this.#hoverDate = null;
        delete this.dataset.tentative;
        const startISO = toISO(this.#rangeStart);
        const endISO = toISO(this.#rangeEnd);
        this.dispatchEvent(new CustomEvent('calendar:select', {
          bubbles: true,
          detail: {
            value: `${startISO}/${endISO}`,
            start: startISO, end: endISO,
            startDate: this.#rangeStart, endDate: this.#rangeEnd,
          }
        }));
      }
      this.#updateSelectionUI();
      this.#syncFormValue();
    } else if (this.#selectionMode === 'multi') {
      if (this.#selectedDates.has(iso)) {
        this.#selectedDates.delete(iso);
      } else {
        this.#selectedDates.add(iso);
      }
      this.#updateSelectionUI();
      this.#syncFormValue();
      const sorted = [...this.#selectedDates].sort();
      this.dispatchEvent(new CustomEvent('calendar:select', {
        bubbles: true,
        detail: { values: sorted, dates: sorted.map(fromISO) }
      }));
    }
  }

  /** Sync form value via ElementInternals when participating in a form */
  #syncFormValue() {
    if (this.#internals && this.getAttribute('name')) {
      this.#internals.setFormValue(this.value);
    }
  }

  /** Return the current selection as a serializable value */
  get value() {
    switch (this.#selectionMode) {
      case 'single':
        return this.#selectedDate ? toISO(this.#selectedDate) : null;
      case 'range':
        if (this.#rangeStart && this.#rangeEnd) {
          return `${toISO(this.#rangeStart)}/${toISO(this.#rangeEnd)}`;
        }
        return this.#rangeStart ? toISO(this.#rangeStart) : null;
      case 'multi':
        return this.#selectedDates.size
          ? [...this.#selectedDates].sort().join(' ')
          : null;
      default:
        return null;
    }
  }

  /** Update selection/range attributes in-place without rebuilding DOM */
  #updateSelectionUI() {
    if (!this.#monthsWrap) return;

    const rangeA = this.#rangeStart;
    const rangeB = this.#rangeEnd || this.#hoverDate;

    for (const td of this.#monthsWrap.querySelectorAll('td')) {
      const btn = td.querySelector('button[data-date]');
      if (!btn) continue;

      const iso = btn.getAttribute('data-date');
      const cellDate = fromISO(iso);

      // Clear old selection attributes
      td.removeAttribute('data-selected');
      td.removeAttribute('data-range-start');
      td.removeAttribute('data-range-end');
      td.removeAttribute('data-in-range');
      btn.removeAttribute('aria-selected');

      // Single selection
      if (this.#selectionMode === 'single' && sameDay(cellDate, this.#selectedDate)) {
        td.setAttribute('data-selected', '');
        btn.setAttribute('aria-selected', 'true');
      }

      // Multi selection
      if (this.#selectionMode === 'multi' && this.#selectedDates.has(iso)) {
        td.setAttribute('data-selected', '');
        btn.setAttribute('aria-selected', 'true');
      }

      // Range selection
      if (this.#selectionMode === 'range' && rangeA) {
        if (rangeB) {
          const lo = rangeA < rangeB ? rangeA : rangeB;
          const hi = rangeA < rangeB ? rangeB : rangeA;
          if (sameDay(cellDate, lo)) td.setAttribute('data-range-start', '');
          if (sameDay(cellDate, hi)) td.setAttribute('data-range-end', '');
          if (cellDate >= lo && cellDate <= hi) td.setAttribute('data-in-range', '');
        } else if (sameDay(cellDate, rangeA)) {
          td.setAttribute('data-range-start', '');
        }
      }
    }
  }

  /** Compute (year, month) for a given offset from the current view */
  #offsetMonth(offset) {
    const d = new Date(this.#viewYear, this.#viewMonth + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }

  #renderMonth() {
    const n = this.#monthCount;

    // ── Update title ──
    try {
      const first = new Date(this.#viewYear, this.#viewMonth, 1);
      const fmtMonth = new Intl.DateTimeFormat(undefined, { month: 'long' });
      if (n === 1) {
        this.#monthLabel.textContent = fmtMonth.format(first);
      } else {
        const last = this.#offsetMonth(n - 1);
        const lastDate = new Date(last.year, last.month, 1);
        const firstName = fmtMonth.format(first);
        const lastName = fmtMonth.format(lastDate);
        if (first.getFullYear() === last.year) {
          this.#monthLabel.textContent = `${firstName} \u2013 ${lastName}`;
        } else {
          const fmtFull = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
          this.#monthLabel.textContent = `${fmtFull.format(first)} \u2013 ${fmtFull.format(lastDate)}`;
        }
      }
    } catch {
      this.#monthLabel.textContent = String(this.#viewMonth + 1);
    }
    this.#buildYearOptions();

    // ── Constrain prev/next navigation at min/max boundaries ──
    this.#prevBtn.disabled = !!(this.#minDate && (
      this.#viewYear < this.#minDate.getFullYear() ||
      (this.#viewYear === this.#minDate.getFullYear() &&
       this.#viewMonth <= this.#minDate.getMonth())));

    const lastVis = this.#offsetMonth(n - 1);
    this.#nextBtn.disabled = !!(this.#maxDate && (
      lastVis.year > this.#maxDate.getFullYear() ||
      (lastVis.year === this.#maxDate.getFullYear() &&
       lastVis.month >= this.#maxDate.getMonth())));

    // Sync host attributes for theme CSS selectors
    this.setAttribute('data-month', String(this.#viewMonth + 1));
    this.setAttribute('data-year', String(this.#viewYear));

    // ── Build month grids ──
    this.#monthsWrap.innerHTML = '';

    for (let i = 0; i < n; i++) {
      const { year, month } = this.#offsetMonth(i);
      const table = this.#buildMonthTable(year, month);
      this.#monthsWrap.appendChild(table);
    }

    // Keep #grid pointing at the first table for keyboard nav compatibility
    this.#grid = this.#monthsWrap.querySelector('table');
  }

  /** Build a complete month table (thead + tbody) for the given year/month */
  #buildMonthTable(year, month) {
    const today = new Date();
    const totalDays = daysInMonth(year, month);
    const isLarge = this.#size === 'large';

    const table = document.createElement('table');
    table.setAttribute('role', 'grid');
    try {
      const titleDate = new Date(year, month, 1);
      const monthName = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(titleDate);
      table.setAttribute('aria-label', `${monthName} ${year}`);
    } catch { /* fallback — no label */ }

    // Weekday headers
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const shortDays = getLocalizedDays(this.#locale, 'short');
    const longDays = getLocalizedDays(this.#locale, 'long');
    for (let i = 0; i < 7; i++) {
      const dayIdx = (this.#firstDayOfWeek + i) % 7;
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.setAttribute('abbr', longDays[dayIdx]);
      th.textContent = shortDays[dayIdx];
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    let weekIdx = 1;
    let row = document.createElement('tr');
    row.setAttribute('data-week', String(weekIdx));

    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = (firstDay - this.#firstDayOfWeek + 7) % 7;

    // Leading cells: previous month's trailing days
    const prevMonthDays = daysInMonth(year, month - 1);
    for (let i = 0; i < startOffset; i++) {
      const dayNum = prevMonthDays - startOffset + 1 + i;
      const td = document.createElement('td');
      td.setAttribute('data-outside-month', '');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.disabled = true;
      btn.setAttribute('tabindex', '-1');
      btn.setAttribute('data-day', String(dayNum));
      const span = document.createElement('span');
      span.className = 'day-number';
      span.textContent = String(dayNum);
      btn.appendChild(span);
      td.appendChild(btn);
      row.appendChild(td);
    }

    const rangeA = this.#rangeStart;
    const rangeB = this.#rangeEnd || this.#hoverDate;

    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      const iso = toISO(cellDate);
      const td = document.createElement('td');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-date', iso);

      // Day number
      const dayNum = document.createElement('span');
      dayNum.className = 'day-number';
      dayNum.textContent = String(day);
      btn.appendChild(dayNum);
      btn.setAttribute('data-day', String(day));

      // Today
      if (sameDay(cellDate, today)) {
        btn.setAttribute('aria-current', 'date');
        td.setAttribute('data-today', '');
      }

      // Selected
      if (this.#selectionMode === 'single' && sameDay(cellDate, this.#selectedDate)) {
        btn.setAttribute('aria-selected', 'true');
        td.setAttribute('data-selected', '');
      }

      // Multi selection
      if (this.#selectionMode === 'multi' && this.#selectedDates.has(iso)) {
        btn.setAttribute('aria-selected', 'true');
        td.setAttribute('data-selected', '');
      }

      // Range
      if (this.#selectionMode === 'range' && rangeA && rangeB) {
        const lo = rangeA < rangeB ? rangeA : rangeB;
        const hi = rangeA < rangeB ? rangeB : rangeA;
        if (sameDay(cellDate, lo)) td.setAttribute('data-range-start', '');
        if (sameDay(cellDate, hi)) td.setAttribute('data-range-end', '');
        if (cellDate >= lo && cellDate <= hi) td.setAttribute('data-in-range', '');
      } else if (this.#selectionMode === 'range' && rangeA && sameDay(cellDate, rangeA)) {
        td.setAttribute('data-range-start', '');
      }

      // Disabled — explicit list, outside min/max range, or isDateDisallowed callback
      const beforeMin = this.#minDate && cellDate < this.#minDate;
      const afterMax = this.#maxDate && cellDate > this.#maxDate;
      const dynamicDisabled = typeof this.isDateDisallowed === 'function' && this.isDateDisallowed(cellDate);
      if (this.#disabledDates.has(iso) || beforeMin || afterMax || dynamicDisabled) {
        btn.setAttribute('aria-disabled', 'true');
        btn.disabled = true;
      }

      // Highlighted
      if (this.#highlightDates.has(iso)) {
        btn.setAttribute('data-highlight', this.#highlightDates.get(iso) || '');
      }

      // Day parts callback
      if (typeof this.getDayParts === 'function') {
        const parts = this.getDayParts(cellDate);
        if (parts != null) {
          td.dataset.dayPart = Array.isArray(parts) ? parts.join(' ') : parts;
        }
      }

      // Events
      const events = normalizeEvents(this.#events[iso]);
      if (events.length) {
        td.setAttribute('data-events', '');
        td.setAttribute('data-event-count', String(events.length));

        if (isLarge) {
          // Large mode: show event labels in cell
          const eventList = document.createElement('span');
          eventList.className = 'event-list';
          const maxShow = 2;
          events.slice(0, maxShow).forEach(evt => {
            const item = document.createElement('span');
            item.className = 'event-item';
            if (evt.color) item.style.setProperty('--event-color', evt.color);
            if (evt.icon) {
              const icon = document.createElement('icon-wc');
              icon.setAttribute('name', evt.icon);
              icon.setAttribute('size', 'xs');
              item.appendChild(icon);
            }
            const text = document.createElement('span');
            text.textContent = evt.time ? `${evt.time} ${evt.label}` : evt.label;
            item.appendChild(text);
            eventList.appendChild(item);
          });
          if (events.length > maxShow) {
            const more = document.createElement('span');
            more.className = 'event-more';
            more.textContent = `+${events.length - maxShow} more`;
            eventList.appendChild(more);
          }
          btn.appendChild(eventList);
        } else {
          // Default/compact: dot indicators
          const dotContainer = document.createElement('span');
          dotContainer.className = 'event-dots';
          dotContainer.setAttribute('aria-hidden', 'true');
          const dotCount = Math.min(events.length, 3);
          for (let d = 0; d < dotCount; d++) {
            const dot = document.createElement('span');
            dot.setAttribute('data-event-dot', '');
            if (events[d].color) dot.style.setProperty('--event-color', events[d].color);
            dotContainer.appendChild(dot);
          }
          td.appendChild(dotContainer);
        }

        // Tooltip with all event labels
        const titles = events.map(e => e.time ? `${e.time} — ${e.label}` : e.label);
        btn.setAttribute('title', titles.join('\n'));
      }

      // Focus management
      const isFocusTarget = day === 1 || sameDay(cellDate, today);
      btn.setAttribute('tabindex', isFocusTarget ? '0' : '-1');

      td.insertBefore(btn, td.firstChild);
      row.appendChild(td);

      if ((startOffset + day) % 7 === 0) {
        tbody.appendChild(row);
        weekIdx++;
        row = document.createElement('tr');
        row.setAttribute('data-week', String(weekIdx));
      }
    }

    // Trailing cells: next month's leading days
    const remaining = (startOffset + totalDays) % 7;
    if (remaining > 0) {
      for (let i = 1; i <= 7 - remaining; i++) {
        const td = document.createElement('td');
        td.setAttribute('data-outside-month', '');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.disabled = true;
        btn.setAttribute('tabindex', '-1');
        btn.setAttribute('data-day', String(i));
        const span = document.createElement('span');
        span.className = 'day-number';
        span.textContent = String(i);
        btn.appendChild(span);
        td.appendChild(btn);
        row.appendChild(td);
      }
      tbody.appendChild(row);
    }

    table.appendChild(tbody);
    return table;
  }

  // ── Day detail overlay ────────────────────────────────────────────

  #openDayDetail(iso, events) {
    this.#closeDayDetail();

    const date = fromISO(iso);
    const overlay = document.createElement('div');
    overlay.className = 'day-detail';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', `Events for ${iso}`);

    // Header
    const header = document.createElement('header');
    const title = document.createElement('h3');
    try {
      title.textContent = new Intl.DateTimeFormat(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      }).format(date);
    } catch {
      title.textContent = iso;
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', () => this.#closeDayDetail());

    header.append(title, closeBtn);
    overlay.appendChild(header);

    // Event list
    const list = document.createElement('ul');
    events.forEach(evt => {
      const li = document.createElement('li');
      if (evt.color) li.style.setProperty('--event-color', evt.color);

      const dot = document.createElement('span');
      dot.className = 'detail-dot';

      const content = document.createElement('span');
      content.className = 'detail-content';

      if (evt.icon) {
        const icon = document.createElement('icon-wc');
        icon.setAttribute('name', evt.icon);
        icon.setAttribute('size', 'sm');
        content.appendChild(icon);
      }

      const label = document.createElement('span');
      label.className = 'detail-label';
      label.textContent = evt.label || '';

      const time = evt.time ? document.createElement('span') : null;
      if (time) {
        time.className = 'detail-time';
        time.textContent = evt.time;
      }

      content.append(label);
      if (time) li.append(time);
      li.append(dot, content);
      list.appendChild(li);
    });
    overlay.appendChild(list);

    // Hour grid for day view
    if (events.some(e => e.time)) {
      const dayView = document.createElement('div');
      dayView.className = 'day-hours';

      // Build sparse hour grid with only event hours
      const eventsByHour = new Map();
      events.forEach(evt => {
        if (!evt.time) return;
        const hour = parseInt(evt.time.split(':')[0], 10);
        if (!eventsByHour.has(hour)) eventsByHour.set(hour, []);
        eventsByHour.get(hour).push(evt);
      });

      if (eventsByHour.size > 0) {
        const hoursSection = document.createElement('div');
        hoursSection.className = 'hour-grid';

        const sortedHours = [...eventsByHour.keys()].sort((a, b) => a - b);
        // Show from one hour before first to one hour after last
        const startH = Math.max(0, sortedHours[0] - 1);
        const endH = Math.min(23, sortedHours[sortedHours.length - 1] + 1);

        const localHours = getLocalizedHours(this.#locale);
        for (let h = startH; h <= endH; h++) {
          const hourRow = document.createElement('div');
          hourRow.className = 'hour-row';

          const hourLabel = document.createElement('span');
          hourLabel.className = 'hour-label';
          hourLabel.textContent = localHours[h];

          const hourContent = document.createElement('span');
          hourContent.className = 'hour-content';

          const hourEvents = eventsByHour.get(h) || [];
          hourEvents.forEach(evt => {
            const chip = document.createElement('span');
            chip.className = 'hour-event';
            if (evt.color) chip.style.setProperty('--event-color', evt.color);
            if (evt.icon) {
              const icon = document.createElement('icon-wc');
              icon.setAttribute('name', evt.icon);
              icon.setAttribute('size', 'xs');
              chip.appendChild(icon);
            }
            chip.append(evt.label || '');
            hourContent.appendChild(chip);
          });

          hourRow.append(hourLabel, hourContent);
          hoursSection.appendChild(hourRow);
        }
        dayView.appendChild(hoursSection);
        overlay.appendChild(dayView);
      }
    }

    this.appendChild(overlay);
    this.#detailOverlay = overlay;

    // Close on Escape
    const onKey = (e) => {
      if (e.key === 'Escape') this.#closeDayDetail();
    };

    // Close on click outside the overlay
    const onClick = (e) => {
      if (!overlay.contains(e.target)) this.#closeDayDetail();
    };

    this._detailCleanup = () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };

    document.addEventListener('keydown', onKey);
    // Use mousedown + rAF to skip the current event that opened the overlay
    requestAnimationFrame(() => {
      document.addEventListener('mousedown', onClick);
    });

    this.dispatchEvent(new CustomEvent('calendar:day-open', {
      bubbles: true, detail: { date: iso, events }
    }));
  }

  #closeDayDetail() {
    if (this.#detailOverlay) {
      this._detailCleanup?.();
      this._detailCleanup = null;
      this.#detailOverlay.remove();
      this.#detailOverlay = null;
    }
  }

  teardown() {
    delete this.dataset.tentative;
    this.#closeDayDetail();
  }

  // ── Keyboard navigation ───────────────────────────────────────────

  #handleKey(e) {
    const focused = this.#monthsWrap.querySelector('button[tabindex="0"]');
    if (!focused) return;

    const iso = focused.getAttribute('data-date');
    const date = fromISO(iso);
    if (!date) return;

    let newDate;
    switch (e.key) {
      case 'ArrowRight': newDate = new Date(date); newDate.setDate(date.getDate() + 1); break;
      case 'ArrowLeft': newDate = new Date(date); newDate.setDate(date.getDate() - 1); break;
      case 'ArrowDown': newDate = new Date(date); newDate.setDate(date.getDate() + 7); break;
      case 'ArrowUp': newDate = new Date(date); newDate.setDate(date.getDate() - 7); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!focused.disabled) this.#handleSelect(iso);
        return;
      default: return;
    }

    e.preventDefault();

    // Block keyboard navigation outside min/max bounds
    if (this.#minDate && newDate < this.#minDate) return;
    if (this.#maxDate && newDate > this.#maxDate) return;

    // Check if the new date is within the currently visible months
    const newM = newDate.getMonth();
    const newY = newDate.getFullYear();
    const lastVis = this.#offsetMonth(this.#monthCount - 1);
    const inView = (newY > this.#viewYear || (newY === this.#viewYear && newM >= this.#viewMonth)) &&
                   (newY < lastVis.year || (newY === lastVis.year && newM <= lastVis.month));

    if (!inView) {
      // Shift view so the new date is visible
      this.#viewMonth = newM;
      this.#viewYear = newY;
      this.#renderMonth();
    }

    const newISO = toISO(newDate);
    const newBtn = this.#monthsWrap.querySelector(`button[data-date="${newISO}"]`);
    if (newBtn) {
      this.#monthsWrap.querySelectorAll('button[tabindex="0"]').forEach(b => b.setAttribute('tabindex', '-1'));
      newBtn.setAttribute('tabindex', '0');
      newBtn.focus();
    }
  }
}

registerComponent('calendar-wc', CalendarWc);

export { CalendarWc };
