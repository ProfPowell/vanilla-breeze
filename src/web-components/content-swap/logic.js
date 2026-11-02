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
 * @attr {boolean} data-swap-toggle - Direct-child toggle button used when there are no
 *                              [data-swap] triggers (generated as "Show back" if absent)
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
import { VBElement } from '../../lib/vb-element.js';

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
 *
 * @returns {(() => void) | undefined} Cleanup function to remove listeners
 */
function initSwapBehavior(el) {
  const front = el.querySelector(':scope > [data-face="front"]');
  const back = el.querySelector(':scope > [data-face="back"]');

  if (!front || !back) return;

  // Assign unique view-transition-name per instance (avoids conflicts with
  // multiple swaps). The shared animation hooks off view-transition-class
  // (set in styles.css), since ::view-transition-old() takes no wildcards.
  if (!el.style.viewTransitionName) {
    el.style.viewTransitionName = `content-swap-${++swapInstanceId}`;
  }

  const isElement = el.matches('content-swap');
  // The attribute form's "upgraded" marker gates the stacking CSS, so it is
  // set here (before the first style flush) rather than by the caller.
  if (!isElement) el.setAttribute('data-swap-init', '');

  const cleanups = [];

  function listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    cleanups.push(() => target.removeEventListener(event, handler, options));
  }

  // A trigger belongs to this host when its nearest swap host ancestor is
  // this element. Start from the parent: `closest()` includes the element
  // itself, and every trigger matches [data-swap].
  const triggers = [...el.querySelectorAll('[data-swap]')].filter(
    t => t.parentElement?.closest('content-swap, [data-swap]') === el
  );
  const isWholeElementTrigger = triggers.length === 0;

  let toggle = /** @type {HTMLElement | null} */ (el.querySelector(':scope > [data-swap-toggle]'));

  if (isWholeElementTrigger) {
    // Keyboard / assistive-technology target: a real toggle button outside
    // both faces (so it is never made inert). The container itself is never
    // given a button role, which would flatten the faces' content and links
    // into a single opaque control. Authors may supply their own
    // <button data-swap-toggle> to set the label.
    if (!toggle) {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('data-swap-toggle', '');
      button.textContent = 'Show back';
      el.append(button);
      toggle = button;
    }
    listen(toggle, 'click', (e) => {
      e.stopPropagation();
      // detail === 0: activated from the keyboard (Enter/Space) or AT
      toggleSwap(el, /** @type {MouseEvent} */ (e).detail === 0 ? 'keyboard' : 'pointer');
    });

    // Pointer convenience: a click anywhere on the surface toggles, unless
    // it lands on an interactive descendant (links, buttons, fields…).
    listen(el, 'click', (e) => {
      const target = /** @type {Element} */ (e.target);
      const interactive = target.closest?.(INTERACTIVE);
      if (interactive && interactive !== el && el.contains(interactive)) return;
      toggleSwap(el, 'pointer');
    });
  } else {
    // Explicit triggers replace the generated toggle.
    if (toggle && !toggle.hasAttribute('data-swap')) toggle.remove();
    toggle = null;
    triggers.forEach(trigger => {
      listen(trigger, 'click', (e) => {
        e.stopPropagation();
        toggleSwap(el, 'pointer');
      });
      listen(trigger, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSwap(el, 'keyboard');
        }
      });
    });
  }

  // Optional swipe/flick to toggle. Author opts in with data-gesture="flick"
  // (or "swipe") on the host; the global gesture init wires the recognizer
  // and dispatches `swipe-left`/`swipe-right` events that we toggle on.
  // Works for both whole-element and explicit-trigger configurations.
  if (el.matches('[data-gesture="flick"], [data-gesture="swipe"]')) {
    listen(el, 'swipe-left', () => toggleSwap(el, 'pointer'));
    listen(el, 'swipe-right', () => toggleSwap(el, 'pointer'));
  }

  // <content-swap> observes `swapped` via attributeChangedCallback; the
  // attribute form has no lifecycle callbacks, so watch data-swapped here.
  if (!isElement) {
    const mo = new MutationObserver(() => syncState(el, front, back));
    mo.observe(el, { attributes: true, attributeFilter: ['data-swapped'] });
    cleanups.push(() => mo.disconnect());
  }

  syncState(el, front, back);
  settleWithoutTransition([front, back]);

  return () => {
    for (const fn of cleanups) fn();
    cleanups.length = 0;
  };
}

