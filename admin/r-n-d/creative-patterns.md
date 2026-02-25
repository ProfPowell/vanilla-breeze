# Creative Patterns from Classless CSS Frameworks

**Purpose**: Catalog every interesting CSS technique discovered during the classless framework review. Each pattern is evaluated for VB applicability.  The VB author has evaluated each pattern and this is the list of things we should implement.

**Date**: 2026-02-24

---

## 1. Auto-Numbered Headings

**Source**: Classless.css

**Technique**: CSS counters auto-number headings within articles, creating "1.", "1.1.", "1.1.1." style academic numbering.

```css
article {
  counter-reset: h2 h3;
}

article h2 {
  counter-increment: h2;
  counter-reset: h3;
}

article h2::before {
  content: counter(h2) ". ";
}

article h3 {
  counter-increment: h3;
}

article h3::before {
  content: counter(h2) "." counter(h3) ". ";
}
```

**VB Applicability**: High — as an opt-in variant. Would be valuable for technical documentation, specifications, and academic content.

**Recommended implementation**: `article[data-numbered]` or `article.numbered`. Could also work at the section level. The counter values should use VB tokens for muted color so numbers don't compete with heading text.

```css
article[data-numbered] { counter-reset: vb-h2 vb-h3 vb-h4; }

article[data-numbered] h2 {
  counter-increment: vb-h2;
  counter-reset: vb-h3 vb-h4;
}

article[data-numbered] h2::before {
  content: counter(vb-h2) ".\00a0";
  color: var(--color-text-muted);
}
```

**Priority**: Medium. Niche but genuinely useful when needed.

---

## 2. Auto-Numbered Figures, Tables, and Listings

**Source**: Classless.css

**Technique**: CSS counters auto-label `<figure>`, `<table>`, and code listing captions.

```css
article {
  counter-reset: fig tab lst;
}

article figure {
  counter-increment: fig;
}

article figure figcaption::before {
  content: "Figure " counter(fig) ": ";
  font-weight: bold;
}

article table {
  counter-increment: tab;
}

article table caption::before {
  content: "Table " counter(tab) ": ";
  font-weight: bold;
}
```

**VB Applicability**: High — pairs naturally with auto-numbered headings. Same opt-in pattern.

**Recommended implementation**: Extend `article[data-numbered]` to include figure/table/listing counters. Consider i18n — "Figure" should ideally be overridable via a CSS custom property:

```css
article[data-numbered] {
  --label-figure: "Figure";
  --label-table: "Table";
}

article[data-numbered] figure figcaption::before {
  content: var(--label-figure) " " counter(vb-fig) ": ";
}
```

**Priority**: Medium. Natural companion to pattern #1.

---

## 3. CSS-Only Citation/Footnote System

**Source**: Classless.css

**Technique**: Uses `<cite>` inside `<p>` with CSS counters to auto-number references as superscript markers. Hovering reveals the citation content via absolute positioning.

```css
article {
  counter-reset: ref;
}

article p > cite {
  counter-increment: ref;
  vertical-align: super;
  font-size: 0.75em;
}

article p > cite::before {
  content: "[" counter(ref) "]";
}

/* Hide inline citation text, show on hover */
article p > cite {
  font-size: 0;
}

article p > cite::before {
  font-size: 0.75rem;
}

article p > cite:hover {
  font-size: initial;
  position: absolute;
  /* ... tooltip positioning */
}
```

**VB Applicability**: Low-medium. Clever but fragile — relies on `font-size: 0` hiding, which has accessibility problems. Screen readers will read the hidden text. The hover-to-reveal pattern fails on touch devices.

**If implemented**: Would need a different approach. Perhaps `<sup><a href="#fn-1">[1]</a></sup>` with footnotes at the bottom (traditional web footnotes), styled via VB's existing `sup.footnote-ref` variant. A VB web component (`<foot-note>`) might be the better path.

**Priority**: Low. Interesting concept but the CSS-only approach is too fragile.

---

## 4. Drop Caps / Lettrine

**Source**: Classless.css

**Technique**: First letter of the opening paragraph in an article gets a large, decorative treatment.

```css
article > section:first-of-type > h2:first-of-type + p::first-letter {
  font-size: 3.5em;
  float: left;
  line-height: 0.8;
  margin-right: 0.1em;
  margin-top: 0.1em;
  font-weight: bold;
}
```

