/**
 * selection-menu — Floating toolbar on text selection
 *
 * Composes <pop-over data-mode="manual"> for the toolbar surface so the
 * toolbar sits in the top layer (no z-index battles), inherits pop-over's
 * display:none cascade re-assertion (popover_display_gotcha), and keeps
 * a consistent popover lifecycle with the rest of VB's popover family.
 *
 * Positioning is bespoke — the toolbar anchors to a text Range, not a
 * DOM element — so selection-menu sets the pop-over's inline top/left
 * after each show. Light-dismiss is handled by the host (pointerdown on
 * document + Escape), since manual popovers don't dismiss themselves
 * and we don't want pointer events during selection to close the menu.
 *
 * @attr {string} for - ID of a single target element
 * @attr {string} id  - When set, elements with data-selection-menu="id" become targets
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
// Ensure <pop-over> is registered — selection-menu composes it for the toolbar.
import '../pop-over/logic.js';

const TOOLBAR_GAP = 8;
const EDGE_PAD = 8;

let selectionMenuSeq = 0;

class SelectionMenu extends VBElement {
  /** @type {{ range: Range, text: string, target: Element } | null} */
  #selection = null;
  /** @type {Set<Element>} */
  #targets = new Set();
  /** @type {boolean} */
  #visible = false;
  /** @type {HTMLElement} */
  #popover;

  setup() {
    // Compose pop-over: move authored children (highlight-wc, share-wc,
    // etc.) into a manual-mode pop-over so they render in the top layer.
    const existing = /** @type {HTMLElement | null} */ (
      this.querySelector(':scope > pop-over[data-selection-menu-host]'));
    if (existing) {
      this.#popover = existing;
    } else {
      this.#popover = document.createElement('pop-over');
      this.#popover.setAttribute('data-selection-menu-host', '');
      this.#popover.dataset.mode = 'manual';
      this.#popover.id = `selection-menu-${++selectionMenuSeq}`;
      /* Reparent existing children into the pop-over BEFORE the
         pop-over is connected so it mounts once with its content in
         place. Skip already-relocated children (e.g. on re-setup). */
      const children = [...this.children];
      for (const child of children) {
        if (child !== this.#popover) this.#popover.appendChild(child);
      }
      this.appendChild(this.#popover);
    }

    // The host coordinates; the pop-over is the visible toolbar.
    this.hidden = false;

    this.#collectTargets();

    this.listen(document, 'pointerup', this.#onPointerUp);
    this.listen(document, 'pointerdown', this.#onDocumentPointerDown);
    this.listen(document, 'keydown', this.#onKeyDown);

    if (this.id) {
      const observer = new MutationObserver(() => this.#collectTargets());
      observer.observe(document.body, {
        childList: true, subtree: true,
        attributeFilter: ['data-selection-menu'],
      });
    }
  }

  // --- Public API ---

  getSelection() {
    return this.#selection ? { ...this.#selection } : null;
  }

  dismiss() {
    this.#hide();
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current toolbar actions as a plain data array. Each entry:
   * `{ tag, attrs?, html? }`.
   */
  get actions() {
    const container = this.#popover || this;
    return [...container.children].map(el => ({
      tag: el.tagName.toLowerCase(),
      attrs: Object.fromEntries(
        [...el.attributes].map(a => [a.name, a.value])
      ),
      html: el.innerHTML || undefined,
    }));
  }

  set actions(value) {
    const next = Array.isArray(value) ? value : [];
    const container = this.#popover || this;
    while (container.firstChild) container.firstChild.remove();
    for (const a of next) {
      if (a instanceof Element) {
        container.appendChild(a);
        continue;
      }
      if (!a?.tag) continue;
      const el = document.createElement(a.tag);
      if (a.attrs) {
        for (const [name, val] of Object.entries(a.attrs)) {
          if (val == null || val === false) continue;
          el.setAttribute(name, val === true ? '' : String(val));
        }
      }
      if (a.html) el.innerHTML = a.html;
      container.appendChild(el);
    }
    this.dispatchEvent(new CustomEvent('selection-menu:actions-changed', {
      detail: { actions: this.actions, source: 'property' },
      bubbles: true,
    }));
  }

  // --- Target collection ---

  #collectTargets() {
    this.#targets.clear();

    const forId = this.getAttribute('for');
    if (forId) {
      const el = document.getElementById(forId);
      if (el) {
        this.#targets.add(el);
        if (!el.hasAttribute('data-selection-menu')) {
          el.setAttribute('data-selection-menu', this.id || '');
        }
      }
    }

    if (this.id) {
      document.querySelectorAll(`[data-selection-menu="${this.id}"]`).forEach(el => {
        this.#targets.add(el);
      });
    }
  }

  // --- Selection detection ---

  #onPointerUp = () => {
    requestAnimationFrame(() => {
      if (!this.isConnected) return;
      this.#checkSelection();
    });
  };

  #checkSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const ancestorEl = ancestor.nodeType === Node.ELEMENT_NODE
      ? /** @type {Element} */ (ancestor)
      : ancestor.parentElement;

    let target = null;
    for (const t of this.#targets) {
      if (t.contains(ancestorEl)) {
        target = t;
        break;
      }
    }
    if (!target) return;

    const text = sel.toString().trim();
    this.#selection = { range: range.cloneRange(), text, target };

    this.dispatchEvent(new CustomEvent('selection-menu:select', {
      detail: { range: this.#selection.range, text, target },
      bubbles: true,
    }));

    this.#show(range.getBoundingClientRect());
  }

  // --- Show / hide ---

  #show(anchorRect) {
    if (!this.#popover) return;
    /** @type {any} */ (this.#popover).show();
    this.#visible = true;

    requestAnimationFrame(() => {
      const rect = this.#popover.getBoundingClientRect();
      const pw = rect.width || 200;
      const ph = rect.height || 40;

      let top = anchorRect.top - ph - TOOLBAR_GAP;
      let left = anchorRect.left + (anchorRect.width / 2) - (pw / 2);

      if (top < EDGE_PAD) {
        top = anchorRect.bottom + TOOLBAR_GAP;
      }

      const maxLeft = window.innerWidth - pw - EDGE_PAD;
      left = Math.max(EDGE_PAD, Math.min(left, maxLeft));

      this.#popover.style.top = `${top}px`;
      this.#popover.style.left = `${left}px`;
    });
  }

  #hide() {
    if (this.#popover) /** @type {any} */ (this.#popover).hide();
    this.#visible = false;
    this.#selection = null;
    this.dispatchEvent(new CustomEvent('selection-menu:dismiss', { bubbles: true }));
  }

  #onDocumentPointerDown = (e) => {
    if (!this.#visible) return;
    if (this.#popover?.contains(e.target)) return;
    if (this.contains(e.target)) return;
    this.#hide();
  };

  #onKeyDown = (e) => {
    if (e.key === 'Escape' && this.#visible) {
      this.#hide();
    }
  };
}

registerComponent('selection-menu', SelectionMenu);
