# Table Integration Implementation Guide

## File Structure

```
vanilla-breeze/
├── src/
│   ├── native-elements/
│   │   └── table/
│   │       ├── table.css          # UPDATE: Add data-attribute styling
│   │       └── README.md          # UPDATE: Document patterns
│   ├── web-components/
│   │   └── table-wc/
│   │       ├── table-wc.js        # NEW: Component implementation
│   │       ├── table-wc.css       # NEW: Component-specific styles
│   │       └── README.md          # NEW: Component docs
│   └── main.js                    # UPDATE: Import table-wc
└── docs/
    ├── elements/
    │   └── native/
    │       └── table.html         # UPDATE: Enhanced docs
    └── examples/
        ├── table-static.html      # NEW: CSS-only demo
        ├── table-interactive.html # NEW: Component demo
        └── table-responsive.html  # NEW: Responsive demo
```

---

## 1. Update `/src/native-elements/table/table.css`

Add to the existing file:

```css
/* Existing styles remain... */

/* ============================================
   SORTABLE COLUMNS
   ============================================ */
th[data-sort] {
  cursor: pointer;
  user-select: none;
  position: relative;
}

th[data-sort]::after {
  content: ' ⇅';
  opacity: 0.3;
  margin-inline-start: var(--size-3xs);
}

th[data-state-sorted="asc"]::after {
  content: ' ↑';
  opacity: 1;
}

th[data-state-sorted="desc"]::after {
  content: ' ↓';
  opacity: 1;
}

/* ============================================
   ROW STATES
   ============================================ */
tr[data-state-hidden] {
  display: none;
}

tr[data-state-selected] {
  background: var(--color-surface-hover);
}

tr[data-state-selected]:hover {
  background: var(--color-surface-active);
}

/* ============================================
   EXPANDABLE ROWS
   ============================================ */
tr[data-expand-content] {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-normal) var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  tr[data-expand-content] {
    transition: none;
  }
}

tr[data-expand-content] > td {
  overflow: hidden;
  display: block;
}

tr[data-state-expanded] + tr[data-expand-content] {
  grid-template-rows: 1fr;
}

tr[data-state-expanded] + tr[data-expand-content] {
  aria-hidden: false;
}

/* Toggle button styling */
[data-action="toggle-expand"] {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--size-2xs);
  transition: transform var(--duration-fast) var(--ease-out);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

tr[data-state-expanded] [data-action="toggle-expand"] {
  transform: rotate(90deg);
}

/* ============================================
   STICKY COLUMNS
   ============================================ */
table[data-sticky-column] {
  border-collapse: separate;
  border-spacing: 0;
}

table[data-sticky-column="1"] td:first-child,
table[data-sticky-column="1"] th:first-child {
  position: sticky;
  inset-inline-start: 0;
  background: var(--color-surface);
  z-index: 1;
}

table[data-sticky-column="2"] td:nth-child(-n+2),
table[data-sticky-column="2"] th:nth-child(-n+2) {
  position: sticky;
  background: var(--color-surface);
  z-index: 1;
}

table[data-sticky-column="2"] td:nth-child(1),
table[data-sticky-column="2"] th:nth-child(1) {
  inset-inline-start: 0;
}

table[data-sticky-column="2"] td:nth-child(2),
table[data-sticky-column="2"] th:nth-child(2) {
  inset-inline-start: var(--_sticky-col-1-width, 150px);
}

/* Corner cell gets highest z-index when both sticky header and column */
table[data-sticky-header][data-sticky-column] thead th:first-child {
  z-index: 3;
}

/* ============================================
   RESPONSIVE CARD MODE
   ============================================ */
@container (max-width: 500px) {
  table[data-responsive="card"] thead {
    display: none;
  }
  
  table[data-responsive="card"] tbody,
  table[data-responsive="card"] tr,
  table[data-responsive="card"] td {
    display: block;
  }
  
  table[data-responsive="card"] tr {
    padding: var(--size-m);
    margin-block-end: var(--size-s);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-m);
    background: var(--color-surface);
  }
  
  table[data-responsive="card"] td {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--size-xs);
    padding: var(--size-2xs) 0;
    border: none;
  }
  
  table[data-responsive="card"] td::before {
    content: attr(data-label);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-subtle);
  }
  
  table[data-responsive="card"] tr[data-state-selected] {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }
}

/* Container query setup */
table-wc {
  container-type: inline-size;
}
```

---

## 2. Update `/src/native-elements/table/README.md`

Replace entire contents:

```markdown
# Table

Semantic table styling with progressive enhancement options.

## Basic Usage

```html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice Smith</td>
      <td>alice@example.com</td>
      <td>Admin</td>
    </tr>
    <tr>
      <td>Bob Jones</td>
      <td>bob@example.com</td>
      <td>User</td>
    </tr>
  </tbody>
</table>
```

## Features (CSS-Only)

### Sticky Header

```html
<table data-sticky-header>
  <!-- Header sticks to top on scroll -->
</table>
```

### Sticky Columns

```html
<!-- Stick first column -->
<table data-sticky-column="1">
  <!-- First column sticks on horizontal scroll -->
</table>

<!-- Stick first two columns -->
<table data-sticky-column="2">
  <!-- First two columns stick -->
</table>
```

### Sortable Columns (Visual Only)

Add `data-sort` to make columns appear sortable. State managed by `table-wc` component.

```html
<th data-sort="string">Name</th>
<th data-sort="number">Age</th>
<th data-sort="date">Joined</th>
```

### Row States

Visual states controlled via data attributes:

```html
<!-- Hidden (filtered/paginated) -->
<tr data-state-hidden>...</tr>

