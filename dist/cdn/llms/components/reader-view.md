# <reader-view>

Immersive reading shell with scroll and paged modes. Moves its children into a layout-columns surface with a chrome bar, page navigation, font and column controls.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/reader-view/
- Vanilla Breeze 0.7.4

## Example

```html
<reader-view>
  <article data-prose>
    <h1>Article Title</h1>
    <p>Content renders in scroll mode by default.
    Click Pages for paged reading.</p>
  </article>
</reader-view>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `mode` | `scroll`, `pages` | `scroll` | Reading mode. Observed and reflected. pages is a full-viewport overlay: the rest of the page is made inert, document scroll is locked, focus moves into the pager, Escape returns to scroll. |
| `columns` | `auto`, `1`, `2`, `3` | `auto` | Column count in pages mode. Observed and reflected. |
| `font-controls` | `true`, `false` | `true` | Set to false to omit the font-size buttons from the default chrome. |
| `col-controls` | `true`, `false` | `true` | Set to false to omit the column picker from the default chrome. |
| `reader-title` | string |  | Chrome bar title. Falls back to the first <h1>, then document.title. |
| `persist` | `true`, `false` | `true` | Set to false to disable localStorage persistence of font size, columns (and mode with data-remember-mode). |
| `storage-key` | string |  | localStorage key. Defaults to vb-reader:<location.pathname>, plus #<id> when the element has an id. |
| `data-remember-mode` | boolean |  | Opt in to restoring the persisted mode (including pages) on load. Without it only font size and columns are restored; an authored mode attribute always wins. |
| `data-label-kicker` | string | `Reader` | Override the "Reader" string. |
| `data-label-controls` | string | `Reading controls` | Override the "Reading controls" string. |
| `data-label-mode-group` | string | `Reading mode` | Override the "Reading mode" string. |
| `data-label-mode` | string | `Mode` | Override the "Mode" string. |
| `data-label-scroll` | string | `Scroll` | Override the "Scroll" string. |
| `data-label-pages` | string | `Pages` | Override the "Pages" string. |
| `data-label-font-group` | string | `Font size` | Override the "Font size" string. |
| `data-label-type` | string | `Type` | Override the "Type" string. |
| `data-label-font-decrease` | string | `Decrease font size` | Override the "Decrease font size" string. |
| `data-label-font-increase` | string | `Increase font size` | Override the "Increase font size" string. |
| `data-label-columns-group` | string | `Page columns` | Override the "Page columns" string. |
| `data-label-cols` | string | `Cols` | Override the "Cols" string. |
| `data-label-auto` | string | `Auto` | Override the "Auto" string. |
| `data-label-column-auto` | string | `Auto columns` | Override the "Auto columns" string. |
| `data-label-column-1` | string | `1 column` | Override the "1 column" string. |
| `data-label-column-2` | string | `2 columns` | Override the "2 columns" string. |
| `data-label-column-3` | string | `3 columns` | Override the "3 columns" string. |
| `data-label-pages-region` | string | `Article pages` | Override the "Article pages" string. |
| `data-label-page-nav` | string | `Page navigation` | Override the "Page navigation" string. |
| `data-label-prev` | string | `Previous page` | Override the "Previous page" string. |
| `data-label-next` | string | `Next page` | Override the "Next page" string. |
| `data-label-page-indicator` | string | `{page} / {total}` | Override the "{page} / {total}" string ({page} and {total} are replaced). |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-reader-action` | button | `toggle-mode`, `set-mode-scroll`, `set-mode-pages`, `font-increase`, `font-decrease`, `set-columns`, `prev-page`, `next-page` |  | Action wired by click delegation (default and slotted chrome). |
| `data-reader-value` | button | `auto`, `1`, `2`, `3` |  | Column value for data-reader-action="set-columns". |
| `data-reader-output` | output | `page-indicator`, `mode-label` |  | Filled by the runtime with the page indicator text or the current mode label. |
| `aria-pressed` | button | `true`, `false` |  | Set by the runtime on set-mode-*, set-columns and toggle-mode buttons (runtime). |
| `data-reader-state` | button | `active`, (no value) |  | Styling hook mirroring aria-pressed on mode and column buttons (runtime). |

## Slots

| Slot | Description |
| --- | --- |
| `chrome` | Replaces the default chrome bar. Wire controls with data-reader-action / data-reader-value / data-reader-output. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `reader-view:mode` | `{ mode: 'scroll' \| 'pages' }` | Mode changed (not fired for the initial mode on upgrade). |
| `reader-view:page` | `{ page: number, total: number }` | Current page changed in pages mode (page is 1-based). |
| `reader-view:font` | `{ size: string, index: number }` | Font size stepped up or down. |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--reader-view-z` | z-index of the pages-mode overlay (default var(--z-overlay)). |

## Accessibility

- Pattern: Toggle buttons with a paged region
- The component manages: `role="region"`, `role="group"`, `aria-label`, `aria-pressed`, `aria-live`, `aria-hidden`, `inert`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | Return to scroll mode and move focus to the mode toggle | Pages mode |
| `ArrowRight` / `PageDown` | Go to the next page (arrow reversed in right-to-left) | Pages mode, focus not in a form field |
| `ArrowLeft` / `PageUp` | Go to the previous page (arrow reversed in right-to-left) | Pages mode, focus not in a form field |
| `Space` | Go to the next page | Pages mode, focus not on a button, link or form field |
| `Shift+Space` | Go to the previous page | Pages mode, focus not on a button, link or form field |
| `Home` | Go to the first page | Pages mode, focus not in a form field |
| `End` | Go to the last page | Pages mode, focus not in a form field |
