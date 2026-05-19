/**
 * progress-ring-init: Upscale progress[data-type="ring"] to circular display
 *
 * Progressive enhancement over native <progress>. Without JS, the element
 * renders as a standard linear progress bar. With JS, it enhances to a
 * circular ring with auto-synced --progress and an optional center label.
 *
 * The utility:
 * 1. Reads value/max and sets --progress CSS custom property
 * 2. Wraps the element in a grid container for center label overlay
 * 3. Generates a center label from the element's text content
 * 4. Observes value attribute changes to keep --progress in sync
 * 5. Marks enhanced elements with [data-enhanced] for CSS targeting
 *
 * @attr {string} data-type="ring" - Marks a <progress> for circular enhancement
 * @attr {string} data-size        - Ring size variant (xs, s, m, l, xl)
 * @attr {string} data-label       - Override center label text ("none" hides it)
 *
 * @example
 * <progress data-type="ring" value="75" max="100">75%</progress>
 *
 * @example Indeterminate
 * <progress data-type="ring" aria-label="Loading">Loading...</progress>
 */

const SELECTOR = 'progress[data-type="ring"]';

/** Size → CSS custom property mapping for label font scaling */
const SIZE_MAP = {
  xs: '2em', s: '3em', m: '4em', l: '6em', xl: '8em',
};

/**
 * Compute percentage from value/max
 * @param {HTMLProgressElement} el
 * @returns {number} 0-100
 */
function getPercent(el) {
  const max = el.max || 100;
  const val = el.value;
  return max > 0 ? Math.round((val / max) * 100) : 0;
}

/**
 * Sync --progress CSS property from value/max
 * @param {HTMLProgressElement} el
 */
function syncProgress(el) {
  const pct = getPercent(el);
  el.style.setProperty('--progress', String(pct));

  // Update label if present
  const label = el.parentElement?.querySelector('.progress-ring-label');
  if (label && !el.dataset.label) {
    label.textContent = pct + '%';
  }
}

/**
 * Enhance a single progress element into a ring
 * @param {HTMLProgressElement} el
 */
function enhanceRing(el) {
  if (el.hasAttribute('data-enhanced')) return;
  el.setAttribute('data-enhanced', '');

  // Sync --progress from value/max
  syncProgress(el);

  // Determine if we need a center label
  const labelText = el.dataset.label;
  const hideLabel = labelText === 'none';
  const isIndeterminate = !el.hasAttribute('value');

  if (!hideLabel && !isIndeterminate) {
    // Wrap in grid container for label overlay
    const wrap = document.createElement('div');
    wrap.className = 'progress-ring-wrap';

    // Transfer inline size for label scaling
    const size = el.dataset.size;
    if (size && SIZE_MAP[size]) {
      wrap.style.setProperty('--progress-ring-size', SIZE_MAP[size]);
    }

    el.parentNode?.insertBefore(wrap, el);
    wrap.appendChild(el);

    // Create label
    const label = document.createElement('span');
    label.className = 'progress-ring-label';
    label.textContent = labelText || (getPercent(el) + '%');
    label.setAttribute('aria-hidden', 'true');
    wrap.appendChild(label);
  }
}

/**
 * Initialize ring progress elements within a root
 * @param {Element|Document} root
 */
function initProgressRings(root = document) {
  root.querySelectorAll(SELECTOR).forEach(el => enhanceRing(/** @type {HTMLProgressElement} */ (el)));
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initProgressRings());
} else {
  initProgressRings();
}

// Watch for dynamically added rings AND value attribute changes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    // New elements
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) enhanceRing(/** @type {HTMLProgressElement} */ (el));
      el.querySelectorAll(SELECTOR).forEach(child => enhanceRing(/** @type {HTMLProgressElement} */ (child)));
    }

    // Value changes on existing rings
    if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
      const el = /** @type {HTMLProgressElement} */ (mutation.target);
      if (el.matches(SELECTOR) && el.hasAttribute('data-enhanced')) {
        syncProgress(el);
      }
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['value'],
});

export { initProgressRings };
