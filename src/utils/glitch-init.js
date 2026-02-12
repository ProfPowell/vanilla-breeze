/**
 * glitch-init: Set data-glitch-text for CSS pseudo-element content
 *
 * The CSS glitch effect uses ::before/::after with content: attr(data-glitch-text).
 * This tiny init copies the element's text content into that attribute so the
 * pseudo-elements can duplicate it for the chromatic aberration effect.
 *
 * @attr {string} data-glitch - "" (always on) or "hover" (on hover only)
 */

const SELECTOR = '[data-glitch]';

function enhanceGlitch(el) {
  if (el.hasAttribute('data-glitch-init')) return;
  el.setAttribute('data-glitch-init', '');
  el.setAttribute('data-glitch-text', el.textContent);
}

function initGlitch(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceGlitch);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initGlitch());
} else {
  initGlitch();
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceGlitch(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceGlitch);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initGlitch };
