# Semtx vs. Vanilla Breeze & html-star — Comparison & Findings

> **Status:** R&D / advisory, 2026-05-01
> **Owner:** VB project
> **Source reviewed:** https://semtx.org/philosophy and https://semtx.org/ (other documented routes — `/components`, `/getting-started` — return 404 as of this writing).
> **Related projects:** Vanilla Breeze (this repo), html-star (`~/src/html-star`).

This document captures what Semtx claims to stand for, where Vanilla Breeze (VB) and html-star already overlap with that stance, and which Semtx-flavored ideas — if any — are worth adopting.

---

## 1. What Semtx Is

Semtx positions itself as a **"Semantic CSS library for the modern web"** with two main pillars:

1. **Semantic-CSS-over-utility manifesto.** "Class names should describe *what* elements are, not *how* they look." Explicitly framed as the anti-Tailwind position.
2. **Lightweight, themeable component CSS.** A single CSS file delivered via CDN, OKLCH-based theme variables, automatic light/dark, ready-made styling for buttons, forms, tables, modals, alerts, navigation, progress bars, skeletons, etc. Native HTMX integration is a headline feature (active search, infinite scroll, load-more, pending states via `hx-*`).

Stated benefits: readable, maintainable, **AI-friendly**, portable, accessible, SEO-friendly, consistent. Claimed size: ~30 KB vs. 50–100 KB+ for utility frameworks.

Caveats from inspection:
- The site itself uses class-based variants (`class="card"`, `class="sidebar"`, `primary`/`secondary` modifier classes).
- Despite the manifesto, Semtx ships utility classes (`p-4`, `mt-2`, `gap-2`, `text-primary`, `font-bold`, `block`, `hidden`). That is an internal contradiction worth noting before borrowing anything wholesale.
- HTMX is treated as the canonical interaction layer; Semtx assumes you ship HTMX too.

---

## 2. Where VB and html-star Already Agree With Semtx

| Principle (Semtx phrasing) | VB position | html-star position |
|---|---|---|
| Classes describe *what*, not *how* | Stronger: prefer **native elements + custom elements + attributes** over classes entirely. `<browser-window>`, `<layout-reel>`, `data-layout="…"` instead of `class="card flex p-4"`. | Sidesteps the class debate — uses `data-*` attributes only. |
| Native HTML5 elements have built-in a11y/SEO | Core: 65+ native elements styled directly; demos forbid `<div>`. | Core: infers behavior from `href`, `action`, `method`, `formmethod` — rewards valid HTML. |
| AI-friendly markup | Already true by construction; semantic elements + custom-element names self-describe intent. Not stated as an explicit philosophy line. | True by construction; cascade + inference means an agent reads one root attribute and knows what every child does. |
| Lightweight | VB is heavier (component library + themes + analytics + provenance) but bundle-budgeted in CI. | Target <4 KB gzipped. Stricter than Semtx's 30 KB. |
| Progressive enhancement | Core philosophy (memory: `feedback_html_first_components.md`, `feedback_foundation_first.md`). | Core: "Links work without JS; JS makes them better." |

**Conclusion:** the *philosophy* page of Semtx is largely a subset of what VB and html-star already do — and in places where Semtx hedges (utility-class escape hatches, HTMX coupling), VB and html-star are stricter and cleaner.

---

## 3. Where Semtx, VB, and html-star Diverge

### Style of "semantic"

- **Semtx:** semantic *class names* (`.card`, `.sidebar`, `.btn-primary`). Still classes, just better-named.
- **VB:** semantic *elements*. `<semantic-card>`, `<browser-window>`, `<page-toc>`, `<layout-reel>`. The element name *is* the semantic.
- **html-star:** semantic *attributes*. Behavior follows `href`, `action`, `data-target`, `data-swap` cascading down the DOM.

This is the most important takeaway: VB and html-star both argue the next step past Semtx is *eliminating the class layer entirely*. Custom elements own structural semantics; data attributes own behavior; CSS targets elements and attributes, not classes.

### Interaction model

- **Semtx:** explicit HTMX dependency; assumes `hx-get`, `hx-target`, `hx-trigger`.
- **html-star:** standalone replacement for HTMX. Cascading `data-target`, View Transitions API, Navigation API, no `hx-*` namespace pollution. Smaller, platform-native, no third-party dependency.
- **VB:** orthogonal — VB is the component/style/theme layer; html-star (or any AJAX layer) plugs in on top via standard attributes. VB already speaks the same `data-*` dialect.

### Scope

