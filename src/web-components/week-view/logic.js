/**
 * week-view: 7-day time grid composing day-view-style columns
 *
 * Renders a weekly schedule as a semantic <table> styled with CSS Grid
 * and subgrid. Each column represents a day; each row an hour slot.
 * Events are <calendar-event> elements placed in the correct day/hour cell.
 *
 * Auto mode: place <calendar-event data-date="YYYY-MM-DD"> children
 * directly inside <week-view>. The component scans event dates and times,
 * computes the hour range, and builds the table automatically.
 *
 * @attr {string}        data-start-date - ISO date for first day of the week
 * @attr {number}        data-days       - Number of day columns (default: 7)
 * @attr {number|"auto"} data-start-hour - First visible hour (default: "auto")
 * @attr {number}        data-end-hour   - Last visible hour (default: 19)
 *
 * @example
 * <week-view data-start-date="2026-04-06">
 *   <calendar-event data-date="2026-04-06">
 *     <time datetime="09:00">9:00 AM</time>
 *     Sprint standup
 *   </calendar-event>
 * </week-view>
 */

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

class WeekView extends VBElement {
  #table;

  setup() {
    this.#table = this.querySelector('table');
    if (!this.#table) this.#buildAutoTable();
    if (!this.#table) return false;

    this.#positionSpanningEvents();

    // Click delegation
    this.listen(this.#table, 'click', (e) => {
      const event = e.target.closest('calendar-event');
      if (!event) return;
      const tr = event.closest('tr');
      const hourTime = tr?.querySelector('th time[datetime]');
      this.dispatchEvent(new CustomEvent('week-view:event-click', {
        bubbles: true,
        detail: {
          date: event.dataset.date,
          time: event.querySelector('time[datetime]')?.getAttribute('datetime')
            || hourTime?.getAttribute('datetime'),
          text: event.textContent.trim(),
          element: event,
          category: event.dataset.category,
          duration: event.dataset.duration,
        }
      }));
    });

    // Keyboard navigation
    this.#setupKeyboardNav();

    const firstEvent = this.#table.querySelector('calendar-event');
    if (firstEvent) firstEvent.setAttribute('tabindex', '0');
  }

  teardown() {
    this.querySelectorAll('calendar-event.wv-spanning').forEach(el => {
      el.style.cssText = '';
      el.classList.remove('wv-spanning');
    });
  }

  /** Re-measure and re-position spanning events */
  refresh() {
    this.teardown();
    this.#positionSpanningEvents();
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the week's events as a plain data array. Each entry:
   * `{ date, time, text, category?, duration? }`.
   */
  get events() {
    return [...this.querySelectorAll('calendar-event')].map(el => ({
      date: el.dataset.date || undefined,
      time: el.querySelector('time[datetime]')?.getAttribute('datetime') || undefined,
      text: el.textContent.trim(),
      category: el.dataset.category || undefined,
      duration: el.dataset.duration || undefined,
    }));
  }

  /**
   * Replace the week's events. Each entry needs `date` (ISO YYYY-MM-DD)
   * and `time` (HH:MM); other fields optional. Auto-builds the table
   * from the supplied events using the existing #buildAutoTable path.
   *
   * Emits week-view:events-changed { events, source: 'property' }.
   */
  set events(value) {
    const next = Array.isArray(value) ? value : [];
    while (this.firstChild) this.firstChild.remove();
    for (const e of next) {
      const el = document.createElement('calendar-event');
      if (e.date) el.dataset.date = e.date;
      if (e.category) el.dataset.category = e.category;
      if (e.duration) el.dataset.duration = String(e.duration);
      if (e.time) {
        const t = document.createElement('time');
        t.setAttribute('datetime', e.time);
        t.textContent = e.time;
        el.appendChild(t);
        el.appendChild(document.createTextNode(' '));
      }
      el.appendChild(document.createTextNode(e.text || ''));
      this.appendChild(el);
    }
    this.teardown();
    this.removeAttribute('data-upgraded');
    this.setup();
    this.dispatchEvent(new CustomEvent('week-view:events-changed', {
      detail: { events: next, source: 'property' },
      bubbles: true,
    }));
  }

  #buildAutoTable() {
    const events = [...this.querySelectorAll(':scope > calendar-event')];
    if (events.length === 0) return;

    const startDate = this.dataset.startDate;
    if (!startDate) return;

    const numDays = parseInt(this.dataset.days || '7', 10);
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);

    // Generate date range
    const dates = [];
    for (let i = 0; i < numDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    const dateISOs = dates.map(toISO);

    // Group events by date:hour
    const eventMap = new Map();
    const allHours = new Set();

    events.forEach(evt => {
      const date = evt.dataset.date;
      if (!date || !dateISOs.includes(date)) return;

      const timeEl = evt.querySelector('time[datetime]');
      if (!timeEl) return;
      const dt = timeEl.getAttribute('datetime');
      const parts = dt.split(':');
      const hour = parseInt(parts[0], 10);
      const min = parseInt(parts[1] || '0', 10);
      if (isNaN(hour)) return;

      if (min >= 30 && !evt.dataset.start) evt.dataset.start = '30';

      const hh = String(hour).padStart(2, '0');
      const key = `${date}:${hh}`;
      if (!eventMap.has(key)) eventMap.set(key, []);
      eventMap.get(key).push(evt);
      allHours.add(hour);
    });

    // Compute hour range
    const sortedHours = [...allHours].sort((a, b) => a - b);
    const autoRange = this.dataset.startHour === 'auto' || !this.dataset.startHour;
    const startH = autoRange
      ? (sortedHours.length > 0 ? Math.max(0, sortedHours[0] - 1) : 7)
      : parseInt(this.dataset.startHour, 10);
    const endH = autoRange
      ? (sortedHours.length > 0 ? Math.min(23, sortedHours[sortedHours.length - 1] + 1) : 19)
      : parseInt(this.dataset.endHour || '19', 10);

    // Locale formatting
    const locale = this.closest('[lang]')?.lang || navigator.language;
    const dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' });
    const hourFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric' });

    this.style.setProperty('--wv-days', numDays);

    // Build <table>
    const table = document.createElement('table');

    // <thead>
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const cornerTh = document.createElement('th');
    cornerTh.setAttribute('aria-label', 'Time');
    headerRow.appendChild(cornerTh);

    dates.forEach(d => {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      const time = document.createElement('time');
      time.setAttribute('datetime', toISO(d));
      time.textContent = dayFmt.format(d);
      th.appendChild(time);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // <tbody>
    const tbody = document.createElement('tbody');

    for (let h = startH; h <= endH; h++) {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.setAttribute('scope', 'row');
      const timeEl = document.createElement('time');
      const hh = String(h).padStart(2, '0');
      timeEl.setAttribute('datetime', `${hh}:00`);
      timeEl.textContent = hourFmt.format(new Date(2026, 0, 1, h));
      th.appendChild(timeEl);
      tr.appendChild(th);

      dateISOs.forEach(iso => {
        const td = document.createElement('td');
        const key = `${iso}:${hh}`;
        const cellEvents = eventMap.get(key) || [];

        if (cellEvents.length > 0) {
          const hourView = document.createElement('hour-view');
          if (cellEvents.length > 1) hourView.dataset.overlap = '';
          cellEvents.forEach(evt => hourView.appendChild(evt));
          td.appendChild(hourView);
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    this.appendChild(table);
    this.#table = table;
  }

  #positionSpanningEvents() {
    const tbody = this.#table.querySelector('tbody');
    if (!tbody) return;

    const spanningEvents = tbody.querySelectorAll('calendar-event[data-duration]');
    if (spanningEvents.length === 0) return;

    requestAnimationFrame(() => {
      const tbodyRect = tbody.getBoundingClientRect();

      // Measure row positions
      const rowMeasures = new Map();
      tbody.querySelectorAll(':scope > tr').forEach(tr => {
        const timeEl = tr.querySelector('th time[datetime]');
        if (!timeEl) return;
        const hour = parseInt(timeEl.getAttribute('datetime').split(':')[0], 10);
        const rect = tr.getBoundingClientRect();
        rowMeasures.set(hour, {
          top: rect.top - tbodyRect.top,
          height: rect.height,
        });
      });

      spanningEvents.forEach(event => {
        const td = event.closest('td');
        const tr = td?.closest('tr');
        if (!td || !tr) return;

        const timeEl = tr.querySelector('th time[datetime]');
        const startHour = parseInt(timeEl?.getAttribute('datetime')?.split(':')[0], 10);
        const startMin = parseInt(event.dataset.start || '0', 10);

        const dur = event.dataset.duration;
        let durationMinutes = 60;
        const hMatch = dur.match(/(\d+)h/);
        const mMatch = dur.match(/(\d+)m/);
        if (hMatch || mMatch) {
          durationMinutes = (hMatch ? parseInt(hMatch[1], 10) * 60 : 0)
                          + (mMatch ? parseInt(mMatch[1], 10) : 0);
        }

        const row = rowMeasures.get(startHour);
        if (!row) return;

        const tdRect = td.getBoundingClientRect();
        const minuteFraction = startMin / 60;
        const top = row.top + (row.height * minuteFraction);
        const height = row.height * (durationMinutes / 60);

        event.style.position = 'absolute';
        event.style.top = top + 'px';
        event.style.height = height + 'px';
        event.style.left = (tdRect.left - tbodyRect.left + 2) + 'px';
        event.style.right = (tbodyRect.right - tdRect.right + 2) + 'px';
        event.classList.add('wv-spanning');
      });
    });
  }

  #setupKeyboardNav() {
    this.listen(this.#table, 'keydown', (e) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      const current = e.target.closest('calendar-event');
      if (!current) return;

      const td = current.closest('td');
      const tr = td?.closest('tr');
      if (!td || !tr) return;

      const rows = [...tr.parentElement.children];
      const rowIdx = rows.indexOf(tr);
      const cells = [...tr.children];
      const colIdx = cells.indexOf(td);

      let target = null;

      if (e.key === 'ArrowDown') {
        for (let r = rowIdx + 1; r < rows.length; r++) {
          const evt = rows[r].children[colIdx]?.querySelector('calendar-event');
          if (evt) { target = evt; break; }
        }
      } else if (e.key === 'ArrowUp') {
        for (let r = rowIdx - 1; r >= 0; r--) {
          const evt = rows[r].children[colIdx]?.querySelector('calendar-event');
          if (evt) { target = evt; break; }
        }
      } else if (e.key === 'ArrowRight') {
        for (let c = colIdx + 1; c < cells.length; c++) {
          const evt = cells[c]?.querySelector('calendar-event');
          if (evt) { target = evt; break; }
        }
      } else if (e.key === 'ArrowLeft') {
        for (let c = colIdx - 1; c >= 1; c--) {
          const evt = cells[c]?.querySelector('calendar-event');
          if (evt) { target = evt; break; }
        }
      }

      if (target) {
        e.preventDefault();
        target.setAttribute('tabindex', '0');
        current.setAttribute('tabindex', '-1');
        target.focus();
      }
    });
  }
}

registerComponent('week-view', WeekView);
export { WeekView };
