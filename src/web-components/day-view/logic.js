/**
 * day-view: Hour-grid schedule for a single day
 *
 * Enhances semantic markup: <ol> with <li> per hour, each containing
 * <time> for the hour label and <hour-view> for event content.
 * Events are <calendar-event> elements inside <hour-view>.
 *
 * Two-layer rendering:
 *   Layer 1 (CSS): Hour grid rows with half-hour positioning (hour-view)
 *   Layer 2 (JS):  Spanning events positioned absolutely over the grid
 *
 * Generated grid (no authored <ol>):
 *   Place <calendar-event> children directly inside <day-view>. The
 *   component reads each event's <time datetime> ("HH:MM" or full ISO;
 *   wall-clock as written) and builds the <ol>/<li>/<hour-view> structure.
 *   data-start-hour="auto" gives a sparse range (first event hour − 1 …
 *   last event hour + 1); otherwise data-start-hour … data-end-hour
 *   (default 7 … 19), grown to fit any event outside it.
 *   Untimed events are placed in an all-day section.
 *
 * Spanning events (data-duration, see lib/time-grid.js parseDuration) are
 * positioned over the grid, re-measured on resize, laid out in columns when
 * they overlap, and marked data-continues when they run past the last row.
 *
 * @attr {string}        data-date       - ISO date (e.g., "2026-04-10"); names the hour list, included in event-click detail
 * @attr {number|"auto"} data-start-hour - First generated hour (default: 7, or "auto")
 * @attr {number}        data-end-hour   - Last generated hour (default: 19)
 * @attr {boolean}       data-compact    - Compact presentation for dialog embedding
 * @attr {string}        data-label-continues - Text appended to a clipped span's name
 *
 * @example
 * <day-view data-date="2026-04-10">
 *   <ol>
 *     <li>
 *       <time datetime="09:00">9 AM</time>
 *       <hour-view>
 *         <calendar-event data-category="meeting">
 *           <time datetime="09:00">9:00</time>
 *           Sprint standup
 *         </calendar-event>
 *       </hour-view>
 *     </li>
 *   </ol>
 * </day-view>
 */

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { parseTime, parseDuration, layoutColumns, eventLabel, DEFAULT_DURATION_MINUTES, SPAN_STYLE_PROPS, sharesHalfHour } from '../../lib/time-grid.js';

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 19;
const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'];


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

class DayView extends VBElement {
  /** @type {HTMLOListElement | null} */
  #ol = null;
  #raf = 0;
  /** @type {ResizeObserver | null} */
  #ro = null;

