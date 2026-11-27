# Pagination Patterns

Page navigation patterns for multi-page content, tables, and search results.

- Documentation: https://vanilla-breeze.com/docs/patterns/navigation/pagination/
- Vanilla Breeze 0.7.4

## Overview

Pagination helps users navigate through large sets of content split across multiple pages. These patterns use semantic `<nav>` elements with proper ARIA attributes for accessibility.

Key features:
- Semantic HTML with `aria-label` for screen readers
- Current page indication via `aria-current="page"`
- Disabled states for first/last page boundaries
- Responsive design that works on all screen sizes
- Keyboard navigation support

## Simple Prev/Next

A minimal pagination with just Previous and Next buttons. Best for sequential content like blog posts or articles where page numbers are less important.

Simple prev/next pagination:

```html
<nav class="pagination" aria-label="Pagination">
  <ul>
    <li>
      <a href="#" data-prev aria-label="Previous page">
        <icon-wc name="chevron-left" size="sm"></icon-wc>
        Previous
      </a>
    </li>
    <li>
      <a href="#" data-next aria-label="Next page">
        Next
        <icon-wc name="chevron-right" size="sm"></icon-wc>
      </a>
    </li>
  </ul>
</nav>
```

## With Page Numbers

Pagination with numbered page links for direct page access. Includes ellipsis for large page ranges. Best for search results, product listings, or any content where users may want to jump to specific pages.

Numbered pagination with ellipsis:

```html
<nav class="pagination" aria-label="Pagination">
  <ul>
    <li>
      <a href="#" data-prev aria-label="Previous page">
        <icon-wc name="chevron-left" size="sm"></icon-wc>
      </a>
    </li>
    <li><a href="#">1</a></li>
    <li><a href="#">2</a></li>
    <li><a href="#" aria-current="page">3</a></li>
    <li><a href="#">4</a></li>
    <li><a href="#">5</a></li>
    <li><span data-ellipsis>...</span></li>
    <li><a href="#">10</a></li>
    <li>
      <a href="#" data-next aria-label="Next page">
        <icon-wc name="chevron-right" size="sm"></icon-wc>
      </a>
    </li>
  </ul>
</nav>
```

## Full Pagination

Complete pagination bar with result count, page navigation, and page size selector. Best for data tables and admin interfaces where users need full control over data display. The bar is a `<footer>` because it closes the table or list it belongs to: put it inside that `<article>` or `<section>`, where it is not a page landmark.

Full pagination with info and page size:

```html
<footer class="pagination-bar">
  <p class="pagination-info" aria-live="polite">
    Showing <strong>21</strong> to <strong>30</strong> of <strong>97</strong> results
  </p>

  <nav class="pagination" aria-label="Pagination">
    <ul>
      <li>
        <a href="#" data-prev aria-label="First page">
          <icon-wc name="chevrons-left" size="sm"></icon-wc>
        </a>
      </li>
      <li>
        <a href="#" data-prev aria-label="Previous page">
          <icon-wc name="chevron-left" size="sm"></icon-wc>
        </a>
      </li>
      <li><a href="#">1</a></li>
      <li><a href="#">2</a></li>
      <li><a href="#" aria-current="page">3</a></li>
      <li><a href="#">4</a></li>
      <li><a href="#">5</a></li>
      <li><span data-ellipsis>...</span></li>
      <li><a href="#">10</a></li>
      <li>
        <a href="#" data-next aria-label="Next page">
          <icon-wc name="chevron-right" size="sm"></icon-wc>
        </a>
      </li>
      <li>
        <a href="#" data-next aria-label="Last page">
          <icon-wc name="chevrons-right" size="sm"></icon-wc>
        </a>
      </li>
    </ul>
  </nav>

  <p class="page-size-selector">
    <label for="page-size">Show:</label>
    <select id="page-size" aria-label="Items per page">
      <option value="10">10</option>
      <option value="25" selected>25</option>
      <option value="50">50</option>
      <option value="100">100</option>
    </select>
    <span aria-hidden="true">per page</span>
  </p>
</footer>
```

## Disabled States

When on the first or last page, disable the corresponding navigation button to indicate the boundary. Use a `<button>` element with the `disabled` attribute instead of a link.

Disabled pagination states:

