/**
 * highlights-init: Text highlighting & annotation for articles
 *
 * Enables Medium-style text selection highlighting with private notes,
 * persisted in localStorage. Uses the CSS Custom Highlight API for
 * non-destructive rendering, falling back to <mark> wrapping.
 *
 * @attr {string} data-highlights - Enables highlighting. Optional string
 *   value becomes the storage key suffix (default: location.pathname).
 * @attr {string} data-highlights-colors - Comma-separated color names
 *   (default: "yellow,green,blue,pink")
 * @attr {boolean} data-highlights-readonly - Render stored highlights
 *   but disable new ones
 *
 * @example
 * <article data-highlights>
 *   <h2>Article Title</h2>
 *   <p>Selectable content lives here...</p>
 * </article>
 *
 * @example Custom storage key
 * <article data-highlights="my-notes">
 *   <p>Uses vb-highlights:my-notes as storage key</p>
 * </article>
 */

import { VBStore } from '../lib/vb-store.js';

const SELECTOR = '[data-highlights]';
const STORAGE_NS = 'highlights';
const DEFAULT_COLORS = ['yellow', 'green', 'blue', 'pink'];
const TOOLBAR_GAP = 8;
const TOOLBAR_EDGE_PADDING = 8;

const supportsHighlightAPI = typeof CSS !== 'undefined' && 'highlights' in CSS;

// ---------- FNV-1a hash ----------

function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

// ---------- ID generation ----------

function newId() {
  return 'hn-' + crypto.randomUUID().slice(0, 8);
}

// ---------- Resolve computed color from element ----------

function resolveColor(element, colorName) {
  return getComputedStyle(element).getPropertyValue(`--highlight-${colorName}`).trim();
}

// ---------- Shared stylesheet (injected once) ----------

let sharedSheet = null;
let sharedSheetRefCount = 0;

function injectSharedSheet(colors) {
  if (sharedSheet) {
    sharedSheetRefCount++;
    return;
  }
  sharedSheet = new CSSStyleSheet();
  // ::highlight() only supports: background-color, color, text-decoration, text-shadow
  const rules = colors.map(c =>
    `::highlight(hn-${c}) { background-color: var(--highlight-${c}); text-decoration-line: underline; text-decoration-color: var(--highlight-${c}); text-underline-offset: 2px; }`
  ).join('\n');
  sharedSheet.replaceSync(rules);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sharedSheet];
  sharedSheetRefCount = 1;
}

function removeSharedSheet() {
  sharedSheetRefCount--;
  if (sharedSheetRefCount <= 0 && sharedSheet) {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(s => s !== sharedSheet);
    sharedSheet = null;
    sharedSheetRefCount = 0;
  }
}

// ---------- Toolbar / note-panel UI removed --------------------------
//
// The selection toolbar UI is owned by <selection-menu>; the note-panel UI
// is owned by <note-wc>; click-on-highlight handling is exposed as the
// `highlights:clicked` and `highlights:request-note` events for consumers.
// This file is the engine: data, persistence, range (de)serialization,
// and CSS Custom Highlight API rendering.

// ---------- Live region for screen readers ----------

let liveRegion = null;

function announce(message) {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'hn-sr-only';
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = '';
  requestAnimationFrame(() => { liveRegion.textContent = message; });
}

// ---------- TreeWalker utilities ----------

function getTextOffset(container, node, nodeOffset) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let offset = 0;

  while (walker.nextNode()) {
    if (walker.currentNode === node) {
      return offset + nodeOffset;
    }
    offset += (walker.currentNode.textContent ?? '').length;
  }
  return -1;
}

function findRangeFromOffsets(container, startOffset, endOffset) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let accumulated = 0;
  let startNode = null;
  let startNodeOffset = 0;
  let endNode = null;
  let endNodeOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeLen = (node.textContent ?? '').length;

    if (!startNode && accumulated + nodeLen > startOffset) {
      startNode = node;
      startNodeOffset = startOffset - accumulated;
    }

    if (accumulated + nodeLen >= endOffset) {
      endNode = node;
      endNodeOffset = endOffset - accumulated;
      break;
    }

    accumulated += nodeLen;
  }

  if (!startNode || !endNode) return null;

  try {
    const range = document.createRange();
    range.setStart(startNode, Math.min(startNodeOffset, (startNode.textContent ?? '').length));
    range.setEnd(endNode, Math.min(endNodeOffset, (endNode.textContent ?? '').length));
    return range;
  } catch {
    return null;
  }
}

