---
id: link-as-button
project: vanilla-breeze
status: done
priority: p3
depends: []
created: 2026-03-01
updated: 2026-03-02
---

# Add link-as-button pattern

Provide a VB-native way to style `<a>` elements as buttons for navigation CTAs without resorting to `<button onclick="location.hash=...">`.

## Context

- Discovered in the mobile-biosite demo. Hero CTAs need button styling on anchor elements (e.g., "View Pipeline" linking to `#pipeline`).
- Currently no clean VB approach. Options: a `.button` class on `<a>`, a `data-role="button"` attribute, or a custom element wrapper.
- Many CSS frameworks solve this with `.btn` on links. VB prefers element-scoped styles and data attributes over utility classes.

## Acceptance Criteria

- [x] `<a>` elements can be styled as buttons using a VB-native mechanism
- [x] Works with all button variants (primary, secondary, ghost, etc.)
- [x] Accessible — retains link semantics (`role="link"` not overridden)
- [x] Documented on the `<a>` element doc page

## Notes

**Already implemented.** `a.button` is fully supported in `src/native-elements/anchor/styles.css` (lines 160-180). All button variants (secondary, ghost, small, large, full-width) work on links. Documented on both the `<a>` and `<button>` doc pages.

The real issue was that the biosite hero CTAs used `<button onclick="location.hash='#...'">` instead of `<a href="#..." class="button">`. Fixed in this session.

## Out of Scope

- Changing existing button component styles
- JavaScript behavior changes

---

## Session Log

### 2026-03-02

- Investigated and found `a.button` already fully implemented and documented
- Fixed biosite hero CTAs: replaced `<button onclick>` with `<a class="button">` for proper link semantics
- Closed task — no new feature needed
