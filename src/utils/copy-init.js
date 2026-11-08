/**
 * copy-init: Clipboard copy + paste via data attributes + programmatic helpers
 *
 * Buttons with data-copy / data-copy-target / data-paste-target copy to or
 * paste from the clipboard. One delegated document click listener serves
 * every button, so buttons added later, cloned (cloneNode) or restored from
 * saved markup work without per-button set-up. Also exports copyText(),
 * copyRich() and pasteFromClipboard() for components that need clipboard
 * access with VB's standard a11y + feedback semantics.
 *
 * Feedback: the button gets data-state="copied" | "pasted" | "failed" for
 * 1.5 s, a polite announcement goes to the shared live region on <body>
 * (src/lib/announce.js — never inside the button), and a namespaced event
 * fires from the button: copy:done, copy:error, paste:done, paste:error.
 * The events are deliberately not the native `copy` / `paste` names, which
 * page-level ClipboardEvent handlers would otherwise receive.
 *
 * When the Clipboard API is missing or refuses (insecure context, denied
 * permission), copy falls back to a hidden-textarea execCommand('copy');
 * when that fails too, the source element's text is selected so the user
 * can press Ctrl/Cmd+C, and the failure is announced.
 *
 * @attr {string} data-copy - Static text to copy
 * @attr {string} data-copy-target - CSS selector for element whose textContent to copy
 * @attr {string} data-copy-attr - When paired with data-copy-target, copy the named
 *                                 attribute of the target instead of its textContent
 * @attr {string} data-paste-target - CSS selector for element to receive pasted clipboard text
 * @attr {string} data-label-copied - Announcement after a copy (default "Copied to clipboard"); element or ancestor
 * @attr {string} data-label-pasted - Announcement after a paste (default "Pasted from clipboard")
 * @attr {string} data-label-copy-failed - Announcement when copying fails (default "Copy failed. Text selected, press Ctrl+C to copy" / "Copy failed")
 * @attr {string} data-label-paste-failed - Announcement when pasting fails (default "Paste failed")
 *
 * @fires copy:done   - detail { text } (or { payload } from copyRich)
 * @fires copy:error  - detail { text, error }
 * @fires paste:done  - detail { text, target }
 * @fires paste:error - detail { target, error }
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

import { announce, readLabel } from '../lib/announce.js';

const COPIED_DURATION = 1500;
const SELECTOR = '[data-copy], [data-copy-target], [data-paste-target]';
const LABELS = {
  copied: 'Copied to clipboard',
  pasted: 'Pasted from clipboard',
  'copy-failed': 'Copy failed',
  'copy-failed-selected': 'Copy failed. Text selected, press Ctrl+C to copy',
  'paste-failed': 'Paste failed',
};

const resetTimers = new WeakMap();

/**
 * Write text with execCommand('copy') through a hidden textarea. Used when
 * navigator.clipboard is missing (http:, old browsers) or refuses.
 * @param {string} text
 * @returns {boolean}
 */
function legacyCopy(text) {
  if (typeof document.execCommand !== 'function' || !document.body) return false;
  const active = /** @type {HTMLElement | null} */ (document.activeElement);
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.style.cssText = 'position:fixed;inset-block-start:0;inset-inline-start:0;opacity:0;pointer-events:none';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  area.remove();
  active?.focus?.({ preventScroll: true });
  return ok;
}

/**
 * Select the text of `source` so the user can copy it by hand.
 * @param {Element | null | undefined} source
 * @returns {boolean} whether anything was selected
 */
function selectForManualCopy(source) {
  if (!source) return false;
  if (source instanceof HTMLInputElement || source instanceof HTMLTextAreaElement) {
    source.focus();
    source.select();
    return true;
  }
  const selection = window.getSelection?.();
  if (!selection) return false;
  const range = document.createRange();
  range.selectNodeContents(source);
  selection.removeAllRanges();
  selection.addRange(range);
  return !selection.isCollapsed;
}

