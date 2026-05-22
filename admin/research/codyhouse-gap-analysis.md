# CodyHouse → Vanilla Breeze Gap Analysis

**Date:** 2026-05-22
**Beads:** vanilla-breeze-jljz
**Status:** Inventory + gap list (depth: shallow per-category mapping)

## Scope and methodology

- **CodyHouse source:** live fetch of `https://codyhouse.co/ds/components` and category index pages on 2026-05-22.
- **VB source:** `ls src/web-components/` (133 components, excluding stubs and `_` prefixed scaffolds).
- **Mapping unit:** CodyHouse subcategory (not individual marketing-page variants). CodyHouse inflates its 404-component count with versioned variants like `Feature v1…v20`, `Steps v1…v5`, `Main Header v1/v2/v3`. Treating each as a distinct "component" is misleading; subcategory is the meaningful unit.
- **Pro exclusion:** 301 of CodyHouse's 404 components are paywalled "Pro" entries. Where a subcategory is Pro-heavy, this is noted. Pro variants are generally marketing-page templates, not new primitives.

## Why the two libraries are not equivalent

CodyHouse is a **marketing-page kit** (Sass + plain HTML + light JS). Its center of gravity is hero sections, testimonial layouts, feature blocks, decorative backgrounds — content templates for landing pages.

Vanilla Breeze is an **HTML-first Web Component library for apps and documentation**. Its center of gravity is interactive primitives (`form-field`, `combo-box`, `command-palette`), structured-content components (`page-toc`, `glossary-wc`, `foot-notes`), and domain-specific surfaces (Agile/UX, theming, observability).

A 1:1 component count comparison (133 vs 404) is therefore misleading. Most CodyHouse content has no VB analog because it sits outside VB's scope — and most VB components have no CodyHouse analog for the same reason. The interesting comparison is the **overlap zone**: interactive primitives and structural patterns either library could claim.

## CodyHouse category map (live, 2026-05-22)

Top-level categories with component counts:

| Category | Count | Subcategories |
|---|---:|---|
| App (App-UI) | 17 | Card (13), Navigation (1), Notifications (3) |
| Blog | 31 | (not enumerated; content templates) |
| Content and Layout | 132 | Banner (6), Card (23), Coming Soon (2), Contact (3), FAQ (3), Features (36), Filter (8), Gallery (29), Hero (9), Intro (4), Misc (5), Placeholder (1), Pricing (3), Sidebar (2), Socials (9), Team (4), Testimonials (5) |
| Controls | 27 | (flat) — split buttons, FAB, button effects, color swatches, read more, menu bar, collapse, confetti button, popover |
| Data Display | 49 | Accordion (4), Chart (7), List (10), Misc (5), Progress (2), Table (14), Tabs (6), Timeline (2) |
| Decorative Background | 10 | (flat; marketing decoration) |
| Ecommerce | 32 | (not enumerated; product cards, cart, checkout) |
| Effects | 25 | Controls (5), Page Transition (1), Scroll (13), Text (6) |
| Feedback | 11 | (not enumerated; toasts, loaders, ratings) |
| Forms | 67 | Form Elements (46), Plugins (2), Templates (20) |
| Navigation | 52 | Footer, Header, Intro, Misc, Side Nav, Steps, Sub Nav |
| Overlays | 33 | (flat; modals, drawers, tooltips, popovers) |
| Plugins | 51 | Carousel (6), Misc (34), Slideshow (11) |
| Typography | 24 | (flat) |
| Pro | 301 | (cross-cuts other categories; marketing variants) |

## Gap analysis by category

Convention: **VB equivalent** = component in `src/web-components/` that covers the same need. **Gap** = real capability missing in VB. **Intentional skip** = out of VB scope (marketing kit territory).

### Controls (CodyHouse: 27, flat)

