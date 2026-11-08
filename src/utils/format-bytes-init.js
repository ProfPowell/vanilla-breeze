/**
 * format-bytes-init: Human-readable file size formatting
 *
 * Enhances <data> elements with data-format-bytes to replace their text
 * with a human-readable file size string. Uses binary math (÷1024) by default;
 * data-unit="decimal" divides by 1000. Unit labels come from Intl.NumberFormat's
 * unit style, so they are localised ("1.5 MB", "1,5 Mo"). Intl has no binary
 * (KiB) units, so binary sizes use the same labels operating systems show.
 *
 * @attr {string} data-format-bytes - Decimal places, 0–20 (default "0")
 * @attr {string} data-unit - "decimal" for ÷1000, default ÷1024
 * @attr {string} data-locale - Locale override (e.g., "de-DE"); else the nearest [lang], else <html lang>
 *
 * Negative values keep their sign (size deltas); values below one byte
 * show in bytes. Re-formats when value, data-format-bytes, data-unit,
 * data-locale or any lang attribute changes.
 *
 * @example
 * <data value="1048576" data-format-bytes>1 MB</data>
 * <data value="1536000" data-format-bytes="1">1.5 MB</data>
 * <data value="1000000" data-format-bytes data-unit="decimal">1 MB</data>
 */

import { formatLocale } from '../lib/number-format.js';

const SELECTOR = 'data[data-format-bytes]';
const WATCHED = ['value', 'data-format-bytes', 'data-unit', 'data-locale', 'lang'];
/** Intl sanctioned single units, smallest first. */
const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'];
const FALLBACK_LABELS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];

/** @type {WeakSet<Element>} */
const enhanced = new WeakSet();

/**
 * Initialize format-bytes elements within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initFormatBytes(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceBytes);
}

/**
 * Enhance a single <data> element with formatted byte display
 * @param {Element} el - The data element to enhance
 */
function enhanceBytes(el) {
  if (enhanced.has(el)) return;
  enhanced.add(el);
  // State hook only (styling/tests); the WeakSet is the guard.
  el.setAttribute('data-format-bytes-init', '');
  formatBytes(el);
}

/**
 * Decimal places from the attribute, clamped to what Intl accepts.
 * @param {string|null} value
 * @returns {number}
 */
function parsePrecision(value) {
  const n = parseInt(value ?? '0', 10);
  return Number.isFinite(n) ? Math.min(20, Math.max(0, n)) : 0;
}

/**
 * Format a byte count.
 * @param {number} bytes - may be negative or fractional
 * @param {{ precision?: number, decimal?: boolean, locale?: string }} [options]
 * @returns {string}
 */
export function formatByteSize(bytes, { precision = 0, decimal = false, locale } = {}) {
  const divisor = decimal ? 1000 : 1024;
  const abs = Math.abs(bytes);
  // Below one byte (and zero) stays in bytes: log() would go negative.
  const exp = abs < 1
    ? 0
    : Math.min(Math.floor(Math.log(abs) / Math.log(divisor)), UNITS.length - 1);
  const value = bytes / Math.pow(divisor, exp);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: UNITS[exp],
      // "512 bytes" reads better than the short "512 byte"; larger units
      // use the familiar short labels (kB, MB, Mo, Go…).
      unitDisplay: exp === 0 ? 'long' : 'short',
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(value);
  } catch {
    return `${value.toFixed(precision)} ${FALLBACK_LABELS[exp]}`;
  }
}

/**
 * Write the formatted value into the element. Runs on enhance and again
 * whenever an input attribute changes. A missing, empty or non-numeric
 * value is invalid: the authored text is left as it is.
 * @param {Element} el
 */
function formatBytes(el) {
  const raw = el.getAttribute('value');
  if (raw == null || raw.trim() === '') return;

  const bytes = Number(raw);
  if (!Number.isFinite(bytes)) return;

  el.textContent = formatByteSize(bytes, {
    precision: parsePrecision(el.getAttribute('data-format-bytes')),
    decimal: el.getAttribute('data-unit') === 'decimal',
    locale: formatLocale(el),
  });
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initFormatBytes());
} else {
  initFormatBytes();
}

// Watch for added elements, and re-format when an input attribute changes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes') {
      const target = /** @type {Element} */ (mutation.target);
      if (mutation.attributeName === 'lang') {
        if (target.matches(SELECTOR) && enhanced.has(target)) formatBytes(target);
        target.querySelectorAll(SELECTOR).forEach((el) => { if (enhanced.has(el)) formatBytes(el); });
      } else if (target.matches(SELECTOR)) {
        if (enhanced.has(target)) formatBytes(target);
        else if (target.isConnected) enhanceBytes(target);
      }
      continue;
    }
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) enhanceBytes(el);
      el.querySelectorAll(SELECTOR).forEach(enhanceBytes);
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: WATCHED,
});

export { initFormatBytes };
