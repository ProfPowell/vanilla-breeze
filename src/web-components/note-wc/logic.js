/**
 * note-wc — Private note action + panel host
 *
 * Three usage contexts:
 *   1. Inside <selection-menu>: one-click "highlight + open note panel" on
 *      the current selection.
 *   2. Inside <page-tools> or standalone with for="id": page-level toggle
 *      that opens the panel for the first highlight on the target.
 *   3. Standalone without for: renders as an inert icon (decorative).
 *
 * In any of those modes note-wc also owns the note-panel UI itself —
 * built lazily when first opened. Margin-annotation clicks on a
 * [data-highlights] target now dispatch a `highlights:request-note`
 * event; note-wc listens at document level and opens its panel for the
 * requested highlight, regardless of which note-wc you authored.
 *
 * @attr {string} for - ID of target element (page-level mode)
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { initHighlights } from '../../utils/highlights-init.js';

let panelHostsRegistered = false;
const panelHosts = new Set();

class NoteWC extends VBElement {
  #inSelectionMenu = false;
  #panel = null;

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

    panelHosts.add(this);
    if (!panelHostsRegistered) {
      panelHostsRegistered = true;
      document.addEventListener('highlights:request-note', onRequestNote);
    }
  }

  teardown() {
    panelHosts.delete(this);
    this.#hidePanel();
  }

  /**
   * Public API — open the note panel for a specific highlight on a
   * controller. Called by event delegation and by selection-menu mode.
   */
  openFor(highlight, controller) {
    this.#showPanel(highlight, controller);
  }

  /** Selection-menu mode: highlight + open note panel */
  #handleSelectionNote() {
    const menu = this.closest('selection-menu');
    if (!menu) return;

    const sel = menu.getSelection();
    if (!sel) return;

    const target = sel.target;

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
      this.#showPanel(existing, controller);
    }

    menu.dismiss();
  }

  /** Page-level mode: open the panel for the first highlight on for=id */
  #handlePageNote() {
    const forId = this.getAttribute('for');
    const target = forId ? document.getElementById(forId) : null;
    if (!target) return;

    if (!target.hasAttribute('data-highlights-init')) {
      target.setAttribute('data-highlights', '');
    }
    const controller = initHighlights(target);
    const highlights = controller.getHighlights();
    const withNotes = highlights.filter(h => h.note);

    if (withNotes.length > 0) {
      this.#showPanel(withNotes[0], controller);
    } else if (highlights.length > 0) {
      this.#showPanel(highlights[0], controller);
    }
    // If no highlights exist, do nothing (user needs to highlight first)
  }

  // ---------- Note panel UI (was in highlights-init) ------------------

  #showPanel(highlight, controller) {
    this.#hidePanel();

    const element = controller.element;

    const panel = document.createElement('div');
    panel.className = 'hn-note-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Private note');

    const header = document.createElement('header');
    header.className = 'hn-note-header';
    const headerLabel = document.createElement('small');
    headerLabel.textContent = 'PRIVATE NOTE';
    header.appendChild(headerLabel);
    panel.appendChild(header);

    const quote = document.createElement('blockquote');
    quote.className = 'hn-note-quote';
    quote.textContent = highlight.text.length > 80
      ? highlight.text.slice(0, 80) + '…'
      : highlight.text;
    panel.appendChild(quote);

    const textarea = document.createElement('textarea');
    textarea.className = 'hn-note-textarea';
    textarea.placeholder = 'Add a note…';
    textarea.value = highlight.note || '';
    textarea.rows = 3;
    textarea.setAttribute('aria-label', 'Note for highlighted text');
    panel.appendChild(textarea);

    const actions = document.createElement('footer');
    actions.className = 'hn-note-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'hn-action hn-action-save';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      controller._updateNote(highlight.id, textarea.value.trim());
      this.#hidePanel();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'hn-action';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.#hidePanel());

    actions.append(saveBtn, cancelBtn);
    panel.appendChild(actions);

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.#hidePanel();
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        controller._updateNote(highlight.id, textarea.value.trim());
        this.#hidePanel();
      }
    });

    // Anchor to the article — same DOM location and positioning as before.
    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }
    element.appendChild(panel);

    // Vertical alignment with highlight's first rect, if we can resolve one
    if (typeof controller.findHighlightRect === 'function') {
      const firstRect = controller.findHighlightRect(highlight.id);
      if (firstRect) {
        const elementRect = element.getBoundingClientRect();
        panel.style.top = `${firstRect.top - elementRect.top}px`;
      }
    }

    this.#panel = panel;

    requestAnimationFrame(() => {
      textarea.focus();
      document.addEventListener('pointerdown', this.#onOutsideClick);
    });
  }

  #onOutsideClick = (e) => {
    if (this.#panel && !this.#panel.contains(e.target)) {
      this.#hidePanel();
    }
  };

  #hidePanel() {
    if (!this.#panel) return;
    document.removeEventListener('pointerdown', this.#onOutsideClick);
    this.#panel.remove();
    this.#panel = null;
  }
}

function onRequestNote(event) {
  const { highlight, controller } = event.detail || {};
  if (!highlight || !controller) return;
  // First note-wc on the page wins; multiple are unusual but supported.
  const host = panelHosts.values().next().value;
  if (host) host.openFor(highlight, controller);
}

registerComponent('note-wc', NoteWC);
