# <layout-sidebar>

Two-column layout: a fixed-basis sidebar beside a flexible content column that wraps below it when there is no room. nav and aside children are the sidebar; every other child is content (hr, [role=separator], template, script and style are skipped); without nav/aside the first child is the sidebar and the last the content. Attribute form: data-layout="sidebar".

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/sidebar/
- Vanilla Breeze 0.7.4

## Example

```html
<layout-sidebar data-layout-gap="m">
  <nav aria-label="Sections">...</nav>
  <article>...</article>
</layout-sidebar>

<section data-layout="sidebar" data-layout-gap="m" aria-label="Settings">
  <nav aria-label="Sections">...</nav>
  <article>...</article>
</section>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | `m` | Gap between the columns, on the shared size scale. |
| `data-layout-side` | `end` |  | end: put the sidebar on the end side. Omit the attribute for the start side (there is no start value). nav/aside children keep DOM order (order: 1); the positional fallback reverses the row (flex-direction: row-reverse), so visual order then differs from DOM order. |
| `data-layout-sidebar-width` | `narrow`, `normal`, `wide` | `normal` | Sidebar basis: 12 / 16 / 20rem (the same three values in every sidebar context). |
| `data-layout-content-min` | `s`, `m`, `l` | `m` | Content column floor before wrapping: 40 / 50 / 60%. One-off: style="--layout-content-min: 45%". |
| `data-layout-nowrap` | boolean |  | Never wrap; the sidebar stays beside the content, also inside a narrow (< 40rem) data-page-layout main. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-layout-sticky` | nav, aside | boolean |  | Sticky sidebar with its own scroll, active when the page opts into the smart sticky system (:root[data-sticky]). |