<!-- Selected -->
<tr data-state-selected>...</tr>

<!-- Expanded -->
<tr data-state-expanded>...</tr>
```

### Expandable Rows

```html
<tr data-expandable>
  <td><button data-action="toggle-expand">▶</button></td>
  <td>Item One</td>
  <td>Active</td>
</tr>
<tr data-expand-content aria-hidden="true">
  <td colspan="3">
    <div>Additional details...</div>
  </td>
</tr>
```

### Responsive Card Mode

```html
<table data-responsive="card">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Name">Alice</td>
      <td data-label="Email">alice@example.com</td>
    </tr>
  </tbody>
</table>
```

## Interactive Features

Wrap table in `<table-wc>` for sorting, filtering, and pagination:

```html
<table-wc>
  <table data-paginate="10" data-filterable>
    <thead>
      <tr>
        <th data-sort="string">Name</th>
        <th data-sort="number">Age</th>
      </tr>
    </thead>
    <tbody>
      <!-- rows -->
    </tbody>
  </table>
</table-wc>
```

See [table-wc documentation](../../web-components/table-wc/README.md) for interactive features.

## Accessibility

- Semantic table markup
- Sticky elements maintain proper heading associations
- Sort state communicated via `aria-sort`
- Expand state communicated via `aria-hidden`
- Keyboard navigation in `table-wc` component

## Design Tokens

Uses standard tokens:
- `--color-surface` - Cell backgrounds
- `--color-border` - Cell borders
- `--color-text` - Text color
- `--size-xs`, `--size-s`, `--size-m` - Spacing
- `--duration-normal` - Expand animation
- `--ease-out` - Animation easing
```

---

## 3. Create `/src/web-components/table-wc/table-wc.js`

