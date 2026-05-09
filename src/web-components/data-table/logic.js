/**
 * data-table: Enhanced table with sorting, filtering, and pagination
 *
 * Wraps a standard HTML table and adds interactive features based on
 * data attributes. Progressive enhancement - table works without JS.
 *
 * @attr {boolean} data-filterable - Enable text search filtering
 * @attr {number} data-paginate - Enable pagination with N rows per page
 *
 * Table header attributes:
 * @attr {string} data-sort    - Column sort type: "string", "number", "date"
 * @attr {number} data-weight  - Column weight (multiplier for weighted-sum rollups)
 * @attr {string} data-rollup  - Compute this column from siblings: "sum" | "weighted-sum" | "product" | "avg" | "max"
 * @attr {string} data-heatmap - Tint this column's cells by relative value: "auto" | "low-good" | "high-good"
 *
 * Cell attributes:
 * @attr {string} data-sort-value - Custom value for sorting
 * @attr {string} data-filter-value - Custom value for filtering
 *
 * State attributes (set by component):
 * @attr {string} aria-sort - Sort direction on <th>: "none", "ascending", "descending"
 * @attr {boolean} data-state-hidden - Row is hidden (filtered or paginated)
 * @attr {string} data-heat-level - Heatmap bucket on <td>: "low", "mid", "high"
 *
 * @fires data-table:sort - When a column is sorted { column, direction, columnName }
 * @fires data-table:filter - When filter query changes { query, count }
 * @fires data-table:page - When page changes { page }
 * @fires data-table:expand - When row is expanded/collapsed { row, expanded }
 * @fires data-table:selection - When row selection changes { count, rows }
 *
 * @example
 * <data-table>
 *   <table data-filterable data-paginate="10">
 *     <thead>
 *       <tr>
 *         <th data-sort="string">Name</th>
 *         <th data-sort="number">Price</th>
 *         <th data-sort="date">Date</th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr>
 *         <td>Widget</td>
 *         <td data-sort-value="19.99">$19.99</td>
 *         <td data-sort-value="2024-01-15">Jan 15, 2024</td>
 *       </tr>
 *     </tbody>
 *   </table>
 * </data-table>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { diffByKey } from '../../lib/diff-by-key.js';

class DataTable extends VBElement {
  #table;
  #tbody;
  #sortableHeaders = [];
  #allRows = [];
  #filteredRows = [];
  #currentSortColumn = -1;
  /** @type {string | null} */
  #currentSortDirection = null;
  #currentPage = 1;
  #pageSize = 0;
  /** @type {HTMLInputElement | null} */
  #filterInput = null;
  /** @type {HTMLElement | null} */
  #paginationNav = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #filterDebounceTimer = null;
  #filterQuery = '';
  /** @type {HTMLInputElement | null} */
  #selectAllCheckbox = null;
  /** @type {Element | null} */
  #selectedCountElement = null;

  // -- Data API state --
  /** @type {Array<Record<string, unknown>>} */
  #rows = [];
  /** @type {Map<unknown, Element>} */
  #rowNodes = new Map();
  /** @type {Array<{ key: string, label: string, sort?: string }>} */
  #columnSpec = [];

  setup() {
    this.#table = this.querySelector(':scope > table');
    if (!this.#table) return false;

    this.#tbody = this.#table.querySelector('tbody');
    if (!this.#tbody) return false;

    this.#init();
  }

  teardown() {
    this.#cleanup();
    this.#sortableHeaders = [];
    this.#allRows = [];
    this.#filteredRows = [];
  }

  #init() {
    // Collect data rows only — exclude expansion content rows
    // This ensures sort/filter/pagination treat expandable + content as a group
    this.#allRows = [...this.#tbody.querySelectorAll(':scope > tr:not([data-expand-content])')];
    this.#filteredRows = [...this.#allRows];

    // Derive column spec from <thead> for the JS-first .rows API.
    // Columns are keyed by data-key on each <th>, falling back to the
    // header's lowercased text content. Sort type carries over for parity
    // with attribute-driven mode.
    this.#columnSpec = [...(this.#table.tHead?.rows[0]?.cells || [])].map(th => ({
      key: th.getAttribute('data-key') || th.textContent.trim().toLowerCase(),
      label: th.textContent.trim(),
      sort: th.getAttribute('data-sort') || undefined,
    }));

    // Seed VBCollection-style row map from existing <tr>s so any future
    // .rows = [...] assignment diffs against existing nodes (preserving
    // selection / expansion / inline-edit state for keys that persist).
    this.#rowNodes.clear();
    this.#rows = [];
    for (const tr of this.#allRows) {
      const id = tr.getAttribute('data-id') || tr.getAttribute('data-key');
      if (!id) continue;
      this.#rowNodes.set(id, tr);
      this.#rows.push({ id });
    }

    // Read column-derived metadata (weights, rollups, heatmaps) once.
    this.#readHeaderMetadata();

    // Apply rollups before sorting/filtering so computed cells participate.
    this.#applyRollups();
    this.#applyHeatmaps();

    // Set up sorting
    this.#setupSorting();

    // Set up filtering
    if (this.#table.hasAttribute('data-filterable')) {
      this.#setupFiltering();
    }

    // Set up pagination
    const paginateAttr = this.#table.getAttribute('data-paginate');
    if (paginateAttr) {
      this.#pageSize = parseInt(paginateAttr, 10);
      if (this.#pageSize > 0) {
        this.#setupPagination();
      }
    }

    // Set up row expansion
    this.#setupExpansion();

    // Set up row selection
    this.#setupSelection();

    // Initial render
    this.#render();
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current rows. After upgrade this is seeded from existing <tr>s
   * (each row carries an `id` from its data-id attribute). After
   * assignment, it reflects whatever the consumer last passed in.
   */
  get rows() { return this.#rows; }

  /**
   * Replace the row set. Runs a keyed diff against existing <tr> nodes:
   * rows whose id appears in both old and new lists keep their DOM node
   * (preserving selection, expansion, inline-edit, focus, and CSS
   * animation state). New ids render via _renderRow; dropped ids are
   * removed from the tbody.
   */
  set rows(value) {
    const next = value || [];
    const result = diffByKey({
      newItems: next,
      nodes: this.#rowNodes,
      keyOf: (row) => row.id,
      renderItem: (row) => this._renderRow(row),
      containerFor: () => this.#tbody,
    });
    this.#rows = next;
    this.#allRows = [...this.#tbody.querySelectorAll(':scope > tr:not([data-expand-content])')];
    this.#applyRollups();
    this.#applyHeatmaps();
    this.#applyFilter(this.#filterQuery);
    this.dispatchEvent(new CustomEvent('data-table:rows-changed', {
      detail: { rows: next, added: result.added, moved: result.moved, removed: result.removed, source: 'api' },
      bubbles: true,
    }));
  }

  /**
   * Read the column spec derived from <thead> on upgrade, or whatever was
   * last assigned. Each entry is `{ key, label, sort? }`.
   */
  get columns() { return this.#columnSpec; }

  /**
   * Default row renderer. Override in a subclass or replace via .renderRow.
   * Builds a <tr> with one <td> per column in #columnSpec, populated from
   * `row[column.key]`. Sets data-id from row.id for diff stability.
   */
  _renderRow(row) {
    if (typeof this.renderRow === 'function') {
      const out = this.renderRow(row, this.#columnSpec);
      if (!(out instanceof Element)) {
        throw new Error('data-table: renderRow must return an Element');
      }
      if (!out.hasAttribute('data-id')) out.setAttribute('data-id', String(row.id));
      return out;
    }
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', String(row.id));
    for (const col of this.#columnSpec) {
      const td = document.createElement('td');
      const value = row[col.key];
      td.textContent = value == null ? '' : String(value);
      tr.appendChild(td);
    }
    return tr;
  }

  // ── Rollups & heatmaps ──────────────────────────────────────────

  /** @type {Array<number|null>} */
  #weights = [];
  /** @type {Array<string|null>} */
  #rollups = [];
  /** @type {Array<string|null>} */
  #heatmaps = [];

  #readHeaderMetadata() {
    const headers = [...(this.#table.tHead?.rows[0]?.cells || [])];
    this.#weights = headers.map((th) => {
      const w = parseFloat(th.getAttribute('data-weight'));
      return Number.isFinite(w) ? w : null;
    });
    this.#rollups = headers.map((th) => th.getAttribute('data-rollup') || null);
    this.#heatmaps = headers.map((th) => th.getAttribute('data-heatmap') || null);
  }

  #applyRollups() {
    if (!this.#rollups.some(Boolean)) return;
    for (let colIdx = 0; colIdx < this.#rollups.length; colIdx++) {
      const kind = this.#rollups[colIdx];
      if (!kind) continue;
      for (const row of this.#allRows) {
        const cell = row.children[colIdx];
        if (!cell) continue;
        const value = this.#computeRollup(row, colIdx, kind);
        const formatted = DataTable.#formatRollup(value);
        cell.textContent = formatted;
        cell.setAttribute('data-rollup-value', String(value));
        if (!cell.hasAttribute('data-sort-value')) {
          cell.setAttribute('data-sort-value', String(value));
        }
      }
    }
  }

  #computeRollup(row, skipCol, kind) {
    const cells = [...row.children];
    let sum = 0;
    let count = 0;
    let max = -Infinity;
    let weightedSum = 0;
    let product = 1;
    let productHadValue = false;
    for (let i = 0; i < cells.length; i++) {
      if (i === skipCol) continue;
      if (this.#rollups[i]) continue;
      const raw = cells[i].getAttribute('data-sort-value') ?? cells[i].textContent ?? '';
      const v = parseFloat(raw);
      if (!Number.isFinite(v)) continue;
      sum += v;
      count++;
      if (v > max) max = v;
      product *= v;
      productHadValue = true;
      const w = this.#weights[i];
      if (w !== null) weightedSum += v * w;
    }
    switch (kind) {
      case 'sum':           return sum;
      case 'avg':           return count ? sum / count : 0;
      case 'max':           return max === -Infinity ? 0 : max;
      case 'weighted-sum':  return weightedSum;
      case 'product':       return productHadValue ? product : 0;
      default:              return sum;
    }
  }

  static #formatRollup(value) {
    if (!Number.isFinite(value)) return '';
    if (Number.isInteger(value)) return String(value);
    return (Math.round(value * 100) / 100).toString();
  }

  #applyHeatmaps() {
    if (!this.#heatmaps.some(Boolean)) return;
    for (let colIdx = 0; colIdx < this.#heatmaps.length; colIdx++) {
      const kind = this.#heatmaps[colIdx];
      if (!kind) continue;
      const values = this.#allRows.map((row) => {
        const cell = row.children[colIdx];
        if (!cell) return null;
        const raw =
          cell.getAttribute('data-rollup-value') ??
          cell.getAttribute('data-sort-value') ??
          cell.textContent ?? '';
        const v = parseFloat(raw);
        return Number.isFinite(v) ? v : null;
      });
      const valid = values.filter((v) => v !== null);
      if (!valid.length) continue;
      const min = Math.min(...valid);
      const max = Math.max(...valid);
      const range = max - min || 1;
      for (let i = 0; i < this.#allRows.length; i++) {
        const cell = this.#allRows[i].children[colIdx];
        if (!cell) continue;
        const v = values[i];
        if (v === null) {
          cell.removeAttribute('data-heat-level');
          continue;
        }
        let normalized = (v - min) / range;
        if (kind === 'low-good') normalized = 1 - normalized;
        const level = normalized < 0.34 ? 'low' : normalized < 0.67 ? 'mid' : 'high';
        cell.setAttribute('data-heat-level', level);
      }
    }
  }

  #cleanup() {
    if (this.#filterDebounceTimer) {
      clearTimeout(this.#filterDebounceTimer);
    }

    // Remove dynamically created elements
    this.#filterInput?.parentElement?.remove();
    this.#paginationNav?.remove();
  }

  #setupSorting() {
    const headers = this.#table.querySelectorAll('thead th[data-sort]');

    headers.forEach((th, index) => {
      const sortType = th.getAttribute('data-sort');
      const columnIndex = this.#getColumnIndex(th);

      this.#sortableHeaders.push({
        th,
        sortType,
        columnIndex
      });

      // Make header focusable and interactive
      th.setAttribute('tabindex', '0');
      th.setAttribute('role', 'columnheader');
      th.setAttribute('aria-sort', 'none');

      // Store column index on element for event handler
      th.dataset.columnIndex = columnIndex;

      this.listen(th, 'click', this.#handleHeaderClick);
      this.listen(th, 'keydown', this.#handleHeaderKeyDown);
    });
  }

  #getColumnIndex(th) {
    const row = th.parentElement;
    const cells = [...row.children];
    return cells.indexOf(th);
  }

  #handleHeaderClick = (e) => {
    const th = e.currentTarget;
    const columnIndex = parseInt(th.dataset.columnIndex, 10);
    this.#sortByColumn(columnIndex);
  };

  #handleHeaderKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const th = e.currentTarget;
      const columnIndex = parseInt(th.dataset.columnIndex, 10);
      this.#sortByColumn(columnIndex);
    }
  };

  #isAlreadySorted(columnIndex, sortType, dir) {
    const rows = this.#filteredRows;
    if (rows.length < 2) return true;
    const multiplier = dir === 'asc' ? 1 : -1;
    for (let i = 1; i < rows.length; i++) {
      const a = this.#getSortValue(rows[i - 1].children[columnIndex], sortType);
      const b = this.#getSortValue(rows[i].children[columnIndex], sortType);
      const cmp = typeof a === 'string'
        ? a.localeCompare(b) * multiplier
        : (a - b) * multiplier;
      if (cmp > 0) return false;
    }
    return true;
  }

  #sortByColumn(columnIndex) {
    const headerInfo = this.#sortableHeaders.find(h => h.columnIndex === columnIndex);
    if (!headerInfo) return;

    // Determine new direction
    let direction;
    if (this.#currentSortColumn === columnIndex) {
      direction = this.#currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // First click on this column: if already sorted asc, start desc so
      // the user sees an immediate visible change
      if (this.#isAlreadySorted(columnIndex, headerInfo.sortType, 'asc')) {
        direction = 'desc';
      } else {
        direction = 'asc';
      }
    }

    // Clear previous sort state
    this.#sortableHeaders.forEach(({ th }) => {
      th.setAttribute('aria-sort', 'none');
    });

    // Set new sort state
    headerInfo.th.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');

    this.#currentSortColumn = columnIndex;
    this.#currentSortDirection = direction;

    // Sort the filtered rows
    this.#sortRows(columnIndex, direction, headerInfo.sortType);

    // Reset to first page after sort
    this.#currentPage = 1;

    // Re-render
    this.#render();

    // Dispatch event
    this.dispatchEvent(new CustomEvent('data-table:sort', {
      detail: {
        column: columnIndex,
        direction,
        columnName: headerInfo.th.textContent.trim()
      },
      bubbles: true
    }));
  }

  #sortRows(columnIndex, direction, sortType) {
    const multiplier = direction === 'asc' ? 1 : -1;

    this.#filteredRows.sort((rowA, rowB) => {
      const cellA = rowA.children[columnIndex];
      const cellB = rowB.children[columnIndex];

      if (!cellA || !cellB) return 0;

      const valueA = this.#getSortValue(cellA, sortType);
      const valueB = this.#getSortValue(cellB, sortType);

      let comparison = 0;

      switch (sortType) {
        case 'number':
          comparison = valueA - valueB;
          break;
        case 'date':
          comparison = valueA - valueB;
          break;
        case 'string':
        default:
          comparison = valueA.localeCompare(valueB, undefined, {
            numeric: true,
            sensitivity: 'base'
          });
          break;
      }

      return comparison * multiplier;
    });
  }

  #getSortValue(cell, sortType) {
    // Check for custom sort value
    const customValue = cell.getAttribute('data-sort-value');
    const rawValue = customValue ?? cell.textContent.trim();

    switch (sortType) {
      case 'number':
        return parseFloat(rawValue) || 0;
      case 'date':
        return new Date(rawValue).getTime() || 0;
      case 'string':
      default:
        return rawValue.toLowerCase();
    }
  }

  #setupFiltering() {
    // Create filter input container
    const filterContainer = document.createElement('div');
    filterContainer.setAttribute('data-table-filter', '');

    const filterInput = document.createElement('input');
    filterInput.type = 'search';
    filterInput.setAttribute('data-filter-input', '');
    filterInput.setAttribute('placeholder', 'Filter table...');
    filterInput.setAttribute('aria-label', 'Filter table rows');

    filterContainer.appendChild(filterInput);
    this.insertBefore(filterContainer, this.#table);

    this.#filterInput = filterInput;

    // Add event listener with debounce
    this.listen(filterInput, 'input', this.#handleFilterInput);
  }

  #handleFilterInput = (e) => {
    const query = e.target.value;

    // Debounce
    if (this.#filterDebounceTimer) {
      clearTimeout(this.#filterDebounceTimer);
    }

    this.#filterDebounceTimer = setTimeout(() => {
      this.#applyFilter(query);
    }, 150);
  };

  #applyFilter(query) {
    this.#filterQuery = query.toLowerCase().trim();

    if (this.#filterQuery === '') {
      this.#filteredRows = [...this.#allRows];
    } else {
      this.#filteredRows = this.#allRows.filter(row => {
        // Check each cell for filter value or text content
        const cells = [...row.children];
        return cells.some(cell => {
          const filterValue = cell.getAttribute('data-filter-value');
          const textValue = filterValue ?? cell.textContent;
          return textValue.toLowerCase().includes(this.#filterQuery);
        });
      });
    }

    // Re-apply sort if active
    if (this.#currentSortColumn >= 0 && this.#currentSortDirection) {
      const headerInfo = this.#sortableHeaders.find(h => h.columnIndex === this.#currentSortColumn);
      if (headerInfo) {
        this.#sortRows(this.#currentSortColumn, this.#currentSortDirection, headerInfo.sortType);
      }
    }

    // Reset to first page after filter
    this.#currentPage = 1;

    // Re-render
    this.#render();

    // Dispatch event
    this.dispatchEvent(new CustomEvent('data-table:filter', {
      detail: {
        query: this.#filterQuery,
        count: this.#filteredRows.length
      },
      bubbles: true
    }));
  }

  #setupPagination() {
    // Create pagination nav
    const nav = document.createElement('nav');
    nav.setAttribute('data-pagination', '');
    nav.setAttribute('aria-label', 'Table pagination');

    this.appendChild(nav);
    this.#paginationNav = nav;
  }

  // ==================== ROW EXPANSION ====================

  #setupExpansion() {
    // Use event delegation on the table for expand toggles
    this.listen(this.#table, 'click', this.#handleExpandClick);
  }

  #handleExpandClick = (e) => {
    const button = e.target.closest('[data-action="toggle-expand"]');
    if (!button) return;

    const expandableRow = button.closest('tr[data-expandable]');
    if (!expandableRow) return;

    const isExpanded = expandableRow.hasAttribute('data-state-expanded');
    const expandContentRow = expandableRow.nextElementSibling;

    if (isExpanded) {
      // Collapse
      expandableRow.removeAttribute('data-state-expanded');
      button.setAttribute('aria-expanded', 'false');

      if (expandContentRow?.hasAttribute('data-expand-content')) {
        expandContentRow.hidden = true;
        expandContentRow.setAttribute('aria-hidden', 'true');
      }
    } else {
      // Expand
      expandableRow.setAttribute('data-state-expanded', '');
      button.setAttribute('aria-expanded', 'true');

      if (expandContentRow?.hasAttribute('data-expand-content')) {
        expandContentRow.hidden = false;
        expandContentRow.removeAttribute('aria-hidden');
      }
    }

    // Dispatch event
    this.dispatchEvent(new CustomEvent('data-table:expand', {
      detail: {
        row: expandableRow,
        expanded: !isExpanded
      },
      bubbles: true
    }));
  };

  // ==================== ROW SELECTION ====================

  #setupSelection() {
    // Find select-all checkbox in thead
    this.#selectAllCheckbox = this.#table.querySelector('thead [data-action="select-all"]');
    if (this.#selectAllCheckbox) {
      this.listen(this.#selectAllCheckbox, 'change', this.#handleSelectAllChange);
    }

    // Listen for row selection changes in tbody (event delegation)
    this.listen(this.#tbody, 'change', this.#handleRowSelectChange);

    // Find selected count element scoped to this component instance
    this.#selectedCountElement = this.querySelector('[data-selected-count]');

    // Initial sync of selection state
    this.#syncSelectionState();
  }

  #handleSelectAllChange = (e) => {
    const isChecked = e.target.checked;
    const selectableRows = this.#tbody.querySelectorAll('tr[data-selectable]');

    selectableRows.forEach(row => {
      const checkbox = row.querySelector('[data-action="select-row"]');

      if (isChecked) {
        row.setAttribute('data-state-selected', '');
        if (checkbox) checkbox.checked = true;
      } else {
        row.removeAttribute('data-state-selected');
        if (checkbox) checkbox.checked = false;
      }
    });

    // Clear indeterminate state
    e.target.indeterminate = false;

    this.#updateSelectedCount();
    this.#dispatchSelectionEvent();
  };

  #handleRowSelectChange = (e) => {
    const checkbox = e.target.closest('[data-action="select-row"]');
    if (!checkbox) return;

    const row = checkbox.closest('tr[data-selectable]');
    if (!row) return;

    if (checkbox.checked) {
      row.setAttribute('data-state-selected', '');
    } else {
      row.removeAttribute('data-state-selected');
    }

    this.#syncSelectionState();
    this.#dispatchSelectionEvent();
  };

  #syncSelectionState() {
    if (!this.#selectAllCheckbox) {
      this.#updateSelectedCount();
      return;
    }

    const selectableRows = this.#tbody.querySelectorAll('tr[data-selectable]');
    const selectedRows = this.#tbody.querySelectorAll('tr[data-selectable][data-state-selected]');

    const totalCount = selectableRows.length;
    const selectedCount = selectedRows.length;

    if (selectedCount === 0) {
      this.#selectAllCheckbox.checked = false;
      this.#selectAllCheckbox.indeterminate = false;
    } else if (selectedCount === totalCount) {
      this.#selectAllCheckbox.checked = true;
      this.#selectAllCheckbox.indeterminate = false;
    } else {
      this.#selectAllCheckbox.checked = false;
      this.#selectAllCheckbox.indeterminate = true;
    }

    this.#updateSelectedCount();
  }

  #updateSelectedCount() {
    const selectedRows = this.#tbody.querySelectorAll('tr[data-selectable][data-state-selected]');
    const count = selectedRows.length;

    if (this.#selectedCountElement) {
      this.#selectedCountElement.textContent = count;
    }
  }

  #dispatchSelectionEvent() {
    const selectedRows = [...this.#tbody.querySelectorAll('tr[data-selectable][data-state-selected]')];

    this.dispatchEvent(new CustomEvent('data-table:selection', {
      detail: {
        count: selectedRows.length,
        rows: selectedRows
      },
      bubbles: true
    }));
  }

  #renderPagination() {
    if (!this.#paginationNav || this.#pageSize <= 0) return;

    const nav = this.#paginationNav;
    const totalPages = Math.ceil(this.#filteredRows.length / this.#pageSize);

    // Clear existing content
    nav.innerHTML = '';

    if (totalPages <= 1) {
      return; // No pagination needed
    }

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.textContent = 'Previous';
    prevBtn.setAttribute('data-pagination-prev', '');
    prevBtn.disabled = this.#currentPage === 1;
    prevBtn.addEventListener('click', () => this.goToPage(this.#currentPage - 1));
    nav.appendChild(prevBtn);

    // Page numbers with ellipsis
    const pageNumbers = this.#getPageNumbers(totalPages);

    pageNumbers.forEach(pageNum => {
      if (pageNum === '...') {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.setAttribute('data-pagination-ellipsis', '');
        nav.appendChild(ellipsis);
      } else {
        const pageBtn = document.createElement('button');
        pageBtn.type = 'button';
        pageBtn.textContent = pageNum;
        pageBtn.setAttribute('data-pagination-page', '');

        if (pageNum === this.#currentPage) {
          pageBtn.setAttribute('aria-current', 'page');
          pageBtn.setAttribute('data-current', '');
        }

        pageBtn.addEventListener('click', () => this.goToPage(pageNum));
        nav.appendChild(pageBtn);
      }
    });

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.textContent = 'Next';
    nextBtn.setAttribute('data-pagination-next', '');
    nextBtn.disabled = this.#currentPage === totalPages;
    nextBtn.addEventListener('click', () => this.goToPage(this.#currentPage + 1));
    nav.appendChild(nextBtn);
  }

  #getPageNumbers(totalPages) {
    const current = this.#currentPage;
    const pages = [];

    if (totalPages <= 7) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      // Pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  }

  #render() {
    // First, hide all rows
    this.#allRows.forEach(row => {
      row.setAttribute('data-state-hidden', '');
    });

    // Determine which rows to show
    let rowsToShow;

    if (this.#pageSize > 0) {
      const startIndex = (this.#currentPage - 1) * this.#pageSize;
      const endIndex = startIndex + this.#pageSize;
      rowsToShow = this.#filteredRows.slice(startIndex, endIndex);
    } else {
      rowsToShow = this.#filteredRows;
    }

    // Show visible rows and reorder DOM — keep expansion content rows with parents
    rowsToShow.forEach(row => {
      row.removeAttribute('data-state-hidden');
      this.#tbody.appendChild(row);
      // If this row has an expansion content row, move it right after
      const contentRow = row.nextElementSibling?.hasAttribute?.('data-expand-content')
        ? row.nextElementSibling
        : this.#findContentRow(row);
      if (contentRow) this.#tbody.appendChild(contentRow);
    });

    // Move hidden filtered rows to end (with their content rows)
    this.#filteredRows.forEach(row => {
      if (row.hasAttribute('data-state-hidden')) {
        this.#tbody.appendChild(row);
        const contentRow = this.#findContentRow(row);
        if (contentRow) this.#tbody.appendChild(contentRow);
      }
    });

    // Move rows not in filtered set to very end
    this.#allRows.forEach(row => {
      if (!this.#filteredRows.includes(row)) {
        this.#tbody.appendChild(row);
        const contentRow = this.#findContentRow(row);
        if (contentRow) this.#tbody.appendChild(contentRow);
      }
    });

    // Update pagination
    this.#renderPagination();
  }

  /** Find the expansion content row for a given expandable row */
  #findContentRow(row) {
    if (!row.hasAttribute('data-expandable')) return null;
    const next = row.nextElementSibling;
    return next?.hasAttribute('data-expand-content') ? next : null;
  }

  // ==================== PUBLIC API ====================

  /**
   * Navigate to a specific page
   * @param {number} page - Page number (1-indexed)
   */
  goToPage(page) {
    const totalPages = Math.ceil(this.#filteredRows.length / this.#pageSize);
    const newPage = Math.max(1, Math.min(page, totalPages));

    if (newPage === this.#currentPage) return;

    this.#currentPage = newPage;
    this.#render();

    this.dispatchEvent(new CustomEvent('data-table:page', {
      detail: { page: this.#currentPage },
      bubbles: true
    }));
  }

  /**
   * Set filter query programmatically
   * @param {string} query - Filter query string
   */
  setFilter(query) {
    if (this.#filterInput) {
      this.#filterInput.value = query;
    }
    this.#applyFilter(query);
  }

  /**
   * Re-scan rows after DOM changes
   * Call this if rows are added/removed dynamically
   */
  refresh() {
    // Re-collect rows
    this.#allRows = [...this.#tbody.querySelectorAll(':scope > tr')];

    // Re-apply current filter
    if (this.#filterQuery) {
      this.#applyFilter(this.#filterQuery);
    } else {
      this.#filteredRows = [...this.#allRows];
    }

    // Re-apply sort if active
    if (this.#currentSortColumn >= 0 && this.#currentSortDirection) {
      const headerInfo = this.#sortableHeaders.find(h => h.columnIndex === this.#currentSortColumn);
      if (headerInfo) {
        this.#sortRows(this.#currentSortColumn, this.#currentSortDirection, headerInfo.sortType);
      }
    }

    // Ensure current page is valid
    const totalPages = Math.max(1, Math.ceil(this.#filteredRows.length / this.#pageSize));
    if (this.#currentPage > totalPages) {
      this.#currentPage = totalPages;
    }

    this.#render();
  }

  /**
   * Get current page number
   * @returns {number}
   */
  get currentPage() {
    return this.#currentPage;
  }

  /**
   * Get total number of pages
   * @returns {number}
   */
  get totalPages() {
    if (this.#pageSize <= 0) return 1;
    return Math.ceil(this.#filteredRows.length / this.#pageSize);
  }

  /**
   * Get count of filtered rows
   * @returns {number}
   */
  get filteredCount() {
    return this.#filteredRows.length;
  }

  /**
   * Get total row count
   * @returns {number}
   */
  get totalCount() {
    return this.#allRows.length;
  }

  /**
   * Get array of currently selected row elements
   * @returns {HTMLTableRowElement[]}
   */
  getSelectedRows() {
    if (!this.#tbody) return [];
    return [...this.#tbody.querySelectorAll('tr[data-selectable][data-state-selected]')];
  }
}

registerComponent('data-table', DataTable);

export { DataTable };
