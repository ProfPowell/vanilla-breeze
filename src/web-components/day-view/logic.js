/**
 * day-view: Hour-grid schedule for a single day
 *
 * Progressive enhancement over a semantic <ol> with <time> entries.
 * Without JS, renders as a readable ordered event list.
 * With JS, inserts hour-marker <li> elements and positions events
 * into a CSS Grid hour layout. No <div> tags are generated.
 *
 * @attr {string} data-date       - ISO date for this day (e.g., "2026-04-10")
 * @attr {number} data-start-hour - First visible hour (default: 7)
 * @attr {number} data-end-hour   - Last visible hour (default: 19)
 * @attr {string} data-size       - Size: "compact", "default", "large"
 * @attr {string} data-mode       - Mode: "grid" (default), "sparse" (event list only)
 *
 * @example
 * <day-view data-date="2026-04-10">
 *   <ol>
 *     <li><time datetime="09:00">9:00 AM</time> Sprint standup</li>
 *     <li><time datetime="14:00">2:00 PM</time> Design review</li>
 *   </ol>
 * </day-view>
 */

import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

// ── Locale-aware hour labels ───────────────────────────────────────

const hourCache = new Map();

function getLocalizedHours(locale) {
  if (hourCache.has(locale)) return hourCache.get(locale);
  const hours = [];
  const fmt = new Intl.DateTimeFormat(locale, { hour: 'numeric' });
  for (let h = 0; h < 24; h++) {
    hours.push(fmt.format(new Date(2026, 0, 1, h)));
  }
  hourCache.set(locale, hours);
  return hours;
}

// ── Component ──────────────────────────────────────────────────────

class DayView extends VBElement {
  #startHour = 7;
  #endHour = 19;
  #locale;
  #list;
  #generatedEls = [];

