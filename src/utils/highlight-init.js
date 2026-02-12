/**
 * highlight-init: Draw-in underline, box, or circle highlight on scroll
 *
 * IntersectionObserver adds [data-highlight-visible] when the element
 * scrolls into view. CSS handles all animation via background-size
 * transitions (underline/box) or ::after scale (circle).
 *
 * @attr {string} data-highlight - "" or "underline", "box", "circle"
 * @attr {string} data-highlight-color - CSS color (default: currentColor)
 */

const SELECTOR = '[data-highlight]';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.hasAttribute('data-motion-reduced');
}

function enhanceHighlight(el) {
  if (el.hasAttribute('data-highlight-init')) return;
  el.setAttribute('data-highlight-init', '');

  const color = el.getAttribute('data-highlight-color');
  if (color) {
    el.style.setProperty('--highlight-color', color);
  }

  if (prefersReducedMotion()) {
    el.setAttribute('data-highlight-visible', '');
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.disconnect();
        el.setAttribute('data-highlight-visible', '');
      }
    }
  }, { threshold: 0.1 });

  io.observe(el);
}

function initHighlight(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceHighlight);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initHighlight());
} else {
  initHighlight();
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceHighlight(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceHighlight);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initHighlight };
