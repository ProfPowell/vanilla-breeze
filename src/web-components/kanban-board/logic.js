/**
 * kanban-board: Columnar drag-and-drop board
 *
 * Light DOM component that creates a board with user-defined columns,
 * each containing a <drag-surface> for cross-column drag-and-drop.
 * Works with any draggable content — user-story cards, articles, or
 * any element with draggable="true" and data-id.
 *
 * @attr {string} src - URL to JSON data for columns and items
 * @attr {string} title - Optional heading above the board
 * @attr {boolean} compact - Reduced spacing variant
 *
 * Children use:
 * @attr {string} data-column - Column identifier (on <section>)
 * @attr {string} data-column-label - Display label for the column header (on <section>)
 * @attr {number} data-wip - Optional WIP limit for the column (on <section>)
 * @attr {string} data-column-color - Optional color token for column tint (on <section>)
 *
 * @fires kanban-board:transfer - Item moved between columns
 * @fires kanban-board:reorder - Item reordered within a column
 * @fires kanban-board:ready - Fired after component initializes
 * @fires kanban-board:wip-exceeded - Fired when a column exceeds its WIP limit
 *
 * @example
 * <kanban-board>
 *   <section data-column="backlog" data-column-label="Backlog">
 *     <article draggable="true" data-id="task-1">Design review</article>
 *   </section>
 *   <section data-column="doing" data-column-label="In Progress" data-wip="3">
 *     <article draggable="true" data-id="task-2">API integration</article>
 *   </section>
 * </kanban-board>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { VBCollection } from '../../lib/vb-collection.js';
import { viewTransitionSwap } from '../../lib/vb-view-transition.js';

class KanbanBoard extends VBCollection(VBElement) {
  static get observedAttributes() { return ['src', 'compact', 'title']; }
  static keyOf(item) { return item.id ?? item.storyId; }

  static #instanceCount = 0;

  /** @type {HTMLDivElement | null} */
  #columnsEl = null;
  /** @type {Record<string, HTMLElement>} */
  #surfaces = {};
  /** @type {Record<string, HTMLElement>} */
  #columnEls = {};
  /** @type {HTMLDivElement | null} */
  #liveRegion = null;
  /** @type {string} */
  #groupId = '';
  /** @type {Array<{ id: string, label: string, wip: number | null, color: string | null, children: HTMLElement[] }>} */
  #columns = [];
  /** @type {((item: any) => Element) | null} */
  #renderItem = null;

  setup() {
    this.#groupId = `kb-${++KanbanBoard.#instanceCount}`;

    // 1. Snapshot <section data-column> children
    const sections = /** @type {HTMLElement[]} */ ([
      ...this.querySelectorAll(':scope > section[data-column]')
    ]);

    this.#columns = sections.map(section => {
      const id = section.getAttribute('data-column') || '';
      const rawLabel = section.getAttribute('data-column-label') || '';
      const label = rawLabel || this.#titleCase(id);
      const wipAttr = section.getAttribute('data-wip');
      const wip = wipAttr ? parseInt(wipAttr, 10) : null;
      const color = section.getAttribute('data-column-color') || null;
      const children = /** @type {HTMLElement[]} */ ([...section.children]);
      return { id, label, wip, color, children };
    });

    // 2. Remove original sections (children already captured)
    for (const section of sections) {
      section.remove();
    }

    // 3. Build columns container
    this.#columnsEl = document.createElement('div');
    this.#columnsEl.className = 'kb-columns';
    this.#columnsEl.setAttribute('role', 'region');
    this.#columnsEl.setAttribute('aria-label', 'Kanban board');

    // 4. Build each column
    let totalItems = 0;

    for (const col of this.#columns) {
      const column = document.createElement('section');
      column.className = 'kb-column';
      column.setAttribute('data-column-id', col.id);
      if (col.color) column.setAttribute('data-column-tint', col.color);

      // Header with count badge and optional WIP
      const header = document.createElement('header');
      header.className = 'kb-column-header';

      const h3 = document.createElement('h3');
      h3.textContent = col.label;

      const countBadge = document.createElement('output');
      countBadge.className = 'kb-count';
      countBadge.textContent = String(col.children.length);
      h3.appendChild(countBadge);

      if (col.wip !== null && !isNaN(col.wip)) {
        const wipBadge = document.createElement('span');
        wipBadge.className = 'kb-wip';
        wipBadge.textContent = `/ ${col.wip}`;
        wipBadge.setAttribute('aria-label', `WIP limit ${col.wip}`);
        h3.appendChild(wipBadge);
      }

      header.appendChild(h3);
      column.appendChild(header);

      // Drag surface
      const surface = document.createElement('drag-surface');
      surface.setAttribute('group', this.#groupId);
      surface.setAttribute('aria-label', `${col.label} items`);
      surface.setAttribute('data-layout', 'stack');
      surface.setAttribute('data-layout-gap', 'xs');

      // Move captured children into the drag-surface
      if (col.children.length > 0) {
        for (const child of col.children) {
          if (!child.hasAttribute('draggable')) {
            child.setAttribute('draggable', 'true');
          }
          if (!child.hasAttribute('data-id')) {
            child.dataset.id = `kb-item-${totalItems}`;
          }
          surface.appendChild(child);
        }
        totalItems += col.children.length;
      } else {
        const placeholder = document.createElement('p');
        placeholder.className = 'kb-empty';
        placeholder.textContent = 'No items';
        surface.appendChild(placeholder);
      }

      column.appendChild(surface);
      this.#columnsEl.appendChild(column);
      this.#surfaces[col.id] = surface;
      this.#columnEls[col.id] = column;

      // Check initial WIP state
      if (col.wip !== null && col.children.length > col.wip) {
        column.setAttribute('data-wip-exceeded', '');
      }
    }

    // 5. Assemble: title + columns, append to host
    const title = this.getAttribute('title');
    if (title) {
      const heading = document.createElement('h2');
      heading.className = 'kb-title';
      heading.textContent = title;
      this.appendChild(heading);
    }

    this.appendChild(this.#columnsEl);

    // 6. Create live region
    this.#liveRegion = document.createElement('div');
    this.#liveRegion.className = 'kb-live-region';
    this.#liveRegion.setAttribute('role', 'status');
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');
    this.appendChild(this.#liveRegion);

    // 7. Listen for drag-surface:reorder
    this.listen(this, 'drag-surface:reorder', (e) => {
      const detail = /** @type {CustomEvent} */ (e).detail;
      const surface = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest('drag-surface'));
      const columnId = this.#findColumnForSurface(surface);
      if (!columnId) return;

      this.#updateCount(columnId);
      this.#syncItemsFromDom('drag');

      this.dispatchEvent(new CustomEvent('kanban-board:reorder', {
        bubbles: true,
        detail: {
          itemId: detail.itemId,
          column: columnId,
          oldIndex: detail.oldIndex,
          newIndex: detail.newIndex,
        },
      }));
    });

    // 8. Listen for drag-surface:transfer
    this.listen(this, 'drag-surface:transfer', (e) => {
      const detail = /** @type {CustomEvent} */ (e).detail;
      const fromSurface = detail.fromSurface;
      const toSurface = detail.toSurface;
      const fromColumn = this.#findColumnForSurface(fromSurface);
      const toColumn = this.#findColumnForSurface(toSurface);
      if (!fromColumn || !toColumn) return;

      // Update data-column attribute on the transferred item
      if (detail.item) {
        detail.item.setAttribute('data-column', toColumn);
      }

      // Update count badges and WIP state
      this.#updateCount(fromColumn);
      this.#updateCount(toColumn);

      // Remove placeholder from receiving column if it had one
      const toPlaceholder = toSurface.querySelector('.kb-empty');
      if (toPlaceholder) toPlaceholder.remove();

      // Add placeholder to sending column if now empty
      const fromDraggables = fromSurface.querySelectorAll(':scope > [draggable="true"]');
      if (fromDraggables.length === 0 && !fromSurface.querySelector('.kb-empty')) {
        const placeholder = document.createElement('p');
        placeholder.className = 'kb-empty';
        placeholder.textContent = 'No items';
        fromSurface.appendChild(placeholder);
      }

      // Announce via live region
      const itemLabel = this.#itemLabel(detail.item);
      const fromLabel = this.#columnLabel(fromColumn);
      const toLabel = this.#columnLabel(toColumn);
      this.#announce(`${itemLabel} moved from ${fromLabel} to ${toLabel}`);

      this.#syncItemsFromDom('drag');

      this.dispatchEvent(new CustomEvent('kanban-board:transfer', {
        bubbles: true,
        detail: {
          itemId: detail.itemId,
          fromColumn,
          toColumn,
          newIndex: detail.newIndex,
          item: detail.item,
        },
      }));

      // Check WIP limit on receiving column
      const toCount = toSurface.querySelectorAll(':scope > [draggable="true"]').length;
      const toColMeta = this.#columns.find(c => c.id === toColumn);
      if (toColMeta?.wip !== null && toColMeta?.wip !== undefined && toCount > toColMeta.wip) {
        this.dispatchEvent(new CustomEvent('kanban-board:wip-exceeded', {
          bubbles: true,
          detail: {
            column: toColumn,
            limit: toColMeta.wip,
            count: toCount,
          },
        }));
      }
    });

    // 9. Seed VBCollection state from existing rendered children so future
    //    .items assignments diff against them instead of recreating.
    this.#seedFromDom();

    // 10. Handle src attribute for data mode
    const src = this.getAttribute('src');
    if (src) {
      this._loadSrc(src);
      return; // ready event fires after src loads
    }

    // 11. Dispatch ready event
    this.dispatchEvent(new CustomEvent('kanban-board:ready', {
      bubbles: true,
      detail: {
        columnCount: this.#columns.length,
        itemCount: totalItems,
      },
    }));
  }

  /**
   * Walk the rendered drag-surfaces and register each draggable child by
   * its data-id so VBCollection's diff treats them as managed nodes.
   */
  #seedFromDom() {
    /** @type {any[]} */
    const items = [];
    /** @type {Map<unknown, Element>} */
    const nodeMap = new Map();
    for (const [columnId, surface] of Object.entries(this.#surfaces)) {
      const draggables = surface.querySelectorAll(':scope > [draggable="true"]');
      for (const el of draggables) {
        const id = el.getAttribute('data-id');
        if (!id) continue;
        items.push({ id, column: columnId });
        nodeMap.set(id, el);
      }
    }
    this._seedCollection(items, nodeMap);
  }

  /**
   * Re-derive the internal items array from current DOM order (used after
   * a drag mutates the DOM directly). Preserves consumer-supplied fields
   * by carrying over each item's prior shape and just updating column.
   * Emits `kanban-board:items-changed` with the given source.
   *
   * @param {'drag' | 'api' | 'attribute'} source
   */
  #syncItemsFromDom(source) {
    /** @type {any[]} */
    const next = [];
    /** @type {Map<string, any>} */
    const previous = new Map();
    for (const it of this.items) {
      const k = String(it.id ?? it.storyId ?? '');
      if (k) previous.set(k, it);
    }
    for (const [columnId, surface] of Object.entries(this.#surfaces)) {
      const draggables = surface.querySelectorAll(':scope > [draggable="true"]');
      for (const el of draggables) {
        const id = el.getAttribute('data-id');
        if (!id) continue;
        const prior = previous.get(id);
        next.push(prior ? { ...prior, column: columnId } : { id, column: columnId });
      }
    }
    this._setItemsSilently(next);
    this._emit('items-changed', { items: next }, source);
  }

  teardown() {
    // Remove title if we created one
    const title = this.querySelector('.kb-title');
    if (title) title.remove();
    if (this.#columnsEl) {
      this.#columnsEl.remove();
      this.#columnsEl = null;
    }
    if (this.#liveRegion) {
      this.#liveRegion.remove();
      this.#liveRegion = null;
    }
    this.#surfaces = {};
    this.#columnEls = {};
    this.#columns = [];
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current column definitions. After upgrade this reflects the parsed
   * `<section data-column>` children. Setting replaces all columns and
   * rebuilds the shell — items already in nodes get re-routed to the new
   * surfaces; orphaned items (column id no longer present) are dropped.
   */
  get columns() {
    return this.#columns.map(c => ({
      id: c.id, label: c.label, wip: c.wip ?? undefined, color: c.color ?? undefined,
    }));
  }

  set columns(value) {
    const next = (value || []).map(c => ({
      id: c.id, label: c.label || this.#titleCase(c.id),
      wip: c.wip ?? null, color: c.color ?? null, children: [],
    }));
    const oldShell = this.#columnsEl;
    // Build the new shell off-DOM and update internal refs synchronously
    // so a chained `.items = …` lookup sees the new surfaces immediately
    // (the diff appends into the detached shell; both come together when
    // the View Transition callback attaches the new shell to the host).
    this.#surfaces = {};
    this.#columnEls = {};
    this.#columns = next;
    const newShell = this.#assembleShell();
    this.#columnsEl = newShell;

    const swap = () => {
      if (oldShell) oldShell.remove();
      this.appendChild(newShell);
    };
    if (this.hasAttribute('data-upgraded') && oldShell) {
      viewTransitionSwap(this, swap, 'kb-vt');
    } else {
      swap();
    }
  }

  /**
   * Optional custom item renderer. When set, replaces the default
   * `<work-item>` factory used by the `.items` setter.
   */
  get renderItem() { return this.#renderItem; }
  set renderItem(fn) { this.#renderItem = typeof fn === 'function' ? fn : null; }

  /**
   * VBCollection hook: build a fresh element for a new key.
   * Default: a `<work-item>` with the item's fields applied via .data.
   * Always returns a draggable element with data-id set for drag-surface.
   */
  _renderItem(item) {
    let el;
    if (this.#renderItem) {
      const out = this.#renderItem(item);
      if (!(out instanceof Element)) {
        throw new Error('kanban-board: renderItem must return an Element');
      }
      el = out;
    } else {
      el = this.#defaultRenderItem(item);
    }
    if (!el.hasAttribute('draggable')) el.setAttribute('draggable', 'true');
    if (!el.hasAttribute('data-id')) el.setAttribute('data-id', String(KanbanBoard.keyOf(item)));
    return el;
  }

  /**
   * VBCollection hook: route this item to the drag-surface for its column.
   * @param {any} item
   * @param {any} _existing
   * @returns {any}
   */
  _containerFor(item, _existing) {
    const surface = this.#surfaces[item.column];
    if (!surface) {
      throw new Error(`kanban-board: no column "${item.column}" — set .columns first or include item.column matching an existing column id`);
    }
    // Remove the empty placeholder before inserting managed children.
    const placeholder = surface.querySelector(':scope > .kb-empty');
    if (placeholder) placeholder.remove();
    return surface;
  }

  /**
   * VBCollection hook: refresh count badges, WIP markers, and empty
   * placeholders after every diff.
   */
  _postRender() {
    for (const id of Object.keys(this.#surfaces)) {
      this.#updateCount(id);
      const surface = this.#surfaces[id];
      const draggables = surface.querySelectorAll(':scope > [draggable="true"]');
      const placeholder = surface.querySelector(':scope > .kb-empty');
      if (draggables.length === 0 && !placeholder) {
        const p = document.createElement('p');
        p.className = 'kb-empty';
        p.textContent = 'No items';
        surface.appendChild(p);
      } else if (draggables.length > 0 && placeholder) {
        placeholder.remove();
      }
    }
  }

  /**
   * Default renderer: build a `<work-item>` and apply item fields via .data.
   * Falls back to a plain `<article>` if work-item isn't registered.
   */
  #defaultRenderItem(item) {
    const tag = customElements.get('work-item') ? 'work-item' : 'article';
    const el = /** @type {any} */ (document.createElement(tag));
    if (tag === 'work-item') {
      // Map the kanban item shape to work-item's data shape.
      el.data = {
        itemId: item.id ?? item.storyId,
        type: item.type,
        priority: item.priority,
        status: item.status,
        estimate: item.estimate != null ? String(item.estimate) : undefined,
        assignee: item.assignee,
        title: item.title,
        description: item.description,
        checklist: item.checklist,
        notes: item.notes,
        detail: item.detail,
      };
    } else {
      el.className = 'kb-card';
      el.textContent = item.title || item.label || item.id;
    }
    return el;
  }

  /**
   * Build the kb-columns shell from the current `#columns` metas and
   * populate `#surfaces` / `#columnEls`. Returns the detached shell so
   * the caller decides when to attach it (sync, or inside a View
   * Transition callback).
   */
  #assembleShell() {
    const shell = document.createElement('div');
    shell.className = 'kb-columns';
    shell.setAttribute('role', 'region');
    shell.setAttribute('aria-label', 'Kanban board');

    for (const col of this.#columns) {
      const column = document.createElement('section');
      column.className = 'kb-column';
      column.setAttribute('data-column-id', col.id);
      if (col.color) column.setAttribute('data-column-tint', col.color);

      const header = document.createElement('header');
      header.className = 'kb-column-header';
      const h3 = document.createElement('h3');
      h3.textContent = col.label;
      const countBadge = document.createElement('output');
      countBadge.className = 'kb-count';
      countBadge.textContent = '0';
      h3.appendChild(countBadge);
      if (col.wip != null && !isNaN(col.wip)) {
        const wipBadge = document.createElement('span');
        wipBadge.className = 'kb-wip';
        wipBadge.textContent = `/ ${col.wip}`;
        wipBadge.setAttribute('aria-label', `WIP limit ${col.wip}`);
        h3.appendChild(wipBadge);
      }
      header.appendChild(h3);
      column.appendChild(header);

      const surface = document.createElement('drag-surface');
      surface.setAttribute('group', this.#groupId);
      surface.setAttribute('aria-label', `${col.label} items`);
      surface.setAttribute('data-layout', 'stack');
      surface.setAttribute('data-layout-gap', 'xs');
      const placeholder = document.createElement('p');
      placeholder.className = 'kb-empty';
      placeholder.textContent = 'No items';
      surface.appendChild(placeholder);

      column.appendChild(surface);
      shell.appendChild(column);
      this.#surfaces[col.id] = surface;
      this.#columnEls[col.id] = column;
    }

    return shell;
  }

  // ── Attribute changes ────────────────────────────────

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) return;
    if (name === 'src') this._loadSrc(newValue);
  }

  // ── JSON loading ────────────────────────────────────

  async _loadSrc(url) {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Clear existing children
      while (this.firstChild) this.firstChild.remove();

      // Create sections from columns
      for (const col of (data.columns || [])) {
        const section = document.createElement('section');
        section.setAttribute('data-column', col.id);
        if (col.label) section.setAttribute('data-column-label', col.label);
        if (col.wip != null) section.setAttribute('data-wip', String(col.wip));
        if (col.color) section.setAttribute('data-column-color', col.color);

        for (const item of (col.items || [])) {
          let el;
          if (item.persona || item.action || item.storyId) {
            el = document.createElement('user-story');
            el.setAttribute('detail', item.detail || 'minimal');
            if (item.storyId) el.setAttribute('story-id', item.storyId);
            if (item.persona) el.setAttribute('persona', item.persona);
            if (item.action) el.setAttribute('action', item.action);
            if (item.benefit) el.setAttribute('benefit', item.benefit);
            if (item.priority) el.setAttribute('priority', item.priority);
            if (item.status) el.setAttribute('status', item.status);
            if (item.points) el.setAttribute('points', String(item.points));
          } else {
            el = document.createElement('article');
            el.className = 'kb-card';
            el.textContent = item.text || item.label || '';
          }

          el.setAttribute('draggable', 'true');
          el.dataset.id = item.id || item.storyId || '';
          section.appendChild(el);
        }
        this.appendChild(section);
      }

      const swap = () => {
        this.teardown();
        this.removeAttribute('data-upgraded');
        this.setup();
      };
      if (this.hasAttribute('data-upgraded') && this.#columnsEl) {
        viewTransitionSwap(this, swap, 'kb-vt');
      } else {
        swap();
      }
    } catch (err) {
      console.warn(`[kanban-board] Failed to load src="${url}":`, err);
    }
  }

  // ── Helpers ──────────────────────────────────────────

  /**
   * Reverse-lookup: find the column id that owns a given drag-surface.
   * @param {HTMLElement | null} surface
   * @returns {string | null}
   */
  #findColumnForSurface(surface) {
    if (!surface) return null;
    for (const [id, ref] of Object.entries(this.#surfaces)) {
      if (ref === surface) return id;
    }
    return null;
  }

  /**
   * Update the count badge and WIP state for a given column.
   * @param {string} columnId
   */
  #updateCount(columnId) {
    const surface = this.#surfaces[columnId];
    const columnEl = this.#columnEls[columnId];
    if (!surface || !columnEl) return;

    const count = surface.querySelectorAll(':scope > [draggable="true"]').length;
    const badge = columnEl.querySelector('.kb-count');
    if (badge) badge.textContent = String(count);

    // Update WIP state
    const colMeta = this.#columns.find(c => c.id === columnId);
    if (colMeta?.wip !== null && colMeta?.wip !== undefined) {
      if (count > colMeta.wip) {
        columnEl.setAttribute('data-wip-exceeded', '');
      } else {
        columnEl.removeAttribute('data-wip-exceeded');
      }
    }
  }

  /**
   * Get the display label for a column.
   * @param {string} columnId
   * @returns {string}
   */
  #columnLabel(columnId) {
    const col = this.#columns.find(c => c.id === columnId);
    return col?.label || this.#titleCase(columnId);
  }

  /**
   * Announce a message via the live region.
   * @param {string} msg
   */
  #announce(msg) {
    if (!this.#liveRegion) return;
    this.#liveRegion.textContent = '';
    requestAnimationFrame(() => {
      if (this.#liveRegion) this.#liveRegion.textContent = msg;
    });
  }

  /**
   * Get a human-readable label for a board item.
   * @param {HTMLElement} item
   * @returns {string}
   */
  #itemLabel(item) {
    return item.getAttribute('story-id')
      || item.getAttribute('data-id')
      || item.textContent?.trim().slice(0, 40)
      || 'item';
  }

  /**
   * Convert a hyphenated or lowercase id to Title Case.
   * @param {string} str
   * @returns {string}
   */
  #titleCase(str) {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}

registerComponent('kanban-board', /** @type {any} */ (KanbanBoard));
export { KanbanBoard };
