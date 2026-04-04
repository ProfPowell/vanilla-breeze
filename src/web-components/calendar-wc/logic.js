/**
 * calendar-wc: Standalone calendar display with rich cell content
 *
 * Display component for showing events, availability, or annotations on
 * dates. NOT a form input — use date-picker for date selection in forms.
 * Supports single and range selection, event dot indicators, and
 * month/year navigation with keyboard support.
 *
 * @attr {string}  data-month          - Initial month (1-12). Defaults to current.
 * @attr {string}  data-year           - Initial year. Defaults to current.
 * @attr {string}  data-events         - JSON: { "YYYY-MM-DD": "label" } or { "YYYY-MM-DD": { "label": "...", "color": "..." } }
 * @attr {string}  data-selection      - Selection mode: "none" (default), "single", "range"
 * @attr {string}  data-disabled-dates - Comma-separated ISO dates to disable
 * @attr {string}  data-highlight-dates - Comma-separated ISO dates to highlight (optionally with :category)
 *
 * @example
 * <calendar-wc data-events='{"2026-04-10":"Team meeting","2026-04-15":"Deadline"}'></calendar-wc>
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

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Component ───────────────────────────────────────────────────────

class CalendarWc extends VBElement {
  #viewMonth;
  #viewYear;
  #firstDayOfWeek;
  #events = {};
  #disabledDates = new Set();
  #highlightDates = new Map();
  #selectedDate = null;
  #rangeStart = null;
  #rangeEnd = null;
  #hoverDate = null;
  #selectionMode = 'none';

  // DOM refs
  #header;
  #title;
  #grid;
  #prevBtn;
  #nextBtn;

  setup() {
    const today = new Date();
    this.#viewMonth = parseInt(this.getAttribute('data-month'), 10) - 1;
    if (isNaN(this.#viewMonth)) this.#viewMonth = today.getMonth();
    this.#viewYear = parseInt(this.getAttribute('data-year'), 10);
    if (isNaN(this.#viewYear)) this.#viewYear = today.getFullYear();
    this.#firstDayOfWeek = getFirstDayOfWeek();
    this.#selectionMode = this.getAttribute('data-selection') || 'none';

    // Parse events
    const eventsAttr = this.getAttribute('data-events');
    if (eventsAttr) {
      try { this.#events = JSON.parse(eventsAttr); } catch { /* ignore */ }
    }

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

    this.#title = document.createElement('span');
    this.#title.setAttribute('aria-live', 'polite');

    this.#nextBtn = document.createElement('button');
    this.#nextBtn.type = 'button';
    this.#nextBtn.setAttribute('aria-label', 'Next month');
    this.#nextBtn.textContent = '\u203A';
    this.listen(this.#nextBtn, 'click', () => this.#navigate(1));

    this.#header.append(this.#prevBtn, this.#title, this.#nextBtn);
    this.appendChild(this.#header);

    // Grid
    this.#grid = document.createElement('table');
    this.#grid.setAttribute('role', 'grid');

    // Weekday headers
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (let i = 0; i < 7; i++) {
      const dayIdx = (this.#firstDayOfWeek + i) % 7;
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.setAttribute('abbr', DAYS_FULL[dayIdx]);
      th.textContent = DAYS[dayIdx];
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    this.#grid.appendChild(thead);
    this.appendChild(this.#grid);

    // Keyboard navigation
    this.listen(this.#grid, 'keydown', (e) => this.#handleKey(e));

    // Click delegation
    this.listen(this.#grid, 'click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;
      const iso = btn.getAttribute('data-date');
      if (iso) this.#handleSelect(iso);
    });

    // Hover for range preview
    if (this.#selectionMode === 'range') {
      this.listen(this.#grid, 'mouseover', (e) => {
        const btn = e.target.closest('button[data-date]');
        if (btn && this.#rangeStart && !this.#rangeEnd) {
          this.#hoverDate = fromISO(btn.getAttribute('data-date'));
          this.#renderMonth();
        }
      });
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
      this.#renderMonth();
      this.dispatchEvent(new CustomEvent('calendar:select', {
        bubbles: true, detail: { value: iso, date }
      }));
    } else if (this.#selectionMode === 'range') {
      if (!this.#rangeStart || this.#rangeEnd) {
        // Start new range
        this.#rangeStart = date;
        this.#rangeEnd = null;
        this.#hoverDate = null;
      } else {
        // Complete range
        this.#rangeEnd = date;
        // Ensure start < end
        if (this.#rangeStart > this.#rangeEnd) {
          [this.#rangeStart, this.#rangeEnd] = [this.#rangeEnd, this.#rangeStart];
        }
        this.#hoverDate = null;
        this.dispatchEvent(new CustomEvent('calendar:select', {
          bubbles: true,
          detail: {
            start: toISO(this.#rangeStart),
            end: toISO(this.#rangeEnd),
            startDate: this.#rangeStart,
            endDate: this.#rangeEnd,
          }
        }));
      }
      this.#renderMonth();
    }
  }

  #renderMonth() {
    const today = new Date();
    const totalDays = daysInMonth(this.#viewYear, this.#viewMonth);

    // Update title
    try {
      const titleDate = new Date(this.#viewYear, this.#viewMonth, 1);
      this.#title.textContent = new Intl.DateTimeFormat(undefined, {
        month: 'long', year: 'numeric'
      }).format(titleDate);
      this.#grid.setAttribute('aria-label', this.#title.textContent);
    } catch {
      this.#title.textContent = `${this.#viewMonth + 1}/${this.#viewYear}`;
    }

    // Remove old tbody
    const oldTbody = this.#grid.querySelector('tbody');
    if (oldTbody) oldTbody.remove();

    const tbody = document.createElement('tbody');
    let row = document.createElement('tr');

    // Calculate start offset
    const firstDay = new Date(this.#viewYear, this.#viewMonth, 1).getDay();
    const startOffset = (firstDay - this.#firstDayOfWeek + 7) % 7;

    // Leading empty cells
    for (let i = 0; i < startOffset; i++) {
      row.appendChild(document.createElement('td'));
    }

    // Range boundaries for highlighting
    const rangeA = this.#rangeStart;
    const rangeB = this.#rangeEnd || this.#hoverDate;

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
        td.setAttribute('data-today', '');
      }

      // Selected (single)
      if (this.#selectionMode === 'single' && sameDay(cellDate, this.#selectedDate)) {
        btn.setAttribute('aria-selected', 'true');
        td.setAttribute('data-selected', '');
      }

      // Range highlighting
      if (this.#selectionMode === 'range' && rangeA && rangeB) {
        const lo = rangeA < rangeB ? rangeA : rangeB;
        const hi = rangeA < rangeB ? rangeB : rangeA;
        if (sameDay(cellDate, lo)) td.setAttribute('data-range-start', '');
        if (sameDay(cellDate, hi)) td.setAttribute('data-range-end', '');
        if (cellDate >= lo && cellDate <= hi) td.setAttribute('data-in-range', '');
      } else if (this.#selectionMode === 'range' && rangeA && sameDay(cellDate, rangeA)) {
        td.setAttribute('data-range-start', '');
      }

      // Disabled
      if (this.#disabledDates.has(iso)) {
        btn.setAttribute('aria-disabled', 'true');
        btn.disabled = true;
      }

      // Highlighted
      if (this.#highlightDates.has(iso)) {
        const cat = this.#highlightDates.get(iso);
        btn.setAttribute('data-highlight', cat || '');
      }

      // Events
      const eventData = this.#events[iso];
      if (eventData) {
        td.setAttribute('data-events', '');
        const dot = document.createElement('span');
        dot.setAttribute('data-event-dot', '');
        dot.setAttribute('aria-hidden', 'true');
        if (typeof eventData === 'object' && eventData.color) {
          dot.style.setProperty('--event-color', eventData.color);
        }
        const label = typeof eventData === 'string' ? eventData : eventData.label;
        if (label) btn.setAttribute('title', label);
        td.appendChild(dot);
      }

      // Focus management
      const isFocusTarget = day === 1 || sameDay(cellDate, today);
      btn.setAttribute('tabindex', isFocusTarget ? '0' : '-1');

      td.insertBefore(btn, td.firstChild);
      row.appendChild(td);

      if ((startOffset + day) % 7 === 0) {
        tbody.appendChild(row);
        row = document.createElement('tr');
      }
    }

    // Trailing empty cells
    const remaining = (startOffset + totalDays) % 7;
    if (remaining > 0) {
      for (let i = remaining; i < 7; i++) {
        row.appendChild(document.createElement('td'));
      }
      tbody.appendChild(row);
    }

    this.#grid.appendChild(tbody);
  }

  #handleKey(e) {
    const focused = this.#grid.querySelector('button[tabindex="0"]');
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

    // Navigate months if needed
    if (newDate.getMonth() !== this.#viewMonth || newDate.getFullYear() !== this.#viewYear) {
      this.#viewMonth = newDate.getMonth();
      this.#viewYear = newDate.getFullYear();
      this.#renderMonth();
    }

    // Move focus
    const newISO = toISO(newDate);
    const newBtn = this.#grid.querySelector(`button[data-date="${newISO}"]`);
    if (newBtn) {
      this.#grid.querySelectorAll('button[tabindex="0"]').forEach(b => b.setAttribute('tabindex', '-1'));
      newBtn.setAttribute('tabindex', '0');
      newBtn.focus();
    }
  }
}

registerComponent('calendar-wc', CalendarWc);

export { CalendarWc };
