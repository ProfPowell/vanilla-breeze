# Future Web Components Wishlist

Master list of components we may develop, organized by nav category. Each entry notes whether it's a new component, an upscale of a native attribute, or an expansion of an existing component. Priority is rough — actual scheduling depends on user demand and architectural readiness.

Current surface: **137 web components** across 7 categories (as of 2026-05-15).

---

## Interaction

| Component | Type | Notes |
|-----------|------|-------|
| `rich-editor` | New | Rich text editor. ProseMirror AST-based, on hold until VB stabilizes. See `admin/r-n-d/editor-plan.md`. Upscale of `contenteditable`. |
| ~~`stepper-wc`~~ | **Shipped** as `stepper-wc` (`src/web-components/stepper-wc/`). Modes: formatted units / currency / percent / duration / bytes, token-snap scales, discrete enums, optional long-press acceleration. Plain numeric stepping stays on `data-stepper`. See [decision guide](/docs/concepts/numeric-inputs/) and [component reference](/docs/elements/web-components/stepper-wc/). Plan: `admin/r-n-d/forms-and-interactions/stepper-wc.md`. Bead: `vanilla-breeze-xxew`. | |
| ~~`notification-center`~~ | **Shipped as `notification-wc`** (banner + panel modes; see `admin/r-n-d/april13-plan/notification-wc.md`) | |
| ~~`pop-over`~~ | **Shipped** as `pop-over` (`src/web-components/pop-over/`). Consolidation complete: `tool-tip`, `drop-down`, `selection-menu`, `combo-box`, and `context-menu` now compose `pop-over` (commits `def28778`, `fb9d00b4`, `52a792d3`, `dcbbcf39`, `afa41863`). Bead `vanilla-breeze-mz0p` closed. | |

## Data & Charts

| Component | Type | Notes |
|-----------|------|-------|
| ~~`sparkline-wc`~~ | **Shipped** as `<chart-wc data-size="sparkline">` — inline mode strips axes/legend/tooltip. Bead `vanilla-breeze-3qdj` (closed). Original `vanilla-breeze-i22l` closed in favor of extending `chart-wc`. | |
| `data-grid` | **Prefer attributes on `data-table`** | Cell editing / virtual scroll should be added as `data-table` attributes (following the `decision-matrix` precedent — `data-weight`, `data-rollup`, `data-heatmap`). Don't ship a parallel grid component. |
| `pivot-table` | **Prefer attribute extension** | Same: explore as `data-table` pivot attributes before scaffolding a separate component. |
| ~~`stat-card`~~ | **Shipped** as `score-card` (`src/web-components/score-card/`). KPI tile with title/value/change indicator/sparkline (composed with `chart-wc`)/icon. Wrap in `<a href>` for drill-down. | |
| ~~`progress-tracker`~~ | **Shipped** as `progress-tracker` (`src/web-components/progress-tracker/`). Multi-step progress bar for wizards / checkout / onboarding. Author renders `<li data-step>` children; component decorates each with circle + connector + status (`complete` / `current` / `upcoming` / `error`). `data-current` accepts 1-based index OR step id. Optional `data-clickable` lets users navigate back to completed steps. Distinct from `slide-accept` (slide-to-confirm UX). Docs: [reference](/docs/elements/web-components/progress-tracker/). Bead: `vanilla-breeze-8dqf`. | |

## Media

| Component | Type | Notes |
|-----------|------|-------|
| `pdf-viewer` | External (token-compat done) | Standalone build at https://profpowell.github.io/pdf-viewer/. Token-compatibility pass complete (bead `vanilla-breeze-3xwu` closed). Lives outside VB; import as `@profpowell/pdf-viewer`-style consumer when needed. |
| `model-viewer` | New | 3D model viewer. Wraps `<model-viewer>` or Three.js. |
| `map-viewer` | New | Interactive map beyond static tiles. Zoom, pan, markers. Extends `geo-map`. |

## Content Management

