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
import { announce } from '../lib/announce.js';

const SELECTOR = '[data-highlights]';
const STORAGE_NS = 'highlights';
const DEFAULT_COLORS = ['yellow', 'green', 'blue', 'pink'];
const TOOLBAR_GAP = 8;
const TOOLBAR_EDGE_PADDING = 8;

const supportsHighlightAPI = typeof CSS !== 'undefined' && 'highlights' in CSS;

/** @type {WeakMap<Element, HighlightController>} live controller per element */
const controllers = new WeakMap();

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

// ---------- Colour names ----------
//
// Colour names come from data-highlights-colors and from stored records,
// and are written into generated CSS (::highlight rules, var() references).
// Only plain identifier characters are accepted, so neither source can
// inject CSS.

const COLOR_NAME = /^[a-z0-9_-]+$/i;

/** Underline styles that tell palette colours apart in forced-colors mode. */
const FORCED_DECORATION = ['solid', 'double', 'dotted', 'dashed', 'wavy'];

// ---------- Announcement / annotation strings ----------
//
// Overridable per article via data-highlights-label-* attributes
// (<highlight-wc data-label-*> forwards its own to the target).

const LABELS = {
  annotation: 'You highlighted',
  added: 'Highlight added',
  removed: 'Highlight removed',
  noteSaved: 'Note saved',
};

/**
 * @param {HTMLElement} el
 * @param {keyof typeof LABELS} key
 */
function label(el, key) {
  const attr = 'highlightsLabel' + key[0].toUpperCase() + key.slice(1);
  return el.dataset[attr] || LABELS[key];
}

// ---------- Record validation ----------
//
// Imported and stored records are untrusted: keep only well-formed ones
// whose offsets fall inside the article's text and whose colour is in
// the article's palette.

/**
 * @param {unknown} raw
 * @param {{ textLength: number, colors: string[] }} ctx
 * @returns {{ id: string, startOffset: number, endOffset: number, text: string, color: string, note: string, created: number } | null}
 */
function sanitizeRecord(raw, { textLength, colors }) {
  if (!raw || typeof raw !== 'object') return null;
  const r = /** @type {Record<string, unknown>} */ (raw);
  const { startOffset, endOffset, color } = r;
  if (!Number.isInteger(startOffset) || !Number.isInteger(endOffset)) return null;
  const start = /** @type {number} */ (startOffset);
  const end = /** @type {number} */ (endOffset);
  if (start < 0 || end <= start || end > textLength) return null;
  if (!isColorName(color) || !colors.includes(/** @type {string} */ (color))) return null;
  if (r.id != null && (typeof r.id !== 'string' || !/^[\w-]{1,64}$/.test(r.id))) return null;
  if (r.text != null && typeof r.text !== 'string') return null;
  if (r.note != null && typeof r.note !== 'string') return null;
  return {
    id: /** @type {string} */ (r.id) || newId(),
    startOffset: start,
    endOffset: end,
    text: /** @type {string} */ (r.text) ?? '',
    color: /** @type {string} */ (color),
    note: /** @type {string} */ (r.note) ?? '',
    created: Number.isFinite(r.created) ? /** @type {number} */ (r.created) : Date.now(),
  };
}

/** @param {unknown} name */
function isColorName(name) {
  return typeof name === 'string' && COLOR_NAME.test(name);
}

// ---------- Shared paint registry (Highlight API) ----------
//
// Every article shares one adopted stylesheet and one CSS.highlights
// registry, so both are built from ALL live articles, not the first:
//   - the stylesheet holds a ::highlight(hn-{name}) rule for every colour
//     any article's palette lists (refcounted per palette registration);
//   - each hn-{name} Highlight carries the ranges of every article that
//     paints that colour, so two articles using "yellow" both show.
// The --highlight-{name} property read by a ::highlight rule resolves against the
// highlighted text, so a palette defined on one article only applies there.

/** @type {CSSStyleSheet|null} */
let sharedSheet = null;
/** @type {Map<string, number>} colour name -> number of palettes listing it */
const paletteColors = new Map();
/** @type {Map<string, Map<object, Range[]>>} colour name -> controller -> ranges */
const rangesByColor = new Map();

