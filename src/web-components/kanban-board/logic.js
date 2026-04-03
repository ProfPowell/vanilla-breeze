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

class KanbanBoard extends VBElement {
  static get observedAttributes() { return ['src', 'compact', 'title']; }

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
      const surface = /** @type {HTMLElement} */ (e.target).closest('drag-surface');
      const columnId = this.#findColumnForSurface(surface);
      if (!columnId) return;

      this.#updateCount(columnId);

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

    // 9. Handle src attribute for data mode
    const src = this.getAttribute('src');
    if (src) {
      this._loadSrc(src);
      return; // ready event fires after src loads
    }

    // 10. Dispatch ready event
    this.dispatchEvent(new CustomEvent('kanban-board:ready', {
      bubbles: true,
      detail: {
        columnCount: this.#columns.length,
        itemCount: totalItems,
      },
    }));
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

      // Tear down old state and re-run setup
      this.teardown();
      this.removeAttribute('data-upgraded');
      this.setup();
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

registerComponent('kanban-board', KanbanBoard);
export { KanbanBoard };
