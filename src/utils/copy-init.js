/**
 * copy-init: Clipboard copy via data attributes + programmatic helper
 *
 * Enhances buttons with data-copy or data-copy-target to copy text
 * to the clipboard on click. Also exports copyText() for components
 * that need to copy computed strings — both paths produce the same
 * visual + screen-reader feedback and dispatch the same `copy` event.
 *
 * @attr {string} data-copy - Static text to copy
 * @attr {string} data-copy-target - CSS selector for element whose textContent to copy
 * @attr {string} data-copy-attr - When paired with data-copy-target, copy the named
 *                                 attribute of the target instead of its textContent
 *
 * @example Static text
 * <button data-copy="npm install vanilla-breeze">Copy</button>
 *
 * @example Target element
 * <button data-copy-target="#code-block">Copy code</button>
 *
 * @example Target attribute
 * <output id="swatch" value="#3366cc">#3366cc</output>
 * <button data-copy-target="#swatch" data-copy-attr="value">Copy hex</button>
 *
 * @example Programmatic
 * import { copyText } from '/src/utils/copy-init.js';
 * await copyText('hello', { button: myButton });
 */

const COPIED_DURATION = 1500;
const ANNOUNCE_DURATION = 1000;
const SELECTOR = '[data-copy], [data-copy-target]';
const DEFAULT_ANNOUNCE = 'Copied to clipboard';

const resetTimers = new WeakMap();

/**
 * Copy text to the clipboard with VB's standard feedback semantics.
 *
 * Performs writeText, sets data-state="copied" on the button (if given),
 * announces to screen readers, and dispatches a `copy` CustomEvent from
 * the button. Safe to call when the Clipboard API is unavailable or
 * permission is denied — returns false silently.
 *
 * @param {string} text - The text to copy.
 * @param {object} [options]
 * @param {HTMLElement} [options.button] - Button to receive data-state and dispatch the event.
 * @param {string} [options.announceMessage] - Screen-reader message. Defaults to "Copied to clipboard".
 * @param {number} [options.duration] - Milliseconds to hold data-state="copied". Defaults to 1500.
 * @returns {Promise<boolean>} True if the write succeeded.
 */
async function copyText(text, options = {}) {
  if (text == null || text === '') return false;
  const { button, announceMessage = DEFAULT_ANNOUNCE, duration = COPIED_DURATION } = options;

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return false;
  }

  if (button) {
    button.dataset.state = 'copied';
    const prior = resetTimers.get(button);
    if (prior) clearTimeout(prior);
    resetTimers.set(button, setTimeout(() => {
      delete button.dataset.state;
      resetTimers.delete(button);
    }, duration));

    button.dispatchEvent(new CustomEvent('copy', {
      bubbles: true,
      detail: { text }
    }));
  }

  announce(announceMessage, button ?? document.body);
  return true;
}

/**
 * Initialize copy buttons within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initCopyButtons(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceButton);
}

/**
 * Enhance a single button with copy behavior
 * @param {HTMLElement} button - The button element to enhance
 */
function enhanceButton(button) {
  if (button.hasAttribute('data-copy-init')) return;
  button.setAttribute('data-copy-init', '');

  button.addEventListener('click', () => {
    const text = getText(button);
    if (!text) return;
    copyText(text, { button });
  });
}

/**
 * Get text to copy from a button's data attributes
 * @param {HTMLElement} button
 * @returns {string}
 */
function getText(button) {
  if (button.dataset.copy) return button.dataset.copy;

  if (button.dataset.copyTarget) {
    const target = document.querySelector(button.dataset.copyTarget);
    if (!target) return '';
    const attr = button.dataset.copyAttr;
    if (attr) return target.getAttribute(attr) ?? '';
    return target.textContent ?? '';
  }

  return '';
}

/**
 * Announce a message to screen readers
 * @param {string} message
 * @param {Element} context - Element to append announcement to
 */
function announce(message, context) {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.className = 'visually-hidden';
  el.textContent = message;
  context.appendChild(el);
  setTimeout(() => el.remove(), ANNOUNCE_DURATION);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initCopyButtons());
} else {
  initCopyButtons();
}

// Watch for dynamically added copy buttons
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      // Check the node itself
      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) {
        enhanceButton(/** @type {HTMLElement} */ (el));
      }

      // Check descendants
      el.querySelectorAll(SELECTOR).forEach(child => enhanceButton(/** @type {HTMLElement} */ (child)));
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initCopyButtons, copyText };
