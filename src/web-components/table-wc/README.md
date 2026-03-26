# table-wc

Enhanced table component with sorting, filtering, pagination, row expansion, and row selection. Wraps a standard HTML table and adds interactive features via data attributes.

## Overview

The `table-wc` component progressively enhances HTML tables with interactive features while maintaining full functionality without JavaScript. All enhancements are opt-in via data attributes.

### Features

- Column sorting (string, number, date)
- Real-time text filtering with debounce
- Pagination with configurable page size
- Row selection with select-all support
- Row expansion for detail views
- Responsive card layout for narrow containers
- Sticky headers and columns
- Keyboard accessible
- Full ARIA support

## Basic Usage

```html
<table-wc>
  <table data-filterable data-paginate="10">
    <thead>
      <tr>
        <th data-sort="string">Name</th>
        <th data-sort="number">Price</th>
        <th data-sort="date">Date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Widget</td>
        <td data-sort-value="19.99">$19.99</td>
        <td data-sort-value="2024-01-15">Jan 15, 2024</td>
      </tr>
    </tbody>
  </table>
</table-wc>
```

## Table Attributes

These attributes go on the `<table>` element inside `table-wc`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-filterable` | (boolean) | Adds a search input that filters rows in real-time |
| `data-paginate` | Number | Enables pagination with N rows per page |
| `data-sticky` | `header`, `column`, `both` | Makes header/first column/both sticky |
| `data-sticky-column` | Number | Makes N columns sticky (e.g., `"2"`) |
| `data-responsive` | `card`, `scroll` | Responsive mode: cards at narrow width or horizontal scroll |
| `data-density` | `compact`, `comfortable` | Adjusts cell padding |

## Header Cell Attributes

These attributes go on `<th>` elements.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-sort` | `string`, `number`, `date` | Makes column sortable with specified comparison type |
| `data-numeric` | (boolean) | Right-aligns content for numeric values |
| `data-align` | `start`, `center`, `end` | Text alignment override |

## Row Attributes

These attributes go on `<tr>` elements in `<tbody>`.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-selectable` | (boolean) | Enables row selection (requires checkbox with `data-action="select-row"`) |
| `data-expandable` | (boolean) | Enables row expansion (requires button with `data-action="toggle-expand"`) |
| `data-selected` | (boolean) | CSS-only selected state styling |
| `data-disabled` | (boolean) | CSS-only disabled state styling |
| `data-highlight` | (boolean) | CSS-only highlight state styling |
| `data-expand-content` | (boolean) | Marks a row as expansion content (follows expandable row) |

### State Attributes (Set by Component)

| Attribute | Description |
|-----------|-------------|
| `data-state-sorted` | Set on `<th>` with value `asc` or `desc` |
| `data-state-hidden` | Set on filtered/paginated out rows |
| `data-state-selected` | Set on selected rows |
| `data-state-expanded` | Set on expanded rows |

## Cell Attributes

These attributes go on `<td>` elements.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-sort-value` | String | Custom sortable value (e.g., ISO date when displaying formatted date) |
| `data-filter-value` | String | Custom filterable value (overrides text content for filtering) |
| `data-label` | String | Label shown in responsive card mode |
| `data-numeric` | (boolean) | Right-aligns content for numeric values |
| `data-align` | `start`, `center`, `end` | Text alignment override |

## Selection

Row selection requires specific markup:

```html
<table-wc>
  <table>
    <thead>
      <tr>
        <th><input type="checkbox" data-action="select-all" aria-label="Select all"/></th>
        <th>Name</th>
      </tr>
    </thead>
    <tbody>
      <tr data-selectable>
        <td><input type="checkbox" data-action="select-row" aria-label="Select row"/></td>
        <td>Alice</td>
      </tr>
    </tbody>
  </table>
</table-wc>
```

### Bulk Actions Bar

Display actions when rows are selected:

```html
<div data-bulk-actions>
  <span><span data-selected-count>0</span> selected</span>
  <button>Delete Selected</button>
</div>
```

The `[data-bulk-actions]` container appears automatically when rows are selected. The `[data-selected-count]` element is updated with the selection count.

