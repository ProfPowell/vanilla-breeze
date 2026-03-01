/**
 * rating-init: Progressive enhancement for data-rating fieldsets
 *
 * Enhances native radio-based star ratings with:
 * - Clear/unrate: click the selected star to deselect
 * - rating-change event: CustomEvent with { value } detail
 * - Screen reader announcements via live region
 *
 * @attr {boolean} data-rating - Marks a fieldset as a rating widget
 * @attr {boolean} data-rating-half - Enables half-star increments
 *
 * @example
 * <fieldset data-rating>
 *   <legend>Rate this</legend>
 *   <label><input type="radio" name="r" value="1" aria-label="1 star">★</label>
 *   ...
 * </fieldset>
 */

const SELECTOR = '[data-rating]';
const ANNOUNCE_DURATION = 1000;

/**
 * Initialize rating fieldsets within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initRatings(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceRating);
}

/**
 * Enhance a single rating fieldset
 * @param {HTMLFieldSetElement} fieldset - The fieldset to enhance
 */
function enhanceRating(fieldset) {
  if (fieldset.hasAttribute('data-rating-init')) return;
  fieldset.setAttribute('data-rating-init', '');

  if (fieldset.hasAttribute('data-rating-readonly')) return;

  let lastValue = getCheckedValue(fieldset);

  // Track value before the browser processes the click.
  // On mousedown the radio is still in its pre-click state.
  let pendingClear = false;

  fieldset.addEventListener('mousedown', (e) => {
    const label = /** @type {Element} */ (e.target).closest('label');
    if (!label) return;

    const radio = /** @type {HTMLInputElement|null} */ (label.querySelector('input[type="radio"]'));
    if (!radio) return;

    // If clicking an already-checked radio, flag it for clear
    pendingClear = radio.checked && radio.value === lastValue;
  });

  // On click, the browser has already checked the radio.
  // If we flagged a pending clear, uncheck it now.
  fieldset.addEventListener('click', (e) => {
    if (!pendingClear) return;
    pendingClear = false;

    const label = /** @type {Element} */ (e.target).closest('label');
    if (!label) return;

    const radio = /** @type {HTMLInputElement|null} */ (label.querySelector('input[type="radio"]'));
    if (!radio) return;

    radio.checked = false;
    lastValue = '0';
    dispatch(fieldset, 0);
    announce('Rating cleared');
  });

  // Normal selection via change event
  fieldset.addEventListener('change', (e) => {
    const target = /** @type {HTMLInputElement} */ (e.target);
    if (target.type !== 'radio') return;
    if (pendingClear) return; // Will be handled by click
    lastValue = target.value;
    dispatch(fieldset, Number(target.value));
    announce(`Rating: ${target.value} ${Number(target.value) === 1 ? 'star' : 'stars'}`);
  });
}

/**
 * Get the currently checked radio value
 * @param {HTMLFieldSetElement} fieldset
 * @returns {string}
 */
function getCheckedValue(fieldset) {
  const checked = /** @type {HTMLInputElement|null} */ (fieldset.querySelector('input[type="radio"]:checked'));
  return checked ? checked.value : '0';
}

/**
 * Dispatch a rating-change event
 * @param {HTMLFieldSetElement} fieldset
 * @param {number} value
 */
function dispatch(fieldset, value) {
  fieldset.dispatchEvent(new CustomEvent('rating-change', {
    bubbles: true,
    detail: { value }
  }));
}

/**
 * Announce a message to screen readers via a temporary live region
 * @param {string} message
 */
function announce(message) {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  Object.assign(el.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: '0'
  });
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ANNOUNCE_DURATION);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initRatings());
} else {
  initRatings();
}

// Watch for dynamically added rating fieldsets
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) {
        enhanceRating(/** @type {HTMLFieldSetElement} */ (el));
      }

      el.querySelectorAll(SELECTOR).forEach(child => enhanceRating(/** @type {HTMLFieldSetElement} */ (child)));
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initRatings };
