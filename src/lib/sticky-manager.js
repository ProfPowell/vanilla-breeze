/**
 * Sticky Manager — viewport-aware sticky coordination
 *
 * Measures the banner header (the first <header> not inside a sectioning
 * element) height and sets --sticky-offset on :root so
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
/**
 * Headers this module marked with data-sticky. The manager owns the banner
 * header's attribute: it adds it only when missing and removes only what it
 * added, so an authored header[data-sticky] is never touched.
 * @type {Set<HTMLElement>}
 */
const headersAddedByUs = new Set();
/** @type {WeakSet<Element>} */
let observed = new WeakSet();

/** Sectioning ancestors that turn a <header> into a section header, not the banner. */
const NOT_BANNER = 'article, aside, main, nav, section, [role="article"], [role="complementary"], [role="main"], [role="navigation"], [role="region"]';

/**
 * The page's banner header: the first <header> that is not scoped to a
 * sectioning element (an article/card header must never be made sticky).
 * @returns {HTMLElement | null}
 */
export function findBannerHeader() {
  for (const header of document.querySelectorAll('header')) {
    if (!header.parentElement?.closest(NOT_BANNER)) return /** @type {HTMLElement} */ (header);
  }
  return null;
}

function update() {
  const root = document.documentElement;
  if (!root.hasAttribute('data-sticky')) return;

  // Ensure the banner header gets data-sticky when the system is active
  const header = findBannerHeader();
  if (header && !header.hasAttribute('data-sticky')) {
    header.dataset.sticky = '';
    headersAddedByUs.add(header);
  }

  if (header && resizeObserver && !observed.has(header)) {
    resizeObserver.observe(header);
    observed.add(header);
  }

  // A header that is not actually sticky (mobile rule, author override)
  // covers nothing, so it contributes no offset.
  const sticky = header?.hasAttribute('data-sticky') && getComputedStyle(header).position !== 'static';
  const offset = header && sticky ? header.getBoundingClientRect().height : 0;
  root.style.setProperty('--sticky-offset', `${offset}px`);
}

function handleToggle() {
  update();
}

export function initStickyManager() {
  // Already running (e.g. re-enabled after <html data-sticky> was restored):
  // just re-measure so the banner header is (re)marked.
  if (active) { update(); return; }
  active = true;

  // Observe the banner header for size changes (banners, responsive reflow);
  // update() attaches it.
  resizeObserver = new ResizeObserver(update);
  observed = new WeakSet();

  // Immediate measure + post-layout refinement
  update();
  requestAnimationFrame(update);

  // Re-measure after fonts load (header height may change)
  document.fonts?.ready?.then(update);

  window.addEventListener('resize', update, { passive: true });
  document.addEventListener('toggle', handleToggle, true);
}

export function destroyStickyManager() {
  if (!active) return;
  active = false;

  window.removeEventListener('resize', update);
  document.removeEventListener('toggle', handleToggle, true);
  resizeObserver?.disconnect();

  // Only remove data-sticky from headers we added it to
  for (const header of headersAddedByUs) delete header.dataset.sticky;
  headersAddedByUs.clear();

  document.documentElement.style.removeProperty('--sticky-offset');
}
