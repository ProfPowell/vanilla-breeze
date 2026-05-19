/**
 * traceability-matrix: 2D cross-reference grid for planning artifacts
 *
 * Auto-discovers row and column source elements from the page and
 * renders a <data-table> with checkmark intersections wherever a row
 * element's `link-attr` references a column element's id. Surfaces
 * the canonical Requirements Traceability Matrix (RTM) shape:
 * rows × columns at-a-glance, with empty rows/columns flagged as
 * orphans.
 *
 * Composes <data-table> for sortable / filterable / heatmap-able
 * presentation. Adds two things <data-table> can't:
 *   1. Auto-discovery — build the intersection table from selectors
 *      (rows="user-story" cols="user-persona" link-attr="persona-id")
 *      instead of forcing the author to hand-build every cell.
 *   2. Chain highlight — clicking a cell toggles
 *      `data-state-highlighted` on the row AND column source elements
 *      page-wide, so authors can see the connection in surrounding
 *      components (cards, timelines, etc.).
 *
 * Cell semantics:
 *   ✓        — row's link-attr references this column's id
 *   (empty)  — no link
 *
 * `link-attr` values are split on comma so attributes like
 * `<work-item story-ids="s-1,s-2,s-3">` work without extra config.
 *
 * Labels: each source element's display label is, in order:
 *   1. `data-matrix-label` attribute (author override)
 *   2. element id
 *   3. element textContent (trimmed, first line)
 *
 * @attr {string} rows         - CSS selector for row source elements
 * @attr {string} cols         - CSS selector for column source elements
 * @attr {string} link-attr    - Attribute on the row element whose value(s) reference column ids
 * @attr {string} label        - Optional heading shown above the table
 * @attr {string} row-label    - Header cell text for the row axis (default: "")
 * @attr {string} cell-mark    - Glyph shown in linked cells (default: "✓")
 * @attr {boolean} flag-orphans - When set, marks empty rows/cols with `data-orphan` for CSS targeting
 *
 * @fires traceability-matrix:ready     - { rowCount, colCount, linkCount }
 * @fires traceability-matrix:highlight - { rowEl, colEl, on } when a cell toggles
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class TraceabilityMatrix extends VBElement {
  setup() {
    const rowsSel = this.getAttribute('rows');
    const colsSel = this.getAttribute('cols');
    const linkAttr = this.getAttribute('link-attr');
    if (!rowsSel || !colsSel || !linkAttr) {
      console.warn('traceability-matrix: requires rows, cols, and link-attr attributes');
      return false;
    }

    /* Defer one microtask so any sibling components (e.g. user-persona)
       have finished assigning ids and slot content before we read them. */
    queueMicrotask(() => this.#build(rowsSel, colsSel, linkAttr));
    return true;
  }

  #build(rowsSel, colsSel, linkAttr) {
    const rowEls = [...document.querySelectorAll(rowsSel)].filter((el) => el !== this && !this.contains(el));
    const colEls = [...document.querySelectorAll(colsSel)].filter((el) => el !== this && !this.contains(el));

    if (!rowEls.length || !colEls.length) {
      this.#renderEmpty();
      return;
    }

    const rowAxisLabel = this.getAttribute('row-label') || '';
    const cellMark = this.getAttribute('cell-mark') || '✓';
    const flagOrphans = this.hasAttribute('flag-orphans');

    /* Compute links eagerly so we can flag orphans + emit a count. */
    const links = []; // [{ rowEl, colEl }]
    const rowHits = new WeakMap();
    const colHits = new WeakMap();
    for (const rowEl of rowEls) {
      const refs = TraceabilityMatrix.#parseRefs(rowEl.getAttribute(linkAttr));
      for (const ref of refs) {
        const colEl = colEls.find((c) => c.id === ref);
        if (!colEl) continue;
        links.push({ rowEl, colEl });
        rowHits.set(rowEl, (rowHits.get(rowEl) || 0) + 1);
        colHits.set(colEl, (colHits.get(colEl) || 0) + 1);
      }
    }

    /* Build the data-table markup: header row of column labels,
       one body row per row source. */
    const wrapper = document.createElement('data-table');
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const corner = document.createElement('th');
    corner.setAttribute('data-sort', 'string');
    corner.textContent = rowAxisLabel;
    headerRow.appendChild(corner);

    for (const colEl of colEls) {
      const th = document.createElement('th');
      th.setAttribute('data-sort', 'number');
      th.textContent = TraceabilityMatrix.#labelOf(colEl);
      th.dataset.colId = colEl.id || '';
      if (flagOrphans && !colHits.get(colEl)) th.dataset.orphan = '';
      headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const rowEl of rowEls) {
      const tr = document.createElement('tr');
      tr.dataset.rowId = rowEl.id || '';
      if (flagOrphans && !rowHits.get(rowEl)) tr.dataset.orphan = '';

      const labelCell = document.createElement('th');
      labelCell.scope = 'row';
      labelCell.textContent = TraceabilityMatrix.#labelOf(rowEl);
      tr.appendChild(labelCell);

      const refs = TraceabilityMatrix.#parseRefs(rowEl.getAttribute(linkAttr));
      for (const colEl of colEls) {
        const td = document.createElement('td');
        const matched = refs.includes(colEl.id);
        td.setAttribute('data-sort-value', matched ? '1' : '0');
        if (matched) {
          td.dataset.linked = '';
          td.textContent = cellMark;
          td.setAttribute('aria-label', 'linked');
        } else {
          td.setAttribute('aria-label', 'not linked');
        }
        td.dataset.colId = colEl.id || '';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);

    [...this.children].forEach((c) => { if (c.tagName !== 'TEMPLATE') c.remove(); });

    const label = this.getAttribute('label');
    if (label) {
      const h = document.createElement('header');
      h.className = 'tm-label';
      h.textContent = label;
      this.appendChild(h);
    }
    this.appendChild(wrapper);

    /* Wire chain-highlight clicks via event delegation on the wrapper.
       Any <td>/<th> click highlights its row + column source elements. */
    this.#wrapper = wrapper;
    this.#rowsByDom = new Map(rowEls.map((el) => [el.id, el]));
    this.#colsByDom = new Map(colEls.map((el) => [el.id, el]));
    this.listen(wrapper, 'click', this.#onCellClick);

    queueMicrotask(() => {
      this.dispatchEvent(new CustomEvent('traceability-matrix:ready', {
        bubbles: true,
        detail: { rowCount: rowEls.length, colCount: colEls.length, linkCount: links.length },
      }));
    });
  }

  #onCellClick = (e) => {
    const cell = e.target.closest('td, th[scope="row"]');
    if (!cell) return;
    const tr = cell.closest('tr');
    if (!tr) return;
    const rowId = tr.dataset.rowId;
    const colId = cell.dataset.colId;
    const rowEl = rowId ? this.#rowsByDom.get(rowId) : null;
    const colEl = colId ? this.#colsByDom.get(colId) : null;

    /* Toggle: if this cell is already highlighted, clear; else
       set fresh highlight on row + col source elements. */
    const wasOn = cell.hasAttribute('data-state-highlighted');
    this.#clearHighlight();
    if (wasOn) {
      this.dispatchEvent(new CustomEvent('traceability-matrix:highlight', {
        bubbles: true, detail: { rowEl, colEl, on: false },
      }));
      return;
    }
    cell.setAttribute('data-state-highlighted', '');
    if (rowEl) rowEl.setAttribute('data-state-highlighted', '');
    if (colEl && colEl !== rowEl) colEl.setAttribute('data-state-highlighted', '');
    /* Highlight the entire row in the matrix for visual scan. */
    tr.setAttribute('data-state-highlighted', '');

    this.dispatchEvent(new CustomEvent('traceability-matrix:highlight', {
      bubbles: true, detail: { rowEl, colEl, on: true },
    }));
  };

  #clearHighlight() {
    if (!this.#wrapper) return;
    this.#wrapper.querySelectorAll('[data-state-highlighted]').forEach((el) => el.removeAttribute('data-state-highlighted'));
    document.querySelectorAll('[data-state-highlighted]').forEach((el) => {
      if (this.#rowsByDom.has(el.id) || this.#colsByDom.has(el.id)) el.removeAttribute('data-state-highlighted');
    });
  }

  #renderEmpty() {
    [...this.children].forEach((c) => { if (c.tagName !== 'TEMPLATE') c.remove(); });
    const note = document.createElement('p');
    note.className = 'tm-empty';
    note.textContent = 'No matching elements found for this matrix.';
    this.appendChild(note);
  }

  static #parseRefs(raw) {
    if (!raw) return [];
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  static #labelOf(el) {
    return el.getAttribute('data-matrix-label')
      || el.id
      || (el.textContent || '').trim().split('\n')[0].slice(0, 60)
      || '(unnamed)';
  }

  /** @type {HTMLElement | null} */
  #wrapper = null;
  /** @type {Map<string, Element>} */
  #rowsByDom = new Map();
  /** @type {Map<string, Element>} */
  #colsByDom = new Map();
}

registerComponent('traceability-matrix', TraceabilityMatrix);

export { TraceabilityMatrix };
