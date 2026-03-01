---
id: htmlvalidate-custom-elements
project: vanilla-breeze
status: backlog
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

- [ ] All VB custom elements registered in html-validate config
- [ ] Zero `no-unknown-elements` errors on VB demo pages
- [ ] `element-permitted-content` errors resolved for VB elements used in standard contexts
- [ ] html-validate still catches genuinely unknown elements

## Out of Scope

- Custom html-validate rules for VB-specific validation
- Fixing non-custom-element html-validate errors

## Notes

> Check if `src/htmlvalidate/elements.cjs` is referenced in `.htmlvalidate.json` and whether it covers all current custom elements.

---

## Session Log

_No sessions yet._
