/**
 * copy-init: Clipboard copy via data attributes
 *
 * Enhances buttons with data-copy or data-copy-target to copy text
 * to the clipboard on click. Provides visual and screen reader feedback.
 *
 * @attr {string} data-copy - Static text to copy
 * @attr {string} data-copy-target - CSS selector for element whose textContent to copy
 *
 * @example Static text
 * <button data-copy="npm install vanilla-breeze">Copy</button>
 *
 * @example Target element
 * <button data-copy-target="#code-block">Copy code</button>
 */

const COPIED_DURATION = 1500;
const ANNOUNCE_DURATION = 1000;
const SELECTOR = '[data-copy], [data-copy-target]';

/**
 * Initialize copy buttons within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initCopyButtons(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceButton);
}

/**
 * Enhance a single button with copy behavior
 * @param {Element} button - The button element to enhance
 */
function enhanceButton(button) {
  if (button.hasAttribute('data-copy-init')) return;
  button.setAttribute('data-copy-init', '');

  let resetTimer;

  button.addEventListener('click', async () => {
    const text = getText(button);
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);

      // Visual feedback
      button.dataset.state = 'copied';
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        delete button.dataset.state;
      }, COPIED_DURATION);

      // Screen reader announcement
      announce('Copied to clipboard', button);

      button.dispatchEvent(new CustomEvent('copy', {
        bubbles: true,
        detail: { text }
      }));
    } catch {
      // Clipboard API unavailable or denied
    }
  });
}

/**
 * Get text to copy from a button's data attributes
 * @param {Element} button
 * @returns {string}
 */
function getText(button) {
  if (button.dataset.copy) return button.dataset.copy;

  if (button.dataset.copyTarget) {
    const target = document.querySelector(button.dataset.copyTarget);
    return target?.textContent ?? '';
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
  el.className = 'sr-only';
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
      if (node.matches?.(SELECTOR)) {
        enhanceButton(node);
      }

      // Check descendants
      node.querySelectorAll?.(SELECTOR).forEach(enhanceButton);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initCopyButtons };
