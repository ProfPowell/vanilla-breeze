# <layout-switcher>

Flex row that switches to a column once the switcher's own width drops below the threshold (a flex-basis formula, no media or container query). Attribute form: data-layout="switcher" (same modifiers).

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/switcher/
- Vanilla Breeze 0.7.4

## Example

```html
<layout-switcher data-layout-gap="s" data-layout-threshold="l">
  <article>One</article>
  <article>Two</article>
</layout-switcher>

<section data-layout="switcher" data-layout-gap="s" data-layout-threshold="l">
  <article>One</article>
  <article>Two</article>
</section>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-layout-gap` | `none`, `3xs`, `2xs`, `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` | `m` | Gap between items, on the shared size scale. |
| `data-layout-threshold` | `s`, `m`, `l` | `m` | The switcher's own width below which the row becomes a column: 25 / 30 / 40rem. No container query is involved. One-off: style="--layout-threshold: 35rem" (not inherited by nested switchers). |
| `data-layout-limit` | `2`, `3`, `4` |  | Force the column layout once there are more than this many items. |
| `data-layout-reverse` | boolean |  | Reverse the visual order when stacked (flex-wrap: wrap-reverse): the last item is on top once items wrap onto their own lines; the row keeps DOM order. Visual only — focus and reading order stay in DOM order, so use it only when the stacked order is presentational. |