function writeSharedSheet() {
  if (paletteColors.size === 0) {
    if (sharedSheet) {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(s => s !== sharedSheet);
      sharedSheet = null;
    }
    return;
  }
  if (!sharedSheet) {
    sharedSheet = new CSSStyleSheet();
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sharedSheet];
  }
  // ::highlight() only supports: background-color, color, text-decoration, text-shadow.
  // Text colour is set alongside the background (--highlight-{name}-ink,
  // falling back to the shared --highlight-ink) so contrast holds in both
  // colour schemes. In forced-colors mode the author background is replaced
  // by the system Mark/MarkText pair and each colour gets its own underline
  // style so palette entries stay distinguishable without hue.
  const names = [...paletteColors.keys()];
  const rules = names.map(c =>
    `::highlight(hn-${c}) { background-color: var(--highlight-${c}); color: var(--highlight-${c}-ink, var(--highlight-ink, CanvasText)); text-decoration-line: underline; text-decoration-color: var(--highlight-${c}); text-underline-offset: 2px; }`
  );
  const forced = names.map((c, i) =>
    `::highlight(hn-${c}) { background-color: Mark; color: MarkText; text-decoration-line: underline; text-decoration-color: MarkText; text-decoration-style: ${FORCED_DECORATION[i % FORCED_DECORATION.length]}; text-decoration-thickness: 2px; }`
  );
  sharedSheet.replaceSync(`${rules.join('\n')}\n@media (forced-colors: active) {\n${forced.join('\n')}\n}`);
}

/** @param {string[]} colors */
function registerPalette(colors) {
  for (const c of colors) paletteColors.set(c, (paletteColors.get(c) ?? 0) + 1);
  writeSharedSheet();
}

/** @param {string[]} colors */
function unregisterPalette(colors) {
  for (const c of colors) {
    const n = (paletteColors.get(c) ?? 0) - 1;
    if (n > 0) paletteColors.set(c, n);
    else paletteColors.delete(c);
  }
  writeSharedSheet();
}

/** Rebuild the hn-{color} Highlight from every article's ranges. */
function paintColor(color) {
  const owners = rangesByColor.get(color);
  const ranges = owners ? [...owners.values()].flat() : [];
  if (ranges.length === 0) {
    CSS.highlights.delete(`hn-${color}`);
    rangesByColor.delete(color);
  } else {
    CSS.highlights.set(`hn-${color}`, new Highlight(...ranges));
  }
}

/**
 * Replace one controller's ranges for every colour it paints or painted.
 * @param {object} owner
 * @param {Map<string, Range[]>} groups - colour -> ranges (empty map clears)
 */
