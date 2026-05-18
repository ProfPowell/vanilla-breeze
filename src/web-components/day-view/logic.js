/**
 * day-view: Hour-grid schedule for a single day
 *
 * Enhances semantic markup: <ol> with <li> per hour, each containing
 * <time> for the hour label and <hour-view> for event content.
 * Events are <calendar-event> elements inside <hour-view>.
 *
 * Two-layer rendering:
 *   Layer 1 (CSS): Hour grid rows with subgrid half-hour positioning
 *   Layer 2 (JS):  Spanning events positioned absolutely over the grid
 *
 * Auto mode (data-start-hour="auto"):
 *   Place <calendar-event> children directly inside <day-view> (no <ol>).
 *   The component scans event times, computes a sparse hour range
 *   (first event hour − 1 … last event hour + 1), and builds the
 *   <ol>/<li>/<hour-view> structure automatically.
 *   Untimed events are placed in an all-day section.
 *
 * @attr {string}        data-date       - ISO date (e.g., "2026-04-10")
 * @attr {number|"auto"} data-start-hour - First visible hour (default: 7, or "auto")
 * @attr {number}        data-end-hour   - Last visible hour (default: 19)
 * @attr {boolean}       data-compact    - Compact presentation for dialog embedding
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

class DayView extends VBElement {
  /** @type {HTMLOListElement | null} */
  #ol = null;

  setup() {
    this.#ol = this.querySelector('ol');

    // Auto mode: build hour grid from loose calendar-event children
    if (!this.#ol && this.dataset.startHour === 'auto') {
      this.#buildAutoGrid();
    }

    if (!this.#ol) return false;
    const ol = this.#ol;

    // Position spanning events after layout settles
    this.#positionSpanningEvents();

    // Click delegation for all events
    this.listen(ol, 'click', (e) => {
      const target = /** @type {Element | null} */ (e.target);
      const event = /** @type {HTMLElement | null} */ (target?.closest('calendar-event'));
      if (!event) return;
      this.dispatchEvent(new CustomEvent('day-view:event-click', {
        bubbles: true,
        detail: {
          time: event.querySelector('time[datetime]')?.getAttribute('datetime'),
          text: event.textContent?.trim() ?? '',
          element: event,
          category: event.dataset.category,
          duration: event.dataset.duration,
        }
      }));
    });

    // Keyboard navigation between events
    this.listen(ol, 'keydown', (/** @type {Event} */ e) => {
      const ke = /** @type {KeyboardEvent} */ (e);
      const target = /** @type {Element | null} */ (ke.target);
      const event = /** @type {HTMLElement | null} */ (target?.closest('calendar-event'));
      if (!event) return;

      const events = /** @type {HTMLElement[]} */ ([...ol.querySelectorAll('calendar-event')]);
      const idx = events.indexOf(event);
      if (idx === -1) return;

      /** @type {HTMLElement | undefined} */
      let next;
      if (ke.key === 'ArrowDown' && idx < events.length - 1) next = events[idx + 1];
      if (ke.key === 'ArrowUp' && idx > 0) next = events[idx - 1];

      if (next) {
        ke.preventDefault();
        next.setAttribute('tabindex', '0');
        event.setAttribute('tabindex', '-1');
        next.focus();
      }
    });

    // Set initial tabindex
    const firstEvent = ol.querySelector('calendar-event');
    if (firstEvent) firstEvent.setAttribute('tabindex', '0');
    return true;
  }

  /**
   * Auto mode: scan <calendar-event> children, compute sparse hour range,
   * and generate the <ol>/<li>/<hour-view> structure.
   */
  #buildAutoGrid() {
    const events = [...this.querySelectorAll(':scope > calendar-event')];
    if (events.length === 0) return;

    const eventsByHour = new Map();
    const untimed = [];

    events.forEach((/** @type {Element} */ rawEvt) => {
      const evt = /** @type {HTMLElement} */ (rawEvt);
      const timeEl = evt.querySelector('time[datetime]');
      if (!timeEl) { untimed.push(evt); return; }
      const dt = timeEl.getAttribute('datetime');
      if (!dt) { untimed.push(evt); return; }
      const parts = dt.split(':');
      const hour = parseInt(parts[0], 10);
      const min = parseInt(parts[1] || '0', 10);
      if (isNaN(hour)) { untimed.push(evt); return; }

      // Set half-hour positioning if needed
      if (min >= 30 && !evt.dataset.start) evt.dataset.start = '30';

      if (!eventsByHour.has(hour)) eventsByHour.set(hour, []);
      eventsByHour.get(hour).push(evt);
    });

    // Untimed events → all-day section
    if (untimed.length > 0) {
      const allDay = document.createElement('ul');
      allDay.className = 'all-day-events';
      untimed.forEach(evt => {
        const li = document.createElement('li');
        li.appendChild(evt);
        allDay.appendChild(li);
      });
      this.prepend(allDay);
    }

    const sortedHours = [...eventsByHour.keys()].sort((a, b) => a - b);
    if (sortedHours.length === 0) return;

    // Sparse range: one hour padding on each side
    const startH = Math.max(0, sortedHours[0] - 1);
    const endH = Math.min(23, sortedHours[sortedHours.length - 1] + 1);

    // Locale-aware hour labels
    const locale = /** @type {HTMLElement | null} */ (this.closest('[lang]'))?.lang || navigator.language;
    const hourFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric' });

    const ol = document.createElement('ol');
    for (let h = startH; h <= endH; h++) {
      const li = document.createElement('li');

      const time = document.createElement('time');
      const hh = String(h).padStart(2, '0');
      time.setAttribute('datetime', `${hh}:00`);
      time.textContent = hourFmt.format(new Date(2026, 0, 1, h));

      const hourView = document.createElement('hour-view');
      const hourEvents = eventsByHour.get(h) || [];
      if (hourEvents.length > 1) hourView.dataset.overlap = '';
      hourEvents.forEach(evt => hourView.appendChild(evt));

      li.append(time, hourView);
      ol.appendChild(li);
    }

    this.appendChild(ol);
    this.#ol = ol;
  }

  teardown() {
    // Remove absolute positioning from events on disconnect
    this.querySelectorAll('calendar-event.dv-spanning').forEach(el => {
      /** @type {HTMLElement} */ (el).style.cssText = '';
      el.classList.remove('dv-spanning');
    });
  }

  /** Re-measure and re-position spanning events */
  refresh() {
    this.teardown();
    this.#positionSpanningEvents();
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the day's events as a plain data array. Each entry:
   * `{ time, text, category?, duration?, href? }`. Reflects whatever
   * <calendar-event> children currently exist.
   */
  get events() {
    return [...this.querySelectorAll('calendar-event')].map((/** @type {Element} */ rawEl) => {
      const el = /** @type {HTMLElement} */ (rawEl);
      return {
        time: el.querySelector('time[datetime]')?.getAttribute('datetime') || undefined,
        text: el.textContent?.trim() ?? '',
        category: el.dataset.category || undefined,
        duration: el.dataset.duration || undefined,
        href: el.querySelector('a[href]')?.getAttribute('href') || undefined,
      };
    });
  }

  /**
   * Replace the day's events. Each entry: `{ time, text, category?,
   * duration?, href? }`. Time is an ISO string ("HH:MM" or full ISO
   * datetime). Sets `data-start-hour="auto"` so the auto-grid path
   * builds the hour scaffold from the supplied events.
   *
   * Emits day-view:events-changed { events, source: 'property' }.
   */
  set events(value) {
    const next = Array.isArray(value) ? value : [];
    while (this.firstChild) this.firstChild.remove();
    this.dataset.startHour = 'auto';
    for (const e of next) {
      const el = document.createElement('calendar-event');
      if (e.category) el.dataset.category = e.category;
      if (e.duration) el.dataset.duration = String(e.duration);
      if (e.time) {
        const t = document.createElement('time');
        t.setAttribute('datetime', e.time);
        t.textContent = e.time;
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
    this.teardown();
    this.removeAttribute('data-upgraded');
    this.setup();
    this.dispatchEvent(new CustomEvent('day-view:events-changed', {
      detail: { events: next, source: 'property' },
      bubbles: true,
    }));
  }

  #positionSpanningEvents() {
    const ol = this.#ol;
    if (!ol) return;
    const spanningEvents = ol.querySelectorAll('calendar-event[data-duration]');
    if (spanningEvents.length === 0) return;

    // Wait for layout to settle (fonts, icons, etc.)
    requestAnimationFrame(() => {
      // Phase 1: Measure all hour rows
      const olRect = ol.getBoundingClientRect();
      const hourRows = new Map();
      let labelWidth = 64;

      ol.querySelectorAll(':scope > li').forEach(li => {
        const timeEl = li.querySelector(':scope > time');
        if (!timeEl) return;
        const dt = timeEl.getAttribute('datetime');
        if (!dt) return;
        const hour = parseInt(dt.split(':')[0], 10);
        const rect = li.getBoundingClientRect();
        hourRows.set(hour, {
          top: rect.top - olRect.top,
          height: rect.height,
        });
        labelWidth = timeEl.getBoundingClientRect().width;
      });

      // Phase 2: Compute positions
      const placements = [];

      spanningEvents.forEach((/** @type {Element} */ rawEvent) => {
        const event = /** @type {HTMLElement} */ (rawEvent);
        const li = event.closest('ol > li');
        if (!li) return;

        const timeEl = li.querySelector(':scope > time');
        const startDt = timeEl?.getAttribute('datetime');
        if (!startDt) return;
        const startHour = parseInt(startDt.split(':')[0], 10);
        const startMin = parseInt(event.dataset.start || '0', 10);

        // Parse duration
        const dur = event.dataset.duration ?? '';
        let durationMinutes = 60;
        const hMatch = dur.match(/(\d+)h/);
        const mMatch = dur.match(/(\d+)m/);
        if (hMatch || mMatch) {
          durationMinutes = (hMatch ? parseInt(hMatch[1], 10) * 60 : 0)
                          + (mMatch ? parseInt(mMatch[1], 10) : 0);
        }

        const row = hourRows.get(startHour);
        if (!row) return;

        const minuteFraction = startMin / 60;
        const top = row.top + (row.height * minuteFraction);
        const height = row.height * (durationMinutes / 60);

        placements.push({ event, top, height });
      });

      // Phase 3: Apply all positions
      placements.forEach(({ event, top, height }) => {
        event.style.position = 'absolute';
        event.style.top = top + 'px';
        event.style.height = height + 'px';
        event.style.left = (labelWidth + 4) + 'px';
        event.style.right = '4px';
        event.classList.add('dv-spanning');
      });
    });
  }
}

registerComponent('day-view', DayView);
export { DayView };