  setup() {
    this.#ol = this.querySelector(':scope > ol');

    // No authored hour list: build one from loose <calendar-event> children
    // (data-start-hour="auto" for a sparse range, otherwise start..end hour).
    if (!this.#ol && this.querySelector(':scope > calendar-event')) {
      this.#buildGrid();
    }

    if (!this.#ol && !this.querySelector(':scope > .all-day-events')) return false;

    this.#labelList();
    this.#prepareEvents();

    this.listen(this, 'click', (e) => {
      const event = this.#eventFrom(e.target);
      if (event) this.#emitClick(event);
    });

    this.listen(this, 'keydown', (/** @type {Event} */ e) => {
      const ke = /** @type {KeyboardEvent} */ (e);
      const event = this.#eventFrom(ke.target);
      if (!event) return;

      // Enter/Space on the event itself (not on a link/button inside it)
      if ((ke.key === 'Enter' || ke.key === ' ') && ke.target === event) {
        ke.preventDefault();
        this.#emitClick(event);
        return;
      }
      if (!NAV_KEYS.includes(ke.key)) return;

      const events = this.#events();
      const idx = events.indexOf(event);
      if (idx === -1) return;

      /** @type {HTMLElement | undefined} */
      let next;
      if (ke.key === 'ArrowDown') next = events[idx + 1];
      else if (ke.key === 'ArrowUp') next = events[idx - 1];
      else if (ke.key === 'Home') next = events[0];
      else if (ke.key === 'End') next = events[events.length - 1];

      if (next && next !== event) {
        ke.preventDefault();
        event.setAttribute('tabindex', '-1');
        next.setAttribute('tabindex', '0');
        next.focus();
      }
    });

    if (this.#ol) {
      if (typeof ResizeObserver !== 'undefined') {
        this.#ro = new ResizeObserver(() => this.#schedulePosition());
        this.#ro.observe(this.#ol);
      }
      this.#schedulePosition();
    }
    return true;
  }

  teardown() {
    if (this.#raf) cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.#ro?.disconnect();
    this.#ro = null;
    this.#clearSpans();
  }

  /** Re-measure and re-position spanning events (e.g. after changing data-duration). */
  refresh() {
    if (this.#raf) cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.#positionSpanningEvents();
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the day's events as a plain data array. Each entry:
   * `{ time, text, category?, duration?, href? }`. Reflects whatever
   * <calendar-event> children currently exist.
   *
   * @returns {Array<{ time?: string, text: string, category?: string, duration?: string, href?: string }>} Event records.
   */
  get events() {
    return this.#events().map((el) => ({
      time: el.querySelector('time[datetime]')?.getAttribute('datetime') || undefined,
      text: el.textContent?.trim() ?? '',
      category: el.dataset.category || undefined,
      duration: el.dataset.duration || undefined,
      href: el.querySelector('a[href]')?.getAttribute('href') || undefined,
    }));
  }

  /**
   * Replace the day's events. Each entry: `{ time, text, category?,
   * duration?, href? }`. `time` is "HH:MM" or a full ISO datetime (the
   * wall-clock time is used as written); omit it for an all-day event.
   * Sets `data-start-hour="auto"` so the grid covers the supplied events.
   *
   * Emits day-view:events-changed { events, source: 'property' }.
   */
  set events(value) {
    const next = Array.isArray(value) ? value : [];
    while (this.firstChild) this.firstChild.remove();
    this.dataset.startHour = 'auto';
    const timeFmt = new Intl.DateTimeFormat(this.#locale(), { hour: 'numeric', minute: '2-digit' });
    for (const e of next) {
      const el = document.createElement('calendar-event');
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
      if (e.href) {
        const a = document.createElement('a');
        a.href = e.href;
        a.textContent = e.text || '';
        el.appendChild(a);
      } else {
        el.appendChild(document.createTextNode(e.text || ''));
      }
      this.appendChild(el);
    }
    this._reinit();
    this.dispatchEvent(new CustomEvent('day-view:events-changed', {
      detail: { events: next, source: 'property' },
      bubbles: true,
    }));
  }

  // ── Internals ───────────────────────────────────────────────────

  #locale() {
    return /** @type {HTMLElement | null} */ (this.closest('[lang]'))?.lang || navigator.language;
  }

  /** @returns {HTMLElement[]} calendar-events owned by this view (not a nested one) */
  #events() {
    return /** @type {HTMLElement[]} */ ([...this.querySelectorAll('calendar-event')])
      .filter((el) => el.closest('day-view') === this);
  }