```html
<!-- First page - Previous disabled -->
<nav class="pagination" aria-label="Pagination">
  <ul>
    <li>
      <button type="button" disabled aria-label="Previous page">
        <icon-wc name="chevron-left" size="sm"></icon-wc>
      </button>
    </li>
    <li><a href="#" aria-current="page">1</a></li>
    <li><a href="#">2</a></li>
    <li><a href="#">3</a></li>
    <li><span data-ellipsis>...</span></li>
    <li><a href="#">10</a></li>
    <li>
      <a href="#" data-next aria-label="Next page">
        <icon-wc name="chevron-right" size="sm"></icon-wc>
      </a>
    </li>
  </ul>
</nav>

<!-- Last page - Next disabled -->
<nav class="pagination" aria-label="Pagination">
  <ul>
    <li>
      <a href="#" data-prev aria-label="Previous page">
        <icon-wc name="chevron-left" size="sm"></icon-wc>
      </a>
    </li>
    <li><a href="#">1</a></li>
    <li><span data-ellipsis>...</span></li>
    <li><a href="#">8</a></li>
    <li><a href="#">9</a></li>
    <li><a href="#" aria-current="page">10</a></li>
    <li>
      <button type="button" disabled aria-label="Next page">
        <icon-wc name="chevron-right" size="sm"></icon-wc>
      </button>
    </li>
  </ul>
</nav>
```

## CSS Styles

The base pagination styles are included in the nav element styles. These provide consistent sizing, hover states, and current page highlighting:

The pagination bar styles for the full variant (info text, nav, and page size selector) are included in VB's stylesheet. The layout uses CSS Grid to keep the nav centered while info and selector fill the remaining space. A container query handles responsive stacking:

Pagination base styles:

```css
/* Pagination navigation - included in nav styles */
nav.pagination > ul {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--size-2xs);
}

nav.pagination li {
  display: flex;
}

nav.pagination a,
nav.pagination button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding-inline: var(--size-xs);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  background: transparent;
  border: var(--border-width-thin) solid transparent;
  border-radius: var(--radius-m);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

nav.pagination a:hover:not([disabled]):not([aria-current]),
nav.pagination button:hover:not([disabled]):not([aria-current]) {
  background: var(--color-gray-100);
  color: var(--color-text);
}

nav.pagination [aria-current="page"] {
  background: var(--color-interactive);
  color: white;
  border-color: var(--color-interactive);
}

nav.pagination [disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Ellipsis */
nav.pagination [data-ellipsis] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  color: var(--color-text-muted);
  pointer-events: none;
}
```

Pagination bar styles (included in VB):

```css
/* Pagination bar layout — included in VB nav styles */
.pagination-bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--size-m);
  padding: var(--size-m);
  background: var(--color-surface-raised);
  border-radius: var(--radius-m);
}

.pagination-info {
  font-size: var(--font-size-s);
  color: var(--color-text-muted);
}

.page-size-selector {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: var(--size-xs);
  font-size: var(--font-size-s);
  color: var(--color-text-muted);
}

/* Responsive stacking via container query */
@container (max-width: 500px) {
  .pagination-bar {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
  .pagination-bar nav.pagination {
    order: -1;
  }
  .pagination-bar .page-size-selector {
    justify-self: center;
  }
}
```

## Usage Notes

- Always wrap pagination in a `<nav>` element with `aria-label="Pagination"`
- Mark the current page with `aria-current="page"`
- Add `aria-label` to icon-only buttons (e.g., "Previous page", "Next page")
- Use the `disabled` attribute on buttons for first/last page states
- Add `aria-live="polite"` to the results count (`.pagination-info`) so screen readers announce updates when the page changes
- Add `aria-label="Items per page"` on the page-size `<select>` for a complete accessible name
- Ensure all interactive elements are keyboard accessible
- Simple: Blog posts, articles, tutorials - sequential content where page numbers matter less
- Numbered: Search results, product catalogs - when users need to jump to specific pages
- Full: Data tables, admin dashboards - when users need result counts and page size control
- For server-rendered pages, use `<a>` elements with proper URLs
- For SPAs, use `<button>` elements with click handlers
- Consider hiding page numbers on mobile and showing only prev/next
- For very large datasets, consider infinite scroll as an alternative

## Related

Native navigation element documentation

Hierarchical navigation patterns

Data table with built-in pagination

Table example with pagination
