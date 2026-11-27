# <site-search>

Pagefind-powered site search in a native modal <dialog>: combobox input, listbox of results, live result count

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/site-search/
- Vanilla Breeze 0.7.4

## Example

```html
<site-search>
  <button data-trigger>
    <icon-wc name="search"></icon-wc>
    Search
  </button>
</site-search>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean |  | Reflected state — set by open()/close() methods, not intended as initial markup |
| `data-pagefind-path` | string | `/pagefind/` | Directory that holds pagefind.js, resolved against the document base. Set it for subpath deploys (e.g. /my-site/pagefind/). |
| `data-base-url` | string |  | Pagefind baseUrl prefixed to result URLs. Default: the directory above data-pagefind-path ("/" for the default path). |
| `data-label-trigger` | string | `Search` | Accessible name of the generated icon trigger (only when no trigger button is authored) |
| `data-label-dialog` | string | `Site search` | Accessible name of the search dialog |
| `data-label-placeholder` | string | `Search documentation...` | Input placeholder |
| `data-label-input` | string | `Search` | Accessible name of the search input |
| `data-label-results` | string | `Search results` | Accessible name of the results listbox |
| `data-label-searching` | string | `Searching...` | Status text while a search runs |
| `data-label-empty` | string | `No results found` | Status text when a query matches nothing |
| `data-label-count` | string | `{count} results` | Status text for several results ({count} is replaced) |
| `data-label-count-one` | string | `1 result` | Status text for exactly one result |
| `data-label-count-more` | string | `{count} of {total} results` | Status text when the index matched more results than the list shows ({count} listed, {total} matched) |
| `data-label-unavailable` | string | `Search unavailable` | Status text when the Pagefind index cannot be loaded (the developer hint goes to the console) |
| `data-label-error` | string | `Search error. Please try again.` | Status text when a search throws |
| `data-label-untitled` | string | `Untitled` | Title shown for a result without meta.title |
| `data-label-navigate` | string | `to navigate` | Footer hint after the arrow keys |
| `data-label-select` | string | `to select` | Footer hint after Enter |
| `data-label-close` | string | `to close` | Footer hint after Esc |
| `data-label-dismiss` | string | `Close search` | Accessible name of the close button beside the input (the Esc key cap; an × on narrow screens) |
| `data-label-browse` | string | `Browse instead` | Heading and accessible name of the browse links when the authored <nav data-browse> has no aria-label |
| `data-label-powered` | string | `Powered by` | Footer credit prefix |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-trigger` | button | boolean |  | Marks the button that opens the search dialog. Falls back to first <button> if absent. |

## Structure

| Child | Description |
| --- | --- |
| `<button data-trigger>` | Button that opens the search dialog (generated with a search icon when absent) |
| `<nav data-browse>` | Optional author-supplied links to other ways into the content (an index, a glossary, a sitemap). Shown in the dialog while there are no results; never shown in the page. Its aria-label, if set, is the heading. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `site-search:open` |  | Fired when the search dialog opens |
| `site-search:close` |  | Fired when the search dialog closes (Escape, backdrop click, close(), or choosing a result) |
| `site-search:change` | `{ value, source: 'api' }` | Fired when the value property sets a new query |

## Methods

| Method | Description |
| --- | --- |
| `open()` | Open the dialog with showModal() and focus the input |
| `close()` | Close the dialog, clear the query and results, and return focus to the trigger |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `isOpen` | `boolean` | Read-only: whether the dialog is open |
| `value` | `string` | The current query. Setting it runs the same debounced search as typing and fires site-search:change |
| `results` | `Array<PagefindResultData>` | Read-only copy of the current Pagefind result records (url, meta, excerpt) |

## Custom states

| State | Description |
| --- | --- |
| `:state(input-debounce-pending)` | A keystroke is waiting out the 150ms debounce before searching |

## Accessibility

- Pattern: Combobox in a native dialog
- You provide: Optionally a trigger button with an accessible name; a labelled search button is generated when none is authored
- The component manages: `role="combobox"`, `role="listbox"`, `role="option"`, `role="status"`, `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-autocomplete`, `aria-activedescendant`, `aria-selected`, `aria-label`, `aria-hidden`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Ctrl+k` / `Meta+k` | Open or close the search dialog | Focus anywhere on the page, including form fields |
| `ArrowDown` | Make the next result active, wrapping to the first | Focus in the search input |
| `ArrowUp` | Make the previous result active, wrapping to the last | Focus in the search input |
| `Enter` | Go to the active result, or to the first result when none is active | Focus in the search input |
| `Escape` | Close the dialog and return focus to the trigger | Focus in the search input |
