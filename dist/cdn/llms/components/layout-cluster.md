# <layout-cluster>

Horizontal wrapping flex row for groups of short items — tags, buttons, metadata. Attribute form: data-layout="cluster".

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/cluster/
- Vanilla Breeze 0.7.4

## Example

```html
<layout-cluster data-layout-gap="xs">
  <layout-badge>HTML</layout-badge>
  <layout-badge>CSS</layout-badge>
  <layout-badge>JavaScript</layout-badge>
</layout-cluster>

<ul class="unstyled" data-layout="cluster" data-layout-gap="xs">
  <li><layout-badge>HTML</layout-badge></li>
  <li><layout-badge>CSS</layout-badge></li>
  <li><layout-badge>JavaScript</layout-badge></li>
</ul>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | `s` | Gap between items, on the shared size scale. |
| `data-layout-justify` | `start`, `end`, `center`, `between` | `start` | Main-axis distribution. |
| `data-layout-align` | `start`, `end`, `center`, `stretch`, `baseline` | `center` | Cross-axis alignment. |
| `data-layout-nowrap` | boolean |  | Keep everything on one line; no wrapping. Items overflow a narrow container, so let it scroll (overflow-x: auto). |
| `data-layout-overlap` | (no value), `xs`, `s`, `m`, `l` | `s` | Overlap items (avatar groups) in DOM order, later items on top, each with a surface-coloured ring. Items after the first are pulled back by xs 0.25rem, s 0.5rem, m 0.75rem or l 1rem. Forces gap 0. Bare attribute = s. Use a ul with one li per avatar, aria-labelledby on the list and an aria-label on the "+N" chip. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-container` | main, article, section, aside | boolean |  | Opt a semantic child back into container queries. The layout removes container-type from such children so they size to content; this restores it. |
