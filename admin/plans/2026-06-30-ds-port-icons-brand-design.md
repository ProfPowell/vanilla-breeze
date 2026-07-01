# Finish the Design-System port + untangle icons & brand — Design

**Date:** 2026-06-30
**Status:** Approved design, pending implementation plan
**Branch:** `work/decompose-packs`
**Related:** `~/.claude/plans/so-if-i-were-parallel-clock.md` (original pack decomposition — Workstreams A–E), memory `pack_minisite_doc_chrome`

## Context & motivation

The pack decomposition extracts design-system (DS) and project-planning tooling out of
Vanilla Breeze (VB) core into external packages (`@profpowell/vb-design-system`,
`@profpowell/vb-project-planning`). Workstreams A–C are done; the DS package currently ships
**8** components.

Two problems surfaced while reviewing the live DS mini-site:

1. **The DS port is under-scoped.** The original `src/packs/design-system/design-system.js`
   barrel only ever listed those 8 components, so several genuinely design-system-shaped
   components in VB were never considered for the port and are missing from the package
   (e.g. `accessibility-specimen`, `font-pairer`, `gradient-builder`, `theme-catalog`,
   `theme-import`). The DS mini-site's Theme Composer already *vendors* some of them from
   VB core, but they are not first-class package components with their own doc pages.

2. **Icons and brand are tangled between core and DS.** `icon-wc` and `brand-mark` live in
   VB core (used pervasively in chrome), but there is no DS-side way to *document* an icon set
   or a brand identity, and authoring a single icon via `<icon-wc>` is verbose.

This design finishes the DS port and untangles the icon/brand boundary.

## Audit findings

VB has 135 web-components. Design-system-shaped set:

**Already ported (8):** `color-palette`, `type-specimen`, `spacing-specimen`, `token-specimen`,
`component-sampler`, `semantic-palette`, `motion-specimen`, `theme-export`.

**In VB, DS-shaped, NOT ported:**

| Component | What it is | Disposition |
|---|---|---|
| `accessibility-specimen` | WCAG contrast table + a11y checklist "for design-system docs" | **Port → DS** |
| `breakpoint-specimen` | Responsive breakpoint visualization | **Port → DS** |
| `layout-specimen` | Visual specimen of VB layout primitives "for design-system docs" | **Port → DS** |
| `font-pairer` | Font-pairing tool, Google Fonts + CSS export | **Port → DS** |
| `gradient-builder` | CSS gradient builder + export | **Port → DS** |
| `theme-catalog` | Browse/apply curated token sets (Material, IBM Carbon…) | **Port → DS** |
| `theme-import` | Apply a DTCG `tokens.json` — counterpart to the already-ported `theme-export` | **Port → DS** |
| `palette-generator` | Generate palette from a seed (used by `semantic-palette`, `gradient-builder`) | **Port → DS** |
| `theme-picker` | Live theme-switcher UI, used by `settings-panel` in every site's chrome | **Keep VB core** |
| `color-picker` | Form-associated color input; used by `iron-triangle` (planning) + `semantic-palette` (DS) | **Keep VB core** |
| `brand-mark` | Brand/logo display + dark/light switching; 87 uses, mostly header chrome | **Keep VB core** |
| `icon-wc` | Inline SVG-sprite icon; 1,053 uses | **Keep VB core** |

`command-palette` (⌘K launcher) is a false positive — general UI, not DS.

## Decisions

### Icons (VB core + DS)

**Keep the primitive, add a lighter sibling — both in VB core.**

