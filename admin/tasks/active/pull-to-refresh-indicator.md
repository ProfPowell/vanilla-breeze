---
id: pull-to-refresh-indicator
project: vanilla-breeze
status: backlog
priority: p3
depends: []
created: 2026-03-01
updated: 2026-03-01
---

# Add pull-to-refresh visual indicator

Provide a built-in CSS/JS visual indicator for the pull-to-refresh gesture pattern.

## Context

- The gesture JS module (`vb-gestures.js`) supports pull-to-refresh via `data-gesture="pull-to-refresh"`, but there is no built-in visual indicator showing the pull progress or refresh state.
- Users must currently build their own spinner/arrow indicator.
- A built-in indicator would make the pull-to-refresh pattern zero-config.

## Acceptance Criteria

- [ ] Visual indicator appears during pull gesture (arrow or spinner)
- [ ] Shows pull progress proportionally
- [ ] Transitions to loading state on release
- [ ] Works with VB's existing gesture system
- [ ] Respects `prefers-reduced-motion`
- [ ] Documented with a demo

## Out of Scope

- Actual data refresh logic (that's app-specific)
- iOS Safari native pull-to-refresh override

---

## Session Log

_No sessions yet._
