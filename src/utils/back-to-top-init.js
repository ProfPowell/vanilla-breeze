/**
 * back-to-top-init: Auto-appearing back-to-top floating link
 *
 * Enhances every `[data-back-to-top]` element so that:
 *   - Click smooth-scrolls the page to the top (preventing href="#" jumps).
 *   - The element is hidden until the user scrolls past ~1 viewport, then
 *     fades in via `data-visible`. Toggling stops near the top so the
 *     button doesn't sit on top of hero content.
 *   - Respects `prefers-reduced-motion`: instant scroll, no opacity ramp.
 *
 * Pairs with src/utils/back-to-top.css (visual chrome) and the shared
 * src/utils/float.css positioning system. Self-bootstraps on DOMContentLoaded
 * and observes the DOM for added back-to-top elements.
 *
 * @example
 *   <a href="#top" data-back-to-top data-float="bottom-right" aria-label="Back to top">↑</a>
 */

const SELECTOR = '[data-back-to-top]';
const SHOW_AFTER_RATIO = 1; // show after the user scrolls one viewport down
const HIDE_NEAR_TOP_PX = 200; // hide again when within this distance of the top

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let activeElements = new Set();
let scrollListener = null;
let ticking = false;

function enhance(el) {
  if (el.hasAttribute('data-back-to-top-init')) return;
  el.setAttribute('data-back-to-top-init', '');

  // Initial state: hidden until scroll listener decides otherwise.
  el.toggleAttribute('data-visible', false);

  el.addEventListener('click', onClick);
  activeElements.add(el);

  // Make sure the listener is wired and run an initial sync.
  ensureScrollListener();
  syncVisibility();
}

function unenhance(el) {
  if (!el.hasAttribute('data-back-to-top-init')) return;
  el.removeAttribute('data-back-to-top-init');
  el.removeEventListener('click', onClick);
  activeElements.delete(el);
  if (activeElements.size === 0 && scrollListener) {
    window.removeEventListener('scroll', scrollListener);
    scrollListener = null;
  }
}

/**
 * Find the element that actually scrolls the page. VB's base layout
 * gives `<body>` overflow: auto and locks `<html>` to overflow: hidden,
 * so the document scrolling element (always `<html>` in standards mode)
 * doesn't actually move. Detect that case and prefer body, falling back
 * to html / scrollingElement for normal pages. Result is cached and
 * recomputed only on demand to avoid getComputedStyle in scroll loops.
 */
let cachedScroller = null;
function getScroller() {
  if (cachedScroller && cachedScroller.isConnected) return cachedScroller;
  const html = document.documentElement;
  const body = document.body;
  const htmlOverflowsY = body && body.scrollHeight > html.clientHeight + 1;
  if (htmlOverflowsY && body) {
    const bodyCs = getComputedStyle(body);
    if (/auto|scroll/.test(bodyCs.overflowY)) {
      cachedScroller = body;
      return body;
    }
  }
  cachedScroller = document.scrollingElement || html;
  return cachedScroller;
}

function onClick(event) {
  // Defensive: only intercept if the link target would jump (href="#" /
  // href="#top"). Authors using a real fragment to deep-scroll keep that
  // behavior.
  const href = event.currentTarget.getAttribute('href') || '';
  if (href === '' || href === '#' || href === '#top') {
    event.preventDefault();
  } else {
    // Real fragment — let the browser handle it but don't smooth-scroll.
    return;
  }
  const scroller = getScroller();
  scroller.scrollTo({
    top: 0,
    left: 0,
    behavior: reducedMotion.matches ? 'auto' : 'smooth',
  });
}

function ensureScrollListener() {
  if (scrollListener) return;
  scrollListener = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      syncVisibility();
      ticking = false;
    });
  };
  // Listen on both the scroller and the window — the layout may scroll
  // the body (window scroll fires) or a custom container (rare). Both
  // bubble to window in practice; capture on document covers any
  // sub-tree scrolls too.
  window.addEventListener('scroll', scrollListener, { passive: true });
  document.addEventListener('scroll', scrollListener, { capture: true, passive: true });
}

function syncVisibility() {
  const scroller = getScroller();
  const y = scroller.scrollTop || window.scrollY;
  const vh = window.innerHeight;
  const showThreshold = vh * SHOW_AFTER_RATIO;
  const visible = y > showThreshold;
  const nearTop = y < HIDE_NEAR_TOP_PX;
  for (const el of activeElements) {
    el.toggleAttribute('data-visible', visible && !nearTop);
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────

function initAll(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhance);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAll(), { once: true });
} else {
  initAll();
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) enhance(/** @type {HTMLElement} */ (el));
      el.querySelectorAll(SELECTOR).forEach(child => enhance(/** @type {HTMLElement} */ (child)));
    }
    for (const node of mutation.removedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);
      if (el.matches?.(SELECTOR)) unenhance(/** @type {HTMLElement} */ (el));
      el.querySelectorAll?.(SELECTOR).forEach(child => unenhance(/** @type {HTMLElement} */ (child)));
    }
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

export { initAll };
