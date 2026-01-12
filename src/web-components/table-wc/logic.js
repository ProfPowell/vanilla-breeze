/**
 * table-wc: Enhanced table with sorting, filtering, and pagination
 *
 * Wraps a standard HTML table and adds interactive features based on
 * data attributes. Progressive enhancement - table works without JS.
 *
 * @attr {boolean} data-filterable - Enable text search filtering
 * @attr {number} data-paginate - Enable pagination with N rows per page
 *
 * Table header attributes:
 * @attr {string} data-sort - Column sort type: "string", "number", "date"
 *
 * Cell attributes:
 * @attr {string} data-sort-value - Custom value for sorting
 * @attr {string} data-filter-value - Custom value for filtering
 *
 * State attributes (set by component):
 * @attr {string} data-state-sorted - Sort direction: "asc" or "desc"
 * @attr {boolean} data-state-hidden - Row is hidden (filtered or paginated)
 *
 * @fires table:sort - When a column is sorted { column, direction, columnName }
 * @fires table:filter - When filter query changes { query, count }
 * @fires table:page - When page changes { page }
 * @fires table:expand - When row is expanded/collapsed { row, expanded }
 * @fires table:selection - When row selection changes { count, rows }
 *
 * @example
 * <table-wc>
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
 * </table-wc>
 */
class TableWc extends HTMLElement {
  #table;
  #tbody;
  #sortableHeaders = [];
  #allRows = [];
  #filteredRows = [];
  #currentSortColumn = -1;
  #currentSortDirection = null;
  #currentPage = 1;
  #pageSize = 0;
  #filterInput = null;
  #paginationNav = null;
  #filterDebounceTimer = null;
  #filterQuery = '';
  #selectAllCheckbox = null;
  #selectedCountElement = null;

  connectedCallback() {
    this.#table = this.querySelector(':scope > table');
    if (!this.#table) return;

    this.#tbody = this.#table.querySelector('tbody');
    if (!this.#tbody) return;

    this.#setup();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #setup() {
    // Collect all body rows
    this.#allRows = [...this.#tbody.querySelectorAll(':scope > tr')];
    this.#filteredRows = [...this.#allRows];

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

  #cleanup() {
    if (this.#filterDebounceTimer) {
      clearTimeout(this.#filterDebounceTimer);
    }

    // Remove dynamically created elements
    this.#filterInput?.parentElement?.remove();
    this.#paginationNav?.remove();

    // Remove event listeners from headers
    this.#sortableHeaders.forEach(({ th }) => {
      th.removeEventListener('click', this.#handleHeaderClick);
      th.removeEventListener('keydown', this.#handleHeaderKeyDown);
    });

    // Remove expansion listeners
    this.#table?.removeEventListener('click', this.#handleExpandClick);

    // Remove selection listeners
    this.#selectAllCheckbox?.removeEventListener('change', this.#handleSelectAllChange);
    this.#tbody?.removeEventListener('change', this.#handleRowSelectChange);
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

      th.addEventListener('click', this.#handleHeaderClick);
      th.addEventListener('keydown', this.#handleHeaderKeyDown);
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

  #sortByColumn(columnIndex) {
    const headerInfo = this.#sortableHeaders.find(h => h.columnIndex === columnIndex);
    if (!headerInfo) return;

    // Determine new direction
    let direction;
    if (this.#currentSortColumn === columnIndex) {
      direction = this.#currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      direction = 'asc';
    }

    // Clear previous sort state
    this.#sortableHeaders.forEach(({ th }) => {
      th.removeAttribute('data-state-sorted');
      th.setAttribute('aria-sort', 'none');
    });

    // Set new sort state
    headerInfo.th.setAttribute('data-state-sorted', direction);
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
    this.dispatchEvent(new CustomEvent('table:sort', {
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
    filterInput.addEventListener('input', this.#handleFilterInput);
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
    this.dispatchEvent(new CustomEvent('table:filter', {
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
    this.#table.addEventListener('click', this.#handleExpandClick);
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
    this.dispatchEvent(new CustomEvent('table:expand', {
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
      this.#selectAllCheckbox.addEventListener('change', this.#handleSelectAllChange);
    }

    // Listen for row selection changes in tbody (event delegation)
    this.#tbody.addEventListener('change', this.#handleRowSelectChange);

    // Find selected count element if present
    this.#selectedCountElement = document.querySelector('[data-selected-count]');

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

    this.dispatchEvent(new CustomEvent('table:selection', {
      detail: {
        count: selectedRows.length,
        rows: selectedRows
      },
      bubbles: true
    }));
  }

  #renderPagination() {
    if (!this.#paginationNav || this.#pageSize <= 0) return;

    const totalPages = Math.ceil(this.#filteredRows.length / this.#pageSize);

    // Clear existing content
    this.#paginationNav.innerHTML = '';

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
    this.#paginationNav.appendChild(prevBtn);

    // Page numbers with ellipsis
    const pageNumbers = this.#getPageNumbers(totalPages);

    pageNumbers.forEach(pageNum => {
      if (pageNum === '...') {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.setAttribute('data-pagination-ellipsis', '');
        this.#paginationNav.appendChild(ellipsis);
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
        this.#paginationNav.appendChild(pageBtn);
      }
    });

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.textContent = 'Next';
    nextBtn.setAttribute('data-pagination-next', '');
    nextBtn.disabled = this.#currentPage === totalPages;
    nextBtn.addEventListener('click', () => this.goToPage(this.#currentPage + 1));
    this.#paginationNav.appendChild(nextBtn);
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

    // Show visible rows and reorder DOM
    rowsToShow.forEach(row => {
      row.removeAttribute('data-state-hidden');
      // Move row to end of tbody to maintain sort order visually
      this.#tbody.appendChild(row);
    });

    // Move hidden filtered rows to end (maintains DOM order for hidden rows)
    this.#filteredRows.forEach(row => {
      if (row.hasAttribute('data-state-hidden')) {
        this.#tbody.appendChild(row);
      }
    });

    // Move rows not in filtered set to very end
    this.#allRows.forEach(row => {
      if (!this.#filteredRows.includes(row)) {
        this.#tbody.appendChild(row);
      }
    });

    // Update pagination
    this.#renderPagination();
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

    this.dispatchEvent(new CustomEvent('table:page', {
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

customElements.define('table-wc', TableWc);

export { TableWc };