/** Interactive descendants that keep their own click behaviour */
const INTERACTIVE = 'a[href], button, input, select, textarea, label, summary, [contenteditable=""], [contenteditable="true"], [tabindex]';

/**
 * The stacking/transform CSS only applies once upgraded. Flush that style
 * change with transitions off so faces don't animate into place on load.
 * @param {HTMLElement[]} faces
 */
function settleWithoutTransition(faces) {
  const previous = faces.map(f => f.style.transition);
  for (const f of faces) f.style.transition = 'none';
  for (const f of faces) void getComputedStyle(f).transform;
  faces.forEach((f, i) => { f.style.transition = previous[i]; });
}

function syncState(el, front, back) {
  const swapped = el.hasAttribute(attrName(el, 'swapped'));
  front.inert = swapped;
  back.inert = !swapped;
  el.querySelector(':scope > [data-swap-toggle]')
    ?.setAttribute('aria-pressed', String(swapped));
}

function getFaces(el) {
  return {
    front: el.querySelector(':scope > [data-face="front"]'),
    back: el.querySelector(':scope > [data-face="back"]'),
  };
}

/**
 * @param {Element} el
 * @param {boolean} show
 * @param {'pointer' | 'keyboard' | 'api'} [source='api']
 */
function swapTo(el, show, source = 'api') {
  const { front, back } = getFaces(el);
  if (!front || !back) return;

  const attr = attrName(el, 'swapped');
  if (show && el.hasAttribute(attr)) return;
  if (!show && !el.hasAttribute(attr)) return;
  const focusedBefore = document.activeElement;

  const applySwap = () => {
    if (show) {
      el.setAttribute(attr, '');
    } else {
      el.removeAttribute(attr);
    }

    syncState(el, front, back);
    dispatchSwapEvent(el, source);

    // Focus management: [autofocus] on the incoming face always wins.
    // Otherwise focus only moves on keyboard-triggered swaps whose focus was
    // inside the outgoing (now inert) face, e.g. a [data-swap] trigger. The
    // generated toggle sits outside both faces and keeps focus.
    const targetFace = show ? back : front;
    const outgoingFace = show ? front : back;
    const autofocusTarget = targetFace.querySelector('[autofocus]');
    if (autofocusTarget) {
      autofocusTarget.focus();
    } else if (source === 'keyboard' && outgoingFace.contains(focusedBefore)) {
      moveFocus(targetFace);
    }
  };

  // Internal :state(transition-running) for component CSS that wants to react
  // during the View Transitions window (e.g. disable interaction). Only the
  // <content-swap> custom element exposes setState; [data-swap] enhanced
  // elements skip this transparently.
  const setRunning = (on) => {
    const ce = /** @type {any} */ (el);
    if (typeof ce.setState === 'function') ce.setState('transition-running', on);
  };
  setRunning(true);
  const result = startSwapTransition(applySwap);
  if (result && result.finished && typeof result.finished.finally === 'function') {
    result.finished.finally(() => setRunning(false));
  } else {
    setRunning(false);
  }
}

function toggleSwap(el, source = 'api') {
  swapTo(el, !el.hasAttribute(attrName(el, 'swapped')), /** @type {any} */ (source));
}

function dispatchSwapEvent(el, source = 'internal') {
  el.dispatchEvent(new CustomEvent('content-swap:swap', {
    detail: { swapped: el.hasAttribute(attrName(el, 'swapped')), source },
    bubbles: true,
  }));
}

function moveFocus(face) {
  const focusTarget = face.querySelector(
    '[data-swap], button, a, input, select, textarea'
  );
  if (focusTarget) {
    focusTarget.focus();
  }
}

/**
 * <content-swap> custom element
 */
class ContentSwap extends VBElement {
  static observedAttributes = ['swapped'];

  /** @type {(() => void) | null} */
  #cleanup = null;

  /** Keep `inert` / aria-pressed in step when `swapped` is set externally. */
  attributeChangedCallback() {
    if (!this.isConnected) return;
    const { front, back } = getFaces(this);
    if (front && back) syncState(this, front, back);
  }

  setup() {
    this.#cleanup = initSwapBehavior(this) ?? null;
  }

  teardown() {
    this.#cleanup?.();
    this.#cleanup = null;
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
        if (el.querySelector(':scope > [data-face]')) initSwapBehavior(el);
      }
      // Also check descendants
      el.querySelectorAll('[data-swap]:not(content-swap):not([data-swap-init])').forEach(el => {
        if (el.querySelector(':scope > [data-face]')) initSwapBehavior(el);
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
