/**
 * splitter-init: Draggable panel divider via data attributes
 *
 * Enhances containers with data-splitter to inject a full-height
 * drag divider between the first two children. Supports pointer
 * and keyboard interaction with ARIA. Direction-aware: in RTL the
 * first panel sits on the right, so drag math and arrow keys flip.
 *
 * @attr {string} data-splitter - "" | "vertical" (default: side-by-side)
 * @attr {string} data-label-resize - Accessible name of the divider (default: "Resize panels")
 *
 * Children may set data-min / data-max (percentage) for constraints.
 * The first panel is the one the divider resizes (aria-controls).
 *
 * @fires splitter:resize - { position } after each pointer/keyboard resize
 *
 * @example
 * <section data-layout="sidebar" data-splitter>
 *   <nav>Sidebar</nav>
 *   <main>Content</main>
 * </section>
 */

const SELECTOR = '[data-splitter]';
const DEFAULT_LABEL = 'Resize panels';

/** Containers that already carry live listeners (a clone copies the
 *  attribute and the divider but not the listeners, so the attribute alone
 *  is not proof of enhancement). */
const enhanced = new WeakSet();

let idCounter = 0;

function initSplitters(root = document) {
  /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll(SELECTOR)).forEach(enhanceSplitter);
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Pure: pointer position → first-panel percentage.
 * @param {{ clientX: number, clientY: number }} point
 * @param {{ left: number, right: number, top: number, width: number, height: number }} rect
 * @param {{ vertical: boolean, rtl: boolean }} opts
 * @returns {number} Unclamped percentage of the container.
 */
function pointerToPercent(point, rect, { vertical, rtl }) {
  if (vertical) return ((point.clientY - rect.top) / rect.height) * 100;
  const offset = rtl ? rect.right - point.clientX : point.clientX - rect.left;
  return (offset / rect.width) * 100;
}

/**
 * Pure: key → step direction for the first panel (+1 grow, -1 shrink, 0 none).
 * Arrow keys move the divider in their visual direction.
 * @param {string} key
 * @param {{ vertical: boolean, rtl: boolean }} opts
 * @returns {-1 | 0 | 1}
 */
function keyToDirection(key, { vertical, rtl }) {
  if (vertical) {
    if (key === 'ArrowUp') return -1;
    if (key === 'ArrowDown') return 1;
    return 0;
  }
  if (key === 'ArrowLeft') return rtl ? 1 : -1;
  if (key === 'ArrowRight') return rtl ? -1 : 1;
  return 0;
}

/** @param {HTMLElement} container */
function enhanceSplitter(container) {
  if (enhanced.has(container)) return;

  // A cloned or re-parsed container may carry a stale divider without
  // listeners: drop it before injecting a live one.
  for (const stale of container.querySelectorAll(':scope > .split-divider')) stale.remove();

  const children = [...container.children];
  if (children.length < 2) return;

  enhanced.add(container);
  container.setAttribute('data-splitter-init', '');

  const first = /** @type {HTMLElement} */ (children[0]);
  const second = /** @type {HTMLElement} */ (children[1]);
  const vertical = container.getAttribute('data-splitter') === 'vertical';
  const min = Number(first.dataset.min) || 10;
  const max = Number(first.dataset.max) || 90;
  const isRtl = () => getComputedStyle(container).direction === 'rtl';

  if (!first.id) first.id = `vb-splitter-panel-${++idCounter}`;

  // Inject divider. aria-orientation names the divider's own axis:
  // side-by-side panels have a vertical bar.
  const divider = document.createElement('div');
  divider.className = 'split-divider';
  divider.setAttribute('role', 'separator');
  divider.setAttribute('aria-orientation', vertical ? 'horizontal' : 'vertical');
  divider.setAttribute('aria-valuemin', String(min));
  divider.setAttribute('aria-valuemax', String(max));
  divider.setAttribute('aria-label', container.getAttribute('data-label-resize') || DEFAULT_LABEL);
  divider.setAttribute('aria-controls', first.id);
  divider.setAttribute('tabindex', '0');
  container.insertBefore(divider, second);

  // Initial layout
  first.style.flexGrow = '0';
  first.style.flexShrink = '0';
  first.style.overflow = 'auto';
  second.style.flexGrow = '1';
  second.style.overflow = 'auto';

  let dragging = false;
  let position = 50;

  function setPosition(percent, { silent = false } = {}) {
    position = clamp(percent, min, max);
    first.style.flexBasis = `${position}%`;
    divider.setAttribute('aria-valuenow', String(Math.round(position)));
    if (silent) return;
    container.dispatchEvent(new CustomEvent('splitter:resize', {
      detail: { position }, bubbles: true
    }));
  }

  // Clamp the initial 50% into data-min / data-max.
  setPosition(50, { silent: true });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    container.style.userSelect = '';
  }

  divider.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    dragging = true;
    divider.setPointerCapture(e.pointerId);
    container.style.userSelect = 'none';
  });

  divider.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = container.getBoundingClientRect();
    setPosition(pointerToPercent(e, rect, { vertical, rtl: isRtl() }));
  });

  divider.addEventListener('pointerup', (e) => {
    if (divider.hasPointerCapture(e.pointerId)) divider.releasePointerCapture(e.pointerId);
    endDrag();
  });

  // A cancelled gesture (touch scroll takeover, capture stolen) must not
  // leave the container unselectable or the drag flag stuck on.
  divider.addEventListener('pointercancel', endDrag);
  divider.addEventListener('lostpointercapture', endDrag);

  divider.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 1;
    const dir = keyToDirection(e.key, { vertical, rtl: isRtl() });

    if (dir !== 0) {
      e.preventDefault();
      setPosition(position + dir * step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setPosition(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      setPosition(max);
    }
  });
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSplitters());
} else {
  initSplitters();
}

// Watch for dynamically added elements. Re-inserting an enhanced container
// is a no-op (WeakSet), so remove + reinsert never duplicates the divider.
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {HTMLElement} */ (node);
      if (el.matches(SELECTOR)) enhanceSplitter(el);
      /** @type {NodeListOf<HTMLElement>} */ (el.querySelectorAll(SELECTOR)).forEach(enhanceSplitter);
    }
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

export { initSplitters, pointerToPercent, keyToDirection };