| CodyHouse concept | VB equivalent | Notes |
|---|---|---|
| Split Button / Split Button v2 | — | **Gap (minor):** trigger + dropdown menu combo. Composable today from `drop-down` + `<button>` but no canonical pattern. |
| Floating Action Button | — | **Gap (minor):** could be a CSS recipe, not a component. |
| Button Effects | (data-effect system) | Covered by `data-effect` attribute spec. |
| Collapse | `accordion-wc` (single-section use) | Covered. |
| Confetti Button | — | Intentional skip (decorative). |
| Popover | `pop-over`, `tool-tip` | Covered (and VB ships with native `[popover]` API integration — see memory `popover_display_gotcha`). |
| Color Swatches | `color-palette`, `semantic-palette` | Covered and then some. |
| Read More | `content-lens` (close), HTML `<details>` | Partial; `<details>` is fine. |
| Menu Bar | `nav-bar`, `context-menu`, `selection-menu` | Covered. |
| User Menu | `drop-down` | Covered by composition. |

**Material gaps:** split-button pattern documentation (not a component).

### Forms (CodyHouse: 67 = 46 Form Elements + 20 Templates + 2 Plugins)

| CodyHouse concept | VB equivalent | Notes |
|---|---|---|
| Form Elements (inputs, selects, checkboxes, radios) | `form-field` | VB's `form-field` is the canonical wrapper; native HTML inputs underneath. Memory `feedback_use_vb_primitives` is explicit on this. |
| Form Templates (20) | — | **Intentional skip:** marketing/landing form layouts. Covered by composition in demos. |
| Advanced Search | `site-search`, `combo-box` | Covered. |
| Light/Dark Switch | `theme-picker` | Covered. |
| Working Hours Selector | `time-picker`, `week-view`, `day-view` | Covered by composition. |
| Markdown Editor | `markdown-editor` | Covered. |
| Form Validator (Pro plugin) | native HTML5 + `form-field` | Covered (memory `feedback_html_first_components`). |

**Material gaps:** none in primitives. Form-template gallery is intentionally out of scope.

### Navigation (CodyHouse: 52; subcats Footer, Header, Intro, Misc, Side Nav, Steps, Sub Nav)

| CodyHouse concept | VB equivalent | Notes |
|---|---|---|
| Main Header / Flexi / Mega-Site / Drawer / Dashboard / Floating / Morphing Header | `nav-bar` | VB has one `nav-bar`. CodyHouse ships ~12 header variants. **Potential gap:** documented `nav-bar` recipes for mega-menu, drawer, dashboard sidebar layouts. Likely doc work, not new components. |
| Side Nav | `nav-bar` (vertical), `site-index`, `site-map` | Covered. |
| Steps | `stepper-wc`, `progress-tracker` | Covered. |
| Sub Nav | `bread-crumb`, `page-toc`, `tab-set` | Covered. |
| Footer | — | **Gap (minor):** no canonical footer component. Usually a layout job, not a primitive. |
| Pagination | `pager-wc` | Covered. |

**Material gaps:** mega-menu pattern doc; footer recipe.

### Data Display (CodyHouse: 49; rich subcats)

| CodyHouse concept | VB equivalent | Notes |
|---|---|---|
| Accordion (4) | `accordion-wc` | Covered. |
| Chart (7) | `chart-wc`, `burndown-chart`, `gantt-chart`, `quadrant-grid` | VB has more chart breadth. Covered. |
| List (10) | `card-list`, `activity-feed`, `comment-thread` | Covered. |
| Misc (5) | various | Covered by composition. |
| Progress (2) | `progress-tracker`, `reading-progress` | Covered. |
| Table (14) | `data-table` | Covered (single canonical primitive). CodyHouse's 14 are mostly visual variants. |
| Tabs (6) | `tab-set` | Covered. |
| Timeline (2) | `activity-feed`, `change-set`, `time-index` | Covered. |

**Material gaps:** none.

### Overlays (CodyHouse: 33, flat)

CodyHouse subcategory list was not exposed by the index, but the genre is modals, drawers, tooltips, popovers, lightboxes.