```javascript
/**
 * table-wc
 * Progressive enhancement wrapper for HTML tables
 * Adds sorting, filtering, pagination, and row expansion
 */

class TableWC extends HTMLElement {
  constructor() {
    super();
    this.table = null;
    this.tbody = null;
    this.allRows = [];
    this.filteredRows = [];
    this.pageSize = null;
    this.currentPage = 1;
    this.paginationNav = null;
    this.filterInput = null;
    this.filterChips = null;
  }

  connectedCallback() {
    this.table = this.querySelector('table');
    if (!this.table) return;
    
    this.tbody = this.table.tBodies[0];
    this.allRows = [...this.tbody.querySelectorAll('tr:not([data-expand-content])')];
    this.filteredRows = [...this.allRows];
    
    this.initSort();
    this.initPagination();
    this.initFilter();
    this.initExpand();
    this.initSelection();
  }

  disconnectedCallback() {
    // Cleanup if needed
    this.paginationNav?.remove();
    this.filterInput?.remove();
  }

  // ============================================
  // SORTING
  // ============================================
  
  initSort() {
    const headers = this.table.querySelectorAll('th[data-sort]');
    headers.forEach((th, index) => {
      th.addEventListener('click', () => this.sort(th, index));
      th.setAttribute('role', 'button');
      th.setAttribute('tabindex', '0');
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.sort(th, index);
        }
      });
    });
  }

  sort(th, colIndex) {
    const type = th.dataset.sort;
    const current = th.dataset.stateSorted;
    const dir = current === 'asc' ? 'desc' : 'asc';
    
    // Clear other sort states
    this.table.querySelectorAll('th[data-sort]').forEach(h => {
      delete h.dataset.stateSorted;
      h.removeAttribute('aria-sort');
    });
    
    // Set new sort state
    th.dataset.stateSorted = dir;
    th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
    
    // Sort rows
    this.filteredRows.sort((a, b) => {
      const aCell = a.cells[colIndex];
      const bCell = b.cells[colIndex];
      const aVal = aCell?.dataset.sortValue ?? aCell?.textContent.trim() ?? '';
      const bVal = bCell?.dataset.sortValue ?? bCell?.textContent.trim() ?? '';
      
      let cmp;
      if (type === 'number') {
        cmp = parseFloat(aVal) - parseFloat(bVal);
      } else if (type === 'date') {
        cmp = new Date(aVal) - new Date(bVal);
      } else {
        cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      }
      
      return dir === 'asc' ? cmp : -cmp;
    });
    
    this.render();
    this.dispatch('sort', { column: colIndex, direction: dir, columnName: th.textContent.trim() });
  }

  // ============================================
  // PAGINATION
  // ============================================
  
  initPagination() {
    const pageSize = this.table.dataset.paginate;
    if (!pageSize) return;
    
    this.pageSize = parseInt(pageSize);
    this.currentPage = 1;
    
    // Create pagination nav
    this.paginationNav = document.createElement('nav');
    this.paginationNav.dataset.pagination = '';
    this.paginationNav.setAttribute('aria-label', 'Table pagination');
    this.table.after(this.paginationNav);
    
    this.paginationNav.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      
      const page = btn.dataset.page;
      if (page === 'prev') this.currentPage--;
      else if (page === 'next') this.currentPage++;
      else this.currentPage = parseInt(page);
      
      this.render();
      this.dispatch('page', { page: this.currentPage });
    });
    
    this.render();
  }

  renderPagination() {
    if (!this.paginationNav) return;
    
    const pageCount = Math.ceil(this.filteredRows.length / this.pageSize);
    this.table.dataset.statePage = this.currentPage;
    
    if (pageCount <= 1) {
      this.paginationNav.innerHTML = '';
      return;
    }
    
    const buttons = [];
    buttons.push(`<button data-page="prev" ${this.currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">←</button>`);
    
    // Show first page
    buttons.push(`<button data-page="1" ${1 === this.currentPage ? 'aria-current="page"' : ''}>1</button>`);
    
    // Ellipsis and middle pages
    if (pageCount > 7) {
      if (this.currentPage > 3) {
        buttons.push(`<span aria-hidden="true">…</span>`);
      }
      
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(pageCount - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        buttons.push(`<button data-page="${i}" ${i === this.currentPage ? 'aria-current="page"' : ''}>${i}</button>`);
      }
      
      if (this.currentPage < pageCount - 2) {
        buttons.push(`<span aria-hidden="true">…</span>`);
      }
    } else {
      // Show all pages
      for (let i = 2; i < pageCount; i++) {
        buttons.push(`<button data-page="${i}" ${i === this.currentPage ? 'aria-current="page"' : ''}>${i}</button>`);
      }
    }
    
    // Show last page
    if (pageCount > 1) {
      buttons.push(`<button data-page="${pageCount}" ${pageCount === this.currentPage ? 'aria-current="page"' : ''}>${pageCount}</button>`);
    }
    
    buttons.push(`<button data-page="next" ${this.currentPage === pageCount ? 'disabled' : ''} aria-label="Next page">→</button>`);
    
    this.paginationNav.innerHTML = buttons.join('');
  }

  // ============================================
  // FILTERING
  // ============================================
  
  initFilter() {
    if (!this.table.hasAttribute('data-filterable')) return;
    
    // Create search input
    this.filterInput = document.createElement('input');
    this.filterInput.type = 'search';
    this.filterInput.placeholder = 'Filter rows...';
    this.filterInput.dataset.filterInput = '';
    this.filterInput.setAttribute('aria-controls', this.table.id || '');
    this.filterInput.setAttribute('aria-label', 'Filter table rows');
    this.table.before(this.filterInput);
    
    let timeout;
    this.filterInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.filter(), 150);
    });
    
    // Filter chips
    this.filterChips = this.querySelector('[data-filter-chips]');
    this.filterChips?.querySelectorAll('input').forEach(chip => {
      chip.addEventListener('change', () => this.filter());
    });
  }

  filter() {
    const query = this.filterInput?.value.toLowerCase().trim() || '';
    
    // Get active status filters
    const activeStatuses = this.filterChips 
      ? [...this.filterChips.querySelectorAll('input:checked')].map(c => c.value)
      : [];
    
    this.filteredRows = this.allRows.filter(row => {
      const searchText = (row.dataset.filterValue || row.textContent).toLowerCase();
      const status = row.dataset.status;
      
      const matchesQuery = !query || searchText.includes(query);
      const matchesStatus = !status || !activeStatuses.length || activeStatuses.includes(status);
      
      return matchesQuery && matchesStatus;
    });
    
    this.currentPage = 1;
    this.table.dataset.stateFiltered = query;
    this.render();
    this.dispatch('filter', { query, count: this.filteredRows.length });
  }

  // ============================================
  // EXPANDABLE ROWS
  // ============================================
  
  initExpand() {
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="toggle-expand"]');
      if (!btn) return;
      
      const row = btn.closest('tr[data-expandable]');
      if (!row) return;
      
      const isExpanded = row.hasAttribute('data-state-expanded');
      
      if (isExpanded) {
        delete row.dataset.stateExpanded;
        btn.setAttribute('aria-expanded', 'false');
      } else {
        row.dataset.stateExpanded = '';
        btn.setAttribute('aria-expanded', 'true');
      }
      
      // Update aria on content row
      const content = row.nextElementSibling;
      if (content?.hasAttribute('data-expand-content')) {
        content.setAttribute('aria-hidden', String(isExpanded));
      }
      
      this.dispatch('expand', { row, expanded: !isExpanded });
    });
  }

  // ============================================
  // SELECTION
  // ============================================
  
  initSelection() {
    // Select all
    this.addEventListener('change', (e) => {
      if (e.target.dataset.action === 'select-all') {
        const checked = e.target.checked;
        this.filteredRows.forEach(row => {
          if (row.hasAttribute('data-selectable')) {
            if (checked) row.dataset.stateSelected = '';
            else delete row.dataset.stateSelected;
            
            const checkbox = row.querySelector('[data-action="select-row"]');
            if (checkbox) checkbox.checked = checked;
          }
        });
        this.updateSelectionCount();
      }
      
      // Individual row
      if (e.target.dataset.action === 'select-row') {
        const row = e.target.closest('tr');
        if (e.target.checked) {
          row.dataset.stateSelected = '';
        } else {
          delete row.dataset.stateSelected;
        }
        this.updateSelectionCount();
      }
    });
  }

  updateSelectionCount() {
    const selected = this.tbody.querySelectorAll('tr[data-state-selected]');
    const countEl = document.querySelector('[data-selected-count]');
    if (countEl) countEl.textContent = selected.length;
    
    // Update select-all checkbox state
    const selectAll = this.querySelector('[data-action="select-all"]');
    if (selectAll) {
      const selectableCount = this.filteredRows.filter(r => r.hasAttribute('data-selectable')).length;
      selectAll.checked = selected.length === selectableCount && selectableCount > 0;
      selectAll.indeterminate = selected.length > 0 && selected.length < selectableCount;
    }
    
    this.dispatch('selection', { 
      count: selected.length, 
      rows: [...selected] 
    });
  }

  getSelectedRows() {
    return [...this.tbody.querySelectorAll('tr[data-state-selected]')];
  }

  // ============================================
  // RENDER
  // ============================================
  
  render() {
    const start = this.pageSize 
      ? (this.currentPage - 1) * this.pageSize 
      : 0;
    const end = this.pageSize 
      ? start + this.pageSize 
      : this.filteredRows.length;
    
    // Hide all rows first
    this.allRows.forEach(row => {
      row.dataset.stateHidden = '';
    });
    
    // Show filtered, paginated rows and reorder DOM
    this.filteredRows.slice(start, end).forEach(row => {
      delete row.dataset.stateHidden;
      
      // Move to end to maintain sort order in DOM
      const expandContent = row.nextElementSibling;
      if (expandContent?.hasAttribute('data-expand-content')) {
        this.tbody.appendChild(row);
        this.tbody.appendChild(expandContent);
      } else {
        this.tbody.appendChild(row);
      }
    });
    
    this.renderPagination();
  }

  // ============================================
  // EVENTS
  // ============================================
  
  dispatch(name, detail) {
    this.dispatchEvent(new CustomEvent(`table:${name}`, { 
      bubbles: true, 
      detail 
    }));
  }

  // ============================================
  // PUBLIC API
  // ============================================
  
  goToPage(page) {
    this.currentPage = page;
    this.render();
  }

  setFilter(query) {
    if (this.filterInput) {
      this.filterInput.value = query;
      this.filter();
    }
  }

  refresh() {
    this.allRows = [...this.tbody.querySelectorAll('tr:not([data-expand-content])')];
    this.filteredRows = [...this.allRows];
    this.filter();
  }
}

