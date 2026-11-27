# <page-toc>

Table of contents with scroll-spy

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/page-toc/
- Vanilla Breeze 0.7.4

## Example

```html
<section data-toc-ignore>
  <h2>Demo Heading</h2>
  <p>This heading will not appear in the ToC.</p>
</section>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `levels` | string | `h2,h3` | Comma-separated heading levels to include (auto-generated mode) |
| `scope` | string | `main` | CSS selector for the container whose headings are scanned (first match wins; docs layouts use 'main article') |
| `data-title` | string | `On this page` | Summary text and nav aria-label of the generated ToC |
| `orientation` | `horizontal` |  | 'horizontal' renders an inline, horizontally scrollable bar (summary hidden, nesting flattened). Omit for the default vertical tree |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-toc-ignore` | heading (or any ancestor) inside the scope container | boolean |  | Exclude the heading, or every heading inside the marked container, from the generated ToC |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `page-toc:navigate` | `{ id }` | Fired when a ToC link is activated; id is the target heading's id |

## Methods

| Method | Description |
| --- | --- |
| `refresh` | Rebuild the ToC (auto mode) or re-scan authored links (manual mode) after content changes |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `entries` | `Array<{ id?: string, text: string, level: number }>` | Current ToC entries derived from the page headings |

## Accessibility

- Pattern: Landmark navigation
- You provide: Headings that have an id and text content inside the scoped container
- The component manages: `aria-label`, `aria-current`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` | Scroll to the heading and move focus to it | Native behaviour of a link; the component handles the click |
| `Enter` / `Space` | Collapse or expand the whole table of contents | Native behaviour of summary |
