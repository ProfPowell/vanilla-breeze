---
id: landing-layout-body-main
project: vanilla-breeze
status: backlog
priority: p2
depends: []
created: 2026-02-25
updated: 2026-02-25
---

# Add `body-main` grid area to landing page layout

The landing page layout template only defines `body-header`, `hero`, `feature`, `cta`, `body-footer` — it has no `body-main` area. Since VB's grid identity rules assign `grid-area: body-main` to `<main>`, any page using `data-page-layout="landing"` with a `<main>` wrapper gets invisible content.

## Context

- Discovered in the mobile-biosite demo task. The biosite uses `data-page-layout="landing"` with a `<main>` wrapping all content sections.
- `<main>` gets `grid-area: body-main` from `layout-attributes.css` line 810, but `--tpl-landing` (line 712) has no row for that area.
- Current workaround: page-level CSS `body > main { grid-area: hero; }` which hijacks the hero row.
- Same issue affects `<nav>` (`grid-area: body-nav` not in landing template) — bottom nav creates implicit columns, breaking mobile layout.
- The landing layout is the only page layout without a `body-main` area. `article`, `app-shell`, `dashboard`, `sidebar-end`, and `holy-grail` all include it.

## Acceptance Criteria

- [ ] `--tpl-landing` grid template includes a `body-main` row between `body-header` and `body-footer`
- [ ] `<main>` renders correctly in landing layout without per-page overrides
- [ ] Named areas (`hero`, `feature`, `cta`) still work when used as `data-layout-area` on direct body children (for pages that don't use `<main>`)
- [ ] Existing landing demos (e.g., `page-layout-landing.html`) still render correctly
- [ ] `<nav>` as bottom nav auto-places without creating implicit columns

## Out of Scope

- Adding new named areas beyond the existing set
- Responsive nav toggle pattern (separate task)

## Notes

> Add discoveries, decisions, or blockers here during work.

---

## Session Log

_No sessions yet._
