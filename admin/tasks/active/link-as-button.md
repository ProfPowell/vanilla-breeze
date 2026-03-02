---
id: link-as-button
project: vanilla-breeze
status: backlog
priority: p3
depends: []
created: 2026-03-01
updated: 2026-03-01
---

# Add link-as-button pattern

Provide a VB-native way to style `<a>` elements as buttons for navigation CTAs without resorting to `<button onclick="location.hash=...">`.

## Context

- Discovered in the mobile-biosite demo. Hero CTAs need button styling on anchor elements (e.g., "View Pipeline" linking to `#pipeline`).
- Currently no clean VB approach. Options: a `.button` class on `<a>`, a `data-role="button"` attribute, or a custom element wrapper.
- Many CSS frameworks solve this with `.btn` on links. VB prefers element-scoped styles and data attributes over utility classes.

## Acceptance Criteria

- [ ] `<a>` elements can be styled as buttons using a VB-native mechanism
- [ ] Works with all button variants (primary, secondary, ghost, etc.)
- [ ] Accessible — retains link semantics (`role="link"` not overridden)
- [ ] Documented on the `<a>` element doc page

## Out of Scope

- Changing existing button component styles
- JavaScript behavior changes

---

## Session Log

_No sessions yet._
