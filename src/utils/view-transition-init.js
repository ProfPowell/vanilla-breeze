/**
 * view-transition-init: Declarative view-transition-name assignment
 *
 * Sets view-transition-name from data-vt-name attribute values,
 * eliminating the need for inline styles.
 *
 * @attr {string} data-vt-name - The view-transition-name to assign
 *
 * @example
 * <img data-vt-name="hero-42" src="..." />
 * <!-- equivalent to style="view-transition-name: hero-42" -->
 */

const SELECTOR = '[data-vt-name]';

/**
 * Apply (or clear) the name. Idempotent: no "already done" flag, so clones,
 * re-inserted elements and changed values all end up with the current name.
 * @param {Element} el
 */
function enhance(el) {
  const htmlEl = /** @type {HTMLElement} */ (el);
  // Strip the pre-2026-11 marker attribute if a stale copy is present.
  htmlEl.removeAttribute('data-vt-name-init');
  htmlEl.style.viewTransitionName = htmlEl.dataset.vtName || '';
}

function init(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhance);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init();
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes') {
      enhance(/** @type {Element} */ (mutation.target));
      continue;
    }
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) enhance(el);
      el.querySelectorAll(SELECTOR).forEach(enhance);
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['data-vt-name'],
});

export { init as initViewTransitions };
