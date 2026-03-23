---
title: layout-prose
type: custom-element
category: layout
layer: custom-elements
cssFile: src/custom-elements/layout-prose/styles.css
jsRequired: false
status: proposed
related:
  - layout-text
  - reader-view
  - article (native element)
  - main (native element)
---

# `layout-prose` — Specification
## Vanilla Breeze — Custom Element

A layout primitive that encodes typographic reading defaults for long-form
prose. Handles measure, multi-column layout, reading rhythm, and
hyphenation as a pure CSS layer. No JavaScript required. Degrades to
readable single-column text on any screen.

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
- [compendium.json Entry](#compendiumjson-entry)
- [Build Order](#build-order)
- [Open Questions](#open-questions)

---

## Problem Statement

VB has `layout-text` (a text content wrapper) and `<main class="narrow">`
(a measure constraint on the native element), but neither encodes:

- Typographic reading defaults: `hyphens`, `hanging-punctuation`,
  `text-align`, `orphans`, `widows`, `line-height`
- Multi-column layout driven by `data-*` attributes
- The correct pairing of `column-width` vs `column-count` for responsive
  and explicit column strategies
- A semantic home for prose that is distinct from generic layout containers

`layout-prose` fills this gap. It is the correct inner surface for
`reader-view` (Layer 4) but is independently useful anywhere long-form
content appears — articles, documentation, release notes, marketing copy.

---

## Relationship to Existing Elements

| Element | Purpose | Difference |
|---------|---------|------------|
| `layout-text` | Generic text wrapper with gap | No reading defaults, no columns |
| `<main class="narrow">` | Constrains `<main>` width | Native element, no column support |
| `layout-prose` | Reading-optimised prose surface | Column support + full typographic defaults |

`layout-prose` does not replace `layout-text`. Use `layout-text` for
UI copy. Use `layout-prose` for articles, documentation, and any
continuous long-form reading experience.

---

## Four-Layer Stack

```
Layer 1 — Semantic HTML: <article>, <section>, headings, paragraphs
Layer 2 — layout-prose CSS: measure, hyphens, line-height, font defaults
Layer 3 — data-columns attribute: multi-column via CSS attribute selectors
Layer 4 — reader-view web component: paged mode, chrome, JS interaction
```

`layout-prose` owns Layers 2 and 3. It is useful without Layer 4.

---

## HTML API

### Minimal

```html
<layout-prose>
  <article>
    <h1>Article Title</h1>
    <p>Long-form content here.</p>
  </article>
</layout-prose>
```

### With column control

```html
<!-- Auto: browser fits columns by width (recommended) -->
<layout-prose data-columns="auto">
  <article>...</article>
</layout-prose>

<!-- Explicit count -->
<layout-prose data-columns="2">
  <article>...</article>
</layout-prose>

<!-- Explicit measure override -->
<layout-prose data-measure="wide">
  <article>...</article>
</layout-prose>

<!-- Combined: explicit columns with wide measure -->
<layout-prose data-columns="2" data-measure="wide">
  <article>...</article>
</layout-prose>
```

### Inside reader-view (Layer 4)

```html
<reader-view>
  <layout-prose>
    <article>...</article>
  </layout-prose>
</reader-view>
```

`reader-view` queries for `layout-prose` to get its inner scroll surface.
If absent, it wraps the raw child content in one automatically.

---

## Data Attributes

### `data-columns`

Controls column strategy.

| Value | Behaviour | CSS mechanism |
|-------|-----------|---------------|
| _(absent)_ | Single column, measure-constrained | `max-inline-size: var(--measure-normal)` |
| `auto` | Browser fits columns by `--prose-column-width` | `column-width` + breakpoint guard |
| `1` | Force single column regardless of screen | `column-count: 1` |
| `2` | Force two columns | `column-count: 2` |
| `3` | Force three columns | `column-count: 3` |

`auto` is the recommended value for responsive multi-column. Explicit
numbers are for contexts where the author controls viewport size (e.g.
inside `reader-view` on a known-wide canvas).

### `data-measure`

Constrains single-column line length. Has no effect when `data-columns`
is set to 2 or 3.

| Value | Token | Approx. width |
|-------|-------|---------------|
| `narrow` | `--measure-narrow` | 45ch |
| `normal` _(default)_ | `--measure-normal` | 65ch |
| `wide` | `--measure-wide` | 80ch |

### `data-size`

Sets the base reading font size step. Intended for user preference
surfaces (e.g. inside `reader-view`). Not for general use.

| Value | Token |
|-------|-------|
| `s` | `--font-size-sm` |
| `m` _(default)_ | `--font-size-md` |
| `l` | `--font-size-lg` |
| `xl` | `--font-size-xl` |

### `data-align`

Controls paragraph text alignment.

| Value | Behaviour |
|-------|-----------|
| `start` _(default)_ | `text-align: start` |
| `justify` | `text-align: justify` with `hyphens: auto` |

`justify` is appropriate for multi-column layouts where even rags disrupt
the column rule. For single-column, `start` is generally preferable for
screen reading.

---

## CSS Architecture

Located in `@layer custom-elements`.

```css
@layer custom-elements {

  layout-prose {
    /* ── Layout ── */
    display: block;
    max-inline-size: var(--measure-normal);
    margin-inline: auto;

    /* ── Reading defaults ── */
    font-family: var(--font-serif);
    font-size: var(--font-size-md);
    line-height: var(--line-height-relaxed);
    color: var(--color-text);

    /* ── Typographic quality ── */
    hyphens: manual;       /* author controls with &shy; */
    hanging-punctuation: first allow-end;
    orphans: 3;
    widows: 3;

    /* ── Private tokens (overridable per-instance) ── */
    --_column-width: var(--prose-column-width, 38ch);
    --_column-gap:   var(--prose-column-gap,   var(--size-2xl));
  }

  /* ── Measure variants ── */
  layout-prose[data-measure="narrow"] { max-inline-size: var(--measure-narrow); }
  layout-prose[data-measure="wide"]   { max-inline-size: var(--measure-wide); }

  /* ── Size variants ── */
  layout-prose[data-size="s"]  { font-size: var(--font-size-sm); }
  layout-prose[data-size="l"]  { font-size: var(--font-size-lg); }
  layout-prose[data-size="xl"] { font-size: var(--font-size-xl); }

  /* ── Alignment variants ── */
  layout-prose[data-align="justify"] {
    text-align: justify;
    hyphens: auto;
    text-justify: inter-character;
  }

  /* ── Column: auto
     Single column on mobile (< 480px), column-width-driven above.
     max-inline-size lifted so columns can expand to fill.
  ── */
  @media (min-width: 480px) {
    layout-prose[data-columns="auto"] {
      max-inline-size: none;
      columns: var(--_column-width);
      column-gap: var(--_column-gap);
      column-rule: 1px solid var(--color-border);
    }
  }

  /* ── Column: explicit counts
     column-width: unset prevents the column-width constraint
     interfering with the explicit count.
  ── */
  layout-prose[data-columns="1"] {
    column-count: 1;
    column-width: unset;
  }
  layout-prose[data-columns="2"] {
    max-inline-size: none;
    column-count: 2;
    column-width: unset;
    column-gap: var(--_column-gap);
    column-rule: 1px solid var(--color-border);
  }
  layout-prose[data-columns="3"] {
    max-inline-size: none;
    column-count: 3;
    column-width: unset;
    column-gap: var(--_column-gap);
    column-rule: 1px solid var(--color-border);
  }

  /* ── Column break hygiene for child elements ── */
  layout-prose blockquote,
  layout-prose figure,
  layout-prose pre,
  layout-prose table {
    break-inside: avoid;
  }

  layout-prose h2,
  layout-prose h3,
  layout-prose h4 {
    break-after: avoid;
  }
}
```

### Private token overrides

The `--prose-column-width` and `--prose-column-gap` custom properties
allow per-instance overrides without new attributes:

```css
/* Tighter columns in a specific context */
.my-magazine layout-prose {
  --prose-column-width: 30ch;
  --prose-column-gap: var(--size-xl);
}
```

---

## Token Mapping

| Property | Token |
|----------|-------|
| `font-family` | `--font-serif` |
| `font-size` | `--font-size-md` (base) |
| `line-height` | `--line-height-relaxed` |
| `color` | `--color-text` |
| `max-inline-size` (normal) | `--measure-normal` |
| `max-inline-size` (narrow) | `--measure-narrow` |
| `max-inline-size` (wide) | `--measure-wide` |
| `column-gap` | `--size-2xl` (via `--prose-column-gap`) |
| `column-rule-color` | `--color-border` |

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

For explicit counts (`data-columns="2|3"`), `column-width: unset` is
required alongside `column-count` to prevent the two properties from
fighting each other.

---

## compendium.json Entry

```json
{
  "id": "layout-prose",
  "tag": "layout-prose",
  "type": "custom",
  "category": "layout",
  "cssFile": "src/custom-elements/layout-prose/styles.css",
  "jsRequired": false,
  "variants": [
    {
      "id": "default",
      "name": "Default",
      "html": "<layout-prose><article><h2>Article Title</h2><p>Long-form content with good reading defaults applied automatically — measure, line-height, font family, and hyphenation.</p><p>A second paragraph to demonstrate vertical rhythm and spacing.</p></article></layout-prose>"
    },
    {
      "id": "justify",
      "name": "Justified",
      "html": "<layout-prose data-align=\"justify\"><article><h2>Justified Prose</h2><p>Justified text with automatic hyphenation. Suitable for multi-column layouts where ragged-right lines disrupt the column rule.</p></article></layout-prose>"
    },
    {
      "id": "auto-columns",
      "name": "Auto Columns",
      "fixtureWidth": "wide",
      "html": "<layout-prose data-columns=\"auto\" data-align=\"justify\"><article><h2>Responsive Columns</h2><p>Browser determines column count from available width. Single column on mobile, multi-column on wider screens.</p><p>Each column respects the minimum column-width token. Column rules appear automatically.</p></article></layout-prose>"
    },
    {
      "id": "two-column",
      "name": "Two Column",
      "fixtureWidth": "wide",
      "html": "<layout-prose data-columns=\"2\" data-align=\"justify\"><article><h2>Two Columns</h2><p>Explicit two-column layout. Use when the column count must be fixed regardless of viewport width, such as inside a known-size container.</p><p>Blockquotes and figures use break-inside: avoid to prevent awkward splits.</p></article></layout-prose>"
    },
    {
      "id": "narrow",
      "name": "Narrow Measure",
      "html": "<layout-prose data-measure=\"narrow\"><article><h2>Narrow Reading</h2><p>45ch measure. Appropriate for short articles, captions, or sidebar content where a tighter line length improves scannability.</p></article></layout-prose>"
    }
  ]
}
```

---

## Build Order

### Phase 1 — Base styles
- `src/custom-elements/layout-prose/styles.css`
- Single-column defaults only: `display: block`, `max-inline-size`,
  `font-family`, `line-height`, `hyphens`, `hanging-punctuation`,
  `orphans`, `widows`
- Token mapping to VB design tokens
- `break-inside: avoid` on block children

### Phase 2 — Column variants
- `data-columns="auto"` with `@media` breakpoint
- `data-columns="1|2|3"` with `column-count` + `column-width: unset`
- `column-rule` using `--color-border`
- `max-inline-size: none` lifting for multi-column variants

### Phase 3 — Secondary variants
- `data-measure="narrow|wide"`
- `data-size="s|l|xl"`
- `data-align="justify"` with `hyphens: auto`

### Phase 4 — compendium.json + docs
- Add entry to compendium with all variants
- Documentation page at `docs/elements/custom/layout-prose/`
- Screenshot fixtures for each variant

---

## Open Questions

1. **`layout-text` overlap** — Should `layout-text` be deprecated in
   favour of `layout-prose` for all prose contexts, or kept as a
   distinct primitive for UI copy (which has different rhythm needs)?
   Current position: keep both; differentiate clearly in docs.

2. **`data-font` attribute** — Should font family be data-attribute
   driven (e.g. `data-font="serif|sans|mono"`) or left to the consumer
   via CSS custom property override? Font choice has significant visual
   impact and may belong in the variant API rather than CSS-only.

3. **Drop cap support** — Should `layout-prose` provide a `::first-letter`
   drop cap pattern via a variant attribute (e.g.
   `data-drop-cap="true"`)? This is editorial chrome that fits naturally
   here but risks feature creep in a layout primitive.

4. **Column-fill behaviour** — Default `column-fill` is `balance`
   (equalises column heights). `reader-view` needs `column-fill: auto`
   to fill vertically and spill horizontally. Should `layout-prose`
   expose a `data-fill="auto|balance"` attribute, or should `reader-view`
   override this via CSS when it wraps `layout-prose`?
   Current position: `reader-view` sets `column-fill: auto` on the inner
   `layout-prose` via a scoped override. `layout-prose` default stays
   `balance` which is correct for inline use.
