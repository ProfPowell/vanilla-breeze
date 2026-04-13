/**
 * note-wc — Private note action for selection-menu
 *
 * Adds a private note to the currently selected/highlighted text.
 * Works inside <selection-menu> alongside highlight-wc.
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

class NoteWC extends VBElement {
  setup() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Add private note');
    btn.innerHTML = `<icon-wc name="sticky-note" size="sm" aria-hidden="true"></icon-wc>`;
    btn.addEventListener('click', () => this.#handleClick());
    this.appendChild(btn);
  }

  #handleClick() {
    const menu = this.closest('selection-menu');
    if (!menu) return;

    const sel = menu.getSelection();
    if (!sel) return;

    // Find the highlight-wc sibling to access the controller
    const highlightWc = menu.querySelector('highlight-wc');
    if (!highlightWc) return;

    // Check if the selection is within an existing highlight
    const highlights = highlightWc.getHighlights();
    // For now, create a highlight first, then the user can add a note via the toolbar
    // This is a simplified flow — the note action ensures a highlight exists
    this.dispatchEvent(new CustomEvent('note-wc:request', {
      detail: { text: sel.text, target: sel.target },
      bubbles: true,
    }));

    menu.dismiss();
  }
}

registerComponent('note-wc', NoteWC);
