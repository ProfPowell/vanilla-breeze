/**
 * selection-menu — Floating toolbar on text selection
 *
 * Composes <pop-over data-mode="manual"> for the toolbar surface so the
 * toolbar sits in the top layer (no z-index battles), inherits pop-over's
 * display:none cascade re-assertion (popover_display_gotcha), and keeps
 * a consistent popover lifecycle with the rest of VB's popover family.
 * setup() moves the authored children into that generated pop-over; the
 * pop-over carries role="toolbar" and is the node to style.
 *
 * Positioning is bespoke — the toolbar anchors to a text Range, not a
 * DOM element — so selection-menu sets the pop-over's inline top/left
 * after each show and again on scroll/resize (from the stored range).
 * Light-dismiss is handled by the host (pointerdown on document + Escape),
 * since manual popovers don't dismiss themselves and we don't want pointer
 * events during selection to close the menu.
 *
 * Opening: pointer selections open on pointerup; keyboard selections
 * (Shift+Arrows, caret browsing) open on Shift keyup and on a debounced
 * selectionchange. Alt+F10 moves focus into the toolbar (opening it first
 * when the selection is in a target). Arrow keys / Home / End rove between
 * actions; Escape closes it and returns focus and the selection to the text.
 *
 * @attr {string} for        - ID of a single target element
 * @attr {string} id         - When set, elements with data-selection-menu="id" become targets
 * @attr {string} data-label - Accessible name of the toolbar (default "Text selection actions")
 *
 * @fires selection-menu:select          - detail { range, text, target }
 * @fires selection-menu:dismiss         - toolbar hidden
 * @fires selection-menu:actions-changed - detail { actions, source }
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
// Ensure <pop-over> is registered — selection-menu composes it for the toolbar.
import '../pop-over/logic.js';

const TOOLBAR_GAP = 8;
const EDGE_PAD = 8;
const SELECTION_DEBOUNCE = 300;
const DEFAULT_LABEL = 'Text selection actions';
const FOCUS_KEY = 'F10';
const ITEM_SELECTOR = 'button:not([disabled]), a[href], [role="button"]:not([aria-disabled="true"])';
/* Controls inside these belong to a nested widget (e.g. highlight-wc's
   colour palette group) and keep their own keyboard model. */
