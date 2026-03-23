/**
 * content-swap: Two-face content toggle with accessible state management
 *
 * Toggles between front and back content with configurable transition effects.
 * Manages `inert` on the hidden face so screen readers only see visible content.
 *
 * @attr {string} transition - Transition type: "flip" (default), "flip-vertical", "fade", "slide-left", "slide-up", "scale"
 * @attr {boolean} swapped - Reflects swap state
 * @attr {boolean} card - Apply layout-card visual shell
 *
 * Child attributes:
 * @attr {string} data-face - "front" or "back" on child elements
 * @attr {boolean} data-swap - Marks an element as a swap trigger (on children),
 *                              or enables swap behavior on any element (on the element itself)
 *
 * @example
 * <content-swap transition="flip">
 *   <div data-face="front">Front content</div>
 *   <div data-face="back">Back content</div>
 * </content-swap>
 *
 * @example
 * <article data-swap data-transition="fade">
 *   <div data-face="front">Front</div>
 *   <div data-face="back">Back</div>
 * </article>
 */

import { startSwapTransition } from '../../utils/swap-transition.js';
import { registerComponent } from '../../lib/bundle-registry.js';

let swapInstanceId = 0;

/**
 * Return the attribute name for a given logical property.
 * <content-swap> uses clean attributes; [data-swap] uses data-* attributes.
 */
function attrName(el, name) {
  return el.matches('content-swap') ? name : `data-${name}`;
}

/**
 * Shared behavior mixin — used by both the <content-swap> element
 * and [data-swap] attribute auto-init.
 */
function initSwapBehavior(el) {
  // Assign unique view-transition-name per instance (avoids conflicts with multiple swaps)
  if (!el.style.viewTransitionName) {
    el.style.viewTransitionName = `content-swap-${++swapInstanceId}`;
  }
  const front = el.querySelector(':scope > [data-face="front"]');
  const back = el.querySelector(':scope > [data-face="back"]');

  if (!front || !back) return;

  const triggers = [...el.querySelectorAll('[data-swap]')].filter(
    t => t !== el && t.closest('content-swap, [data-swap]') === el
  );
  const isWholeElementTrigger = triggers.length === 0;

  if (isWholeElementTrigger) {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', 'Toggle content');
    }
    el.addEventListener('click', () => toggleSwap(el));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSwap(el);
      }
    });
  } else {
    triggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSwap(el);
      });
    });
  }

  syncState(el, front, back);
}

function syncState(el, front, back) {
  const swapped = el.hasAttribute(attrName(el, 'swapped'));
  front.inert = swapped;
  back.inert = !swapped;
}

function getFaces(el) {
  return {
    front: el.querySelector(':scope > [data-face="front"]'),
    back: el.querySelector(':scope > [data-face="back"]'),
  };
}

function swapTo(el, show) {
  const { front, back } = getFaces(el);
  if (!front || !back) return;

  const attr = attrName(el, 'swapped');
  if (show && el.hasAttribute(attr)) return;
  if (!show && !el.hasAttribute(attr)) return;

  const applySwap = () => {
    if (show) {
      el.setAttribute(attr, '');
    } else {
      el.removeAttribute(attr);
    }

    syncState(el, front, back);
    dispatchSwapEvent(el);
    moveFocus(show ? back : front);
  };

  startSwapTransition(applySwap);
}

function toggleSwap(el) {
  swapTo(el, !el.hasAttribute(attrName(el, 'swapped')));
}

function dispatchSwapEvent(el) {
  el.dispatchEvent(new CustomEvent('content-swap:swap', {
    detail: { swapped: el.hasAttribute(attrName(el, 'swapped')) },
    bubbles: true,
  }));
}

function moveFocus(face) {
  const focusTarget = face.querySelector(
    '[autofocus], [data-swap], button, a, input, select, textarea'
  );
  if (focusTarget) {
    focusTarget.focus();
  }
}

/**
 * <content-swap> custom element
 */
class ContentSwap extends HTMLElement {
  connectedCallback() {
    initSwapBehavior(this);
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
  }

  /** Swap to show the back face */
  flip() { swapTo(this, true); }

  /** Swap to show the front face */
  unflip() { swapTo(this, false); }

  /** Toggle between front and back */
  toggle() { toggleSwap(this); }

  /** @returns {boolean} Whether currently showing the back face */
  get flipped() { return this.hasAttribute('swapped'); }

  set flipped(value) { swapTo(this, !!value); }

  /** @returns {boolean} Alias for flipped */
  get swapped() { return this.hasAttribute('swapped'); }

  set swapped(value) { swapTo(this, !!value); }
}

registerComponent('content-swap', ContentSwap);

/**
 * Auto-init [data-swap] attribute form
 */
function autoInitSwap() {
  document.querySelectorAll('[data-swap]:not(content-swap):not([data-swap-init])').forEach(el => {
    // Skip child trigger buttons — only init elements that have data-face children
    if (!el.querySelector(':scope > [data-face]')) return;
    initSwapBehavior(el);
    el.setAttribute('data-swap-init', '');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInitSwap);
} else {
  autoInitSwap();
}

// Observe for dynamically added [data-swap] elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);
      if (el.hasAttribute('data-swap') && !el.matches('content-swap') && !el.hasAttribute('data-swap-init')) {
        if (el.querySelector(':scope > [data-face]')) {
          initSwapBehavior(el);
          el.setAttribute('data-swap-init', '');
        }
      }
      // Also check descendants
      el.querySelectorAll('[data-swap]:not(content-swap):not([data-swap-init])').forEach(el => {
        if (el.querySelector(':scope > [data-face]')) {
          initSwapBehavior(el);
          el.setAttribute('data-swap-init', '');
        }
      });
    }
  }
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

export { ContentSwap };
