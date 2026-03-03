# Vanilla Breeze — Project Overview & Roadmap

> **Living document.** Consolidates the 37 R&D docs in `admin/r-n-d/`, the active task backlog, and the current codebase state into a single navigable reference. Updated 2026-03-01.

---

## What VB Is Today

Vanilla Breeze is an HTML-first web framework that styles 65+ native HTML elements, provides 32 web components, 25 layout custom elements, 54 progressive enhancement utilities, and 53 theme variants — all without requiring a build step for consumers.

| Metric | Count |
|--------|------:|
| Web components (with JS logic) | 31 |
| Web components (CSS-only) | 1 |
| Custom layout elements | 13 |
| Custom utility elements | 9 |
| Enhancement init scripts | 43 |
| Theme variants | 53 |
| Demo pages | 491 |
| Doc site pages | 366 |
| Unit tests | 294 |
| Quality scripts | 38 |

**CDN bundle:** Core 98 KB gzip, Full 169 KB gzip.

**Quality gates (all green):** tsc strict null checks, ESLint + jsdoc, html-validate, pa11y, VB conformance checker, 294 unit tests, visual regression tests, component tests.

---

## Work Streams

Everything below is organized into **work streams** — coherent groups of related work that can be scheduled independently. Each stream references the R&D docs that feed it and surfaces the key open decisions.

---

### 1. Core CSS & Layout

**What exists:** 39 native-element stylesheets, cascade layers, layout-attributes system, container queries.

**R&D docs:** `css-layout-future.md`, `css-parts.md`, `classless-review.md`, `html-codex.md`, `performance.md`

**Active bugs:**
- `container-type-reel-conflict` (p2) — `container-type: inline-size` on semantic elements zeros out flex children in `<layout-reel>`. Known workaround: `container-type: normal` override. Needs a systematic fix so reels work inside articles/sections without manual overrides.
- `landing-layout-body-main` (p2) — Landing page layout has no `body-main` grid area; `<main>` needs `grid-area: hero` workaround.

**Planned features (from R&D):**
| Feature | Source | Readiness | Notes |
|---------|--------|-----------|-------|
| Subgrid adoption | `css-layout-future.md` | Wait for Baseline >90% | Complex nested layouts |
| Scroll-driven animations | `css-layout-future.md` | Ready to prototype | Progress bars, reveal effects |
| `@starting-style` | `css-layout-future.md` | Ready | Initial animation states |
| CSS `::part()` theming | `css-parts.md` | Design needed | Which components expose which parts? |
| `@property` typed tokens | `css-layout-future.md` | Ready | Enables animatable custom properties |
| Bundle deduplication | `performance.md` | Audit needed | 48 KB layout-attributes duplication identified |

**Decisions needed:**
- Polyfill strategy for older browsers, or progressive-enhancement only?
- `::part()` naming convention for component internals?

---

### 2. Theming & Design Tokens

**What exists:** 53 themes, token-based system, theme-picker component, OS preference detection, theme-loader + theme-manager in lib.

**R&D docs:** `themes.md`, `theme-consistency.md`, `themes/token-strategy.md`, `themes/os-integration.md`

**Planned work:**
| Work item | Source | Priority |
|-----------|--------|----------|
| Consistency audit — ensure all components use tokens, no hardcoded values | `theme-consistency.md` | Medium |
| Token hierarchy formalization — document semantic → design token mapping | `themes/token-strategy.md` | Medium |
| OS integration hardening — persist preference, handle mid-session changes, prevent FOUC | `themes/os-integration.md` | Low |
| Community theme distribution format | `themes.md` | Low |

**Decisions needed:**
- Token versioning strategy when adding/renaming tokens?
- Theme export format for community distribution (JSON? CSS file? both?)?

---

### 3. Mobile & Touch

**What exists:** `vb-gestures.js` (swipe, long-press, pull-to-refresh, make-swipeable), safe area handling, responsive font scaling. Mobile biosite demo built and functional.

**R&D docs:** `mobile-phases.md`, `touch.md`

