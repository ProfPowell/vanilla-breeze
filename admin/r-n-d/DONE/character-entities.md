# Vanilla Breeze: Character Entities & Unicode — Implementation Specification

> **Status:** Draft for review
> **Scope:** CSS tokens, `@layer` rules, CSS-only component patterns, custom elements, theme contracts, and copy-paste HTML patterns
> **Philosophy:** Every behaviour here is achievable without JavaScript. JS-enhanced custom elements are marked `[JS]`. Everything else is pure HTML + CSS.

---

## Table of Contents

1. [Framing: What Belongs in the Library](#1-framing)
2. [Content Tokens — CSS Custom Properties for Characters](#2-content-tokens)
3. [The Quote System — `<q>`, `:lang()`, and `quotes`](#3-quote-system)
4. [Link Auto-Decoration via Attribute Selectors](#4-link-auto-decoration)
5. [Section & Counter Numbering Patterns](#5-counter-patterns)
6. [Typography Utilities — Whitespace & Punctuation Classes](#6-typography-utilities)
7. [CSS-Only Component Patterns](#7-css-only-components)
8. [Custom Element Proposals](#8-custom-elements)
9. [Soft Hyphen Utilities](#9-soft-hyphen)
10. [Theme Contract — Separator & Marker Tokens](#10-theme-contract)
11. [Copy-Paste HTML Patterns Catalog](#11-patterns-catalog)
12. [Layer Architecture](#12-layer-architecture)
13. [What NOT to Include](#13-exclusions)

---

## 1. Framing

The reference document exposed three problems Vanilla Breeze can fix at the framework level:

**Problem A — Developers reach for ASCII substitutes.**
`--` instead of `—`, `x` instead of `×`, straight quotes instead of curly, comma-grouping instead of thin-space. The library can make the correct choice the easy choice.

**Problem B — There is no CSS vocabulary for content characters.**
Every project reinvents CSS `content` values for separators, bullets, section marks, etc. These should be design tokens.

**Problem C — Accessible patterns for symbol UI don't exist as ready-made components.**
Star ratings, status indicators, keyboard shortcut displays, and progress meters using Unicode are all written from scratch every time.

### Delivery Vehicles

| Vehicle | What it delivers |
|---------|-----------------|
| `@layer tokens` additions | CSS custom properties for character values |
| `@layer typography` | Auto-applied rules (quotes, link prefixes, separators) |
| `@layer components` | CSS-only component classes |
| Custom elements (CSS-only) | `<vb-sep>`, `<vb-rating>`, `<vb-kbd>` |
| Custom elements `[JS]` | `<vb-rating interactive>` |
| HTML patterns catalog | Copy-paste snippets with correct entities |

---

## 2. Content Tokens — CSS Custom Properties for Characters

The core of VB's entity support: a sub-section of design tokens dedicated to character values used in `content` properties and as semantic separators.

### 2.1 Token File

**`src/tokens/_characters.css`**

```css
@layer tokens {
  :root {
    /* ── Separator characters ─────────────────────────────
     *  Used in breadcrumbs, metadata strings, nav items.
     *  Themes override these to change the visual style
     *  of all separators across the site in one place.
     * ──────────────────────────────────────────────────── */

    --sep-breadcrumb:    "\203A";   /* ›  single right angle quote — clean, compact */
    --sep-breadcrumb-bold: "\27A4"; /* ➤  arrowhead — for stepped/wizard flows */
    --sep-list:          "\00B7";   /* ·  middle dot — metadata strings */
    --sep-pipe:          "\007C";   /* |  vertical bar — footer nav */
    --sep-mdash:         "\2014";   /* —  em dash — attribution, parenthetical */
    --sep-ndash:         "\2013";   /* –  en dash — ranges */
    --sep-bullet:        "\2022";   /* •  standard bullet */
    --sep-tri:           "\2023";   /* ‣  triangular bullet — compact lists */
    --sep-hyph:          "\2043";   /* ⁃  hyphen bullet — lightest list style */
    --sep-diamond:       "\25C6";   /* ◆  black diamond — decorative */
    --sep-lozenge:       "\25CA";   /* ◊  lozenge — light decorative */
    --sep-dot:           "\2027";   /* ‧  hyphenation point — minimal separation */
    --sep-section:       "\00A7";   /* §  section sign — legal/doc numbering */
    --sep-para:          "\00B6";   /* ¶  pilcrow — paragraph anchor links */

    /* ── List marker characters ───────────────────────────
     *  Applied via CSS list-style or ::marker pseudo-element
     * ──────────────────────────────────────────────────── */

    --marker-default:    "\2022";   /* •  bullet */
    --marker-check:      "\2714";   /* ✔  heavy check — "done" lists */
    --marker-arrow:      "\27A4";   /* ➤  arrowhead — feature lists */
    --marker-star:       "\2605";   /* ★  star */
    --marker-dash:       "\2043";   /* ⁃  hyphen bullet */

    /* ── Footnote / annotation markers ───────────────────
     *  Used via [data-note] attribute CSS patterns
     * ──────────────────────────────────────────────────── */

    --marker-fn-1:       "\2020";   /* †  dagger */
    --marker-fn-2:       "\2021";   /* ‡  double dagger */
    --marker-fn-3:       "\00A7";   /* §  section — 3rd footnote level */
    --marker-fn-4:       "\00B6";   /* ¶  pilcrow — 4th level */

    /* ── Math & measurement ───────────────────────────────
     *  Prevents ASCII substitutes in scientific content
     * ──────────────────────────────────────────────────── */

    --char-times:        "\00D7";   /* ×  multiplication (not the letter x) */
    --char-minus:        "\2212";   /* −  minus sign (not a hyphen) */
    --char-approx:       "\2248";   /* ≈  approximately equal */
    --char-plusminus:    "\00B1";   /* ±  plus-minus */
    --char-degree:       "\00B0";   /* °  degree */
    --char-per-mille:    "\2030";   /* ‰  per mille */

    /* ── Space widths (as CSS variable strings) ──────────
     *  Used as content values when precise spacing is needed.
     *  Cannot substitute for actual whitespace in text flow —
     *  use the HTML entities directly in markup.
     *  These exist for CSS generated content contexts only.
     * ──────────────────────────────────────────────────── */

    --space-thin:        "\2009";   /* U+2009  thin space (1/5 em) */
    --space-hair:        "\200A";   /* U+200A  hair space (~1/24 em) */
    --space-narrow-nbsp: "\202F";   /* U+202F  narrow no-break space */
    --space-en:          "\2002";   /* U+2002  en space */
    --space-em:          "\2003";   /* U+2003  em space */

    /* ── Quotes (redundant with `quotes` property,
     *  but useful for explicit content: usage) ─────────── */

    --quote-open-double:  "\201C";  /* " */
    --quote-close-double: "\201D";  /* " */
    --quote-open-single:  "\2018";  /* ' */
    --quote-close-single: "\2019";  /* ' */

    /* ── Keyboard symbols ─────────────────────────────────
     *  For <kbd> element decoration
     * ──────────────────────────────────────────────────── */

    --key-cmd:     "\2318";  /* ⌘ */
    --key-option:  "\2325";  /* ⌥ */
    --key-shift:   "\21E7";  /* ⇧ */
    --key-ctrl:    "\2303";  /* ⌃ */
    --key-return:  "\21A9";  /* ↩ */
    --key-delete:  "\232B";  /* ⌫ */
    --key-tab:     "\21E5";  /* ⇥ */
    --key-escape:  "\238B";  /* ⎋ */
    --key-space:   "\2423";  /* ␣ */

    /* ── Status / UI symbols ──────────────────────────────*/

    --icon-check:    "\2714";  /* ✔ */
    --icon-cross:    "\2718";  /* ✘ */
    --icon-refresh:  "\21BB";  /* ↻ */
    --icon-external: "\2197";  /* ↗ (northeast arrow — external link) */
    --icon-download: "\2B07";  /* ⬇ */
    --icon-play:     "\25B6";  /* ▶ */
    --icon-pause:    "\23F8";  /* ⏸ */
    --icon-warning:  "\26A0";  /* ⚠ */
    --icon-info:     "\2139";  /* ℹ */
  }
}
```

### 2.2 Theme Override Pattern

Themes swap separator characters to change the visual vocabulary of the entire site:

```css
/* theme-geometric.css */
@layer tokens {
  :root {
    --sep-breadcrumb: "\25B6";   /* ▶ triangle — matches geometric theme */
    --marker-default: "\25AA";   /* ▪ small square */
    --marker-arrow:   "\25B6";   /* ▶ triangle */
  }
}

/* theme-editorial.css */
@layer tokens {
  :root {
    --sep-breadcrumb: "\2014";   /* — em dash — newspaper style */
    --sep-list:       "\2014";   /* — */
    --marker-default: "\00B7";   /* · interpoint */
  }
}

/* theme-minimal.css */
@layer tokens {
  :root {
    --sep-breadcrumb: "\2F";     /* /  slash */
    --marker-default: "\2013";   /* – en dash */
    --sep-list:       "\2009";   /* thin space — invisible separation */
  }
}
```

---

## 3. The Quote System — `<q>`, `:lang()`, and `quotes`

This is the single highest-leverage thing Vanilla Breeze can do: make correct typographic quotes **automatic** for any language, with zero author effort beyond using `<q>` and setting `lang`.

### 3.1 Core CSS

**`src/typography/_quotes.css`**

```css
@layer typography {

  /* ── Default (English US) ─────────────────────────────── */
  :root,
  :lang(en) {
    quotes:
      "\201C" "\201D"   /* "outer double" */
      "\2018" "\2019";  /* 'inner single' */
  }

  /* ── British English ──────────────────────────────────── */
  :lang(en-GB),
  :lang(en-AU),
  :lang(en-NZ) {
    quotes:
      "\2018" "\2019"   /* 'outer single' */
      "\201C" "\201D";  /* "inner double" */
  }

  /* ── German / Austrian / Swiss German ────────────────── */
  :lang(de) {
    quotes:
      "\201E" "\201C"   /* „lower-99 / upper-66" */
      "\201A" "\2018";
  }

  /* ── French ───────────────────────────────────────────── */
  :lang(fr) {
    /* Guillemets with narrow no-break space inside */
    quotes:
      "\00AB\202F" "\202F\00BB"  /* «  »  */
      "\2039\202F" "\202F\203A"; /* ‹  ›  */
  }

  /* ── Italian, Spanish, Portuguese ─────────────────────── */
  :lang(it),
  :lang(es),
  :lang(pt) {
    quotes:
      "\00AB" "\00BB"   /* «outer» */
      "\201C" "\201D";  /* "inner" */
  }

  /* ── Russian / Polish ─────────────────────────────────── */
  :lang(ru),
  :lang(pl) {
    quotes:
      "\00AB" "\00BB"
      "\201E" "\201C";
  }

  /* ── Japanese ─────────────────────────────────────────── */
  :lang(ja) {
    quotes:
      "\300C" "\300D"   /* 「outer」*/
      "\300E" "\300F";  /* 『inner』*/
  }

  /* ── Chinese ──────────────────────────────────────────── */
  :lang(zh),
  :lang(zh-Hans),
  :lang(zh-Hant) {
    quotes:
      "\201C" "\201D"
      "\2018" "\2019";
  }

  /* ── Korean ───────────────────────────────────────────── */
  :lang(ko) {
    quotes:
      "\201C" "\201D"
      "\2018" "\2019";
  }

  /* ── Arabic ───────────────────────────────────────────── */
  :lang(ar) {
    quotes:
      "\00AB" "\00BB"
      "\2018" "\2019";
  }

  /* ── Apply open/close quotes via content ──────────────── */
  q::before { content: open-quote; }
  q::after  { content: close-quote; }

  /* Nested quotes are automatic — browser tracks nesting depth */

  /* ── Hanging punctuation for blockquotes ──────────────── */
  blockquote {
    hanging-punctuation: first last;  /* Progressive — Safari only, harmless elsewhere */
  }

  /* ── Pull-quote class (decorative large quote marks) ──── */
  .pullquote {
    position: relative;
    padding-inline-start: 1.5em;

    &::before {
      content: var(--quote-open-double, "\201C");
      position: absolute;
      inset-inline-start: 0;
      font-size: 3em;
      line-height: 1;
      color: var(--color-accent, currentColor);
      opacity: 0.25;
      font-style: italic;
    }
  }
}
```

### 3.2 Usage

```html
<!-- Automatic locale-correct quotes — no entities needed in markup -->
<p lang="en">She said <q>Hello, world.</q></p>
<p lang="de">Er sagte <q>Hallo, Welt.</q></p>
<p lang="fr">Il a dit <q>Bonjour le monde.</q></p>
<p lang="ja">彼は<q>こんにちは世界</q>と言った。</p>

<!-- Nested quotes are tracked automatically -->
<p>He said <q>She told me <q>it was fine.</q></q></p>
```

> **Why this matters for VB:** i18n is already a named subsystem. The quote CSS belongs directly in the i18n layer and eliminates the #1 typographic mistake on multilingual sites.

---

## 4. Link Auto-Decoration via Attribute Selectors

Use CSS attribute selectors and `::before` to auto-annotate links by type — no class names, no JavaScript.

### 4.1 Link Prefixes

**`src/typography/_link-types.css`**

```css
@layer typography {

  /* ── External links ───────────────────────────────────── */
  /* North-east arrow after external links (not same-origin) */
  a[href^="http"]::after,
  a[href^="https"]::after {
    content: "\00A0\2197"; /* NBSP + ↗ */
    font-size: 0.75em;
    vertical-align: super;
    opacity: 0.6;
  }

  /* Suppress on nav, cards, and explicit opt-out */
  nav a[href^="http"]::after,
  nav a[href^="https"]::after,
  a[data-no-decoration]::after,
  a.no-decoration::after {
    content: none;
  }

  /* ── Email links ──────────────────────────────────────── */
  a[href^="mailto"]::before {
    content: var(--icon-mailto, "\2709") "\00A0"; /* ✉ NBSP */
    font-style: normal;
  }

  /* ── Phone links ──────────────────────────────────────── */
  a[href^="tel"]::before {
    content: "\260E\00A0"; /* ☎ */
    font-style: normal;
  }

  /* ── PDF / download links ─────────────────────────────── */
  a[href$=".pdf"]::after {
    content: "\00A0\2193"; /* NBSP ↓ */
    font-size: 0.8em;
  }

  a[download]::after {
    content: var(--icon-download, "\2B07") "\00A0";
    font-size: 0.85em;
  }

  /* ── Anchor / section links (permalink pattern) ───────── */
  :is(h2, h3, h4, h5, h6):hover > .anchor-link::before,
  :is(h2, h3, h4, h5, h6):focus-within > .anchor-link::before {
    content: var(--sep-para, "\00B6"); /* ¶ */
  }

  .anchor-link {
    margin-inline-start: 0.4em;
    text-decoration: none;
    opacity: 0;
    transition: opacity 0.15s;
    color: var(--color-muted, currentColor);

    &:focus { opacity: 1; }  /* Always visible when focused */
  }

  :is(h2,h3,h4,h5,h6):hover .anchor-link { opacity: 0.6; }
}
```

### 4.2 Print Media — Expose URLs

```css
@layer typography {
  @media print {
    a[href]::after {
      content: " \2039" attr(href) "\203A";
      font-size: 0.75em;
      color: var(--color-muted);
      word-break: break-all;
    }

    /* Suppress for anchor links and same-page links */
    a[href^="#"]::after,
    a[href^="javascript"]::after {
      content: none;
    }
  }
}
```

---

## 5. Counter & Section Numbering Patterns

CSS counters + content tokens give you automatic section numbering in multiple styles.

### 5.1 Section Sign Numbering

```css
@layer typography {

  /* ── §-style legal/doc numbering ─────────────────────── */
  .numbered-sections {
    counter-reset: section;

    & :is(h2, h3) {
      counter-increment: section;
    }

    & h2::before {
      content: var(--sep-section, "\00A7") "\00A0" counter(section) "\2002";
      color: var(--color-accent);
      font-variant-numeric: tabular-nums;
    }
  }

  /* ── Outline numbering (1.1, 1.2, etc.) ──────────────── */
  .outline-sections {
    counter-reset: outline-h2;

    & h2 {
      counter-increment: outline-h2;
      counter-reset: outline-h3;
    }

    & h3 {
      counter-increment: outline-h3;
      counter-reset: outline-h4;
    }

    & h2::before {
      content: counter(outline-h2) "\2002";
    }

    & h3::before {
      content: counter(outline-h2) "." counter(outline-h3) "\2002";
    }
  }

  /* ── Figure / table auto-numbering ───────────────────── */
  .auto-figures {
    counter-reset: figures tables;

    & figure {
      counter-increment: figures;
    }

    & figure > figcaption::before {
      content: "Fig.\00A0" counter(figures) "\2009\2014\2009";
      font-weight: 600;
    }

    & table {
      counter-increment: tables;
    }

    & caption::before {
      content: "Table\00A0" counter(tables) ".\2002";
      font-weight: 600;
    }
  }
}
```

### 5.2 Footnote Marker Pattern

A CSS-only footnote system using the `--marker-fn-*` tokens and the `data-note` attribute:

```css
@layer typography {

  [data-note]::after {
    content: var(--marker-fn-1, "\2020");
    vertical-align: super;
    font-size: 0.7em;
    color: var(--color-accent);
    text-decoration: none;
  }

  [data-note="2"]::after { content: var(--marker-fn-2, "\2021"); }
  [data-note="3"]::after { content: var(--marker-fn-3, "\00A7"); }
  [data-note="4"]::after { content: var(--marker-fn-4, "\00B6"); }

  /* Footnote list reset */
  .footnotes ol {
    list-style: none;
    padding: 0;
    counter-reset: footnotes;

    & li {
      counter-increment: footnotes;
      display: flex;
      gap: 0.5em;
    }

    & li::before {
      content: var(--marker-fn-1, "\2020");
      font-size: 0.8em;
    }

    & li:nth-child(2)::before { content: var(--marker-fn-2, "\2021"); }
    & li:nth-child(3)::before { content: var(--marker-fn-3, "\00A7"); }
    & li:nth-child(4)::before { content: var(--marker-fn-4, "\00B6"); }
  }
}
```

```html
<!-- Usage -->
<p>
  The speed of light<span data-note="1" aria-describedby="fn1"> c</span>
  is approximately 299,792&thinsp;km/s.
</p>

<footer class="footnotes">
  <ol>
    <li id="fn1">299,792,458 metres per second, exactly, by definition since 1983.</li>
  </ol>
</footer>
```

---

## 6. Typography Utilities — Whitespace & Punctuation Classes

Utility classes for common typographic needs. These are HTML-level helpers — the actual characters go in the markup, but these classes establish correct context.

### 6.1 Measurement & Number Formatting

```css
@layer utilities {

  /* ── Numeric text ─────────────────────────────────────── */
  .num {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
  }

  .num-oldstyle {
    font-variant-numeric: oldstyle-nums proportional-nums;
  }

  .num-fractions {
    font-variant-numeric: diagonal-fractions;
  }

  /* ── Measurement strings ──────────────────────────────── */
  /* Apply to spans wrapping "100 km", "98.6 °F", etc.
   * Prevents the unit from wrapping to a new line */
  .measure {
    white-space: nowrap;
  }

  /* ── Proper name / title protection ──────────────────── */
  /* For "Mr. Smith", "ISO 8601", "RFC 2616" etc. */
  .proper-noun {
    white-space: nowrap;
  }

  /* ── Lining vs. oldstyle figure context ──────────────── */
  .prose {
    font-variant-numeric: oldstyle-nums;  /* If font supports it */
  }

  .data-table {
    font-variant-numeric: tabular-nums lining-nums;
  }
}
```

### 6.2 List Marker Utilities

```css
@layer utilities {

  /* Override list markers using content tokens */

  ul.list-check   { --marker-default: var(--icon-check, "\2714"); }
  ul.list-arrow   { --marker-default: var(--marker-arrow, "\27A4"); }
  ul.list-dash    { --marker-default: var(--marker-dash, "\2013"); }
  ul.list-star    { --marker-default: var(--marker-star, "\2605"); }
  ul.list-diamond { --marker-default: var(--sep-diamond, "\25C6"); }

  ul[class^="list-"] li::marker,
  ul[class*=" list-"] li::marker {
    content: var(--marker-default) "\2009"; /* token + thin space */
    color: var(--color-accent);
  }
}
```

### 6.3 Separator Utilities

```css
@layer utilities {

  /* ── Inline list / metadata separators ───────────────── */
  /* Usage: <ul class="sep-list"><li>Tag A</li><li>Tag B</li></ul> */

  .sep-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    list-style: none;
    padding: 0;

    & li + li::before {
      content: var(--sep-list, "\00B7");
      padding-inline: 0.4em;
      color: var(--color-muted);
      aria-hidden: true;  /* Not yet supported; use aria-hidden in HTML */
    }
  }

  .sep-list--pipe li + li::before   { content: var(--sep-pipe, "\007C"); }
  .sep-list--mdash li + li::before  { content: var(--sep-mdash, "\2014"); }
  .sep-list--bullet li + li::before { content: var(--sep-bullet, "\2022"); }
  .sep-list--slash li + li::before  { content: "\002F"; }
}
```

---

## 7. CSS-Only Component Patterns

### 7.1 Star Rating Component (CSS-Only)

Uses CSS custom properties and the `counter()` function to render stars from a single `data-rating` attribute.

```css
@layer components {

  .star-rating {
    --star-full:  "\2605"; /* ★ */
    --star-empty: "\2606"; /* ☆ */
    --star-color: var(--color-accent, oklch(70% 0.18 80));
    --star-empty-color: var(--color-muted, oklch(80% 0 0));

    display: inline-flex;
    gap: 0.1em;
    font-size: 1.25em;
    line-height: 1;
  }

  /* Each span within the rating is a star */
  .star-rating [aria-hidden] {
    color: var(--star-empty-color);
  }

  .star-rating [aria-hidden].filled {
    color: var(--star-color);
  }

  /* Size variants */
  .star-rating--sm { font-size: 0.9em; }
  .star-rating--lg { font-size: 1.6em; }
}
```

```html
<!-- Accessible pattern: role on container, aria-hidden on glyphs -->
<span class="star-rating" role="img" aria-label="4 out of 5 stars">
  <span aria-hidden="true" class="filled">&#x2605;</span>
  <span aria-hidden="true" class="filled">&#x2605;</span>
  <span aria-hidden="true" class="filled">&#x2605;</span>
  <span aria-hidden="true" class="filled">&#x2605;</span>
  <span aria-hidden="true">&#x2606;</span>
</span>
```

### 7.2 Block Progress Bar

```css
@layer components {

  .block-progress {
    --filled-char:  "\2588";  /* █ full block */
    --empty-char:   "\2591";  /* ░ light shade */
    --filled-color: var(--color-accent);
    --empty-color:  var(--color-muted, oklch(85% 0 0));

    font-family: var(--font-mono);
    font-size: 1rem;
    line-height: 1;
    letter-spacing: -0.05em;  /* Eliminates gaps between block chars */
    display: inline-flex;
    align-items: baseline;
    gap: 0.5em;
  }

  .block-progress__bar { display: inline-flex; }

  .block-progress__filled { color: var(--filled-color); }
  .block-progress__empty  { color: var(--empty-color); }

  .block-progress__label {
    font-size: 0.8em;
    letter-spacing: normal;
    color: var(--color-muted);
  }
}
```

```html
<div class="block-progress" role="meter" aria-valuenow="70" aria-valuemin="0" aria-valuemax="100" aria-label="Build progress">
  <span class="block-progress__bar">
    <span class="block-progress__filled" aria-hidden="true">&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;&#x2588;</span>
    <span class="block-progress__empty"  aria-hidden="true">&#x2591;&#x2591;&#x2591;</span>
  </span>
  <span class="block-progress__label">70%</span>
</div>
```

### 7.3 Breadcrumb Component

```css
@layer components {

  .breadcrumb {
    ol {
      display: flex;
      flex-wrap: wrap;
      list-style: none;
      padding: 0;
      margin: 0;
      gap: 0;
      align-items: center;
      font-size: var(--font-size-sm);
    }

    li + li::before {
      content: var(--sep-breadcrumb, "\203A");
      padding-inline: 0.4em;
      color: var(--color-muted);
      speak: none; /* Legacy SR hint — use aria-hidden in HTML */
    }

    a {
      color: var(--color-link);
      text-decoration: none;

      &:hover { text-decoration: underline; }
    }

    [aria-current="page"] {
      color: var(--color-text);
      font-weight: var(--font-weight-medium);
    }
  }

  /* Theme variants via modifier classes */
  .breadcrumb--arrows { --sep-breadcrumb: "\27A4"; }
  .breadcrumb--slash  { --sep-breadcrumb: "\002F"; }
  .breadcrumb--dash   { --sep-breadcrumb: "\2014"; }
  .breadcrumb--dot    { --sep-breadcrumb: "\00B7"; }
}
```

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs/">Docs</a></li>
    <li><span aria-current="page">Components</span></li>
  </ol>
</nav>
```

> **Note:** The separator `::before` on `li + li` is generated by CSS, so it's already hidden from screen readers in most implementations. The visible text is still correct. Belt-and-suspenders: add `role="presentation"` to separator `<span>` elements if inserting them in HTML.

### 7.4 Status Indicator Component

```css
@layer components {

  .status {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    font-size: var(--font-size-sm);

    &::before {
      content: var(--status-icon, "\25CF"); /* ● */
      font-size: 0.7em;
      color: var(--status-color, currentColor);
    }

    &[data-status="success"] {
      --status-color: var(--color-success, oklch(60% 0.15 145));
      --status-icon: "\25CF";  /* filled circle */
    }

    &[data-status="warning"] {
      --status-color: var(--color-warning, oklch(75% 0.18 80));
      --status-icon: "\25CF";
    }

    &[data-status="error"] {
      --status-color: var(--color-error, oklch(55% 0.2 25));
      --status-icon: "\25CF";
    }

    &[data-status="inactive"] {
      --status-color: var(--color-muted);
      --status-icon: "\25CB";  /* ○ empty circle */
    }

    &[data-status="check"] {
      --status-color: var(--color-success);
      --status-icon: "\2714";  /* ✔ */
    }

    &[data-status="fail"] {
      --status-color: var(--color-error);
      --status-icon: "\2718";  /* ✘ */
    }
  }
}
```

```html
<span class="status" data-status="success">Deployed</span>
<span class="status" data-status="warning">Pending review</span>
<span class="status" data-status="error">Build failed</span>
<span class="status" data-status="check">Tests passed</span>
```

### 7.5 Metadata String Component

```css
@layer components {

  /* A horizontal run of metadata items separated by middle dots */
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    align-items: center;
    color: var(--color-muted);
    font-size: var(--font-size-sm);
    list-style: none;
    padding: 0;

    & li + li::before {
      content: var(--sep-list, "\00B7");
      padding-inline: 0.35em;
    }
  }
}
```

```html
<!-- Article metadata -->
<ul class="meta" aria-label="Article details">
  <li><time datetime="2025-03-07">March 7, 2025</time></li>
  <li>Thomas Powell</li>
  <li>8&thinsp;min read</li>
  <li><a href="/tags/css">CSS</a></li>
</ul>
```

---

## 8. Custom Element Proposals

### 8.1 `<vb-sep>` — Semantic Separator

A purely presentational separator element. CSS-only, zero JS required.

```css
@layer components {

  vb-sep {
    display: inline;
    speak: none;  /* Legacy */
    user-select: none;
    color: var(--color-muted);
    padding-inline: var(--sep-padding, 0.35em);

    &::before {
      content: var(--vb-sep-char, var(--sep-list, "\00B7"));
    }

    /* Named type variants via attribute */
    &[type="mdash"]    { --vb-sep-char: var(--sep-mdash,   "\2014"); }
    &[type="ndash"]    { --vb-sep-char: var(--sep-ndash,   "\2013"); }
    &[type="bullet"]   { --vb-sep-char: var(--sep-bullet,  "\2022"); }
    &[type="pipe"]     { --vb-sep-char: var(--sep-pipe,    "\007C"); }
    &[type="arrow"]    { --vb-sep-char: "\203A"; }
    &[type="dot"]      { --vb-sep-char: var(--sep-dot,     "\2027"); }
    &[type="slash"]    { --vb-sep-char: "\002F"; }
    &[type="section"]  { --vb-sep-char: var(--sep-section, "\00A7"); }
  }
}
```

```html
<!-- Usage -->
<span>Home</span>
<vb-sep type="arrow" aria-hidden="true"></vb-sep>
<span>Docs</span>
<vb-sep type="arrow" aria-hidden="true"></vb-sep>
<span aria-current="page">Components</span>

<!-- In metadata strings -->
<span>March 7, 2025</span>
<vb-sep aria-hidden="true"></vb-sep>
<span>Thomas Powell</span>
```

### 8.2 `<vb-kbd>` — Keyboard Shortcut

Renders keyboard combinations with proper Unicode symbols. CSS-only.

```css
@layer components {

  vb-kbd {
    display: inline-flex;
    align-items: center;
    gap: 0.15em;
    font-family: var(--font-mono);
    font-size: 0.85em;
  }

  /* The inner <kbd> elements get box styling */
  vb-kbd kbd {
    background: var(--surface-elevated, oklch(97% 0 0));
    border: 1px solid var(--color-border);
    border-bottom-width: 2px;
    border-radius: var(--radius-sm, 3px);
    padding: 0.1em 0.4em;
    font-size: inherit;
    box-shadow: 0 1px 2px oklch(0% 0 0 / 0.1);
    white-space: nowrap;
  }

  /* The + between keys */
  vb-kbd span.plus {
    color: var(--color-muted);
    font-size: 0.75em;
  }
}
```

```html
<!-- With explicit platform symbols -->
<vb-kbd aria-label="Command K">
  <kbd>⌘</kbd>
  <span class="plus" aria-hidden="true">+</span>
  <kbd>K</kbd>
</vb-kbd>

<!-- With CSS content vars (author writes abbreviations, CSS supplies symbols) -->
<!-- This requires JS to swap text — see [JS] version below -->
```

**`[JS]` Enhanced version** — author writes semantic key names, JS swaps in platform-correct Unicode:

```js
// vb-kbd.js — lightweight progressive enhancement
class VbKbd extends HTMLElement {
  static #MAC_KEYS = {
    cmd: '\u2318', option: '\u2325', shift: '\u21E7',
    ctrl: '\u2303', return: '\u21A9', delete: '\u232B',
    tab: '\u21E5', escape: '\u238B', space: '\u2423',
  };

  static #WIN_KEYS = {
    cmd: 'Win', option: 'Alt', shift: 'Shift',
    ctrl: 'Ctrl', return: 'Enter', delete: 'Backspace',
    tab: 'Tab', escape: 'Esc', space: 'Space',
  };

  connectedCallback() {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    const map = isMac ? VbKbd.#MAC_KEYS : VbKbd.#WIN_KEYS;

    this.querySelectorAll('kbd[data-key]').forEach(kbd => {
      const symbol = map[kbd.dataset.key.toLowerCase()];
      if (symbol) kbd.textContent = symbol;
    });
  }
}

customElements.define('vb-kbd', VbKbd);
```

```html
<!-- Author writes intent; JS resolves to platform -->
<vb-kbd aria-label="Save">
  <kbd data-key="cmd">cmd</kbd>
  <span class="plus" aria-hidden="true">+</span>
  <kbd>S</kbd>
</vb-kbd>
<!-- On Mac renders: ⌘ + S -->
<!-- On Windows renders: Win + S -->
```

### 8.3 `<vb-rating>` — Star Rating `[JS]`

```js
// vb-rating.js
class VbRating extends HTMLElement {
  static observedAttributes = ['value', 'max', 'symbol-full', 'symbol-empty'];

  connectedCallback() { this.#render(); }
  attributeChangedCallback() { this.#render(); }

  #render() {
    const value = parseFloat(this.getAttribute('value') ?? 0);
    const max   = parseInt(this.getAttribute('max') ?? 5);
    const full  = this.getAttribute('symbol-full')  ?? '★';
    const empty = this.getAttribute('symbol-empty') ?? '☆';
    const label = this.getAttribute('aria-label')
                ?? `${value} out of ${max} stars`;

    this.setAttribute('role', 'img');
    this.setAttribute('aria-label', label);

    const stars = Array.from({ length: max }, (_, i) => {
      const filled = i < Math.floor(value);
      const half   = !filled && (i < value);
      const span   = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      span.className = filled ? 'filled' : half ? 'half' : 'empty';
      span.textContent = filled || half ? full : empty;
      return span;
    });

    this.replaceChildren(...stars);
  }
}

customElements.define('vb-rating', VbRating);
```

```css
@layer components {
  vb-rating {
    display: inline-flex;
    gap: 0.05em;
    font-size: 1.25em;
    line-height: 1;

    .filled { color: var(--color-star, oklch(75% 0.18 80)); }
    .half   { color: var(--color-star); opacity: 0.6; }
    .empty  { color: var(--color-muted); }
  }
}
```

```html
<vb-rating value="4.5" max="5"></vb-rating>

<!-- Custom symbols — dice faces as a rating system -->
<vb-rating value="3" max="6"
  symbol-full="⚂"
  symbol-empty="⚀"
  aria-label="Difficulty: 3 out of 6">
</vb-rating>
```

---

## 9. Soft Hyphen Utilities

`&shy;` is powerful but tedious to apply manually. Two approaches for VB:

### 9.1 CSS `hyphens` First

For most cases, CSS hyphenation is better than manual `&shy;` insertion:

```css
@layer utilities {

  /* Automatic browser hyphenation — requires lang attribute on page */
  .hyphens {
    hyphens: auto;
    hyphenate-limit-chars: 6 3 2;  /* min-word before after */
    hyphenate-limit-lines: 2;
    overflow-wrap: break-word;
  }

  /* For long technical strings (URLs, code, identifiers) */
  .break-anywhere {
    overflow-wrap: anywhere;
    word-break: break-all;
  }

  /* Soft hyphen hint class — for when you want to annotate
   * specific break points in source and have them applied */
  .shy-word {
    /* No CSS magic here — the &shy; entities are in the HTML */
    hyphens: manual;  /* Only break at explicit &shy; points */
  }
}
```

### 9.2 JavaScript Soft-Hyphen Inserter `[JS]`

For long technical identifiers generated at runtime:

```js
// shy.js — utility for adding soft hyphens to long strings
// Handles camelCase, kebab-case, snake_case, and long words

const SHY = '\u00AD'; // Soft hyphen

export function shyWords(text, { minWord = 8, minChunk = 3 } = {}) {
  return text.replace(/\S+/g, word => {
    if (word.length < minWord) return word;

    // Break at natural boundaries first
    return word
      // camelCase: insertBefore uppercase that follows lowercase
      .replace(/([a-z])([A-Z])/g, `$1${SHY}$2`)
      // kebab/snake: after separator
      .replace(/([_-])([a-z])/g, `$1${SHY}$2`)
      // Long runs: every minChunk chars if still long
      .replace(new RegExp(`([a-zA-Z]{${minChunk}})(?=[a-zA-Z])`, 'g'), `$1${SHY}`);
  });
}

// Web component integration
document.querySelectorAll('[data-shy]').forEach(el => {
  el.innerHTML = shyWords(el.innerHTML);
});
```

```html
<!-- Mark elements for automatic shy insertion -->
<code data-shy>antidisestablishmentarianism</code>
<span data-shy>maxLengthConstraintViolationException</span>
```

---

## 10. Theme Contract — Separator & Marker Tokens

This is the key insight: **themes don't just change colors and fonts — they also change the typographic character of the site's separators, bullets, and markers.** VB should formalize this as part of the theme contract.

### 10.1 Theme Token Checklist

Every VB theme MUST declare:

| Token | Default | Description |
|-------|---------|-------------|
| `--sep-breadcrumb` | `"\203A"` | Breadcrumb separator |
| `--sep-list` | `"\00B7"` | Metadata/inline list separator |
| `--marker-default` | `"\2022"` | Default list marker |
| `--marker-arrow` | `"\27A4"` | Feature/CTA list marker |

Every VB theme SHOULD declare:

| Token | Default | Description |
|-------|---------|-------------|
| `--sep-bullet` | `"\2022"` | Heavier bullet separator |
| `--sep-pipe` | `"\007C"` | Footer nav pipe |
| `--marker-check` | `"\2714"` | Done/completed lists |
| `--marker-dash` | `"\2013"` | En-dash list style |

### 10.2 Example Theme Profiles

```
Theme Name        │ breadcrumb  │ list sep  │ marker     │ Character
──────────────────┼────────────┼──────────┼───────────┼─────────────
default           │ ›  \203A   │ ·  \00B7 │ •  \2022  │ Clean, compact
editorial         │ —  \2014   │ —  \2014 │ ·  \00B7  │ Newspaper style
geometric         │ ▶  \25B6   │ ◆  \25C6 │ ▪  \25AA  │ Blocky/angular
minimal           │ /  \002F   │    \2009 │ –  \2013  │ Near-invisible
playful           │ ★  \2605   │ ♦  \2666 │ ★  \2605  │ Bold/fun
technical         │ ›  \203A   │ ·  \00B7 │ ⁃  \2043  │ Neutral/precise
```

---

## 11. Copy-Paste HTML Patterns Catalog

These go into VB's patterns library — correct, accessible, ready to paste.

### 11.1 Number Formatting

```html
<!-- Temperatures -->
<span class="measure">98.6&thinsp;&deg;F</span>
<span class="measure">37&thinsp;&deg;C</span>

<!-- Dimensions -->
<span class="measure">1920&thinsp;&times;&thinsp;1080&thinsp;px</span>

<!-- Large numbers (ISO 80000 grouping with thin space) -->
<span class="num">1&thinsp;234&thinsp;567</span>
<span class="num">1&thinsp;234&thinsp;567.89</span>

<!-- Tolerance / ranges -->
<span class="measure">&plusmn;0.05&thinsp;mm</span>
<span class="measure">100&ndash;200&thinsp;MHz</span>

<!-- Percentages -->
<span class="measure">42.7&thinsp;%</span>
```

### 11.2 Proper Typographic Punctuation

```html
<!-- Em dashes (with optional hair-space refinement) -->
<p>The result&mdash;if you can believe it&mdash;exceeded all expectations.</p>

<!-- En dash for ranges -->
<p>Pages&nbsp;12&ndash;34 cover the fundamentals.</p>
<p>The New&nbsp;York&ndash;London route takes 7&thinsp;hours.</p>

<!-- Ellipsis (single entity, not three periods) -->
<p>She paused&hellip; then continued.</p>

<!-- Protecting proper names and ISO references from line breaks -->
<span class="proper-noun">Mr.&nbsp;Knuth</span>
<span class="proper-noun">ISO&nbsp;8601</span>
<span class="proper-noun">RFC&nbsp;2616</span>
<span class="proper-noun">HTTP/1.1</span>

<!-- Dagger footnote markers -->
<p>Provisional data<span data-note="1" aria-describedby="fn1"> only</span>.</p>
```

### 11.3 Breadcrumbs

```html
<!-- Default (CSS provides separator via ::before) -->
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs/">Docs</a></li>
    <li><span aria-current="page">API Reference</span></li>
  </ol>
</nav>

<!-- Arrow variant -->
<nav class="breadcrumb breadcrumb--arrows" aria-label="Steps">
  <ol>
    <li><a href="/step-1/">Account</a></li>
    <li><a href="/step-2/">Plan</a></li>
    <li><span aria-current="step">Payment</span></li>
  </ol>
</nav>
```

### 11.4 Status Indicators

```html
<!-- Build/deploy status list -->
<ul class="meta" role="list" aria-label="Build status">
  <li><span class="status" data-status="check" aria-label="Tests passed">Tests</span></li>
  <li><span class="status" data-status="check" aria-label="Lint passed">Lint</span></li>
  <li><span class="status" data-status="error" aria-label="Build failed">Build</span></li>
</ul>

<!-- Server status dashboard row -->
<tr>
  <td>api.example.com</td>
  <td><span class="status" data-status="success">Online</span></td>
  <td class="num">99.97&thinsp;%</td>
</tr>
```

### 11.5 Keyboard Shortcuts Reference

```html
<!-- Keyboard shortcut display in help text -->
<p>Press <kbd>&#x2318;</kbd>&thinsp;<kbd>K</kbd> to open the command palette.</p>
<p>Press <kbd>&#x21E7;</kbd>&thinsp;<kbd>&#x2318;</kbd>&thinsp;<kbd>Z</kbd> to redo.</p>

<!-- Shortcut table -->
<table>
  <tbody>
    <tr>
      <td>Save</td>
      <td><vb-kbd aria-label="Command S"><kbd data-key="cmd">&#x2318;</kbd> <kbd>S</kbd></vb-kbd></td>
    </tr>
    <tr>
      <td>Find</td>
      <td><vb-kbd aria-label="Command F"><kbd data-key="cmd">&#x2318;</kbd> <kbd>F</kbd></vb-kbd></td>
    </tr>
  </tbody>
</table>
```

### 11.6 Section Anchors / Permalinks

```html
<!-- Applied per heading — the ¶ symbol appears on hover via CSS -->
<h2 id="installation">
  Installation
  <a class="anchor-link" href="#installation" aria-label="Link to Installation section">&#x00B6;</a>
</h2>

<!-- Or with § for doc-style numbered sections -->
<h2 id="s1">
  <span class="section-num" aria-hidden="true">&sect;&nbsp;1</span>
  Introduction
</h2>
```

### 11.7 Mathematical Inline Content

```html
<!-- Use &thinsp; around operators for readable inline math -->
<p>Area: <i>A</i>&thinsp;=&thinsp;&pi;<i>r</i>&sup2;</p>
<p>Velocity: <i>v</i>&thinsp;=&thinsp;<i>d</i>&thinsp;&frasl;&thinsp;<i>t</i></p>
<p>Given <i>x</i>&thinsp;&isin;&thinsp;&reals;, then <i>x</i>&sup2;&thinsp;&ge;&thinsp;0.</p>

<!-- Proper minus sign (not hyphen) in negative numbers -->
<td class="num">&minus;42.7&thinsp;%</td>
```

---

## 12. Layer Architecture

### 12.1 Where Each Piece Lives

```
@layer reset
@layer tokens
  └── _characters.css          ← NEW: all character/content tokens

@layer base
  ├── _typography.css
  ├── _quotes.css              ← NEW: full <q> locale system
  └── _link-types.css          ← NEW: attribute selector auto-decoration

@layer layout

@layer components
  ├── _breadcrumb.css          ← updated: uses --sep-breadcrumb token
  ├── _meta.css                ← NEW: .meta separator list
  ├── _star-rating.css         ← NEW: .star-rating CSS-only
  ├── _block-progress.css      ← NEW: .block-progress component
  ├── _status.css              ← NEW: .status [data-status] component
  └── _sep-list.css            ← NEW: .sep-list and variants

@layer utilities
  ├── _list-markers.css        ← NEW: .list-check, .list-arrow etc.
  ├── _hyphens.css             ← NEW: .hyphens, .break-anywhere, .shy-word
  └── _numeric.css             ← NEW: .num, .measure, .proper-noun

@layer custom-elements
  ├── vb-sep.css               ← NEW
  ├── vb-kbd.css               ← NEW
  └── vb-rating.css            ← NEW

@layer themes
  ├── theme-default.css        ← + character tokens
  ├── theme-editorial.css      ← + character tokens
  └── theme-geometric.css      ← + character tokens (new)

@layer print
  └── _print.css               ← updated: URL-after-links pattern
```

### 12.2 Import Order

```css
/* main.css additions */
@import "tokens/_characters.css"       layer(tokens);
@import "base/_quotes.css"             layer(base);
@import "base/_link-types.css"         layer(base);
@import "components/_meta.css"         layer(components);
@import "components/_star-rating.css"  layer(components);
@import "components/_block-progress.css" layer(components);
@import "components/_status.css"       layer(components);
@import "components/_sep-list.css"     layer(components);
@import "utilities/_list-markers.css"  layer(utilities);
@import "utilities/_hyphens.css"       layer(utilities);
@import "utilities/_numeric.css"       layer(utilities);
```

---

## 13. What NOT to Include

| Temptation | Reason to Decline |
|------------|------------------|
| Auto-converting straight quotes to curly in JS | Server-side concern, not layout library scope. Use a content processor or CMS plugin. |
| A full emoji picker component | Emoji are a different domain — not typographic punctuation. |
| CSS-encoding every Unicode block | Token bloat. Limit to characters that affect layout, spacing, or UI signals. |
| `content: attr(data-*)` rating stars via counters | Fragile — CSS counter trick for stars requires matching HTML structure. The `<vb-rating>` CE is cleaner. |
| Replacing `&shy;` with a JS hyphenation library (Hyphenopoly) | Hyphenopoly is 150KB+. `hyphens: auto` + `lang` attribute + selective `&shy;` is the platform-first answer. |
| Injecting LRM/RLM via CSS | Directionality control belongs on the element (`dir` attribute), not in a generated content string. |

---

## Implementation Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| **P0** | `_characters.css` tokens file | Low | High — unlocks everything else |
| **P0** | `_quotes.css` locale system | Low | High — fixes #1 typography mistake |
| **P1** | Breadcrumb uses `--sep-breadcrumb` token | Trivial | Completes existing component |
| **P1** | `.status` component | Low | Common UI pattern |
| **P1** | `.meta` separator list | Low | Common UI pattern |
| **P2** | Theme token contract additions | Low | Required for full theme support |
| **P2** | `_link-types.css` | Medium | Useful but needs opt-out design |
| **P2** | `vb-sep` custom element | Low | Clean separator semantics |
| **P3** | `.star-rating` / `<vb-rating>` | Medium | Nice to have |
| **P3** | `.block-progress` | Low | Niche but fun |
| **P3** | `<vb-kbd>` with JS platform detection | Medium | Developer-docs use case |
| **P3** | Counter/numbering utilities | Medium | Doc/legal site use case |
| **P4** | `shy.js` soft hyphen inserter | Medium | Edge case |
| **P4** | Print URL-after-links | Trivial | Print styles already exist |