/**
 * copy-init: Clipboard copy + paste via data attributes + programmatic helpers
 *
 * Enhances buttons with data-copy / data-copy-target / data-paste-target
 * to interact with the clipboard. Also exports copyText(), copyRich(),
 * and pasteFromClipboard() for components that need clipboard access
 * with VB's standard a11y + feedback semantics.
 *
 * @attr {string} data-copy - Static text to copy
 * @attr {string} data-copy-target - CSS selector for element whose textContent to copy
 * @attr {string} data-copy-attr - When paired with data-copy-target, copy the named
 *                                 attribute of the target instead of its textContent
 * @attr {string} data-paste-target - CSS selector for element to receive pasted clipboard text
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
 * @example Paste into a target
 * <input id="dest" type="text">
 * <button data-paste-target="#dest">Paste</button>
 *
 * @example Programmatic
 * import { copyText, copyRich, pasteFromClipboard } from '/src/utils/copy-init.js';
 * await copyText('hello', { button: myButton });
 * await copyRich({ text: '#3366cc', blob: pngBlob }, { button: myButton });
 * await pasteFromClipboard(inputEl, { button: myButton });
 */

const COPIED_DURATION = 1500;
const ANNOUNCE_DURATION = 1000;
const SELECTOR = '[data-copy], [data-copy-target], [data-paste-target]';
const DEFAULT_ANNOUNCE = 'Copied to clipboard';
const DEFAULT_PASTE_ANNOUNCE = 'Pasted from clipboard';

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

  applyFeedback({ button, duration, announceMessage, eventDetail: { text } });
  return true;
}

/**
 * Copy a multi-format payload to the clipboard.
 *
 * Writes a ClipboardItem with any combination of text/plain, text/html,
 * and a binary blob (typically image/png). When ClipboardItem is
 * unsupported or the browser rejects the specific MIME types, falls
 * back to text-only copy via copyText.
 *
 * Common use cases: copying a color as hex text + a swatch PNG so it
 * can be pasted into design tools as an actual color, or copying a
 * QR code as an image alongside its encoded URL.
 *
 * @param {object} payload
 * @param {string} [payload.text] - text/plain content
 * @param {string} [payload.html] - text/html content
 * @param {Blob}   [payload.blob] - Arbitrary blob (e.g. image/png). MIME type comes from blob.type.
 * @param {object} [options]
 * @param {HTMLElement} [options.button]
 * @param {string} [options.announceMessage]
 * @param {number} [options.duration]
 * @returns {Promise<boolean>} True if any clipboard write succeeded (rich or text fallback).
 */
async function copyRich(payload, options = {}) {
  const { text, html, blob } = payload ?? {};
  if (!text && !html && !blob) return false;
  const { button, announceMessage = DEFAULT_ANNOUNCE, duration = COPIED_DURATION } = options;

  const richSupported = typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function';

  if (richSupported) {
    /** @type {Record<string, Blob>} */
    const items = {};
    if (text) items['text/plain'] = new Blob([text], { type: 'text/plain' });
    if (html) items['text/html'] = new Blob([html], { type: 'text/html' });
    if (blob) items[blob.type] = blob;

    try {
      await navigator.clipboard.write([new ClipboardItem(items)]);
      applyFeedback({ button, duration, announceMessage, eventDetail: { payload } });
      return true;
    } catch {
      // Browser may support ClipboardItem but reject some MIME types
      // (Safari historically restricts image types). Fall through to text.
    }
  }

  if (text) return copyText(text, options);
  return false;
}

/**
 * Apply the VB-standard post-write feedback: data-state, screen-reader
 * announce, and a CustomEvent from the button.
 * @param {{ button?: HTMLElement, duration: number, announceMessage: string, eventDetail: object, state?: string, eventName?: string }} args
 */
function applyFeedback({ button, duration, announceMessage, eventDetail, state = 'copied', eventName = 'copy' }) {
  if (button) {
    button.dataset.state = state;
    const prior = resetTimers.get(button);
    if (prior) clearTimeout(prior);
    resetTimers.set(button, setTimeout(() => {
      delete button.dataset.state;
      resetTimers.delete(button);
    }, duration));

    button.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      detail: eventDetail,
    }));
  }

  announce(announceMessage, button ?? document.body);
}

/**
 * Read text from the clipboard and write it into a target element.
 *
 * Form controls (input, textarea, select) receive `.value`; other
 * elements receive `.textContent`. After writing, an `input` event
 * is dispatched on the target so framework listeners notice the change.
 * Sets data-state="pasted" on the button, announces to screen readers,
 * and dispatches a `paste` CustomEvent from the button.
 *
 * Safe to call when the Clipboard API is unavailable or the user
 * denies permission — returns null silently.
 *
 * @param {Element | null | undefined} target - Element to receive the pasted text.
 * @param {object} [options]
 * @param {HTMLElement} [options.button]
 * @param {string} [options.announceMessage]
 * @param {number} [options.duration]
 * @returns {Promise<string | null>} The text that was pasted, or null on failure.
 */
async function pasteFromClipboard(target, options = {}) {
  const { button, announceMessage = DEFAULT_PASTE_ANNOUNCE, duration = COPIED_DURATION } = options;

  let text;
  try {
    text = await navigator.clipboard.readText();
  } catch {
    return null;
  }

  if (target) {
    if ('value' in target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      target.value = text;
    } else {
      target.textContent = text;
    }
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }

  applyFeedback({
    button,
    duration,
    announceMessage,
    eventDetail: { text },
    state: 'pasted',
    eventName: 'paste',
  });
  return text;
}

/**
 * Initialize copy/paste buttons within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initCopyButtons(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceButton);
}

/**
 * Enhance a single button with copy or paste behavior
 * @param {HTMLElement} button - The button element to enhance
 */
function enhanceButton(button) {
  if (button.hasAttribute('data-copy-init')) return;
  button.setAttribute('data-copy-init', '');

  button.addEventListener('click', () => {
    if (button.dataset.pasteTarget) {
      const target = document.querySelector(button.dataset.pasteTarget);
      if (!target) return;
      pasteFromClipboard(target, { button });
      return;
    }

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

export { initCopyButtons, copyText, copyRich, pasteFromClipboard };
