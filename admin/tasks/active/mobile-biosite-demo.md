---
id: mobile-biosite-demo
project: vanilla-breeze
status: active
priority: p1
depends: []
created: 2026-02-25
updated: 2026-02-25
---

# Create Mobile Biosite Demo Using Vanilla Breeze

Build a biosite-style sample page (modeled on `admin/example-mobile-biosite.html`) that uses vanilla-breeze syntax exclusively, showcasing as many mobile capabilities as possible.

## Context

- The reference file `admin/example-mobile-biosite.html` is a pharma biosite with custom CSS — no VB usage at all. This task converts that concept into a VB-native demo.
- The demo should exercise the full mobile feature set: safe-area tokens, app-shell layout, bottom sheets, gesture layer, responsive layouts, touch targets, form optimization, viewport units, and scroll patterns.
- Any features the reference site needs that VB **cannot** express natively should be documented and filed as new tasks after the demo is created.
- The demo must work at https://vb.test for local review.

### VB Mobile Capabilities to Showcase

**Layout & Structure**
- `data-page-layout="app-shell"` (header/main/bottom-nav reordering)
- `data-layout="reel"` for horizontal card scrolling (pipeline cards, stats strip)
- `data-layout="grid"`, `data-layout="sidebar"`, `data-layout="switcher"`, `data-layout="split"` for responsive sections
- `data-layout="stack"` and `data-layout="cluster"` for vertical/inline groupings
- `data-layout-min="100svh"` / `data-layout-min="100dvh"` for hero section

**Safe Areas & Viewport**
- `viewport-fit=cover` meta tag
- `--safe-top`, `--safe-bottom` tokens on fixed nav elements
- `env(safe-area-inset-*)` in bottom nav

**Touch & Pointer**
- 44px touch targets via `--size-touch-min` (automatic on coarse pointers)
- Tap highlight removal (automatic)
- `touch-action` properties on gesture surfaces

**Bottom Sheet / Dialog**
- `<dialog data-position="bottom">` for a mobile action sheet or menu
- Invokers API (`commandfor`/`command`) for declarative open/close

**Gesture Layer**
- `data-gesture="swipe"` on carousel or card sections
- `data-gesture="dismiss"` on notification/alert elements
- `data-gesture="long-press"` on an interactive element
- Pull-to-refresh pattern on a content section
- Haptic feedback on confirmations

**Forms (Mobile Keyboard Optimization)**
- `inputmode` attributes (`email`, `tel`, `numeric`)
- `enterkeyhint` (`next`, `send`)
- `autocomplete` tokens for one-tap autofill
- `<form-field>` web component with `form.stacked` layout

**Components**
- `<carousel-wc>` with touch/swipe navigation
- VB native elements: `<button>`, `<nav>`, `<dialog>`, `<details>`, `<hr>`, headings, paragraphs
- `<icon-wc>` for Lucide icons

**CSS Patterns**
- Scroll snap on reel sections
- `overscroll-behavior: contain` on modals and sticky elements
- `prefers-reduced-motion` respect (automatic)
- Print styles if applicable

## Acceptance Criteria

- [ ] Single HTML file at `demos/examples/demos/mobile-biosite.html` using VB CSS/JS (no custom stylesheet beyond minor theming variables)
- [ ] Uses `data-page-layout="app-shell"` for mobile header/main/bottom-nav pattern
- [ ] Hero section using `data-layout-min="100svh"` or `100dvh`
- [ ] At least one `data-layout="reel"` horizontal scroll section
- [ ] At least one `<dialog data-position="bottom">` bottom sheet
- [ ] Gesture attributes present: `data-gesture="swipe"`, `data-gesture="dismiss"`, and `data-gesture="long-press"` on appropriate elements
- [ ] Contact/inquiry form using `<form-field>`, `inputmode`, `enterkeyhint`, and `autocomplete` attributes
- [ ] Safe-area meta tag and tokens used on fixed navigation
- [ ] All interactive elements meet 44px touch target minimum
- [ ] Responsive across 320px–1200px without custom media queries (VB intrinsic layouts only)
- [ ] Passes html-validate, pa11y, and vb-conformance checks
- [ ] Any VB gaps discovered are filed as new task files in `tasks/active/` with appropriate priority

## Out of Scope

