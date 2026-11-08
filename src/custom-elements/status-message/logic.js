/**
 * status-message dismiss behaviour.
 *
 * `<status-message>` is a CSS-only custom element; this module adds the one
 * behaviour its markup advertises: a `[data-dismiss]` button inside it hides
 * the message. One delegated document listener covers every message,
 * including ones inserted later, so there is nothing to wire per element
 * and nothing to re-wire after a move.
 *
 * On activation:
 *   1. dispatches `status-message:dismiss` (bubbles, cancelable) on the
 *      message — call preventDefault() to keep it (e.g. to animate first);
 *   2. sets `hidden` on the message (`data-dismiss="remove"` removes it);
 *   3. if focus was inside the message, moves it to `data-dismiss-focus`
 *      (a CSS selector) when given, else the next focusable element after
 *      the message, else the previous one, else the document body, so
 *      keyboard users are not dropped at the top of the page.
 */

const FLAG = '__vbStatusMessageDismiss';
const FOCUSABLE = [
  'a[href]', 'area[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', 'summary', 'iframe',
  '[contenteditable]:not([contenteditable="false"])', '[tabindex]:not([tabindex="-1"])',
].join(',');

/** @param {Element} el */
function isVisible(el) {
  if (el.closest('[inert]')) return false;
  return typeof el.checkVisibility === 'function' ? el.checkVisibility() : !el.closest('[hidden]');
}

/**
 * Next (or previous) focusable element outside `msg` in document order.
 * @param {Element} msg
 * @returns {HTMLElement | null}
 */
function neighbourFocusable(msg) {
  const all = [...document.querySelectorAll(FOCUSABLE)]
    .filter(el => !msg.contains(el) && isVisible(el));
  const after = all.find(el => msg.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  if (after) return /** @type {HTMLElement} */ (after);
  const before = all.filter(el => msg.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING).pop();
  return /** @type {HTMLElement | null} */ (before ?? null);
}

/** @param {MouseEvent} e */
function onClick(e) {
  const target = /** @type {Element | null} */ (e.target instanceof Element ? e.target : null);
  const button = target?.closest('[data-dismiss]');
  if (!button) return;
  const msg = button.closest('status-message');
  // Only the message's own dismiss control (not one inside nested content
  // that belongs to another component).
  if (!msg || button.parentElement !== msg) return;

  const proceed = msg.dispatchEvent(new CustomEvent('status-message:dismiss', {
    bubbles: true, cancelable: true,
  }));
  if (!proceed) return;

  const hadFocus = msg.contains(document.activeElement);
  const focusSel = msg.getAttribute('data-dismiss-focus');
  /** @type {HTMLElement | null} */
  let next = null;
  if (hadFocus) {
    if (focusSel) {
      try { next = /** @type {HTMLElement | null} */ (document.querySelector(focusSel)); } catch { /* bad selector */ }
    }
    next ??= neighbourFocusable(msg);
  }

  if (button.getAttribute('data-dismiss') === 'remove') msg.remove();
  else /** @type {HTMLElement} */ (msg).hidden = true;

  if (hadFocus) {
    if (next) {
      // Non-focusable targets (e.g. a heading or main) need tabindex=-1.
      if (!next.matches(FOCUSABLE) && !next.hasAttribute('tabindex')) next.setAttribute('tabindex', '-1');
      next.focus();
    } else {
      document.body.focus();
    }
  }
}

if (!(/** @type {any} */ (globalThis)[FLAG])) {
  /** @type {any} */ (globalThis)[FLAG] = true;
  document.addEventListener('click', onClick);
}
