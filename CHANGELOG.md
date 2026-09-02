# Changelog

All notable changes to Vanilla Breeze will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **api.json manifests for all 14 layout elements**, generated from and
  gated against the CSS (`tests/unit/layout-manifests.test.js`). The
  html-validate registry previously carried layout manifests with attribute
  names the CSS never read (`data-gap` for `data-layout-gap`), so it now
  validates the real layout API — which immediately caught `layout-imposter`
  demos using `data-position` / `data-margin` (the CSS reads
  `data-layout-position` / `data-layout-margin`; 42 sites migrated) and two
  badges using `data-variant` for a color. Every layout element's doc page
  attribute table is regenerated from its manifest.

### Fixed

- 30 media containers in demos and docs used `data-layout-ratio` on
  `[data-media]`, which reads `data-ratio`; the aspect ratio never applied.
  Found by the per-layout conformance check below.

### Changed (breaking)

- **The charts add-on is layered.** `vanilla-breeze-charts.css` now lands in
  `@layer web-components` like any bundled component, below utils, themes
  and your own CSS; it used to be unlayered and outranked everything. The
  file carries the layer-order prefix so it is order-safe in `<head>`.
  chart-wc's hidden-table overrides lock the properties the
  `.visually-hidden` utility sets. Visible effect: an author rule such as
  `.tall-spark { block-size: 120px }` on a sparkline now applies.

### Fixed

- **The tokens layer holds custom properties only** (dtw6). Backdrop's
  application rules (body padding, region elevation, chrome modes, the
  mobile flush breakpoint), the `[data-scrollbar]`, `[data-border-style]`
  and `[data-spotlight]` rules, the OpenType utility classes and the
  external-component token bridge all lived in `@layer tokens` — the lowest
  layer — where any component rule beat them. They now live in
  `src/utils/` in `@layer utils`; their custom properties stay in
  `src/tokens/`. Visible effect: with `data-backdrop`, regions are centered
  to the canvas width and separated by the canvas gap as documented. A gate
  in bundle-parity keeps selector rules out of the tokens graph
  (`color-scheme`, `interpolate-size` and the root token transition are the
  documented exceptions).

- **Theme cursors now apply to every control** (vjpn). The reset wires
  `cursor: var(--cursor-custom-pointer)` so a theme can ship its own
  pointer, but 169 component rules hardcoded `cursor: pointer` in higher
  layers, so the theme cursor only ever reached bare links. Every one now
  reads `var(--cursor-custom-pointer, pointer)`; a gate keeps it that way.
  Also: backdrop's mobile breakpoint moves from 640px to the contract's
  `--bp-sm` (37.5rem / 600px), and heading weights use the
  `--font-weight-*` tokens.

### Removed

- **`data-layout="body-*"` page templates** (tfcw). They were a
  line-for-line legacy copy of `data-page-layout` and used by one demo;
  use `data-page-layout="stack | sidebar-left | sidebar-right | holy-grail |
  app-shell | dashboard | article | landing"`. The page regions keep their
  named containers (`region-main` / `region-nav` / `region-aside`) under
  `data-page-layout`. The dormant `main[data-layout] > *` and
  `article[data-layout] > *` grid-area rules, which fired for every
  layout value and named areas no template defined, are scoped to the
  `main[data-layout="sidebar-*"]` templates that use them.

### Removed

- `layout-cover`'s `data-hero-overlay` and `data-layout-nospace` (zero
  usages; `data-layout-padding="none"` is the latter). `src/charts/index.css`
  and `markdown-viewer/vb-extensions.js`, both imported by nothing (822u).

### Fixed

- **Effects activate on elements added after load on core-only pages**
  (6xxy). `VB.observe()` was only called from the full and autoload entries;
  the production docs load the core entry, so a `data-effect` element
  inserted later never activated. The runtime now boots its own observer
  once the DOM is ready, and is one instance per document, so a page that
  loads both extras and the effects pack (five shared effect modules) no
  longer gets two registries and two observers.

### Internal

- youtube-player and social-embed no longer wrap themselves in
  `@layer web-components` (the entry owns the layer; they nested as
  `web-components.web-components`) (7371).
- Per-component autoload chunks stay self-contained: code splitting was
  measured (1.3 MB → 775 KB raw across all chunks) and rejected because a
  single component file is a documented cherry-pick contract (6xxy).
- **The web-components CSS barrels are pure import manifests** (jhku).
  `index.css` and `core.css` carried 1477 and 650 lines of inline rules,
  hand-copied between them; 96 of core's 103 rules were verbatim copies and
  the rest had drifted (core's `data-copy` selector still named components
  moved to packs in 0.3.0; its gradient-text and shimmer rules predated the
  composable animation slots). The rules live once under
  `src/web-components/_shared/` (data utilities, form enhancements, effects,
  math) and geo-map's no-JS fallback in `geo-map/styles.css`; core imports
  the core subset. Core therefore adopts the slot design for gradient-text
  and shimmer, and both bundles now clear those effects' decoration slot
  under reduced motion (only core did before). A gate rejects inline rules
  in either barrel.