**VB Applicability**: High — as an opt-in variant. Drop caps are a classic typographic pattern with legitimate use in editorial, blog, and book-style content.

**Recommended implementation**: `article[data-drop-cap]` or `p.drop-cap`.

```css
article[data-drop-cap] > :is(p, section > p):first-of-type::first-letter,
p[data-drop-cap]::first-letter {
  font-size: 3.5em;
  float: inline-start;
  line-height: 0.75;
  margin-inline-end: 0.1em;
  margin-block-start: 0.05em;
  font-weight: 700;
  color: var(--color-interactive);
}
```

Note: Uses `float: inline-start` for logical property / RTL support. The `initial-letter` CSS property is a better solution but has limited support (Safari only as of 2026).

**Priority**: Medium. Low effort, visually impactful.

---

## 5. Section Ornaments

**Source**: Classless.css

**Technique**: Decorative divider between sections using `::after` pseudo-element.

```css
section::after {
  content: var(--ornament, "* * *");
  display: block;
  text-align: center;
  margin: 2em 0;
  color: #bbb;
  font-size: 1.5em;
}
```

**VB Applicability**: Low as a default. VB's `hr` element with variants already serves this purpose, and semantic HTML provides the `<hr>` element specifically for thematic breaks. Adding decoration to every `<section>` boundary is too opinionated.

**However**: The use of a CSS custom property (`--ornament`) for the content is a nice pattern. This could be a theme-level feature — a theme could set `--ornament` and VB's `hr.decorative` variant could use it.

**Recommended implementation**: Extend `hr` variants rather than adding section ornaments.

```css
hr[data-ornament]::after {
  content: var(--ornament, attr(data-ornament));
  /* ... */
}
```

**Priority**: Skip as a section feature. The `hr` variant already exists.


---

## 6. Magazine-Style Image Float

**Source**: Classless.css

**Technique**: Images inside paragraphs that have siblings automatically float to one side, creating a text-wrap layout.

```css
p > img:not(:only-child) {
  float: right;
  margin: 0 0 1em 1em;
  max-width: 50%;
}
```

**VB Applicability**: Medium. The concept is good but the selector is too aggressive as a default. VB already has `figure.float-start` and `figure.float-end` variants that achieve this with explicit opt-in.

**However**: The idea of images *inside paragraphs* being auto-floated is interesting. In markdown-rendered content, images often end up inside `<p>` tags. A variant like `article[data-prose]` could enable this behavior for markdown/CMS content.

```css
article[data-prose] p > img:not(:only-child) {
  float: inline-end;
  margin-inline-start: var(--size-m);
  margin-block-end: var(--size-s);
  max-inline-size: 50%;
  border-radius: var(--radius-m);
}
```

**Priority**: Low. The explicit `figure.float-*` pattern is more VB-like.

---


## 7. Time Element as Visual Badge

**Source**: water.css, Bolt.css

**Technique**: Style `<time>` with a background, padding, and border-radius to make it visually distinct — like an inline badge or code snippet.

water.css:
```css
time {
  background: var(--background-alt);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}
```

Bolt.css styles it identically to `<kbd>`.

**VB Applicability**: Low as a default. `<time>` is used in many contexts (article dates, event times, relative timestamps) where a badge treatment would be too heavy. VB's current approach — `font-variant-numeric: tabular-nums` — is the right neutral default.

**However**: VB already has `time.datetime` variant that uses monospace font. A `time[data-badge]` or `time.badge` variant could add the pill/badge visual for contexts where dates need to pop.

**Priority**: Low. The existing variants cover the use cases.

---

## 8. Variable Element with Accent Styling

**Source**: matcha.css, water.css

**Technique**: Give `<var>` a distinct visual treatment beyond the browser's default italic.

matcha.css:
```css
var {
  background: var(--accent-bg);
  padding: 0.1em 0.3em;
  border-radius: 0.2em;
  font-style: italic;
}
```

water.css:
```css
var {
  color: var(--variable);
  font-family: monospace;
}
```

**VB Applicability**: Low-medium. VB currently styles `var` in `code/styles.css` with font-style italic. Adding a subtle background or color accent would make variables visually distinct from general italic text, which is semantically correct — `<var>` represents a variable, not emphasis.

**Potential enhancement**: A subtle color tint (not a full background) could work:

```css
var {
  font-style: italic;
  color: var(--color-interactive);
}
```

**Priority**: Low. Current VB styling is adequate. Could revisit during tag-by-tag audit.

