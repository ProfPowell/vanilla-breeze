# <layout-center>

Horizontally centered, max-width-constrained container with side gutters. Attribute form: data-layout="center".

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/center/
- Vanilla Breeze 0.7.4

## Example

```html
<layout-center data-layout-max="narrow" data-layout-text>
  <article>
    <h3>Release notes</h3>
    <p>Capped at 40rem and centred.</p>
  </article>
</layout-center>

<article data-layout="center" data-layout-max="narrow" data-layout-text>
  <h3>Release notes</h3>
  <p>Capped at 40rem and centred.</p>
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-layout-max` | `narrow`, `normal`, `wide`, `prose` | `normal` | Max inline size of the content box (box-sizing: content-box; the gutter is added outside): narrow (--content-narrow, 40rem), normal (--content-normal, 60rem), wide (--content-wide, 80rem) or prose (65ch). |
| `data-layout-intrinsic` | boolean |  | Center narrower-than-max content intrinsically (flex column, align center). |
| `data-layout-text` | boolean |  | Center the text as well. |
| `data-layout-gutter` | `none`, `s`, `l` | `m` | Inline padding on each side: none, s or l. The default --size-m applies when the attribute is omitted; there is no m value. The box is content-box, so the gutter adds to the max width. |
| `data-layout-gap` | (no value), `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | `m` | Become a full-width flex column (inline-size fills the parent minus the gutters) with this gap between children, on the shared size scale. Bare attribute = m. |
