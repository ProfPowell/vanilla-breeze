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
 *                                         (default: the current week, starting
 *                                         on the locale's first day of week)
 * @attr {number}        data-days       - Number of day columns, 1-14 (default: 7)
 * @attr {number|"auto"} data-start-hour - First visible hour (default: "auto")
 * @attr {number}        data-end-hour   - Last visible hour (default: 19)
 * @attr {string}        data-label-continues - Text appended to a clipped span's name
 * @attr {string}        data-label-time - Name of the corner (hours) column header
 *
 * Changing any of these attributes after upgrade rebuilds a generated table.
 * Today's day header carries aria-current="date". Events whose date is
 * outside the range (or that have no time) are not placed and are hidden.
 *
 * Times ("HH:MM" or full ISO) and durations are read with lib/time-grid.js,
 * the same parser <day-view> uses. A fixed hour range grows to fit events
 * outside it. Overlapping spans in one day column share it in columns.
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
import { usableLocale } from '../../lib/i18n.js';
import { parseTime, parseDuration, layoutColumns, eventLabel, DEFAULT_DURATION_MINUTES, SPAN_STYLE_PROPS, sharesHalfHour } from '../../lib/time-grid.js';

const NAV_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
const REBUILD_ATTRS = [
  'data-start-date', 'data-days', 'data-start-hour', 'data-end-hour',
  'data-label-time', 'data-label-continues',
];
/** Regions whose week starts on Sunday, for engines without Intl weekInfo. */
const SUNDAY_REGIONS = new Set(['US', 'CA', 'MX', 'BR', 'JP', 'KR', 'TW', 'HK', 'PH', 'IL', 'IN', 'ZA', 'SA', 'PE', 'CO', 'VE', 'GT', 'HN', 'NI', 'PA', 'PR', 'DO', 'AR']);


/** @param {Date} d */
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Locale's first day of the week, 1 (Monday) … 7 (Sunday).
 * @param {string} locale
 * @returns {number}
 */
function firstDayOfWeek(locale) {
  try {
    const loc = /** @type {any} */ (new Intl.Locale(locale));
    const info = typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : loc.weekInfo;
    if (info && Number.isInteger(info.firstDay)) return info.firstDay;
    const region = loc.maximize?.().region;
    return region && SUNDAY_REGIONS.has(region) ? 7 : 1;
  } catch {
    return 1;
  }
}

/**
 * First day of the week containing `today`, aligned to the locale.
 * @param {string} locale
 * @param {Date} today
 */
function weekStart(locale, today) {
  const first = firstDayOfWeek(locale) % 7; // JS getDay(): 0 = Sunday
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setDate(d.getDate() - ((d.getDay() - first + 7) % 7));
  return d;
}

/** @param {string | undefined} value */
function clampDays(value) {
  const n = parseInt(value ?? '', 10);
  return Number.isNaN(n) ? 7 : Math.min(14, Math.max(1, n));
}

/**
 * @param {string | undefined} value
 * @param {number} fallback
 */
function readHour(value, fallback) {
  const n = parseInt(value ?? '', 10);
  return Number.isNaN(n) ? fallback : Math.min(23, Math.max(0, n));
}

/** Accessible names this component generated (author labels are left alone). */
/** @type {WeakMap<Element, string>} */
const ownLabels = new WeakMap();

class WeekView extends VBElement {
  static observedAttributes = REBUILD_ATTRS;

  /** @type {HTMLTableElement | null} */
  #table = null;
  #raf = 0;
  /** @type {ResizeObserver | null} */
  #ro = null;

  setup() {
    this.#table = this.querySelector(':scope > table');
    if (!this.#table) this.#buildAutoTable();
    if (!this.#table) return false;
    const table = this.#table;

    this.#prepareEvents();

    // Click delegation
    this.listen(table, 'click', (e) => {
      const event = this.#eventFrom(e.target);
      if (event) this.#emitClick(event);
    });

    // Keyboard navigation + activation
    this.#setupKeyboardNav();

    if (typeof ResizeObserver !== 'undefined') {
      this.#ro = new ResizeObserver(() => this.#schedulePosition());
      this.#ro.observe(table);
    }
    this.#schedulePosition();
    return true;
  }

  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue === newValue || !this.hasAttribute('data-upgraded')) return;
    // Only a generated table can be rebuilt; an authored one is left alone.
    if (!this.#table?.hasAttribute('data-wv-generated')) return;
    this.#unbuild();
    this._reinit();
  }

  /** Move placed events back out of the generated table and drop it. */
  #unbuild() {
    const table = this.#table;
    if (!table) return;
    this.#clearSpans();
    for (const el of this.#events()) this.appendChild(el);
    table.remove();
    this.#table = null;
  }

  teardown() {
    if (this.#raf) cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.#ro?.disconnect();
    this.#ro = null;
    this.#clearSpans();
  }

  /** Re-measure and re-position spanning events */
  refresh() {
    if (this.#raf) cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.#positionSpanningEvents();
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the week's events as a plain data array. Each entry:
   * `{ date, time, text, category?, duration? }`.
   *
   * @returns {Array<{ date?: string, time?: string, text: string, category?: string, duration?: string }>} Event records.
   */
  get events() {
    const all = /** @type {HTMLElement[]} */ ([...this.querySelectorAll('calendar-event')])
      .filter((el) => el.closest('week-view') === this);
    return all.map((el) => ({
      date: el.dataset.date || undefined,
      time: el.querySelector('time[datetime]')?.getAttribute('datetime') || undefined,
      text: el.textContent?.trim() ?? '',
      category: el.dataset.category || undefined,
      duration: el.dataset.duration || undefined,
    }));
  }

  /**
   * Replace the week's events. Each entry needs `date` (ISO YYYY-MM-DD)
   * and `time` ("HH:MM" or a full ISO datetime, whose date is used when
   * `date` is omitted); other fields optional. Auto-builds the table
   * from the supplied events.
   *
   * Emits week-view:events-changed { events, source: 'property' }.
   */
  set events(value) {
    const next = Array.isArray(value) ? value : [];
    while (this.firstChild) this.firstChild.remove();
    const timeFmt = new Intl.DateTimeFormat(this.#locale(), { hour: 'numeric', minute: '2-digit' });
    for (const e of next) {
      const el = document.createElement('calendar-event');
      const date = e.date || /^\d{4}-\d{2}-\d{2}(?=T)/.exec(e.time || '')?.[0];
      if (date) el.dataset.date = date;
      if (e.category) el.dataset.category = e.category;
      if (e.duration) el.dataset.duration = String(e.duration);
      if (e.time) {
        const t = document.createElement('time');
        t.setAttribute('datetime', e.time);
        const parsed = parseTime(e.time);
        t.textContent = parsed
          ? timeFmt.format(new Date(2026, 0, 1, parsed.hour, parsed.minute))
          : e.time;
        el.appendChild(t);
        el.appendChild(document.createTextNode(' '));
      }
      el.appendChild(document.createTextNode(e.text || ''));
      this.appendChild(el);
    }
    this._reinit();
    this.dispatchEvent(new CustomEvent('week-view:events-changed', {
      detail: { events: next, source: 'property' },
      bubbles: true,
    }));
  }

  // ── Internals ───────────────────────────────────────────────────

  #locale() {
    return usableLocale(/** @type {HTMLElement | null} */ (this.closest('[lang]'))?.lang || navigator.language);
  }

  /** @returns {HTMLElement[]} calendar-events inside the table, in DOM order */
  #events() {
    const scope = this.#table ?? this;
    return /** @type {HTMLElement[]} */ ([...scope.querySelectorAll('calendar-event')])
      .filter((el) => el.closest('week-view') === this);
  }

  /** @param {EventTarget | null} target */
  #eventFrom(target) {
    const el = /** @type {Element | null} */ (target instanceof Element ? target : null);
    const event = /** @type {HTMLElement | null} */ (el?.closest('calendar-event') ?? null);
    return event && event.closest('week-view') === this ? event : null;
  }

  /** @param {HTMLElement} event */
  #emitClick(event) {
    const tr = event.closest('tr');
    const hourTime = tr?.querySelector('th time[datetime]');
    this.dispatchEvent(new CustomEvent('week-view:event-click', {
      bubbles: true,
      detail: {
        date: event.dataset.date,
        time: event.querySelector('time[datetime]')?.getAttribute('datetime')
          || hourTime?.getAttribute('datetime'),
        text: event.textContent?.trim() ?? '',
        element: event,
        category: event.dataset.category,
        duration: event.dataset.duration,
      }
    }));
  }

  /**
   * Give each event a role + name and reset the roving tabindex so exactly
   * one event is a tab stop (keeps the current stop across reconnects).
   */
  #prepareEvents() {
    const events = this.#events();
    const current = events.find((el) => el.getAttribute('tabindex') === '0');
    for (const el of events) {
      if (!el.hasAttribute('role')) el.setAttribute('role', 'group');
      if (!el.hasAttribute('aria-label') || ownLabels.has(el)) {
        const label = eventLabel(el);
        ownLabels.set(el, label);
        el.setAttribute('aria-label', label);
      }
      el.setAttribute('tabindex', '-1');
    }
    const stop = current ?? this.#navOrder()[0]?.el;
    if (stop) stop.setAttribute('tabindex', '0');
  }

  #buildAutoTable() {
    const events = /** @type {HTMLElement[]} */ ([...this.querySelectorAll(':scope > calendar-event')]);

    const locale = this.#locale();
    const now = new Date();
    const numDays = clampDays(this.dataset.days);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(this.dataset.startDate || '');
    const start = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : weekStart(locale, now);
    const todayISO = toISO(now);

    // Generate date range
    const dates = [];
    for (let i = 0; i < numDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    const dateISOs = dates.map(toISO);

    // Group events by date:hour
    /** @type {Map<string, HTMLElement[]>} */
    const eventMap = new Map();
    const allHours = new Set();

    for (const evt of events) {
      const date = evt.dataset.date;
      if (!date || !dateISOs.includes(date)) continue;

      const t = parseTime(evt.querySelector('time[datetime]')?.getAttribute('datetime'));
      if (!t) continue;

      if (t.minute >= 30 && !evt.dataset.start) evt.dataset.start = '30';

      const key = `${date}:${String(t.hour).padStart(2, '0')}`;
      const list = eventMap.get(key) ?? [];
      list.push(evt);
      eventMap.set(key, list);
      allHours.add(t.hour);
    }

    // Compute hour range
    const sortedHours = [...allHours].sort((a, b) => a - b);
    const first = sortedHours[0];
    const last = sortedHours[sortedHours.length - 1];
    const autoRange = this.dataset.startHour === 'auto' || !this.dataset.startHour;
    let startH;
    let endH;
    if (autoRange) {
      startH = sortedHours.length > 0 ? Math.max(0, first - 1) : 7;
      endH = sortedHours.length > 0 ? Math.min(23, last + 1) : 19;
    } else {
      startH = readHour(this.dataset.startHour, 7);
      endH = Math.max(startH, readHour(this.dataset.endHour, 19));
      // Never drop an event: grow the range to fit events outside it.
      if (sortedHours.length > 0) {
        startH = Math.min(startH, first);
        endH = Math.max(endH, last);
      }
    }

    // Locale formatting. The visible header adds the month when the range
    // crosses one; the accessible header text is always the full date.
    const crossesMonth = dates[0].getMonth() !== dates[dates.length - 1].getMonth();
    const dayFmt = new Intl.DateTimeFormat(locale, crossesMonth
      ? { weekday: 'short', day: 'numeric', month: 'short' }
      : { weekday: 'short', day: 'numeric' });
    const fullFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });
    const hourFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric' });

    this.style.setProperty('--wv-days', String(numDays));

    // Build <table>
    const table = document.createElement('table');
    table.setAttribute('data-wv-generated', '');

    // <thead>
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const cornerTh = document.createElement('th');
    cornerTh.setAttribute('scope', 'col');
    const cornerText = document.createElement('span');
    cornerText.className = 'visually-hidden';
    cornerText.textContent = this.dataset.labelTime || 'Time';
    cornerTh.appendChild(cornerText);
    headerRow.appendChild(cornerTh);

    dates.forEach(d => {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      const iso = toISO(d);
      if (iso === todayISO) th.setAttribute('aria-current', 'date');
      const time = document.createElement('time');
      time.setAttribute('datetime', iso);
      const short = document.createElement('span');
      short.setAttribute('aria-hidden', 'true');
      short.textContent = dayFmt.format(d);
      const full = document.createElement('span');
      full.className = 'visually-hidden';
      full.textContent = fullFmt.format(d);
      time.append(short, full);
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
        const cellEvents = eventMap.get(`${iso}:${hh}`) || [];

        if (cellEvents.length > 0) {
          const hourView = document.createElement('hour-view');
          // Columns only when in-grid events share a half-hour row (spanning
          // events are lifted out of the grid and laid out by JS)
          if (sharesHalfHour(cellEvents)) hourView.dataset.overlap = '';
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

  #schedulePosition() {
    if (this.#raf) return;
    this.#raf = requestAnimationFrame(() => {
      this.#raf = 0;
      this.#positionSpanningEvents();
    });
  }

  #clearSpans() {
    this.querySelectorAll('calendar-event.wv-spanning').forEach((node) => {
      const el = /** @type {HTMLElement} */ (node);
      for (const prop of SPAN_STYLE_PROPS) el.style.removeProperty(prop);
      el.classList.remove('wv-spanning');
      el.removeAttribute('data-continues');
      const base = ownLabels.get(el);
      if (base !== undefined) el.setAttribute('aria-label', base);
    });
  }

  #positionSpanningEvents() {
    this.#clearSpans();
    const tbody = this.#table?.querySelector('tbody');
    if (!tbody || !tbody.isConnected) return;

    const spanning = /** @type {HTMLElement[]} */ ([...tbody.querySelectorAll('calendar-event[data-duration]')]);
    if (spanning.length === 0) return;

    const tbodyRect = tbody.getBoundingClientRect();
    const rtl = getComputedStyle(tbody).direction === 'rtl';

    // Measure row positions
    /** @type {Map<number, {top: number, height: number}>} */
    const rows = new Map();
    let lastHour = -1;
    let viewBottom = 0;
    tbody.querySelectorAll(':scope > tr').forEach(tr => {
      const t = parseTime(tr.querySelector('th time[datetime]')?.getAttribute('datetime'));
      if (!t) return;
      const rect = tr.getBoundingClientRect();
      const top = rect.top - tbodyRect.top;
      rows.set(t.hour, { top, height: rect.height });
      if (t.hour > lastHour) { lastHour = t.hour; viewBottom = top + rect.height; }
    });
    if (rows.size === 0) return;
    const viewEnd = (lastHour + 1) * 60;

    /** @param {number} min minute of the day */
    const yAt = (min) => {
      const row = rows.get(Math.floor(min / 60));
      return row ? row.top + row.height * ((min % 60) / 60) : null;
    };

    // Intervals grouped by day column
    /** @type {Map<number, Array<{ event: HTMLElement, td: HTMLTableCellElement, start: number, end: number }>>} */
    const byColumn = new Map();
    for (const event of spanning) {
      const td = /** @type {HTMLTableCellElement | null} */ (event.closest('td'));
      const tr = td?.closest('tr');
      if (!td || !tr) continue;
      const rowT = parseTime(tr.querySelector('th time[datetime]')?.getAttribute('datetime'));
      if (!rowT || !rows.has(rowT.hour)) continue;
      const own = parseTime(event.querySelector('time[datetime]')?.getAttribute('datetime'));
      const startMin = event.dataset.start
        ? parseInt(event.dataset.start, 10) || 0
        : (own && own.hour === rowT.hour ? own.minute : 0);
      const start = rowT.hour * 60 + Math.min(59, Math.max(0, startMin));
      const minutes = parseDuration(event.dataset.duration) ?? DEFAULT_DURATION_MINUTES;
      const list = byColumn.get(td.cellIndex) ?? [];
      list.push({ event, td, start, end: start + minutes });
      byColumn.set(td.cellIndex, list);
    }

    const continuesLabel = this.dataset.labelContinues || 'continues after the visible hours';

    for (const items of byColumn.values()) {
      for (const p of layoutColumns(items)) {
        const row = /** @type {{ top: number, height: number }} */ (rows.get(Math.floor(p.start / 60)));
        const top = /** @type {number} */ (yAt(p.start));
        const continues = p.end > viewEnd;
        let bottom = continues ? viewBottom : (p.end === viewEnd ? viewBottom : yAt(p.end));
        if (bottom === null) bottom = top + row.height * ((p.end - p.start) / 60);

        // Measured rects are physical; map them to logical insets so the
        // event stays over its day column in RTL.
        const tdRect = p.td.getBoundingClientRect();
        const cellStart = (rtl ? tbodyRect.right - tdRect.right : tdRect.left - tbodyRect.left) + 2;
        const cellEnd = (rtl ? tdRect.left - tbodyRect.left : tbodyRect.right - tdRect.right) + 2;
        const colWidth = Math.max(0, tdRect.width - 4) / p.columns;

        const { event } = p;
        event.style.position = 'absolute';
        event.style.top = `${top}px`;
        event.style.height = `${Math.max(bottom - top, 1)}px`;
        event.style.insetInlineStart = `${cellStart + p.column * colWidth}px`;
        event.style.insetInlineEnd = `${cellEnd + (p.columns - 1 - p.column) * colWidth}px`;
        event.classList.add('wv-spanning');

        if (continues) {
          event.setAttribute('data-continues', '');
          const base = ownLabels.get(event);
          if (base !== undefined) event.setAttribute('aria-label', `${base}, ${continuesLabel}`);
        }
      }
    }
  }

  /**
   * Placed events in date-then-time order: column (day), minute of day,
   * then DOM order. The minute comes from the event's own time, else its
   * hour row plus data-start.
   * @returns {Array<{ el: HTMLElement, col: number, min: number }>}
   */
  #navOrder() {
    return this.#events().map((el, i) => {
      const td = /** @type {HTMLTableCellElement | null} */ (el.closest('td'));
      const rowT = parseTime(td?.closest('tr')?.querySelector('th time[datetime]')?.getAttribute('datetime'));
      const own = parseTime(el.querySelector('time[datetime]')?.getAttribute('datetime'));
      const min = own
        ? own.hour * 60 + own.minute
        : (rowT ? rowT.hour * 60 : 0) + (parseInt(el.dataset.start || '0', 10) || 0);
      return { el, col: td?.cellIndex ?? 0, min, i };
    }).sort((a, b) => a.col - b.col || a.min - b.min || a.i - b.i)
      .map(({ el, col, min }) => ({ el, col, min }));
  }

  #setupKeyboardNav() {
    const table = this.#table;
    if (!table) return;
    this.listen(table, 'keydown', (/** @type {Event} */ e) => {
      const ke = /** @type {KeyboardEvent} */ (e);
      const current = this.#eventFrom(ke.target);
      if (!current) return;

      // Enter/Space on the event itself (not on a link/button inside it)
      if ((ke.key === 'Enter' || ke.key === ' ') && ke.target === current) {
        ke.preventDefault();
        this.#emitClick(current);
        return;
      }
      if (!NAV_KEYS.includes(ke.key)) return;

      /** @type {Element | null | undefined} */
      let target = null;

      const order = this.#navOrder();
      const here = order.find((o) => o.el === current);
      if (!here) return;

      if (ke.key === 'Home' || ke.key === 'End') {
        // Date-then-time order across the whole view
        target = (ke.key === 'Home' ? order[0] : order[order.length - 1])?.el;
      } else if (ke.key === 'ArrowDown' || ke.key === 'ArrowUp') {
        // Walk this day's events in time order (siblings in one cell included)
        const day = order.filter((o) => o.col === here.col);
        const i = day.indexOf(here) + (ke.key === 'ArrowDown' ? 1 : -1);
        target = day[i]?.el;
      } else {
        // Nearest event (by time) in the closest day, in the arrow's visual
        // direction, that has any events.
        const rtl = getComputedStyle(table).direction === 'rtl';
        const forward = (ke.key === 'ArrowRight') !== rtl;
        const cols = [...new Set(order.map((o) => o.col))];
        const nextCol = forward
          ? cols.find((c) => c > here.col)
          : cols.filter((c) => c < here.col).pop();
        if (nextCol !== undefined) {
          let best = null;
          for (const o of order) {
            if (o.col !== nextCol) continue;
            if (!best || Math.abs(o.min - here.min) < Math.abs(best.min - here.min)) best = o;
          }
          target = best?.el;
        }
      }

      if (target && target !== current) {
        ke.preventDefault();
        current.setAttribute('tabindex', '-1');
        target.setAttribute('tabindex', '0');
        /** @type {HTMLElement} */ (target).focus();
      }
    });
  }
}

registerComponent('week-view', WeekView);
export { WeekView };