  /** @param {EventTarget | null} target */
  #eventFrom(target) {
    const el = /** @type {Element | null} */ (target instanceof Element ? target : null);
    const event = /** @type {HTMLElement | null} */ (el?.closest('calendar-event') ?? null);
    return event && event.closest('day-view') === this ? event : null;
  }

  /** @param {HTMLElement} event */
  #emitClick(event) {
    this.dispatchEvent(new CustomEvent('day-view:event-click', {
      bubbles: true,
      detail: {
        date: this.dataset.date,
        time: event.querySelector('time[datetime]')?.getAttribute('datetime'),
        text: event.textContent?.trim() ?? '',
        element: event,
        category: event.dataset.category,
        duration: event.dataset.duration,
      }
    }));
  }

  /** Name the hour list from data-date ("Friday, April 10, 2026"). */
  #labelList() {
    const ol = this.#ol;
    const iso = this.dataset.date;
    if (!ol || !iso || (ol.hasAttribute('aria-label') && !ownLabels.has(ol))) return;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (Number.isNaN(d.getTime())) return;
    const label = new Intl.DateTimeFormat(this.#locale(), { dateStyle: 'full' }).format(d);
    ownLabels.set(ol, label);
    ol.setAttribute('aria-label', label);
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
    const stop = current ?? events[0];
    if (stop) stop.setAttribute('tabindex', '0');
  }

  /**
   * Build the <ol>/<li>/<hour-view> structure from loose <calendar-event>
   * children. Untimed events go to the all-day list.
   */
  #buildGrid() {
    const events = /** @type {HTMLElement[]} */ ([...this.querySelectorAll(':scope > calendar-event')]);
    if (events.length === 0) return;

    /** @type {Map<number, HTMLElement[]>} */
    const eventsByHour = new Map();
    /** @type {HTMLElement[]} */
    const untimed = [];

    for (const evt of events) {
      const t = parseTime(evt.querySelector('time[datetime]')?.getAttribute('datetime'));
      if (!t) { untimed.push(evt); continue; }
      // Bottom-half placement for single-hour events starting at :30+
      if (t.minute >= 30 && !evt.dataset.start) evt.dataset.start = '30';
      const list = eventsByHour.get(t.hour) ?? [];
      list.push(evt);
      eventsByHour.set(t.hour, list);
    }

    if (untimed.length > 0) {
      let allDay = this.querySelector(':scope > .all-day-events');
      if (!allDay) {
        allDay = document.createElement('ul');
        allDay.className = 'all-day-events';
        this.prepend(allDay);
      }
      for (const evt of untimed) {
        const li = document.createElement('li');
        li.appendChild(evt);
        allDay.appendChild(li);
      }
    }

    const sortedHours = [...eventsByHour.keys()].sort((a, b) => a - b);
    const first = sortedHours[0];
    const last = sortedHours[sortedHours.length - 1];

    let startH;
    let endH;
    if (this.dataset.startHour === 'auto') {
      if (sortedHours.length === 0) return;
      // Sparse range: one hour padding on each side
      startH = Math.max(0, first - 1);
      endH = Math.min(23, last + 1);
    } else {
      startH = readHour(this.dataset.startHour, DEFAULT_START_HOUR);
      endH = Math.max(startH, readHour(this.dataset.endHour, DEFAULT_END_HOUR));
      // Never drop an event: grow the range to fit events outside it.
      if (sortedHours.length > 0) {
        startH = Math.min(startH, first);
        endH = Math.max(endH, last);
      }
    }

    const hourFmt = new Intl.DateTimeFormat(this.#locale(), { hour: 'numeric' });

    const ol = document.createElement('ol');
    for (let h = startH; h <= endH; h++) {
      const li = document.createElement('li');

      const time = document.createElement('time');
      time.setAttribute('datetime', `${String(h).padStart(2, '0')}:00`);
      time.textContent = hourFmt.format(new Date(2026, 0, 1, h));

      const hourView = document.createElement('hour-view');
      const hourEvents = eventsByHour.get(h) || [];
      // Columns only when in-grid events share a half-hour row (spanning
      // events are lifted out of the grid and laid out by JS)
      if (sharesHalfHour(hourEvents)) hourView.dataset.overlap = '';
      hourEvents.forEach((evt) => hourView.appendChild(evt));

      li.append(time, hourView);
      ol.appendChild(li);
    }

    this.appendChild(ol);
    this.#ol = ol;
  }

  #schedulePosition() {
    if (this.#raf) return;
    this.#raf = requestAnimationFrame(() => {
      this.#raf = 0;
      this.#positionSpanningEvents();
    });
  }

  #clearSpans() {
    this.querySelectorAll('calendar-event.dv-spanning').forEach((node) => {
      const el = /** @type {HTMLElement} */ (node);
      // Only the properties we set: authors (and calendar-wc) put
      // --event-color etc. in the style attribute.
      for (const prop of SPAN_STYLE_PROPS) el.style.removeProperty(prop);
      el.classList.remove('dv-spanning');
      el.removeAttribute('data-continues');
      const base = ownLabels.get(el);
      if (base !== undefined) el.setAttribute('aria-label', base);
    });
  }

  /**
   * Lift data-duration events out of the grid and position them across
   * hour rows. Overlapping spans share the width in columns; spans that run
   * past the last visible hour are clipped and marked data-continues.
   */
  #positionSpanningEvents() {
    const ol = this.#ol;
    this.#clearSpans();
    if (!ol || !ol.isConnected) return;
    const spanning = /** @type {HTMLElement[]} */ ([...ol.querySelectorAll('calendar-event[data-duration]')]);
    if (spanning.length === 0) return;

    // Phase 1: measure hour rows
    const olRect = ol.getBoundingClientRect();
    /** @type {Map<number, { top: number, height: number }>} */
    const rows = new Map();
    let labelWidth = 64;
    let lastHour = -1;
    let viewBottom = 0;

    ol.querySelectorAll(':scope > li').forEach((li) => {
      const timeEl = li.querySelector(':scope > time');
      const t = parseTime(timeEl?.getAttribute('datetime'));
      if (!timeEl || !t) return;
      const rect = li.getBoundingClientRect();
      const top = rect.top - olRect.top;
      rows.set(t.hour, { top, height: rect.height });
      if (t.hour > lastHour) { lastHour = t.hour; viewBottom = top + rect.height; }
      labelWidth = timeEl.getBoundingClientRect().width;
    });
    if (rows.size === 0) return;
    const viewEnd = (lastHour + 1) * 60;

    /** @param {number} min minute of the day */
    const yAt = (min) => {
      const row = rows.get(Math.floor(min / 60));
      return row ? row.top + row.height * ((min % 60) / 60) : null;
    };

    // Phase 2: intervals in minutes of the day
    /** @type {Array<{ event: HTMLElement, start: number, end: number }>} */
    const items = [];
    for (const event of spanning) {
      const li = event.closest('ol > li');
      const rowT = parseTime(li?.querySelector(':scope > time')?.getAttribute('datetime'));
      if (!rowT || !rows.has(rowT.hour)) continue;
      const own = parseTime(event.querySelector('time[datetime]')?.getAttribute('datetime'));
      const startMin = event.dataset.start
        ? parseInt(event.dataset.start, 10) || 0
        : (own && own.hour === rowT.hour ? own.minute : 0);
      const start = rowT.hour * 60 + Math.min(59, Math.max(0, startMin));
      const minutes = parseDuration(event.dataset.duration) ?? DEFAULT_DURATION_MINUTES;
      items.push({ event, start, end: start + minutes });
    }

    // Phase 3: columns for overlapping spans, then apply
    const avail = Math.max(0, olRect.width - labelWidth - 8);
    const continuesLabel = this.dataset.labelContinues || 'continues after the visible hours';

    for (const p of layoutColumns(items)) {
      const row = /** @type {{ top: number, height: number }} */ (rows.get(Math.floor(p.start / 60)));
      const top = /** @type {number} */ (yAt(p.start));
      const continues = p.end > viewEnd;
      let bottom = continues ? viewBottom : (p.end === viewEnd ? viewBottom : yAt(p.end));
      // End falls in a gap between authored rows: extrapolate from the start row
      if (bottom === null) bottom = top + row.height * ((p.end - p.start) / 60);

      const colWidth = avail / p.columns;
      const { event } = p;
      event.style.position = 'absolute';
      event.style.top = `${top}px`;
      event.style.height = `${Math.max(bottom - top, 1)}px`;
      // Logical insets: the hour labels sit at inline-start (right in RTL).
      event.style.insetInlineStart = `${labelWidth + 4 + p.column * colWidth}px`;
      event.style.insetInlineEnd = `${4 + (p.columns - 1 - p.column) * colWidth}px`;
      event.classList.add('dv-spanning');

      if (continues) {
        event.setAttribute('data-continues', '');
        const base = ownLabels.get(event);
        if (base !== undefined) event.setAttribute('aria-label', `${base}, ${continuesLabel}`);
      }
    }
  }
}

registerComponent('day-view', DayView);
export { DayView };