function setOwnerRanges(owner, groups) {
  const touched = new Set(groups.keys());
  for (const [color, owners] of rangesByColor) {
    if (owners.has(owner)) touched.add(color);
  }
  for (const color of touched) {
    const ranges = groups.get(color) ?? [];
    let owners = rangesByColor.get(color);
    if (ranges.length) {
      if (!owners) rangesByColor.set(color, owners = new Map());
      owners.set(owner, ranges);
    } else {
      owners?.delete(owner);
    }
    paintColor(color);
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
// The shared body-level announcer (src/lib/announce.js).

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
  /** @type {Map<string, Range>} highlight id -> Range, rebuilt once per render */
  #ranges = new Map();

  constructor(element) {
    this.#element = element;
    this.#readonly = element.hasAttribute('data-highlights-readonly');

    // Storage key — VBStore namespace `highlights`, key = explicit suffix or pathname
    const keyVal = element.dataset.highlights;
    this.#storageKey = (keyVal && keyVal !== '') ? keyVal : location.pathname;

    // Colors
    const colorAttr = element.dataset.highlightsColors;
    const listed = colorAttr
      ? colorAttr.split(',').map(c => c.trim()).filter(isColorName)
      : [...DEFAULT_COLORS];
    this.#colors = [...new Set(listed)];

    // Add this palette's ::highlight rules to the shared stylesheet
    if (!this.#useFallback) {
      registerPalette(this.#colors);
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
  get destroyed() { return this.#destroyed; }
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
    announce(label(this.#element, 'removed'));
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

  /**
   * Replace the highlights with an exported set. Malformed records
   * (wrong shape, offsets outside the text, colour not in the palette)
   * are dropped; duplicate ids keep the first.
   * @param {string|object} json
   * @returns {{ imported: number, rejected: number }}
   */
  importHighlights(json) {
    let data;
    try {
      data = typeof json === 'string' ? JSON.parse(json) : json;
    } catch {
      return { imported: 0, rejected: 0 };
    }
    if (!data || !Array.isArray(data.highlights)) return { imported: 0, rejected: 0 };
    const clean = this.#sanitize(data.highlights);
    this.#highlights = clean;
    this.#save();
    this.#render();
    return { imported: clean.length, rejected: data.highlights.length - clean.length };
  }

  /** @param {unknown[]} list */
  #sanitize(list) {
    const ctx = { textLength: (this.#element.textContent ?? '').length, colors: this.#colors };
    const seen = new Set();
    const out = [];
    for (const raw of list) {
      const rec = sanitizeRecord(raw, ctx);
      if (!rec || seen.has(rec.id)) continue;
      seen.add(rec.id);
      out.push(rec);
    }
    return out;
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
      setOwnerRanges(this, new Map());
      unregisterPalette(this.#colors);
    } else {
      this.#element.querySelectorAll('mark[data-hn-id]').forEach(mark => {
        const parent = mark.parentNode;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      });
    }

    this.#clearMarginAnnotations();
    this.#ranges.clear();
    this.#element.removeAttribute('data-highlights-init');
    // Forget this controller so a later initHighlights() (e.g. after the
    // element is moved and re-set-up) builds a fresh, live one.
    if (controllers.get(this.#element) === this) controllers.delete(this.#element);
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
   * @param {string} id - Highlight id.
   * @returns {DOMRect|null} First client rect, or null if not found.
   */
  findHighlightRect(id) {
    const hl = this.#highlights.find(h => h.id === id);
    if (!hl) return null;
    const range = this.#rangeFor(hl);
    if (!range) return null;
    const rects = range.getClientRects();
    return rects.length ? rects[0] : null;
  }

  /** Cached Range for a highlight (built once per render), else a fresh walk. */
  #rangeFor(hl) {
    return this.#ranges.get(hl.id)
      ?? findRangeFromOffsets(this.#element, hl.startOffset, hl.endOffset);
  }

  /** Rebuild the id -> Range cache: one text walk per highlight per render, not per click. */
  #buildRanges() {
    this.#ranges.clear();
    for (const hl of this.#highlights) {
      const range = findRangeFromOffsets(this.#element, hl.startOffset, hl.endOffset);
      if (range) this.#ranges.set(hl.id, range);
    }
  }

  #findHighlightAtPoint(x, y) {
    for (const hl of this.#highlights) {
      const range = this.#ranges.get(hl.id);
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
    announce(label(this.#element, 'added'));
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
    announce(label(this.#element, 'noteSaved'));
  }

  // ---------- Persistence ----------

  async #load() {
    const data = /** @type {{ version?: number, contentHash?: string, highlights?: Array }|null} */ (
      await VBStore.get(STORAGE_NS, this.#storageKey)
    );
    if (!data || !Array.isArray(data.highlights)) return;
    if (this.#destroyed) return;

    const stored = this.#sanitize(data.highlights);
    const currentHash = fnv1a(this.#element.textContent);
    if (data.contentHash && data.contentHash !== currentHash) {
      this.#highlights = stored.filter(h => {
        const range = findRangeFromOffsets(this.#element, h.startOffset, h.endOffset);
        if (!range) return false;
        const currentText = range.toString().trim();
        return currentText === h.text;
      });
      this.#save();
    } else {
      this.#highlights = stored;
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
      this.#buildRanges();
    } else {
      this.#buildRanges();
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
      const range = this.#ranges.get(hl.id);
      if (!range) continue;
      if (!groups.has(hl.color)) continue;
      groups.get(hl.color).push(range);
    }

    setOwnerRanges(this, groups);
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

      const mark = document.createElement('mark');
      mark.dataset.hnId = hl.id;
      // Point the mark at the palette's custom property rather than a
      // resolved snapshot, so any colour name works and the value follows
      // the article's (or theme's) --highlight-{name} live.
      if (isColorName(hl.color)) {
        mark.dataset.hnColor = hl.color;
        mark.style.setProperty('--_hn-color', `var(--highlight-${hl.color})`);
        mark.style.setProperty('--_hn-ink', `var(--highlight-${hl.color}-ink, var(--highlight-ink))`);
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

    const elementRect = this.#element.getBoundingClientRect();
    const text = label(this.#element, 'annotation');

    for (const hl of this.#highlights) {
      const range = this.#ranges.get(hl.id);
      if (!range) continue;

      const rects = range.getClientRects();
      if (rects.length === 0) continue;

      const topInElement = rects[0].top - elementRect.top;

      // aria-hidden: the margin label is a visual echo of the highlight;
      // assistive tech gets the live-region announcement instead.
      const annot = document.createElement('span');
      annot.className = 'hn-margin-annotation';
      annot.dataset.hnId = hl.id;
      annot.setAttribute('aria-hidden', 'true');
      annot.style.insetBlockStart = `${topInElement}px`;

      if (hl.note) {
        const star = document.createElement('span');
        star.className = 'hn-note-indicator';
        star.textContent = '*';
        annot.append(star, ` ${text}`);
        annot.classList.add('hn-has-note');
      } else {
        annot.textContent = text;
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

/**
 * Idempotent: returns the element's live controller, or builds one.
 * A destroyed controller is never reused.
 * @param {Element} element
 * @returns {HighlightController}
 */
function initHighlights(element) {
  const existing = controllers.get(element);
  if (existing && !existing.destroyed) return existing;
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
