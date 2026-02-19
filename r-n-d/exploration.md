# Vanilla Breeze R&D: HTML Coverage Roadmap

> **Last triaged:** 2026-02-19
>
> This document was originally a gap analysis comparing `syntax.md` against a complete HTML element/attribute list. Most of its original recommendations are now complete. This version reflects current reality and focuses on remaining opportunities.

## Status: Complete

These items from the original exploration are **done** and require no further work:

- **Inline text semantics** — `src/native-elements/inline-semantics/styles.css` covers all 25 elements (b, i, u, em, small, sub, sup, dfn, abbr, q, cite, mark, kbd, code, samp, var, time, s, del, ins, data, wbr, bdi, bdo, ruby/rt/rp)
- **Table structure** — `caption`, `col`, `colgroup`, `thead`, `tfoot` all styled and documented
- **Form elements** — `optgroup`, `option`, `datalist` all have CSS and doc pages
- **Media** — `track` on video/audio styled; `object`, `embed`, `map`, `area` documented
- **SVG and math** — both have CSS directories and doc pages
- **Document-level** — `head`, `meta`, `script`, `noscript` all documented
- **120+ native element doc pages** exist across the site

## Remaining Opportunities

### Tier 1 — Native HTML Attributes Guide

**Gap:** The `/docs/attributes/` index covers VB's 30+ custom `data-*` attributes. Element pages teach some native attributes in context (img covers `loading`, input covers `autocomplete`), but there's no consolidated reference for the native HTML attributes most developers underuse.

**Recommendation:** A single doc page at `/docs/native-attributes/` — a curated guide organized by what they unlock:

- **Performance** — `loading`, `fetchpriority`, `decoding`
- **Mobile UX** — `inputmode`, `enterkeyhint`, `autocomplete`
- **Interactivity** — `hidden`, `inert`, `contenteditable`, `popover`
- **Accessibility** — `lang`, `dir`, `translate`, `tabindex`
- **Security** — `rel="noopener noreferrer"`, `integrity`, `crossorigin`, `referrerpolicy`
- **Forms** — `pattern`, `min`/`max`/`step`, `minlength`/`maxlength`, `form`, `formaction`

**Status:** ✅ Shipped — `/docs/native-attributes/`

### Tier 2 — ARIA Mapping Table for Web Components

**Gap:** No documentation showing what ARIA roles/states each web component manages internally. Developers should know what they get for free vs. what they need to provide.

**Recommendation:** Expand the existing ARIA table on `/docs/accessibility/` to cover all interactive web components with roles, states/properties, and developer responsibilities.

**Status:** ✅ Shipped — expanded table on `/docs/accessibility/#aria`

## Deprioritized (Misaligned with VB Philosophy)

These items from the original exploration are **explicitly not recommended**:

### Web components that compete with native HTML

| Proposal | Why not |
|----------|---------|
| `date-picker-wc` / `time-picker-wc` | Native `<input type="date/time">` is already styled. VB champions the native control. |
| `file-upload-wc` | `data-upload` enhancer already exists. Native `<input type="file">` is styled. |
| `range-slider-wc` (dual-handle) | Niche use case, significant JS complexity. |
| `modal-wc` / `drawer-wc` | Native `<dialog>` is already styled and documented. Wrapping it adds abstraction VB is trying to remove. |
| `data-grid-wc` | Enterprise complexity, not VB's lane. |
| `notification-center-wc` | `toast-wc` already exists. Grouping/history is application logic. |

### Custom elements with questionable value

| Proposal | Why not |
|----------|---------|
| `page-header` | `<header>` already serves this purpose with VB styling. |
| `feature-grid` / `feature-list` | `<layout-grid>` + semantic HTML already covers this. |
| `figure-card` | `<figure>` + `<figcaption>` is already well-styled. |
| `code-block` | Already exists as a web component (`<code-block>`). |

## Parking Lot (Potentially Worth Doing Later)

These have real use cases but need design clarity or aren't urgent:

| Idea | Notes |
|------|-------|
| `empty-state` | Common UI pattern. Could be CSS-only custom element. Needs design spec. |
| `callout-box` | Useful if distinct from `<status-message>`. Needs design clarity on differentiation. |
| `stat-card` | Dashboard KPI card. Real use case but needs design spec. |
| `timeline-list` | Chronological layout. Real use case but niche. |
| `stepper-wc` | `data-wizard` enhancer exists. A WC version might be better but needs evaluation. |
| `tree-view-wc` | `.tree` nav class exists. WC upgrade has merit but significant work. |