- **Semtx:** CSS only. Theming + component styling + a few utility shims.
- **html-star:** JS only. Behavior, no styling.
- **VB:** both, plus themes (50+), provenance signing, analytics subsystem, mobile/touch primitives, i18n. Different tier of project entirely.

---

## 4. Ideas Worth Adopting

### 4.1 Make the manifesto explicit (low cost, real value)

Semtx publishes a short, sharable philosophy page that crystallizes its position. VB has the philosophy spread across `CLAUDE.md`, `admin/global-vanilla-breeze.md`, R&D docs, and memory. There is value in a single public page on the doc site that says, in plain language:

> Vanilla Breeze styles elements, not classes. Behavior comes from attributes, not JavaScript hooks. Markup describes what content *is*; CSS and components decide how it looks.

This is also AI-onboarding material. An agent landing on the docs site should be able to internalize the contract in one read.

**Recommendation:** add a `site/src/pages/philosophy.njk` (or similar) drawing from existing memory entries (`feedback_html_first_components.md`, `feedback_content_vs_state_attrs.md`, `feedback_structural_css_invariants.md`). Cross-link from `admin/global-vanilla-breeze.md`.

### 4.2 Frame "AI-friendly" as a first-class benefit

Semtx names this explicitly. VB already delivers it (custom-element names, `vb:*` meta envelope, semantic structure) but does not market it. Worth adding to the philosophy page and the README — coding agents are a real audience now.

### 4.3 Three-tier server response pattern (already documented in html-star)

Not from Semtx, but surfaced while reviewing html-star's `enhance-for-html-star.md`:

| Request | Header | Response |
|---|---|---|
| Initial page load | `Accept: text/html` | Full page |
| AJAX swap | `X-Requested-With: htmlstar` | HTML fragment |
| API consumer | `Accept: application/json` | JSON |

VB's data-API audit (`admin/specs/data-api-audit.md`) is converging on the dual-mode (HTML + JS property) idea on the *client* side. The server-side three-tier pattern is the matching story for VB's doc site and any backend examples we ship. Worth a documentation note alongside the data-API audit.

### 4.4 OKLCH theming sanity check

Semtx leans on OKLCH for theme tokens. VB themes already use OKLCH (`src/tokens/`). No action — just confirms VB is on the right standard.

---

## 5. Ideas Explicitly *Not* Worth Adopting

| Semtx feature | Why skip |
|---|---|
| Utility classes (`p-4`, `mt-2`, `text-primary`, `hidden`) | Directly contradicts Semtx's own manifesto and VB's stricter no-class stance. VB uses `data-layout` / `data-gap` / structural custom elements instead. |
| Class-based component variants (`.card`, `.btn-primary`) | VB already prefers element-based variants (`<semantic-card variant="…">`) or attribute-based variants. Adding parallel class APIs would double the surface area without value. |
| HTMX coupling | VB stays library-agnostic. If users want declarative AJAX, html-star (or HTMX itself) plugs in on top. VB should not bake either in. |
| Semtx's "single CSS file via CDN" delivery model | VB ships layered CSS by design (`@layer` cascade). Flattening to one file would lose the override story documented in `feedback_structural_css_invariants.md`. |

---

## 6. html-star Cross-Pollination (bonus)

While reviewing, two html-star ideas stand out for VB consideration — independent of Semtx:

1. **Attribute cascade.** html-star resolves `data-target`, `data-swap`, etc. by walking up the DOM. VB has analogous patterns (theme inheritance, `data-layout` on layout elements) but does not have a documented general rule for *which* VB attributes inherit. Worth a small spec in `admin/specs/` if more inheritable attributes appear (e.g., density, theme, density mode).
2. **Empty-string opt-out.** html-star uses `data-target=""` to break inheritance for one element. VB could adopt the same convention if/when it formalizes inheritable attributes.

Neither is urgent; both are cheap if/when the need surfaces.

---

## 7. Summary

- Semtx's *philosophy* (semantic > utility, native elements, AI-friendly, progressive enhancement) is real, correct, and already a subset of what VB and html-star do — often more rigorously.
- Semtx's *implementation* (utility-class shims, class-based variants, HTMX coupling, single-file delivery) is the part to leave behind.
- The biggest win from this review is **documenting VB's existing philosophy as a public page**, and explicitly naming **AI-friendliness** as a benefit. Both are low-effort, high-leverage.
- html-star's cascade + inference model is the strongest spiritual match for VB's stance and is already independently aligned. No coupling needed; just continue speaking the same `data-*` dialect.
