/**
 * time-relative: Shared utility for rendering <time data-relative> elements
 *
 * Finds all <time data-relative> elements and updates their textContent
 * with relative dates ("3 days ago"). Runs on DOMContentLoaded and
 * refreshes every 60 seconds.
 *
 * Used by <page-info>, <time-index>, and any page with <time data-relative>.
 */

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const MONTH = 2592000;
const YEAR = 31536000;

/**
 * Format a date as a relative time string.
 * @param {Date} date
 * @returns {string|null}
 */
export function formatRelative(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 0) return null;

  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m} minute${m !== 1 ? 's' : ''} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} hour${h !== 1 ? 's' : ''} ago`;
  }
  if (diff < MONTH) {
    const d = Math.floor(diff / DAY);
    return `${d} day${d !== 1 ? 's' : ''} ago`;
  }
  if (diff < YEAR) {
    const m = Math.floor(diff / MONTH);
    return `${m} month${m !== 1 ? 's' : ''} ago`;
  }
  const y = Math.floor(diff / YEAR);
  return `${y} year${y !== 1 ? 's' : ''} ago`;
}

/**
 * Update all <time data-relative> elements on the page.
 * @param {Element|Document} [root=document]
 */
export function updateRelativeTimes(root = document) {
  for (const el of root.querySelectorAll('time[data-relative]')) {
    const dt = el.getAttribute('datetime');
    if (!dt) continue;
    const relative = formatRelative(new Date(dt));
    if (relative) el.textContent = relative;
  }
}

/* Auto-init on DOMContentLoaded, refresh every 60s */
let _interval;

function init() {
  updateRelativeTimes();
  if (!_interval) {
    _interval = setInterval(() => updateRelativeTimes(), 60_000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
