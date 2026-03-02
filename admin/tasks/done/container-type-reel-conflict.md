---
id: container-type-reel-conflict
project: vanilla-breeze
status: done
priority: p2
depends: []
created: 2026-02-25
updated: 2026-02-25
---

# Fix `container-type: inline-size` zeroing out flex children in reels

VB sets `container-type: inline-size` on `main`, `article`, `section`, and `aside` elements. When these elements are flex children inside `<layout-reel>`, their intrinsic inline size becomes 0 due to size containment, causing them to collapse.

## Context

- Discovered in the mobile-biosite demo. `<article class="stat-item">` inside `<layout-reel>` collapsed to ~49px width (minimum content width only).
- `container-type: inline-size` establishes inline-size containment, which makes the element's intrinsic inline size 0. In a flex context with `flex-shrink: 0` and `flex-basis: auto`, the auto basis resolves to 0.
- This is the same root cause as the float + container-type conflict already documented in MEMORY.md.
- Current workaround: per-element `container-type: normal` override.
- Affects any semantic element (`<article>`, `<section>`, `<aside>`) used as a direct child of `<layout-reel>`.

## Acceptance Criteria

- [ ] `<article>`, `<section>`, `<aside>` elements inside `<layout-reel>` size to their content without per-page overrides
- [ ] Container queries still work on these elements when NOT inside a reel
- [ ] Existing reel demos render correctly
- [ ] Float shrink-to-fit (documented MEMORY.md conflict) is also addressed if feasible

## Out of Scope

- Changing the reel from a custom element to a data-layout attribute
- Removing container-type from all elements globally

## Notes

> Possible approach: `layout-reel > article, layout-reel > section, layout-reel > aside { container-type: normal; }` in the layout-reel styles.

---

## Session Log

### 2026-03-01

Added `container-type: normal` override for `main, article, section, aside` as direct children of `layout-reel` in `src/custom-elements/layout-reel/styles.css`. This undoes the `container-type: inline-size` from `layout-attributes.css` that zeroes out intrinsic inline size in flex context. Follows existing pattern from `aside.float`/`aside.sidenote` overrides. All 294 tests pass, CDN build succeeds.
