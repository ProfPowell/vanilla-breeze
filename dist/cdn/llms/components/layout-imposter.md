# <layout-imposter>

Positioned overlay centred over (or pinned to an edge or corner of) its containing block, logically (mirrored in RTL). Element only: there is no data-layout form. Prerequisite: the element it sits over needs position: relative (any non-static position); data-layout-fixed positions against the viewport instead. Visual positioning only: no focus trap, inert background or dialog semantics; use <dialog> or [popover] for modal UI. Stacking order: --imposter-z (default 1, --z-float when fixed).

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/imposter/
- Vanilla Breeze 0.7.4

## Example

```html
<section class="stage">
  <layout-imposter>
    <layout-card>Centered content</layout-card>
  </layout-imposter>
</section>

<style>
  .stage { position: relative; block-size: 200px; }
</style>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-layout-fixed` | boolean |  | Position relative to the viewport instead of the containing block. |
| `data-layout-margin` | `s`, `m`, `l`, `xl` |  | Inset from the edges when pinned to one (and the contain inset). |
| `data-layout-position` | `center`, `top`, `bottom`, `start`, `end`, `top-start`, `top-end`, `bottom-start`, `bottom-end` | `center` | Where to place the overlay. |
| `data-layout-contain` | boolean |  | Never larger than the containing block (the positioned ancestor, or the viewport when fixed) minus the margin on each side; scrolls inside when the content is bigger. |
