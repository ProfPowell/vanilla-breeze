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
 * @attr {string} data-date       - ISO date (e.g., "2026-04-10")
 * @attr {number} data-start-hour - First visible hour (default: 7)
 * @attr {number} data-end-hour   - Last visible hour (default: 19)
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
  #ol;

  setup() {
    this.#ol = this.querySelector('ol');
    if (!this.#ol) return false;

    // Position spanning events after layout settles
    this.#positionSpanningEvents();
  }

  teardown() {
    // Remove absolute positioning from events on disconnect
    this.querySelectorAll('calendar-event.dv-spanning').forEach(el => {
      el.style.cssText = '';
      el.classList.remove('dv-spanning');
    });
  }

  /** Re-measure and re-position spanning events */
  refresh() {
    this.teardown();
    this.#positionSpanningEvents();
  }

  #positionSpanningEvents() {
    const ol = this.#ol;
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

      spanningEvents.forEach(event => {
        const li = event.closest('ol > li');
        if (!li) return;

        const timeEl = li.querySelector(':scope > time');
        const startHour = parseInt(timeEl?.getAttribute('datetime')?.split(':')[0], 10);
        const startMin = parseInt(event.dataset.start || '0', 10);

        // Parse duration
        const dur = event.dataset.duration;
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

    // Click delegation for all events
    this.listen(this.#ol, 'click', (e) => {
      const event = e.target.closest('calendar-event');
      if (!event) return;
      this.dispatchEvent(new CustomEvent('day-view:event-click', {
        bubbles: true,
        detail: {
          time: event.querySelector('time[datetime]')?.getAttribute('datetime'),
          text: event.textContent.trim(),
          element: event,
          category: event.dataset.category,
          duration: event.dataset.duration,
        }
      }));
    });

    // Keyboard navigation between events
    this.listen(this.#ol, 'keydown', (e) => {
      const event = e.target.closest('calendar-event');
      if (!event) return;

      const events = [...this.#ol.querySelectorAll('calendar-event')];
      const idx = events.indexOf(event);
      if (idx === -1) return;

      let next;
      if (e.key === 'ArrowDown' && idx < events.length - 1) next = events[idx + 1];
      if (e.key === 'ArrowUp' && idx > 0) next = events[idx - 1];

      if (next) {
        e.preventDefault();
        next.setAttribute('tabindex', '0');
        event.setAttribute('tabindex', '-1');
        next.focus();
      }
    });

    // Set initial tabindex
    const firstEvent = this.#ol.querySelector('calendar-event');
    if (firstEvent) firstEvent.setAttribute('tabindex', '0');
  }
}

registerComponent('day-view', DayView);
export { DayView };
