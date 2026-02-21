# Current CSS Layout State — Vanilla Breeze Audit

> **Last updated:** 2026-02-21
> **Purpose:** Living reference of what VB has today across layout, fluidity, container queries, modern CSS features, and responsive strategy.

---

## 1. Layout Primitives Inventory

**File:** `src/custom-elements/layout-attributes.css`

### Core Layouts

| Layout | Line | Mechanism | Key Behavior |
|:---|:---|:---|:---|
| `stack` | 18 | Flexbox column | Vertical stack with gap, align (start/center/end/stretch) |
| `cluster` | 43 | Flexbox row wrap | Horizontal wrapping row; supports overlap (negative margins for avatar groups) |
| `grid` | 96 | CSS Grid auto-fit | `repeat(auto-fit, minmax(var(--_min, 15rem), 1fr))`; min from 6rem–25rem via `data-layout-min` |
| `center` | 129 | Block centering | `margin-inline: auto`; max widths: narrow/normal/wide/prose; intrinsic/text centering |
| `page-stack` | 185 | Flexbox column | `min-height: 100dvh` with `flex: 1` on main — sticky footer pattern |
| `split` | 198 | CSS Grid 2-col | Ratios: 2:1, 1:2, 3:1, 1:3, golden; collapses at `48rem` |
| `sidebar` | 245 | Flexbox 2-col | Semantic awareness (nav/aside as sidebar, main/article as content); width: narrow/normal/wide |
| `holy-grail` | 324 | CSS Grid 3-col | `grid-template-areas` for header/nav/main/aside/footer; `:has()` adaptation for missing nav/aside; collapses at `60rem` |
| `dashboard` | 413 | CSS Grid app shell | Sticky header + sidebar; nav transforms to fixed bottom bar on mobile |
| `cover` | 485 | Flexbox full-height | `data-layout-principal` for auto-centering; min from 50vh–100dvh |
| `switcher` | 545 | Flexbox direction switch | `calc((threshold - 100%) * 999)` trick; thresholds 20rem–45rem; limit 2/3/4 items |
| `prose` | 597 | Typography constraint | `max-inline-size: 65ch`; widths: narrow/normal/wide; centered variant |
| `regions` | 900 | CSS Grid 3-part | Header/section/footer targeting by element type |
| `media` | 929 | CSS Grid 2-col | Media object (figure + content); container-query responsive at `<25rem` |

### Grid Identity System

**Named template tokens** (`--tpl-*`) defined at `:root` (lines 621–682):
- `--tpl-stack` — single column, mobile-first
- `--tpl-sidebar-left` / `--tpl-sidebar-right` — 2-column with configurable sidebar width
- `--tpl-holy-grail` — 3-column header/nav/main/aside/footer
- `--tpl-app-shell` — vertical nav bar + main
- `--tpl-dashboard` — admin panel: nav + main
- `--tpl-article` — centered reading column (`minmax(0, var(--content-normal, 65ch))`)
- `--tpl-landing` — named sections: header/hero/feature/cta/footer

**Semantic element auto-registration** — grid areas assigned by element type:
- Body-level: `> header` → `body-header`, `> nav` → `body-nav`, `> main` → `body-main`, `> aside` → `body-aside`, `> footer` → `body-footer`
- Main-level: `> header` → `main-header`, `> nav` → `main-nav`, `> article` → `main-article`, etc.
- Article-level: `> header` → `article-header`, `> section` → `article-content`, etc.
- Explicit override: `data-layout-area="hero|sidebar|content|feature|cta|banner|toc"` maps to matching `grid-area`

### Page Layouts

**Attribute:** `data-page-layout` on `<body>` (lines 742–877)

8 presets: `stack`, `sidebar-left`, `sidebar-right`, `holy-grail`, `app-shell`, `dashboard`, `article`, `landing`

**Responsive behavior:**
- `< 768px`: All sidebar/holy-grail/dashboard variants collapse to `--tpl-stack` (unless `data-layout-nowrap`)
- `app-shell` on mobile: Nav moves to bottom (`grid-template: header/main/nav`)
- `>= 1400px`: Holy-grail/dashboard constrained to `max-width: 1400px` with `margin-inline: auto`

### Nested Layouts

- **Regions** (`data-layout="regions"`): 3-part grid targeting header/section/footer
- **Media** (`data-layout="media"`): Figure + content side-by-side; stacks at `<25rem` container width
- **Main-level sidebar**: `main[data-layout="sidebar-left|sidebar-right"]` with named containers `region-main-nav`, `region-main-content`, `region-main-aside`

### Density Modes

**`data-layout-density`** (lines 1240–1269):
- **`compact`**: Tight spacing (size-m: 12px, line-height: 1.4) — dashboards, data tables
- **`spacious`**: Generous spacing (size-m: 24px, line-height: 1.8) — marketing, landing pages

