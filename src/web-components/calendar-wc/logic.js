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
 * @attr {string}  data-selection       - Selection mode: "none" (default), "single", "range"
 * @attr {string}  data-size            - Size: "compact", "default", "large"
 * @attr {string}  data-disabled-dates  - Comma-separated ISO dates to disable
 * @attr {string}  data-highlight-dates - Comma-separated ISO dates to highlight (optionally with :category)
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

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return `${h}:00 ${ampm}`;
});

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
  #size = 'default';

  // DOM refs
  #header;
  #titleContainer;
  #monthLabel;
  #yearSelect;
  #grid;
  #prevBtn;
  #nextBtn;
  #detailOverlay = null;

  setup() {
    const today = new Date();
    this.#viewMonth = parseInt(this.getAttribute('data-month'), 10) - 1;
    if (isNaN(this.#viewMonth)) this.#viewMonth = today.getMonth();
    this.#viewYear = parseInt(this.getAttribute('data-year'), 10);
    if (isNaN(this.#viewYear)) this.#viewYear = today.getFullYear();
    this.#firstDayOfWeek = getFirstDayOfWeek();
    this.#selectionMode = this.getAttribute('data-selection') || 'none';
    this.#size = this.getAttribute('data-size') || 'default';

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

    // Click delegation — select or open day detail (not both)
    this.listen(this.#grid, 'click', (e) => {
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

    // Hover for range preview — in-place attribute update, no re-render
    if (this.#selectionMode === 'range') {
      this.listen(this.#grid, 'mouseover', (e) => {
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
    const minYear = currentYear - 10;
    const maxYear = currentYear + 10;
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
      this.dispatchEvent(new CustomEvent('calendar:select', {
        bubbles: true, detail: { value: iso, date }
      }));
    } else if (this.#selectionMode === 'range') {
      if (!this.#rangeStart || this.#rangeEnd) {
        this.#rangeStart = date;
        this.#rangeEnd = null;
        this.#hoverDate = null;
      } else {
        this.#rangeEnd = date;
        if (this.#rangeStart > this.#rangeEnd) {
          [this.#rangeStart, this.#rangeEnd] = [this.#rangeEnd, this.#rangeStart];
        }
        this.#hoverDate = null;
        this.dispatchEvent(new CustomEvent('calendar:select', {
          bubbles: true,
          detail: {
            start: toISO(this.#rangeStart), end: toISO(this.#rangeEnd),
            startDate: this.#rangeStart, endDate: this.#rangeEnd,
          }
        }));
      }
      this.#updateSelectionUI();
    }
  }

  /** Update selection/range attributes in-place without rebuilding DOM */
  #updateSelectionUI() {
    const tbody = this.#grid.querySelector('tbody');
    if (!tbody) return;

    const rangeA = this.#rangeStart;
    const rangeB = this.#rangeEnd || this.#hoverDate;

    for (const td of tbody.querySelectorAll('td')) {
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

  #renderMonth() {
    const today = new Date();
    const totalDays = daysInMonth(this.#viewYear, this.#viewMonth);
    const isLarge = this.#size === 'large';

    // Update title
    try {
      const titleDate = new Date(this.#viewYear, this.#viewMonth, 1);
      const monthName = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(titleDate);
      this.#monthLabel.textContent = monthName;
      this.#grid.setAttribute('aria-label', `${monthName} ${this.#viewYear}`);
    } catch {
      this.#monthLabel.textContent = String(this.#viewMonth + 1);
    }
    this.#buildYearOptions();

    // Sync host attributes for theme CSS selectors
    this.setAttribute('data-month', String(this.#viewMonth + 1));
    this.setAttribute('data-year', String(this.#viewYear));

    // Remove old tbody
    const oldTbody = this.#grid.querySelector('tbody');
    if (oldTbody) oldTbody.remove();

    const tbody = document.createElement('tbody');
    let weekIdx = 1;
    let row = document.createElement('tr');
    row.setAttribute('data-week', String(weekIdx));

    const firstDay = new Date(this.#viewYear, this.#viewMonth, 1).getDay();
    const startOffset = (firstDay - this.#firstDayOfWeek + 7) % 7;

    // Leading cells: show previous month's trailing days (paper-calendar style)
    const prevMonthDays = daysInMonth(this.#viewYear, this.#viewMonth - 1);
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
      const cellDate = new Date(this.#viewYear, this.#viewMonth, day);
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

      // Disabled
      if (this.#disabledDates.has(iso)) {
        btn.setAttribute('aria-disabled', 'true');
        btn.disabled = true;
      }

      // Highlighted
      if (this.#highlightDates.has(iso)) {
        btn.setAttribute('data-highlight', this.#highlightDates.get(iso) || '');
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

    // Trailing cells: show next month's leading days (paper-calendar style)
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

    this.#grid.appendChild(tbody);
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

        for (let h = startH; h <= endH; h++) {
          const hourRow = document.createElement('div');
          hourRow.className = 'hour-row';

          const hourLabel = document.createElement('span');
          hourLabel.className = 'hour-label';
          hourLabel.textContent = HOURS[h];

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

  // ── Keyboard navigation ───────────────────────────────────────────

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

    if (newDate.getMonth() !== this.#viewMonth || newDate.getFullYear() !== this.#viewYear) {
      this.#viewMonth = newDate.getMonth();
      this.#viewYear = newDate.getFullYear();
      this.#renderMonth();
    }

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