| CodyHouse concept | VB equivalent | Notes |
|---|---|---|
| Modal / Dialog | native `<dialog>` + VB demos | Covered by platform; no wrapper component. |
| Drawer | — | **Gap (minor):** no canonical drawer component. Often built from `<dialog>` + CSS. Could be a recipe. |
| Tooltip | `tool-tip` | Covered. |
| Popover | `pop-over` | Covered (native popover API). |
| Lightbox | `image-gallery` | Covered. |
| Toast | `toast-msg`, `notification-wc` | Covered. |

**Material gaps:** drawer pattern doc.

### Feedback (CodyHouse: 11)

| CodyHouse concept | VB equivalent | Notes |
|---|---|---|
| Toast | `toast-msg` | Covered. |
| Notification | `notification-wc` | Covered. |
| Loader / Spinner | `<loading-spinner>` + `[data-loading]` + `button[data-loading]` + `icon-wc[data-animate="spin"]` | Covered with depth. (Originally listed as a gap; corrected 2026-05-22 via vb-9uay — see follow-up note.) |
| Rating | `star-rating`, `score-card`, `reaction-bar` | Covered. |
| Emoji Feedback | `reaction-bar`, `emoji-picker`, `poll-wc` | Covered. |
| Content Rating | `star-rating`, `review-surface` | Covered. |
| Empty State / Placeholder | Unified `data-state="empty"` + `output[data-empty]` + `data-feedback="message"` pattern | Covered with pattern doc + 3 demos. (Originally listed as a gap; corrected 2026-05-22 via vb-9uay.) |

**Material gaps:** none. Both loader/spinner and empty-state claims were research misses — corrected 2026-05-22.

**Follow-up audit (vb-9uay):**

*Loading*: `<loading-spinner>` CSS-only custom element with 5 sizes + 4 variants + overlay mode + reduced-motion handling (`src/custom-elements/loading-spinner/styles.css`); `[data-loading]` shimmer overlay with `skeleton`/`minimal`/`hide` variants (`src/utils/loading.css`); `button[data-loading]` with form integration, aria-busy, auto-revert, programmatic activate/deactivate API (`src/utils/loading-button-init.js`); `icon-wc[data-animate="spin"]`. Doc pages: `/docs/attributes/data-loading/`, `/docs/elements/custom-elements/loading-spinner/`, `/docs/snippets/css/loading-states/`, `/docs/patterns/feedback/skeleton/`. Four spinner demos (sizes, inline, variants, imposter overlay).

*Empty state*: unified `data-state="empty"` pattern with `output[data-empty]` and `data-feedback="message|skeleton"` presentation (`src/utils/feedback-states.css`). Pattern docs: `/docs/patterns/feedback/empty-states/`, `/docs/patterns/feedback/feedback-states/`. Three demos (empty-simple, empty-action, empty-illustration).

Both are more comprehensive than CodyHouse's offerings.

### Typography (CodyHouse: 24, flat)

| CodyHouse concept | VB equivalent | Notes |
|---|---|---|
| Heading / display patterns | typography skill + CSS tokens | Covered by the `typography` skill and Open Props integration. |
| Pull quotes, blockquotes, drop caps | CSS / native | Covered by platform. |
| Font pairing UI | `font-pairer` | Covered. |
| Type specimen | `type-specimen` | Covered. |

**Material gaps:** none. VB's typography is tokens + skill rather than components, which is the right call.

### Effects (CodyHouse: 25; subcats Controls 5, Page Transition 1, Scroll 13, Text 6)

| CodyHouse concept | VB equivalent | Notes |
|---|---|---|
| Page Transition | View Transitions API integration | Covered (memory `view_transition_finished_vs_updatecallback`). |
| Scroll Effects (13) | `data-effect` spec + scroll-driven CSS | Largely covered. Worth auditing the 13 scroll effects against `data-effect` coverage. **Possible gap.** |
| Text Effects (6) | CSS / `data-effect` | Covered by composition. |
| Controls Effects (5) | `data-effect` | Covered. |

