/**
 * selection-menu — Floating toolbar on text selection
 *
 * Appears above selected text in target elements. Child action
 * components (highlight-wc, share-wc, note-wc, comment-wc) read
 * the selection state via getSelection() and call dismiss().
 *
 * @attr {string} for - ID of a single target element
 * @attr {string} id  - When set, elements with data-selection-menu="id" become targets
 *
 * @example
 * <selection-menu for="article">
 *   <highlight-wc></highlight-wc>
 *   <share-wc variant="selection"></share-wc>
 * </selection-menu>
 *
 * @example Decoupled (many targets → one menu)
 * <selection-menu id="tools">...</selection-menu>
 * <article data-selection-menu="tools">...</article>
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

const TOOLBAR_GAP = 8;
const EDGE_PAD = 8;

class SelectionMenu extends VBElement {
  /** @type {{ range: Range, text: string, target: Element } | null} */
  #selection = null;
  /** @type {HTMLElement | null} */
  #panel = null;
  /** @type {Set<Element>} */
  #targets = new Set();

  setup() {
    // Build the floating panel
    this.#panel = document.createElement('div');
    this.#panel.className = 'selection-menu-panel';
    this.#panel.setAttribute('popover', 'auto');
    this.#panel.hidden = true;
    this.#panel.setAttribute('role', 'toolbar');
    this.#panel.setAttribute('aria-label', 'Selection tools');

    // Move children into panel
    while (this.firstChild) {
      this.#panel.appendChild(this.firstChild);
    }
    document.body.appendChild(this.#panel);

    // Collect targets
    this.#collectTargets();

    // Listen for selections
    this.listen(document, 'pointerup', this.#onPointerUp);
    this.listen(document, 'selectionchange', this.#onSelectionChange);

    // Popover dismiss
    this.listen(this.#panel, 'toggle', this.#onToggle);

    // Watch for dynamic targets
    this.#observeTargets();
  }

  teardown() {
    this.#panel?.remove();
    this.#panel = null;
    this.#targets.clear();
    this.#selection = null;
  }

  // --- Public API ---

  /** Get current selection state */
  getSelection() {
    return this.#selection ? { ...this.#selection } : null;
  }

  /** Dismiss the toolbar */
  dismiss() {
    this.#hide();
  }

  // --- Target collection ---

  #collectTargets() {
    this.#targets.clear();

    // Pattern A: for="id"
    const forId = this.getAttribute('for');
    if (forId) {
      const el = document.getElementById(forId);
      if (el) {
        this.#targets.add(el);
        el.setAttribute('data-selection-menu', this.id || '');
      }
    }

    // Pattern B: data-selection-menu="this.id"
    if (this.id) {
      document.querySelectorAll(`[data-selection-menu="${this.id}"]`).forEach(el => {
        this.#targets.add(el);
      });
    }
  }

  #observeTargets() {
    if (!this.id) return;
    const observer = new MutationObserver(() => this.#collectTargets());
    observer.observe(document.body, { childList: true, subtree: true, attributeFilter: ['data-selection-menu'] });
    // Store for cleanup (VBElement teardown handles listener cleanup but not observers)
    this._targetObserver = observer;
  }

  // --- Selection detection ---

  #onPointerUp = () => {
    requestAnimationFrame(() => this.#checkSelection());
  };

  #onSelectionChange = () => {
    // Only react if panel is hidden — don't dismiss while user is clicking toolbar
    if (this.#panel?.matches(':popover-open')) return;
  };

  #checkSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      return;
    }

    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const ancestorEl = ancestor.nodeType === Node.ELEMENT_NODE
      ? /** @type {Element} */ (ancestor)
      : ancestor.parentElement;

    // Check if selection is within a target
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

    // Dispatch event for children
    this.dispatchEvent(new CustomEvent('selection-menu:select', {
      detail: { range: this.#selection.range, text, target },
      bubbles: true,
    }));

    this.#show(range.getBoundingClientRect());
  }

  // --- Panel positioning ---

  #show(anchorRect) {
    if (!this.#panel) return;

    this.#panel.hidden = false;
    try { this.#panel.showPopover(); } catch { /* already open */ }

    requestAnimationFrame(() => {
      const panelRect = this.#panel.getBoundingClientRect();
      const pw = panelRect.width || 200;
      const ph = panelRect.height || 40;

      // Position above selection, centered
      let top = anchorRect.top - ph - TOOLBAR_GAP;
      let left = anchorRect.left + (anchorRect.width / 2) - (pw / 2);

      // Flip below if too close to top
      if (top < EDGE_PAD) {
        top = anchorRect.bottom + TOOLBAR_GAP;
      }

      // Clamp horizontal
      const maxLeft = window.innerWidth - pw - EDGE_PAD;
      left = Math.max(EDGE_PAD, Math.min(left, maxLeft));

      this.#panel.style.top = `${top}px`;
      this.#panel.style.left = `${left}px`;
    });
  }

  #hide() {
    if (!this.#panel) return;
    try { this.#panel.hidePopover(); } catch { /* already closed */ }
    this.#panel.hidden = true;
    this.#selection = null;

    this.dispatchEvent(new CustomEvent('selection-menu:dismiss', { bubbles: true }));
  }

  #onToggle = (e) => {
    if (e.newState === 'closed') {
      this.#panel.hidden = true;
      this.#selection = null;
    }
  };
}

// --- Auto-init for data-selection-menu attributes ---
function initDataSelectionMenus() {
  document.querySelectorAll('[data-selection-menu]').forEach(el => {
    const menuId = el.getAttribute('data-selection-menu');
    if (menuId) {
      const menu = document.getElementById(menuId);
      if (menu?.tagName === 'SELECTION-MENU') {
        // The menu component will pick this up via #collectTargets
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDataSelectionMenus);
} else {
  initDataSelectionMenus();
}

registerComponent('selection-menu', SelectionMenu);
