/**
 * number-format: the Intl.NumberFormat options behind data-format-number.
 *
 * Shared by format-number-init (static formatting) and the ticker effect
 * (count-up), so the ticker's last frame is exactly the static output.
 */

import { getLocale } from './i18n.js';

/**
 * Locale for a formatted element: data-locale, else the nearest [lang],
 * else <html lang>, else the browser language.
 * @param {Element} el
 * @returns {string}
 */
export function formatLocale(el) {
  return el.getAttribute('data-locale') || getLocale(el);
}

/**
 * Intl.NumberFormat options for an element's data-format-number style.
 * Fraction digits are Intl's defaults for the style (percent and compact
 * round to whole numbers, currency uses the currency's digits) unless
 * data-fraction-digits (0–20) fixes them.
 * @param {Element} el
 * @returns {Intl.NumberFormatOptions}
 */
export function numberFormatOptions(el) {
  /** @type {Intl.NumberFormatOptions} */
  const opts = {};
  switch (el.getAttribute('data-format-number')) {
    case 'currency':
      opts.style = 'currency';
      opts.currency = el.getAttribute('data-currency') || 'USD';
      break;
    case 'percent':
      opts.style = 'percent';
      break;
    case 'compact':
      opts.notation = 'compact';
      break;
    default:
      break;
  }
  const digits = parseInt(el.getAttribute('data-fraction-digits') ?? '', 10);
  if (Number.isInteger(digits) && digits >= 0 && digits <= 20) {
    opts.minimumFractionDigits = digits;
    opts.maximumFractionDigits = digits;
  }
  return opts;
}

/**
 * A formatter for the element, or null when Intl rejects the options
 * (an unknown currency code, an invalid locale).
 * @param {Element} el
 * @param {Intl.NumberFormatOptions} [extra] - merged over the style options
 * @returns {Intl.NumberFormat|null}
 */
export function numberFormatter(el, extra = {}) {
  try {
    return new Intl.NumberFormat(formatLocale(el), { ...numberFormatOptions(el), ...extra });
  } catch {
    return null;
  }
}