---

## 9. pre:has(code) Distinction

**Source**: magick.css

**Technique**: Only style `<pre>` elements that contain `<code>`, leaving bare `<pre>` elements with a different treatment.

```css
pre:has(code) {
  background: var(--code-bg);
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
}

pre:not(:has(code)) {
  /* Plain preformatted text — lighter treatment */
  white-space: pre-wrap;
}
```

**VB Applicability**: Medium. This is a genuinely useful distinction. `<pre><code>` is a code block. Bare `<pre>` is preformatted text (ASCII art, poetry, etc.). They have different visual needs.

VB currently styles both identically via the code file. The `:has()` approach could allow:
- `pre:has(code)` — full code block treatment (background, padding, border-radius, syntax highlighting support)
- `pre:not(:has(code))` — lighter treatment (no background, just font-family and white-space)

**Recommended implementation**: Refine in `code/styles.css` during tag-by-tag audit.

**Priority**: Medium. Good semantic refinement.

---

## 10. Decorative Heading Glyphs

**Source**: magick.css

**Technique**: Insert Unicode decorative characters before/after headings.

```css
h3::before {
  content: "\1F9DB "; /* Unicode glyph */
}

header h1::before {
  content: "\2726"; /* four-pointed star */
}

header h1::after {
  content: "\2726";
}
```

**VB Applicability**: Skip as a framework feature. This is pure theming — specific to magick.css's medieval aesthetic. However, the *mechanism* is interesting. VB themes could define heading decorations via custom properties:

```css
/* In a theme file */
[data-theme="gothic"] {
  --heading-ornament-before: "\2756 ";
  --heading-ornament-after: " \2756";
}
```

**Priority**: Skip for the framework. Themes can do this.  We surely should implement this in our theme system as already we see Kawaii and others using things like this and it would straighten and normalize the theme system.

---

## 11. Zebra-Striped Definition Lists

**Source**: Not seen in any surveyed framework, but a natural extension.

**Technique**: Apply alternating backgrounds to `<dt>`/`<dd>` pairs.

```css
dl.striped dt:nth-of-type(odd),
dl.striped dt:nth-of-type(odd) + dd {
  background: var(--color-surface-raised);
}
```

**VB Applicability**: Medium. VB already has `table.striped`. A `dl.striped` variant would be consistent. Definition lists in glossaries, FAQs, and settings pages benefit from visual row separation.

**Priority**: Low. Nice-to-have during tag-by-tag audit.

---

## 12. Subfigure Support

**Source**: Classless.css

**Technique**: Nested `<figure>` elements inside a parent `<figure>` create a subfigure grid with alphabetic sub-labels.

```css
figure > figure {
  display: inline-grid;
  counter-increment: subfig;
}

figure > figure figcaption::before {
  content: counter(subfig, lower-alpha) ": ";
}
```

**VB Applicability**: Medium. This is a legitimate pattern for academic and technical content where figures have multiple parts (a, b, c). Works naturally with the auto-numbered figures pattern (#2).

**Recommended implementation**: Part of the `article[data-numbered]` variant.

```css
article[data-numbered] figure {
  counter-reset: vb-subfig;
}

article[data-numbered] figure > figure {
  counter-increment: vb-subfig;
  display: inline-block;
  vertical-align: top;
  margin: var(--size-s);
}

article[data-numbered] figure > figure figcaption::before {
  content: "(" counter(vb-subfig, lower-alpha) ") ";
  font-weight: 500;
}
```

**Priority**: Low. Companion to pattern #1 and #2.

---

## 13. Figcaption Sticky Positioning

**Source**: Simple.css

**Technique**: When a figure contains a horizontally-scrollable element (like a wide table), the figcaption stays visible via sticky positioning.

```css
figcaption {
  position: sticky;
  left: 0;
  font-size: 0.85em;
  color: var(--text-muted);
}
```

**VB Applicability**: Medium. This is a subtle but useful UX improvement. When a `<figure>` contains an overflowing `<table>` or `<pre>`, the caption stays anchored at the left edge while the content scrolls horizontally.

**Recommended implementation**: Add to `figure/styles.css` for the `figure.code` and scrollable-table contexts.

```css
figure:has(:is(table, pre)) > figcaption {
  position: sticky;
  inset-inline-start: 0;
}
```

**Priority**: Medium. Small change, nice UX improvement.

---
