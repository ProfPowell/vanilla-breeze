# <heading-links>

Add permalink anchors to headings; activating one follows the fragment and copies the section URL

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/heading-links/
- Vanilla Breeze 0.7.4

## Example

```html
<heading-links>
  <h2>Getting Started</h2>
  <p>Content here...</p>
  <h3>Installation</h3>
  <p>More content...</p>
</heading-links>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `levels` | string | `h2,h3` | Comma-separated heading levels to process, h1–h6 only (default: 'h2,h3'). Invalid tokens are ignored; changes are observed |
| `data-label-anchor` | string | `Copy link to` | Anchor accessible-name prefix; the anchor is named "<prefix> <heading text>" (default: 'Copy link to'). Observed |
| `data-label-copied` | string | `Link copied to clipboard` | Screen-reader announcement after the URL is copied (default: 'Link copied to clipboard') |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-toc-ignore` | * | boolean |  | Skip this heading (or every heading inside this element): no anchor, no generated id. Shared with page-toc |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `heading-links:navigate` | `{ id: string, url: string, heading: HTMLElement }` | Fires when an anchor is activated (unmodified primary click or Enter), after the fragment navigation and before the clipboard write |

## Accessibility

- Pattern: Link
- You provide: Headings with text content inside the element
- The component manages: `aria-label`, `aria-labelledby`, `tabindex`
