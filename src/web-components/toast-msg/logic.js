/**
 * toast-msg: Toast notification container
 *
 * A container for displaying non-modal notifications. Toasts appear in a
 * fixed position and auto-dismiss after a configurable duration.
 *
 * Accessibility:
 *  - The host is the ONE live region (role="log", polite). Toasts are plain
 *    children with no role of their own, so nothing is announced twice.
 *    Authors may set aria-live="assertive" on the host; it is not overwritten.
 *  - Each toast starts with a visually hidden variant prefix ("Error: …")
 *    so the meaning is not carried by colour and glyph alone.
 *  - Auto-dismiss pauses while the pointer is over the stack, while focus
 *    is inside it, and while the page is hidden (WCAG 2.2.1); it resumes
 *    with the remaining time. Escape dismisses the focused toast.
 *  - When a focused toast is dismissed, focus moves to the next (or
 *    previous) toast, else back to where it was before the toast appeared.
 *
 * @attr {string} position - Position: 'top-end' (default), 'top-start', 'bottom-end', 'bottom-start', 'top-center', 'bottom-center'
 * @attr {number} duration - Default auto-dismiss duration in ms (default: 5000, 0 = no auto-dismiss)
 * @attr {number} max - Maximum number of visible toasts (default: 5); extras queue
 * @attr {string} data-label-region - Accessible name of the stack (default "Notifications")
 * @attr {string} data-label-dismiss - Close button label (default "Dismiss")
 * @attr {string} data-label-info - Spoken prefix for info toasts (default "Info")
 * @attr {string} data-label-success - Spoken prefix for success toasts (default "Success")
 * @attr {string} data-label-warning - Spoken prefix for warning toasts (default "Warning")
 * @attr {string} data-label-error - Spoken prefix for error toasts (default "Error")
 *
 * @fires toast-msg:enqueued - Every show() call. detail: { message, variant, duration, source, toast, queued }
 * @fires toast-msg:show - A toast became visible. detail: { toast }
 * @fires toast-msg:hide - A toast was removed. detail: { toast }
 *
 * @example
 * <toast-msg position="bottom-end"></toast-msg>
 *
 * // Show a toast programmatically:
 * document.querySelector('toast-msg').show({
 *   message: 'File saved successfully',
 *   variant: 'success',
 *   duration: 3000
 * });
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

const LABELS = {
  region: 'Notifications',
  dismiss: 'Dismiss',
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
};

const VARIANTS = ['info', 'success', 'warning', 'error'];

const ICONS = {
  info: '&#9432;',      // ⓘ
  success: '&#10003;',  // ✓
  warning: '&#9888;',   // ⚠
  error: '&#10007;',    // ✗
};

/** Exit-animation fallback (ms) when animationend never fires. */
const EXIT_FALLBACK_MS = 300;

/**
 * Per-toast bookkeeping.
 * @typedef {object} ToastRecord
 * @property {string} message    Message text (without the spoken prefix)
 * @property {number} duration   Original duration (0 = sticky)
 * @property {number} remaining  Time left before auto-dismiss
 * @property {number} startedAt  performance.now() when the current run began
 * @property {ReturnType<typeof setTimeout> | undefined} timer
 * @property {Element | null} returnFocus  Focus before the toast appeared
 * @property {boolean} hiding
 */

class ToastMsg extends VBElement {
  /** @type {Array<{ toast: HTMLElement, duration: number }>} */
  #queue = [];
  /** @type {HTMLElement[]} */
  #visible = [];
  /** @type {WeakMap<HTMLElement, ToastRecord>} */
  #records = new WeakMap();
  #hovered = false;
  #focusWithin = false;
  /** Attributes this instance wrote (so teardown can leave authored ones). */
  #ownedAttrs = new Set();

