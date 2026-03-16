---
title: Vanilla Breeze — Typography System Spec
description: Planning document for incorporating web typography best practices into Vanilla Breeze, derived from Richard Rutter's Web Typography.
date: 2026-03-06
tags:
  - vanilla-breeze
  - typography
  - css
  - spec
---

# Vanilla Breeze — Typography System Spec

This document defines typography improvements to incorporate into Vanilla Breeze, derived from a review of Richard Rutter's *Web Typography* (2017). Each section describes the principle, the implementation, and where it belongs in the framework's layer architecture.

All implementations are CSS-native, platform-first, and follow Vanilla Breeze's progressive enhancement philosophy.

## Table of Contents

- [Guiding Principles](#guiding-principles)
- [1. The Readability Triad — Prose Defaults](#1-the-readability-triad--prose-defaults)
- [2. Rem vs Em — Global vs Local Sizing](#2-rem-vs-em--global-vs-local-sizing)
- [3. Responsive Text Sizing — Reading Distance Model](#3-responsive-text-sizing--reading-distance-model)
- [4. Heading Scale at Breakpoints — Width + Height Queries](#4-heading-scale-at-breakpoints--width--height-queries)
- [5. Display Text — vmin and Hybrid calc()](#5-display-text--vmin-and-hybrid-calc)
- [6. Numeral Variants — font-variant-numeric](#6-numeral-variants--font-variant-numeric)
- [7. Subscripts and Superscripts — font-variant-position](#7-subscripts-and-superscripts--font-variant-position)
- [8. Hyphenation — Full Configuration](#8-hyphenation--full-configuration)
- [9. Tables — Data-Ink Ratio Defaults](#9-tables--data-ink-ratio-defaults)
- [10. Drop Caps — initial-letter](#10-drop-caps--initial-letter)
- [11. Tracking — Contextual Letter-Spacing Rules](#11-tracking--contextual-letter-spacing-rules)
- [12. Vertical Rhythm — Baseline Token System](#12-vertical-rhythm--baseline-token-system)
- [Implementation Priorities](#implementation-priorities)
- [Layer Architecture Notes](#layer-architecture-notes)

---

## Guiding Principles

These come directly from Rutter and underpin every decision below:

- **Typography serves the reader, not the designer.** Good typography is invisible.
- **The web reader controls the medium.** Never override user font-size preferences. Always use `rem` for text.
- **Readability has three legs:** measure (line length), text size, and line spacing. Change one and you must adjust the others.
- **em for local, rem for global.** Components scale internally with `em`; page-level sizing uses `rem`.
- **Left-aligned ragged-right is the safe default.** Justified text requires hyphenation. When in doubt, left-align.
- **Unitless `line-height` always.** Unitless values inherit the multiplier; unit-based values inherit the computed pixel value, causing broken heading spacing.

---

## 1. The Readability Triad — Prose Defaults

### Principle

Six centuries of typesetting converge on the same comfortable line length: 45–75 characters, or roughly 23–38em. The book notes screen research shows readers *prefer* shorter lines even if they can read longer ones faster. Start with the preference.

The three legs are inseparable. A max-width constraint, correct font-size, and appropriate line-height must be set together or the stool tips.

**Key insight:** Use `38em` for line length, not `65ch`. The `ch` unit varies by font width (condensed vs expanded typefaces), making it unreliable for layout constraints. `em` is font-size-neutral.

### Implementation

```css
@layer base {
  article,
  .prose {
    /* Leg 1: measure — upper bound of the comfortable range */
    max-inline-size: 38em;

    /* Leg 2: text size — respect user default, start at 1rem */
    font-size: 1rem;

    /* Leg 3: line spacing — unitless is critical for correct inheritance */
    line-height: 1.5;

    /* Improved line breaking — avoids orphans, prevents widow words */
    text-wrap: pretty;
  }

  /* Lead paragraph — larger, slightly tighter */
  article > p:first-of-type,
  .prose > p:first-of-type {
    font-size: 1.125rem;
    line-height: 1.4;
    color: var(--text-muted);
  }
}
```

### Where It Lives

`@layer base` — applies to all prose containers. Used by `article`, `.prose`, and long-form content elements.

---

## 2. Rem vs Em — Global vs Local Sizing

### Principle

Rutter is precise: **rem scales with the page** (global), **em scales within a component** (local). If a component's font size changes, its internal padding, gap, and spacing should change with it — that's `em`. If something should track the document's root font size, that's `rem`.

The classic failure mode: nested lists with `font-size: 0.9em` shrink each level because `em` inherits. Using `rem` prevents the shrinking list problem.

### Implementation

```css
/* GLOBAL — page-level sizes use rem */
h1 { font-size: 2.441rem; }
p  { font-size: 1rem; }

/* LOCAL — component-internal spacing uses em */
.pullquote {
  font-size: 1.25rem;   /* sets the component's own size in rem */
  padding: 1em;         /* scales with the pullquote's font size */
  gap: 0.75em;          /* same */
}

/* Nested lists — use rem to prevent compounding shrink */
li { font-size: 1rem; }

/* Code blocks — em relative to parent prose size */
code {
  font-size: 0.875em;   /* 87.5% of whatever surrounds it */
}
```

### Where It Lives

Document this rule explicitly in Vanilla Breeze's CSS architecture docs and token naming conventions. Token names like `--space-component-*` should be `em`-based; `--space-page-*` should be `rem`-based.

---

## 3. Responsive Text Sizing — Reading Distance Model

### Principle

This is one of the book's most actionable insights. The comfortable perceived size of text is ~30 arcminutes. To achieve that, text must be *physically larger* on screens held farther away. Reading distances by device:

| Device | Distance | Required text size | rem equivalent |
|--------|----------|--------------------|----------------|
| Phone | ~30cm | ~16px | `1rem` |
| Laptop/tablet | ~45cm | ~18–19px | `1.125rem` |
| Desktop display | ~60cm | ~22px | `1.375rem` |

This is **not** about breakpoints as device detection. It is about treating wider viewports as proxies for greater reading distance. Use `em`-based breakpoints so the system also responds to users who've increased their browser default font size.

### Implementation

```css
/* Base — phone default, respects user preference */
p, li, td {
  font-size: 1rem;
}

/* Laptop/tablet — 60em ≈ 960px at 16px default */
@media screen and (min-width: 60em) {
  p, li, td {
    font-size: 1.125rem;
  }
}

/* Large desktop — 120em ≈ 1920px at 16px default */
@media screen and (min-width: 120em) {
  p, li, td {
    font-size: 1.375rem;
  }
}
```

> **Note:** Never set `font-size` in pixels on `body` or `html`. This overrides the user's browser preference and is an accessibility failure. Always start from `1rem`.

### Where It Lives

`@layer base` — global paragraph sizing responsive rules.

---

## 4. Heading Scale at Breakpoints — Width + Height Queries

### Principle

Default heading sizes work on phones but lack contrast and impact on large screens. You need *larger* headings at wider viewports to maintain the hierarchy signal — a heading that looks large on a phone looks proportionally small on a 27" monitor next to big body text.

**Critical addition:** always pair width queries with height queries. Ultrawide shallow screens (cinematic 21:9 displays, resized browser windows) would otherwise get disproportionately huge headings. A rule of thumb: minimum height = half the minimum width.

### Implementation

Scale derived from a Perfect Fourth (4:3) ratio — a musically and photographically grounded ratio that ties well to common screen aspect ratios.

```css
/* Small screens — default scale */
h1 { font-size: 2.0625rem;  }   /* 33px */
h2 { font-size: 1.5625rem;  }   /* 25px */
h3 { font-size: 1.3125rem;  }   /* 21px */
h4 { font-size: 1rem;       }   /* 16px */

/* Headings always unitless line-height, always balance-wrapped */
h1, h2, h3, h4, h5, h6 {
  line-height: 1.15;
  text-wrap: balance;
}

/* Laptop/tablet — width AND height */
@media screen and (min-width: 60em) and (min-height: 30em) {
  h1 { font-size: 3.1875rem; }   /* 51px */
  h2 { font-size: 2.0625rem; }   /* 33px */
  h3 { font-size: 1.5625rem; }   /* 25px */
  h4 { font-size: 1.125rem;  }   /* 18px */
}

/* Large desktop — width AND height */
@media screen and (min-width: 120em) and (min-height: 60em) {
  h1 { font-size: 4.875rem;  }   /* 78px */
  h2 { font-size: 2.75rem;   }   /* 44px */
  h3 { font-size: 1.75rem;   }   /* 28px */
  h4 { font-size: 1.3125rem; }   /* 21px */
}
```

### Where It Lives

`@layer base` — heading element defaults.

---

## 5. Display Text — vmin and Hybrid calc()

### Principle

Display text (hero headings, pull quotes, large callouts) is "a picture of text" — it sets mood before it is read. It should scale with the screen like an image scales, not like text scales.

**The vw problem:** `font-size: 13vw` creates wildly different sizes between portrait and landscape on the same device. On a phone rotated landscape, the text doubles in size.

**The vmin solution:** `vmin` is always the *smaller* dimension, giving consistent perceived size across orientations.

**Subheadings:** scaling linearly with `vmin` makes subheadings grow too fast relative to body text on large screens. Use a `calc()` hybrid — a `rem` floor plus a `vmin` growth component — to keep the relationship proportional.

### Implementation

```css
/* Hero / display heading */
.display-heading {
  font-size: 13vmin;
  line-height: 1;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

/* Supporting heading alongside display text */
.display-subheading {
  /* Floor at 8px (0.5rem × 16), grows gently with viewport */
  font-size: calc(0.5rem + 2.5vmin);
  line-height: 1.2;
}

/* Guard against extremely wide/shallow screens */
@media screen and (min-width: 90em) and (min-height: 45em) {
  .display-heading {
    margin-block-start: 25vh;
    margin-block-end: 1em;
  }
}
```

### Hybrid Scale Reference

For the `calc(base + viewport)` pattern, the formula is: `font-size: calc(Xrem + Yvmin)` where `X` controls the minimum size and `Y` controls the rate of growth. Start with the values above and experiment.

| Viewport | `calc(0.5rem + 2.5vmin)` result |
|----------|---------------------------------|
| 320px | 16px |
| 768px | 27px |
| 1024px | 34px |
| 1440px | 44px |
| 1920px | 56px |

### Where It Lives

`@layer utilities` — `.display-heading`, `.display-subheading` utility classes, or component-level within hero/banner components.

---

## 6. Numeral Variants — font-variant-numeric

### Principle

Numbers have two forms, analogous to upper- and lowercase letters:

- **Lining numerals** `0123456789` — all the same height, cap-height. "Shout" in running text. Correct beside capitals and in headings.
- **Old-style numerals** `0123456789` — varying heights, sit naturally among lowercase letterforms. Correct in body text.
- **Tabular numerals** — monospaced width. Essential in tables so columns align vertically.

Setting the wrong numeral style is a common, invisible-until-noticed error. Getting it right is exactly the kind of invisible polish that defines a quality framework.

```
Running text with lining numerals: "Our 2024 revenue was $4,200,000"
                                              ^^^^        ^^^^^^^^^
                                              These shout. Old-style would blend in.
```

### Implementation

```css
@layer base {
  /* Body text — old-style blends with lowercase */
  body {
    font-variant-numeric: oldstyle-nums;
  }

  /* Headings — lining sits naturally beside capitals */
  h1, h2, h3, h4, h5, h6 {
    font-variant-numeric: lining-nums;
  }

  /* Tables — tabular lining for column scanning and comparison */
  table {
    font-variant-numeric: lining-nums tabular-nums;
  }

  /* Explicit override for numeric data in prose */
  .numeric,
  [data-type="number"] {
    font-variant-numeric: lining-nums tabular-nums;
  }
}
```

> **Note:** Many free/system fonts only have one numeral style. These rules are progressive enhancement — they improve typography when the font supports it and degrade gracefully when it doesn't.

### Where It Lives

`@layer base` — element-level defaults. No class needed for the common cases.

---

## 7. Subscripts and Superscripts — font-variant-position

### Principle

Browser default `<sup>` and `<sub>` styling takes a regular numeral, makes it smaller, and raises/lowers it. This breaks line spacing — every line containing a superscript has a slightly taller line, creating uneven vertical rhythm.

Professional fonts contain *designed* super/subscript glyphs via OpenType. These are positioned correctly by the type designer, don't affect line height, and look correct. CSS exposes them via `font-variant-position`.

The `@supports` guard is essential: browsers that don't support `font-variant-position` should keep their default behavior rather than get broken positioning.

### Implementation

```css
@layer base {
  sup {
    font-variant-position: super;
  }

  sub {
    font-variant-position: sub;
  }

  /* Only override browser defaults when font-variant-position is supported */
  @supports (font-variant-position: super) {
    sup {
      vertical-align: inherit;
      font-size: inherit;
    }
  }

  @supports (font-variant-position: sub) {
    sub {
      vertical-align: inherit;
      font-size: inherit;
    }
  }
}
```

### Where It Lives

`@layer base` — element defaults for `<sup>` and `<sub>`.

---

## 8. Hyphenation — Full Configuration

### Principle

Hyphenation is tightly coupled to alignment:

- **Justified text without hyphenation** creates rivers — large irregular gaps between words. Always pair justification with hyphenation.
- **Left-aligned text with hyphenation** reduces excessive raggedness at narrow column widths without the downsides of justification.
- **Vanilla Breeze default:** left-aligned, `hyphens: auto` in prose, with controlled limits.

The book details the full hyphenation CSS API. Most implementations use only `hyphens: auto` and miss the quality controls.

### Implementation

```css
@layer base {
  /* Prose — left-aligned with automatic controlled hyphenation */
  article,
  .prose {
    hyphens: auto;

    /* Only hyphenate words of 6+ chars, leaving 3 before and 2 after break */
    hyphenate-limit-chars: 6 3 2;

    /* Maximum 2 consecutive hyphenated lines (no "ladders") */
    hyphenate-limit-lines: 2;

    /* Allow 8% rag before forcing a hyphen — reduces hyphen frequency */
    hyphenate-limit-zone: 8%;
  }

  /* Never hyphenate headings — ruins readability at large sizes */
  h1, h2, h3, h4, h5, h6 {
    hyphens: none;
  }

  /* Never hyphenate abbreviations or proper nouns marked up correctly */
  abbr,
  .proper-noun {
    hyphens: manual;
  }

  /* Narrow components (sidebars, cards) benefit from hyphenation */
  aside,
  .card-body {
    hyphens: auto;
    hyphenate-limit-chars: 6 3 2;
    hyphenate-limit-lines: 2;
  }
}
```

> **Note:** `hyphens: auto` requires `lang` set on the `<html>` element to choose the correct hyphenation dictionary. Vanilla Breeze should document this dependency. The `<html lang="en">` attribute is required for auto-hyphenation to work and is also required for screen readers — two reasons to always set it.

### Where It Lives

`@layer base` — prose and heading defaults. Consider a note in the framework's "prerequisites" documentation about `lang` attribute requirement.

---

## 9. Tables — Data-Ink Ratio Defaults

### Principle

Rutter applies Tufte's data-ink ratio principle: remove every element that isn't data or white space. No zebra striping, no full borders, no forced full-width stretch.

**The four-step table design progression from the book:**
1. Remove stretch — let columns size to their content.
2. Remove fills, gridlines, borders, and bolding.
3. Left-align text, right-align numbers, align headings to match their data.
4. Put white space to work to group and separate rows.

The responsive table pattern — linearizing to a labeled list below a narrow breakpoint — is CSS-only and uses `data-title` attributes to inject labels.

### Implementation

```css
@layer base {
  table {
    border-collapse: collapse;

    /* Tabular lining numerals for column scanning */
    font-variant-numeric: lining-nums tabular-nums;

    /* Do NOT set width: 100% — let columns size to content */
  }

  th,
  td {
    padding: 0.125em 0.5em 0.25em;
    line-height: 1;
    text-align: left;

    /* No borders by default — white space provides separation */
    border: none;
  }

  /* Right-align numeric columns */
  td.num,
  td[data-type="number"] {
    text-align: right;
  }

  /* Align heading to match data alignment */
  th.num,
  th[data-type="number"] {
    text-align: right;
  }

  /* Row grouping — subtle separator between logical sections */
  tbody + tbody {
    border-block-start: 1px solid var(--border-subtle, oklch(85% 0 0));
  }

  /* Table caption — below table, subordinate sizing */
  caption {
    caption-side: bottom;
    font-size: 0.875rem;
    color: var(--text-muted);
    text-align: left;
    padding-block-start: 0.5em;
  }

  /* Responsive: wrap table for horizontal scroll on small screens */
  .table-wrap {
    max-inline-size: 100%;
    overflow-x: auto;
  }
}

/* Linearize simple tables to labeled lists below narrow viewports */
@media (max-width: 25em) {
  .table-responsive table,
  .table-responsive caption,
  .table-responsive tbody,
  .table-responsive tr,
  .table-responsive th,
  .table-responsive td {
    display: block;
    text-align: left;
  }

  .table-responsive thead,
  .table-responsive th:empty,
  .table-responsive td:empty {
    display: none;
  }

  /* Inject labels from data-title attribute */
  .table-responsive th[data-title]::before,
  .table-responsive td[data-title]::before {
    content: attr(data-title) ": ";
    display: inline-block;
    font-weight: 600;
    min-inline-size: 4em;
  }
}
```

### HTML Pattern

```html
<!-- Wrap in figure for horizontal scroll on small screens -->
<figure class="table-wrap table-responsive">
  <table>
    <caption>Imperial to metric conversion factors</caption>
    <thead>
      <tr>
        <th data-title="Convert">To convert</th>
        <th data-title="Into">Into</th>
        <th data-title="Multiply by" class="num">Multiply by</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td data-title="Convert">inches</td>
        <td data-title="Into">millimetres (mm)</td>
        <td data-title="Multiply by" class="num">25.4</td>
      </tr>
    </tbody>
  </table>
</figure>
```

### Where It Lives

`@layer base` — `table`, `th`, `td`, `caption` element defaults. `.table-wrap` and `.table-responsive` in `@layer utilities`.

---

## 10. Drop Caps — initial-letter

### Principle

Drop caps have been used for over 400 years. Until recently they were impractical on the web due to cross-browser alignment issues. The CSS `initial-letter` property hands all alignment math to the browser — baseline alignment and cap-height alignment are handled automatically.

Convention: the drop cap should align to the cap-height of the first line at the top, and share a baseline with the corresponding line at the bottom. `initial-letter: 3` means a 3-line drop cap.

Variations:
- `initial-letter: 3` → 3-line drop cap (sinks into text)
- `initial-letter: 3 1` → 3-line raised cap (sits on first baseline)
- `initial-letter: 3 2` → 3-line sunken cap (hybrid)

Fleurons (decorative section separators via `<hr>`) are a related pattern — HTML-first, no JavaScript, stylistically appropriate for long-form reading contexts.

### Implementation

```css
@layer utilities {
  /* Standard 3-line drop cap on first paragraph of an article */
  .drop-cap > p:first-of-type::first-letter {
    initial-letter: 3;
    font-weight: 700;
    margin-inline-end: 0.1em;
  }

  /* Raised cap variant */
  .raised-cap > p:first-of-type::first-letter {
    initial-letter: 3 1;
  }

  /* Section separator fleuron via <hr> */
  .fleuron {
    block-size: 1.5em;
    border: none;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20'%3E%3Ctext y='16' font-size='16' text-anchor='middle' x='20'%3E❧%3C/text%3E%3C/svg%3E") center no-repeat;
    background-size: contain;
    opacity: 0.5;
  }

  /* Run-in first line (small caps) — draws reader into prose */
  .run-in > p:first-of-type::first-line {
    font-variant-caps: all-small-caps;
  }
}
```

### Where It Lives

`@layer utilities` — opt-in classes for long-form editorial content.

---

## 11. Tracking — Contextual Letter-Spacing Rules

### Principle

Tracking (global letter-spacing) should be applied in specific, intentional contexts only. Rutter is firm: **never letterspace lowercase body text**. It damages legibility and looks affected.

Correct applications:
- **Tighten large/bold/wide display headings** — big fonts have too much apparent space between letters.
- **Loosen strings of ALL CAPS** — spaced capitals are more legible and less aggressive.
- **Long digit strings** (phone numbers, serial numbers) — 5% spacing aids reading.
- **Fix trailing space on centered letterspaced text** — CSS adds letterspace after the last character, throwing off visual centering. Compensate with negative `margin-inline-end`.

**Ligatures must be disabled when letterspacing.** A ligature is a single merged glyph — its internal spacing won't respond to `letter-spacing`, creating uneven gaps. CSS should theoretically disable ligatures under letterspacing but browsers don't always do this correctly.

### Implementation

```css
@layer base {
  /* Tighten display headings — large bold type has too much apparent space */
  h1 {
    letter-spacing: -0.02em;
  }

  h2 {
    letter-spacing: -0.01em;
  }

  /* Loosen all-caps strings */
  .caps,
  [style*="uppercase"],
  h5,
  h6 {
    letter-spacing: 0.05em;
  }
}

@layer utilities {
  /* All-caps utility with compensated trailing space for centered text */
  .all-caps {
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-inline-end: -0.05em;   /* compensate trailing letterspace */
    font-variant-ligatures: no-common-ligatures;
  }

  /* Digit strings — phone numbers, codes, serials */
  .digits {
    letter-spacing: 0.05em;
    font-variant-numeric: lining-nums tabular-nums;
  }

  /* Tighten heavy decorative display fonts */
  .tight {
    letter-spacing: -0.03em;
  }
}
```

### Where It Lives

`@layer base` for heading defaults. `@layer utilities` for explicit opt-in classes.

---

## 12. Vertical Rhythm — Baseline Token System

### Principle

Vertical rhythm means all vertical spacing is a multiple of the body line-height. When spacing is consistent, the eye moves smoothly down the page. When it's inconsistent, the reader feels a subliminal sense of disorder.

The basic unit is: `font-size × line-height`. At `1rem` and `1.5` line-height, the unit is `1.5rem`.

All vertical spacing — paragraph margins, heading margins, list padding, section gaps — should be expressed as multiples of this unit.

### Implementation

```css
@layer tokens {
  :root {
    /* Baseline unit: body font-size × line-height */
    --lh: 1.5rem;

    /* Spacing scale — all multiples of the baseline */
    --space-3xs: calc(var(--lh) * 0.125);   /* 3px  — hair space */
    --space-2xs: calc(var(--lh) * 0.25);    /* 6px  — tight grouping */
    --space-xs:  calc(var(--lh) * 0.5);     /* 12px — list item gap */
    --space-sm:  calc(var(--lh) * 0.75);    /* 18px — paragraph gap */
    --space-md:  var(--lh);                  /* 24px — baseline unit */
    --space-lg:  calc(var(--lh) * 1.5);     /* 36px — section gap */
    --space-xl:  calc(var(--lh) * 2);       /* 48px — major section */
    --space-2xl: calc(var(--lh) * 3);       /* 72px — page-level */
    --space-3xl: calc(var(--lh) * 4);       /* 96px — hero spacing */
  }
}

@layer base {
  /* Paragraphs — separated by half a baseline unit */
  p {
    margin-block: 0 var(--space-sm);
  }

  p:last-child {
    margin-block-end: 0;
  }

  /* Alternative: paragraph indents (no space between, indent instead) */
  .prose-indented p + p {
    text-indent: var(--lh);    /* indent = line-height = a neat square */
    margin-block-start: 0;
  }

  /* Headings — more space above than below (associates heading with content below) */
  h2 { margin-block: var(--space-xl) var(--space-xs); }
  h3 { margin-block: var(--space-lg) var(--space-xs); }
  h4 { margin-block: var(--space-md) var(--space-2xs); }

  /* Lists — internal gap proportional to item complexity */
  li + li {
    margin-block-start: var(--space-2xs);
  }
}
```

> **Note on paragraph style:** Rutter notes that line-break separated paragraphs suit chunked web writing (each paragraph is a complete thought). Indented paragraphs suit immersive long-form reading (essays, articles). Vanilla Breeze should offer both via modifier classes: `.prose` (default, spaced) and `.prose-indented` (no gap, indent).

### Where It Lives

`@layer tokens` for the `--lh` variable and `--space-*` scale. `@layer base` for element margin defaults.

---

## Implementation Priorities

The following table orders recommendations by impact-to-effort ratio. Items marked **Platform** require zero dependencies — pure CSS, native browser features.

| # | Feature | Impact | Effort | Type |
|---|---------|--------|--------|------|
| 1 | `font-variant-numeric` defaults by element | High | Low | Platform |
| 2 | Unitless `line-height` audit and fix | High | Low | Fix |
| 3 | `max-inline-size: 38em` on prose (not `65ch`) | High | Low | Fix |
| 4 | Hyphenation full config in `.prose` | High | Low | Platform |
| 5 | Responsive text sizing (reading distance model) | High | Low | CSS |
| 6 | Proper `sub`/`sup` via `font-variant-position` | High | Low | Platform |
| 7 | Table data-ink defaults | High | Medium | CSS |
| 8 | Heading scale with paired width+height queries | Medium | Medium | CSS |
| 9 | Vertical rhythm `--lh` token + spacing scale | Medium | Medium | Tokens |
| 10 | `vmin` + hybrid `calc()` display text utilities | Medium | Low | Platform |
| 11 | Contextual tracking rules (headings, caps) | Medium | Low | CSS |
| 12 | `initial-letter` drop cap utility | Low | Low | Platform |

---

## Layer Architecture Notes

All additions fit into Vanilla Breeze's existing `@layer` stack. No new layers are required.

```
@layer tokens    ← --lh baseline variable, --space-* scale
@layer base      ← element defaults: p, h1-h6, table, sub, sup, abbr
@layer utilities ← .drop-cap, .all-caps, .digits, .display-heading, .table-responsive
```

### Files to create or modify

- `tokens/typography.css` — add `--lh` and derived `--space-*` tokens
- `base/prose.css` — readability triad, hyphenation, paragraph style
- `base/headings.css` — scale, tracking, responsive width+height queries
- `base/tables.css` — data-ink defaults, responsive linearization
- `base/numerals.css` — `font-variant-numeric` element defaults
- `base/elements.css` — `sub`, `sup` fixes
- `utilities/display.css` — `vmin`/hybrid display text, `.display-heading`
- `utilities/prose.css` — `.drop-cap`, `.run-in`, `.fleuron`, `.prose-indented`
- `utilities/typography.css` — `.all-caps`, `.digits`, `.tight`, `.caps`

### Questions to resolve during planning session

1. Should `--lh` be a computed token derived from `--font-size-base × --line-height-base`, or set explicitly? A computed approach is more fragile if either token changes independently.
2. Should `.prose` enforce `max-inline-size: 38em` or should that be a separate layout concern? There's an argument that prose width is a layout token, not a typography token.
3. What is the Vanilla Breeze position on justified text? Recommend defaulting to left-aligned with `hyphens: auto`, and only enabling justification via an explicit `.prose-justified` modifier that also enforces hyphenation.
4. Is `initial-letter` ready for default use or opt-in only? Browser support is now good but it's a visible feature that authors may want to control. Recommend opt-in class.
5. The responsive table linearization uses `data-title` attributes on `<th>` and `<td>` elements. Does Vanilla Breeze want to document this as a required HTML pattern, or offer a JS enhancement that injects the attributes automatically from the `<thead>`?