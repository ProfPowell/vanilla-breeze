# <author-index>

Author-grouped view of site content. Fetches a pages.json-shaped source (or enhances authored fallback markup, including when the fetch fails) and adds a diacritic-insensitive filter with a polite live result count.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/author-index/
- Vanilla Breeze 0.7.4

## Example

```html
<author-index data-lens-src="/pages.json"></author-index>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-lens-src` | string |  | URL to pages.json (or compatible source). On failure, authored light-DOM markup is kept and enhanced; an empty host shows an error |
| `src` | string |  | Alias for data-lens-src |
| `placeholder` | string | `Filter authors…` | Search input placeholder; also the input's accessible name |
| `sort` | `alpha`, `count` | `alpha` | Group order: alphabetical by author, or by page count (descending, ties alphabetical). Applies to fetched data only |
| `heading-level` | `1`, `2`, `3`, `4`, `5`, `6` | `2` | Level of the generated "Authors (N)" heading (fetched data only) |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-author-group` | details | boolean |  | Marks an authored fallback group as filterable; hidden when its visible text does not contain the query |

## Accessibility

- Pattern: Native details/summary
- The component manages: `role="status"`, `aria-label`, `aria-hidden`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Open or close an author group | Native behaviour of <summary> |
