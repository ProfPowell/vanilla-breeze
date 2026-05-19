/**
 * Sticky Manager — viewport-aware sticky coordination
 *
 * Measures sticky header height and sets --sticky-offset on :root so
 * that all sticky sidebars, TOC, and scroll-padding stay coordinated.
 *
 * CSS handles the height constraint (max-height + overflow-y) directly
 * via calc(100dvh - var(--sticky-offset) - var(--sticky-gap)), so the
 * JS only needs to keep --sticky-offset in sync with the actual header.
 *
 * Only active when <html data-sticky> is present.
 */

let active = false;
let resizeObserver;
let headerAddedByUs = false;

function update() {
  const root = document.documentElement;
  if (!root.hasAttribute('data-sticky')) return;

  // Ensure the first header gets data-sticky when the system is active
  const header = document.querySelector('header');
  if (header && !header.hasAttribute('data-sticky')) {
    header.dataset.sticky = '';
    headerAddedByUs = true;
  }

  const stickyHeader = document.querySelector('header[data-sticky]');
  const offset = stickyHeader ? stickyHeader.getBoundingClientRect().height : 0;
  root.style.setProperty('--sticky-offset', `${offset}px`);
}

function handleToggle() {
  update();
}

export function initStickyManager() {
  if (active) return;
  active = true;

  // Immediate measure + post-layout refinement
  update();
  requestAnimationFrame(update);

  // Re-measure after fonts load (header height may change)
  document.fonts?.ready?.then(update);

  window.addEventListener('resize', update, { passive: true });
  document.addEventListener('toggle', handleToggle, true);

  // Observe header for size changes (e.g. banners, responsive reflow)
  resizeObserver = new ResizeObserver(update);
  const header = document.querySelector('header[data-sticky]');
  if (header) resizeObserver.observe(header);
}

export function destroyStickyManager() {
  if (!active) return;
  active = false;

  window.removeEventListener('resize', update);
  document.removeEventListener('toggle', handleToggle, true);
  resizeObserver?.disconnect();

  // Only remove data-sticky from header if we added it
  if (headerAddedByUs) {
    const header = /** @type {HTMLElement | null} */ (document.querySelector('header[data-sticky]'));
    if (header) delete header.dataset.sticky;
    headerAddedByUs = false;
  }

  document.documentElement.style.removeProperty('--sticky-offset');
}