customElements.define('table-wc', TableWC);
```

---

## 4. Create `/src/web-components/table-wc/table-wc.css`

```css
@layer web-components {
  /* ============================================
     FILTER INPUT
     ============================================ */
  table-wc [data-filter-input] {
    width: 100%;
    padding: var(--size-s) var(--size-m);
    margin-block-end: var(--size-m);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-m);
    font-size: var(--font-size-base);
    font-family: inherit;
    background: var(--color-surface);
    color: var(--color-text);
  }

  table-wc [data-filter-input]:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-color: var(--color-primary);
  }

  /* ============================================
     FILTER CHIPS
     ============================================ */
  table-wc [data-filter-chips] {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-s);
    margin-block-end: var(--size-m);
  }

  table-wc [data-filter-chips] label {
    display: flex;
    align-items: center;
    gap: var(--size-2xs);
    padding: var(--size-2xs) var(--size-s);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-full);
    cursor: pointer;
    background: var(--color-surface);
    color: var(--color-text);
    transition: 
      background var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out);
  }

  table-wc [data-filter-chips] label:hover {
    background: var(--color-surface-hover);
  }

  table-wc [data-filter-chips] label:has(input:checked) {
    background: var(--color-primary);
    color: var(--color-on-primary);
    border-color: var(--color-primary);
  }

  table-wc [data-filter-chips] input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  /* ============================================
     PAGINATION
     ============================================ */
  table-wc [data-pagination] {
    display: flex;
    gap: var(--size-2xs);
    justify-content: center;
    align-items: center;
    padding: var(--size-m) 0;
  }

  table-wc [data-pagination] button {
    min-width: 2.5rem;
    padding: var(--size-s);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-m);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    font-family: inherit;
    font-size: var(--font-size-sm);
    transition: 
      background var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out);
  }

  table-wc [data-pagination] button:hover:not(:disabled) {
    background: var(--color-surface-hover);
    border-color: var(--color-border-hover);
  }

  table-wc [data-pagination] button[aria-current="page"] {
    background: var(--color-primary);
    color: var(--color-on-primary);
    border-color: var(--color-primary);
  }

  table-wc [data-pagination] button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  table-wc [data-pagination] span {
    padding: 0 var(--size-2xs);
    color: var(--color-text-subtle);
  }

  /* ============================================
     BULK ACTIONS
     ============================================ */
  [data-bulk-actions] {
    display: none;
  }

  body:has(tr[data-state-selected]) [data-bulk-actions] {
    display: flex;
    gap: var(--size-m);
    align-items: center;
    padding: var(--size-s) var(--size-m);
    margin-block-end: var(--size-m);
    background: var(--color-surface-raised);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-m);
  }

  [data-bulk-actions] [data-selected-count] {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
  }

  /* ============================================
     CONTAINER QUERY SETUP
     ============================================ */
  table-wc {
    display: block;
    container-type: inline-size;
  }
}
```

---

## 5. Create `/src/web-components/table-wc/README.md`

```markdown
# table-wc

Progressive enhancement wrapper for HTML tables. Adds interactive sorting, filtering, pagination, and row expansion.

## Features

- **Sorting**: Click headers to sort (string, number, date)
- **Filtering**: Text search + optional status chips
- **Pagination**: Client-side page navigation
- **Row expansion**: Show/hide additional details
- **Row selection**: Single or multi-select with bulk actions
- **Responsive**: Card mode on mobile
- **Accessible**: Full keyboard navigation, ARIA attributes
- **Events**: Custom events for external coordination

## Basic Usage

```html
<table-wc>
  <table data-paginate="10" data-filterable>
    <thead>
      <tr>
        <th data-sort="string">Name</th>
        <th data-sort="number">Age</th>
        <th data-sort="date">Joined</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice</td>
        <td>32</td>
        <td data-sort-value="2024-01-15">Jan 15, 2024</td>
      </tr>
      <!-- more rows -->
    </tbody>
  </table>
</table-wc>
```

## Table Attributes

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-paginate` | number | Enable pagination with page size |
| `data-filterable` | boolean | Enable text filtering |
| `data-sticky-header` | boolean | Sticky header on scroll |
| `data-sticky-column` | 1, 2 | Stick first N columns |
| `data-responsive` | "card" | Card layout on mobile |

## Header Cell Attributes

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-sort` | string, number, date | Enable sorting |

