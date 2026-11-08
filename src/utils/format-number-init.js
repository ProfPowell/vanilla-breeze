/**
 * format-number-init: Locale-aware number formatting
 *
 * Enhances <data> elements with data-format-number to replace their text
 * with a locale-aware formatted string using Intl.NumberFormat.
 *
 * @attr {string} data-format-number - Format style: "" (decimal), "currency", "percent", "compact"
 * @attr {string} data-currency - Currency code for currency style (e.g., "USD", "EUR"; default "USD")
 * @attr {string} data-fraction-digits - Fixed decimal places, 0–20 (default: Intl's default for the style)
 * @attr {string} data-locale - Locale override (e.g., "de-DE"); else the nearest [lang], else <html lang>
 *
 * Re-formats when value, data-format-number, data-currency,
 * data-fraction-digits, data-locale or
 * any lang attribute changes. Enhanced elements are tracked in a WeakSet,
 * so a clone (which copies the data-format-number-init state attribute)
 * is still formatted when it is inserted.
 *
 * @example
 * <data value="1234567" data-format-number>1,234,567</data>
 * <data value="48200" data-format-number="currency" data-currency="USD">$48,200.00</data>
 * <data value="0.85" data-format-number="percent">85%</data>
 * <data value="1500000" data-format-number="compact">1.5M</data>
 */

import { numberFormatter } from '../lib/number-format.js';

const SELECTOR = 'data[data-format-number]';
const WATCHED = ['value', 'data-format-number', 'data-currency', 'data-fraction-digits', 'data-locale', 'lang'];

/** @type {WeakSet<Element>} */
const enhanced = new WeakSet();

/**
 * Initialize format-number elements within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initFormatNumber(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceNumber);
}

/**
 * Enhance a single <data> element with formatted number display
 * @param {Element} el - The data element to enhance
 */
function enhanceNumber(el) {
  if (enhanced.has(el)) return;
  enhanced.add(el);
  // State hook only (styling/tests); the WeakSet is the guard.
  el.setAttribute('data-format-number-init', '');
  formatNumber(el);
}

/**
 * Write the formatted value into the element. Runs on enhance and again
 * whenever an input attribute changes. A missing, empty or non-numeric
 * value is invalid: the authored text is left as it is.
 * @param {Element} el
 */
function formatNumber(el) {
  const raw = el.getAttribute('value');
  if (raw == null || raw.trim() === '') return;

  const num = Number(raw);
  if (isNaN(num)) return;

  // Intl unavailable or invalid options (bad currency/locale): keep the text.
  const formatter = numberFormatter(el);
  if (formatter) el.textContent = formatter.format(num);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initFormatNumber());
} else {
  initFormatNumber();
}

// Watch for added elements, and re-format when an input attribute changes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes') {
      const target = /** @type {Element} */ (mutation.target);
      if (mutation.attributeName === 'lang') {
        // A lang change re-localises every formatted number beneath it.
        if (target.matches(SELECTOR) && enhanced.has(target)) formatNumber(target);
        target.querySelectorAll(SELECTOR).forEach((el) => { if (enhanced.has(el)) formatNumber(el); });
      } else if (target.matches(SELECTOR)) {
        if (enhanced.has(target)) formatNumber(target);
        else if (target.isConnected) enhanceNumber(target);
      }
      continue;
    }
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) enhanceNumber(el);
      el.querySelectorAll(SELECTOR).forEach(enhanceNumber);
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: WATCHED,
});

export { initFormatNumber };
