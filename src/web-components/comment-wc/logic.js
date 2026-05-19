/**
 * comment-wc — Collaborative comment action for selection-menu
 *
 * Bridges to <review-surface> for threaded, shareable comments.
 * When inside a selection-menu, creates a review-surface pin at
 * the selection's position. If no review-surface is available,
 * shows a disabled state.
 *
 * For private reader notes, use <note-wc> instead.
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

class CommentWC extends VBElement {
  setup() {
    const btn = document.createElement('button');
    btn.type = 'button';
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'message-circle');
    icon.setAttribute('size', 'sm');
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);

    // Check if review-surface is available
    const menuFor = this.closest('selection-menu')?.getAttribute('for');
    const reviewSurface = this.closest('review-surface') ||
      (menuFor ? document.querySelector(`review-surface[for="${menuFor}"]`) : null);

    if (!reviewSurface) {
      btn.setAttribute('aria-label', 'Comments not available');
      btn.style.opacity = '0.4';
      btn.setAttribute('title', 'Wrap content in <review-surface> to enable comments');
    } else {
      btn.setAttribute('aria-label', 'Add comment');
      btn.addEventListener('click', () => this.#handleClick(reviewSurface));
    }

    this.appendChild(btn);
  }

  #handleClick(reviewSurface) {
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
  }
}

registerComponent('comment-wc', CommentWC);
