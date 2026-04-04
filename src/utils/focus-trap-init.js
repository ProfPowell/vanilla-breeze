/**
 * focus-trap-init: Keyboard focus trap for dynamic content regions
 *
 * Constrains Tab/Shift+Tab cycling within a container, moves focus
 * into the region on activation, and restores focus on deactivation.
 * Designed for non-modal panels, inline forms, and dynamic sections
 * where native <dialog> focus trapping is not available.
 *
 * Activation: when a [data-focus-trap] element is added to the DOM
 * (or the attribute is added), focus moves to [autofocus] or the
 * first focusable child. The previously focused element is saved.
 *
 * Deactivation: when the element is removed from the DOM (or the
 * attribute is removed), focus returns to the saved element.
 *
 * @attr data-focus-trap - Marks an element as a focus trap boundary.
 *   Optional value controls initial focus behavior:
 *   - "" (empty) — focus first focusable child or [autofocus]
 *   - "no-autofocus" — trap tabs but don't move focus on activation
 *
 * @example
 * <section data-focus-trap>
 *   <input type="text" autofocus>
 *   <button>Save</button>
 *   <button>Cancel</button>
 * </section>
 */

const SELECTOR = '[data-focus-trap]';
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

/** @type {WeakMap<Element, { cleanup: Function, previousFocus: Element | null }>} */
const traps = new WeakMap();

/**
 * Initialize focus traps within a root element
 * @param {Element|Document} root
 */
function initFocusTraps(root = document) {
  root.querySelectorAll(SELECTOR).forEach(el => activateTrap(/** @type {HTMLElement} */ (el)));
}

/**
 * Activate a focus trap on an element
 * @param {HTMLElement} container
 */
function activateTrap(container) {
  if (traps.has(container)) return;

  const previousFocus = document.activeElement;
  const noAutofocus = container.getAttribute('data-focus-trap') === 'no-autofocus';

  function onKeydown(e) {
    if (e.key !== 'Tab') return;

    const focusable = getFocusable(container);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = /** @type {Element} */ (document.activeElement);

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', onKeydown);

  const cleanup = () => {
    container.removeEventListener('keydown', onKeydown);
  };

  traps.set(container, { cleanup, previousFocus });

  // Move focus into the trap
  if (!noAutofocus) {
    // Defer to next frame so the element is fully rendered
    requestAnimationFrame(() => {
      const autofocusTarget = container.querySelector('[autofocus]');
      if (autofocusTarget) {
        /** @type {HTMLElement} */ (autofocusTarget).focus();
      } else {
        const focusable = getFocusable(container);
        if (focusable.length) focusable[0].focus();
      }
    });
  }
}

/**
 * Deactivate a focus trap and restore previous focus
 * @param {HTMLElement} container
 */
function deactivateTrap(container) {
  const state = traps.get(container);
  if (!state) return;

  state.cleanup();
  traps.delete(container);

  // Restore focus if the previous element is still in the DOM
  if (state.previousFocus && /** @type {HTMLElement} */ (state.previousFocus).isConnected) {
    /** @type {HTMLElement} */ (state.previousFocus).focus();
  }
}

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
function getFocusable(container) {
  return /** @type {HTMLElement[]} */ ([...container.querySelectorAll(FOCUSABLE)])
    .filter(el => el.offsetParent !== null);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initFocusTraps());
} else {
  initFocusTraps();
}

// Watch for dynamically added/removed focus traps
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    // Handle added nodes
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {HTMLElement} */ (node);
      if (el.matches(SELECTOR)) activateTrap(el);
      el.querySelectorAll(SELECTOR).forEach(child => activateTrap(/** @type {HTMLElement} */ (child)));
    }

    // Handle removed nodes — restore focus
    for (const node of mutation.removedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {HTMLElement} */ (node);
      if (traps.has(el)) deactivateTrap(el);
      el.querySelectorAll(SELECTOR).forEach(child => {
        if (traps.has(child)) deactivateTrap(/** @type {HTMLElement} */ (child));
      });
    }

    // Handle attribute changes
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-focus-trap') {
      const el = /** @type {HTMLElement} */ (mutation.target);
      if (el.hasAttribute('data-focus-trap')) {
        activateTrap(el);
      } else {
        deactivateTrap(el);
      }
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['data-focus-trap'],
});

export { initFocusTraps, activateTrap, deactivateTrap };
