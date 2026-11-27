# <fab-stack>

Fixed action button stack. Pins to one of 8 screen positions via the shared data-float system; stacks children vertically with a gap. The first child is the primary action: it sits nearest the anchored edge and is focused first. Default position is bottom-right (inline-end). Dialog and popover children are left to the top layer.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/fab-stack/
- Vanilla Breeze 0.7.4

## Example

```html
<fab-stack data-float="top-right">
  <button type="button" class="fab" aria-label="Search"><icon-wc name="search"></icon-wc></button>
  <button type="button" class="fab" aria-label="Notifications"><icon-wc name="bell"></icon-wc></button>
</fab-stack>

<fab-stack data-float="bottom-right">
  <button type="button" class="fab" aria-label="Compose"><icon-wc name="plus"></icon-wc></button>
  <button type="button" class="fab" aria-label="Chat"><icon-wc name="message-circle"></icon-wc></button>
  <a href="#" data-back-to-top aria-label="Back to top">&uarr;</a>
</fab-stack>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-float` | `top-left`, `top-center`, `top-right`, `center-left`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right` | `bottom-right` | Screen position via the shared [data-float] system. Mirrors in RTL (left/right are logical inline-start/end, with the matching physical safe-area inset); *-center stays on the viewport midpoint. |

## Structure

| Child | Description |
| --- | --- |
| `<settings-panel>` | Site settings trigger (primary action) |
| `<a data-back-to-top>` | Scroll-to-top button (secondary action) |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--float-offset` | Distance from the edge (default: var(--size-l)) |
| `--fab-stack-gap` | Gap between stacked buttons (default: var(--size-s)) |
