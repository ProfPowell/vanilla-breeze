/**
 * format-number-init: Locale-aware number formatting
 *
 * Enhances <data> elements with data-format-number to replace their text
 * with a locale-aware formatted string using Intl.NumberFormat.
 * The original text is preserved in the title attribute for hover access.
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
 * @param {Element} el - The data element to enhance
 */
function enhanceNumber(el) {
  if (el.hasAttribute('data-format-number-init')) return;
  el.setAttribute('data-format-number-init', '');

  const raw = el.getAttribute('value');
  if (raw == null) return;

  const num = Number(raw);
  if (isNaN(num)) return;

  // Preserve original text as tooltip
  if (!el.title) {
    el.title = el.textContent.trim();
  }

  const style = el.getAttribute('data-format-number') || 'decimal';
  const locale = el.getAttribute('data-locale') || getLocale();

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

// Watch for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      if (node.matches?.(SELECTOR)) {
        enhanceNumber(node);
      }

      node.querySelectorAll?.(SELECTOR).forEach(enhanceNumber);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initFormatNumber };
