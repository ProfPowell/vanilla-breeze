# Data Table

## Description

Responsive table for displaying structured tabular data with optional sorting, filtering, and pagination. Uses semantic `<table>` elements with enhancements for better usability.

## Anatomy

- **wrapper**: Responsive container for horizontal scroll
- **table**: The table element
- **thead**: Column headers with optional sort controls
- **tbody**: Data rows
- **tfoot**: Optional footer with totals or pagination
- **actions**: Row-level action buttons

## States

| State | Description |
|-------|-------------|
| Default | Static data display |
| Loading | Skeleton or spinner overlay |
| Empty | No data message |
| Sorted | Column sorted asc/desc |
| Selected | Row selection active |

## Variants

### Density

**Attribute:** `data-density`
**Values:** `compact`, `default`, `relaxed`

### Style

**Attribute:** `data-style`
**Values:** `default`, `striped`, `bordered`

### Features

**Attribute:** `data-sortable`, `data-selectable`

## Baseline HTML

```html
<div class="table-wrapper">
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
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>Admin</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Enhanced HTML

```html
<data-table data-density="default" data-style="striped" data-sortable>
  <table>
    <thead>
      <tr>
        <th data-sort="name">
          Name
          <span data-sort-icon></span>
        </th>
        <th data-sort="email">
          Email
          <span data-sort-icon></span>
        </th>
        <th data-sort="role">
          Role
          <span data-sort-icon></span>
        </th>
        <th data-actions>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr data-row-id="1">
        <td>John Doe</td>
        <td>john@example.com</td>
        <td><span data-badge="success">Admin</span></td>
        <td data-actions>
          <button data-action="edit" aria-label="Edit">Edit</button>
          <button data-action="delete" aria-label="Delete">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