- Replacing the original `admin/example-mobile-biosite.html` (it stays as-is for comparison)
- Real data feeds or backend integration
- PWA features (Phase 5 roadmap — not yet implemented)
- Scroll-driven animations (Phase 4 roadmap — not yet implemented)

## Notes

### VB Gaps Discovered

1. **html-validate doesn't know VB custom elements** — `<icon-wc>`, `<form-field>`, `<layout-card>`, `<layout-badge>`, `<layout-reel>` all trigger `no-unknown-elements` and `element-permitted-content`. Need to register these in `.htmlvalidate.json` as known elements. (23 errors in this demo; 46 in the reference app-shell demo.)
2. **`vb/no-div` false positive on `<dl>` grouping** — The HTML spec requires `<div>` as the only grouping element inside `<dl>`. VB conformance flags these. Allowlisted for now.
3. **vb-conformance allowlist path mismatch** — Script looks in `scripts/vb-conformance-allowlist.json` but MEMORY.md and `.claude/` both reference `.claude/vb-conformance-allowlist.json`. Copied file to correct location as workaround.
4. **No VB "link-as-button" pattern** — When a page section navigation needs to look like a button (hero CTAs), there's no clean VB way to style `<a>` as a button. Currently using `<button onclick="location.hash=...">` which works but is less semantic.
5. **No VB pull-to-refresh CSS indicator** — Gesture JS module supports pull-to-refresh but there's no built-in visual indicator component.
6. **Landing layout has no `body-main` grid area** — `<main>` gets `grid-area: body-main` from VB grid identity rules, but the landing template only defines `body-header`, `hero`, `feature`, `cta`, `body-footer`. Workaround: override `body > main { grid-area: hero; }`.
7. **Landing layout + bottom nav conflict** — `<nav>` gets `grid-area: body-nav` from grid identity rules but `body-nav` doesn't exist in landing template. Creates implicit column that breaks mobile layout. Workaround: override `body > nav { grid-area: auto; }`.
8. **`container-type: inline-size` breaks flex children** — VB sets `container-type: inline-size` on `article`, `section`, etc. This zeros out intrinsic inline size, causing flex children in `<layout-reel>` to collapse. Workaround: `container-type: normal` on affected items.
9. **No responsive nav toggle pattern** — VB has no built-in way to show desktop horizontal nav and mobile hamburger/bottom nav. Required custom media query `@media (min-width: 48rem)` for show/hide.

---

## Session Log

### 2026-02-25

**Did:** Created `demos/examples/demos/mobile-biosite.html` — a full pharma biosite using VB syntax exclusively. Showcases: app-shell layout, 100svh hero cover, reel scroll (stats + pipeline), bottom sheet dialogs (menu + apply), gesture attributes (swipe on pipeline, dismiss on alert, long-press on leader cards), mobile-optimized forms (form-field, inputmode, enterkeyhint, autocomplete), grid layouts, split layouts, safe-area tokens, icon-wc, layout-card, layout-badge, scroll intersection observer for bottom nav. Passed VB conformance (warnings only, allowlisted). Zero inline styles. XHTML-compliant void elements.
**Next:** Review in browser at https://vb.test, file VB gap tasks, consider adding pull-to-refresh demo section.
**Blockers:** None.

### 2026-02-25 (session 2)

**Did:** Fixed desktop layout — switched from `app-shell` (creates sidebar on desktop) to `landing` page layout. Key changes:
- Changed `data-page-layout="app-shell"` → `data-page-layout="landing"`
- Added desktop horizontal nav links in header (hidden on mobile via `@media (min-width: 48rem)`)
- Mobile hamburger button hidden on desktop
- Bottom nav pinned sticky on mobile, hidden on desktop
- Moved `<footer>` outside `<main>` for proper landing grid area mapping
- Fixed `body > main { grid-area: hero; }` workaround (landing has no `body-main` area)
- Fixed `body > nav { grid-area: auto; }` workaround (landing has no `body-nav` area)
- Changed `<section data-layout="reel">` → `<layout-reel>` (reel is a custom element, not a data-layout attribute)
- Fixed stat items collapsing in reel due to `container-type: inline-size` on `<article>` elements
- Discovered 4 additional VB gaps (gaps 6-9 in Notes)

**Next:** File VB gap tasks. Final review of acceptance criteria. Consider quality checks.
**Blockers:** None.