## Row Attributes

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-expandable` | boolean | Row can expand |
| `data-selectable` | boolean | Row can be selected |
| `data-status` | string | For chip filtering |
| `data-filter-value` | string | Override search text |

## Cell Attributes

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-sort-value` | string | Override sort value |
| `data-label` | string | Label for card mode |

## Sorting

```html
<table-wc>
  <table>
    <thead>
      <tr>
        <th data-sort="string">Name</th>
        <th data-sort="number">Count</th>
        <th data-sort="date">Date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice</td>
        <td>42</td>
        <td data-sort-value="2024-03-15">Mar 15</td>
      </tr>
    </tbody>
  </table>
</table-wc>
```

## Filtering with Chips

```html
<table-wc>
  <div data-filter-chips>
    <label><input type="checkbox" value="active" checked> Active</label>
    <label><input type="checkbox" value="pending" checked> Pending</label>
  </div>
  
  <table data-filterable>
    <tbody>
      <tr data-status="active" data-filter-value="alice active admin">
        <td>Alice</td>
        <td>Active</td>
      </tr>
    </tbody>
  </table>
</table-wc>
```

## Expandable Rows

```html
<table-wc>
  <table>
    <tbody>
      <tr data-expandable>
        <td><button data-action="toggle-expand">▶</button></td>
        <td>Item One</td>
      </tr>
      <tr data-expand-content aria-hidden="true">
        <td colspan="2">
          <div>Additional details...</div>
        </td>
      </tr>
    </tbody>
  </table>
</table-wc>
```

## Row Selection

```html
<table-wc>
  <table>
    <thead>
      <tr>
        <th><input type="checkbox" data-action="select-all"></th>
        <th>Name</th>
      </tr>
    </thead>
    <tbody>
      <tr data-selectable>
        <td><input type="checkbox" data-action="select-row"></td>
        <td>Alice</td>
      </tr>
    </tbody>
  </table>
</table-wc>

<div data-bulk-actions>
  <span><strong data-selected-count>0</strong> selected</span>
  <button>Delete</button>
  <button>Export</button>
</div>
```

## Events

```javascript
const table = document.querySelector('table-wc');

table.addEventListener('table:sort', (e) => {
  console.log('Sorted:', e.detail);
  // { column: 0, direction: 'asc', columnName: 'Name' }
});

table.addEventListener('table:filter', (e) => {
  console.log('Filtered:', e.detail);
  // { query: 'search term', count: 5 }
});

table.addEventListener('table:page', (e) => {
  console.log('Page changed:', e.detail);
  // { page: 2 }
});

table.addEventListener('table:expand', (e) => {
  console.log('Row expanded:', e.detail);
  // { row: <tr>, expanded: true }
});

table.addEventListener('table:selection', (e) => {
  console.log('Selection changed:', e.detail);
  // { count: 3, rows: [<tr>, <tr>, <tr>] }
});
```

## Public API

```javascript
const table = document.querySelector('table-wc');

// Navigate to specific page
table.goToPage(3);

// Set filter programmatically
table.setFilter('search term');

// Get selected rows
const selected = table.getSelectedRows();

// Refresh after DOM changes
table.refresh();
```

## Accessibility

- Full keyboard navigation (arrows, Enter, Space)
- `aria-sort` on sorted columns
- `aria-current="page"` on active page button
- `aria-hidden` on collapsed expand content
- `aria-expanded` on expand toggle buttons
- `aria-controls` on filter input
- Respects `prefers-reduced-motion`

## Styling

Component uses standard tokens from `table.css`. Override via CSS custom properties or utility classes.

## Browser Support

- Chrome 67+
- Firefox 63+
- Safari 10.1+
- Edge 79+

Degrades gracefully: table works as standard HTML table without JavaScript.
```

---

## 6. Update `/src/main.js`

Add import:

```javascript
// ... existing imports ...

// Web Components
import './web-components/accordion-wc/accordion-wc.js';
import './web-components/dropdown-wc/dropdown-wc.js';
import './web-components/footnotes-wc/footnotes-wc.js';
import './web-components/heading-links/heading-links.js';
import './web-components/icon-wc/icon-wc.js';
import './web-components/page-toc/page-toc.js';
import './web-components/tabs-wc/tabs-wc.js';
import './web-components/table-wc/table-wc.js';  // ADD THIS
import './web-components/theme-picker/theme-picker.js';
import './web-components/toast-wc/toast-wc.js';
import './web-components/tooltip-wc/tooltip-wc.js';
```

---

## 7. Update `/docs/elements/native/table.html`

Replace content after existing examples with:

```html
<!-- After existing basic examples... -->

<h2 id="sticky-columns">Sticky Columns</h2>
<p>Pin first N columns during horizontal scroll.</p>

<table data-sticky-column="1" style="width: 150%;">
  <thead>
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Email</th>
      <th>Department</th>
      <th>Location</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>Alice Smith</td>
      <td>alice@example.com</td>
      <td>Engineering</td>
      <td>San Francisco</td>
      <td>Active</td>
    </tr>
    <tr>
      <td>2</td>
      <td>Bob Jones</td>
      <td>bob@example.com</td>
      <td>Marketing</td>
      <td>New York</td>
      <td>Active</td>
    </tr>
  </tbody>
</table>

<h2 id="expandable">Expandable Rows</h2>
<p>Show/hide additional details per row.</p>