**Active tasks:**
- `mobile-biosite-demo` (p1, active) — 2 sessions done, demo functional
- `responsive-nav-toggle` (p2) — No VB pattern for responsive desktop/mobile nav

**Phase roadmap (from `mobile-phases.md`):**
| Phase | Focus | Status |
|-------|-------|--------|
| 1. Foundation | Safe areas, touch targets, responsive fonts | Done (validated via biosite) |
| 2. Gestures | Swipe, pinch, long-press | Done (`vb-gestures.js`) |
| 3. Forms | Touch-optimized controls, virtual keyboard | Partially done |
| 4. Marketing patterns | Bottom sheets, swipe nav, app-shell | Prototyped in biosite |
| 5. PWA | Service workers, offline, installability | `sw-register.js` exists, needs polish |

**Gaps discovered during biosite:**
- No responsive nav toggle component
- No link-as-button pattern documented
- Pull-to-refresh has JS but no visual indicator component

---

### 4. Forms & Validation

**What exists:** `form-field-enhancements.js`, `form-validation.js`, `<form-field>` custom element, wizard.js (multi-step forms), mask/autosave/rating inits.

**R&D docs:** `form-validation.md`, `wizard.md`, `input-transforms.md`

**Planned features:**
| Feature | Source | Readiness |
|---------|--------|-----------|
| `data-match` cross-field validation | `form-validation.md` | Spec ready |
| Async server-side validation hooks | `form-validation.md` | Spec ready |
| Input masking/transforms pipeline | `input-transforms.md` | Research stage |

**Decisions needed:**
- Async validation API shape — callback, promise, or observable?

---

### 5. Internationalization

**What exists:** `i18n.js` with locale-aware date/number formatting, `data-i18n` attribute, CSS script-aware typography.

**R&D docs:** `i18n.md`, `i18n/architecture-gemini.md`, `i18n/html-gemini.md`

**Planned work:**
- Unify CSS and JS i18n architecture (noted drift in `i18n.md`)
- Ruby annotation support for East Asian text
- Locale-specific form validation (phone numbers, postal codes)
- RTL layout testing and documentation

**Decisions needed:**
- Should ruby support be a utility or a component?
- How to handle locale-specific validation without bloating the bundle?

---

### 6. Analytics (Open Analytics)

**What exists:** Nothing shipped in VB yet. Comprehensive spec exists.

**R&D docs:** `analytics.md` (status), `analytics-spec.md` (client v0.3.0), `analytics-backend-spec.md` (server), `analytics-part2.md`, `analytics-part3.md` (research)

**Architecture (5 layers, from spec):**
| Layer | What | JS needed? |
|-------|------|-----------|
| 0 | HTTP `Last-Modified` header counting | No |
| 1 | Server log analysis (referrer-based uniques) | No |
| 2 | `ping` attribute on links | No |
| 3 | JS beacon for SPA, metadata, events | Yes (<1.5 KB) |
| 4 | Web Vitals (LCP, CLS, INP, TTFB) | Yes (opt-in) |
| 5 | Error tracking (JS errors, unhandled rejections) | Yes (opt-in) |

**Status:** Client and server specs are detailed and implementation-ready. No code exists yet.

**Decisions needed:**
- Backend infrastructure: Cloudflare Workers + D1, or self-hosted Postgres?
- Data retention policy (30/90/365 days)?
- Dashboard: build custom or use Grafana/similar?
- When to start implementation vs. stabilizing VB core?

---

### 7. Content Trust & Provenance

**What exists:** Nothing shipped. Concept documented.

**R&D docs:** `document-provenance.md`

**Concept:** `data-trust` attributes for content origin (human/AI/bot), change tracking via native `<ins>`/`<del>`, JSON-LD metadata, future cryptographic signatures.

**Status:** Early-stage thinking. Cross-cuts with CMS strategy (Vanilla Press) and global-overview's "Data Integrity & Meta Initiative."

**Decision needed:** Is this a VB feature or a separate project?

---

### 8. Print & Multi-Modal Output