const NESTED_WIDGET = '[role="group"], [role="menu"], [role="listbox"], [role="radiogroup"], dialog, [popover]:not([data-selection-menu-host])';

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
  /** @type {MutationObserver | null} */
  #observer = null;
  /** Target this instance wrote data-selection-menu onto (for=), removed in teardown. */
  /** @type {Element | null} */
  #markedTarget = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #selectionTimer = null;
  /** @type {number} */
  #frame = 0;
  #pointerDown = false;
  /** @type {string} */
  #pointerType = 'mouse';
  /** @type {'pointer' | 'keyboard'} */
  #lastInput = 'pointer';
  /** Set on hide so a surviving / restored selection doesn't reopen the toolbar; cleared by the next key or pointer press. */
  #suppressSelection = false;
  /** Items whose tabindex the roving model manages. @type {Set<HTMLElement>} */
  #roving = new Set();

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

    this.#popover.setAttribute('role', 'toolbar');
    this.#popover.setAttribute('aria-orientation', 'horizontal');
    this.#popover.setAttribute('aria-label', this.dataset.label || DEFAULT_LABEL);
    this.#popover.setAttribute('aria-keyshortcuts', `Alt+${FOCUS_KEY}`);

    // The host coordinates; the pop-over is the visible toolbar.
    this.hidden = false;

    this.#collectTargets();

    this.listen(document, 'pointerup', this.#onPointerUp);
    this.listen(document, 'pointerdown', this.#onDocumentPointerDown);
    this.listen(document, 'keydown', this.#onKeyDown);
    this.listen(document, 'keyup', this.#onKeyUp);
    this.listen(document, 'selectionchange', this.#onSelectionChange);
    this.listen(window, 'scroll', this.#onViewportChange, { capture: true, passive: true });
    this.listen(window, 'resize', this.#onViewportChange);
    this.listen(this.#popover, 'keydown', this.#onToolbarKeyDown);

    if (this.id) {
      this.#observer = new MutationObserver(() => this.#collectTargets());
      this.#observer.observe(document.body, {
        childList: true, subtree: true,
        attributeFilter: ['data-selection-menu'],
      });
    }
  }

  teardown() {
    this.#observer?.disconnect();
    this.#observer = null;
    if (this.#selectionTimer) clearTimeout(this.#selectionTimer);
    this.#selectionTimer = null;
    cancelAnimationFrame(this.#frame);
    if (this.#markedTarget?.getAttribute('data-selection-menu') === this.id) {
      this.#markedTarget.removeAttribute('data-selection-menu');
    }
    this.#markedTarget = null;
    for (const el of this.#roving) el.removeAttribute('tabindex');
    this.#roving.clear();
    this.#visible = false;
    this.#selection = null;
    this.#pointerDown = false;
  }

  // --- Public API ---

  /** @returns {{ range: Range, text: string, target: Element } | null} */
  getSelection() {
    return this.#selection ? { ...this.#selection } : null;
  }

  /** Hide the toolbar. Focus inside it returns to the selection's target. */
  dismiss() {
    if (!this.#visible) return;
    this.#hide({ restoreFocus: true });
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
    this.#roving.clear();
    for (const a of next) {
      if (a instanceof Element) {
        container.appendChild(a);
        continue;
      }
      if (!a?.tag) continue;
      const el = document.createElement(a.tag);
      if (a.attrs) {
        for (const [name, val] of Object.entries(/** @type {Record<string, any>} */ (a.attrs))) {
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
        // Only advertise the link when there is an id to point at.
        if (this.id && !el.hasAttribute('data-selection-menu')) {
          el.setAttribute('data-selection-menu', this.id);
          this.#markedTarget = el;
        }
      }
    }

    if (this.id) {
      document.querySelectorAll(`[data-selection-menu="${CSS.escape(this.id)}"]`).forEach(el => {
        this.#targets.add(el);
      });
    }
  }

  // --- Selection detection ---

  #onPointerUp = (/** @type {PointerEvent} */ e) => {
    this.#pointerDown = false;
    this.#pointerType = e.pointerType || 'mouse';
    requestAnimationFrame(() => {
      if (!this.isConnected) return;
      this.#checkSelection();
    });
  };

  #onKeyUp = (/** @type {KeyboardEvent} */ e) => {
    // Shift+Arrow / Shift+Home etc. finish a keyboard selection.
    if (!e.shiftKey && e.key !== 'Shift') return;
    if (this.#popover?.contains(document.activeElement)) return;
    this.#pointerType = 'keyboard';
    this.#checkSelection();
  };

  #onSelectionChange = () => {
    // Pointer drags open on pointerup; don't flash the toolbar mid-drag.
    if (this.#pointerDown || this.#suppressSelection) return;
    if (this.#selectionTimer) clearTimeout(this.#selectionTimer);
    this.#selectionTimer = setTimeout(() => {
      this.#selectionTimer = null;
      if (!this.isConnected || this.#pointerDown || this.#suppressSelection) return;
      if (this.#popover?.contains(document.activeElement)) return;
      const sel = window.getSelection();
      const empty = !sel || sel.isCollapsed || !sel.toString().trim();
      if (empty) {
        // Collapsing the selection from the keyboard closes the toolbar.
        if (this.#visible && this.#lastInput === 'keyboard') this.#hide({ restoreFocus: false });
        return;
      }
      if (this.#lastInput === 'keyboard') this.#pointerType = 'keyboard';
      this.#checkSelection();
    }, SELECTION_DEBOUNCE);
  };

  #checkSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || !sel.toString().trim()) return false;

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
    if (!target) return false;

    const text = sel.toString().trim();
    const prev = this.#selection;
    const same = this.#visible && prev && prev.target === target && prev.text === text
      && prev.range.compareBoundaryPoints(Range.START_TO_START, range) === 0
      && prev.range.compareBoundaryPoints(Range.END_TO_END, range) === 0;

    this.#selection = { range: range.cloneRange(), text, target };

    if (!same) {
      this.dispatchEvent(new CustomEvent('selection-menu:select', {
        detail: { range: this.#selection.range, text, target },
        bubbles: true,
      }));
    }

    this.#show();
    return true;
  }

  // --- Show / hide ---

  #show() {
    if (!this.#popover) return;
    /** @type {any} */ (this.#popover).show();
    this.#visible = true;
    this.#syncRoving();
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#position());
  }

  #position() {
    if (!this.#visible || !this.#selection || !this.#popover) return;
    const anchorRect = this.#selection.range.getBoundingClientRect();

    // Range scrolled out of view (or detached): hide rather than float
    // over unrelated content.
    const offscreen = anchorRect.bottom < 0 || anchorRect.top > window.innerHeight
      || (anchorRect.width === 0 && anchorRect.height === 0);
    if (offscreen) {
      this.#hide({ restoreFocus: true });
      return;
    }

    const rect = this.#popover.getBoundingClientRect();
    const pw = rect.width || 200;
    const ph = rect.height || 40;

    const above = anchorRect.top - ph - TOOLBAR_GAP;
    const below = anchorRect.bottom + TOOLBAR_GAP;
    let top;
    if (this.#pointerType === 'touch') {
      // The OS selection callout sits above a touch selection; go below.
      top = below + ph + EDGE_PAD <= window.innerHeight ? below : above;
    } else {
      top = above < EDGE_PAD ? below : above;
    }

    let left = anchorRect.left + (anchorRect.width / 2) - (pw / 2);
    const maxLeft = window.innerWidth - pw - EDGE_PAD;
    left = Math.max(EDGE_PAD, Math.min(left, maxLeft));

    this.#popover.style.top = `${top}px`;
    this.#popover.style.left = `${left}px`;
  }

  #onViewportChange = () => {
    if (!this.#visible) return;
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#position());
  };

  /**
   * @param {{ restoreFocus?: boolean, restoreRange?: boolean }} [opts]
   */
  #hide({ restoreFocus = false, restoreRange = false } = {}) {
    const sel = this.#selection;
    const focusInside = !!this.#popover?.contains(document.activeElement);
    if (this.#popover) /** @type {any} */ (this.#popover).hide();
    this.#visible = false;
    this.#selection = null;
    cancelAnimationFrame(this.#frame);
    // The selection usually survives a dismiss (and focus/range restore
    // can fire selectionchange): don't reopen until the user acts again.
    this.#suppressSelection = true;
    this.dispatchEvent(new CustomEvent('selection-menu:dismiss', { bubbles: true }));

    if (restoreFocus && focusInside && sel?.target?.isConnected) {
      const target = /** @type {HTMLElement} */ (sel.target);
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => {
          if (target.getAttribute('tabindex') === '-1') target.removeAttribute('tabindex');
        }, { once: true });
      }
      target.focus({ preventScroll: true });
      if (restoreRange) {
        const live = window.getSelection();
        if (live) {
          live.removeAllRanges();
          live.addRange(sel.range);
        }
      }
    }
  }

  #onDocumentPointerDown = (/** @type {PointerEvent} */ e) => {
    this.#pointerDown = true;
    this.#lastInput = 'pointer';
    this.#suppressSelection = false;
    if (!this.#visible) return;
    const t = /** @type {Node} */ (e.target);
    if (this.#popover?.contains(t)) return;
    if (this.contains(t)) return;
    this.#hide();
  };

  #onKeyDown = (/** @type {KeyboardEvent} */ e) => {
    if (!['Shift', 'Alt', 'Control', 'Meta'].includes(e.key)) this.#suppressSelection = false;
    this.#lastInput = 'keyboard';
    if (e.defaultPrevented) return;

    if (e.key === 'Escape' && this.#visible) {
      e.preventDefault();
      this.#hide({ restoreFocus: true, restoreRange: true });
      return;
    }

    if (e.key === FOCUS_KEY && e.altKey && !e.ctrlKey && !e.metaKey) {
      if (!this.#visible) {
        this.#pointerType = 'keyboard';
        if (!this.#checkSelection()) return;
      }
      e.preventDefault();
      this.#focusItem(0);
    }
  };

  // --- Toolbar keyboard model (roving tabindex) ---

  /** @returns {HTMLElement[]} */
  #items() {
    if (!this.#popover) return [];
    return /** @type {HTMLElement[]} */ ([...this.#popover.querySelectorAll(ITEM_SELECTOR)])
      .filter(el => {
        const widget = el.closest(NESTED_WIDGET);
        if (widget && this.#popover.contains(widget)) return false;
        const hidden = el.closest('[hidden]');
        return !(hidden && this.#popover.contains(hidden));
      });
  }

  #syncRoving() {
    const items = this.#items();
    const active = items.find(el => el === document.activeElement)
      ?? items.find(el => el.getAttribute('tabindex') === '0')
      ?? items[0];
    for (const el of items) {
      el.setAttribute('tabindex', el === active ? '0' : '-1');
      this.#roving.add(el);
    }
  }

  /** @param {number} index */
  #focusItem(index) {
    this.#syncRoving();
    const items = this.#items();
    if (!items.length) return;
    const i = ((index % items.length) + items.length) % items.length;
    for (const el of items) el.setAttribute('tabindex', el === items[i] ? '0' : '-1');
    items[i].focus();
  }

  #onToolbarKeyDown = (/** @type {KeyboardEvent} */ e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (t.matches('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    const items = this.#items();
    const current = items.indexOf(t);
    if (current === -1) return;
    const rtl = getComputedStyle(this.#popover).direction === 'rtl';
    const next = rtl ? 'ArrowLeft' : 'ArrowRight';
    const prev = rtl ? 'ArrowRight' : 'ArrowLeft';
    let index = -1;
    if (e.key === next) index = current + 1;
    else if (e.key === prev) index = current - 1;
    else if (e.key === 'Home') index = 0;
    else if (e.key === 'End') index = items.length - 1;
    else return;
    e.preventDefault();
    this.#focusItem(index);
  };
}

registerComponent('selection-menu', SelectionMenu);