## Row Expansion

Expandable rows require a toggle button and content row:

```html
<tr data-expandable>
  <td>
    <button data-action="toggle-expand" aria-expanded="false">
      <icon-wc name="chevron-right"></icon-wc>
    </button>
  </td>
  <td>Main content</td>
</tr>
<tr data-expand-content aria-hidden="true">
  <td colspan="2">Expanded detail content here</td>
</tr>
```

## Events

The component dispatches these custom events (bubble up the DOM):

### `table:sort`

Fired when a column is sorted.

```js
tableWc.addEventListener('table:sort', (e) => {
  console.log(e.detail);
  // { column: 0, direction: 'asc', columnName: 'Name' }
});
```

### `table:filter`

Fired when the filter query changes.

```js
tableWc.addEventListener('table:filter', (e) => {
  console.log(e.detail);
  // { query: 'search term', count: 5 }
});
```

### `table:page`

Fired when the page changes.

```js
tableWc.addEventListener('table:page', (e) => {
  console.log(e.detail);
  // { page: 2 }
});
```

### `table:expand`

Fired when a row is expanded or collapsed.

```js
tableWc.addEventListener('table:expand', (e) => {
  console.log(e.detail);
  // { row: HTMLTableRowElement, expanded: true }
});
```

### `table:selection`

Fired when row selection changes.

```js
tableWc.addEventListener('table:selection', (e) => {
  console.log(e.detail);
  // { count: 3, rows: [HTMLTableRowElement, ...] }
});
```

## Public API

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `goToPage(page)` | `page: number` | Navigate to a specific page (1-indexed) |
| `setFilter(query)` | `query: string` | Set filter query programmatically |
| `refresh()` | - | Re-scan rows after DOM changes |
| `getSelectedRows()` | - | Returns array of selected `<tr>` elements |

### Properties (Read-only)

| Property | Type | Description |
|----------|------|-------------|
| `currentPage` | `number` | Current page number |
| `totalPages` | `number` | Total number of pages |
| `filteredCount` | `number` | Number of rows matching current filter |
| `totalCount` | `number` | Total number of rows |

### Example

```js
const table = document.querySelector('table-wc');

// Navigate programmatically
table.goToPage(3);

// Filter programmatically
table.setFilter('engineering');

// Get selected rows
const selected = table.getSelectedRows();
console.log(`${selected.length} rows selected`);

// After adding rows dynamically
table.refresh();
```

## Responsive Behavior

### Card Mode

Use `data-responsive="card"` with `data-label` on cells:

```html
<table-wc>
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
</table-wc>
```

At container widths below 500px, the table transforms:
- Header row is hidden
- Each row becomes a bordered card
- Cells display as label/value pairs

### Scroll Mode

Use `data-responsive="scroll"` for horizontal scrolling:

```html
<table data-responsive="scroll">
  <!-- Wide table content -->
</table>
```

## Accessibility

- Sortable headers have `role="columnheader"`, `tabindex="0"`, and `aria-sort`
- Keyboard support: Enter/Space to sort columns
- Filter input has proper `aria-label`
- Pagination navigation has `aria-label="Table pagination"`
- Current page button has `aria-current="page"`
- Expand buttons have `aria-expanded` state
- Expanded content rows have `aria-hidden` state
- Live region announces filter/pagination changes to screen readers

## Browser Support

- Chrome 105+ (container queries)
- Firefox 110+ (container queries)
- Safari 16+ (container queries)
- Edge 105+ (container queries)

For browsers without container query support, responsive card mode falls back to standard table display.

## CSS Customization

The component uses CSS custom properties from the design system. Key properties:

```css
/* Filter input */
--color-border
--color-surface
--color-text
--color-interactive

/* Pagination */
--size-touch-min
--color-interactive
--color-text-on-primary

/* Responsive cards */
--radius-m
--shadow-s
```

## Related

- [Table Static Examples](/docs/examples/table-static.html) - CSS-only table features
- [Table Interactive Examples](/docs/examples/table-interactive.html) - Full interactive demo
- [Table Responsive Examples](/docs/examples/table-responsive.html) - Responsive layout demo
