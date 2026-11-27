# <layout-grid>

Auto-fit responsive grid: as many columns as fit the minimum width, then wrap. Attribute form: data-layout="grid".

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/grid/
- Vanilla Breeze 0.7.4

## Example

```html
<layout-grid data-layout-min="s" data-layout-gap="s">
  <layout-card data-variant="outlined" data-padding="s"><p>Alpha</p></layout-card>
  <layout-card data-variant="outlined" data-padding="s"><p>Beta</p></layout-card>
  <layout-card data-variant="outlined" data-padding="s"><p>Gamma</p></layout-card>
</layout-grid>

<ul class="unstyled" data-layout="grid" data-layout-min="s" data-layout-gap="s">
  <li><layout-card data-variant="outlined" data-padding="s"><p>Alpha</p></layout-card></li>
  <li><layout-card data-variant="outlined" data-padding="s"><p>Beta</p></layout-card></li>
  <li><layout-card data-variant="outlined" data-padding="s"><p>Gamma</p></layout-card></li>
</ul>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-layout-min` | `xs`, `s`, `m`, `l`, `xl` | `m` | Minimum column width before wrapping: 8 / 10 / 15 / 20 / 25rem. Tracks are clamped to the container (min(…, 100%)), so a grid narrower than the minimum shows one full-width column instead of overflowing. One-off lengths: style="--layout-min: 220px" (not inherited by nested grids). |
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | `m` | Gap between cells, on the shared size scale. |
| `data-layout-subgrid` | (no value), `2`, `3`, `4` | `3` | Each child becomes a subgrid spanning 2, 3 or 4 rows (bare = 3; any other value also spans 3) so header/content/footer line up across siblings. The subgridded rows use the grid's row gap, so data-layout-gap also spaces the parts inside each child — set row-gap on the children to override. Any child works, including article/section (they are not query containers here unless they carry data-container, which opts them out of subgrid alignment). |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-container` | main, article, section, aside | boolean |  | Opt a semantic child of a data-layout-subgrid grid back into container queries. The layout removes container-type from such children so they can be subgrids; this restores it, and the child then sizes its own rows. |
