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

const SELECTOR = '[data-highlights]';
const STORAGE_PREFIX = 'vb-highlights:';
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

// ---------- Shared stylesheet (injected once) ----------

let sharedSheet = null;
let sharedSheetRefCount = 0;

function injectSharedSheet(colors) {
  if (sharedSheet) {
    sharedSheetRefCount++;
    return;
  }
  sharedSheet = new CSSStyleSheet();
  const rules = colors.map(c =>
    `::highlight(hn-${c}) { background: var(--highlight-${c}); text-decoration: underline; text-decoration-color: var(--highlight-${c}); text-underline-offset: 2px; }`
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

// ---------- Toolbar DOM ----------

let toolbar = null;
let toolbarOwner = null;

function getOrCreateToolbar() {
  if (toolbar) return toolbar;

  toolbar = document.createElement('div');
  toolbar.className = 'hn-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Highlight tools');
  toolbar.setAttribute('popover', 'auto');
  toolbar.hidden = true;

  document.body.appendChild(toolbar);

  toolbar.addEventListener('toggle', (e) => {
    if (e.newState === 'closed') {
      toolbar.hidden = true;
      toolbarOwner = null;
    }
  });

  return toolbar;
}

function showToolbar(rect, controller, existingHighlight) {
  const tb = getOrCreateToolbar();
  tb.innerHTML = '';
  toolbarOwner = controller;

  const colors = controller.colors;
  const activeColor = existingHighlight?.color;

  // Color swatches
  const swatchGroup = document.createElement('div');
  swatchGroup.className = 'hn-swatches';
  swatchGroup.setAttribute('role', 'group');
  swatchGroup.setAttribute('aria-label', 'Highlight colors');

  colors.forEach((color, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hn-swatch';
    btn.dataset.color = color;
    btn.setAttribute('aria-label', `Highlight ${color}${activeColor === color ? ' (current)' : ''}`);
    btn.setAttribute('tabindex', i === 0 ? '0' : '-1');
    btn.style.setProperty('--swatch-color', `var(--highlight-${color})`);
    if (activeColor === color) btn.setAttribute('aria-pressed', 'true');

    btn.addEventListener('click', () => {
      if (existingHighlight) {
        controller._changeColor(existingHighlight.id, color);
      } else {
        controller._createFromSelection(color);
      }
      hideToolbar();
    });
    swatchGroup.appendChild(btn);
  });

  tb.appendChild(swatchGroup);

  // Existing highlight actions
  if (existingHighlight) {
    const noteBtn = document.createElement('button');
    noteBtn.type = 'button';
    noteBtn.className = 'hn-action';
    noteBtn.textContent = existingHighlight.note ? 'Edit Note' : 'Add Note';
    noteBtn.addEventListener('click', () => {
      showNoteEditor(rect, controller, existingHighlight);
    });
    tb.appendChild(noteBtn);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'hn-action hn-action-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      controller.removeHighlight(existingHighlight.id);
      hideToolbar();
    });
    tb.appendChild(removeBtn);
  }

  // Keyboard navigation for swatches
  swatchGroup.addEventListener('keydown', (e) => {
    const btns = [...swatchGroup.querySelectorAll('button')];
    const idx = btns.indexOf(document.activeElement);
    if (idx < 0) return;

    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = (idx + 1) % btns.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = (idx - 1 + btns.length) % btns.length;
    } else if (e.key === 'Escape') {
      hideToolbar();
      return;
    }
    if (next >= 0) {
      btns[idx].setAttribute('tabindex', '-1');
      btns[next].setAttribute('tabindex', '0');
      btns[next].focus();
    }
  });

  // Position and show
  tb.hidden = false;
  try { tb.showPopover(); } catch { /* already open */ }

  positionToolbar(rect);

  // Focus first swatch
  requestAnimationFrame(() => {
    const first = tb.querySelector('.hn-swatch');
    if (first) first.focus();
  });
}

