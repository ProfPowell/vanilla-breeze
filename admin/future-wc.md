# Future Web Components Wishlist

Master list of components we may develop, organized by nav category. Each entry notes whether it's a new component, an upscale of a native attribute, or an expansion of an existing component. Priority is rough — actual scheduling depends on user demand and architectural readiness.

Current surface: **119 web components** across 7 categories (as of 2026-05-13).

---

## Interaction

| Component | Type | Notes |
|-----------|------|-------|
| `rich-editor` | New | Rich text editor. ProseMirror AST-based, on hold until VB stabilizes. See `admin/r-n-d/editor-plan.md`. Upscale of `contenteditable`. |
| `stepper-wc` | New | Stepper for values `data-stepper` can't reach: **formatted units** (`$`, `px`, `%`, time), **token-snap scales**, **discrete enums**, optional **long-press acceleration**. NOT a numeric-input replacement — `<input type="number" data-stepper>` covers plain numeric stepping. Plan: `admin/r-n-d/forms-and-interactions/stepper-wc.md`. Bead: `vanilla-breeze-xxew`. |
| ~~`notification-center`~~ | **Shipped as `notification-wc`** (banner + panel modes; see `admin/r-n-d/april13-plan/notification-wc.md`) | |
| ~~`pop-over`~~ | **Shipped** as `pop-over` (`src/web-components/pop-over/`). Consolidation complete: `tool-tip`, `drop-down`, `selection-menu`, `combo-box`, and `context-menu` now compose `pop-over` (commits `def28778`, `fb9d00b4`, `52a792d3`, `dcbbcf39`, `afa41863`). Bead `vanilla-breeze-mz0p` closed. | |

## Data & Charts

| Component | Type | Notes |
|-----------|------|-------|
| ~~`sparkline-wc`~~ | **Shipped** as `<chart-wc data-size="sparkline">` — inline mode strips axes/legend/tooltip. Bead `vanilla-breeze-3qdj` (closed). Original `vanilla-breeze-i22l` closed in favor of extending `chart-wc`. | |
| `data-grid` | **Prefer attributes on `data-table`** | Cell editing / virtual scroll should be added as `data-table` attributes (following the `decision-matrix` precedent — `data-weight`, `data-rollup`, `data-heatmap`). Don't ship a parallel grid component. |
| `pivot-table` | **Prefer attribute extension** | Same: explore as `data-table` pivot attributes before scaffolding a separate component. |
| ~~`stat-card`~~ | **Shipped** as `score-card` (`src/web-components/score-card/`). KPI tile with title/value/change indicator/sparkline (composed with `chart-wc`)/icon. Wrap in `<a href>` for drill-down. | |
| `progress-tracker` | New | Multi-step progress bar. Complements wizard forms. **Overlap check**: `slide-accept` already handles multi-step accept flows; scope this to non-accept progress (forms, onboarding) or fold in. |

## Media

| Component | Type | Notes |
|-----------|------|-------|
| `pdf-viewer` | In progress (external) | Standalone build at https://profpowell.github.io/pdf-viewer/. **Integration task**: ensure VB design-token compatibility (colors, spacing, typography, focus rings) before importing. Theme-pack tokens should drive UI chrome — no hardcoded values. Bead: `vanilla-breeze-3xwu`. |
| `model-viewer` | New | 3D model viewer. Wraps `<model-viewer>` or Three.js. |
| `map-viewer` | New | Interactive map beyond static tiles. Zoom, pan, markers. Extends `geo-map`. |

## Content Management