// ---------- HighlightController ----------

class HighlightController {
  #element;
  #storageKey;
  #colors;
  #readonly;
  #highlights = [];
  #useFallback = !supportsHighlightAPI;
  #handlePointerUp;
  #handleClick;
  #destroyed = false;
  #marginAnnotations = [];

  constructor(element) {
    this.#element = element;
    this.#readonly = element.hasAttribute('data-highlights-readonly');

    // Storage key — VBStore namespace `highlights`, key = explicit suffix or pathname
    const keyVal = element.dataset.highlights;
    this.#storageKey = (keyVal && keyVal !== '') ? keyVal : location.pathname;

    // Colors
    const colorAttr = element.dataset.highlightsColors;
    this.#colors = colorAttr
      ? colorAttr.split(',').map(c => c.trim()).filter(Boolean)
      : [...DEFAULT_COLORS];

    // Inject shared stylesheet if using Highlight API
    if (!this.#useFallback) {
      injectSharedSheet(this.#colors);
    }

    // Initial render with empty highlights, then async-load and re-render.
    this.#render();

    // Set up interaction unless readonly
    if (!this.#readonly) {
      this.#handlePointerUp = this.#onPointerUp.bind(this);
      this.#handleClick = this.#onClick.bind(this);
      element.addEventListener('pointerup', this.#handlePointerUp);
      element.addEventListener('click', this.#handleClick);
    }

    // Mark as initialized
    element.setAttribute('data-highlights-init', '');

    // Kick off async load — render again once persisted highlights arrive.
    this.#load().then(() => {
      if (!this.#destroyed) this.#render();
    });
  }

  get colors() { return [...this.#colors]; }
  get element() { return this.#element; }

  // ---------- Public API ----------

  getHighlights() {
    return this.#highlights.map(h => ({ ...h }));
  }

  removeHighlight(id) {
    const idx = this.#highlights.findIndex(h => h.id === id);
    if (idx < 0) return;

    this.#highlights.splice(idx, 1);
    this.#save();
    this.#render();

    this.#emit('highlights:removed', { id });
    announce('Highlight removed');
  }

  clearAll() {
    this.#highlights = [];
    this.#save();
    this.#render();
  }

  exportHighlights() {
    return JSON.stringify({
      version: 1,
      highlights: this.#highlights,
    });
  }

  importHighlights(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      if (!data.highlights || !Array.isArray(data.highlights)) return;
      this.#highlights = data.highlights;
      this.#save();
      this.#render();
    } catch { /* invalid JSON */ }
  }

  destroy() {
    if (this.#destroyed) return;
    this.#destroyed = true;

    if (this.#handlePointerUp) {
      this.#element.removeEventListener('pointerup', this.#handlePointerUp);
    }
    if (this.#handleClick) {
      this.#element.removeEventListener('click', this.#handleClick);
    }

    // Clear CSS highlights
    if (!this.#useFallback) {
      for (const color of this.#colors) {
        CSS.highlights.delete(`hn-${color}`);
      }
      removeSharedSheet();
    } else {
      this.#element.querySelectorAll('mark[data-hn-id]').forEach(mark => {
        const parent = mark.parentNode;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      });
    }

    this.#clearMarginAnnotations();
    this.#element.removeAttribute('data-highlights-init');
  }

  // ---------- Selection / click handling ----------
  //
  // The engine no longer renders any UI on selection. <selection-menu>
  // owns selection toolbars and uses controller._createFromSelection()
  // to commit highlights. The pointer-up listener stays only to emit a
  // `highlights:selected` event so consumers without selection-menu can
  // wire their own UI.

  #onPointerUp() {
    requestAnimationFrame(() => {
      if (this.#destroyed) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

      const range = sel.getRangeAt(0);
      if (!this.#element.contains(range.commonAncestorContainer)) return;

      this.#emit('highlights:selected', {
        text: sel.toString().trim(),
        rect: range.getBoundingClientRect(),
      });
    });
  }

  #onClick(e) {
    // Margin annotation click → request a note (note-wc handles the panel)
    const annot = e.target.closest?.('.hn-margin-annotation');
    if (annot) {
      const id = annot.dataset.hnId;
      const hl = this.#highlights.find(h => h.id === id);
      if (hl) {
        this.#emit('highlights:clicked', { id, highlight: { ...hl } });
        this.#emit('highlights:request-note', { id, highlight: { ...hl }, controller: this });
        return;
      }
    }

    // <mark> fallback click → emit clicked event for consumers
    const mark = e.target.closest?.('mark[data-hn-id]');
    if (mark) {
      const id = mark.dataset.hnId;
      const hl = this.#highlights.find(h => h.id === id);
      if (hl) {
        this.#emit('highlights:clicked', { id, highlight: { ...hl } });
        return;
      }
    }

    // Highlight API hit-test → emit clicked event for consumers
    if (!this.#useFallback) {
      const clickedHighlight = this.#findHighlightAtPoint(e.clientX, e.clientY);
      if (clickedHighlight) {
        this.#emit('highlights:clicked', {
          id: clickedHighlight.id,
          highlight: { ...clickedHighlight },
        });
      }
    }
  }

  /**
   * Resolve the first viewport rect for a highlight by id. Used by
   * <note-wc> to align its panel with the highlighted text.
   */
  findHighlightRect(id) {
    const hl = this.#highlights.find(h => h.id === id);
    if (!hl) return null;
    const range = findRangeFromOffsets(this.#element, hl.startOffset, hl.endOffset);
    if (!range) return null;
    const rects = range.getClientRects();
    return rects.length ? rects[0] : null;
  }

  #findHighlightAtPoint(x, y) {
    for (const hl of this.#highlights) {
      const range = findRangeFromOffsets(this.#element, hl.startOffset, hl.endOffset);
      if (!range) continue;

      const rects = range.getClientRects();
      for (const rect of rects) {
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return hl;
        }
      }
    }
    return null;
  }

  // ---------- Internal mutation methods (called by toolbar) ----------

  _createFromSelection(color) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    if (!this.#element.contains(range.commonAncestorContainer)) return;

    const startOffset = getTextOffset(
      this.#element, range.startContainer, range.startOffset
    );
    const endOffset = getTextOffset(
      this.#element, range.endContainer, range.endOffset
    );

    if (startOffset < 0 || endOffset < 0 || startOffset >= endOffset) return;

    const text = sel.toString().trim();
    const highlight = {
      id: newId(),
      startOffset,
      endOffset,
      text,
      color,
      note: '',
      created: Date.now(),
    };

    this.#highlights.push(highlight);
    this.#save();
    this.#render();
    sel.removeAllRanges();

    this.#emit('highlights:added', {
      id: highlight.id, text, color, note: '',
    });
    announce('Highlight added');
  }

  _changeColor(id, color) {
    const hl = this.#highlights.find(h => h.id === id);
    if (!hl) return;
    hl.color = color;
    this.#save();
    this.#render();
  }

  _updateNote(id, note) {
    const hl = this.#highlights.find(h => h.id === id);
    if (!hl) return;
    hl.note = note;
    this.#save();
    this.#renderMarginAnnotations();

    this.#emit('highlights:note-changed', { id, note });
    announce('Note saved');
  }

  // ---------- Persistence ----------

  async #load() {
    const data = /** @type {{ version?: number, contentHash?: string, highlights?: Array }|null} */ (
      await VBStore.get(STORAGE_NS, this.#storageKey)
    );
    if (!data || !Array.isArray(data.highlights)) return;

    const currentHash = fnv1a(this.#element.textContent);
    if (data.contentHash && data.contentHash !== currentHash) {
      this.#highlights = data.highlights.filter(h => {
        const range = findRangeFromOffsets(this.#element, h.startOffset, h.endOffset);
        if (!range) return false;
        const currentText = range.toString().trim();
        return currentText === h.text;
      });
      this.#save();
    } else {
      this.#highlights = data.highlights;
    }
  }

  #save() {
    const envelope = {
      version: 1,
      contentHash: fnv1a(this.#element.textContent),
      highlights: this.#highlights,
    };
    VBStore.set(STORAGE_NS, this.#storageKey, envelope).catch(() => { /* ignore */ });
  }

  // ---------- Rendering ----------

  #render() {
    if (this.#useFallback) {
      this.#renderMarks();
    } else {
      this.#renderHighlightAPI();
    }
    this.#renderMarginAnnotations();
  }

  #renderHighlightAPI() {
    const groups = new Map();
    for (const color of this.#colors) {
      groups.set(color, []);
    }

    for (const hl of this.#highlights) {
      const range = findRangeFromOffsets(this.#element, hl.startOffset, hl.endOffset);
      if (!range) continue;
      if (!groups.has(hl.color)) continue;
      groups.get(hl.color).push(range);
    }

    for (const [color, ranges] of groups) {
      const name = `hn-${color}`;
      if (ranges.length === 0) {
        CSS.highlights.delete(name);
      } else {
        CSS.highlights.set(name, new Highlight(...ranges));
      }
    }
  }

  #renderMarks() {
    this.#element.querySelectorAll('mark[data-hn-id]').forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });
    this.#element.normalize();

    const sorted = [...this.#highlights].sort((a, b) => b.startOffset - a.startOffset);
    for (const hl of sorted) {
      const range = findRangeFromOffsets(this.#element, hl.startOffset, hl.endOffset);
      if (!range) continue;

      const resolved = resolveColor(this.#element, hl.color);
      const mark = document.createElement('mark');
      mark.dataset.hnId = hl.id;
      mark.dataset.hnColor = hl.color;
      if (resolved) {
        mark.style.backgroundColor = resolved;
        mark.style.textDecorationColor = resolved;
      }

      try {
        range.surroundContents(mark);
      } catch {
        const fragment = range.extractContents();
        mark.appendChild(fragment);
        range.insertNode(mark);
      }
    }
  }

  // ---------- Margin annotations (Medium-style) ----------

  #clearMarginAnnotations() {
    for (const el of this.#marginAnnotations) {
      el.remove();
    }
    this.#marginAnnotations = [];
  }

  #renderMarginAnnotations() {
    this.#clearMarginAnnotations();

    if (this.#highlights.length === 0) return;

    // Ensure article is a positioning context
    const computed = getComputedStyle(this.#element);
    if (computed.position === 'static') {
      this.#element.style.position = 'relative';
    }

    for (const hl of this.#highlights) {
      const range = findRangeFromOffsets(this.#element, hl.startOffset, hl.endOffset);
      if (!range) continue;

      const rects = range.getClientRects();
      if (rects.length === 0) continue;

      const firstRect = rects[0];
      const elementRect = this.#element.getBoundingClientRect();
      const topInElement = firstRect.top - elementRect.top;

      const annot = document.createElement('span');
      annot.className = 'hn-margin-annotation';
      annot.dataset.hnId = hl.id;
      annot.setAttribute('aria-hidden', 'true');
      annot.style.top = `${topInElement}px`;

      if (hl.note) {
        annot.innerHTML = '<span class="hn-note-indicator">*</span> You highlighted';
        annot.classList.add('hn-has-note');
      } else {
        annot.textContent = 'You highlighted';
      }

      this.#element.appendChild(annot);
      this.#marginAnnotations.push(annot);
    }
  }

  // ---------- Events ----------

  #emit(name, detail = {}) {
    this.#element.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
  }
}

// ---------- Auto-init ----------

const controllers = new WeakMap();

function initHighlights(element) {
  if (controllers.has(element)) return controllers.get(element);
  const ctrl = new HighlightController(element);
  controllers.set(element, ctrl);
  return ctrl;
}

function initAll(root = document) {
  root.querySelectorAll(SELECTOR).forEach(el => {
    if (!el.hasAttribute('data-highlights-init')) {
      initHighlights(el);
    }
  });
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAll());
} else {
  initAll();
}

// Watch for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const addedEl = /** @type {Element} */ (node);
      if (addedEl.matches(SELECTOR)) initHighlights(addedEl);
      addedEl.querySelectorAll(SELECTOR).forEach(el => {
        if (!el.hasAttribute('data-highlights-init')) initHighlights(el);
      });
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initHighlights, HighlightController, fnv1a, findRangeFromOffsets };