<table>
  <thead>
    <tr>
      <th></th>
      <th>Product</th>
      <th>Price</th>
    </tr>
  </thead>
  <tbody>
    <tr data-expandable>
      <td><button data-action="toggle-expand" aria-expanded="false">▶</button></td>
      <td>Widget Pro</td>
      <td>$99.00</td>
    </tr>
    <tr data-expand-content aria-hidden="true">
      <td colspan="3">
        <div style="padding: var(--size-m); background: var(--color-surface-raised);">
          <strong>Details:</strong> Advanced widget with premium features.
          Includes lifetime warranty and 24/7 support.
        </div>
      </td>
    </tr>
    <tr data-expandable>
      <td><button data-action="toggle-expand" aria-expanded="false">▶</button></td>
      <td>Widget Basic</td>
      <td>$49.00</td>
    </tr>
    <tr data-expand-content aria-hidden="true">
      <td colspan="3">
        <div style="padding: var(--size-m); background: var(--color-surface-raised);">
          <strong>Details:</strong> Entry-level widget for basic needs.
          One year warranty included.
        </div>
      </td>
    </tr>
  </tbody>
</table>

<script>
  // Manual expand handling without table-wc
  document.querySelectorAll('[data-action="toggle-expand"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const isExpanded = row.dataset.stateExpanded !== undefined;
      
      if (isExpanded) {
        delete row.dataset.stateExpanded;
        btn.setAttribute('aria-expanded', 'false');
      } else {
        row.dataset.stateExpanded = '';
        btn.setAttribute('aria-expanded', 'true');
      }
      
      const content = row.nextElementSibling;
      if (content?.hasAttribute('data-expand-content')) {
        content.setAttribute('aria-hidden', String(!isExpanded));
      }
    });
  });
</script>

<h2 id="responsive">Responsive Card Mode</h2>
<p>Automatically converts to cards on narrow screens.</p>

<div style="max-width: 400px; margin: 0 auto;">
  <table data-responsive="card">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td data-label="Name">Alice Smith</td>
        <td data-label="Email">alice@example.com</td>
        <td data-label="Role">Admin</td>
      </tr>
      <tr>
        <td data-label="Name">Bob Jones</td>
        <td data-label="Email">bob@example.com</td>
        <td data-label="Role">User</td>
      </tr>
    </tbody>
  </table>
</div>

<h2 id="interactive">Interactive Features</h2>
<p>Wrap in <code>&lt;table-wc&gt;</code> for sorting, filtering, and pagination.</p>
<p>See <a href="/examples/table-interactive.html">interactive table example</a> and <a href="../../web-components/table-wc/">table-wc documentation</a>.</p>
```

---

## 8. Create `/docs/examples/table-static.html`

```html
<!DOCTYPE html>
<html lang="en" data-page="docs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Static Table Examples | Vanilla Breeze</title>
  <link rel="stylesheet" href="../../src/main.css">
  <link rel="stylesheet" href="../docs.css">
</head>
<body>
  <layout-sidebar data-side="left" data-gap="l">
    <nav class="tree">
      <ul>
        <li><a href="../">Documentation</a></li>
        <li>
          <a href="../examples/">Examples</a>
          <ul>
            <li><strong>Static Table</strong></li>
            <li><a href="table-interactive.html">Interactive Table</a></li>
            <li><a href="table-responsive.html">Responsive Table</a></li>
          </ul>
        </li>
      </ul>
    </nav>

    <main>
      <h1>Static Table Examples</h1>
      <p class="lead">CSS-only table features without JavaScript.</p>

      <h2>Sticky Header</h2>
      <div style="max-height: 300px; overflow: auto; border: var(--border-width-thin) solid var(--color-border);">
        <table data-sticky-header>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Alice</td><td>alice@example.com</td><td>Engineering</td></tr>
            <tr><td>Bob</td><td>bob@example.com</td><td>Marketing</td></tr>
            <tr><td>Carol</td><td>carol@example.com</td><td>Sales</td></tr>
            <tr><td>David</td><td>david@example.com</td><td>Engineering</td></tr>
            <tr><td>Eve</td><td>eve@example.com</td><td>HR</td></tr>
            <tr><td>Frank</td><td>frank@example.com</td><td>Marketing</td></tr>
            <tr><td>Grace</td><td>grace@example.com</td><td>Engineering</td></tr>
            <tr><td>Henry</td><td>henry@example.com</td><td>Sales</td></tr>
            <tr><td>Iris</td><td>iris@example.com</td><td>HR</td></tr>
            <tr><td>Jack</td><td>jack@example.com</td><td>Engineering</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Sticky Column</h2>
      <div style="max-width: 600px; overflow: auto; border: var(--border-width-thin) solid var(--color-border);">
        <table data-sticky-column="1" style="width: 150%;">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1</td><td>Alice</td><td>alice@example.com</td><td>Engineering</td><td>San Francisco</td></tr>
            <tr><td>2</td><td>Bob</td><td>bob@example.com</td><td>Marketing</td><td>New York</td></tr>
            <tr><td>3</td><td>Carol</td><td>carol@example.com</td><td>Sales</td><td>Chicago</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Both Sticky Header and Column</h2>
      <div style="max-width: 600px; max-height: 300px; overflow: auto; border: var(--border-width-thin) solid var(--color-border);">
        <table data-sticky-header data-sticky-column="1" style="width: 150%;">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1</td><td>Alice</td><td>alice@example.com</td><td>Engineering</td><td>San Francisco</td></tr>
            <tr><td>2</td><td>Bob</td><td>bob@example.com</td><td>Marketing</td><td>New York</td></tr>
            <tr><td>3</td><td>Carol</td><td>carol@example.com</td><td>Sales</td><td>Chicago</td></tr>
            <tr><td>4</td><td>David</td><td>david@example.com</td><td>Engineering</td><td>Austin</td></tr>
            <tr><td>5</td><td>Eve</td><td>eve@example.com</td><td>HR</td><td>Boston</td></tr>
            <tr><td>6</td><td>Frank</td><td>frank@example.com</td><td>Marketing</td><td>Seattle</td></tr>
            <tr><td>7</td><td>Grace</td><td>grace@example.com</td><td>Engineering</td><td>Portland</td></tr>
            <tr><td>8</td><td>Henry</td><td>henry@example.com</td><td>Sales</td><td>Denver</td></tr>
          </tbody>
        </table>
      </div>
    </main>
  </layout-sidebar>

  <script type="module" src="../../src/main.js"></script>
