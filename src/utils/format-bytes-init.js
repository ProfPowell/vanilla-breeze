/**
 * format-bytes-init: Human-readable file size formatting
 *
 * Enhances <data> elements with data-format-bytes to replace their text
 * with a human-readable file size string. Uses binary math (÷1024) by default
 * with familiar units (KB, MB, GB).
 *
 * @attr {string} data-format-bytes - Decimal precision (default "0")
 * @attr {string} data-unit - "decimal" for ÷1000, default ÷1024
 * @attr {string} data-locale - Locale override (e.g., "de-DE")
 *
 * @example
 * <data value="1048576" data-format-bytes>1 MB</data>
 * <data value="1536000" data-format-bytes="1">1.5 MB</data>
 * <data value="1000000" data-format-bytes data-unit="decimal">1 MB</data>
 */

import { getLocale } from '../lib/i18n.js';

const SELECTOR = 'data[data-format-bytes]';
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/**
 * Initialize format-bytes elements within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initFormatBytes(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceBytes);
}

/**
 * Enhance a single <data> element with formatted byte display
 * @param {HTMLElement} el - The data element to enhance
 */
function enhanceBytes(el) {
  if (el.hasAttribute('data-format-bytes-init')) return;
  el.setAttribute('data-format-bytes-init', '');
  formatBytes(el);
}

/**
 * Write the formatted value into the element. Runs on enhance and again
 * whenever the value attribute changes. A missing, empty or non-numeric
 * value is invalid: the authored text is left as it is.
 * @param {HTMLElement} el
 */
function formatBytes(el) {
  const raw = el.getAttribute('value');
  if (raw == null || raw.trim() === '') return;

  const bytes = Number(raw);
  if (isNaN(bytes) || bytes < 0) return;

  const precision = parseInt(el.getAttribute('data-format-bytes') ?? '0', 10) || 0;
  const isDecimal = el.getAttribute('data-unit') === 'decimal';
  const locale = el.getAttribute('data-locale') || getLocale();
  const divisor = isDecimal ? 1000 : 1024;

  if (bytes === 0) {
    el.textContent = '0 B';
    return;
  }

  const exp = Math.min(
    Math.floor(Math.log(bytes) / Math.log(divisor)),
    UNITS.length - 1
  );
  const value = bytes / Math.pow(divisor, exp);

  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(value);
    el.textContent = `${formatted} ${UNITS[exp]}`;
  } catch {
    el.textContent = `${value.toFixed(precision)} ${UNITS[exp]}`;
  }
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initFormatBytes());
} else {
  initFormatBytes();
}

// Watch for dynamically added elements, and re-format when a value changes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes') {
      const target = /** @type {HTMLElement} */ (mutation.target);
      if (target.hasAttribute('data-format-bytes-init') && target.matches(SELECTOR)) {
        formatBytes(target);
      }
      continue;
    }
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) {
        enhanceBytes(/** @type {HTMLElement} */ (el));
      }

      el.querySelectorAll(SELECTOR).forEach(child => enhanceBytes(/** @type {HTMLElement} */ (child)));
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['value'],
});

export { initFormatBytes };