**What exists:** `print.css` utility, `<print-page>` component.

**R&D docs:** `print-styles.md`

**Planned work:**
- `@page` margin boxes for headers/footers
- Link URL expansion in print
- Interactive element hiding
- Dark-to-light conversion for print
- Page break control

---

### 9. Developer Tooling

**What exists:** Grid composer (functional prototype), wireframe mode, VB conformance checker, 38 quality scripts, type-checking pipeline.

**R&D docs:** `grid-composer-status.md`, `wireframe.md`

**Active tasks:**
- `htmlvalidate-custom-elements` (p2) — Register VB custom elements. Mostly resolved in commit `60763c9` (41 elements registered), task may need closing or final verification.

**Planned features:**
- Wireframe-to-HTML export
- Grid composer responsive preview
- Annotation system for design handoff

---

### 10. Adjacent Projects (Not VB Core)

These are documented in R&D but live outside the VB framework itself:

| Project | R&D docs | Relationship to VB |
|---------|----------|-------------------|
| **Montane** (SPA framework) | `enhance-eval.md`, `enhance-for-montane.md` | Consumes VB for styling; SSR engine is independent |
| **Vanilla Press** (CMS) | `editor-component.md` | Outputs VB sites; editor component may live in VB |
| **Server service facade** | `server-side-service-facade.md` | Pattern for VB sites, not the framework |
| **HTML-Star** (HTMX-like) | `global-overview.md` | Potential merge candidate with VB |

---

## Priority Matrix

Combining active tasks, R&D maturity, and user impact:

### Now (current sprint)

| Item | Type | Source |
|------|------|--------|
| Close `mobile-biosite-demo` | Task | Active (p1) |
| Fix `container-type-reel-conflict` | Bug | Active (p2), blocks layout work |
| Fix `landing-layout-body-main` | Bug | Active (p2), blocks landing pages |
| Verify/close `htmlvalidate-custom-elements` | Task | Active (p2), may be done |

### Next (after current sprint clears)

| Item | Type | Source |
|------|------|--------|
| Responsive nav toggle component | Feature | Active task (p2) |
| Form validation: `data-match` + async hooks | Feature | `form-validation.md` |
| Theme consistency audit | Quality | `theme-consistency.md` |
| Bundle deduplication audit | Performance | `performance.md` |

### Soon (next quarter)

| Item | Type | Source |
|------|------|--------|
| Analytics client Layer 0-3 | Feature | `analytics-spec.md` |
| Print styles completion | Feature | `print-styles.md` |
| I18n architecture unification | Architecture | `i18n.md` |
| CSS `::part()` theming design | Architecture | `css-parts.md` |
| PWA polish (Phase 5 mobile) | Feature | `mobile-phases.md` |

### Later (backlog)

| Item | Type | Source |
|------|------|--------|
| Analytics backend + dashboard | Feature | `analytics-backend-spec.md` |
| Scroll-driven animations | Feature | `css-layout-future.md` |
| Document provenance system | Feature | `document-provenance.md` |
| Subgrid adoption | Feature | `css-layout-future.md` (wait for baseline) |
| Montane SSR engine | Adjacent | `enhance-for-montane.md` |

---

## Open Strategic Questions

These cut across work streams and deserve explicit decisions:

1. **HTML-Star merge** — The global overview mentions HTML-Star may fold into VB. Should it? It adds HTMX-like fetch/swap via `data-*` attributes, which aligns with VB's philosophy but adds significant scope.

2. **Analytics timing** — The spec is implementation-ready but requires backend infrastructure. Should analytics development start now (parallel to VB core), or wait until VB 1.0 stabilizes?

3. **CMS strategy** — Vanilla Press, 11ty, Astro, or headless CMS? The doc site already uses 11ty. Is the CMS strategy a VB concern or a separate project?

4. **Montane relationship** — Is Montane a VB extension (like `vb-gestures.js`) or a separate framework that happens to consume VB?

5. **Bundle size target** — Current full bundle is 169 KB gzip. The performance doc identifies deduplication opportunities. What's the target? Is there a budget?