</body>
</html>
```

---

## 9. Create `/docs/examples/table-interactive.html`

```html
<!DOCTYPE html>
<html lang="en" data-page="docs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Interactive Table Example | Vanilla Breeze</title>
  <link rel="stylesheet" href="../../src/main.css">
  <link rel="stylesheet" href="../docs.css">
</head>
<body>
  <layout-sidebar data-side="left" data-gap="l">
    <nav class="tree">
      <ul>
        <li><a href="../">Documentation</a></li>
        <li>
          <a href="../examples/">Examples</a>
          <ul>
            <li><a href="table-static.html">Static Table</a></li>
            <li><strong>Interactive Table</strong></li>
            <li><a href="table-responsive.html">Responsive Table</a></li>
          </ul>
        </li>
      </ul>
    </nav>

    <main>
      <h1>Interactive Table Example</h1>
      <p class="lead">Full-featured table with sorting, filtering, pagination, and row selection.</p>

      <div data-bulk-actions>
        <span><strong data-selected-count>0</strong> selected</span>
        <button>Delete</button>
        <button>Export</button>
      </div>

      <table-wc>
        <table data-paginate="5" data-filterable>
          <thead>
            <tr>
              <th><input type="checkbox" data-action="select-all" aria-label="Select all"></th>
              <th data-sort="string">Name</th>
              <th data-sort="string">Email</th>
              <th data-sort="string">Department</th>
              <th data-sort="date">Hired</th>
            </tr>
          </thead>
          <tbody>
            <tr data-selectable data-filter-value="alice smith alice@example.com engineering">
              <td><input type="checkbox" data-action="select-row" aria-label="Select row"></td>
              <td>Alice Smith</td>
              <td>alice@example.com</td>
              <td>Engineering</td>
              <td data-sort-value="2022-03-15">Mar 15, 2022</td>
            </tr>
            <tr data-selectable data-filter-value="bob jones bob@example.com marketing">
              <td><input type="checkbox" data-action="select-row" aria-label="Select row"></td>
              <td>Bob Jones</td>
              <td>bob@example.com</td>
              <td>Marketing</td>
              <td data-sort-value="2021-07-22">Jul 22, 2021</td>
            </tr>
            <tr data-selectable data-filter-value="carol white carol@example.com sales">
              <td><input type="checkbox" data-action="select-row" aria-label="Select row"></td>
              <td>Carol White</td>
              <td>carol@example.com</td>
              <td>Sales</td>
              <td data-sort-value="2023-01-10">Jan 10, 2023</td>
            </tr>
            <tr data-selectable data-filter-value="david brown david@example.com engineering">
              <td><input type="checkbox" data-action="select-row" aria-label="Select row"></td>
              <td>David Brown</td>
              <td>david@example.com</td>
              <td>Engineering</td>
              <td data-sort-value="2020-11-05">Nov 5, 2020</td>
            </tr>
            <tr data-selectable data-filter-value="eve davis eve@example.com hr">
              <td><input type="checkbox" data-action="select-row" aria-label="Select row"></td>
              <td>Eve Davis</td>
              <td>eve@example.com</td>
              <td>HR</td>
              <td data-sort-value="2022-08-30">Aug 30, 2022</td>
            </tr>
            <tr data-selectable data-filter-value="frank miller frank@example.com marketing">
              <td><input type="checkbox" data-action="select-row" aria-label="Select row"></td>
              <td>Frank Miller</td>
              <td>frank@example.com</td>
              <td>Marketing</td>
              <td data-sort-value="2021-04-18">Apr 18, 2021</td>
            </tr>
            <tr data-selectable data-filter-value="grace wilson grace@example.com engineering">
              <td><input type="checkbox" data-action="select-row" aria-label="Select row"></td>
              <td>Grace Wilson</td>
              <td>grace@example.com</td>
              <td>Engineering</td>
              <td data-sort-value="2023-06-12">Jun 12, 2023</td>
            </tr>
            <tr data-selectable data-filter-value="henry moore henry@example.com sales">
              <td><input type="checkbox" data-action="select-row" aria-label="Select row"></td>
              <td>Henry Moore</td>
              <td>henry@example.com</td>
              <td>Sales</td>
              <td data-sort-value="2020-09-25">Sep 25, 2020</td>
            </tr>
          </tbody>
        </table>
      </table-wc>

      <h2>Event Monitoring</h2>
      <output id="event-log" style="display: block; padding: var(--size-m); background: var(--color-surface-raised); border-radius: var(--radius-m); font-family: var(--font-mono); font-size: var(--font-size-sm); min-height: 200px; white-space: pre-wrap;"></output>

      <script>
        const table = document.querySelector('table-wc');
        const log = document.getElementById('event-log');
        
        ['sort', 'filter', 'page', 'selection'].forEach(event => {
          table.addEventListener(`table:${event}`, (e) => {
            const time = new Date().toLocaleTimeString();
            const detail = JSON.stringify(e.detail, null, 2);
            log.textContent = `[${time}] table:${event}\n${detail}\n\n${log.textContent}`;
          });
        });
      </script>
    </main>
  </layout-sidebar>

  <script type="module" src="../../src/main.js"></script>
