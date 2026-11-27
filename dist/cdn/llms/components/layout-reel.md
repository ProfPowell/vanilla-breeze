# <layout-reel>

Horizontal scrolling strip with proximity snap points, an optional scrollbar and edge hints. Attribute form: data-layout="reel" (same modifiers). When the items hold no focusable content, name the reel and make it focusable: <section data-layout="reel" aria-label="…" tabindex="0">, or <layout-reel role="region" aria-label="…" tabindex="0">.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/reel/
- Vanilla Breeze 0.7.4

## Example

```html
<!-- Element form: add the region role yourself -->
<layout-reel data-layout-item-width="s" role="region" aria-label="Featured items" tabindex="0">
  <layout-card>...</layout-card>
  <layout-card>...</layout-card>
</layout-reel>

<!-- Attribute form: a named section is already a region landmark -->
<section data-layout="reel" data-layout-item-width="s" aria-label="Featured items" tabindex="0">
  <layout-card>...</layout-card>
  <layout-card>...</layout-card>
</section>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-layout-scrollbar` | boolean |  | Show a thin scrollbar. Hidden by default, except under forced colours and on touch-only (hover: none) devices, where it always shows. |
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | `m` | Gap between items, on the shared size scale. |
| `data-layout-padding` | `none`, `s`, `m`, `l` | `s` | Padding on all sides (block padding leaves room for focus rings and shadows); the same value is the inline scroll padding. |
| `data-layout-item-width` | `auto`, `s`, `m`, `l`, `xl`, `full` | `auto` | Item width: auto (content), s / m / l / xl tokens, or full (100%). |
| `data-layout-align` | `start`, `center`, `end`, `stretch` | `stretch` | Cross-axis alignment of items. |
| `data-scroll-hint` | (no value), `start` |  | Fade the edges to hint at overflow, logically (mirrored in RTL). Where scroll-driven animations are supported each edge fades only while there is more content that way; elsewhere both edges fade. start: only the end edge ever fades. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-container` | main, article, section, aside | boolean |  | Opt a semantic child back into container queries (the reel removes container-type from such children so they size to content). |