### Dual Delivery

Every layout is available as both:
- **Attribute**: `<div data-layout="stack">` — semantic HTML flexibility
- **Custom element**: `<layout-stack>` — component encapsulation

Custom elements in `src/custom-elements/`: `layout-stack`, `layout-cluster`, `layout-grid`, `layout-center`, `layout-sidebar`, `layout-cover`, `layout-switcher`, `layout-imposter`, `layout-reel`, `layout-card`, `layout-text`, `layout-badge`

---

## 2. Fluid Typography & Spacing

**File:** `src/tokens/fluid.css`

### Three Presets

All activated by `data-fluid` on `<html>`, scaling continuously between 320px–1440px viewports:

| Preset | Activation | Type Ratio Range | Base Font | `--size-unit` |
|:---|:---|:---|:---|:---|
| Default | `data-fluid` or `data-fluid="default"` | 1.125 → 1.25 (Major Second → Major Third) | 1rem → 1.0625rem | `clamp(0.225rem, 0.0714vi + 0.2107rem, 0.275rem)` |
| Compact | `data-fluid="compact"` | 1.067 → 1.2 (Minor Second → Minor Third) | 1rem → 1rem | `clamp(0.2rem, 0.0714vi + 0.1857rem, 0.25rem)` |
| Spacious | `data-fluid="spacious"` | 1.2 → 1.333 (Minor Third → Perfect Fourth) | 1rem → 1.125rem | `clamp(0.25rem, 0.0893vi + 0.2321rem, 0.3125rem)` |

### Variable-Ratio Type Scales

Nine font-size tokens (`--font-size-xs` through `--font-size-5xl`) use `clamp()` with `vi` (viewport inline) units. The `vi` coefficient increases at larger scales, creating wider ratio divergence as viewport expands:

```css
/* Default preset example (lines 25-33) */
--font-size-xs:  clamp(0.68rem,  -0.1573vi + 0.8216rem, 0.7901rem);
--font-size-md:  clamp(1rem,      0.0893vi + 0.9821rem, 1.0625rem);
--font-size-5xl: clamp(2.0273rem, 2.894vi  + 1.4485rem, 4.0531rem);
```

### Fluid Content Widths

```css
/* Default preset (lines 35-36) */
--content-normal: clamp(40rem, 30rem + 20vi, 65rem);
--measure-normal: clamp(55ch, 45ch + 10vi, 70ch);
```

### Cascading `--size-unit`

The `--size-unit` custom property is set once per preset at the root level and cascades to all child elements. All spacing tokens derive from this value, so switching presets rescales the entire design system proportionally.

Interaction with accessibility: `_access-large-text.css` (lines 137–150) combines `data-fluid` + `data-theme~="a11y-large-text"` for larger base values while maintaining fluid scaling.

---

## 3. Container Queries — Current State

### Global Establishment

**File:** `src/custom-elements/layout-attributes.css:1206`

```css
main, article, section, aside:not(.float):not(.sidenote) {
  container-type: inline-size;
}
```

Floated variants excluded because `container-type: inline-size` breaks float shrink-to-fit (resolves to 0px width).

### Named Containers

| Container Name | Selector | File:Line |
|:---|:---|:---|
| `region-main` | `[data-page-layout] > main`, `[data-layout^="body-"] > main` | layout-attributes.css:779, 708 |
| `region-nav` | `[data-page-layout] > nav`, `[data-layout^="body-"] > nav` | layout-attributes.css:780, 710 |
| `region-aside` | `[data-page-layout] > aside`, `[data-layout^="body-"] > aside` | layout-attributes.css:781, 712 |
| `region-main-nav` | `main[data-layout="sidebar-left"] > nav` | layout-attributes.css:991 |
| `region-main-content` | `main[data-layout="sidebar-*"] > article` | layout-attributes.css:992–993 |
| `region-main-aside` | `main[data-layout="sidebar-right"] > aside` | layout-attributes.css:994 |

### `data-container` Attribute

**File:** `layout-attributes.css:1224–1232`

Explicit opt-in for non-semantic elements:
- `[data-container]` → `container-type: inline-size` (anonymous)
- `data-container="card"` → `container-name: card`
- `data-container="panel"` → `container-name: panel`
- `data-container="media"` → `container-name: media`

### Active `@container` Rules