/**
 * Copy text to the clipboard with VB's standard feedback semantics.
 *
 * Performs writeText (falling back to execCommand), sets data-state="copied"
 * on the button (if given), announces to screen readers, and dispatches
 * `copy:done` from the button. On failure sets data-state="failed",
 * announces the failure, selects `options.source` for a manual copy and
 * dispatches `copy:error`.
 *
 * @param {string} text - The text to copy.
 * @param {object} [options]
 * @param {HTMLElement} [options.button] - Button to receive data-state and dispatch the event.
 * @param {string} [options.announceMessage] - Success message. Defaults to data-label-copied or "Copied to clipboard".
 * @param {string} [options.failureMessage] - Failure message. Defaults to data-label-copy-failed or "Copy failed".
 * @param {Element} [options.source] - Element whose text is selected when copying fails.
 * @param {number} [options.duration] - Milliseconds to hold data-state. Defaults to 1500.
 * @returns {Promise<boolean>} True if the write succeeded.
 */
async function copyText(text, options = {}) {
  if (text == null || text === '') return false;
  const { button, duration = COPIED_DURATION } = options;

  let ok = false;
  let error = null;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch (err) {
    error = err;
    ok = legacyCopy(text);
  }

  if (ok) {
    applyFeedback({
      button, duration, state: 'copied', eventName: 'copy:done', eventDetail: { text },
      message: options.announceMessage ?? readLabel(button, 'copied', LABELS.copied),
    });
    return true;
  }

  const selected = selectForManualCopy(options.source);
  applyFeedback({
    button, duration, state: 'failed', eventName: 'copy:error', eventDetail: { text, error },
    message: options.failureMessage
      ?? readLabel(button, 'copy-failed', selected ? LABELS['copy-failed-selected'] : LABELS['copy-failed']),
  });
  return false;
}

/**
 * Copy a multi-format payload to the clipboard.
 *
 * Writes a ClipboardItem with any combination of text/plain, text/html,
 * and a binary blob (typically image/png). When ClipboardItem is
 * unsupported or the browser rejects the specific MIME types, falls
 * back to text-only copy via copyText.
 *
 * @param {object} payload
 * @param {string} [payload.text] - text/plain content
 * @param {string} [payload.html] - text/html content
 * @param {Blob}   [payload.blob] - Arbitrary blob (e.g. image/png). MIME type comes from blob.type.
 * @param {object} [options] - Same options as copyText.
 * @param {HTMLElement} [options.button]
 * @param {string} [options.announceMessage]
 * @param {string} [options.failureMessage]
 * @param {Element} [options.source]
 * @param {number} [options.duration]
 * @returns {Promise<boolean>} True if any clipboard write succeeded (rich or text fallback).
 */
async function copyRich(payload, options = {}) {
  const { text, html, blob } = payload ?? {};
  if (!text && !html && !blob) return false;
  const { button, duration = COPIED_DURATION } = options;

  const richSupported = typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function';

  if (richSupported) {
    /** @type {Record<string, Blob>} */
    const items = {};
    if (text) items['text/plain'] = new Blob([text], { type: 'text/plain' });
    if (html) items['text/html'] = new Blob([html], { type: 'text/html' });
    if (blob) items[blob.type] = blob;

    try {
      await navigator.clipboard.write([new ClipboardItem(items)]);
      applyFeedback({
        button, duration, state: 'copied', eventName: 'copy:done', eventDetail: { payload },
        message: options.announceMessage ?? readLabel(button, 'copied', LABELS.copied),
      });
      return true;
    } catch {
      // Browser may support ClipboardItem but reject some MIME types
      // (Safari historically restricts image types). Fall through to text.
    }
  }

  if (text) return copyText(text, options);
  applyFeedback({
    button, duration, state: 'failed', eventName: 'copy:error', eventDetail: { payload, error: null },
    message: options.failureMessage ?? readLabel(button, 'copy-failed', LABELS['copy-failed']),
  });
  return false;
}

/**
 * Apply the VB-standard feedback: data-state, announcement, event.
 * @param {{ button?: HTMLElement, duration: number, message: string, eventDetail: object, state: string, eventName: string }} args
 */
