# Future Web Components Wishlist

Master list of components we may develop, organized by nav category. Each entry notes whether it's a new component, an upscale of a native attribute, or an expansion of an existing component. Priority is rough — actual scheduling depends on user demand and architectural readiness.

Current surface: **67 web components** across 7 categories.

---

## Interaction

| Component | Type | Notes |
|-----------|------|-------|
| `rich-editor` | New | Rich text editor. ProseMirror AST-based, on hold until VB stabilizes. See `admin/r-n-d/editor-plan.md`. Upscale of `contenteditable`. |
| `stepper-wc` | New | Numeric stepper with +/- buttons. Complements `data-stepper` attribute with richer UI. |
| ~~`notification-center`~~ | **Shipped as `notification-wc`** (banner + panel modes; see `admin/r-n-d/april13-plan/notification-wc.md`) | |
| `pop-over` | New | General-purpose popover content container beyond tooltips. Anchored positioning. |

## Data & Charts

| Component | Type | Notes |
|-----------|------|-------|
| `sparkline-wc` | New | Inline sparkline chart. Bead exists: `vanilla-breeze-i22l`. |
| `data-grid` | New | Virtualized grid for large datasets. Beyond `data-table` — cell editing, virtual scroll. |
| `pivot-table` | New | Cross-tabulation table with drag-to-pivot dimensions. |
| `stat-card` | New | Single metric display with trend indicator. Common dashboard primitive. |
| `progress-tracker` | New | Multi-step progress bar. Complements wizard forms. |

## Media

| Component | Type | Notes |
|-----------|------|-------|
| `pdf-viewer` | New | Embedded PDF viewer with page nav. |
| `model-viewer` | New | 3D model viewer. Wraps `<model-viewer>` or Three.js. |
| `map-viewer` | New | Interactive map beyond static tiles. Zoom, pan, markers. Extends `geo-map`. |

## Content Management

| Component | Type | Notes |
|-----------|------|-------|
| `diff-viewer` | New | Side-by-side or unified diff display. Extends `change-set` concept. |
| `comment-thread` | New | Inline commenting system with replies. |
| `annotation-layer` | New | Overlay annotations on any content block. |
| ~~`reading-progress`~~ | **Shipped** as `reading-progress` (`src/web-components/reading-progress/`). Bead: `vanilla-breeze-13rv`. | |
| `content-feed` | New | Paginated/infinite-scroll content feed. |
| `search-results` | New | Structured search results display with highlighting. Pairs with `site-search`. |
| `bread-crumb` | New | Auto-generated breadcrumb from URL structure. |
| `version-switcher` | New | Documentation version selector. |

## Social

| Component | Type | Notes |
|-----------|------|-------|
| `reaction-bar` | New | Emoji reaction picker (GitHub-style). |
| `comment-box` | New | Standalone comment form with markdown preview. |
| `avatar-group` | New | Overlapping avatar stack for showing participants. Bead: `vanilla-breeze-pahv`. |
| `activity-feed` | New | Timeline of user actions with relative timestamps. |
| `poll-wc` | New | Simple poll/survey with live results. |
| `live-indicator` | New | Pulsing live/online status badge. |

## Design Systems

| Component | Type | Notes |
|-----------|------|-------|
| `layout-specimen` | New | Visual layout pattern specimen. Complements spacing/type/token specimens. |
| `accessibility-specimen` | New | A11y checklist and contrast ratio specimen for design system docs. |
| `animation-specimen` | New | Motion/easing specimen display. |
| `breakpoint-specimen` | New | Responsive breakpoint visualization. Bead: `vanilla-breeze-a7a7`. |


## Planning

| Component | Type | Notes |
|-----------|------|-------|
| ~~`gantt-chart`~~ | **Shipped** as `gantt-chart` (`src/web-components/gantt-chart/`) | |
| `decision-matrix` | New | Weighted scoring matrix. Extends `impact-effort` concept. |
| `swot-analysis` | New | 2x2 SWOT grid with editable quadrants. |
| `stakeholder-map` | New | Power/interest grid for stakeholder analysis. |
| `risk-register` | New | Risk log with likelihood/impact scoring. |
| `retrospective-board` | New | Start/stop/continue retro board. |

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