| Condition | File:Line | Target | Purpose |
|:---|:---|:---|:---|
| `width < 25rem` | layout-attributes.css:956 | `[data-layout="media"]` | Media object stacks to vertical |
| `width < 400px` | layout-attributes.css:1211 | `[data-layout="grid"]` | Grid collapses to single column |
| `width < 30rem` | layout-attributes.css:1218 | `[data-layout="switcher"] > *` | Switcher forces vertical stacking |
| `max-width: 300px` | layout-card/styles.css:123 | `layout-card` | Compact padding on narrow cards |
| `max-width: 500px` | table/styles.css:263 | `table[data-responsive="card"]` | Table card mode (rows as blocks) |
| `max-width: 500px` | nav/styles.css:686 | `.pagination-bar` | Pagination stacks to single column |

### R&D Status

From `r-n-d/container-queries-fluidity/container-queries-expansion.md`:
- **Phase 1** (named containers on page regions): **Done**
- **Phase 2** (`data-container` attribute): **Done**
- **Switcher refactor to CQ**: **Skipped** — flexbox `calc()` trick provides smooth proportional wrapping; CQ would be all-or-nothing regression
- **Fluid gap with `cqw` units**: **Skipped** — VB's discrete token system (3xs–3xl) is intentionally predictable; `cqw` is unpredictable
- **Style queries**: **Skipped** — Chrome-only; data attributes work everywhere
- **Phase 3 component CQ expansion**: **Skipped** — 6 existing queries cover real needs; more would increase CSS size without clear demand

---

## 4. Cascade Architecture

### Layer Order

**File:** `src/main.css:1`

```css
@layer tokens, reset, native-elements, custom-elements, web-components, charts, utils;
```

7 core layers plus 1 experimental:
1. **tokens** — Design tokens, color system, fluid scales
2. **reset** — Browser reset styles
3. **native-elements** — HTML semantic element styling (headings, forms, tables, etc.)
4. **custom-elements** — Layout attributes, form-field, brand-mark, etc.
5. **web-components** — Interactive components (dropdown-wc, command-wc, etc.)
6. **charts** — Chart/visualization styles
7. **utils** — Utility helpers (gradient text, shimmer, etc.)
8. **labs** — Experimental features in isolation (`src/labs/labs.css:14`)

### CSS Nesting

Extensively used throughout — ~1,027 instances of `&` selectors across 65+ files. Heaviest in:
- `theme-wc/styles.css` (38 instances)
- `nav/styles.css` (22 instances)
- `layout-card/styles.css` (16 instances)

### `@scope` for Light DOM Encapsulation

10 web components use `@scope` for scoped styling without Shadow DOM:
- `combobox-wc`, `dropdown-wc`, `theme-wc`, `command-wc`, `context-menu`
- `search-wc`, `page-toc`, `toast-wc`, `shortcuts-wc`, `emoji-picker`

---

## 5. Modern CSS Feature Usage

### `:has()` — ~88 instances across 10+ files

Powers content-aware layouts, CSS-only interactions, and smart component adaptation:
- **Form validation**: `form-field:has(:required) label::after` (form-field/styles.css:18)
- **CSS-only rating**: `[data-rating] > label:has(input:checked)` (rating/styles.css:50)
- **Layout adaptation**: `holy-grail:not(:has(> aside))` drops aside column (layout-attributes.css:324+)
- **Brand-mark linking**: `a:has(> brand-mark)` (brand-mark/styles.css:45)
- **Input type detection**: `label:has(input[type="checkbox"])` (input/styles.css:53)

### `@scope` — 23 rule declarations across 10 web components

Used exclusively for Light DOM web component encapsulation. Example pattern:
```css
@scope (command-wc) {
  :scope { /* host styles */ }
  .trigger { /* scoped child */ }
}
```

### Logical Properties — 814 instances across 105 files

Foundation-level adoption: `inline-size`, `block-size`, `inset-block`, `inset-inline`, `margin-inline`, `margin-block`, `padding-inline`, `padding-block`. RTL-ready throughout.

### `color-mix()` — ~37 instances

Three color spaces:
- `in oklab` (19) — theme-aware tinting (`color-mix.css:11`)
- `in oklch` (10) — dynamic color generation
- `in srgb` (8) — chart area fills and gradients

### `clamp()` / `min()` / `max()` — 45 / 13 / 14 instances

- `clamp()`: Fluid font sizes, spacing scales, content widths
- `min()`: Dialog sizing (`min(90vw, 32rem)`), toast widths, responsive constraints
- `max()`: Grid minimum dimensions, progressive chart sizing

### CSS Anchor Positioning — 16 instances in 2 files

Tooltip placement using `anchor()` function:
- `tooltip/styles.css:70–89` — native tooltip positioning (top/bottom/left/right)
- `tooltip-wc/styles.css:29–51` — web component tooltip positioning

### View Transitions — cross-document only

