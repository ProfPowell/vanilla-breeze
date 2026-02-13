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

function enhance(el) {
  if (el.hasAttribute('data-vt-name-init')) return;
  el.setAttribute('data-vt-name-init', '');
  el.style.viewTransitionName = el.dataset.vtName;
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
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhance(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhance);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { init as initViewTransitions };
