/**
 * format-date-init: Locale-aware date and relative time formatting
 *
 * Enhances <time> elements with data-format-date to replace their text
 * with a locale-aware formatted string. Supports both absolute formatting
 * (via Intl.DateTimeFormat) and relative formatting (via Intl.RelativeTimeFormat).
 *
 * @attr {string} data-format-date - Format style: "" (medium), "short", "medium", "long", "full", "relative"
 * @attr {string} data-format-time - Time style: "short", "medium", "long", "full" (ignored when relative)
 * @attr {string} data-time-zone - IANA time zone for date-times (e.g. "Europe/Paris"); default the viewer's zone
 * @attr {string} data-locale - Locale override (e.g., "de-DE")
 *
 * @example Absolute
 * <time datetime="2026-02-09" data-format-date>Feb 9, 2026</time>
 * <time datetime="2026-02-09" data-format-date="full">Sunday, February 9, 2026</time>
 *
 * Date-only values (YYYY, YYYY-MM, YYYY-MM-DD) are formatted in UTC so they
 * never shift a day; YYYY shows only the year, YYYY-MM month and year.
 * Locale: data-locale, else the nearest [lang] ancestor, else <html lang>.
 * Absolute: the authored text moves to `title`. Relative: `title` holds the
 * absolute date and time (an authored title is kept).
 *
 * Re-formats when datetime, data-format-date, data-format-time,
 * data-time-zone, data-locale or any lang attribute changes. Enhanced
 * elements are tracked in a WeakSet, so clones are formatted on insert.
 *
 * @example Relative
 * <time datetime="2026-02-09T10:00:00Z" data-format-date="relative">February 9, 2026</time>
 */

import { getLocale } from '../lib/i18n.js';

const SELECTOR = 'time[data-format-date]';
const WATCHED = ['datetime', 'data-format-date', 'data-format-time', 'data-time-zone', 'data-locale', 'lang'];
const MARKER = 'data-format-date-init';

/** @type {Map<Element, ReturnType<typeof setTimeout>>} relative refresh timers */
const timers = new Map();
/** @type {WeakSet<Element>} */
const enhanced = new WeakSet();
/** @type {WeakMap<Element, { text: string, authoredTitle: boolean }>} */
const origins = new WeakMap();

/** @type {Record<string, 'numeric'|'short'|'long'>} */
const MONTH_STYLE = { short: 'numeric', medium: 'short', long: 'long', full: 'long' };

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;
const MONTH = 2592000;
const YEAR = 31536000;

/**
 * Relative units, largest first; `max` is the rounded count at which the
 * next larger unit takes over (350 days is "last year", not "12 months ago").
 * @type {Array<{ unit: Intl.RelativeTimeFormatUnit, seconds: number, max: number }>}
 */
const RELATIVE_UNITS = [
  { unit: 'year', seconds: YEAR, max: Infinity },
  { unit: 'month', seconds: MONTH, max: 12 },
  { unit: 'week', seconds: WEEK, max: 5 },
  { unit: 'day', seconds: DAY, max: 7 },
  { unit: 'hour', seconds: HOUR, max: 24 },
  { unit: 'minute', seconds: MINUTE, max: 60 },
  { unit: 'second', seconds: 1, max: 60 },
];

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
 * @param {Element} el - The time element to enhance
 */
function enhanceDate(el) {
  if (enhanced.has(el)) return;
  enhanced.add(el);
  if (!origins.has(el)) {
    // A clone copies the state marker and the title this script wrote, so a
    // title only counts as authored on an element that was never enhanced.
    origins.set(el, {
      text: el.textContent.trim(),
      authoredTitle: el.hasAttribute('title') && !el.hasAttribute(MARKER),
    });
  }
  // State hook only (styling/tests); the WeakSet is the guard.
  el.setAttribute(MARKER, '');
  formatDate(el);
}

/**
 * Write the formatted date (and title) into the element and (re)schedule
 * the relative refresh. Invalid or missing datetime leaves the text alone.
 * @param {Element} el
 */
function formatDate(el) {
  clearTimer(el);
  const raw = el.getAttribute('datetime')?.trim();
  if (!raw) return;
  // Only dates and date-times (they start with the year). Yearless dates
  // ("09-22"), times ("14:30"), weeks and durations are left as written:
  // V8's lenient Date parser turns "09-22" into 22 Sep 2001.
  if (!/^\d{4}/.test(raw)) return;

  const datetime = new Date(raw);
  if (isNaN(datetime.getTime())) return;

  // Date-only values (YYYY, YYYY-MM, YYYY-MM-DD) are parsed as UTC midnight.
  const precision = datePrecision(raw);
  const style = el.getAttribute('data-format-date') || 'medium';
  const locale = el.getAttribute('data-locale') || getLocale(el);
  const origin = origins.get(el);

  if (style === 'relative') {
    el.textContent = formatRelative(datetime, locale);
    // The tooltip carries the exact date the relative phrase stands for.
    if (!origin?.authoredTitle) {
      el.setAttribute('title', formatAbsolute(datetime, 'medium', precision ? null : 'short', el, locale, precision));
    }
    scheduleRefresh(el, datetime, locale);
  } else {
    if (!origin?.authoredTitle && origin?.text) el.setAttribute('title', origin.text);
    el.textContent = formatAbsolute(datetime, style, el.getAttribute('data-format-time'), el, locale, precision);
  }
}