**File:** `src/utils/view-transitions.css`
- `@view-transition { navigation: auto; }` (line 28) — enables MPA transitions
- 6 named groups: `main-content`, `page-header`, `site-nav`, `page-sidebar`, `page-hero`, `site-footer`
- 5 animation presets: slide-left, slide-right, scale, fade, none
- `data-vt` attribute for named groups, `data-vt-class` for animation presets
- `data-vt-name` for per-element morph transitions (JS init in `view-transition-init.js`)
- No `document.startViewTransition()` usage — CSS-only cross-document approach

### `@supports` — 2 instances

Both in `web-components/index.css` (lines 662, 709) for gradient text feature detection:
```css
@supports (-webkit-background-clip: text) or (background-clip: text)
```

### Accessibility Queries

| Query | Count | Scope |
|:---|:---|:---|
| `prefers-reduced-motion: reduce` | ~46 | 30+ files — dialog, tooltip, carousel, tabs, drag, rating, form wizard, etc. |
| `prefers-color-scheme: dark` | ~14 | Datalist, math, tooltip, labs, surfaces, themes |
| `prefers-contrast: more` | 3 | `_access-system.css:15` |
| `prefers-reduced-transparency` | 2 | `_access-system.css:48` |
| `forced-colors: active` | 4 | `_access-system.css:73` — full Windows High Contrast Mode support |

---

## 6. Already Adopted Modern Features

Features often missed in audits because they're already shipped:

| Feature | Location | Detail |
|:---|:---|:---|
| `text-wrap: balance` | `headings/styles.css:6` | All headings |
| `text-wrap: pretty` | `paragraph/styles.css:4` | All paragraphs |
| Popover API | `tooltip/styles.css`, `tooltip-wc/logic.js` | `popover="hint"` and `popover="auto"` with `:popover-open` styling (5 selectors) |
| `@starting-style` | `tooltip/styles.css:49,215` | Entry animations: fade+slide from `opacity:0; translateY(4px)` |
| `field-sizing: content` | `textarea-grow-init.js:31` | `CSS.supports()` detection + JS `scrollHeight` fallback for `textarea[data-grow]` |
| CSS anchor positioning | `tooltip/styles.css`, `tooltip-wc/styles.css` | 16 `anchor()` calls for tooltip placement |
| `@property` | `tokens/colors.css:10–22`, `labs/labs.css:138` | 4 typed properties: `--hue-primary`, `--hue-secondary`, `--hue-accent` (enable smooth hue transitions), `--gradient-angle` |
| `revert-layer` | `drag-surface/styles.css:9` | `display: revert-layer` to clear layout inheritance |
| View transition presets | `view-transitions.css` | 5 animation presets + 6 named groups for MPA |

---

## 7. Responsive Strategy

### Viewport Breakpoints (`@media`)

| Breakpoint | Usage | Files |
|:---|:---|:---|
| 600px | Mobile search panel | search-wc/styles.css |
| 768px / 48rem | Primary mobile/desktop threshold | layout-attributes.css, main/styles.css, nav/styles.css, docs.css |
| 60rem | Holy-grail collapse | layout-attributes.css:368 |
| 80rem | Sidenote aside width | aside/styles.css:51 |
| 1024px | TOC sticky sidebar | page-toc/styles.css:123 |
| 1400px | Max-width constraint for holy-grail/dashboard | layout-attributes.css:870,1179 |

### Container Breakpoints (`@container`)

| Breakpoint | Usage |
|:---|:---|
| < 25rem | Media object stacking |
| < 300px | Card compact mode |
| < 30rem | Switcher stacking |
| < 400px | Grid single-column collapse |
| < 500px | Table card mode, pagination stacking |

**Pattern:** Viewport `@media` for page-level concerns (layout collapse, nav visibility), `@container` for component-level concerns (card density, media stacking).

---

## 8. What's NOT Used Yet

| Feature | Instances | Notes |
|:---|:---|:---|
| Subgrid | 0 | R&D doc exists (`subgrid-enhancement.md`) but no implementation |
| Scroll-driven animations | 0 | No `animation-timeline`, `scroll()`, or `view()` |
| CSS math functions (`round()`, `mod()`, `abs()`, `sign()`) | 0 | — |
| Style queries (`@container style(...)`) | 0 | Deliberately skipped — Chrome-only at time of decision |
| Same-document View Transitions | 0 | Only cross-document via `@view-transition { navigation: auto }` |
| `interpolate-size: allow-keywords` | 0 | Would enable `height: auto` animation |
| `@starting-style` expansion | Limited | Only tooltips — not yet on dropdown, toast, dialog, combobox, command, context-menu |
| Popover API expansion | Limited | Only tooltips — not yet on dropdown-wc, command-wc, context-menu |
| `@property` expansion | Limited | Only 4 hue/angle properties — not yet for layout tokens like `--sidebar-width` |
