# <data-table>

Enhanced HTML table with sorting, filtering, pagination, row expansion, and selection

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/data-table/
- Vanilla Breeze 0.7.4

## Example

```html
<data-table>
  <table data-filterable data-paginate="5">
    <thead>
      <tr>
        <th data-sort="string">Name</th>
        <th data-sort="number">Age</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice Johnson</td>
        <td>32</td>
      </tr>
      <tr>
        <td>Bob Smith</td>
        <td>28</td>
      </tr>
    </tbody>
  </table>
</data-table>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-label-no-results` | string | `No matching rows found` | Text for the visible empty state and the live-region announcement when the filter matches no rows. |
| `data-label-filter` | string | `Filter table rows` | Accessible name of the filter input. |
| `data-label-placeholder` | string | `Filter table...` | Placeholder of the filter input. |
| `data-label-pagination` | string | `Table pagination` | Accessible name of the pagination nav. |
| `data-label-prev` | string | `Previous` | Text of the previous-page button. |
| `data-label-next` | string | `Next` | Text of the next-page button. |
| `data-label-sorted` | string | `Sorted by {column}, {direction}` | Announcement after a sort. {column} is replaced by the header text and {direction} by the data-label-ascending or data-label-descending text. |
| `data-label-ascending` | string | `ascending` | Direction word used for {direction} in the sort announcement. |
| `data-label-descending` | string | `descending` | Direction word used for {direction} in the sort announcement. |
| `data-label-filtered-one` | string | `{count} of {total} row shown` | Announcement after filtering when Intl.PluralRules selects "one" for the total. {count} is replaced by the number of matching rows and {total} by the number of rows. Any category works: -two, -few, -many, -zero. |
| `data-label-filtered-other` | string | `{count} of {total} rows shown` | Announcement after filtering for the "other" category and the fallback for unset categories. {count} and {total} are replaced. |
| `data-label-all-one` | string | `All {total} row shown` | Announcement when the filter is cleared ("one" category). {total} is replaced by the number of rows; {count} holds the same number. |
| `data-label-all-other` | string | `All {total} rows shown` | Announcement when the filter is cleared ("other" category and fallback). {total} is replaced by the number of rows; {count} holds the same number. |
| `data-label-selected-one` | string | `{count} row selected` | Announcement after a selection change when Intl.PluralRules selects "one" for the count. {count} is replaced by the number of selected rows. Any category works: -two, -few, -many, -zero. |
| `data-label-selected-other` | string | `{count} rows selected` | Announcement after a selection change for the "other" category and the fallback for unset categories. {count} is replaced. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-filterable` | table | boolean |  | Enable text search filtering (adds a search input above the table) |
| `data-paginate` | table | number |  | Enable pagination with N rows per page |
| `data-sort` | th | `string`, `number`, `date` |  | Enable sorting on this column with the specified comparator |
| `data-weight` | th | number |  | Column weight; multiplier applied to cell values for weighted-sum rollups |
| `data-rollup` | th | `sum`, `weighted-sum`, `product`, `avg`, `max` |  | Compute this column's cells from sibling cells in the same row |
| `data-heatmap` | th | `auto`, `low-good`, `high-good` |  | Tint this column's cells by relative value bucket (low/mid/high) |
| `data-sort-value` | td | string |  | Custom sort value overriding cell text. Use for formatted values, e.g. <td data-sort-value="1234">$1,234</td> — data-sort="number" parses the cell with parseFloat, so "$1,234" would sort as 0 |
| `data-filter-value` | td | string |  | Custom filter value overriding cell text |
| `data-expandable` | tr | boolean |  | Mark row as expandable (followed by a data-expand-content row). Supply the toggle yourself: <button data-action="toggle-expand"> in a cell; the component manages aria-expanded |
| `data-expand-content` | tr | boolean |  | Hidden row revealed when its preceding expandable row is toggled |
| `data-selectable` | tr | boolean |  | Mark row as selectable via an author-supplied <input type="checkbox" data-action="select-row">; a thead checkbox with data-action="select-all" toggles all |

## Structure

| Child | Description |
| --- | --- |
| `<table>` | Standard HTML table — the component enhances it in place |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `data-table:sort` | `{ column, direction, columnName }` | Fired when a column is sorted |
| `data-table:filter` | `{ query, count }` | Fired when filter text changes |
| `data-table:page` | `{ page }` | Fired when page changes |
| `data-table:expand` | `{ row, expanded }` | Fired when a row is expanded or collapsed |
| `data-table:selection` | `{ count, rows[] }` | Fired when row selection changes |
| `data-table:rows-changed` | `{ rows, added, moved, removed, source }` | Fired after each .rows assignment with keyed-diff stats (source: 'api') |

## Methods

| Method | Description |
| --- | --- |
| `goToPage(page)` | Navigate to a page (1-indexed, clamped). No-op without data-paginate. |
| `setFilter(query)` | Set the filter text programmatically (updates the search input) and announce the result count. |
| `refresh()` | Re-scan rows after DOM changes and re-apply rollups, heatmaps, filter, sort and pagination. |
| `getSelectedRows()` | Currently selected rows. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `rows` | `Array<{ id, [columnKey]: value }>` | Row records. Seeded from <tr data-id> on upgrade; assigning runs a keyed diff that preserves <tr> nodes whose id persists. |
| `columns` | `Array<{ key, label, sort? }>` | Column spec derived from <thead> (th data-key, else lowercased header text). |
| `renderRow` | `(row, columns) => Element` | Optional custom row renderer used for new rows in .rows assignments. |
| `currentPage` | `number` | Current page (1-indexed). |
| `totalPages` | `number` | Total pages for the current filter (1 when not paginated). |
| `filteredCount` | `number` | Rows matching the current filter. |
| `totalCount` | `number` | Total data rows (expansion content rows excluded). |

## Accessibility

- Pattern: Table
- You provide: A <table> with <th> headers, a caption or other accessible name, labelled row checkboxes and a labelled <button data-action="toggle-expand"> for expandable rows
- The component manages: `aria-sort`, `aria-expanded`, `aria-hidden`, `aria-current`, `aria-label`, `aria-live`, `aria-atomic`, `role="status"`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Sort by the column, toggling between ascending and descending | Native behaviour of button (the generated sort button in a header) |