**Material gaps:** spot-audit CodyHouse scroll effects vs `data-effect` catalog.

### Plugins (CodyHouse: 51; Carousel 6, Misc 34, Slideshow 11)

| CodyHouse concept | VB equivalent | Notes |
|---|---|---|
| Carousel (6) | `carousel-wc` | Covered. |
| Slideshow (11) | `carousel-wc`, `image-gallery` | Covered. |
| Custom Cursor | — | Intentional skip (decorative). |
| Copy to Clipboard | `data-copy` / `data-copy-target` (`src/utils/copy-init.js`) | Covered. See `admin/research/clipboard-audit.md` and `/docs/attributes/data-copy/`. |
| Ticker | — | **Gap (minor):** marquee-like horizontal scroller. CSS-only is feasible. |
| Product Tour | `page-tour` | Covered. |
| Image Interest Points | `image-map` | Covered. |
| Form Validator | native + `form-field` | Covered. |
| QR Code | `qr-code` | Covered. |

**Material gaps:** ticker recipe. (Copy-to-clipboard is covered by `data-copy`; correction made 2026-05-22 — see `clipboard-audit.md`.)

### App / App-UI (CodyHouse: 17 = Card 13, Navigation 1, Notifications 3)

Marketing-app dashboard cards and shells. VB equivalents: `card-list`, `analytics-panel`, `settings-panel`, `kanban-board`, `score-card`, `quadrant-grid`, etc. **Covered.**

### Content and Layout (CodyHouse: 132)

Mostly marketing/landing templates: Hero (9), Features (36), Gallery (29), Banner (6), Pricing (3), Team (4), Testimonials (5), FAQ (3), Filter (8), Contact (3), Socials (9).

| Subcategory | VB position |
|---|---|
| Hero / Banner / Features / Pricing / Testimonials / Team / Contact / Socials | **Intentional skip.** These are marketing-page templates; VB's layout primitives (`data-layout`, layout-specimen, Open Props grid) compose them. Memory `feedback_use_vb_primitives` is explicit. |
| FAQ | `accordion-wc` + `patterns` skill | Covered. |
| Gallery (29) | `image-gallery`, `carousel-wc` | Covered. |
| Filter | `combo-box`, `selection-menu`, `tab-set` | Covered. |
| Card | `card-list`, `requirement-card`, `work-item`, `user-persona`, `user-story`, `score-card` (etc.) | Covered with rich domain variants. |

**Material gaps:** none in primitives. Possibly worth a `landing-page` site-scaffold variant if VB ever targets marketing sites — but that's a strategic decision, not a gap.

### Decorative Background (CodyHouse: 10)

**Intentional skip.** Marketing decoration. VB has `data-effect` for motion/effects but doesn't ship decorative SVG/canvas backgrounds.

### Blog (CodyHouse: 31) and Ecommerce (CodyHouse: 32)

**Intentional skip at the template level.** VB ships *primitives* (`author-index`, `glossary-wc`, `foot-notes`, `print-page`, `pager-wc`) that compose blog content; it doesn't ship blog-post-template HTML. Same for ecommerce: VB has no `<product-card>` or `<cart-wc>` — these are domain templates, and a future `scaffold-ecommerce` command exists in the skills list.

## What CodyHouse has that VB doesn't (consolidated)

Items below are **real** gaps, not category mismatches:

| Gap | Type | Cost | Priority |
|---|---|---|---|
| Split-button pattern doc | Doc/recipe | Low | Low |
| Footer recipe | Doc/recipe | Low | Low |
| Mega-menu / drawer-nav recipes for `nav-bar` | Doc/recipe | Low–Med | Low |
| Drawer overlay pattern | Doc/recipe | Low | Low |
| Ticker / marquee scroller | Recipe | Low | Very low |
| Scroll-effect audit vs `data-effect` catalog | Audit | Med | Low |
| Marketing-page templates (Hero/Features/Pricing) | Out of scope | — | — |
| Decorative backgrounds | Out of scope | — | — |

