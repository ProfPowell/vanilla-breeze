# <layout-card>

Card surface. Element only: there is no data-layout or data-card attribute form; for a surface on a semantic element use data-canvas, for collections use <card-list>. A plain padded block by default; a header / section / footer child (or slot="header|content|footer") switches it to structured mode: header pinned on top, footer pinned at the bottom, every other child stacked between in source order. Surface elements use bare data-* attributes.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/layout-card/
- Vanilla Breeze 0.7.4

## Example

```html
<layout-card>
  Default card with subtle shadow
</layout-card>

<layout-card data-variant="elevated">
  Elevated card with stronger shadow
</layout-card>

<layout-card data-variant="outlined">
  Outlined card with border
</layout-card>

<layout-card data-variant="ghost">
  Ghost card with no background
</layout-card>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-variant` | `elevated`, `outlined`, `ghost` |  | Visual style: elevated (shadow), outlined (border), ghost (no surface). |
| `data-padding` | `none`, `s`, `m`, `l`, `xl` | `m` | Internal padding. Block mode pads the card by the token (none/s/m/l/xl). Structured mode pads the children one step up: header/footer --size-m/--size-l and content --size-l at the default m (s: xs/s and s; l: l/xl and xl; xl: xl/2xl and 2xl); none also drops the header/footer dividers. |
| `data-max` | `narrow`, `normal`, `wide`, `prose` |  | Max inline size, centered (margin-inline: auto in block flow, align-self in flex/grid): --content-narrow / --content-normal / --content-wide, or prose (65ch). Same keyword set as layout-center and canvas. |

## Structure

| Child | Description |
| --- | --- |
| `header` | Structured mode: pinned to the top, padded, with a bottom divider. A direct h1-h6 inside loses its margin and uses --font-size-l. |
| `section` | Structured mode: a content child. Every child that is not the header or footer is content and stacks in source order, one body padding apart. |
| `footer` | Structured mode: pinned to the bottom (margin-block-start: auto), top divider, wrapping flex row of actions aligned to the inline end. |
| `[slot="header"]` | Any element treated as the header (also triggers structured mode). |
| `[slot="content"]` | Any element treated as content (also triggers structured mode, so a slot-only card works). |
| `[slot="footer"]` | Any element treated as the footer (also triggers structured mode). |
