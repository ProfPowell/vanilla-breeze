# View Transitions Roadmap

> Same-document view transitions as progressive enhancement for VB components.

## Status: R&D

VB currently uses view transitions only for **cross-document** page navigation (`@view-transition { navigation: auto; }`). Same-document view transitions (`document.startViewTransition()`) are not yet used by any component.

## Opportunity

The same transition effects VB uses for page-to-page navigation (slide, fade, scale) could apply to **in-page content swaps**. Browser-composited view transitions are smoother (off-main-thread) and provide automatic crossfade with snap-to-new-state semantics.

## Component Candidates

### content-swap (highest value)

Current approach: CSS transitions on `data-face` children (flip, fade, slide, scale).

View transition enhancement:
```js
// In toggle(), wrap state change in startViewTransition
if ('startViewTransition' in document) {
  document.startViewTransition(() => {
    el.toggleAttribute('data-swapped');
    syncState(el, front, back);
  });
} else {
  // Fallback to CSS transitions (current behavior)
}
```

Benefits:
- Browser handles crossfade automatically
- Named view transitions enable morphing elements between faces
- `view-transition-name` on shared elements (e.g., headings) creates smooth morph effects

Considerations:
- Only Chrome 111+ supports same-document VT (Firefox/Safari in progress)
- CSS transition fallback must remain the baseline
- `data-transition` attribute still controls the *type* — VT just handles the *execution*

### tabs-wc (panel swap)

Panel transitions when switching tabs. Currently instant (no animation).

```js
// In tab change handler
document.startViewTransition(() => {
  oldPanel.hidden = true;
  newPanel.hidden = false;
});
```

### accordion-wc (expand/collapse)

The `<details>` element now supports `::details-content` pseudo-element for CSS transitions in Chrome 131+. VT could provide a cross-browser alternative for the expand/collapse animation.

### Carousel transitions

Slide changes could use view transitions for smoother crossfade or morphing between slides.

## Implementation Pattern

A shared utility for components that want optional VT enhancement:

```js
function withViewTransition(callback, fallback) {
  if ('startViewTransition' in document) {
    document.startViewTransition(callback);
  } else {
    callback();
    fallback?.();
  }
}
```

## Browser Support (Feb 2026)

| Browser | Same-document VT | Cross-document VT |
|---------|-------------------|-------------------|
| Chrome  | 111+ (Mar 2023)   | 126+ (Jun 2024)   |
| Edge    | 111+ (Mar 2023)   | 126+ (Jun 2024)   |
| Safari  | 18+ (Sep 2024)    | 18+ (Sep 2024)    |
| Firefox | 131+ (Nov 2024)   | Nightly            |

Support is now broad enough to use as progressive enhancement.

## Decision

- **Phase 1** (now): CSS transitions as baseline for `content-swap` — works everywhere
- **Phase 2** (next): Add optional VT enhancement to `content-swap` behind feature detection
- **Phase 3** (later): Extend VT pattern to tabs, accordion, carousel
- **Not planned**: VT as the *only* transition mechanism — CSS fallback is permanent
