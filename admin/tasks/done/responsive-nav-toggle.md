---
id: responsive-nav-toggle
project: vanilla-breeze
status: done
priority: p2
depends: []
created: 2026-02-25
updated: 2026-03-01
---

# Add responsive nav toggle pattern (desktop nav + mobile hamburger)

VB has no built-in pattern for showing a horizontal nav on desktop and switching to a hamburger menu + bottom nav on mobile. This is one of the most common responsive patterns for marketing/biosite pages.

## Context

- Discovered in the mobile-biosite demo. The demo needs: desktop horizontal nav links in the header, mobile hamburger triggering a bottom sheet, and a sticky bottom nav bar on mobile only.
- Currently requires a custom `@media (min-width: 48rem)` block to show/hide the desktop nav, hamburger button, and bottom nav.
- VB's `nav.horizontal` provides the desktop nav styling, and `<dialog data-position="bottom">` provides the mobile sheet, but there's no mechanism to toggle between them.
- This pattern should work with VB's existing `data-page-layout` system, ideally without custom media queries.

## Acceptance Criteria

- [x] A VB-native way to declare "show this nav on desktop, show that nav on mobile" without custom media queries
- [x] Works with `data-page-layout="landing"` and other single-column layouts
- [x] Bottom nav can be sticky on mobile without per-page CSS
- [x] Hamburger button auto-hides on desktop
- [x] Desktop nav auto-hides on mobile
- [x] Documented with a demo page

## Out of Scope

- Complete responsive mega-menu or dropdown nav
- Progressive enhancement for JS-disabled mobile nav

## Notes

> Possible approaches: `data-breakpoint="desktop"` / `data-breakpoint="mobile"` visibility attributes, or a `<nav data-responsive>` pattern that auto-toggles.

---

## Session Log

### 2026-03-01

**Done:**
- Created `src/utils/responsive.css` with `data-visible="mobile"` and `data-visible="desktop"` media-query utilities (48rem breakpoint)
- Added `@import "./responsive.css"` to `src/utils/index.css`
- Added `nav.bottom` variant to `src/native-elements/nav/styles.css` (sticky bottom tab bar with flex row, icon+label stacking, safe-area padding)
- Added `[data-page-layout] > nav.bottom { grid-area: auto }` override in `src/custom-elements/layout-attributes.css`
- Created `demos/examples/demos/responsive-nav.html` demo page showing all three primitives together
- 294 tests pass, CDN build succeeds

**What's next:** Nothing — task complete.
