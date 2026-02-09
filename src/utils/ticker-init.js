/**
 * ticker-init: Animated number count-up on scroll
 *
 * Enhances <data> elements with data-ticker to animate from a start value
 * to the target value when scrolled into view. Uses easeOutExpo easing
 * for a classic ticker feel. Cooperates with data-format-number for
 * locale-aware formatting during animation.
 *
 * @attr {string} data-ticker - Duration in ms (default "1000"). Empty = 1000ms.
 * @attr {string} data-ticker-start - Start value (default "0").
 * @attr {string} data-ticker-decimals - Decimal places during animation (auto-detected from value if omitted).
 * @attr {string} data-locale - Locale override (shared with data-format-number).
 *
 * @example
 * <data value="24521" data-ticker>24,521</data>
 * <data value="48200" data-ticker="2000" data-format-number="currency" data-currency="USD">$48,200</data>
 * <data value="99.99" data-ticker data-ticker-decimals="2">99.99</data>
 */

const SELECTOR = 'data[data-ticker]';

/**
 * easeOutExpo — fast start, decelerating finish
 * @param {number} t - Progress from 0 to 1
 * @returns {number} Eased value from 0 to 1
 */
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Detect decimal places from a numeric string
 * @param {string} value - The value attribute string
 * @returns {number} Number of decimal places
 */
function detectDecimals(value) {
  const dot = value.indexOf('.');
  return dot === -1 ? 0 : value.length - dot - 1;
}

/**
 * Build an Intl.NumberFormat that matches the data-format-number configuration
 * on the element, if present.
 * @param {Element} el - The data element
 * @param {number} decimals - Decimal places for animation
 * @returns {Intl.NumberFormat|null} Formatter or null if no formatting needed
 */
function buildFormatter(el, decimals) {
  const locale = el.getAttribute('data-locale') || undefined;
  const formatStyle = el.getAttribute('data-format-number');

  // If data-format-number is present, mirror its Intl.NumberFormat options
  if (formatStyle != null) {
    const opts = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    };

    switch (formatStyle) {
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
        // decimal (default) — no extra opts
        break;
    }

    try {
      return new Intl.NumberFormat(locale, opts);
    } catch {
      return null;
    }
  }

  // No data-format-number: use basic formatting with locale grouping
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  } catch {
    return null;
  }
}

/**
 * Animate a single ticker element from start to end value
 * @param {Element} el - The data element to animate
 */
function animateTicker(el) {
  const raw = el.getAttribute('value');
  if (raw == null) return;

  const endValue = Number(raw);
  if (isNaN(endValue)) return;

  const startValue = Number(el.getAttribute('data-ticker-start') || '0');
  const duration = parseInt(el.getAttribute('data-ticker') || '1000', 10) || 1000;
  const decimals = el.hasAttribute('data-ticker-decimals')
    ? parseInt(el.getAttribute('data-ticker-decimals'), 10)
    : detectDecimals(raw);

  const formatter = buildFormatter(el, decimals);
  const range = endValue - startValue;

  // Nothing to animate
  if (range === 0) return;

  let startTime = null;

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutExpo(progress);
    const current = startValue + range * eased;

    el.textContent = formatter ? formatter.format(current) : current.toFixed(decimals);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Animation complete — set final formatted value
      el.textContent = formatter ? formatter.format(endValue) : endValue.toFixed(decimals);

      // Prevent data-format-number from re-processing
      if (el.hasAttribute('data-format-number')) {
        el.setAttribute('data-format-number-init', '');
      }
    }
  }

  requestAnimationFrame(tick);
}

/**
 * Check if reduced motion is preferred
 * @returns {boolean}
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.hasAttribute('data-motion-reduced');
}

/**
 * Set up IntersectionObserver for a ticker element
 * @param {Element} el - The data element to observe
 */
function observeTicker(el) {
  if (el.hasAttribute('data-ticker-init')) return;
  el.setAttribute('data-ticker-init', '');

  // Reduced motion: skip animation, let format-number handle normally
  if (prefersReducedMotion()) return;

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.disconnect();
        animateTicker(el);
      }
    }
  }, { threshold: 0.1 });

  io.observe(el);
}

/**
 * Initialize ticker elements within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initTicker(root = document) {
  root.querySelectorAll(SELECTOR).forEach(observeTicker);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initTicker());
} else {
  initTicker();
}

// Watch for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      if (node.matches?.(SELECTOR)) {
        observeTicker(node);
      }

      node.querySelectorAll?.(SELECTOR).forEach(observeTicker);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initTicker };
