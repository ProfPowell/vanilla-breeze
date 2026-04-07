/**
 * day-view: Hour-grid schedule for a single day
 *
 * Progressive enhancement over a semantic <ol> with <time> entries.
 * Without JS, renders as a readable ordered event list.
 * With JS, inserts hour-marker <li> elements and positions events
 * into a half-hour CSS Grid. No <div> tags are generated.
 *
 * Grid uses half-hour resolution: each hour = 2 grid rows.
 * Events at :00 start at the first sub-row, :30 at the second.
 * Duration determines row span (1 hour = 2 rows, 30min = 1 row).
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
    this.#generatedEls.forEach(el => el.remove());
    this.#generatedEls = [];
  }

  refresh() {
    this.teardown();
    this.#enhance();
  }

  #enhance() {
    const hours = getLocalizedHours(this.#locale);
    const hourCount = this.#endHour - this.#startHour + 1;

    // Set CSS var for total half-hour rows
    this.style.setProperty('--_half-hour-rows', String(hourCount * 2));

    // Parse events from the <ol> children
    const eventItems = [...this.#list.querySelectorAll(':scope > li')];
    const events = eventItems.map(li => {
      const timeEl = li.querySelector('time[datetime]');
      const dt = timeEl?.getAttribute('datetime') || '';
      const [hStr, mStr] = dt.split(':');
      const hour = parseInt(hStr, 10);
      const min = parseInt(mStr, 10) || 0;

      const durEl = li.querySelector('time[datetime^="PT"]');
      let durMinutes = 30; // default 30 min (1 half-hour slot)
      if (durEl) {
        const ddt = durEl.getAttribute('datetime');
        const hm = ddt.match(/(\d+)H/);
        const mm = ddt.match(/(\d+)M/);
        durMinutes = (hm ? parseInt(hm[1], 10) * 60 : 0) + (mm ? parseInt(mm[1], 10) : 0);
        if (durMinutes === 0) durMinutes = 60;
      }

      const dataEl = li.querySelector('data[value]');
      if (dataEl) li.dataset.category = dataEl.getAttribute('value');

      return { li, hour, min, durMinutes, valid: !isNaN(hour) };
    });

    events.sort((a, b) => (a.hour * 60 + a.min) - (b.hour * 60 + b.min));

    // Clear and rebuild
    this.#list.innerHTML = '';

    let earlyCount = 0;
    let lateCount = 0;

    // Place hour markers with explicit grid rows
    for (let h = this.#startHour; h <= this.#endHour; h++) {
      const gridRow = (h - this.#startHour) * 2 + 1;

      // Hour label in column 1
      const hourLi = document.createElement('li');
      hourLi.className = 'dv-hour';
      hourLi.setAttribute('aria-hidden', 'true');
      hourLi.textContent = hours[h];
      hourLi.style.gridRow = `${gridRow} / span 2`;
      this.#list.appendChild(hourLi);
      this.#generatedEls.push(hourLi);

      // Hour grid line in column 2
      const lineLi = document.createElement('li');
      lineLi.className = 'dv-hour-line';
      lineLi.setAttribute('aria-hidden', 'true');
      lineLi.style.gridRow = `${gridRow} / span 2`;
      this.#list.appendChild(lineLi);
      this.#generatedEls.push(lineLi);
    }

    // Place events with explicit grid rows
    events.forEach(e => {
      if (!e.valid) {
        this.#list.appendChild(e.li);
        return;
      }
      if (e.hour < this.#startHour || (e.hour === this.#startHour && e.min < 0)) {
        earlyCount++;
        return;
      }
      if (e.hour > this.#endHour) {
        lateCount++;
        return;
      }

      // Grid row from time: each hour = 2 rows, :30 = +1 row
      const halfHourOffset = e.min >= 30 ? 1 : 0;
      const gridRowStart = (e.hour - this.#startHour) * 2 + 1 + halfHourOffset;

      // Span: duration in half-hours, minimum 1
      const halfHourSpan = Math.max(1, Math.round(e.durMinutes / 30));

      e.li.style.gridRow = `${gridRowStart} / span ${halfHourSpan}`;
      this.#list.appendChild(e.li);
    });

    // Overflow indicators
    if (earlyCount > 0) {
      const indicator = document.createElement('li');
      indicator.className = 'dv-overflow';
      indicator.textContent = `\u2191 ${earlyCount} earlier`;
      indicator.style.gridRow = '1';
      indicator.style.gridColumn = '1 / -1';
      this.#list.insertBefore(indicator, this.#list.firstChild);
      this.#generatedEls.push(indicator);
    }

    if (lateCount > 0) {
      const indicator = document.createElement('li');
      indicator.className = 'dv-overflow';
      indicator.textContent = `\u2193 ${lateCount} later`;
      indicator.style.gridColumn = '1 / -1';
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

    const firstEvent = this.#list.querySelector(':scope > li:not(.dv-hour):not(.dv-overflow)');
    if (firstEvent) firstEvent.setAttribute('tabindex', '0');
  }
}

registerComponent('day-view', DayView);
export { DayView };
