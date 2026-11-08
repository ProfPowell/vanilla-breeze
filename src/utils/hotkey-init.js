/**
 * hotkey-init: Platform-aware keyboard shortcut display
 *
 * Enhances <kbd> elements with data-hotkey to render platform-appropriate
 * key caps. On Mac, modifier keys display as symbols (⌘, ⌥, ⇧, ⌃);
 * on other platforms, as text labels with + separators. Named keys get
 * short labels (escape → Esc, arrowup → ↑, pageup → PgUp).
 *
 * The visible caps are aria-hidden; a visually-hidden span carries the
 * spelled-out combo ("Command Shift P"), because screen readers read the
 * glyphs inconsistently and aria-label is not allowed on <kbd>.
 *
 * @attr {string} data-hotkey - Key combo string (e.g., "meta+k", "ctrl+shift+p",
 *   "ctrl+plus" or "ctrl++" for the plus key)
 * @attr {string} data-label-<key> - Override the label/spoken name of one key
 *   (data-label-ctrl="Strg"). Read from the element or any ancestor, so it can
 *   be set once on <html>. On Mac the modifier glyph stays and only the spoken
 *   name changes.
 *
 * @example
 * <kbd data-hotkey="meta+k">Ctrl+K</kbd>
 */

import { isMac, splitHotkey, describeKey } from './hotkey-format.js';

const SELECTOR = 'kbd[data-hotkey]';

/**
 * Initialize hotkey elements within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initHotkeys(root = document) {
  root.querySelectorAll(SELECTOR).forEach((el) => enhanceHotkey(/** @type {HTMLElement} */ (el)));
}

/**
 * Author override for one key name, from the element or an ancestor.
 * @param {HTMLElement} el
 * @param {string} key
 * @returns {string|null}
 */
function labelOverride(el, key) {
  if (!/^[a-z][a-z0-9]*$/.test(key)) return null;
  const attr = `data-label-${key}`;
  return el.closest(`[${attr}]`)?.getAttribute(attr) || null;
}

/**
 * Enhance a single kbd element with platform-aware key caps.
 * Idempotent: re-running with the same combo is a no-op; a changed combo
 * re-renders from scratch (replaceChildren, never appends).
 * @param {HTMLElement} el - The kbd element to enhance
 */
function enhanceHotkey(el) {
  const combo = el.dataset.hotkey;
  if (!combo) return;
  if (el.getAttribute('data-hotkey-init') === combo) return;

  const keys = splitHotkey(combo);
  if (!keys.length) return;
  el.setAttribute('data-hotkey-init', combo);

  const spoken = [];
  const fragment = document.createDocumentFragment();
  keys.forEach((key, i) => {
    const info = describeKey(key, isMac);
    const override = labelOverride(el, key);
    // A Mac modifier keeps its glyph; everywhere else the override is shown.
    const label = override && !(isMac && info.modifier) ? override : info.label;
    spoken.push(override ?? info.spoken);

    const cap = document.createElement('kbd');
    cap.textContent = label;
    cap.setAttribute('aria-hidden', 'true');
    fragment.appendChild(cap);

    if (i < keys.length - 1 && !isMac) {
      const sep = document.createElement('span');
      sep.textContent = '+';
      sep.setAttribute('aria-hidden', 'true');
      fragment.appendChild(sep);
    }
  });

  const name = document.createElement('span');
  name.className = 'visually-hidden';
  name.textContent = spoken.join(' ');
  fragment.appendChild(name);

  el.replaceChildren(fragment);
  el.removeAttribute('aria-label');
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
      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) {
        enhanceHotkey(/** @type {HTMLElement} */ (el));
      }

      // Check descendants
      el.querySelectorAll(SELECTOR).forEach(child => enhanceHotkey(/** @type {HTMLElement} */ (child)));
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initHotkeys };
