# <print-page>

Print button with optional raw-mode toggle

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/print-page/
- Vanilla Breeze 0.7.4

## Example

```html
<print-page>Print this page</print-page>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `raw-toggle` | boolean |  | Adds a checkbox that prints without VB print styles (sets data-print-raw on <html> for the print). The host becomes a labelled role="group" |
| `label` | string | `Print this page` | Button label / accessible name. Falls back to the authored text content, then "Print this page" |
| `variant` | `icon`, `label`, `icon-label` | `icon` | icon: printer icon only (label becomes aria-label); label: text only; icon-label: icon and visible text |
| `data-label-raw` | string | `Print without VB styles` | Text of the raw-toggle checkbox |

## Accessibility

- Pattern: Native button
- The component manages: `aria-label`, `aria-hidden`, `role="group"`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Open the print dialog | Native behaviour of button |