  setup() {
    this.#locale = this.closest('[lang]')?.lang || navigator.language;
    this.#startHour = parseInt(this.dataset.startHour, 10) || 7;
    this.#endHour = parseInt(this.dataset.endHour, 10) || 19;

    this.#list = this.querySelector('ol');
    if (!this.#list) return false;

    this.#enhance();
  }

  teardown() {
    // Remove generated elements on disconnect
    this.#generatedEls.forEach(el => el.remove());
    this.#generatedEls = [];
  }

  /** Force re-render */
  refresh() {
    this.teardown();
    this.#enhance();
  }

  #enhance() {
    const hours = getLocalizedHours(this.#locale);
    const hourCount = this.#endHour - this.#startHour + 1;

    // Collect original event <li> elements and parse their times
    const eventItems = [...this.#list.querySelectorAll(':scope > li')];
    const events = eventItems.map(li => {
      const timeEl = li.querySelector('time[datetime]');
      const dt = timeEl?.getAttribute('datetime') || '';
      const [hStr, mStr] = dt.split(':');
      const hour = parseInt(hStr, 10);
      const min = parseInt(mStr, 10) || 0;

      // Duration
      const durEl = li.querySelector('time[datetime^="PT"]');
      let durHours = 1;
      if (durEl) {
        const ddt = durEl.getAttribute('datetime');
        const hm = ddt.match(/(\d+)H/);
        const mm = ddt.match(/(\d+)M/);
        durHours = (hm ? parseInt(hm[1], 10) : 0) + (mm ? parseInt(mm[1], 10) / 60 : 0);
        if (durHours === 0) durHours = 1;
      }

      // Category from <data>
      const dataEl = li.querySelector('data[value]');
      if (dataEl) li.dataset.category = dataEl.getAttribute('value');

      return { li, hour, min, durHours, valid: !isNaN(hour) };
    });

    // Sort events by time
    events.sort((a, b) => (a.hour * 60 + a.min) - (b.hour * 60 + b.min));

    // Clear list and rebuild with hour markers interleaved
    this.#list.innerHTML = '';

    let earlyCount = 0;
    let lateCount = 0;
    const earlyEvents = [];
    const lateEvents = [];
    const inRangeEvents = [];

    events.forEach(e => {
      if (!e.valid) { inRangeEvents.push(e); return; }
      if (e.hour < this.#startHour) { earlyCount++; earlyEvents.push(e); return; }
      if (e.hour > this.#endHour) { lateCount++; lateEvents.push(e); return; }
      inRangeEvents.push(e);
    });

    // Build the grid: hour markers + events interleaved
    let eventIdx = 0;
    for (let h = this.#startHour; h <= this.#endHour; h++) {
      // Create hour marker <li>
      const hourLi = document.createElement('li');
      hourLi.className = 'dv-hour';
      hourLi.setAttribute('aria-hidden', 'true');
      const hourTime = document.createElement('time');
      hourTime.setAttribute('datetime', String(h).padStart(2, '0') + ':00');
      hourTime.textContent = hours[h];
      hourLi.appendChild(hourTime);
      this.#list.appendChild(hourLi);
      this.#generatedEls.push(hourLi);

      // Insert events that start at this hour
      while (eventIdx < inRangeEvents.length && inRangeEvents[eventIdx].hour === h) {
        const e = inRangeEvents[eventIdx];
        const span = Math.max(1, Math.round(e.durHours));

        // Multi-hour events span across hour slots
        if (span > 1) {
          e.li.style.gridRow = `span ${span * 2 - 1}`;
        }

        // Sub-hour offset: :15/:30/:45 events indent within their row
        // Uses calc against the row height custom property
        if (e.min > 0) {
          const fraction = (e.min / 60).toFixed(2);
          e.li.style.marginBlockStart = `calc(var(--_row-h, 2rem) * ${fraction})`;
        }

        this.#list.appendChild(e.li);
        eventIdx++;
      }
    }

    // Append any remaining events (no valid time, placed at end)
    while (eventIdx < inRangeEvents.length) {
      this.#list.appendChild(inRangeEvents[eventIdx].li);
      eventIdx++;
    }

    // Overflow indicators
    if (earlyCount > 0) {
      const indicator = document.createElement('li');
      indicator.className = 'dv-overflow';
      indicator.textContent = `↑ ${earlyCount} earlier`;
      this.#list.insertBefore(indicator, this.#list.firstChild);
      this.#generatedEls.push(indicator);
    }

    if (lateCount > 0) {
      const indicator = document.createElement('li');
      indicator.className = 'dv-overflow';
      indicator.textContent = `↓ ${lateCount} later`;
      this.#list.appendChild(indicator);
      this.#generatedEls.push(indicator);
    }

    // Click delegation
    this.listen(this.#list, 'click', (e) => {
      const li = e.target.closest('li:not(.dv-hour):not(.dv-overflow)');
      if (!li) return;
      this.dispatchEvent(new CustomEvent('day-view:event-click', {
        bubbles: true,
        detail: {
          time: li.querySelector('time[datetime]')?.getAttribute('datetime'),
          text: li.textContent.trim(),
          element: li,
        }
      }));
    });

    // Keyboard navigation
    this.listen(this.#list, 'keydown', (e) => {
      const li = e.target.closest('li:not(.dv-hour):not(.dv-overflow)');
      if (!li) return;

      const items = [...this.#list.querySelectorAll(':scope > li:not(.dv-hour):not(.dv-overflow)')];
      const idx = items.indexOf(li);
      if (idx === -1) return;

      let next;
      if (e.key === 'ArrowDown' && idx < items.length - 1) next = items[idx + 1];
      if (e.key === 'ArrowUp' && idx > 0) next = items[idx - 1];

      if (next) {
        e.preventDefault();
        next.setAttribute('tabindex', '0');
        li.setAttribute('tabindex', '-1');
        next.focus();
      }
    });

    // Set initial tabindex
    const firstEvent = this.#list.querySelector(':scope > li:not(.dv-hour):not(.dv-overflow)');
    if (firstEvent) firstEvent.setAttribute('tabindex', '0');
  }
}

registerComponent('day-view', DayView);
export { DayView };
