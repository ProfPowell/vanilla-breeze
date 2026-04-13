/**
 * comment-wc — Inline comment action for selection-menu (stub)
 *
 * Placeholder for future inline commenting feature.
 * Shows a tooltip indicating the feature is coming soon.
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

class CommentWC extends VBElement {
  setup() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Add comment (coming soon)');
    btn.innerHTML = `<icon-wc name="message-circle" size="sm" aria-hidden="true"></icon-wc>`;
    btn.addEventListener('click', () => this.#handleClick());
    this.appendChild(btn);
  }

  #handleClick() {
    const menu = this.closest('selection-menu');
    if (!menu) return;

    this.dispatchEvent(new CustomEvent('comment-wc:request', {
      detail: { text: menu.getSelection()?.text },
      bubbles: true,
    }));

    menu.dismiss();
  }
}

registerComponent('comment-wc', CommentWC);