function applyFeedback({ button, duration, message, eventDetail, state, eventName }) {
  if (button) {
    button.dataset.state = state;
    const prior = resetTimers.get(button);
    if (prior) clearTimeout(prior);
    resetTimers.set(button, setTimeout(() => {
      if (button.dataset.state === state) delete button.dataset.state;
      resetTimers.delete(button);
    }, duration));

    button.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      detail: eventDetail,
    }));
  }

  // Failures interrupt (assertive) so the user knows to copy by hand;
  // successes are polite.
  announce(message, { politeness: state === 'failed' ? 'assertive' : 'polite' });
}

/**
 * Read text from the clipboard and write it into a target element.
 *
 * Form controls (input, textarea, select) receive `.value`; other
 * elements receive `.textContent`. After writing, an `input` event
 * is dispatched on the target so framework listeners notice the change.
 * Sets data-state="pasted" on the button, announces, and dispatches
 * `paste:done` from the button. On failure (no Clipboard API, permission
 * denied) sets data-state="failed", announces and dispatches `paste:error`.
 *
 * @param {Element | null | undefined} target - Element to receive the pasted text.
 * @param {object} [options]
 * @param {HTMLElement} [options.button]
 * @param {string} [options.announceMessage]
 * @param {string} [options.failureMessage]
 * @param {number} [options.duration]
 * @returns {Promise<string | null>} The text that was pasted, or null on failure.
 */
async function pasteFromClipboard(target, options = {}) {
  const { button, duration = COPIED_DURATION } = options;

  let text;
  try {
    if (!navigator.clipboard?.readText) throw new Error('Clipboard API unavailable');
    text = await navigator.clipboard.readText();
  } catch (error) {
    applyFeedback({
      button, duration, state: 'failed', eventName: 'paste:error', eventDetail: { target, error },
      message: options.failureMessage ?? readLabel(button, 'paste-failed', LABELS['paste-failed']),
    });
    return null;
  }

  if (target) {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      target.value = text;
    } else {
      target.textContent = text;
    }
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }

  applyFeedback({
    button, duration, state: 'pasted', eventName: 'paste:done', eventDetail: { text, target },
    message: options.announceMessage ?? readLabel(button, 'pasted', LABELS.pasted),
  });
  return text;
}

/**
 * Resolve the element a copy button reads from (data-copy-target).
 * @param {HTMLElement} button
 * @returns {Element | null}
 */
function getSource(button) {
  const selector = button.dataset.copyTarget;
  if (!selector) return null;
  try { return document.querySelector(selector); } catch { return null; }
}

/**
 * Get text to copy from a button's data attributes
 * @param {HTMLElement} button
 * @returns {string}
 */
function getText(button) {
  if (button.dataset.copy) return button.dataset.copy;

  const target = getSource(button);
  if (!target) return '';
  const attr = button.dataset.copyAttr;
  if (attr) return target.getAttribute(attr) ?? '';
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return target.value;
  return target.textContent ?? '';
}

/** @param {MouseEvent} event */
function onClick(event) {
  const button = /** @type {HTMLElement | null} */ (
    /** @type {Element} */ (event.target)?.closest?.(SELECTOR));
  if (!button || button.matches(':disabled, [aria-disabled="true"]')) return;

  if (button.dataset.pasteTarget) {
    let target = null;
    try { target = document.querySelector(button.dataset.pasteTarget); } catch { /* bad selector */ }
    if (!target) return;
    pasteFromClipboard(target, { button });
    return;
  }

  const text = getText(button);
  if (!text) return;
  copyText(text, { button, source: getSource(button) ?? undefined });
}

/**
 * Kept for API compatibility: every button is served by the delegated
 * listener, so there is nothing to set up. Strips the legacy processed
 * flag that markup saved from older versions may carry.
 * @param {Element|Document} root - Root element to search within
 */
function initCopyButtons(root = document) {
  root.querySelectorAll('[data-copy-init]').forEach((el) => el.removeAttribute('data-copy-init'));
}

if (typeof document !== 'undefined' && !(/** @type {any} */ (document).__vbCopyDelegated)) {
  /** @type {any} */ (document).__vbCopyDelegated = true;
  document.addEventListener('click', onClick);
}

export { initCopyButtons, copyText, copyRich, pasteFromClipboard };
