---
title: layout-columns
type: custom-element
category: layout
layer: custom-elements
cssFile: src/custom-elements/layout-columns/styles.css
jsRequired: false
status: proposed
related:
  - layout-text
  - reader-view
  - article (native element)
  - main (native element)
---

# `layout-columns` — Specification
## Vanilla Breeze — Custom Element

A layout primitive for CSS multi-column text flow with measure constraints,
column breaks, and vertical rhythm. No JavaScript required. Degrades to a
single measure-constrained column on any screen.

`layout-columns` is a **layout** element — it controls column flow and
measure. It does **not** set font family, hyphenation, or typographic
reading defaults. Those belong to `article` (which already provides
`data-prose`, `data-drop-cap`, and hyphenation refinements) or to
`reader-view` (which provides user-preference surfaces for font size
and family). This separation keeps the element composable and avoids
duplicating work that `article` already ships.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Relationship to Existing Elements](#relationship-to-existing-elements)
- [Four-Layer Stack](#four-layer-stack)
- [HTML API](#html-api)
- [Data Attributes](#data-attributes)
- [CSS Architecture](#css-architecture)
- [Token Mapping](#token-mapping)
- [Column Strategy](#column-strategy)
- [Accessibility](#accessibility)
- [Print Behaviour](#print-behaviour)
- [Theme Interaction](#theme-interaction)
- [compendium.json Entry](#compendiumjson-entry)
- [Build Order](#build-order)
- [Decisions](#decisions)

---

## Problem Statement

VB has `layout-text` (a text content wrapper with vertical rhythm) and
`<main class="narrow">` (a measure constraint on the native element),
but neither provides:

- Multi-column layout driven by `data-*` attributes
- The correct pairing of `column-width` vs `column-count` for responsive
  and explicit column strategies
- Column break hygiene (`break-inside`, `break-after`) for child elements
- A layout home for columnar content that is distinct from generic
  containers and from `article`'s semantic/typographic role

VB also already has `article.blog` (65ch measure + margin centering),
`article[data-prose]` (hyphens, hyphenation limits), and
`article[data-drop-cap]` (drop caps with `initial-letter` PE).
`layout-columns` does **not** duplicate any of this. It owns the
*column flow layer* — `article` owns the *typographic quality layer*.

`layout-columns` is the correct inner surface for `reader-view` (Layer 4)
but is independently useful anywhere columnar content appears — articles,
documentation, release notes, marketing copy, FAQs.

---

## Relationship to Existing Elements

| Element | Purpose | Columns | Typography |
|---------|---------|---------|------------|
| `layout-text` | Vertical rhythm wrapper | No | No (inherits) |
| `layout-center` | Centered max-width container | No | No (inherits) |
| `article.blog` | Semantic article + 65ch measure | No | Hyphenation, drop cap |
| `layout-columns` | Multi-column flow + measure | Yes | No (inherits) |

`layout-columns` does not replace `layout-text`. Use `layout-text` for
UI copy with vertical rhythm. Use `layout-columns` when you need column
flow, measure control, or both. They can nest:

```html
<layout-columns data-column-count="2">
  <layout-text>
    <h2>Section One</h2>
    <p>Content with vertical rhythm inside a column flow.</p>
  </layout-text>
</layout-columns>
```

---

## Four-Layer Stack

```
Layer 1 — Semantic HTML: <article>, <section>, headings, paragraphs
Layer 2 — layout-columns CSS: measure, column flow, break hygiene, rhythm
Layer 3 — article/native CSS: hyphens, hyphenation limits, drop cap, font
Layer 4 — reader-view web component: paged mode, chrome, JS interaction
```

`layout-columns` owns Layer 2. It is useful without Layers 3 or 4.

---

## HTML API

### Minimal (single column with measure constraint)

```html
<layout-columns>
  <article>
    <h1>Article Title</h1>
    <p>Long-form content here.</p>
  </article>
</layout-columns>
```

### With column control

```html
<!-- Auto: browser fits columns by width (recommended) -->
<layout-columns data-column-count="auto">
  <article data-prose>...</article>
</layout-columns>

<!-- Explicit count -->
<layout-columns data-column-count="2">
  <article data-prose>...</article>
</layout-columns>

<!-- Measure override (single-column) -->
<layout-columns data-measure="wide">
  <article>...</article>
</layout-columns>

<!-- Combined: explicit columns with justified text -->
<layout-columns data-column-count="2" data-align="justify">
  <article data-prose>...</article>
</layout-columns>
```

### Inside reader-view (Layer 4)

```html
<reader-view>
  <layout-columns>
    <article data-prose>...</article>
  </layout-columns>
</reader-view>
```

`reader-view` queries for `layout-columns` to get its inner scroll
surface. If absent, it wraps the raw child content in one automatically.
`reader-view` is responsible for setting font family and size preferences
on its scoped `layout-columns` — those are not `layout-columns`
concerns.

---

## Data Attributes

### `data-column-count`

Controls column strategy. Named `data-column-count` (not `data-columns`)
to avoid ambiguity with `card-grid[data-columns]` which controls CSS Grid
template columns — a different mechanism.

| Value | Behaviour | CSS mechanism |
|-------|-----------|---------------|
| _(absent)_ | Single column, measure-constrained | `max-inline-size: var(--measure-normal)` |
| `auto` | Browser fits columns by `--column-min-width` | `column-width` + breakpoint guard |
| `1` | Force single column regardless of screen | `column-count: 1` |
| `2` | Force two columns | `column-count: 2` |
| `3` | Force three columns | `column-count: 3` |

`auto` is the recommended value for responsive multi-column. Explicit
numbers are for contexts where the author controls viewport size (e.g.
inside `reader-view` on a known-wide canvas).

### `data-measure`

Constrains single-column line length. Has no effect when
`data-column-count` is set to `2` or `3` (multi-column lifts the
`max-inline-size` constraint).

| Value | Token | Approx. width |
|-------|-------|---------------|
| `narrow` | `--measure-narrow` | 45ch |
| `normal` _(default)_ | `--measure-normal` | 65ch |
| `wide` | `--measure-wide` | 80ch |

### `data-align`

Controls text alignment. Most useful in multi-column mode where
ragged-right lines disrupt the column rule.

| Value | Behaviour |
|-------|-----------|
| `start` _(default)_ | `text-align: start` |
| `justify` | `text-align: justify` with `hyphens: auto` |

For single-column, `start` is generally preferable for screen reading.

---

## CSS Architecture

Located in `@layer custom-elements`.

```css
@layer custom-elements {

  layout-columns {
    /* ── Layout ── */
    display: block;
    max-inline-size: var(--measure-normal);
    margin-inline: auto;
    padding-inline: var(--size-m);

    /* ── Reading rhythm ── */
    line-height: var(--line-height-relaxed);
    orphans: 3;
    widows: 3;

    /* ── Private tokens (overridable per-instance) ── */
    --_column-width: var(--column-min-width, 38ch);
    --_column-gap:   var(--column-gap,       var(--size-2xl));
  }

  /* ── Vertical rhythm (mirrors layout-text spacing) ── */
  layout-columns > * + * {
    margin-block-start: var(--size-m);
  }

  layout-columns > * + h2 {
    margin-block-start: var(--size-2xl);
  }

  layout-columns > * + h3 {
    margin-block-start: var(--size-xl);
  }

  layout-columns > :is(h2, h3, h4, h5, h6) + * {
    margin-block-start: var(--size-s);
  }

  layout-columns > * + :is(figure, pre) {
    margin-block-start: var(--size-l);
  }

  /* ── Measure variants ── */
  layout-columns[data-measure="narrow"] { max-inline-size: var(--measure-narrow); }
  layout-columns[data-measure="wide"]   { max-inline-size: var(--measure-wide); }

  /* ── Alignment variants ── */
  layout-columns[data-align="justify"] {
    text-align: justify;
    hyphens: auto;
    -webkit-hyphens: auto;
    text-justify: inter-word;
  }

  /* ── Column: auto
     Single column below 48rem, column-width-driven above.
     max-inline-size lifted so columns can expand to fill.
  ── */
  @media (min-width: 48rem) {
    layout-columns[data-column-count="auto"] {
      max-inline-size: none;
      columns: var(--_column-width);
      column-gap: var(--_column-gap);
      column-rule: var(--border-width-thin) solid var(--color-border);
    }
  }

  /* ── Column: explicit counts
     column-width: unset prevents the column-width constraint
     interfering with the explicit count.
  ── */
  layout-columns[data-column-count="1"] {
    column-count: 1;
    column-width: unset;
  }
  layout-columns[data-column-count="2"] {
    max-inline-size: none;
    column-count: 2;
    column-width: unset;
    column-gap: var(--_column-gap);
    column-rule: var(--border-width-thin) solid var(--color-border);
  }
  layout-columns[data-column-count="3"] {
    max-inline-size: none;
    column-count: 3;
    column-width: unset;
    column-gap: var(--_column-gap);
    column-rule: var(--border-width-thin) solid var(--color-border);
  }

  /* ── Column break hygiene ── */
  layout-columns blockquote,
  layout-columns figure,
  layout-columns pre,
  layout-columns table,
  layout-columns details,
  layout-columns ul,
  layout-columns ol {
    break-inside: avoid;
  }

  layout-columns h2,
  layout-columns h3,
  layout-columns h4 {
    break-after: avoid;
  }
}
```

### Private token overrides

The `--column-min-width` and `--column-gap` custom properties allow
per-instance overrides without new attributes:

```css
/* Tighter columns in a specific context */
.my-magazine layout-columns {
  --column-min-width: 30ch;
  --column-gap: var(--size-xl);
}
```

### What this element does NOT set

| Property | Why not | Where it lives |
|----------|---------|----------------|
| `font-family` | Inherits; consumer or `reader-view` sets it | `reader-view`, theme, or author CSS |
| `font-size` | Inherits; `reader-view` provides size preferences | `reader-view[data-size]` |
| `color` | Inherits from body/theme | `tokens/colors.css` |
| `hyphens` (base) | `article[data-prose]` already sets `hyphens: auto` | `article/styles.css` |
| `hanging-punctuation` | Already set on `blockquote` in `i18n/styles.css` | Per-element in native styles |
| `hyphenate-limit-*` | Already set on `article[data-prose]` | `article/styles.css` |
| `drop cap` | Already set on `article[data-drop-cap]` | `article/styles.css` |

---

## Token Mapping

| Property | Token |
|----------|-------|
| `line-height` | `--line-height-relaxed` |
| `max-inline-size` (normal) | `--measure-normal` |
| `max-inline-size` (narrow) | `--measure-narrow` |
| `max-inline-size` (wide) | `--measure-wide` |
| `padding-inline` | `--size-m` |
| `column-gap` | `--size-2xl` (via `--column-gap`) |
| `column-rule` | `--border-width-thin` + `--color-border` |
| Rhythm (default) | `--size-m` |
| Rhythm (before h2) | `--size-2xl` |
| Rhythm (before h3) | `--size-xl` |
| Rhythm (after heading) | `--size-s` |
| Rhythm (before figure/pre) | `--size-l` |

---

## Column Strategy

The correct CSS multi-column idiom for responsive use is `column-width`,
not `column-count`. The browser then determines how many columns fit.

```
column-width: 38ch   →   ~1 col at 390px (iPhone)
                     →   ~2 col at 820px (iPad)
                     →   ~3 col at 1200px (desktop)
```

However, `column-width` is a minimum, not a maximum. On very wide
viewports with no `max-inline-size`, a single column will expand rather
than split if the container is only marginally wider than one column-width.
This is why `auto` mode uses `columns: var(--_column-width)` (shorthand
for `column-width` only, no `column-count`) paired with lifting the
`max-inline-size` constraint.

For explicit counts (`data-column-count="2|3"`), `column-width: unset` is
required alongside `column-count` to prevent the two properties from
fighting each other.

The `@media (min-width: 48rem)` guard on `auto` mode prevents multi-column
on small screens. This breakpoint aligns with VB's existing `48rem`
breakpoint used in `layout-attributes.css` for split/sidebar collapse.

---

## Accessibility

- **Screen readers**: CSS multi-column does not reorder DOM. Content is
  read in source order regardless of visual column placement. No ARIA
  attributes needed.
- **Zoom**: At 200% zoom the `column-width` constraint naturally reduces
  column count (fewer columns fit). At 400% zoom, `auto` mode collapses
  to a single column. Explicit `data-column-count="2|3"` may overflow
  at extreme zoom — authors should prefer `auto` for public content.
- **Reduced motion**: No motion implications — this element is pure layout.
- **Dyslexia theme**: The `_access-dyslexia` theme sets
  `hyphens: none !important` globally. Since `layout-columns` does not
  set `hyphens` in its base styles (only in the `justify` variant), the
  theme override applies cleanly. The `justify` variant's `hyphens: auto`
  will be overridden by the `!important` — this is correct behaviour.
  Authors should avoid `data-align="justify"` when targeting users who
  may use the dyslexia theme.
- **Measure tokens**: Access themes adjust `--measure-narrow`, `--measure-normal`,
  and `--measure-wide` to shorter values. `layout-columns` inherits these
  adjustments automatically.

---

## Print Behaviour

Multi-column layouts can produce poor print output if columns span page
breaks. `layout-columns` relies on the existing `print.css` rules which set
`orphans: 3; widows: 3` globally and add `break-inside: avoid` on block
elements. No additional print-specific rules are needed.

For the `auto` column mode, browsers will typically collapse columns to fit
the print page width. For explicit `data-column-count="2|3"`, the author
accepts responsibility for print behaviour — the columns will render as
specified if the page width allows.

---

## Theme Interaction

`layout-columns` uses only layout and spacing tokens. It does not set
colours, fonts, or surfaces — so themes interact cleanly:

- **Measure tokens**: Themes (especially access themes) may adjust
  `--measure-*` values. `layout-columns` respects these automatically.
- **Border tokens**: `--color-border` and `--border-width-thin` are used
  for column rules. Theme overrides apply.
- **Spacing tokens**: `--size-*` tokens drive rhythm and column gap.
  Theme overrides apply.
- **No font/colour overrides needed**: Since `layout-columns` inherits
  font and colour, themes that change `--font-serif`, `--color-text`,
  or body font-family work without any `layout-columns`-specific
  overrides.

---

## compendium.json Entry

```json
{
  "id": "layout-columns",
  "tag": "layout-columns",
  "type": "custom",
  "category": "layout",
  "cssFile": "src/custom-elements/layout-columns/styles.css",
  "jsRequired": false,
  "variants": [
    {
      "id": "default",
      "name": "Default",
      "html": "<layout-columns><article><h2>Article Title</h2><p>Single-column content with measure constraint and vertical rhythm applied automatically. Line length stays readable at any viewport width.</p><p>A second paragraph to demonstrate spacing between elements.</p></article></layout-columns>"
    },
    {
      "id": "auto-columns",
      "name": "Auto Columns",
      "fixtureWidth": "wide",
      "html": "<layout-columns data-column-count=\"auto\"><article data-prose><h2>Responsive Columns</h2><p>Browser determines column count from available width. Single column on mobile, multi-column on wider screens.</p><p>Each column respects the minimum column-width token. Column rules appear automatically between columns.</p><p>A third paragraph to show content flowing naturally across the column boundary.</p></article></layout-columns>"
    },
    {
      "id": "two-column-justified",
      "name": "Two Column Justified",
      "fixtureWidth": "wide",
      "html": "<layout-columns data-column-count=\"2\" data-align=\"justify\"><article data-prose><h2>Two Columns</h2><p>Explicit two-column layout with justified text. Use when the column count must be fixed regardless of viewport width, such as inside a known-size container.</p><p>Blockquotes and figures use break-inside: avoid to prevent awkward splits across columns.</p></article></layout-columns>"
    },
    {
      "id": "three-column",
      "name": "Three Column",
      "fixtureWidth": "wide",
      "html": "<layout-columns data-column-count=\"3\"><article><h2>Three Columns</h2><p>Three-column layout for wide containers. Best used in controlled-width contexts like dashboards or magazine layouts.</p><p>Column rules and gaps are consistent with the two-column variant.</p><p>Content reflows to source order for screen readers.</p></article></layout-columns>"
    },
    {
      "id": "narrow",
      "name": "Narrow Measure",
      "html": "<layout-columns data-measure=\"narrow\"><article><h2>Narrow Reading</h2><p>45ch measure. Appropriate for short articles, captions, or sidebar content where a tighter line length improves scannability.</p></article></layout-columns>"
    }
  ]
}
```

---

## Build Order

### Phase 1 — Base styles

- `src/custom-elements/layout-columns/styles.css`
- Single-column defaults: `display: block`, `max-inline-size`,
  `margin-inline: auto`, `padding-inline`, `line-height`
- Vertical rhythm: `> * + *` margin rules (mirroring `layout-text`)
- `break-inside: avoid` and `break-after: avoid` on child elements
- Token mapping to VB design tokens

### Phase 2 — Column variants

- `data-column-count="auto"` with `@media (min-width: 48rem)` guard
- `data-column-count="1|2|3"` with `column-count` + `column-width: unset`
- `column-rule` using `--border-width-thin` + `--color-border`
- `max-inline-size: none` lifting for multi-column variants

### Phase 3 — Secondary variants

- `data-measure="narrow|wide"`
- `data-align="justify"` with `hyphens: auto`, `-webkit-hyphens: auto`,
  `text-justify: inter-word`

### Phase 4 — compendium.json + docs

- Add entry to compendium with all variants
- Documentation page at `docs/elements/custom/layout-columns/`
- Screenshot fixtures for each variant
- Register import in `src/custom-elements/index.css`

---

## Decisions

These items were open questions in the original spec. They are now resolved.

1. **`layout-text` overlap** — Keep both. `layout-text` is a vertical
   rhythm primitive for UI copy. `layout-columns` is a column flow
   primitive for long-form content. They can nest: `layout-columns`
   wraps `layout-text` when you need both columns and rhythm within
   a single column. When `layout-columns` is used standalone, it
   includes its own `> * + *` rhythm rules so content reads well
   without requiring `layout-text` inside.

2. **Font family** — `layout-columns` inherits font family. It does not
   set `font-family`. This is a layout primitive, not a typographic one.
   `reader-view` sets font preferences on its inner `layout-columns`
   via scoped CSS. Authors who want serif prose use `article` or a
   parent element to set the font.

3. **Drop cap** — Already solved by `article[data-drop-cap]` with
   `initial-letter` progressive enhancement. Not duplicated here.

4. **Column-fill** — `layout-columns` defaults to `column-fill: balance`
   (the CSS default — equalises column heights). `reader-view` overrides
   this to `column-fill: auto` on the inner `layout-columns` via a
   scoped style, since paged mode needs vertical fill + horizontal spill.

5. **Attribute naming** — `data-column-count` (not `data-columns`) avoids
   ambiguity with `card-grid[data-columns]` and `stats-grid[data-columns]`
   which control CSS Grid `grid-template-columns`. The `data-column-count`
   name maps directly to the CSS property it controls.

6. **Hyphenation** — Delegated to `article[data-prose]` which already
   provides `hyphens: auto`, `hyphenate-limit-chars`, `hyphenate-limit-lines`,
   and `hyphenate-limit-zone`. The only exception is `data-align="justify"`
   which sets `hyphens: auto` as a convenience (justified text without
   hyphens produces rivers of whitespace). The `-webkit-hyphens` prefix
   is included for Safari compatibility.
