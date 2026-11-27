# Content Feed Pattern

Filter + sort + paginated card list — the classic blog/product/search-results layout assembled from existing VB primitives. No content-feed component required.

- Documentation: https://vanilla-breeze.com/docs/patterns/data/content-feed/
- Vanilla Breeze 0.7.4

## The recipe in one snippet

The "content feed" page type — a list of substantial items with optional filtering, sorting, and pagination — is a composition over existing primitives, not a single component. Three pieces:
- `<site-search>` for filtering / highlighting
- `<card-list>` (or any list-shaped container: `<ul>`, `<ol>`, `<table>`, `<layout-grid>`) for rendering
- `data-paged` upscale for pagination + URL state

Each piece is independently testable, replaceable, and re-composable. The "content-feed" component this would have been dissolves into the recipe below.

Filtered, paginated card grid:

```html
<site-search target="#feed"></site-search>

<card-list id="feed"
           data-paged
           data-paged-size="20"
           data-paged-style="numbered"
           data-paged-url="page">
  <article>...</article>
  <article>...</article>
  ...
</card-list>
```

## Variants

Native `<ul>`; numbered pagination with the page in the URL so individual pages are linkable / shareable.

`<layout-grid>` for the auto-fitting card grid; `load-more` style for catalog-style browsing.

`<site-search>` handles the input + highlighting; `infinite` pagination drops the user into a continuous scroll once the hits exceed one screen.

Native `<table>`; `data-paged` paginates the `<tbody>` rows, leaving `<thead>` visible. `prev-next` style fits the dense layout.

```html
<ul data-paged data-paged-size="10" data-paged-url="page">
  <li><article>...post 1...</article></li>
  <li><article>...post 2...</article></li>
  ...
</ul>
```

```html
<layout-grid data-layout-min="l" data-layout-gap="m"
             data-paged data-paged-size="12" data-paged-style="load-more">
  <layout-card>...</layout-card>
  <layout-card>...</layout-card>
  ...
</layout-grid>
```

```html
<site-search target="#results"></site-search>

<card-list id="results"
           data-paged data-paged-size="20" data-paged-style="infinite">
  <article>...result 1...</article>
  <article>...result 2...</article>
  ...
</card-list>
```

```html
<table data-paged data-paged-size="50" data-paged-style="prev-next">
  <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th></tr></thead>
  <tbody>
    <tr><td>...</td><td>...</td><td>...</td></tr>
    ...
  </tbody>
</table>
```

## URL state

Opt into URL syncing with `data-paged-url="page"` when the page is independently linkable — blog indices, search results, paginated lists in articles. Skip it for ephemeral surfaces like dashboards or modal lists where browser back/forward shouldn't navigate pages.

The attribute uses the History API's `pushState`; `popstate` automatically re-syncs the rendered page. Reload preserves position via the URL parameter.

## Filtering composition

Two paths depending on how dynamic the content is:
- Author-rendered items, client filtering — `<site-search target="#feed">` filters the items in place. Pagination from `data-paged` applies to the filtered subset automatically (the engine re-paginates on `MutationObserver` child changes).
- Server-rendered subsets — handle the filter in your data layer; re-render the items into the container; `data-paged` picks up the new children and re-paginates from page 1.

## Sorting composition

VB ships `data-sort` on `<data-table>` column headers for in-table sorting. For other containers, sort either via your data layer (re-render) or with a vanilla `<select>` + JS that reorders DOM nodes (the `data-paged` engine re-paginates on the resulting child mutations).

A generic `data-sortable` upscale for arbitrary list containers may land later if a third use case appears.

## Decoupled pagination controls

When the items and the controls live in different parts of the layout — sticky header pager + items below, sidebar pager driving the main column, top + bottom pagers staying in sync — use the `<pager-wc>` element form. Same engine; different surface.

Top + bottom pagers:

```html
<pager-wc target="#feed"></pager-wc>

<card-list id="feed" data-paged data-paged-size="20" data-paged-controls="none">
  <article>...</article>
</card-list>

<pager-wc target="#feed"></pager-wc>
```

## Accessibility

- Wrap the whole composition in a `<section aria-label="...">` or use the existing landmark of the page.
- The `data-paged` nav uses native `<button>` elements with `aria-current="page"`; the `prev-next` style includes an `aria-live="polite"` "Page N of M" status.
- For server-rendered re-fetches, set `aria-busy="true"` on the container while loading and announce the new count in a live region.

## When NOT to use this pattern

- Timelines of events — use `<activity-feed>`. WAI-ARIA Feed semantics, time grouping, and infinite-scroll built in.
- Conversations — use `<chat-window>` + `<chat-thread>`.
- Threaded comments — use `<comment-thread>`.
- Dense data with column-level sort/filter — use `<data-table>` with its built-in `data-sort` + `data-paged`.

The recipe above is for substantial, paginated content items (articles, products, search hits). The components above each cover their own shape better than a generic feed would.