</data-table>
```

## CSS

```css
@layer components {
  data-table,
  .table-wrapper {
    display: block;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  data-table table,
  .table-wrapper table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }

  /* Header */
  data-table thead,
  .table-wrapper thead {
    background: var(--surface-alt, oklch(0.98 0 0));
    border-block-end: 2px solid var(--border, oklch(0.85 0 0));
  }

  data-table th,
  .table-wrapper th {
    padding: var(--spacing-md) var(--spacing-lg);
    text-align: start;
    font-weight: var(--font-weight-semibold);
    color: var(--text, oklch(0.2 0 0));
    white-space: nowrap;
  }

  /* Sortable headers */
  data-table[data-sortable] th[data-sort],
  .table-wrapper th[data-sort] {
    cursor: pointer;
    user-select: none;
    transition: background var(--transition-fast);
  }

  data-table[data-sortable] th[data-sort]:hover,
  .table-wrapper th[data-sort]:hover {
    background: var(--overlay-light, oklch(0 0 0 / 0.05));
  }

  data-table th[data-sort] [data-sort-icon],
  .table-wrapper th[data-sort] [data-sort-icon] {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    margin-inline-start: var(--spacing-xs);
    opacity: 0.3;
    vertical-align: middle;
  }

  data-table th[data-sort][aria-sort] [data-sort-icon],
  .table-wrapper th[data-sort][aria-sort] [data-sort-icon] {
    opacity: 1;
  }

  data-table th[data-sort][aria-sort="ascending"] [data-sort-icon]::after,
  .table-wrapper th[data-sort][aria-sort="ascending"] [data-sort-icon]::after {
    content: "↑";
  }

  data-table th[data-sort][aria-sort="descending"] [data-sort-icon]::after,
  .table-wrapper th[data-sort][aria-sort="descending"] [data-sort-icon]::after {
    content: "↓";
  }

  /* Body */
  data-table td,
  .table-wrapper td {
    padding: var(--spacing-md) var(--spacing-lg);
    border-block-end: 1px solid var(--border, oklch(0.9 0 0));
    color: var(--text, oklch(0.2 0 0));
  }

  data-table tbody tr:hover,
  .table-wrapper tbody tr:hover {
    background: var(--overlay-light, oklch(0 0 0 / 0.02));
  }

  /* Density variants */
  data-table[data-density="compact"] th,
  data-table[data-density="compact"] td {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  data-table[data-density="relaxed"] th,
  data-table[data-density="relaxed"] td {
    padding: var(--spacing-lg) var(--spacing-xl);
  }

  /* Style variants */
  data-table[data-style="striped"] tbody tr:nth-child(even),
  .table-wrapper[data-style="striped"] tbody tr:nth-child(even) {
    background: var(--surface-alt, oklch(0.98 0 0));
  }

  data-table[data-style="bordered"],
  .table-wrapper[data-style="bordered"] {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  data-table[data-style="bordered"] th,
  data-table[data-style="bordered"] td {
    border: 1px solid var(--border);
  }

  /* Actions column */
  data-table th[data-actions],
  data-table td[data-actions] {
    text-align: end;
    white-space: nowrap;
  }

  data-table td[data-actions] {
    display: flex;
    gap: var(--spacing-xs);
    justify-content: flex-end;
  }

  data-table [data-action] {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--text-sm);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  data-table [data-action]:hover {
    background: var(--overlay-light);
  }

  data-table [data-action="delete"] {
    color: var(--error, oklch(0.55 0.2 25));
    border-color: var(--error);
  }

  /* Selectable rows */
  data-table[data-selectable] tbody tr {
    cursor: pointer;
  }

  data-table[data-selectable] tbody tr[data-selected] {
    background: oklch(0.95 0.05 250);
  }

  /* Badge in cells */
  data-table [data-badge] {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-full);
  }

  data-table [data-badge="success"] {
    background: oklch(0.95 0.05 145);
    color: oklch(0.4 0.15 145);
  }

  data-table [data-badge="warning"] {
    background: oklch(0.95 0.05 85);
    color: oklch(0.4 0.1 85);
  }

  data-table [data-badge="error"] {
    background: oklch(0.95 0.05 25);
    color: oklch(0.4 0.15 25);
  }

  /* Empty state */
  data-table [data-empty] {
    padding: var(--spacing-2xl);
    text-align: center;
    color: var(--text-muted);
  }

  /* Loading overlay */
  data-table[data-loading]::after {
    content: "";
    position: absolute;
    inset: 0;
    background: oklch(1 0 0 / 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Sticky header */
  data-table[data-sticky-header] thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--surface);
  }
}

/* Responsive: stack on mobile */
@media (max-width: 47.999rem) {
  data-table[data-responsive] thead {
    display: none;
  }

  data-table[data-responsive] tbody tr {
    display: block;
    margin-block-end: var(--spacing-md);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  data-table[data-responsive] tbody td {
    display: flex;
    justify-content: space-between;
    border: none;
    border-block-end: 1px solid var(--border);
  }

  data-table[data-responsive] tbody td::before {
    content: attr(data-label);
    font-weight: var(--font-weight-medium);
  }

  data-table[data-responsive] tbody td:last-child {
    border: none;
  }
}
```

## JavaScript Enhancement

```javascript
class DataTable extends HTMLElement {
  connectedCallback() {
    this.table = this.querySelector('table');
    this.headers = this.querySelectorAll('th[data-sort]');
    this.tbody = this.querySelector('tbody');

    if (this.hasAttribute('data-sortable')) {
      this.initSorting();
    }

    if (this.hasAttribute('data-selectable')) {
      this.initSelection();
    }
  }

  initSorting() {
    this.headers.forEach((header) => {
      header.addEventListener('click', () => this.sortBy(header));
    });
  }

  sortBy(header) {
    const column = header.dataset.sort;
    const currentSort = header.getAttribute('aria-sort');
    const newSort = currentSort === 'ascending' ? 'descending' : 'ascending';

    // Reset all headers
    this.headers.forEach((h) => h.removeAttribute('aria-sort'));

    // Set new sort
    header.setAttribute('aria-sort', newSort);

    // Sort rows
    const rows = Array.from(this.tbody.querySelectorAll('tr'));
    const columnIndex = Array.from(header.parentNode.children).indexOf(header);

    rows.sort((a, b) => {
      const aVal = a.children[columnIndex]?.textContent.trim() || '';
      const bVal = b.children[columnIndex]?.textContent.trim() || '';

      const comparison = aVal.localeCompare(bVal, undefined, { numeric: true });
      return newSort === 'ascending' ? comparison : -comparison;
    });

    rows.forEach((row) => this.tbody.appendChild(row));

    this.dispatchEvent(new CustomEvent('sort', {
      detail: { column, direction: newSort }
    }));
  }

  initSelection() {
    this.tbody.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (!row || e.target.closest('[data-action]')) return;

      const wasSelected = row.hasAttribute('data-selected');

      // Clear other selections (single select)
      this.tbody.querySelectorAll('[data-selected]').forEach((r) => {
        r.removeAttribute('data-selected');
      });

      if (!wasSelected) {
        row.setAttribute('data-selected', '');
        this.dispatchEvent(new CustomEvent('select', {
          detail: { rowId: row.dataset.rowId }
        }));
      }
    });
  }
}

customElements.define('data-table', DataTable);
```

## Accessibility

- **Semantic Table**: Proper `<table>`, `<thead>`, `<tbody>` structure
- **Sortable**: `aria-sort` attribute on sorted columns
- **Row Actions**: Accessible button labels
- **Responsive**: Mobile layout maintains data relationships

## Examples

### Basic Table

```html
<data-table data-style="striped">
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Price</th>
        <th>Stock</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Widget A</td>
        <td>$29.99</td>
        <td>150</td>
      </tr>
      <tr>
        <td>Widget B</td>
        <td>$49.99</td>
        <td>75</td>
      </tr>
    </tbody>
  </table>
</data-table>
```

### Sortable with Actions

```html
<data-table data-sortable data-density="compact">
  <table>
    <thead>
      <tr>
        <th data-sort="name">Name <span data-sort-icon></span></th>
        <th data-sort="email">Email <span data-sort-icon></span></th>
        <th data-sort="status">Status <span data-sort-icon></span></th>
        <th data-actions>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr data-row-id="1">
        <td>Alice Smith</td>
        <td>alice@example.com</td>
        <td><span data-badge="success">Active</span></td>
        <td data-actions>
          <button data-action="edit">Edit</button>
          <button data-action="delete">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
</data-table>
```

## Related Patterns

- [data-list](./data-list.md)
- [comparison-table](./comparison-table.md)
- [pagination](../navigation/pagination.md)