- **New `[data-icon]` terse form.** Works on any element (`<i>`, `<span>`, `<button>`).
  One static rule ships in VB core CSS:

  ```css
  [data-icon]::before {
    content: "";
    display: inline-block;
    inline-size: 1em;
    block-size: 1em;
    background: currentColor;
    mask: var(--vb-icon) no-repeat center / contain;
    -webkit-mask: var(--vb-icon) no-repeat center / contain;
    vertical-align: -0.125em;
  }
  ```

  Rendered as a **`::before` pseudo-element** so `data-icon` coexists with text
  (`<button data-icon="x">Close</button>`), sized in `em` (scales with font-size), tinted with
  `currentColor`.

  - **Enhancer (tiny):** a global script resolves the set (per-element `data-icon-set`, else the
    global `<html data-icon-set>`, else `lucide` — reusing `icon-wc`'s existing resolution) and
    sets `--vb-icon: url(/cdn/icons/{set}/{name}.svg)` on each `[data-icon]` element. It does
    **not** fetch or inject SVG — the browser loads the SVG as a CSS mask resource. Observes DOM
    additions (MutationObserver) like `icon-wc`.
  - **No-JS path:** a build-generated `icons.core.css` ships `[data-icon="check"]{--vb-icon:url(…)}`
    rules for the ~40 highest-use icons (from usage data: `check`, `x`, `star`, `users`, `home`,
    `search`, `file-text`, `palette`, `settings`, `heart`, …), so the icons that dominate pages
    paint with **zero JS**. The enhancer covers the long tail.
  - **Scope:** monochrome only (mask + currentColor). Multi-color/duotone or runtime name-swaps
    keep using `icon-wc`.
  - **A11y:** decorative by default (CSS `::before` content is not exposed to AT). Functional
    icon-only controls must carry their own accessible name (e.g. `aria-label` on the button),
    exactly as today.

- **`icon-wc` unchanged.** Stays in core for multi-color icons, runtime name changes, and cases
  needing the real SVG in the DOM. Both share `/cdn/icons` assets and the `data-icon-set` global.

- **Icon assets** (`/cdn/icons/*`) stay **VB-core-owned**. DS consumes them via the same
  CDN/token-inheritance model as everything else (no duplication).

**Two new DS components (distinct framings):**

- **`icon-set`** — a **catalog/browser** of an icon set: searchable grid of every icon in a set
  with names + click-to-copy, for discovery ("what's available in lucide?"). Renders each cell
  with `[data-icon]` (or `icon-wc`).
- **`icon-specimen`** — a **design specimen** matching the `*-specimen` family: documents the
  *project's icon language* — recommended set, the sizing scale, weight/color/state examples,
  and do/don't guidance. Documents decisions, not the raw catalog.

### Brand (VB core + DS)

- **`brand-mark` stays in VB core, unchanged.** Usage (87×, mostly bare `<brand-mark>` in
  site/doc headers with dark/light switching) shows it is the chrome/display primitive sites need.
- **New DS component `brand-specimen`** — documents brand identity/guidelines: logo variants,
  clear space, dark/light matrix, brand colors, and do/don't usage. Mirrors the icon split
  (primitive in core, specimen in DS).

### Categorization of the 3 ambiguous components

- **`theme-picker` → VB core.** Live theme switcher; used by `settings-panel` chrome.
- **`color-picker` → VB core.** Form-associated control depended on by both packs
  (`iron-triangle` in planning, `semantic-palette`/`palette-generator` in DS). Both packages
  declare it a **documented runtime peer** (same pattern as `drag-surface`).
- **`palette-generator` → DS.** Not in `core.js`; used only by DS-bound components. Moving it
  makes DS self-contained for palette generation (`semantic-palette` imports it directly instead
  of vendoring `_palette-utils.js`).

## Resulting DS package membership (8 → 19 components)

- **Existing (8):** color-palette, type-specimen, spacing-specimen, token-specimen,
  component-sampler, semantic-palette, motion-specimen, theme-export.
- **Ported (8):** accessibility-specimen, breakpoint-specimen, layout-specimen, font-pairer,
  gradient-builder, theme-catalog, theme-import, palette-generator.
- **New (3):** icon-set, icon-specimen, brand-specimen.
- **Documented runtime peers (VB core):** color-picker, drag-surface, icon-wc, brand-mark,
  theme-picker.

## Port approach (mirrors the existing 8)

For each ported component: move `src/web-components/<comp>/` (logic.js + styles.css + api.json +
static.html) into the DS package `src/web-components/<comp>/`, add it to the barrel (`src/index.js`),
CSS index (`src/index.css` if light-DOM), and `package.json` `exports`; author a doc page in the
mini-site (`site/src/pages/elements/<comp>/`) and a demo where the existing components have one.
Consume VB tokens via CSS custom-property inheritance; hardcode fallbacks. `palette-generator`'s
`_palette-utils.js` moves with it; `semantic-palette` switches from vendored utils to the sibling.

## Relationship to Workstreams D & E

- **Workstream D (destructive, later):** the core-removal set expands to include the 8 newly-ported
  components (plus the original 8). `theme-picker`, `color-picker`, `brand-mark`, `icon-wc`,
  `drag-surface` remain in core. The new `[data-icon]` mechanism is a core *addition*, not a removal.
- **Workstream E:** graph refresh should reflect the new core icon module and the enlarged DS package.

## Sequencing (implementation plans)

Likely two plans, landable independently:

1. **VB-core icon architecture** — `[data-icon]` CSS rule, the enhancer, generated `icons.core.css`,
   docs, and tests. Pure core addition; no dependency on the DS package.
2. **DS package growth** — port the 8, create the 3 new specimens (icon-set, icon-specimen,
   brand-specimen), doc pages, and peer-dependency notes. `icon-set`/`icon-specimen` can use the
   new `[data-icon]` mechanism once (1) lands, but can fall back to `icon-wc` if built first.

## Acceptance criteria

- **Icons (core):** `<i data-icon="star">` renders the icon tinted with `currentColor`, sized in
  `em`, on `<i>`/`<span>`/`<button>` (with text); `data-icon-set` (element + global) switches sets;
  the ~40 core icons render with JS disabled; `icon-wc` still works unchanged; docs page added.
- **DS port:** all 8 ported components register from the package barrel, are exported by subpath,
  have doc pages + demos, and render themed against VB tokens with no VB build coupling;
  `semantic-palette` uses the ported `palette-generator` (no vendored utils); `color-picker` noted
  as a runtime peer. No broken links; `npm run build` green in the DS repo.
- **New DS components:** `icon-set` (searchable catalog + copy), `icon-specimen`, and
  `brand-specimen` each ship logic + styles + api.json + doc page and render correctly on the
  mini-site.

## Non-goals / YAGNI

- No `<use>`-sprite or fully-generated per-icon stylesheet (rejected in favor of the hybrid).
- No `<app-brand>` split (single `brand-mark` primitive is sufficient).
- No multi-color support for `[data-icon]` (use `icon-wc`).
- No `data-icon-after` variant unless a real need appears.

## Open questions

- Final size of the `icons.core.css` no-JS set (start ~40 by usage frequency; tune later).
- Whether `icon-specimen` and `icon-set` share a base module or are independent (decide during
  implementation).