- Stale headers corrected: the core and extras JS barrels state their real
  counts (29 + 27 and 29 + 9 modules); `pointer.css` no longer re-sets
  `--size-touch-min` under `(pointer: coarse)` to the value sizing.css
  already sets; the CDN build comment no longer claims the slim bundle has
  no themes (822u).
- `layout-attributes.css` is layout again (tfcw, 1294 → 760 lines):
  density modes moved to `src/utils/density.css`, the scroll-driven header
  shrink / `data-animate` reveals / `data-parallax` to
  `src/utils/scroll-driven.css`, and the canvas surface into
  `layout-canvas/styles.css`. `<layout-badge>` keeps its tag; it is
  documented as a surface element rather than a layout primitive.
- `vb/layout-attr-value` now validates each `data-layout-*` value against
  the vocabulary of the element's own layout (resolved from `<layout-x>`,
  `data-layout="x"` or `data-page-layout`), instead of the union across all
  layouts — `data-layout-min="auto"` on a grid is now caught. Child
  attributes and elements naming no layout fall back to the merged check.
- Conformance guards that tested a whole line now judge the tag they
  examine: a styled element sharing a line with a `<link>`, a state class
  beside an `<output>`, or a second `<svg>` on a line are no longer exempt.
- `check:api-drift` no longer claims tab-set manages `aria-selected`; it
  manages `aria-expanded` on its summaries by design.
- `context-menu` and `drop-down` reset themed button styling on their items
  through their own stylesheets (`!important` in the component layer) instead
  of inline styles written by JavaScript. The nav active-item `!important`
  rules stay, with their rationale corrected: themes sit above
  `native-elements` by contract and most of them color bare links.
  `_extreme-neumorphism` dropped an unneeded `!important`.

### Changed (breaking)

- **Layout attribute API made consistent** (vqw8):
  - One gap scale everywhere: `none`, `3xs` … `3xl` on every gap-bearing
    layout (cluster, grid, cover, sidebar, switcher, reel, split, media,
    page-layout, body regions). Previously each layout accepted a random
    subset.
  - One sidebar width: `--sidebar-width` defaults to `16rem` and
    `data-layout-sidebar-width` is `12 / 16 / 20rem` in every context
    (layout-sidebar and page-layout `normal` were 15rem, grid identity 280px,
    the page templates 250px).
  - One max-width keyword set: `narrow | normal | wide | prose` on
    layout-center, layout-card and canvas, mapped to `--content-*` tokens.
    `content` is gone (card's read a token that never existed; card `wide`
    was 90rem, now the shared 80rem).
  - Prefix rule: flow primitives use `data-layout-*`; surfaces use bare
    `data-*`. Canvas moves from `data-layout-max` / `data-layout-padding` to
    `data-max` / `data-padding` to match card and badge.
  - `data-layout-min` stays on both grid (column minimum) and cover (block
    minimum), as the vocabulary spec already defines: the minimum on that
    layout's principal axis.
