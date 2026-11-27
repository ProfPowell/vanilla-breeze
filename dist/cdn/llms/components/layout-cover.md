# <layout-cover>

Full-height (min-block-size) flex column that vertically centers a principal element (data-layout-principal; a sole child auto-centers), with header/footer or cover-top/-bottom children pinned to the edges. Attribute form: data-layout="cover".

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/cover/
- Vanilla Breeze 0.7.4

## Example

```html
<layout-cover data-layout-centered style="--layout-min: 14rem">
  <header><small>Header</small></header>
  <hgroup data-layout-principal>
    <h3>Launching soon</h3>
    <p>The principal is centred vertically.</p>
  </hgroup>
  <footer><small>Footer</small></footer>
</layout-cover>

<section data-layout="cover" data-layout-centered aria-label="Launch" style="--layout-min: 14rem">
  <header><small>Header</small></header>
  <hgroup data-layout-principal>
    <h3>Launching soon</h3>
    <p>The principal is centred vertically.</p>
  </hgroup>
  <footer><small>Footer</small></footer>
</section>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-layout-min` | `s`, `m`, `l`, `xl`, `auto` | `xl` | Minimum block size: 50 / 70 / 80vh, xl = 100dvh, auto = none. One-off: style="--layout-min: 65vh" (beats the token; registered inherits:false so it never reaches nested layouts; layout-grid reads the same property as its minimum column width). |
| `data-layout-padding` | `none`, `s`, `m`, `l`, `xl` | `m` | Padding on all sides. |
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | `none` | Minimum space between all children (top, principal, bottom), on the shared size scale. The principal's auto margins still centre it. |
| `data-layout-centered` | boolean |  | Center the principal and text horizontally; header/footer (and data-layout-cover-top/-bottom) children still span the full width. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-layout-principal` | any child | boolean |  | The vertically centered principal element. A sole child auto-centers without it. |
| `data-layout-cover-top` | any child | boolean |  | Pin to the top (a <header> child is pinned automatically). |
| `data-layout-cover-bottom` | any child | boolean |  | Pin to the bottom (a <footer> child is pinned automatically). |
| `data-container` | main, article, section, aside | boolean |  | With data-layout-centered, the layout removes container-type from semantic children so they size to their content instead of collapsing; this opts one back into container queries. |
