---
id: pull-to-refresh-indicator
project: vanilla-breeze
status: done
priority: p3
depends: []
created: 2026-03-01
updated: 2026-03-02
---

# Add pull-to-refresh visual indicator

Provide a built-in CSS/JS visual indicator for the pull-to-refresh gesture pattern.

## Context

- The gesture JS module (`vb-gestures.js`) supports pull-to-refresh via `data-gesture="pull-to-refresh"`, but there is no built-in visual indicator showing the pull progress or refresh state.
- Users must currently build their own spinner/arrow indicator.
- A built-in indicator would make the pull-to-refresh pattern zero-config.

## Acceptance Criteria

- [x] Visual indicator appears during pull gesture (arrow or spinner)
- [x] Shows pull progress proportionally
- [x] Transitions to loading state on release
- [x] Works with VB's existing gesture system
- [x] Respects `prefers-reduced-motion`
- [x] Documented with a demo

## Notes

**Already implemented.** `addPullToRefresh()` in `src/lib/vb-gestures.js` (line 212) already creates a visual indicator:
- Creates `<div data-pull-indicator>` with `<div data-pull-spinner>` inside
- CSS in `src/lib/vb-gestures.css` provides styling: positioned overlay, circular spinner, rotation animation
- Respects `prefers-reduced-motion`
- Demonstrated in `demos/examples/demos/gesture-playground.html`

The indicator is basic (CSS spinner) but functional. A future enhancement could swap in `<loading-spinner>` for richer variants, but that's optional polish — not a gap.

## Out of Scope

- Actual data refresh logic (that's app-specific)
- iOS Safari native pull-to-refresh override

---

## Session Log

### 2026-03-02

- Investigated and found pull-to-refresh indicator already fully implemented in vb-gestures.js/css
- Demo exists at gesture-playground.html
- Closed task — no new feature needed
