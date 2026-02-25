# Print Styles Plan

**Purpose**: Add `@media print` support to Vanilla Breeze as an opt-in CSS layer.

**Date**: 2026-02-24

---

## Prior Art: Gutenberg CSS

[Gutenberg](https://github.com/BafS/Gutenberg) is the main print-focused CSS framework (MIT, ~2.8k stars). It provides a solid baseline but is dated — built on normalize.css v8, includes IE/Edge hacks, uses SCSS with `!important` overrides, and has no awareness of modern CSS features.

### What Gutenberg Does Well

| Feature | How |
|---|---|
| Strip backgrounds/shadows | `* { background: transparent !important; box-shadow: none !important; text-shadow: none !important; }` |
| Black-on-white forcing | `body { color: #000 !important; background: #fff !important; }` (black prints faster) |
| Page break control | `page-break-inside: avoid` on tables, blockquotes, pre, code, figures, lists, hrs, links, tr |
| Orphan/widow control | `orphans: 3; widows: 3` on headings, paragraphs, links |
| Heading integrity | `page-break-after: avoid` on all headings; `page-break-before: avoid` on paragraphs following headings |
| URL expansion | `a[href^="http"]::after { content: " (" attr(href) ")" }` — shows link targets in print |
| Abbreviation expansion | `abbr[title]::after { content: " (" attr(title) ")" }` — shows abbreviation meanings |
| Image link suppression | Hides URL expansion for links ending in `.jpg`, `.png`, etc. |
| Pre wrapping | `pre { white-space: pre-wrap !important; word-wrap: break-word }` |
| RTL-aware blockquote | Swaps border-left to border-right in `[dir="rtl"]` context |
| Utility classes | `.no-print`, `.break-before`, `.break-after`, `.avoid-break-inside`, `.no-reformat` |
| Page margins | Body padding in cm units (1.8cm LR, 2.54cm TB) |
| `thead` repeat | `thead { display: table-header-group }` — repeats table headers across pages |

### What Gutenberg Gets Wrong or Misses

| Issue | Notes |
|---|---|
| `!important` everywhere | Brute-force approach. A cascade layer would be cleaner. |
| No `@page` rules | Uses body padding instead of proper `@page { margin }`. No named pages. |
| No margin boxes | No `@top-center`, `@bottom-right`, etc. for page numbers/headers. |
| No `:first`/`:left`/`:right` | No differentiated first-page or recto/verso styling. |
| No `print-color-adjust` | Documented but not in the CSS itself. |
| Legacy break properties | Uses `page-break-*` instead of modern `break-*` (both needed for compat). |
| No dialog/nav/aside hiding | Doesn't address modern interactive elements. |
| No `prefers-contrast` awareness | Print should maximize contrast but doesn't explicitly handle the query. |
| No theme token reset | Doesn't reset CSS custom properties — colored themes would print with odd colors. |
| Hardcoded colors | `#000`/`#fff`/`#bbb` with no token system. |

---

## The VB Approach

### Core Philosophy

Not all pages are print targets. A dashboard, a SPA shell, a settings page — these should never print. VB should:

1. Provide sensible defaults that make *any* page printable without looking broken
2. Offer opt-in enhancements for pages that are *intended* to be printed (articles, invoices, reports)
3. Use data-attributes for page-level print control, not classes
4. Use VB's existing token system — reset tokens for print, don't bypass them
5. Leverage modern `@page` rules and margin boxes (Baseline 2024)
6. Use the modern `break-*` properties alongside legacy `page-break-*` for compatibility

### Architecture

```
src/utils/print.css              ← Core print reset (always loaded via main.css)
src/native-elements/*/styles.css ← Per-element @media print rules (inline with existing)
```

**Layer placement**: `@layer utils` — same as other utilities, loaded after native-elements.

**Not a separate file to link**: VB's print styles live inside the main stylesheet using `@media print`. No `<link media="print">` needed. This matches VB's single-bundle philosophy.

### Opt-in Page Control

```html
<!-- This page is a print target — enable full print treatment -->
<body data-print="article">

<!-- This page should never be printed -->
<body data-print="none">

<!-- Default: basic print cleanup, no enhancements -->
<body>
```

Named print modes map to `@page` named pages:

```css
[data-print="article"] { page: vb-article; }
[data-print="invoice"] { page: vb-invoice; }
[data-print="report"]  { page: vb-report; }
```

---

## Implementation Plan

### Phase 1: Core Print Reset (`src/utils/print.css`)

The baseline that applies to ALL pages when printed.

#### 1.1 Global Reset

```css
@media print {
  /* Strip visual noise */
  *,
  *::before,
  *::after {
    box-shadow: none !important;
    text-shadow: none !important;
  }

  /* Force readable contrast via token override */
  :root {
    --color-text: #000;
    --color-text-muted: #444;
    --color-background: #fff;
    --color-surface: #fff;
    --color-surface-raised: #f5f5f5;
    --color-border: #666;
    --color-interactive: #000;
    color-scheme: light;
    forced-color-adjust: none;
  }

  html {
    font-size: 12pt; /* Print-appropriate base size */
  }

  body {
    background: #fff;
    color: #000;
  }
}
```

Key insight: by resetting VB's design tokens, every element that uses tokens automatically gets print-correct colors. No need to individually override each element.

#### 1.2 Hide Non-Print Elements

```css
@media print {
  /* Interactive elements that make no sense on paper */
  nav,
  dialog,
  [data-print="none"],
  button:not([type="submit"]),
  input[type="range"],
  input[data-switch],
  [role="toolbar"],
  [aria-hidden="true"] {
    display: none !important;
  }

  /* VB web components that are screen-only */
  theme-picker,
  site-search,
  command-palette,
  page-toc,
  tool-tip,
  toast-msg,
  short-cuts,
  settings-panel,
  drop-down,
  context-menu {
    display: none !important;
  }

  /* Search is screen-only */
  search {
    display: none !important;
  }
}
```

Using `!important` is acceptable here — print hiding must override all other display values.

#### 1.3 Page Break Control

```css
@media print {
  /* Prevent breaking inside these */
  table, blockquote, pre, code, figure, li, hr, ul, ol, tr,
  img, picture, video, details, fieldset {
    break-inside: avoid;
    page-break-inside: avoid; /* legacy compat */
  }

  /* Orphan/widow protection */
  h1, h2, h3, h4, h5, h6, p, a, figcaption, caption, dt {
    orphans: 3;
    widows: 3;
  }

  /* Keep headings with their content */
  h1, h2, h3, h4, h5, h6 {
    break-after: avoid;
    page-break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Don't split heading from following paragraph */
  :is(h1, h2, h3, h4, h5, h6) + p {
    break-before: avoid;
    page-break-before: avoid;
  }
}
```

#### 1.4 Typography Adjustments

```css
@media print {
  /* Ensure pre blocks don't overflow the page */
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    border: 1px solid #999;
  }

  /* Repeat table headers on every page */
  thead {
    display: table-header-group;
  }

  /* Repeat table footers on every page */
  tfoot {
    display: table-footer-group;
  }

  /* Images: prevent overflow */
  img, picture, video, canvas, svg, iframe {
    max-width: 100% !important;
  }

  /* Links: show URL for external links */
  a[href^="http"]::after,
  a[href^="ftp"]::after {
    content: " (" attr(href) ")";
    font-size: 80%;
    color: #444;
    word-break: break-all;
  }

  /* Suppress URL display for image links and internal anchors */
  a[href^="#"]::after,
  a[href$=".jpg"]::after,
  a[href$=".jpeg"]::after,
  a[href$=".png"]::after,
  a[href$=".svg"]::after,
  a[href$=".webp"]::after,
  a[href$=".gif"]::after {
    content: none;
  }

  /* Abbreviations: expand title */
  abbr[title]::after {
    content: " (" attr(title) ")";
    font-size: 80%;
  }
}
```

#### 1.5 Layout Linearization

```css
@media print {
  /* Flatten flex/grid layouts to single column */
  main {
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  /* Sidebars collapse into flow */
  aside {
    float: none;
    width: 100%;
    border: none;
    margin: 0;
    padding: 0;
  }

  /* Reset VB layout attributes */
  [data-layout] {
    display: block;
  }

  /* Keep columns for reasonable widths */
  [data-layout="sidebar"] {
    display: block;
  }
}
```

### Phase 2: `@page` Rules

Modern `@page` support (Baseline 2024) enables proper page setup.

#### 2.1 Default Page Setup

```css
@page {
  margin: 2cm;
  size: auto; /* Respect user's printer settings */
}

@page :first {
  margin-top: 3cm; /* Extra top margin on first page */
}
```

#### 2.2 Named Pages for Print Modes

```css
/* Article mode — optimized for long-form reading */
@page vb-article {
  margin: 2.5cm 2cm;

  @top-center {
    content: none; /* Let browser default handle this */
  }

  @bottom-center {
    content: counter(page);
    font-size: 9pt;
    color: #666;
  }
}

@page vb-article:first {
  margin-top: 4cm;

  @bottom-center {
    content: none; /* No page number on first page */
  }
}

/* Invoice mode — tighter margins, company header space */
@page vb-invoice {
  margin: 1.5cm 2cm;
  size: A4 portrait;
}

/* Report mode — left/right page awareness */
@page vb-report {
  margin: 2cm;
}

@page vb-report:left {
  margin-left: 3cm;  /* Binding margin */
  margin-right: 2cm;

  @bottom-left {
    content: counter(page);
    font-size: 9pt;
  }
}

@page vb-report:right {
  margin-left: 2cm;
  margin-right: 3cm; /* Binding margin */

  @bottom-right {
    content: counter(page);
    font-size: 9pt;
  }
}
```

#### 2.3 Data-Attribute Mapping

```css
@media print {
  [data-print="article"] { page: vb-article; }
  [data-print="invoice"] { page: vb-invoice; }
  [data-print="report"]  { page: vb-report; }

  /* Force page break between major sections in article mode */
  [data-print="article"] > section + section {
    break-before: page;
  }

  /* No printing at all */
  [data-print="none"] {
    display: none !important;
  }
}
```

### Phase 3: Per-Element Print Adjustments

These go inside the existing element CSS files as `@media print` blocks.

#### 3.1 `details/styles.css`

```css
@media print {
  /* Force all details open for print */
  details {
    open: ; /* future spec — for now use JS or attribute */
  }

  details:not([open]) {
    /* Expand collapsed details */
    & > *:not(summary) {
      display: block;
    }
  }

  summary::marker,
  summary::after {
    display: none; /* Hide toggle indicators */
  }
}
```

#### 3.2 `dialog/styles.css`

```css
@media print {
  dialog {
    display: none !important;
  }
}
```

#### 3.3 `progress/styles.css` + `meter/styles.css`

```css
@media print {
  progress, meter {
    /* Ensure visible with border when printed without color */
    border: 1px solid #666;
    print-color-adjust: exact;
  }
}
```

#### 3.4 `table/styles.css`

```css
@media print {
  /* Striped tables — force backgrounds in print */
  table.striped {
    print-color-adjust: exact;
  }

  /* Disable sticky positioning */
  table[data-sticky] thead th,
  table[data-sticky] :is(td, th):first-child {
    position: static;
  }

  /* Disable horizontal scroll */
  table[data-responsive="scroll"] {
    display: table;
    overflow: visible;
  }
}
```

#### 3.5 `input/styles.css` + `form/styles.css`

```css
@media print {
  /* Show form values, not interactive elements */
  input, textarea, select {
    border: 1px solid #666;
    background: transparent;
    box-shadow: none;
  }

  /* Hide placeholders */
  ::placeholder {
    color: transparent;
  }
}
```

### Phase 4: Utility Attributes

```css
@media print {
  /* Hide from print */
  [data-no-print],
  [data-screen-only] {
    display: none !important;
  }

  /* Show only in print */
  [data-print-only] {
    display: block !important;
  }

  /* Page break control */
  [data-break-before] {
    break-before: page;
    page-break-before: always;
  }

  [data-break-after] {
    break-after: page;
    page-break-after: always;
  }

  [data-break-avoid] {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Force background printing for specific elements */
  [data-print-background] {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
```

The VB approach: data-attributes, not classes. `data-no-print` instead of `.no-print`. Consistent with VB's attribute-first philosophy.

---

## What Not To Do

| Anti-pattern | Why |
|---|---|
| `!important` on everything | Only use for display:none hiding and max-width enforcement. Token reset handles the rest. |
| Hardcode cm body padding | Use `@page { margin }` instead. Body padding is a Gutenberg-era workaround. |
| Hide ALL images | Images are content. Only hide decorative images (background-image is already stripped). |
| Force serif font for print | Let the site's chosen font family carry through. Serif is a print convention, not a requirement. |
| Strip ALL backgrounds | Token reset handles this. Some elements (mark, code, kbd) legitimately need backgrounds in print — use `print-color-adjust: exact` selectively. |
| Expand ALL link URLs | Only external (`http`/`ftp`) links. Internal anchors, image links, and javascript: links should not expand. |

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| `@media print` | all | all | all | all |
| `@page { margin }` | all | all | all | all |
| `@page :first` | yes | yes | yes | yes |
| `@page :left/:right` | yes | yes | partial | yes |
| `@page { size }` | yes | yes | no | yes |
| Named pages (`page` property) | 85+ | 110+ | no | 85+ |
| Margin boxes (`@top-center` etc.) | 131+ | yes | no | 131+ |
| `break-*` properties | 50+ | 65+ | 10+ | 79+ |
| `print-color-adjust` | 17+ | 97+ | 15.4+ | 79+ |
| `orphans`/`widows` | 25+ | 68+ | 1.3+ | 12+ |

**Strategy**: Core reset (Phase 1) works everywhere. `@page` enhancements (Phase 2) are progressive — if the browser doesn't support named pages or margin boxes, printing still works fine with default page setup.

---

## File Size Impact

Gutenberg compiled is ~6KB unminified. VB's print layer should be smaller since:
- No normalize.css (VB has its own reset)
- Token reset replaces most per-element color overrides
- `@media print` blocks compress well (gzip handles repetition)

Estimated addition: 2-3KB unminified, <1KB gzipped.

---

## Implementation Order

1. `src/utils/print.css` — core reset, hide rules, page breaks, link expansion
2. `@page` rules — default margins, named pages
3. Per-element adjustments — inline in existing native-element files
4. Utility attributes — `data-no-print`, `data-break-before`, etc.
5. Documentation page — demo with print preview button
6. Tests — visual regression test for print output (Playwright `page.pdf()`)

---

## Open Questions

1. **Should `nav` always hide?** Site navigation yes, but in-content navigation (table of contents, breadcrumbs) might be useful in print. Consider `nav[data-site]` or `nav:not([data-print-keep])`.
2. **Should VB provide a print preview button component?** A `<button data-action="print">` that calls `window.print()` and auto-hides itself.  Probably this seems a component that VB could introduce.
3. **`details` expansion**: Should collapsed details force-expand in print? Gutenberg doesn't address this. CSS-only solution is limited — may need JS or recommend `open` attribute.  Probably this is required because FAQ pages and others would often be implemented like this and when printing you'd want to see the full content.
4. **Chart/visualization printing**: VB has chart styles in `src/charts/`. Canvas-based charts won't print. SVG charts will. Document this limitation or provide guidance. As we are likely bringing in the SVC charting system shortly this will be addressed sooner than later.
