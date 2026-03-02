---
id: htmlvalidate-custom-elements
project: vanilla-breeze
status: done
priority: p2
depends: []
created: 2026-02-25
updated: 2026-02-25
---

# Register VB custom elements in html-validate configuration

html-validate flags all VB custom elements (`<icon-wc>`, `<form-field>`, `<layout-card>`, `<layout-badge>`, `<layout-reel>`, `<carousel-wc>`, `<brand-mark>`, `<text-reader>`, etc.) as unknown elements. This produces dozens of false-positive errors on every VB demo page.

## Context

- Discovered in the mobile-biosite demo (23 errors) and existing app-shell demo (46 errors).
- html-validate supports custom element definitions via `.htmlvalidate.json` `elements` config or a shared elements module.
- VB already has `src/htmlvalidate/elements.cjs` which defines some elements — it may need updating to cover all custom elements.
- The errors are `no-unknown-elements` and `element-permitted-content` (e.g., `<layout-card>` not allowed as child of `<section>`).

## Acceptance Criteria

- [x] All VB custom elements registered in html-validate config
- [x] Zero `no-unknown-elements` errors on VB demo pages
- [x] `element-permitted-content` errors resolved for VB elements used in standard contexts
- [x] html-validate still catches genuinely unknown elements

## Out of Scope

- Custom html-validate rules for VB-specific validation
- Fixing non-custom-element html-validate errors

## Notes

> Check if `src/htmlvalidate/elements.cjs` is referenced in `.htmlvalidate.json` and whether it covers all current custom elements.

---

## Session Log

### 2026-03-01

All 59 custom elements were already registered in `src/htmlvalidate/elements.cjs`. The actual bug was that 5 phrasing-level elements (`icon-wc`, `layout-badge`, `loading-spinner`, `progress-ring`, `foot-note`) were missing `flow: true`. In html-validate, both flags must be explicit — phrasing doesn't imply flow. Without `flow: true`, these elements couldn't appear inside `<aside>`, `<figure>`, `<section>`, `<div>`, or other flow containers. Added `flow: true` to all 5. Result: zero `element-permitted-content` and zero `no-unknown-elements` errors across all demo pages. 294 unit tests pass.
