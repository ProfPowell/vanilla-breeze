/**
 * format-date-init: Locale-aware date and relative time formatting
 *
 * Enhances <time> elements with data-format-date to replace their text
 * with a locale-aware formatted string. Supports both absolute formatting
 * (via Intl.DateTimeFormat) and relative formatting (via Intl.RelativeTimeFormat).
 *
 * @attr {string} data-format-date - Format style: "" (medium), "short", "medium", "long", "full", "relative"
 * @attr {string} data-format-time - Time style: "short", "medium", "long", "full" (ignored when relative)
 * @attr {string} data-locale - Locale override (e.g., "de-DE")
 *
 * @example Absolute
 * <time datetime="2026-02-09" data-format-date>Feb 9, 2026</time>
 * <time datetime="2026-02-09" data-format-date="full">Sunday, February 9, 2026</time>
 *
 * Date-only values (YYYY, YYYY-MM, YYYY-MM-DD) are formatted in UTC so they
 * never shift a day; YYYY shows only the year, YYYY-MM month and year.
 * Locale: data-locale, else the nearest [lang] ancestor, else <html lang>.
 * The original text moves to `title`.
 *
 * @example Relative
 * <time datetime="2026-02-09T10:00:00Z" data-format-date="relative">February 9, 2026</time>
 */

import { getLocale } from '../lib/i18n.js';

const SELECTOR = 'time[data-format-date]';
const intervals = new Map();
/** @type {Record<string, 'numeric'|'short'|'long'>} */
const MONTH_STYLE = { short: 'numeric', medium: 'short', long: 'long', full: 'long' };

/**
 * Precision of a date-only datetime value (YYYY, YYYY-MM, YYYY-MM-DD).
 * @param {string} raw
 * @returns {'year'|'month'|'day'|null} null when the value has a time part
 */
function datePrecision(raw) {
  if (/^\d{4}$/.test(raw)) return 'year';
  if (/^\d{4}-\d{2}$/.test(raw)) return 'month';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'day';
  return null;
}

/**
 * Initialize format-date elements within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initFormatDate(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceDate);
}

/**
 * Enhance a single <time> element with formatted date display
 * @param {HTMLElement} el - The time element to enhance
 */
function enhanceDate(el) {
  if (el.hasAttribute('data-format-date-init')) return;
  el.setAttribute('data-format-date-init', '');

  const raw = el.getAttribute('datetime');
  if (!raw) return;

  const datetime = new Date(raw);
  if (isNaN(datetime.getTime())) return;

  // Date-only values (YYYY, YYYY-MM, YYYY-MM-DD) are parsed as UTC midnight.
  const precision = datePrecision(raw.trim());

  // Preserve original text as tooltip
  if (!el.title) {
    el.title = el.textContent.trim();
  }

  const style = el.getAttribute('data-format-date') || 'medium';
  const locale = el.getAttribute('data-locale') || getLocale(el);

  if (style === 'relative') {
    el.textContent = formatRelative(datetime, locale);
    scheduleRefresh(el, datetime, locale);
  } else {
    el.textContent = formatAbsolute(datetime, style, el, locale, precision);
  }
}

/**
 * Format a date using Intl.DateTimeFormat
 * @param {Date} date
 * @param {string} style - dateStyle value
 * @param {Element} el - The element (for timeStyle)
 * @param {string|undefined} locale
 * @param {'year'|'month'|'day'|null} [precision] - date-only precision, or null for a date-time
 * @returns {string}
 */
function formatAbsolute(date, style, el, locale, precision = null) {
  const dateStyle = style || 'medium';
  const timeStyle = el.getAttribute('data-format-time') || undefined;

  try {
    /** @type {Intl.DateTimeFormatOptions} */
    let opts;
    if (precision === 'year') {
      // "2026" names a year, not 1 January: show only the year.
      opts = { year: 'numeric' };
    } else if (precision === 'month') {
      opts = { year: 'numeric', month: MONTH_STYLE[dateStyle] ?? 'short' };
    } else {
      opts = { dateStyle: /** @type {Intl.DateTimeFormatOptions['dateStyle']} */ (dateStyle) };
      if (timeStyle && !precision) opts.timeStyle = /** @type {Intl.DateTimeFormatOptions['timeStyle']} */ (timeStyle);
    }
    // Date-only values are parsed as UTC midnight; format them in UTC too,
    // or every zone west of UTC shows the previous day.
    if (precision) opts.timeZone = 'UTC';
    return new Intl.DateTimeFormat(locale, opts).format(date);
  } catch {
    return el.textContent;
  }
}

/**
 * Format a date as a relative time string using Intl.RelativeTimeFormat
 * @param {Date} date
 * @param {string|undefined} locale
 * @returns {string}
 */
function formatRelative(date, locale) {
  const now = Date.now();
  const diffSec = Math.round((date.getTime() - now) / 1000);
  const absSec = Math.abs(diffSec);

  const units = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 }
  ];

  for (const { unit, seconds } of units) {
    if (absSec >= seconds) {
      const value = Math.round(diffSec / seconds);
      try {
        return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, /** @type {Intl.RelativeTimeFormatUnit} */ (unit));
      } catch {
        const abs = Math.abs(value);
        const label = abs === 1 ? unit : `${unit}s`;
        return value < 0 ? `${abs} ${label} ago` : `in ${abs} ${label}`;
      }
    }
  }

  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'second');
  } catch {
    return 'just now';
  }
}

/**
 * Schedule adaptive auto-refresh for a relative time element
 * @param {Element} el - The time element
 * @param {Date} datetime - The parsed datetime
 * @param {string|undefined} locale
 */
function scheduleRefresh(el, datetime, locale) {
  clearInterval(intervals.get(el));

  const diffMs = Math.abs(Date.now() - datetime.getTime());
  const ONE_HOUR = 3600000;
  const ONE_DAY = 86400000;

  let intervalMs;
  if (diffMs < ONE_HOUR) {
    intervalMs = 60000;       // Every 60s for < 1 hour
  } else if (diffMs < ONE_DAY) {
    intervalMs = 300000;      // Every 5 min for < 24 hours
  } else {
    intervalMs = 3600000;     // Every hour for older
  }

  const id = setInterval(() => {
    el.textContent = formatRelative(datetime, locale);
    // Re-evaluate refresh rate
    scheduleRefresh(el, datetime, locale);
  }, intervalMs);

  intervals.set(el, id);
}

/**
 * Clean up interval for a removed element
 * @param {Element} el
 */
function cleanupElement(el) {
  if (intervals.has(el)) {
    clearInterval(intervals.get(el));
    intervals.delete(el);
    // Allow re-enhancement (and a fresh refresh timer) when reinserted.
    // Only relative elements own an interval; absolute ones keep the marker
    // because their text is already formatted.
    el.removeAttribute('data-format-date-init');
  }
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initFormatDate());
} else {
  initFormatDate();
}

// Watch for dynamically added/removed elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    // Enhance newly added elements
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);

      if (el.matches(SELECTOR)) {
        enhanceDate(/** @type {HTMLElement} */ (el));
      }

      el.querySelectorAll(SELECTOR).forEach(child => enhanceDate(/** @type {HTMLElement} */ (child)));
    }

    // Clean up intervals for removed elements
    for (const node of mutation.removedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);

      cleanupElement(el);
      el.querySelectorAll(SELECTOR).forEach(cleanupElement);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initFormatDate };
