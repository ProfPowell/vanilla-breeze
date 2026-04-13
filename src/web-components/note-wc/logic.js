/**
 * note-wc — Private note action (selection-menu, page-tools, or standalone)
 *
 * Three usage contexts:
 * 1. Inside <selection-menu>: one-click "highlight + note" on selected text
 * 2. Inside <page-tools> or standalone with for="id": page-level note toggle
 *    that shows/hides all notes for the target article
 * 3. Standalone without for: renders as inert icon
 *
 * @attr {string} for - ID of target element (page-level mode)
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { initHighlights, showNotePanel } from '../../utils/highlights-init.js';

class NoteWC extends VBElement {
  #inSelectionMenu = false;

  setup() {
    this.#inSelectionMenu = !!this.closest('selection-menu');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', this.#inSelectionMenu ? 'Add private note' : 'View notes');
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'sticky-note');
    icon.setAttribute('size', 'sm');
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);

    if (this.#inSelectionMenu) {
      btn.addEventListener('click', () => this.#handleSelectionNote());
    } else {
      btn.addEventListener('click', () => this.#handlePageNote());
    }

    this.appendChild(btn);
  }

  /** Selection-menu mode: highlight + open note panel */
  #handleSelectionNote() {
    const menu = this.closest('selection-menu');
    if (!menu) return;

    const sel = menu.getSelection();
    if (!sel) return;

    const target = sel.target;

    // Ensure highlights initialized
    if (!target.hasAttribute('data-highlights-init')) {
      target.setAttribute('data-highlights', '');
    }
    const controller = initHighlights(target);

    // Find existing highlight at selection, or create one
    const highlights = controller.getHighlights();
    let existing = null;
    for (const hl of highlights) {
      if (sel.text && hl.text && sel.text.includes(hl.text.slice(0, 20))) {
        existing = hl;
        break;
      }
    }

    if (!existing) {
      controller._createFromSelection('yellow');
      const updated = controller.getHighlights();
      existing = updated[updated.length - 1];
    }

    if (existing) {
      showNotePanel(controller, existing);
    }

    menu.dismiss();
  }

  /** Page-level mode: toggle notes visibility / show note summary */
  #handlePageNote() {
    const forId = this.getAttribute('for');
    const target = forId ? document.getElementById(forId) : null;
    if (!target) return;

    // Ensure highlights initialized
    if (!target.hasAttribute('data-highlights-init')) {
      target.setAttribute('data-highlights', '');
    }
    const controller = initHighlights(target);
    const highlights = controller.getHighlights();
    const withNotes = highlights.filter(h => h.note);

    if (withNotes.length > 0) {
      // Show the first note that has content
      showNotePanel(controller, withNotes[0]);
    } else if (highlights.length > 0) {
      // Show note panel for the first highlight (to add a note)
      showNotePanel(controller, highlights[0]);
    }
    // If no highlights exist, do nothing (user needs to highlight first)
  }
}

registerComponent('note-wc', NoteWC);