6. **1.0 definition** — What constitutes a VB 1.0 release? Which of the above work streams must complete first?

---

## R&D Document Index

Quick reference to all 37 R&D documents, grouped by work stream:

### Core CSS & Layout
- [`classless-review.md`](r-n-d/classless-review.md) — HTML element coverage audit vs. competitors
- [`css-layout-future.md`](r-n-d/css-layout-future.md) — Modern CSS feature roadmap (subgrid, container queries, scroll-driven)
- [`css-parts.md`](r-n-d/css-parts.md) — `::part()` API for component theming
- [`html-codex.md`](r-n-d/html-codex.md) — Native HTML element gap analysis
- [`performance.md`](r-n-d/performance.md) — Bundle size audit and optimization targets

### Theming
- [`themes.md`](r-n-d/themes.md) — Theme system overview
- [`theme-consistency.md`](r-n-d/theme-consistency.md) — Consistency audit plan
- [`themes/token-strategy.md`](r-n-d/themes/token-strategy.md) — Token architecture
- [`themes/os-integration.md`](r-n-d/themes/os-integration.md) — OS preference detection

### Mobile & Touch
- [`mobile-phases.md`](r-n-d/mobile-phases.md) — 5-phase mobile strategy
- [`touch.md`](r-n-d/touch.md) — Touch interaction patterns

### Forms & Validation
- [`form-validation.md`](r-n-d/form-validation.md) — Validation framework roadmap
- [`wizard.md`](r-n-d/wizard.md) — Multi-step form pattern
- [`input-transforms.md`](r-n-d/input-transforms.md) — Input masking and transforms

### Internationalization
- [`i18n.md`](r-n-d/i18n.md) — I18n framework status
- [`i18n/architecture-gemini.md`](r-n-d/i18n/architecture-gemini.md) — Architecture research
- [`i18n/html-gemini.md`](r-n-d/i18n/html-gemini.md) — HTML i18n patterns

### Analytics
- [`analytics.md`](r-n-d/analytics.md) — Status consolidation
- [`analytics-spec.md`](r-n-d/analytics-spec.md) — Client spec v0.3.0
- [`analytics-backend-spec.md`](r-n-d/analytics-backend-spec.md) — Server spec
- [`analytics-part2.md`](r-n-d/analytics-part2.md) — Earlier research
- [`analytics-part3.md`](r-n-d/analytics-part3.md) — Platform comparison

### Content & Provenance
- [`document-provenance.md`](r-n-d/document-provenance.md) — Content trust and change tracking

### Print
- [`print-styles.md`](r-n-d/print-styles.md) — Print media implementation

### Components
- [`charts.md`](r-n-d/charts.md) — Charting library notes
- [`text-reader.md`](r-n-d/text-reader.md) — TTS component reference
- [`progress-enhance.md`](r-n-d/progress-enhance.md) — Progress element consolidation
- [`grid-composer-status.md`](r-n-d/grid-composer-status.md) — Layout composition tool
- [`wireframe.md`](r-n-d/wireframe.md) — Prototyping capabilities

### Integration & Strategy
- [`competition-ideas.md`](r-n-d/competition-ideas.md) — Competitive analysis
- [`html-claude.md`](r-n-d/html-claude.md) — HTML markup patterns
- [`view-transitions.md`](r-n-d/view-transitions.md) — View Transitions API
- [`upcoming-features-in-browsers.md`](r-n-d/upcoming-features-in-browsers.md) — Browser feature tracking
- [`data-model-concept.md`](r-n-d/data-model-concept.md) — Data binding patterns
- [`editor-component.md`](r-n-d/editor-component.md) — Editor evaluation

### Adjacent Projects
- [`enhance-eval.md`](r-n-d/enhance-eval.md) — Enhance.dev evaluation
- [`enhance-for-montane.md`](r-n-d/enhance-for-montane.md) — SSR patterns for Montane
- [`server-side-service-facade.md`](r-n-d/server-side-service-facade.md) — Service proxy pattern