**Summary:** VB has effectively no missing primitives relative to CodyHouse's app-and-data scope. The genuine gaps are documentation/recipes for common compositions (split buttons, drawers, footers, mega-menus) and a single small utility (ticker). Marketing-template territory (the bulk of CodyHouse's 404-count) is an intentional scope decision and matches memory `feedback_use_vb_primitives`: native HTML → VB primitives → component code.

## What VB has that CodyHouse doesn't (consolidated)

Categories where VB has substantial breadth that CodyHouse doesn't address at all:

- **Domain-specific: UX/PM/Agile** — `user-persona`, `user-story`, `user-journey`, `empathy-map`, `story-map`, `requirement-card`, `quality-target`, `risk-register`, `traceability-matrix`, `impact-effort`, `iron-triangle`, `capacity-plan`, `burndown-chart`, `kanban-board`, `gantt-chart`, `product-roadmap`, `work-item`.
- **Domain-specific: theming/design tokens** — `theme-picker`, `theme-catalog`, `theme-export`, `theme-import`, `palette-generator`, `gradient-builder`, `font-pairer`, `semantic-palette`, `token-specimen`, `accessibility-specimen`, `breakpoint-specimen`, `layout-specimen`, `motion-specimen`, `spacing-specimen`, `type-specimen`, `color-picker`, `color-palette`.
- **Domain-specific: docs/content** — `page-toc`, `page-tour`, `page-info`, `page-stats`, `page-tools`, `glossary-wc`, `glossary-index`, `foot-notes`, `heading-links`, `highlight-wc`, `reader-view`, `text-reader`, `print-page`, `include-file`, `markdown-editor`, `markdown-viewer`, `adr-wc`, `note-wc`, `site-map`, `site-index`, `site-search`.
- **Domain-specific: AI/collaboration** — `ai-chat`, `ai-summary`, `chat-input`, `chat-window`, `comment-wc`, `comment-box`, `comment-thread`, `reaction-bar`, `slide-accept`.
- **Specimens/dev-tools** — `component-sampler`, `compare-surface`, `review-surface`, `diagram-wc`, `flow-diagram`, `topic-map`, `geo-map`, `image-map`.
- **Native-API integrations** — `qr-code`, `audio-visualizer`, `geo-map`, view-transition wrappers.

CodyHouse has none of these because they're outside its marketing-kit scope. This is the structural reason a raw count comparison (133 vs 404) is meaningless — the libraries solve different problems.

## Recommended follow-ups

If any of these become real work, file as new beads issues:

1. **Doc-recipe sweep:** split button, drawer, footer, mega-menu, ticker. Bundle as one "common patterns" doc PR. Low effort, plausibly high payoff for newcomers comparing the two libraries.
2. **Scroll-effect audit:** map CodyHouse's 13 scroll effects against `data-effect` catalog. Output: either coverage confirmation or a short list of additions.
3. **Strategic question (do not implement):** does VB want a marketing-page scaffold variant? Currently `scaffold-site` exists; `scaffold-blog` exists; no `scaffold-landing`. This is a positioning call, not a gap.

## Open questions / methodology caveats

- WebFetch summarization was lossy on a few category pages — subcategory counts came through reliably but individual component-name enumeration past the visible viewport sometimes didn't. The subcategory mapping above should be reliable; individual-component claims are spot-checked but not exhaustive.
- Pro components (301 of 404) were not enumerated; based on visible Pro samples (Light Dark Switch, Working Hours Selector, Markdown Editor, Advanced Search, Tilted Image Slideshow, Custom Cursor, Looping Slideshow), Pro adds variants and decoration on top of free primitives. No primitive gaps surfaced from the Pro list.
- This analysis treats CodyHouse subcategories as the comparison unit. If a deeper per-component comparison is wanted later, the right approach is targeted: pick a single CodyHouse subcategory (e.g., `Form Elements` 46), enumerate, and compare. That's a follow-up issue, not part of this scan.
