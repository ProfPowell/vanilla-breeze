# <layout-columns>

Multi-column text flow with a readable measure, vertical rhythm (between direct children), column rules and break hygiene. Attribute form: data-layout="columns" (same modifiers), usually on an <article data-prose>. <reader-view> needs the element form.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/layout-columns/
- Vanilla Breeze 0.7.4

## Example

```html
<layout-columns data-layout-column-count="2">
  <h2>The Measure</h2>
  <p>…</p>
  <p>…</p>
</layout-columns>

<!-- Same layout, no wrapper element -->
<article data-layout="columns" data-layout-column-count="2" data-prose>
  <h2>The Measure</h2>
  <p>…</p>
  <p>…</p>
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-layout-align` | `justify` |  | justify: justified text with automatic hyphenation. Justified narrow columns form uneven word gaps (WCAG 1.4.8, AAA): prefer ragged-right for long text. |
| `data-layout-column-count` | `1`, `2`, `3`, `auto` | `1` | Number of columns. 2 and 3 are maximums: below about 14rem per column they drop to fewer columns (one on a phone). auto fits as many --column-min-width (38ch) columns as the element's own width allows. |
| `data-layout-measure` | `narrow`, `normal`, `wide` | `normal` | Line measure (--measure-narrow / --measure-normal / --measure-wide). Count 1 caps the block width. Counts 2 and 3 cap each column, so the block is at most count × measure + gaps (without the attribute they fill the container). auto uses the measure as the column width. |
| `data-layout-max` | `narrow`, `normal`, `wide` | `normal` | Same as data-layout-measure (ch-based, unlike layout-center's rem-based data-layout-max). |
| `data-layout-centered` | boolean |  | No effect: columns are always centered (margin-inline: auto). Read by the shared typographic core. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-bleed` | direct child | boolean |  | Break out to the full inline size of the nearest query container (main, article, section). Spans every column in a multi-column flow. |
