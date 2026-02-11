/**
 * splitter-init: Draggable panel divider via data attributes
 *
 * Enhances containers with data-splitter to inject a full-height
 * drag divider between the first two children. Supports pointer
 * and keyboard interaction with ARIA.
 *
 * @attr {string} data-splitter - "" | "vertical" (default: horizontal)
 *
 * Children may set data-min / data-max (percentage) for constraints.
 *
 * @example
 * <div data-layout="sidebar" data-splitter>
 *   <nav>Sidebar</nav>
 *   <main>Content</main>
 * </div>
 */

const SELECTOR = '[data-splitter]';

function initSplitters(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceSplitter);
}

function enhanceSplitter(container) {
  if (container.hasAttribute('data-splitter-init')) return;
  container.setAttribute('data-splitter-init', '');

  const children = [...container.children];
  if (children.length < 2) return;

  const first = children[0];
  const second = children[1];
  const vertical = container.getAttribute('data-splitter') === 'vertical';
  const min = Number(first.dataset.min) || 10;
  const max = Number(first.dataset.max) || 90;

  // Inject divider
  const divider = document.createElement('div');
  divider.className = 'splitter-divider';
  divider.setAttribute('role', 'separator');
  divider.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
  divider.setAttribute('aria-valuenow', '50');
  divider.setAttribute('aria-valuemin', String(min));
  divider.setAttribute('aria-valuemax', String(max));
  divider.setAttribute('aria-label', 'Resize panels');
  divider.setAttribute('tabindex', '0');
  container.insertBefore(divider, second);

  // Initial layout
  first.style.flexBasis = '50%';
  first.style.flexGrow = '0';
  first.style.flexShrink = '0';
  first.style.overflow = 'auto';
  second.style.flexGrow = '1';
  second.style.overflow = 'auto';

  let dragging = false;

  function setPosition(percent) {
    const clamped = Math.min(max, Math.max(min, percent));
    first.style.flexBasis = `${clamped}%`;
    divider.setAttribute('aria-valuenow', String(Math.round(clamped)));
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
    let percent;
    if (vertical) {
      percent = ((e.clientY - rect.top) / rect.height) * 100;
    } else {
      percent = ((e.clientX - rect.left) / rect.width) * 100;
    }
    setPosition(percent);
  });

  divider.addEventListener('pointerup', (e) => {
    dragging = false;
    divider.releasePointerCapture(e.pointerId);
    container.style.userSelect = '';
  });

  divider.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 1;
    const current = Number(divider.getAttribute('aria-valuenow'));
    const decreaseKeys = vertical ? ['ArrowUp'] : ['ArrowLeft'];
    const increaseKeys = vertical ? ['ArrowDown'] : ['ArrowRight'];

    if (decreaseKeys.includes(e.key)) {
      e.preventDefault();
      setPosition(current - step);
    } else if (increaseKeys.includes(e.key)) {
      e.preventDefault();
      setPosition(current + step);
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

// Watch for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches?.(SELECTOR)) enhanceSplitter(node);
      node.querySelectorAll?.(SELECTOR).forEach(enhanceSplitter);
    }
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

export { initSplitters };