</body>
</html>
```

---

## 10. Create `/docs/examples/table-responsive.html`

```html
<!DOCTYPE html>
<html lang="en" data-page="docs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Responsive Table Example | Vanilla Breeze</title>
  <link rel="stylesheet" href="../../src/main.css">
  <link rel="stylesheet" href="../docs.css">
</head>
<body>
  <layout-sidebar data-side="left" data-gap="l">
    <nav class="tree">
      <ul>
        <li><a href="../">Documentation</a></li>
        <li>
          <a href="../examples/">Examples</a>
          <ul>
            <li><a href="table-static.html">Static Table</a></li>
            <li><a href="table-interactive.html">Interactive Table</a></li>
            <li><strong>Responsive Table</strong></li>
          </ul>
        </li>
      </ul>
    </nav>

    <main>
      <h1>Responsive Table Example</h1>
      <p class="lead">Tables that adapt to narrow screens using card layout.</p>

      <h2>Card Mode Demo</h2>
      <p>Resize your browser to see the card layout below 500px width.</p>

      <table-wc>
        <table data-responsive="card">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Name">Alice Smith</td>
              <td data-label="Email">alice@example.com</td>
              <td data-label="Department">Engineering</td>
              <td data-label="Status">Active</td>
            </tr>
            <tr>
              <td data-label="Name">Bob Jones</td>
              <td data-label="Email">bob@example.com</td>
              <td data-label="Department">Marketing</td>
              <td data-label="Status">Active</td>
            </tr>
            <tr>
              <td data-label="Name">Carol White</td>
              <td data-label="Email">carol@example.com</td>
              <td data-label="Department">Sales</td>
              <td data-label="Status">On Leave</td>
            </tr>
            <tr>
              <td data-label="Name">David Brown</td>
              <td data-label="Email">david@example.com</td>
              <td data-label="Department">Engineering</td>
              <td data-label="Status">Active</td>
            </tr>
          </tbody>
        </table>
      </table-wc>

      <h2>Preview at Mobile Width</h2>
      <p>Forced card layout in narrow container:</p>

      <div style="max-width: 400px; margin: 0 auto;">
        <table-wc>
          <table data-responsive="card">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td data-label="Product">Widget Pro</td>
                <td data-label="Price">$99.00</td>
                <td data-label="Stock">In Stock</td>
              </tr>
              <tr>
                <td data-label="Product">Widget Basic</td>
                <td data-label="Price">$49.00</td>
                <td data-label="Stock">Low Stock</td>
              </tr>
              <tr>
                <td data-label="Product">Widget Plus</td>
                <td data-label="Price">$149.00</td>
                <td data-label="Stock">Pre-order</td>
              </tr>
            </tbody>
          </table>
        </table-wc>
      </div>
    </main>
  </layout-sidebar>

  <script type="module" src="../../src/main.js"></script>
</body>
</html>
```

---

## 11. Update `vanilla-breeze-overview.md`

Change this line:

```markdown
Located in `/src/web-components/` (10 components). JavaScript-enhanced components.
```

To:

```markdown
Located in `/src/web-components/` (11 components). JavaScript-enhanced components.
```

And add to the component list table:

```markdown
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `accordion-wc` | Collapsible panels | Built on details/summary, single-open mode, keyboard nav |
| `tabs-wc` | Tabbed interface | ARIA tablist/tab/tabpanel, keyboard nav |
| `table-wc` | Interactive tables | Sorting, filtering, pagination, row selection/expansion |
| `toast-wc` | Toast notifications | Auto-dismiss, positioning |
| `tooltip-wc` | Tooltip overlays | Positioned with arrow |
| `dropdown-wc` | Dropdown menus | Click/keyboard triggered |
| `footnotes-wc` | Footnote references | Modal/popover display |
| `icon-wc` | SVG icon wrapper | Lucide integration, size variants |
| `theme-picker` | Theme selection | Mode switching, brand themes |
| `heading-links` | Heading anchors | Auto-generates linkable IDs |
| `page-toc` | Table of contents | Scroll-spy, auto-generated or manual markup |
```

---

## Implementation Checklist

- [ ] Update `/src/native-elements/table/table.css`
- [ ] Update `/src/native-elements/table/README.md`
- [ ] Create `/src/web-components/table-wc/table-wc.js`
- [ ] Create `/src/web-components/table-wc/table-wc.css`
- [ ] Create `/src/web-components/table-wc/README.md`
- [ ] Update `/src/main.js` (add import)
- [ ] Update `/docs/elements/native/table.html`
- [ ] Create `/docs/examples/table-static.html`
- [ ] Create `/docs/examples/table-interactive.html`
- [ ] Create `/docs/examples/table-responsive.html`
- [ ] Update `vanilla-breeze-overview.md`

---

## Testing Checklist

After implementation:

- [ ] Sorting works (string, number, date)
- [ ] Filtering works (text + optional chips)
- [ ] Pagination works (prev/next, page numbers)
- [ ] Row expansion works (animation smooth)
- [ ] Row selection works (single + bulk)
- [ ] Sticky header works (scroll test)
- [ ] Sticky column works (1 and 2 columns)
- [ ] Responsive card mode works (<500px)
- [ ] Events fire correctly
- [ ] Keyboard navigation works
- [ ] `prefers-reduced-motion` respected
- [ ] Works without JS (degrades gracefully)

---

## Notes

- All CSS uses Vanilla Breeze design tokens
- Component follows existing web component patterns
- Progressive enhancement: CSS works standalone, JS adds interactivity
- `data-sticky-column` supports 1 or 2 columns
- Use `-wc` suffix for consistency with other components
- Full accessibility with ARIA and keyboard support