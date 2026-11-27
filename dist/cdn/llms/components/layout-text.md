# <layout-text>

Long-form reading container: a readable measure plus vertical rhythm between direct children. Attribute form: data-layout="prose" (there is no data-layout="text"). article[data-measure] gives the measure (centered) without the rhythm. Owns the typographic core shared with layout-columns and data-layout="columns".

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/layout-text/
- Vanilla Breeze 0.7.4

## Example

```html
<layout-text data-layout-measure="narrow">
  <h2>Reading Width</h2>
  <p>Measure and vertical rhythm on a wrapper element.</p>
</layout-text>

<article data-layout="prose" data-layout-max="narrow">
  <h2>Reading Width</h2>
  <p>The same measure and rhythm on the article itself.</p>
</article>

<article data-measure="narrow">
  <h2>Reading Width</h2>
  <p>Capped and centered, browser-default spacing.</p>
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-layout-measure` | `narrow`, `normal`, `wide` | `normal` | Line measure: --measure-narrow / --measure-normal / --measure-wide (45 / 65 / 80ch by default; data-fluid and the accessibility themes adjust the tokens). Released to 100% in containers narrower than 30rem. |
| `data-layout-max` | `narrow`, `normal`, `wide` | `normal` | Same as data-layout-measure (the prose attribute form spells it this way). ch-based — layout-center's data-layout-max="narrow" is 40rem, this one is 45ch. |
| `data-layout-centered` | boolean |  | Center the container (margin-inline: auto). |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-bleed` | direct child | boolean |  | Break out to the full inline size of the nearest query container (main, article, section). Works centered or not; centered text bleeds symmetrically. |