| Component | Type | Notes |
|-----------|------|-------|
| `diff-viewer` | New | Side-by-side or unified diff display. **Overlap check**: VB already has `change-set`, `compare-surface`, and `review-surface` in this neighborhood. Decide whether `diff-viewer` is a 4th component or a recipe/preset on top of one of those before scaffolding — risk of repeating the pre-May-2026 Planning sprawl. |
| `comment-thread` | Expand existing | Inline commenting system with replies. **Note**: `comment-wc` exists as a stub today (inline action button for `selection-menu`). This entry should be framed as expanding/replacing the stub, not a net-new component. |
| `annotation-layer` | New | Overlay annotations on any content block. |
| ~~`reading-progress`~~ | **Shipped** as `reading-progress` (`src/web-components/reading-progress/`). Bead: `vanilla-breeze-13rv`. | |
| `content-feed` | New | Paginated/infinite-scroll content feed. |
| `search-results` | New | Structured search results display with highlighting. **Overlap check**: `site-search` already does result highlighting per its own api.json. Either fold this into `site-search` slots/recipe, or scope `search-results` narrowly to standalone (non-dialog) result lists. |
| ~~`bread-crumb`~~ | **Shipped** as `bread-crumb` (`src/web-components/bread-crumb/`, registered in `extras.js` per commit `12b475c8`). Auto-generates from `pathname` with structured-data hooks. Bead: `vanilla-breeze-yr9r`. | |
| `version-switcher` | New | Documentation version selector. |

## Social

| Component | Type | Notes |
|-----------|------|-------|
| `reaction-bar` | New | Emoji reaction picker (GitHub-style). |
| `comment-box` | New | Standalone comment form with markdown preview. |
| ~~`avatar-group`~~ | **Superseded** by `<user-avatar>` + `<layout-cluster data-layout-overlap>`. See [user-avatar docs](https://vanilla-breeze.com/docs/elements/custom-elements/user-avatar/#avatar-group). Bead closed: `vanilla-breeze-pahv`. | |
| `activity-feed` | New | Timeline of user actions with relative timestamps. |
| `poll-wc` | New | Simple poll/survey with live results. |
| `live-indicator` | New | Pulsing live/online status badge. |

## Design Systems

| Component | Type | Notes |
|-----------|------|-------|
| `layout-specimen` | New | Visual layout pattern specimen. Complements spacing/type/token specimens. |
| `accessibility-specimen` | New | A11y checklist and contrast ratio specimen for design system docs. |
| ~~`animation-specimen`~~ | **Shipped** as `motion-specimen` (`src/web-components/motion-specimen/`) — easing curves with animated preview dots and durations as bars. Same component, different name. | |
| ~~`breakpoint-specimen`~~ | **Shipped** as `breakpoint-specimen` (`src/web-components/breakpoint-specimen/`). Bead: `vanilla-breeze-a7a7`. | |


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
| `time-axis-utility` | Backlog | Extract shared quarter/month axis math from gantt-chart + roadmap once a 3rd consumer appears. Bead: `vanilla-breeze-l0my`. |

## AI

Page-tools that wrap browser-native AI APIs (Chrome Summarizer, LanguageModel, etc.) with provider-neutral inline-endpoint and external deep-link fallbacks. Conventions: [`admin/specs/ai-page-tools-v1.md`](specs/ai-page-tools-v1.md). Epic: `vanilla-breeze-ddm0`.

| Component | Type | Notes |
|-----------|------|-------|
| ~~`ai-summary`~~ | **Shipped** as `ai-summary` (`src/web-components/ai-summary/`). Bead: `vanilla-breeze-q5cv`. | |
| ~~`ai-chat`~~ | **Shipped** as `ai-chat` (`src/web-components/ai-chat/`). Bead: `vanilla-breeze-vd3s`. | |

---

## Upscale Attributes (not components)

These are tracked as beads and enhance native attributes rather than creating new components:

| Attribute | Upscales | Bead |
|-----------|----------|------|
| `data-spellcheck` | `spellcheck` | `vanilla-breeze-x0f2` |
| `data-responsive` | `srcset/sizes` | `vanilla-breeze-uy6h` |
| `data-hotkey` (extend) | `accesskey` | `vanilla-breeze-p880` |
| `data-accordion` | `open` | `vanilla-breeze-03jb` |
| `data-sandbox-report` | `sandbox` | `vanilla-breeze-rrtx` |

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
