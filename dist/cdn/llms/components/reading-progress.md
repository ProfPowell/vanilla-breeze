# <reading-progress>

Decorative fixed-position scroll progress bar (CSS scroll-timeline for the document, JS for data-for targets).

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/reading-progress/
- Vanilla Breeze 0.7.4

## Example

```html
<reading-progress></reading-progress>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-for` | string |  | ID of the element whose bounds define the progress range. Observed. If the element does not exist the bar tracks document scroll until it appears. |
| `data-position` | `top`, `bottom` | `top` | Viewport edge the bar is anchored to. |

## Structure

| Child | Description |
| --- | --- |
| `progress` | Optional SSR child; created when absent. Always aria-hidden: the bar is decorative. |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--reading-progress-color` | Fill colour (default var(--color-accent)); Highlight in forced-colors mode. |
| `--reading-progress-height` | Bar thickness (default 3px). |
| `--reading-progress-offset` | Distance from the anchored edge, e.g. a sticky header's height (default 0). |
| `--reading-progress-z` | z-index (default var(--z-sticky-header)). |

## Accessibility

- Pattern: Decorative progress bar
- The component manages: `aria-hidden`