  setup() {
    this.#own('role', 'log');
    this.#own('aria-live', 'polite');
    this.#own('aria-relevant', 'additions');
    this.#own('aria-label', this.#label('region'));

    /* The host is pointer-events:none (only toasts are hit-testable), so
       use the bubbling over/out pair from the toasts, not enter/leave. */
    this.listen(this, 'pointerover', () => {
      if (!this.#hovered) { this.#hovered = true; this.#syncTimers(); }
    });
    this.listen(this, 'pointerout', (/** @type {PointerEvent} */ e) => {
      if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
      this.#hovered = false;
      this.#syncTimers();
    });
    this.listen(this, 'focusin', () => { this.#focusWithin = true; this.#syncTimers(); });
    this.listen(this, 'focusout', (/** @type {FocusEvent} */ e) => {
      if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
      this.#focusWithin = false;
      this.#syncTimers();
    });
    this.listen(this, 'keydown', (/** @type {KeyboardEvent} */ e) => {
      if (e.key !== 'Escape') return;
      const toast = /** @type {HTMLElement | null} */ (
        /** @type {Element} */ (e.target).closest?.('.toast'));
      if (toast && this.#visible.includes(toast)) {
        e.preventDefault();
        this.dismiss(toast);
      }
    });
    this.listen(document, 'visibilitychange', () => this.#syncTimers());

    /* Reconnect: toasts that survived the move keep their remaining time;
       anything removed while we were detached is forgotten. */
    this.#visible = this.#visible.filter((t) => t.parentNode === this);
    this.#hovered = !!this.querySelector('.toast:hover');
    this.#focusWithin = this.contains(document.activeElement);
    this.#drainQueue();
    this.#syncTimers();
  }

  teardown() {
    /* Freeze every timer at its remaining time; setup() re-arms them. A
       toast that was mid-exit finishes now so it can't linger. */
    for (const toast of [...this.#visible]) {
      const rec = this.#records.get(toast);
      if (!rec) continue;
      if (rec.hiding) this.#finishDismiss(toast);
      else this.#pause(rec);
    }
    for (const name of this.#ownedAttrs) this.removeAttribute(name);
    this.#ownedAttrs.clear();
  }

  /**
   * Show a toast notification
   * @param {object} options - Toast options
   * @param {string} options.message - The message to display
   * @param {string} [options.variant] - Variant: 'info', 'success', 'warning', 'error'
   * @param {number} [options.duration] - Auto-dismiss duration in ms (0 = no auto-dismiss)
   * @param {boolean} [options.dismissible=true] - Whether the toast shows a close button
   * @param {string} [options.action] - Optional action button text
   * @param {Function} [options.onAction] - Callback when action button is clicked
   * @param {string} [options.source] - Origin tag carried on toast-msg:enqueued
   * @returns {HTMLElement} The toast element
   */
  show(options) {
    const {
      message,
      variant: rawVariant = 'info',
      duration = this.#getDefaultDuration(),
      dismissible = true,
      action,
      onAction,
      source = 'api',
    } = options;
    const variant = VARIANTS.includes(rawVariant) ? rawVariant : 'info';

    const toast = this.#createToast({ message, variant, dismissible, action, onAction });
    const active = document.activeElement;
    this.#records.set(toast, {
      message: String(message ?? ''),
      duration: Math.max(0, Number(duration) || 0),
      remaining: Math.max(0, Number(duration) || 0),
      startedAt: 0,
      timer: undefined,
      returnFocus: active && !this.contains(active) ? active : null,
      hiding: false,
    });

    const queued = !this.isConnected || this.#visible.length >= this.#getMaxVisible();
    if (queued) this.#queue.push({ toast, duration });
    else this.#showToast(toast);

    this.dispatchEvent(new CustomEvent('toast-msg:enqueued', {
      detail: { message, variant, duration, source, toast, queued },
      bubbles: true,
    }));

    return toast;
  }

  /**
   * Dismiss one toast — works for dismissible:false toasts too. Queued
   * toasts are dropped from the queue.
   * @param {HTMLElement} toast
   */
  dismiss(toast) {
    const q = this.#queue.findIndex((entry) => entry.toast === toast);
    if (q > -1) { this.#queue.splice(q, 1); return; }
    this.#dismissToast(toast);
  }

  /** Dismiss all visible toasts and drop the queue. */
  dismissAll() {
    this.#queue = [];
    [...this.#visible].forEach((toast) => this.#dismissToast(toast));
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the current visible + queued toasts as a plain array. Each
   * entry: `{ message, variant, state }` where state is 'visible' or
   * 'queued'. Toast-msg is intentionally imperative — there is no
   * `.queue` setter; use `.show(...)` to add a toast.
   *
   * @returns {Array<{ message: string, variant: string, state: string }>} Toast records.
   */
  get queue() {
    const read = (t, state) => ({
      message: this.#records.get(t)?.message ?? '',
      variant: t.getAttribute('data-variant') || 'info',
      state,
    });
    return [
      ...this.#visible.map((t) => read(t, 'visible')),
      ...this.#queue.map(({ toast }) => read(toast, 'queued')),
    ];
  }

  // ── Internals ───────────────────────────────────────────────────

  /** Set an attribute only when the author hasn't. */
  #own(name, value) {
    if (this.hasAttribute(name) && !this.#ownedAttrs.has(name)) return;
    this.setAttribute(name, value);
    this.#ownedAttrs.add(name);
  }

  #label(key) {
    return this.getAttribute(`data-label-${key}`) ?? LABELS[key] ?? key;
  }

  #createToast({ message, variant, dismissible, action, onAction }) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('data-variant', variant);

    const esc = (s) => this.#escapeHtml(s);
    toast.innerHTML = `
      <span class="icon" aria-hidden="true">${ICONS[variant]}</span>
      <span class="message"><span class="variant-label">${esc(this.#label(variant))}: </span>${esc(message)}</span>
      ${action ? `<button type="button" class="action">${esc(action)}</button>` : ''}
      ${dismissible ? `<button type="button" class="close" aria-label="${esc(this.#label('dismiss'))}">&#x2715;</button>` : ''}
    `;

    toast.querySelector('.close')?.addEventListener('click', () => this.#dismissToast(toast));
    if (action) {
      toast.querySelector('.action')?.addEventListener('click', () => {
        onAction?.();
        this.#dismissToast(toast);
      });
    }
    return toast;
  }

  #showToast(toast) {
    this.appendChild(toast);
    this.#visible.push(toast);

    requestAnimationFrame(() => {
      if (toast.getAttribute('data-state') !== 'hiding') toast.setAttribute('data-state', 'visible');
    });

    this.#syncTimers();

    this.dispatchEvent(new CustomEvent('toast-msg:show', {
      bubbles: true,
      detail: { toast },
    }));
  }

  #drainQueue() {
    while (this.isConnected && this.#queue.length && this.#visible.length < this.#getMaxVisible()) {
      const { toast } = /** @type {{ toast: HTMLElement }} */ (this.#queue.shift());
      this.#showToast(toast);
    }
  }

  /** Paused while hovered, focused within, or the page is hidden. */
  get #paused() {
    return this.#hovered || this.#focusWithin || document.visibilityState === 'hidden';
  }

  #syncTimers() {
    const paused = this.#paused || !this.isConnected;
    for (const toast of this.#visible) {
      const rec = this.#records.get(toast);
      if (!rec || rec.hiding || rec.duration <= 0) continue;
      if (paused) this.#pause(rec);
      else if (rec.timer === undefined) this.#arm(toast, rec);
    }
  }

  /**
   * @param {HTMLElement} toast
   * @param {ToastRecord} rec
   */
  #arm(toast, rec) {
    rec.startedAt = performance.now();
    rec.timer = setTimeout(() => {
      rec.timer = undefined;
      this.#dismissToast(toast);
    }, rec.remaining);
  }

  /** @param {ToastRecord} rec */
  #pause(rec) {
    if (rec.timer === undefined) return;
    clearTimeout(rec.timer);
    rec.timer = undefined;
    rec.remaining = Math.max(0, rec.remaining - (performance.now() - rec.startedAt));
  }

  #dismissToast(toast) {
    const rec = this.#records.get(toast);
    if (!rec || rec.hiding || toast.parentNode !== this) return;
    rec.hiding = true;
    if (rec.timer !== undefined) clearTimeout(rec.timer);
    rec.timer = undefined;

    this.#moveFocusFrom(toast, rec);
    toast.setAttribute('data-state', 'hiding');

    const done = () => this.#finishDismiss(toast);
    toast.addEventListener('animationend', done, { once: true });
    setTimeout(done, EXIT_FALLBACK_MS);
  }

  #finishDismiss(toast) {
    if (toast.parentNode !== this && !this.#visible.includes(toast)) return;
    toast.remove();
    const index = this.#visible.indexOf(toast);
    if (index > -1) this.#visible.splice(index, 1);
    /* Removing a hovered/focused toast doesn't always fire leave/out. */
    this.#focusWithin = this.contains(document.activeElement);
    if (!this.#visible.length) this.#hovered = false;
    this.#drainQueue();
    this.#syncTimers();
    this.dispatchEvent(new CustomEvent('toast-msg:hide', {
      bubbles: true,
      detail: { toast },
    }));
  }

  /** Keep focus from falling to <body> when the focused toast goes away. */
  #moveFocusFrom(toast, rec) {
    if (!toast.contains(document.activeElement)) return;
    const live = this.#visible.filter((t) => t !== toast && !this.#records.get(t)?.hiding);
    const i = this.#visible.indexOf(toast);
    const next = live.find((t) => this.#visible.indexOf(t) > i) ?? live[live.length - 1];
    const target = next?.querySelector('button');
    if (target) { target.focus(); return; }
    const back = rec.returnFocus;
    if (back instanceof HTMLElement && back.isConnected) back.focus();
  }

  #getDefaultDuration() {
    const attr = this.getAttribute('duration');
    const n = attr !== null ? parseInt(attr, 10) : NaN;
    return Number.isFinite(n) ? n : 5000;
  }

  #getMaxVisible() {
    const attr = this.getAttribute('max');
    const n = attr !== null ? parseInt(attr, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 5;
  }

  #escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
  }
}

registerComponent('toast-msg', ToastMsg);

export { ToastMsg };
