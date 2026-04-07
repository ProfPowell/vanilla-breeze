/**
 * day-view: Hour-grid schedule for a single day
 *
 * Progressive enhancement over a semantic <ol> with <time> entries.
 * Without JS, renders as a readable ordered event list.
 * With JS, positions events into a visual hour grid with localized
 * hour labels, click-to-expand, and keyboard navigation.
 *
 * @attr {string} data-date       - ISO date for this day (e.g., "2026-04-10")
 * @attr {number} data-start-hour - First visible hour (default: 7)
 * @attr {number} data-end-hour   - Last visible hour (default: 19)
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

// ── Locale-aware hour label cache ──────────────────────────────────

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
  #grid;
  #hourLabelsEl;
  #list;

  setup() {
    this.#locale = this.closest('[lang]')?.lang || navigator.language;
    this.#startHour = parseInt(this.dataset.startHour, 10) || 7;
    this.#endHour = parseInt(this.dataset.endHour, 10) || 19;

    this.#list = this.querySelector('ol');
    if (!this.#list) return false;

    this.#enhance();
  }

  teardown() {
    // Remove generated hour labels on disconnect
    if (this.#hourLabelsEl) {
      this.#hourLabelsEl.remove();
      this.#hourLabelsEl = null;
    }
  }

  #enhance() {
    const hours = getLocalizedHours(this.#locale);
    const hourCount = this.#endHour - this.#startHour + 1;

    // Set CSS custom properties for the grid
    this.style.setProperty('--_start-hour', String(this.#startHour));
    this.style.setProperty('--_end-hour', String(this.#endHour));
    this.style.setProperty('--_hour-count', String(hourCount));

    // Generate hour label column
    this.#hourLabelsEl = document.createElement('div');
    this.#hourLabelsEl.className = 'dv-hour-labels';
    this.#hourLabelsEl.setAttribute('aria-hidden', 'true');

    for (let h = this.#startHour; h <= this.#endHour; h++) {
      const label = document.createElement('span');
      label.className = 'dv-hour-label';
      label.textContent = hours[h];
      this.#hourLabelsEl.appendChild(label);
    }

    // Insert labels before the list
    this.insertBefore(this.#hourLabelsEl, this.#list);

    // Position each event in the grid
    const items = this.#list.querySelectorAll(':scope > li');
    let earlyCount = 0;
    let lateCount = 0;

    items.forEach(li => {
      const timeEl = li.querySelector('time[datetime]');
      if (!timeEl) return;

      const dt = timeEl.getAttribute('datetime');
      const [hStr, mStr] = (dt || '').split(':');
      const hour = parseInt(hStr, 10);
      const min = parseInt(mStr, 10) || 0;

      if (isNaN(hour)) return;

      // Check for duration (PT1H, PT30M, PT1H30M)
      const durationEl = li.querySelector('time[datetime^="PT"]');
      let durationHours = 1;
      if (durationEl) {
        const ddt = durationEl.getAttribute('datetime');
        const hMatch = ddt.match(/(\d+)H/);
        const mMatch = ddt.match(/(\d+)M/);
        durationHours = (hMatch ? parseInt(hMatch[1], 10) : 0) + (mMatch ? parseInt(mMatch[1], 10) / 60 : 0);
        if (durationHours === 0) durationHours = 1;
      }

      // Track out-of-range events
      if (hour < this.#startHour) { earlyCount++; return; }
      if (hour > this.#endHour) { lateCount++; return; }

      // Grid row position (1-indexed)
      const rowStart = hour - this.#startHour + 1;
      const rowSpan = Math.max(1, Math.round(durationHours));
      const minuteOffset = min / 60;

      li.style.gridRow = `${rowStart} / span ${rowSpan}`;
      if (min > 0) {
        li.style.marginBlockStart = `${minuteOffset * 100}%`;
      }

      // Read <data> elements for category
      const dataEl = li.querySelector('data[value]');
      if (dataEl) {
        li.dataset.category = dataEl.getAttribute('value');
      }
    });

    // Show overflow indicators
    if (earlyCount > 0) {
      const indicator = document.createElement('div');
      indicator.className = 'dv-overflow dv-overflow-early';
      indicator.textContent = `${earlyCount} earlier`;
      this.insertBefore(indicator, this.#hourLabelsEl);
    }

    if (lateCount > 0) {
      const indicator = document.createElement('div');
      indicator.className = 'dv-overflow dv-overflow-late';
      indicator.textContent = `${lateCount} later`;
      this.appendChild(indicator);
    }

    // Click delegation for event dispatch
    this.listen(this.#list, 'click', (e) => {
      const li = e.target.closest('li');
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
      const li = e.target.closest('li');
      if (!li) return;

      const items = [...this.#list.querySelectorAll(':scope > li')];
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

    // Set initial tabindex for keyboard navigation
    const firstItem = this.#list.querySelector(':scope > li');
    if (firstItem) firstItem.setAttribute('tabindex', '0');
  }
}

registerComponent('day-view', DayView);
export { DayView };