function showNoteEditor(rect, controller, highlight) {
  const tb = getOrCreateToolbar();
  tb.innerHTML = '';

  const editor = document.createElement('div');
  editor.className = 'hn-note-editor';

  const textarea = document.createElement('textarea');
  textarea.className = 'hn-note-textarea';
  textarea.placeholder = 'Add a note\u2026';
  textarea.value = highlight.note || '';
  textarea.rows = 3;
  textarea.setAttribute('aria-label', 'Note for highlighted text');

  const actions = document.createElement('div');
  actions.className = 'hn-note-actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'hn-action';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => {
    controller._updateNote(highlight.id, textarea.value.trim());
    hideToolbar();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'hn-action';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => hideToolbar());

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      hideToolbar();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      controller._updateNote(highlight.id, textarea.value.trim());
      hideToolbar();
    }
  });

  actions.append(saveBtn, cancelBtn);
  editor.append(textarea, actions);
  tb.appendChild(editor);

  positionToolbar(rect);
  requestAnimationFrame(() => textarea.focus());
}

function positionToolbar(anchorRect) {
  if (!toolbar) return;
  const tbRect = toolbar.getBoundingClientRect();
  const tbW = tbRect.width || 200;
  const tbH = tbRect.height || 40;

  // Center above selection
  let top = anchorRect.top - tbH - TOOLBAR_GAP + window.scrollY;
  let left = anchorRect.left + (anchorRect.width / 2) - (tbW / 2) + window.scrollX;

  // Flip below if too close to top
  if (anchorRect.top - tbH - TOOLBAR_GAP < 0) {
    top = anchorRect.bottom + TOOLBAR_GAP + window.scrollY;
  }

  // Clamp horizontal
  const maxLeft = window.innerWidth - tbW - TOOLBAR_EDGE_PADDING + window.scrollX;
  left = Math.max(TOOLBAR_EDGE_PADDING + window.scrollX, Math.min(left, maxLeft));

  toolbar.style.top = `${top}px`;
  toolbar.style.left = `${left}px`;
}

function hideToolbar() {
  if (!toolbar) return;
  try { toolbar.hidePopover(); } catch { /* already closed */ }
  toolbar.hidden = true;
  toolbarOwner = null;
}

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

/**
 * Build a flat text map of an element: character offsets mapped to text nodes.
 * Skips whitespace-only nodes but preserves them in offset counting
 * via textContent (which includes all descendant text).
 */
function getTextOffset(container, node, nodeOffset) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let offset = 0;

  while (walker.nextNode()) {
    if (walker.currentNode === node) {
      return offset + nodeOffset;
    }
    offset += walker.currentNode.textContent.length;
  }
  return -1;
}

/**
 * Find a Range from character offsets within a container.
 * Walks text nodes to locate start and end positions.
 */
