/**
 * note-wc — Private note action for selection-menu
 *
 * One-click "highlight + annotate": creates a highlight on the
 * selected text (if not already highlighted) then opens the note
 * panel. Delegates to HighlightController for persistence.
 *
 * This is the reader's private marginalia — stored in localStorage,
 * not shared with others. For collaborative comments, use comment-wc
 * with review-surface.
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { initHighlights, showNotePanel } from '../../utils/highlights-init.js';

class NoteWC extends VBElement {
  setup() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Add private note');
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'sticky-note');
    icon.setAttribute('size', 'sm');
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);
    btn.addEventListener('click', () => this.#handleClick());
    this.appendChild(btn);
  }

  #handleClick() {
    const menu = this.closest('selection-menu');
    if (!menu) return;

    const sel = menu.getSelection();
    if (!sel) return;

    const target = sel.target;

    // Ensure highlights are initialized on the target
    if (!target.hasAttribute('data-highlights-init')) {
      target.setAttribute('data-highlights', '');
    }
    const controller = initHighlights(target);

    // Check if selection overlaps an existing highlight
    const highlights = controller.getHighlights();
    let existing = null;

    for (const hl of highlights) {
      if (sel.text && hl.text && sel.text.includes(hl.text.slice(0, 20))) {
        existing = hl;
        break;
      }
    }

    if (!existing) {
      // Create a highlight first with default color, then open note panel
      controller._createFromSelection('yellow');
      const updated = controller.getHighlights();
      existing = updated[updated.length - 1];
    }

    if (existing) {
      showNotePanel(controller, existing);
    }

    menu.dismiss();
  }
}

registerComponent('note-wc', NoteWC);