| Component | Type | Notes |
|-----------|------|-------|
| ~~`diff-viewer`~~ | **Recipe, not component** — resolved 2026-05-14. The "diff display" use case fans out into five different shapes, each handled by an existing primitive. Recipe doc page at [/docs/concepts/diff-display/](/docs/concepts/diff-display/) maps use cases to: `<change-set>` (authored inline tracking), `<compare-surface>` (image before/after), `<review-surface>` (editorial review with comments), `<version-switcher data-action="diff">` (page-version diff), or the new `text-diff` utility (`src/utils/text-diff.js`, promoted from `<version-switcher>`'s private helper). Cross-links added on all four component doc pages. Same architectural call as the May 2026 Planning consolidation. Bead: `vanilla-breeze-9ark`. | |
| ~~`comment-thread`~~ | **Shipped** as `comment-thread` (`src/web-components/comment-thread/`). Persistent threaded-discussion container; decorates author-rendered `<article data-comment>` children with author header, relative timestamp, action row (Reply / Edit / Delete) + threaded indentation. Composes `<comment-box>` (reply-form template) and bubbles `<reaction-bar>` events naturally. **`comment-wc` stub kept** as a separate inline action for `selection-menu`. Docs: [reference](/docs/elements/web-components/comment-thread/) + cross-link added on `comment-wc` doc page. Plan: `admin/r-n-d/comment-thread.md`. Bead: `vanilla-breeze-k4m5`. | |
| `annotation-layer` | New | Overlay annotations on any content block. |
| ~~`reading-progress`~~ | **Shipped** as `reading-progress` (`src/web-components/reading-progress/`). Bead: `vanilla-breeze-13rv`. | |
| ~~`content-feed`~~ | **Resolved as recipe + `data-paged`** (2026-05-15). The pattern dissolves into `<site-search>` (filter) + `<card-list>` / `<ul>` / `<layout-grid>` (render) + `data-paged` upscale (paginate). Same architectural call as the `diff-viewer` and Planning consolidations: composition over a wrapper. Recipe doc at `/docs/patterns/content-feed/` once `data-paged` ships. Bead: `vanilla-breeze-07td` (data-paged). | |
| `search-results` | New | Structured search results display with highlighting. **Overlap check**: `site-search` already does result highlighting per its own api.json. Either fold this into `site-search` slots/recipe, or scope `search-results` narrowly to standalone (non-dialog) result lists. |
| ~~`bread-crumb`~~ | **Shipped** as `bread-crumb` (`src/web-components/bread-crumb/`, registered in `extras.js` per commit `12b475c8`). Auto-generates from `pathname` with structured-data hooks. Bead: `vanilla-breeze-yr9r`. | |
| ~~`version-switcher`~~ | **All three phases Shipped** as `version-switcher` (`src/web-components/version-switcher/`). Three actions (`navigate` default, `swap` with View Transitions + `<meta itemprop=version>` update, `diff` via `<change-set>` tracking-view). Three data sources (inline JSON > `data-src` URL > `<meta name=vb:versions-manifest>` fallback). Archived-version banner (`data-banner`, `role=region`+`aria-live=polite`). Mounting inside `<page-info>`'s expandable panel (`data-page-info-target=ID`). Build-pipeline sibling shipped: `versionsManifest` frontmatter → `<meta name=vb:versions-manifest>` via generate-provenance-meta plugin. Cross-links added on `page-info` and `time-index` doc pages. Docs: [reference](/docs/elements/web-components/version-switcher/). Plan: `admin/r-n-d/version-switcher.md`. Beads (all closed): `vanilla-breeze-jusx` (Phase 1), `vanilla-breeze-c42e` (Phase 2), `vanilla-breeze-smb8` (build-pipeline), `vanilla-breeze-j6uo` (Phase 3). | |

## Social

| Component | Type | Notes |
|-----------|------|-------|
| ~~`reaction-bar`~~ | **Shipped** as `reaction-bar` (`src/web-components/reaction-bar/`). Persistent in-flow chip bar + auto-rendered trigger composing `pop-over` for the palette surface. Author-owned data: component is presentational, emits `reaction-bar:toggle` with `{ reaction, action, count, mine }`. `setCount(reaction, count, { mine })` updates a chip after the server confirms (creates from palette template if missing; removes at count=0). Docs: [reference](/docs/elements/web-components/reaction-bar/). Cross-links added from `selection-menu` and `emoji-picker` doc pages. Plan: `admin/r-n-d/reaction-bar.md`. Bead: `vanilla-breeze-h29f`. | |
| ~~`comment-box`~~ | **Shipped** as `comment-box` (`src/web-components/comment-box/`). Form-associated comment-form composing `<markdown-editor>` + Submit/Cancel buttons; used standalone OR as the reply-form template inside `<comment-thread>`. Presentational; submit cancellable (preserves value on `preventDefault()` for failure recovery). Cmd/Ctrl+Enter submits; live counter on `data-max-length`. Docs: [reference](/docs/elements/web-components/comment-box/). Plan: `admin/r-n-d/comment-box.md`. Bead: `vanilla-breeze-tyhk`. | |
| ~~`avatar-group`~~ | **Superseded** by `<user-avatar>` + `<layout-cluster data-layout-overlap>`. See [user-avatar docs](https://vanilla-breeze.com/docs/elements/custom-elements/user-avatar/#avatar-group). Bead closed: `vanilla-breeze-pahv`. | |
| ~~`activity-feed`~~ | **Shipped** as `activity-feed` (`src/web-components/activity-feed/`). WAI-ARIA Feed timeline; decorates author-rendered `<article data-activity data-time=...>` children with relative-time badges, optional date headings (`data-group="day|week"`), optional infinite-scroll sentinel (`data-infinite` → `:load-more`), optional avatar / icon left-rail, MutationObserver for new entries. Imperative API: `addEntry` / `removeEntry` / `clear`. Docs: [reference](/docs/elements/web-components/activity-feed/). Plan: `admin/r-n-d/activity-feed.md`. Bead: `vanilla-breeze-z3yw`. | |
| ~~`poll-wc`~~ | **Shipped** as `poll-wc` (`src/web-components/poll-wc/`). Voting + live results; per-option counts, own-vote flag, single/multi-choice, closed state. Mirrors `reaction-bar` author-owned-state pattern (presentational; emits `poll-wc:vote`; `setCount` after server confirms). Result bars + total-vote count. WAI-ARIA `radiogroup` (single) / `group + checkbox` (multi). Single-choice mode emits `remove` for previous selection BEFORE `add` for new. Docs: [reference](/docs/elements/web-components/poll-wc/). Plan: `admin/r-n-d/poll-wc.md`. Bead: `vanilla-breeze-xjm7`. | |
| ~~`status-wc`~~ (was `live-indicator`) | **Shipped** as `status-wc` (`src/web-components/status-wc/`). 11 built-in variants (live, recording, streaming, error, online, running, away, paused, busy, offline, stopped) with color + animation defaults; custom variants via CSS only. `role="status"` + `aria-live="polite"` by default; `prefers-reduced-motion` collapses pulse to steady. Pairs with `status-message` (textual) and `notification-wc` (action-bearing). Docs: [reference](/docs/elements/web-components/status-wc/). Plan: `admin/r-n-d/status-wc.md`. Bead: `vanilla-breeze-6ckr`. | |

## Design Systems

| Component | Type | Notes |
|-----------|------|-------|
| ~~`layout-specimen`~~ | **Shipped** as `layout-specimen` (`src/web-components/layout-specimen/`). Renders all 14 VB layout primitives (`stack` / `cluster` / `grid` / `center` / `cover` / `imposter` / `columns` / `card` / `canvas` / `badge` / `reel` / `sidebar` / `switcher` / `text`) with name + description + live mini-example + canonical HTML snippet. Optional `data-only="cluster,grid,stack"` subset. Docs: [reference](/docs/elements/web-components/layout-specimen/). Bead: `vanilla-breeze-l6mu`. | |
| ~~`accessibility-specimen`~~ | **Shipped** as `accessibility-specimen` (`src/web-components/accessibility-specimen/`). Two modes: contrast-pair table with WCAG 2.x ratio + AA/AAA badges (default), and slot-driven a11y checklist with `data-status="pass\|fail\|warn\|na"` icons. Docs: [reference](/docs/elements/web-components/accessibility-specimen/). Bead: `vanilla-breeze-o6l9`. | |
| ~~`animation-specimen`~~ | **Shipped** as `motion-specimen` (`src/web-components/motion-specimen/`) — easing curves with animated preview dots and durations as bars. Same component, different name. | |
| ~~`breakpoint-specimen`~~ | **Shipped** as `breakpoint-specimen` (`src/web-components/breakpoint-specimen/`). Bead: `vanilla-breeze-a7a7`. | |
| ~~`theme-import`~~ | **Shipped** as `theme-import` (`src/web-components/theme-import/`). Apply DTCG (Design Tokens Community Group, stable 2025.10) JSON to a preview scope via paste / file / URL. Round-trip lossless via `$extensions["com.vanilla-breeze"]`. Phase 3 of the DTCG pipeline epic. Bead: `vanilla-breeze-uojr`. | |
| ~~`theme-catalog`~~ | **Shipped** as `theme-catalog` (`src/web-components/theme-catalog/`). Tile grid of curated public design systems (Material 3, IBM Carbon, Salesforce Lightning, GOV.UK, Atlassian, Tailwind, Bootstrap, Catppuccin Mocha) with one-click apply via the Phase 3 deserializer. License attribution surfaced per entry. Phase 4 of the DTCG pipeline epic. Bead: `vanilla-breeze-073k`. | |


## Planning

Consolidation outcome (May 2026): five proposed components reduced to **1 primitive + 1 preset + an attribute extension on `<data-table>` + 3 recipe doc pages**. See [`/Users/tpowell/.claude/plans/review-admin-future-wc-md-and-the-sorted-eagle.md`](../).

| Component | Type | Notes |
|-----------|------|-------|
| ~~`gantt-chart`~~ | **Shipped** as `gantt-chart` (`src/web-components/gantt-chart/`) | |
| ~~`quadrant-grid`~~ | **Shipped** as `quadrant-grid` (`src/web-components/quadrant-grid/`). Bead: `vanilla-breeze-5zyk`. Generic 2x2 primitive backing SWOT, stakeholder-map, custom 2x2s. | |
| ~~`risk-register`~~ | **Shipped** as `risk-register` (`src/web-components/risk-register/`). Bead: `vanilla-breeze-vs0y`. Composes `data-table` + `quadrant-grid` from one source. | |
| ~~`decision-matrix`~~ | **Recipe**: use `<data-table>` with `data-weight` + `data-rollup="weighted-sum"` + `data-heatmap="high-good"` (shipped, bead `vanilla-breeze-7ygu`). See data-table doc page. | |
| ~~`swot-analysis`~~ | **Recipe**: use `<quadrant-grid>` with SWOT axis/quadrant labels. See quadrant-grid doc page. | |
| ~~`stakeholder-map`~~ | **Recipe**: use `<quadrant-grid>` with Power/Interest labels and `data-x`/`data-y` for labelled-dot positioning. | |
| ~~`retrospective-board`~~ | **Recipe**: use `<kanban-board>` with three `data-column` children (Start/Stop/Continue). Bead: `vanilla-breeze-68af`. | |
| ~~`burndown-chart`~~ | **Shipped** as `burndown-chart` (`src/web-components/burndown-chart/`). Bead: `vanilla-breeze-ylh2`. Wraps `<chart-wc>` with auto-computed ideal line + scope-change annotations. | |
| ~~`product-roadmap`~~ | **Shipped** as `product-roadmap` (`src/web-components/product-roadmap/`). Bead: `vanilla-breeze-epvt`. Interactive themes × quarters with drag-to-reschedule. | |
| `decision-matrix` (continued ideas) | Backlog | Multi-evaluator scoring + per-cell rationale notes. Defer until requested. |
| `risk-register` (continued ideas) | Backlog | Bidirectional editing (table edit → quadrant move → table refresh). Currently one-way render. |
| `time-axis-utility` | Deferred-until-trigger (bead closed) | Extract shared quarter/month axis math from gantt-chart + roadmap once a 3rd consumer appears (likely `okr-tracker` or `milestone-timeline`). Per the project's "don't extract until 3 use cases" rule. Bead `vanilla-breeze-l0my` closed; re-open when the trigger lands. |

## AI

Page-tools that wrap browser-native AI APIs (Chrome Summarizer, LanguageModel, etc.) with provider-neutral inline-endpoint and external deep-link fallbacks. Conventions: [`admin/specs/ai-page-tools-v1.md`](specs/ai-page-tools-v1.md). Epic: `vanilla-breeze-ddm0`.

| Component | Type | Notes |
|-----------|------|-------|
| ~~`ai-summary`~~ | **Shipped** as `ai-summary` (`src/web-components/ai-summary/`). Bead: `vanilla-breeze-q5cv`. | |
| ~~`ai-chat`~~ | **Shipped** as `ai-chat` (`src/web-components/ai-chat/`). Bead: `vanilla-breeze-vd3s`. | |

---

## Upscale Attributes (not components)

These enhance native attributes rather than creating new components. **All five from the original wishlist have shipped.** New upscale ideas should be added below as they're identified.

| Attribute | Upscales | Bead | Status |
|-----------|----------|------|--------|
| `data-responsive` | `srcset/sizes` | `vanilla-breeze-uy6h` | ✓ Shipped |
| `data-hotkey` (extend) | `accesskey` | `vanilla-breeze-p880` | ✓ Shipped |
| `data-paged` | (no native equivalent) — list-pagination upscale on any list-shaped container | `vanilla-breeze-07td` | ✓ Shipped |
| `data-sortable` | (no native equivalent) — client-side list/table sorting; composes with `data-paged` | `vanilla-breeze-87x2` | ✓ Shipped |
| `data-toggle` | (no native equivalent) — generic click-to-flip-attribute upscale; catch-all for non-popover/commandfor cases | `vanilla-breeze-fyso` | ✓ Shipped |
| ~~`data-spellcheck`~~ | `spellcheck` | `vanilla-breeze-x0f2` | **Deferred** — closed without implementation. Custom dictionary support / domain vocabulary / inline correction UI deferred until a real consumer asks. |
| ~~`data-accordion`~~ | `open` | `vanilla-breeze-03jb` | **Delivered via CSS, not as a `data-*` attribute.** Smooth open/close animation lives in `src/custom-elements/details/styles.css` (`::details-content` + `interpolate-size: allow-keywords` from `motion.css`). The `<accordion-wc>` component adds View Transitions and `name`-attribute exclusivity polyfill. No separate attribute exists. |
| ~~`data-sandbox-report`~~ | `sandbox` | `vanilla-breeze-rrtx` | **Won't do** — closed because browsers don't expose a "blocked by sandbox" signal; any real implementation has to infer from side effects or inject a cooperating agent. Not worth the maintenance cost for a P4 debugging nicety. |

---

## What's still on the table

Live shortlist of wishlist work not yet started, plus new ideas surfaced from recent sessions. Pick from here when scheduling next.

### Unshipped wishlist components

| Component | Where | Notes |
|-----------|-------|-------|
| `rich-editor` | Interaction | ProseMirror AST-based; **on hold** until VB stabilizes. See `admin/r-n-d/editor-plan.md`. Largest single-component effort on the list. |
| `model-viewer` | Media | Wraps `<model-viewer>` or Three.js. New use case; no current demand signal. |
| `map-viewer` | Media | Interactive map (zoom / pan / markers) extending `geo-map`. |
| `annotation-layer` | Content Management | Overlay annotations on any content block. Likely overlaps with `<highlight-wc>` + `<note-wc>` — scope-check before scaffolding. |
| `search-results` | Content Management | Standalone results list w/ highlighting. **Overlap check**: `<site-search>` already does highlighting. Either fold into `site-search` slots/recipe, or scope narrowly to non-dialog standalone. |
| `decision-matrix` (continued) | Planning | Multi-evaluator scoring + per-cell rationale notes. Defer until requested. |
| `risk-register` (continued) | Planning | Bidirectional editing (table edit → quadrant move → table refresh). Currently one-way render. |

### New ideas surfaced from recent sessions

| Idea | Source | Status |
|------|--------|--------|
| URL-inferred theme service | DTCG pipeline plan, Phase 6 | **Future R&D**, not committed. Concept: paste a URL → service scrapes computed styles → proposes a VB theme. Requires server-side (Cloudflare Worker + headless browser), OKLCH clustering heuristics, and trademark/scraping-ethics design. Plan sketch in `admin/dtcg-theme-pipeline-plan.md`. |
| `@profpowell/canvas-text` | render-tag R&D | Stand-alone npm package, not part of VB core. Wraps `render-tag` to paint rich-text HTML onto a `<canvas>`. Foundation for OG cards, screensavers, sticker tools. Plan in `admin/canvas-text-plan.md`. |
| `@profpowell/meme-maker` | render-tag R&D | Stand-alone npm package. Image + caption → PNG export, presets, drafts. Built on `canvas-text` if shipped first, or `render-tag` directly. Plan in `admin/meme-maker-plan.md`. |

### Backlog questions worth answering

These are decisions, not components. Each could redirect future work.

- **annotation-layer vs `<highlight-wc>` + `<note-wc>`** — is annotation-layer a real new shape, or a recipe over the existing primitives?
- **search-results vs `<site-search>` slots** — fold or scope?
- **decoupled pagination controls** — once `data-paged` (bead `vanilla-breeze-07td`) ships, decide whether a thin `<pager-wc target="#x">` wrapper is worth the ~30 lines of glue, or if the in-container pattern is sufficient. Build only if a real consumer needs separated nav.
- **`<theme-picker>` + theme-library page convergence** — both expose theme browsing now; consider whether the picker should embed library-page filters or vice versa.

---

## IA Validation

When adding components, check that each one:

1. **Fits a category** — If it doesn't fit the 7 groups above, that's a signal to either reconsider the component or add a new nav group.
2. **Isn't an attribute** — If the enhancement is just a behavior on an existing element, it should be a `data-*` attribute, not a component.
3. **Has progressive enhancement** — The component must degrade gracefully. If it can't, it may not belong in VB's philosophy.
4. **Ships with docs** — No component merges without a doc page.

## How to Use This List

- Pick candidates based on user requests and project needs
- Create a bead (`bd create`) before starting work
- Write the spec in `admin/r-n-d/` if the component is non-trivial
- Follow the 4-layer progressive enhancement stack
- Add to the appropriate nav group in `navigation.json`, `webComponents.js`, and `elements.js`