function findRangeFromOffsets(container, startOffset, endOffset) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let accumulated = 0;
  let startNode = null;
  let startNodeOffset = 0;
  let endNode = null;
  let endNodeOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeLen = node.textContent.length;

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
    range.setStart(startNode, Math.min(startNodeOffset, startNode.textContent.length));
    range.setEnd(endNode, Math.min(endNodeOffset, endNode.textContent.length));
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
  #cssHighlights = new Map(); // color → Highlight
  #useFallback = !supportsHighlightAPI;
  #handlePointerUp;
  #handleClick;
  #destroyed = false;

  constructor(element) {
    this.#element = element;
    this.#readonly = element.hasAttribute('data-highlights-readonly');

    // Storage key
    const keyVal = element.dataset.highlights;
    const suffix = (keyVal && keyVal !== '') ? keyVal : location.pathname;
    this.#storageKey = STORAGE_PREFIX + suffix;

    // Colors
    const colorAttr = element.dataset.highlightsColors;
    this.#colors = colorAttr
      ? colorAttr.split(',').map(c => c.trim()).filter(Boolean)
      : [...DEFAULT_COLORS];

    // Inject shared stylesheet if using Highlight API
    if (!this.#useFallback) {
      injectSharedSheet(this.#colors);
    }

    // Load persisted highlights
    this.#load();
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
  }

  get colors() { return [...this.#colors]; }

  // ---------- Public API ----------

  getHighlights() {
    return this.#highlights.map(h => ({ ...h }));
  }

  removeHighlight(id) {
    const idx = this.#highlights.findIndex(h => h.id === id);
    if (idx < 0) return;

    const removed = this.#highlights.splice(idx, 1)[0];
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
      // Remove mark elements
      this.#element.querySelectorAll('mark[data-hn-id]').forEach(mark => {
        const parent = mark.parentNode;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      });
    }

    this.#element.removeAttribute('data-highlights-init');
    if (toolbarOwner === this) hideToolbar();
  }

  // ---------- Selection handling ----------

  #onPointerUp(e) {
    // Delay to let selection finalize
    requestAnimationFrame(() => {
      if (this.#destroyed) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

      // Ensure selection is within our element
      const range = sel.getRangeAt(0);
      if (!this.#element.contains(range.commonAncestorContainer)) return;

      const rect = range.getBoundingClientRect();
      showToolbar(rect, this, null);
    });
  }

  #onClick(e) {
    // Check if click is on a highlighted area
    const mark = e.target.closest?.('mark[data-hn-id]');
    if (mark) {
      const id = mark.dataset.hnId;
      const hl = this.#highlights.find(h => h.id === id);
      if (hl) {
        this.#emit('highlights:clicked', { id });
        const rect = mark.getBoundingClientRect();
        showToolbar(rect, this, hl);
        return;
      }
    }

    // For Highlight API: check if click is within any highlight range
    if (!this.#useFallback) {
      const clickedHighlight = this.#findHighlightAtPoint(e.clientX, e.clientY);
      if (clickedHighlight) {
        this.#emit('highlights:clicked', { id: clickedHighlight.id });
        const range = findRangeFromOffsets(
          this.#element, clickedHighlight.startOffset, clickedHighlight.endOffset
        );
        if (range) {
          showToolbar(range.getBoundingClientRect(), this, clickedHighlight);
        }
      }
    }
  }

  #findHighlightAtPoint(x, y) {
    // Check if the point falls within any stored highlight range
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

    this.#emit('highlights:note-changed', { id, note });
    announce('Note saved');
  }

  // ---------- Persistence ----------

  #load() {
    try {
      const raw = localStorage.getItem(this.#storageKey);
      if (!raw) return;

      const data = JSON.parse(raw);
      if (!data.highlights || !Array.isArray(data.highlights)) return;

      // Validate content hasn't changed too much
      const currentHash = fnv1a(this.#element.textContent);
      if (data.contentHash && data.contentHash !== currentHash) {
        // Content changed — validate each highlight's text
        this.#highlights = data.highlights.filter(h => {
          const range = findRangeFromOffsets(this.#element, h.startOffset, h.endOffset);
          if (!range) return false;
          const currentText = range.toString().trim();
          return currentText === h.text;
        });
        // Re-save with updated hash
        this.#save();
      } else {
        this.#highlights = data.highlights;
      }
    } catch { /* corrupt data, start fresh */ }
  }

  #save() {
    try {
      const envelope = {
        version: 1,
        contentHash: fnv1a(this.#element.textContent),
        highlights: this.#highlights,
      };
      localStorage.setItem(this.#storageKey, JSON.stringify(envelope));
    } catch { /* storage full */ }
  }

  // ---------- Rendering ----------

  #render() {
    if (this.#useFallback) {
      this.#renderMarks();
    } else {
      this.#renderHighlightAPI();
    }
  }

  #renderHighlightAPI() {
    // Group highlights by color
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

    // Update CSS Highlights
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
    // Remove existing marks
    this.#element.querySelectorAll('mark[data-hn-id]').forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });
    this.#element.normalize();

    // Insert marks in reverse order (end-to-start) to preserve offsets
    const sorted = [...this.#highlights].sort((a, b) => b.startOffset - a.startOffset);
    for (const hl of sorted) {
      const range = findRangeFromOffsets(this.#element, hl.startOffset, hl.endOffset);
      if (!range) continue;

      const mark = document.createElement('mark');
      mark.dataset.hnId = hl.id;
      mark.dataset.hnColor = hl.color;
      mark.style.setProperty('--swatch-color', `var(--highlight-${hl.color})`);
      mark.style.background = `var(--highlight-${hl.color})`;
      mark.style.textDecoration = 'underline';
      mark.style.textDecorationColor = `var(--highlight-${hl.color})`;
      mark.style.textUnderlineOffset = '2px';

      try {
        range.surroundContents(mark);
      } catch {
        // surroundContents fails if range spans multiple elements
        // Extract and wrap instead
        const fragment = range.extractContents();
        mark.appendChild(fragment);
        range.insertNode(mark);
      }
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
      if (node.matches?.(SELECTOR)) initHighlights(node);
      node.querySelectorAll?.(SELECTOR).forEach(el => {
        if (!el.hasAttribute('data-highlights-init')) initHighlights(el);
      });
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initHighlights, HighlightController };
