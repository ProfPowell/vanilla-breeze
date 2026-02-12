/**
 * hotkey-init: Platform-aware keyboard shortcut display
 *
 * Enhances <kbd> elements with data-hotkey to render platform-appropriate
 * key symbols. On Mac, modifier keys display as symbols (⌘, ⌥, ⇧, ⌃);
 * on other platforms, as text labels with + separators.
 *
 * @attr {string} data-hotkey - Key combo string (e.g., "meta+k", "ctrl+shift+p")
 *
 * @example
 * <kbd data-hotkey="meta+k">Ctrl+K</kbd>
 */

import { isMac, SYMBOLS } from './hotkey-format.js';

const SELECTOR = 'kbd[data-hotkey]';

/**
 * Initialize hotkey elements within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initHotkeys(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceHotkey);
}

/**
 * Enhance a single kbd element with platform-aware key symbols
 * @param {Element} el - The kbd element to enhance
 */
function enhanceHotkey(el) {
  if (el.hasAttribute('data-hotkey-init')) return;
  el.setAttribute('data-hotkey-init', '');

  const combo = el.dataset.hotkey;
  if (!combo) return;

  const map = isMac ? SYMBOLS.mac : SYMBOLS.other;
  const keys = combo.toLowerCase().split('+').map(k => k.trim());

  const fragment = document.createDocumentFragment();
  keys.forEach((key, i) => {
    const kbd = document.createElement('kbd');
    kbd.textContent = map[key] ?? key.toUpperCase();
    fragment.appendChild(kbd);

    if (i < keys.length - 1 && !isMac) {
      fragment.appendChild(document.createTextNode('+'));
    }
  });

  el.replaceChildren(fragment);
  el.setAttribute('aria-label', el.textContent);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initHotkeys());
} else {
  initHotkeys();
}

// Watch for dynamically added hotkey elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      // Check the node itself
      if (node.matches?.(SELECTOR)) {
        enhanceHotkey(node);
      }

      // Check descendants
      node.querySelectorAll?.(SELECTOR).forEach(enhanceHotkey);
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initHotkeys };
