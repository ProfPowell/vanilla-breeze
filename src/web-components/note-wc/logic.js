/**
 * note-wc — Private note action + panel host
 *
 * Three usage contexts:
 *   1. Inside <selection-menu>: one-click "highlight + open note panel" on
 *      the current selection.
 *   2. With for="id" (standalone or inside <page-tools>): page-level
 *      button that opens the panel for the first noted (else first)
 *      highlight on the target.
 *   3. Without for and outside selection-menu: renders no button. It only
 *      hosts the note panel for margin-annotation clicks (see below).
 *
 * In every mode note-wc owns the note-panel UI itself — built lazily when
 * first opened. Margin-annotation clicks on a [data-highlights] target
 * dispatch a `highlights:request-note` event; note-wc listens at document
 * level and opens its panel for the requested highlight, regardless of
 * which note-wc you authored.
 *
 * Closing the panel (Save, Cancel, Escape, Ctrl/Cmd+Enter, outside click)
 * returns focus to the opener when it is still visible, else to the
 * highlight's <mark>, else to the target element.
 *
 * @attr {string} for - ID of target element (page-level mode)
 * @attr {string} data-label-* - English string overrides, see LABELS
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { initHighlights } from '../../utils/highlights-init.js';

/** Default English strings; each is overridable with data-label-<key>. */
const LABELS = {
  add: 'Add private note',
  view: 'View notes',
  dialog: 'Private note',
  heading: 'Private note',
  placeholder: 'Add a note…',
  textarea: 'Note for highlighted text',
  save: 'Save',
  cancel: 'Cancel',
};

let panelHostsRegistered = false;
const panelHosts = new Set();

/**
 * Character offset of (node, nodeOffset) within container's text. Equal
 * to the TreeWalker(SHOW_TEXT) sum highlights-init uses for stored
 * highlights, and also valid for element boundary points.
 * @param {Node} container
 * @param {Node} node
 * @param {number} nodeOffset
 */
function textOffset(container, node, nodeOffset) {
  if (!container.contains(node)) return -1;
  const r = document.createRange();
  r.setStart(container, 0);
  r.setEnd(node, nodeOffset);
  return r.toString().length;
}

class NoteWC extends VBElement {
  #inSelectionMenu = false;
  /** @type {HTMLElement | null} */
  #panel = null;
  /** @type {HTMLElement | null} Element to return focus to on close */
  #opener = null;
  /** @type {{ id: string } | null} */
  #highlight = null;
  /** @type {any} */
  #controller = null;
  /** @type {Element | null} Target we marked as the positioning host */
  #positionHost = null;

  setup() {
    this.#inSelectionMenu = !!this.closest('selection-menu');
    const hasFor = this.hasAttribute('for');

    panelHosts.add(this);
    if (!panelHostsRegistered) {
      panelHostsRegistered = true;
      document.addEventListener('highlights:request-note', onRequestNote);
    }

    // Reuse the button from a previous setup (reconnect / move).
    let btn = /** @type {HTMLButtonElement | null} */ (this.querySelector(':scope > button[data-note-action]'));

    // Standalone without for: panel host only, no dead button.
    if (!this.#inSelectionMenu && !hasFor) {
      btn?.remove();
      return;
    }

    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-note-action', '');
      const icon = document.createElement('icon-wc');
      icon.setAttribute('name', 'sticky-note');
      icon.setAttribute('size', 'sm');
      icon.setAttribute('aria-hidden', 'true');
      btn.appendChild(icon);
      this.appendChild(btn);
    }
    btn.setAttribute('aria-label', this.#label(this.#inSelectionMenu ? 'add' : 'view'));
    this.listen(btn, 'click', this.#inSelectionMenu
      ? () => this.#handleSelectionNote()
      : () => this.#handlePageNote());
  }

  teardown() {
    panelHosts.delete(this);
    this.#hidePanel({ restoreFocus: false });
  }

  #label(key) {
    return this.getAttribute(`data-label-${key}`) ?? LABELS[key] ?? key;
  }

