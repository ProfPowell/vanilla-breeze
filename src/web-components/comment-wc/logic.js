/**
 * comment-wc — Collaborative comment action for selection-menu
 *
 * EXPERIMENTAL / STUB. Bridges to <review-surface> for threaded, shareable
 * comments, but Vanilla Breeze does not ship <review-surface>: unless your
 * page defines one (with an addPin() method), the button stays disabled.
 *
 * When inside a selection-menu, creates a review-surface pin at the
 * selection's position. The surface is resolved on every click (an ancestor
 * <review-surface>, or the one whose `for` matches the menu's `for`), so a
 * surface added after this element upgrades is still found.
 *
 * For private reader notes, use <note-wc> instead.
 *
 * @fires comment-wc:created - { text, x, y } after a pin is added
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

let uid = 0;

class CommentWC extends VBElement {
  /** @type {HTMLButtonElement | null} */
  #btn = null;
  /** @type {HTMLElement | null} */
  #reason = null;

  setup() {
    // Reconnect guard: VBElement re-runs setup() on every reconnect, which
    // would append a second button. Reuse ours if it is already in place.
    this.#btn = this.querySelector(':scope > button');
    this.#reason = this.querySelector(':scope > .comment-wc-reason');
    if (!this.#btn) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const icon = document.createElement('icon-wc');
      icon.setAttribute('name', 'message-circle');
      icon.setAttribute('size', 'sm');
      icon.setAttribute('aria-hidden', 'true');
      btn.appendChild(icon);

      // Why the action is unavailable: real text, visually hidden, wired
      // through aria-describedby (a title tooltip is not reliably announced).
      const reason = document.createElement('span');
      reason.className = 'comment-wc-reason visually-hidden';
      reason.id = `comment-wc-reason-${++uid}`;
      reason.textContent = 'Comments are unavailable: this content has no review surface.';

      this.append(btn, reason);
      this.#btn = btn;
      this.#reason = reason;
    }

    this.#syncState();
    // Delegated so it survives the reconnect guard above (listeners added
    // through listen() are released on disconnect and re-added here).
    this.listen(this, 'click', this.#onClick);
    // Re-check when the menu opens: a surface may have appeared since.
    const menu = this.closest('selection-menu');
    if (menu) this.listen(menu, 'toggle', () => this.#syncState());
  }

  /** Find the review-surface this action should pin to (resolved on demand). */
  #findSurface() {
    const ancestor = /** @type {any} */ (this.closest('review-surface'));
    if (ancestor) return ancestor;
    const menuFor = this.closest('selection-menu')?.getAttribute('for');
    if (!menuFor) return null;
    return /** @type {any} */ (document.querySelector(`review-surface[for="${CSS.escape(menuFor)}"]`));
  }

  #syncState() {
    const btn = this.#btn;
    if (!btn) return;
    const available = !!this.#findSurface();
    if (available) {
      btn.removeAttribute('aria-disabled');
      btn.removeAttribute('aria-describedby');
      btn.setAttribute('aria-label', 'Add comment');
    } else {
      // aria-disabled (not disabled) keeps it focusable so the reason is
      // discoverable; the click handler ignores it.
      btn.setAttribute('aria-disabled', 'true');
      btn.setAttribute('aria-label', 'Add comment');
      if (this.#reason) btn.setAttribute('aria-describedby', this.#reason.id);
    }
  }

  /** @param {MouseEvent} e */
  #onClick = (e) => {
    if (!this.#btn?.contains(/** @type {Node} */ (e.target))) return;
    this.#syncState();
    const reviewSurface = this.#findSurface();
    if (!reviewSurface) return;

    const menu = /** @type {any} */ (this.closest('selection-menu'));
    if (!menu) return;

    const sel = menu.getSelection();
    if (!sel) return;

    const rect = sel.range.getBoundingClientRect();
    const surfaceRect = reviewSurface.getBoundingClientRect();
    const x = ((rect.left + rect.width / 2 - surfaceRect.left) / surfaceRect.width) * 100;
    const y = ((rect.top - surfaceRect.top) / surfaceRect.height) * 100;

    if (typeof reviewSurface.addPin === 'function') {
      reviewSurface.addPin({ x, y, text: sel.text });
    }

    this.dispatchEvent(new CustomEvent('comment-wc:created', {
      detail: { text: sel.text, x, y },
      bubbles: true,
    }));

    menu.dismiss();
  };
}

registerComponent('comment-wc', CommentWC);
