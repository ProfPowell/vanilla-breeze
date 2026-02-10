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
 * @param {Element} el - The data element to enhance
 */
function enhanceBytes(el) {
  if (el.hasAttribute('data-format-bytes-init')) return;
  el.setAttribute('data-format-bytes-init', '');

  const raw = el.getAttribute('value');
  if (raw == null) return;

  const bytes = Number(raw);
  if (isNaN(bytes) || bytes < 0) return;

  // Preserve original text as tooltip
  if (!el.title) {
    el.title = el.textContent.trim();
  }

  const precision = parseInt(el.getAttribute('data-format-bytes'), 10) || 0;
  const isDecimal = el.getAttribute('data-unit') === 'decimal';
  const locale = el.getAttribute('data-locale') || undefined;
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

// Watch for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      if (node.matches?.(SELECTOR)) {
        enhanceBytes(node);
      }

      node.querySelectorAll?.(SELECTOR).forEach(enhanceBytes);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initFormatBytes };
