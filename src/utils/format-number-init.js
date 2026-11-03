/**
 * format-number-init: Locale-aware number formatting
 *
 * Enhances <data> elements with data-format-number to replace their text
 * with a locale-aware formatted string using Intl.NumberFormat.
 *
 * @attr {string} data-format-number - Format style: "" (decimal), "currency", "percent", "compact"
 * @attr {string} data-currency - Currency code for currency style (e.g., "USD", "EUR")
 * @attr {string} data-locale - Locale override (e.g., "de-DE")
 *
 * @example
 * <data value="1234567" data-format-number>1,234,567</data>
 * <data value="48200" data-format-number="currency" data-currency="USD">$48,200</data>
 * <data value="0.85" data-format-number="percent">85%</data>
 * <data value="1500000" data-format-number="compact">1.5M</data>
 */

import { getLocale } from '../lib/i18n.js';

const SELECTOR = 'data[data-format-number]';

/**
 * Initialize format-number elements within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initFormatNumber(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceNumber);
}

/**
 * Enhance a single <data> element with formatted number display
 * @param {HTMLElement} el - The data element to enhance
 */
function enhanceNumber(el) {
  if (el.hasAttribute('data-format-number-init')) return;
  el.setAttribute('data-format-number-init', '');
  formatNumber(el);
}

/**
 * Write the formatted value into the element. Runs on enhance and again
 * whenever the value attribute changes. A missing, empty or non-numeric
 * value is invalid: the authored text is left as it is.
 * @param {HTMLElement} el
 */
function formatNumber(el) {
  const raw = el.getAttribute('value');
  if (raw == null || raw.trim() === '') return;

  const num = Number(raw);
  if (isNaN(num)) return;

  const style = el.getAttribute('data-format-number') || 'decimal';
  const locale = el.getAttribute('data-locale') || getLocale();

  /** @type {Intl.NumberFormatOptions} */
  const opts = {};

  switch (style) {
    case 'currency': {
      opts.style = 'currency';
      opts.currency = el.getAttribute('data-currency') || 'USD';
      break;
    }
    case 'percent':
      opts.style = 'percent';
      break;
    case 'compact':
      opts.notation = 'compact';
      break;
    default:
      // decimal (default)
      break;
  }

  try {
    el.textContent = new Intl.NumberFormat(locale, opts).format(num);
  } catch {
    // Intl unavailable or invalid options — keep original text
  }
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initFormatNumber());
} else {
  initFormatNumber();
}

// Watch for dynamically added elements, and re-format when a value changes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes') {
      const target = /** @type {HTMLElement} */ (mutation.target);
      if (target.hasAttribute('data-format-number-init') && target.matches(SELECTOR)) {
        formatNumber(target);
      }
      continue;
    }
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) {
        enhanceNumber(/** @type {HTMLElement} */ (el));
      }

      el.querySelectorAll(SELECTOR).forEach(child => enhanceNumber(/** @type {HTMLElement} */ (child)));
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['value'],
});

export { initFormatNumber };