/**
 * Format a date using Intl.DateTimeFormat
 * @param {Date} date
 * @param {string} style - dateStyle value
 * @param {string|null} timeStyle - timeStyle value, or null for none
 * @param {Element} el - The element (fallback text, time zone)
 * @param {string|undefined} locale
 * @param {'year'|'month'|'day'|null} [precision] - date-only precision, or null for a date-time
 * @returns {string}
 */
function formatAbsolute(date, style, timeStyle, el, locale, precision = null) {
  const dateStyle = style || 'medium';

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
  // or every zone west of UTC shows the previous day. Instants use
  // data-time-zone when given, else the viewer's zone.
  const zone = precision ? 'UTC' : el.getAttribute('data-time-zone') || undefined;

  try {
    return new Intl.DateTimeFormat(locale, { ...opts, timeZone: zone }).format(date);
  } catch {
    try {
      // An unknown time zone or style: drop the zone, then give up.
      return new Intl.DateTimeFormat(locale, opts).format(date);
    } catch {
      return el.textContent ?? '';
    }
  }
}

/**
 * Format a date as a relative time string using Intl.RelativeTimeFormat
 * @param {Date} date
 * @param {string|undefined} locale
 * @returns {string}
 */
function formatRelative(date, locale) {
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const absSec = Math.abs(diffSec);

  for (let i = 0; i < RELATIVE_UNITS.length; i++) {
    const { seconds, max } = RELATIVE_UNITS[i];
    if (absSec < seconds) continue;
    let { unit } = RELATIVE_UNITS[i];
    let value = Math.round(diffSec / seconds);
    // Rounding up to a whole larger unit ("60 minutes", "12 months")?
    if (Math.abs(value) >= max && i > 0) {
      unit = RELATIVE_UNITS[i - 1].unit;
      value = Math.sign(diffSec) * Math.max(1, Math.round(absSec / RELATIVE_UNITS[i - 1].seconds));
    }
    try {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
    } catch {
      const abs = Math.abs(value);
      const label = abs === 1 ? unit : `${unit}s`;
      return value < 0 ? `${abs} ${label} ago` : `in ${abs} ${label}`;
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
  clearTimer(el);

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

  const id = setTimeout(() => {
    timers.delete(el);
    el.textContent = formatRelative(datetime, locale);
    // Re-evaluate refresh rate
    scheduleRefresh(el, datetime, locale);
  }, intervalMs);

  timers.set(el, id);
}

/** @param {Element} el */
function clearTimer(el) {
  const id = timers.get(el);
  if (id !== undefined) {
    clearTimeout(id);
    timers.delete(el);
  }
}

/**
 * Stop a removed element's refresh and forget it, so a reinserted element
 * is enhanced again (and gets a fresh timer).
 * @param {Element} el
 */
function cleanupElement(el) {
  clearTimer(el);
  enhanced.delete(el);
}

/**
 * Re-format an element after an input attribute changed.
 * @param {Element} el
 */
function refresh(el) {
  if (enhanced.has(el)) formatDate(el);
  else if (el.isConnected) enhanceDate(el);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initFormatDate());
} else {
  initFormatDate();
}

// Watch for added/removed elements and input attribute changes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes') {
      const target = /** @type {Element} */ (mutation.target);
      if (mutation.attributeName === 'lang') {
        if (target.matches(SELECTOR)) refresh(target);
        target.querySelectorAll(SELECTOR).forEach(refresh);
      } else if (target.matches(SELECTOR)) {
        refresh(target);
      } else if (mutation.attributeName === 'data-format-date' && enhanced.has(target)) {
        // data-format-date removed: stop the relative refresh.
        cleanupElement(target);
      }
      continue;
    }

    // Clean up first: a moved element is removed and added in one batch.
    for (const node of mutation.removedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);
      if (el.isConnected) continue;
      if (el.matches(SELECTOR)) cleanupElement(el);
      el.querySelectorAll(SELECTOR).forEach(cleanupElement);
    }

    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);
      if (!el.isConnected) continue;
      if (el.matches(SELECTOR)) enhanceDate(el);
      el.querySelectorAll(SELECTOR).forEach(enhanceDate);
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: WATCHED,
});

export { initFormatDate };