- **Layout element and attribute forms now share one rule set.** Eight
  layouts existed twice, as `layout-x/styles.css` and as a `[data-layout="x"]`
  block in `layout-attributes.css`, and the copies had drifted. Each now lives
  once, selected via `:is(layout-x, [data-layout="x"])`. Where the forks
  disagreed, the better behaviour wins on both sides:
  - `layout-cover` defaults to `100dvh` (was `100vh`) and auto-centers a sole
    child; `layout-center` honours the documented `data-layout-max="prose"`
    (65ch; the element form silently fell back to `normal`) and its
    `[data-layout-gap]` flex-collapse guard now fills the parent exactly
    (the attribute form's `inline-size: 100%` overflowed by the padding);
    `layout-cluster` accepts `data-layout-gap="none"`
    and `"2xl"`; `layout-sidebar` is now semantic-aware like the attribute
    form (`nav`/`aside` are the sidebar, `data-layout-side="end"` keeps DOM
    order via `order`; position-based fallback when no `nav`/`aside` child);
    the attribute forms lose their blanket container-query fallbacks
    (`grid` to one column under 400px, `switcher` stacking under 30rem):
    auto-fit and the threshold formula already do that job, and the
    fallbacks overrode `data-layout-min="xs|s"` and
    `data-layout-threshold="s"` inside any section on a phone.
  - **Typographic containers share one core** (`layout-text/styles.css`):
    `layout-text`, `layout-columns`, `[data-layout="columns"]` and
    `[data-layout="prose"]` all get the same measure variants
    (`data-layout-measure` or `data-layout-max`: narrow/normal/wide, mapped
    to `--measure-*`), vertical rhythm, `data-layout-centered`, the
    `[data-bleed]` breakout and the narrow-container width release. Notable
    shifts: `data-layout="prose"` gains rhythm; `layout-columns` line-height
    moves from `--line-height-relaxed` (1.625) to `--prose-line-height`
    (1.6); `article[data-measure="narrow"]` is `--measure-narrow` (45ch),
    was 55ch.
  - Selector specificity for the element forms rises from (0,0,1) to
    (0,1,0), matching the attribute forms. Author rules that relied on
    out-specifying `layout-x {}` with a bare element selector will need the
    attribute form's specificity; layered author CSS is unaffected.

- **Themes now live in the `bundle-theme` cascade layer.** Every file in
  `src/tokens/themes/` wraps its rules in `@layer bundle-theme { }`, and the
  entries import the bundled themes directly instead of through the tokens
  barrel. Before, the bundled themes sat in the lowest layer (`tokens`) and
  the standalone CDN theme files were unlayered, so a linked theme beat every
  framework layer, packs included, and beat your own unlayered CSS.
  - **What changes for you:** unlayered author CSS now overrides theme rules,
    as it already did for every other part of the framework. Packs
    (`bundle-effects`, `bundle-components`) now sit above themes as
    documented. A theme's element rules now beat `native-elements` without
    `!important`.
  - The CDN build prefixes each standalone theme file with the layer-order
    statement from `main.css`, so a theme `<link>` placed before the bundle
    still slots in correctly.
  - `_access-dyslexia` dropped its three `!important` declarations; the layer
    now does that job.

## [0.3.1] - 2026-07-07

### Removed

- Purged stale build artifacts left over from the 0.3.0 decomposition: the
  `design-system` + `ux-planning` pack bundles (`dist/cdn/packs/*`) and the
  individual component bundles for the 36 removed components
  (`dist/cdn/components/*`). No `package.json` export referenced them — this
  just trims dead weight from the published tarball.

## [0.3.0] - 2026-07-06

### Changed (breaking)

- **Decomposed the design-system and project-planning packs out of core.** These 36 components now ship as standalone, token-driven packages and were removed from `vanilla-breeze`:
  - **Design system → [`@profpowell/vb-design-system`](https://www.npmjs.com/package/@profpowell/vb-design-system):** accessibility-, breakpoint-, layout-, motion-, spacing-, token-, and type-specimen; color-palette, component-sampler, font-pairer, gradient-builder, palette-generator, semantic-palette; theme-catalog, theme-export, theme-import. (The pack also adds new components with no core equivalent: brand-specimen, icon-set, icon-specimen.)
  - **Project planning → [`@profpowell/vb-project-planning`](https://www.npmjs.com/package/@profpowell/vb-project-planning):** adr-wc, burndown-chart, capacity-plan, empathy-map, gantt-chart, impact-effort, iron-triangle, kanban-board, product-roadmap, quadrant-grid, quality-target, requirement-card, review-surface, risk-register, story-map, traceability-matrix, user-journey, user-persona, user-story, work-item.
  - **Migration:** `npm i @profpowell/vb-design-system` and/or `@profpowell/vb-project-planning`. Both read VB design tokens and adopt the active theme automatically — load them on any page that also loads `vanilla-breeze`.
  - Core primitives the packs build on — `icon-wc`, `brand-mark`, `color-picker`, `drag-surface`, `chart-wc` — **remain in core.** The new terse `[data-icon]` primitive (0.2.0) also stays.

### Internal

- Relocated the DTCG serialize/deserialize/parse modules to `src/lib/dtcg/` and the public token-set catalog to `src/data/theme-catalog/` (they back the core theme/CDN build and were previously co-located with the now-removed theme components).

## [0.2.0] - 2026-07-02

### Added

- **`[data-icon]` icon primitive** — a terse, native way to place a single monochrome icon (`<i data-icon="star">`, or on any element) via a CSS `mask` `::before` plus a tiny core-loaded enhancer, alongside `<icon-wc>`. Ships build-generated per-set no-JS stylesheets and name manifests at `/cdn/icons/<set>.css` and `/cdn/icons/<set>.json`.

### Fixed

- **Site header layout shift** — the site header now reserves its height (`header.site`), so it no longer grows and pushes the page down as chrome components upgrade on first (uncached) load.
- **List flow-spacing in flex/grid layouts** — `li` spacing no longer misfires as a cross-axis offset in flex-row or grid lists. The base `li + li` rule is now an overridable `:where()` default, and every `[data-layout]` list (which spaces with `gap`) resets it.

## [0.1.0] - 2025

Initial public release.

### Added

- **Tokens** — design tokens for spacing, typography, colors, sizing, borders, shadows, motion, and fluid scaling
- **Native element styles** — layered CSS for `<nav>`, `<table>`, `<form>`, `<aside>`, `<main>`, `<dialog>`, `<details>`, and more
- **Layout system** — `data-layout` attributes (stack, cluster, sidebar, grid) plus `data-page-layout` presets
- **30+ web components** — accordion, carousel, tabs, toast, tooltip, data-table, command-palette, combo-box, drag-surface, emoji-picker, geo-map, and more
- **Theme engine** — 10 brand themes, 18 extreme themes, 4 accessibility themes, dark/light mode
- **Accessibility** — ARIA mapping, reduced-motion support, high-contrast themes, dyslexia-friendly mode
- **Utilities** — copy-to-clipboard, hotkeys, format-number, format-date, spoiler, typewriter, and more
- **i18n** — CSS layer and JS locale utilities
- **Doc site** — Eleventy-powered documentation with interactive demos and examples
