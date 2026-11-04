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
 * @returns {string|null} null for future or invalid dates
 */
export function formatRelative(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  // Invalid Date → NaN; without this it fell through to "NaN years ago".
  if (Number.isNaN(diff) || diff < 0) return null;

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
    // <page-info> localises its own times (Intl, nearest [lang]); don't clobber them.
    if (el.closest('page-info')) continue;
    const dt = el.getAttribute('datetime');
    if (!dt) continue;
    const date = new Date(dt);
    const lang = el.closest('[lang]')?.getAttribute('lang') || '';
    const relative = lang && !/^en\b/i.test(lang) ? formatRelativeIntl(date, lang) : formatRelative(date);
    if (relative) el.textContent = relative;
  }
}

/**
 * Localised relative time for non-English contexts.
 * @param {Date} date
 * @param {string} lang
 * @returns {string|null} null for future or invalid dates
 */
export function formatRelativeIntl(date, lang) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (Number.isNaN(diff) || diff < 0) return null;
  let rtf;
  try { rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }); } catch { return formatRelative(date); }
  if (diff < MINUTE) return rtf.format(0, 'second');
  if (diff < HOUR) return rtf.format(-Math.floor(diff / MINUTE), 'minute');
  if (diff < DAY) return rtf.format(-Math.floor(diff / HOUR), 'hour');
  if (diff < MONTH) return rtf.format(-Math.floor(diff / DAY), 'day');
  if (diff < YEAR) return rtf.format(-Math.floor(diff / MONTH), 'month');
  return rtf.format(-Math.floor(diff / YEAR), 'year');
}

/* Auto-init on DOMContentLoaded, refresh every 60s.

   Guarded per document: this module is bundled into vanilla-breeze.js AND
   into four per-component chunks (activity-feed, comment-thread, time-index,
   page-info). Each is a distinct module URL, so each gets its own evaluation
   and — without this guard — its own 60s interval, all scanning the whole
   document and rewriting the same elements. A page autoloading all four ran
   five intervals. The module-local `_interval` cannot catch that; only a
   marker on the shared document can. */
const _docEl = typeof document !== 'undefined' ? document.documentElement : null;

let _interval;

function init() {
  updateRelativeTimes();
  if (!_interval) {
    _interval = setInterval(() => updateRelativeTimes(), 60_000);
  }
}

if (_docEl && !_docEl.hasAttribute('data-vb-time-relative-init')) {
  _docEl.setAttribute('data-vb-time-relative-init', '');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}