  /**
   * Public API — open the note panel for a specific highlight on a
   * controller. Called by the highlights:request-note delegation and by
   * selection-menu mode. Focus returns to `opener` (default: the element
   * focused when the panel opened) on close.
   * @param {any} highlight
   * @param {any} controller
   * @param {HTMLElement | null} [opener]
   */
  openFor(highlight, controller, opener) {
    this.#showPanel(highlight, controller,
      opener ?? /** @type {HTMLElement | null} */ (document.activeElement));
  }

  /** Selection-menu mode: highlight + open note panel */
  #handleSelectionNote() {
    const menu = /** @type {any} */ (this.closest('selection-menu'));
    if (!menu) return;

    const sel = menu.getSelection();
    if (!sel) return;

    const target = sel.target;
    const opener = /** @type {HTMLElement | null} */ (document.activeElement);

    if (!target.hasAttribute('data-highlights-init')) {
      target.setAttribute('data-highlights', '');
    }
    const controller = initHighlights(target);

    // Locate the selection as text offsets, the same coordinates the
    // controller stores, so matching is by position — not by substring.
    const range = /** @type {Range} */ (sel.range);
    const start = textOffset(target, range.startContainer, range.startOffset);
    const end = textOffset(target, range.endContainer, range.endOffset);

    let existing = null;
    if (start >= 0 && end > start) {
      existing = controller.getHighlights()
        .find(hl => hl.startOffset <= start && hl.endOffset >= end) ?? null;
    }

    if (!existing) {
      // _createFromSelection reads the live selection; restore it if the
      // toolbar click collapsed it.
      const live = window.getSelection();
      if (live && (live.isCollapsed || live.rangeCount === 0)) {
        live.removeAllRanges();
        live.addRange(range);
      }
      controller._createFromSelection('yellow');
      const updated = controller.getHighlights();
      existing = updated.find(hl => hl.startOffset === start && hl.endOffset === end)
        ?? updated[updated.length - 1] ?? null;
    }

    menu.dismiss();

    if (existing) {
      this.#showPanel(existing, controller, opener);
    }
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
    const first = highlights.find(h => h.note) ?? highlights[0];
    // If no highlights exist, do nothing (user needs to highlight first)
    if (first) this.#showPanel(first, controller, /** @type {HTMLElement | null} */ (document.activeElement));
  }

  // ---------- Note panel UI ------------------------------------------

  #showPanel(highlight, controller, opener) {
    this.#hidePanel({ restoreFocus: false });

    const element = controller.element;
    this.#opener = opener && opener !== document.body ? opener : null;
    this.#highlight = highlight;
    this.#controller = controller;

    const panel = document.createElement('div');
    panel.className = 'hn-note-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', this.#label('dialog'));

    const header = document.createElement('header');
    header.className = 'hn-note-header';
    const headerLabel = document.createElement('small');
    headerLabel.textContent = this.#label('heading'); // CSS uppercases it
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
    textarea.placeholder = this.#label('placeholder');
    textarea.value = highlight.note || '';
    textarea.rows = 3;
    textarea.setAttribute('aria-label', this.#label('textarea'));
    panel.appendChild(textarea);

    const actions = document.createElement('footer');
    actions.className = 'hn-note-actions';

    const save = () => {
      controller._updateNote(highlight.id, textarea.value.trim());
      this.#hidePanel();
    };

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'hn-action hn-action-save';
    saveBtn.textContent = this.#label('save');
    saveBtn.addEventListener('click', save);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'hn-action';
    cancelBtn.textContent = this.#label('cancel');
    cancelBtn.addEventListener('click', () => this.#hidePanel());

    actions.append(saveBtn, cancelBtn);
    panel.appendChild(actions);

    // Escape anywhere in the panel cancels; Ctrl/Cmd+Enter in the textarea saves.
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.#hidePanel();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && e.target === textarea) {
        e.preventDefault();
        save();
      }
    });

    // Anchor to the target. A static target becomes a positioning context
    // through a data hook (styled in note-wc/styles.css), removed on close.
    if (getComputedStyle(element).position === 'static') {
      element.setAttribute('data-note-host', '');
      this.#positionHost = element;
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
      // The panel may have closed (or been replaced) before this frame.
      if (this.#panel !== panel) return;
      textarea.focus();
      document.addEventListener('pointerdown', this.#onOutsideClick);
    });
  }

  #onOutsideClick = (e) => {
    if (!this.#panel || this.#panel.contains(/** @type {Node} */ (e.target))) return;
    this.#hidePanel({ restoreFocus: false });
    // Let the click land first; if it didn't put focus anywhere (focus
    // fell to <body>), return it to the opener.
    const opener = this.#lastFocusTarget;
    document.addEventListener('pointerup', () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || active === document.body) opener?.();
      });
    }, { once: true, capture: true });
  };

  /** @type {(() => void) | null} Restores focus for the last-closed panel */
  #lastFocusTarget = null;

  /** Pick where focus goes after close: visible opener, the highlight's mark, or the target. */
  #focusRestorer() {
    const opener = this.#opener;
    const element = this.#controller?.element;
    const id = this.#highlight?.id;
    return () => {
      if (opener?.isConnected && (typeof opener.checkVisibility !== 'function' || opener.checkVisibility())) {
        opener.focus({ preventScroll: true });
        if (document.activeElement === opener) return;
      }
      if (!element?.isConnected) return;
      const mark = /** @type {HTMLElement | null} */ (
        id ? element.querySelector(`mark[data-hn-id="${CSS.escape(id)}"]`) : null);
      const target = /** @type {HTMLElement} */ (mark ?? element);
      if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
    };
  }

  #hidePanel({ restoreFocus = true } = {}) {
    if (!this.#panel) return;
    const restore = this.#focusRestorer();
    document.removeEventListener('pointerdown', this.#onOutsideClick);
    this.#panel.remove();
    this.#panel = null;
    this.#positionHost?.removeAttribute('data-note-host');
    this.#positionHost = null;
    this.#lastFocusTarget = restore;
    this.#opener = null;
    this.#highlight = null;
    this.#controller = null;
    if (restoreFocus) restore();
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
