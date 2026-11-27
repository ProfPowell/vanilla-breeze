# <layout-stack>

Vertical flex stack with a consistent gap between children. Attribute form: any semantic element with data-layout="stack". With data-layout-align start/center/end, main/article/section/aside children drop container-type so they size to content instead of collapsing to zero width; add data-container to such a child to keep its container queries.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/stack/
- Vanilla Breeze 0.7.4

## Example

```html
<form action="/search" method="get">
  <layout-stack data-layout-gap="s">
    <label for="q">Search</label>
    <input type="search" id="q" name="q" />
    <button type="submit">Go</button>
  </layout-stack>
</form>

<form data-layout="stack" data-layout-gap="s" action="/search" method="get">
  <label for="q2">Search</label>
  <input type="search" id="q2" name="q" />
  <button type="submit">Go</button>
</form>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | `m` | Gap between children, on the shared size scale. |
| `data-layout-align` | `start`, `center`, `end`, `stretch` | `stretch` | Cross-axis (inline) alignment of children. start/center/end make children content-sized (semantic sectioning children stop being query containers — see data-container). |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-container` | main, article, section, aside | boolean |  | Opt a semantic child back into container queries when the stack is aligned start/center/end. The layout removes container-type from such children so they size to content; this restores it (give the child an explicit inline size, or it collapses). |
