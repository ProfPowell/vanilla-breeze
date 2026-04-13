/**
 * selection-menu — Floating toolbar on text selection
 *
 * The element itself becomes the floating toolbar — no DOM reparenting.
 * Child action components (highlight-wc, share-wc, note-wc, comment-wc)
 * render inside it directly and upgrade normally.
 *
 * Hidden by default, shown when text is selected in a target element.
 * Positioned fixed above the selection with viewport clamping.
 *
 * @attr {string} for - ID of a single target element
 * @attr {string} id  - When set, elements with data-selection-menu="id" become targets
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

const TOOLBAR_GAP = 8;
const EDGE_PAD = 8;

class SelectionMenu extends VBElement {
  /** @type {{ range: Range, text: string, target: Element } | null} */
  #selection = null;
  /** @type {Set<Element>} */
  #targets = new Set();
  /** @type {boolean} */
  #visible = false;

  setup() {
    // Start hidden
    this.hidden = true;

    // Collect targets
    this.#collectTargets();

    // Listen for selections on document (delegation)
    this.listen(document, 'pointerup', this.#onPointerUp);

    // Click outside to dismiss
    this.listen(document, 'pointerdown', this.#onDocumentPointerDown);

    // Escape to dismiss
    this.listen(document, 'keydown', this.#onKeyDown);

    // Watch for dynamic targets
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
    this.hidden = false;
    this.#visible = true;

    requestAnimationFrame(() => {
      const rect = this.getBoundingClientRect();
      const pw = rect.width || 200;
      const ph = rect.height || 40;

      let top = anchorRect.top - ph - TOOLBAR_GAP;
      let left = anchorRect.left + (anchorRect.width / 2) - (pw / 2);

      if (top < EDGE_PAD) {
        top = anchorRect.bottom + TOOLBAR_GAP;
      }

      const maxLeft = window.innerWidth - pw - EDGE_PAD;
      left = Math.max(EDGE_PAD, Math.min(left, maxLeft));

      this.style.top = `${top}px`;
      this.style.left = `${left}px`;
    });
  }

  #hide() {
    this.hidden = true;
    this.#visible = false;
    this.#selection = null;
    this.dispatchEvent(new CustomEvent('selection-menu:dismiss', { bubbles: true }));
  }

  #onDocumentPointerDown = (e) => {
    if (!this.#visible) return;
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
