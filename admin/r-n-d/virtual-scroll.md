# Virtual Scrolling in Vanilla Breeze

Research document evaluating virtual scrolling for the VB component library.  
**Date**: 2026-04-13  
**Status**: Research / Proposal  
**Prompted by**: [How I Built a Virtual Scroll Custom Element](https://www.joshuaamaju.com/blog/how-i-built-a-virtual-scroll-custom-element) by Joshua Amaju

---

## Table of Contents

1. [What Is Virtual Scrolling](#what-is-virtual-scrolling)
2. [The Landscape](#the-landscape)
3. [The CSS-Only Alternative: content-visibility](#the-css-only-alternative-content-visibility)
4. [Accessibility Reality Check](#accessibility-reality-check)
5. [Is This a Good Fit for Vanilla Breeze?](#is-this-a-good-fit-for-vanilla-breeze)
6. [Recommendation](#recommendation)
7. [If We Build It: Architecture](#if-we-build-it-architecture)
8. [Implementation Phases](#implementation-phases)
9. [Sources](#sources)

---

## What Is Virtual Scrolling

Virtual scrolling (also called "windowing") renders only the items visible in the viewport, plus a small buffer above and below. As the user scrolls, offscreen items are removed from the DOM and new ones are added on-demand. The total scrollable height is faked with a spacer element so the scrollbar behaves naturally.

**Why it matters**: A list of 100,000 items without virtual scrolling takes ~22 seconds to DOMContentLoaded and ~128 MB of memory. With virtual scrolling, that drops to ~563 ms and ~79 MB. For lists above ~1,000 items, the difference is visible to users as jank, slow first paint, and sluggish interaction.

**Core techniques**:
- **Viewport calculation**: Determine which items are visible based on scroll position and container height
- **Spacer elements**: Padding or sentinel elements above/below the visible window to maintain correct scrollbar height
- **DOM recycling**: Reuse DOM nodes rather than create/destroy them (some implementations skip this)
- **Buffering**: Render extra items just offscreen so fast scrolling doesn't show blank space
- **Dynamic measurement**: Measure actual rendered item heights rather than requiring fixed sizes

---

## The Landscape

### The Blog Post: @valaria/virtual-scroll

Joshua Amaju's `<virtual-scroll>` custom element takes an appealing approach:
- Wraps existing markup — no structural changes required
- No fixed width/height requirements, no absolute positioning, no transforms
- `position: sticky` works as expected
- Framework-agnostic

**Current state**: v0.0.1 (released April 8, 2026), 1 GitHub star, 15 commits. This is a very early-stage project. The monorepo (`valaria`) also includes a core UI toolbelt and a VirtualFocus component.

**Key insight from the article**: Virtualization breaks CSS assumptions. Selectors like `:nth-child()` become unreliable when siblings are intentionally unmounted. This is a fundamental tension for any HTML-first framework.

### WICG `<virtual-scroller>` Proposal (Abandoned)

The Web Incubator Community Group explored a built-in `<virtual-scroller>` element. The proposal was **archived in October 2021** and is no longer being developed. The team pivoted to pursuing lower-level primitives via the [Display Locking](https://github.com/WICG/display-locking) effort, which eventually produced `content-visibility`.

**Takeaway**: The browser vendors decided that a built-in virtual scroller was too opinionated. They chose to ship primitives (`content-visibility`, `contain-intrinsic-size`) and let libraries build on top. This validates the approach of a component library providing the feature, but also signals that the platform is solving parts of the problem natively.

### TanStack Virtual

The most mature framework-agnostic virtual scrolling library. Headless (no markup or styles), supports React, Vue, Svelte, Solid, Lit, Angular, and vanilla JS/TS. ~10-15 KB with tree-shaking.

**Features**: Vertical, horizontal, and grid virtualization; fixed and variable item sizes; dynamic measurement; smooth scrolling; sticky items; window-scrolling mode.

**Relevance to VB**: TanStack Virtual's headless design means it could theoretically be wrapped by a VB web component. However, it's a dependency — and VB prefers platform-native solutions over packages.

### React/Vue/Angular Ecosystem

- **react-window** / **react-virtuoso**: Fixed and variable-size list/grid components. Tightly coupled to React's rendering model.
- **Angular CDK Virtual Scrolling**: Built into Angular's Component Dev Kit. Uses `*cdkVirtualFor` directive.
- **vue-virtual-scroller**: Vue-specific with smooth scroll support.

These are framework-specific and not directly applicable, but their API patterns and lessons learned are valuable reference material.

---

## The CSS-Only Alternative: content-visibility

`content-visibility: auto` is a CSS property that tells the browser to skip rendering offscreen elements. It's now **Baseline** as of September 2025:

| Browser | Version |
|---------|---------|
| Chrome  | 85+     |
| Edge    | 85+     |
| Firefox | 125+    |
| Safari  | 18+     |

### How It Works

When an element has `content-visibility: auto`, the browser applies layout, style, and paint containment. Offscreen elements skip rendering entirely. As they approach the viewport, the browser renders them just-in-time.

`contain-intrinsic-size` provides a placeholder size so the scrollbar doesn't jump:

```css
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px;  /* auto remembers last-rendered size */
}
```

### Performance

The web.dev article reports a **7x improvement** in initial render time (232 ms to 30 ms) for a travel blog with chunked sections. For large lists, improvements of **50% or more** in rendering cost are typical.

### What It Preserves (That JS Virtual Scroll Breaks)

| Feature | content-visibility | JS Virtual Scroll |
|---------|-------------------|-------------------|
| Find-in-page (Ctrl+F) | Works | Broken (items not in DOM) |
| Accessibility tree | Complete | Incomplete |
| `:nth-child()` selectors | Work correctly | Unreliable |
| Focus navigation (Tab) | Works | Requires manual management |
| Fragment URL navigation | Works | Requires manual management |
| SEO / crawlability | Full content present | Partial |
| `<form>` field submission | All fields present | Risk of missing fields |

### Limitations

- **Not true virtualization**: All DOM nodes exist, they're just not rendered. For 100,000+ items, DOM node creation itself is the bottleneck, and `content-visibility` doesn't help with that.
- **Forced rendering**: Any JS that queries layout (e.g., `getBoundingClientRect()`) on a hidden element forces the browser to render it, negating the benefit.
- **Safari find-in-page**: Safari doesn't always find text in `content-visibility: auto` elements consistently.

### The Threshold Question

`content-visibility` is **sufficient** when:
- Items already exist in the DOM (server-rendered or statically present)
- List size is in the hundreds to low thousands
- Find-in-page and accessibility are non-negotiable

JS virtual scrolling is **necessary** when:
- Items are generated from a data source (API, JSON)
- List size exceeds ~5,000 items
- DOM node count itself causes memory/parse-time problems
- Items are dynamically loaded (infinite scroll from API)

---

## Accessibility Reality Check

Virtual scrolling has significant accessibility implications:

### Known Problems
1. **Screen reader announcements**: When items are removed from the DOM, screen readers lose context. Users navigating by heading, landmark, or list-item may miss content that isn't mounted.
2. **Find-in-page**: Ctrl+F cannot find text in unmounted items. This is a fundamental limitation of JS virtual scrolling — there is no workaround short of mounting all items (which defeats the purpose).
3. **Focus management**: Tab order is disrupted when items are added/removed. Focused elements can be unmounted, causing focus to jump to `<body>`.
4. **`aria-setsize` / `aria-posinset`**: Required for screen readers to announce "item 47 of 10,000" but must be manually managed and kept in sync.
5. **Keyboard scrolling**: Page Up/Down, Home/End must be intercepted and handled correctly.

### Mitigations
- Use `role="feed"` with `aria-busy` during scroll updates
- Maintain `aria-setsize` and `aria-posinset` on every visible item
- Trap focus within the virtual container and manage keyboard navigation
- Provide a non-virtualized fallback (e.g., paginated view) for accessibility preference
- Consider `content-visibility` for the "accessible by default" path and reserve JS virtualization for explicit opt-in

### The Marcy Sutton Report

In 2020, Marcy Sutton documented that `content-visibility: auto` suppressed semantic content from screen readers in Chrome 85-89. **This was fixed by Chrome 90**, and the Chrome team updated web.dev documentation with accessibility guidance. As of 2026, `content-visibility` preserves the accessibility tree correctly across major browsers.

---

## Is This a Good Fit for Vanilla Breeze?

### Arguments For

1. **It's already on the roadmap**: `future-wc.md` lists `data-grid` (with explicit virtual scroll mention) and `content-feed` (infinite scroll).
2. **Existing components would benefit**: `data-table` currently uses pagination as its only strategy for large datasets. `card-list` renders everything to DOM.
3. **It's a real user need**: Dashboards, admin panels, data-heavy apps — VB's target audience will hit this wall.
4. **The web platform is ready**: `content-visibility` is Baseline. IntersectionObserver is mature. The primitives exist.

### Arguments Against

1. **VB is HTML-first**: Virtual scrolling is fundamentally a JS technique that dynamically manipulates the DOM. It violates the "works without JavaScript" principle. Content that isn't in the DOM doesn't exist for progressive enhancement.
2. **Breaks CSS assumptions**: `:nth-child()`, `:first-of-type`, adjacent sibling selectors, cascade patterns — all become unreliable when DOM children are dynamic. VB's CSS architecture (cascade layers, layout attributes) depends on predictable DOM structure.
3. **Accessibility cost is high**: Correct virtual scrolling requires careful ARIA management, focus trapping, and keyboard handling. The risk of shipping an inaccessible implementation is real.
4. **Content-visibility may be sufficient**: For VB's use cases (displaying data, not editing spreadsheets), CSS `content-visibility` may cover 90% of the performance need without any of the drawbacks.
5. **Complexity budget**: VBElement is 48 lines. A correct virtual scroll implementation is 500-1000+ lines of JavaScript. It's a different class of complexity than anything VB ships today.
6. **Pre-release timing**: VB is pre-release. Shipping a virtual scroller now means maintaining it through API churn.

### The Core Tension

VB's philosophy is progressive enhancement: HTML works, CSS enhances, JS adds interactivity. Virtual scrolling inverts this — JS is required for the feature to function at all. Without JS, either all items render (defeating the purpose) or some items are missing (breaking content integrity).

This is the same tension that made the WICG abandon their built-in `<virtual-scroller>` and pursue CSS primitives instead.

---

## Recommendation

### Adopt a Two-Tier Strategy

**Tier 1 (Now): CSS `content-visibility` utility** — Ship immediately as a CSS pattern, no JS required.

This covers the 90% case: server-rendered or statically-present lists of hundreds to low-thousands of items. It's progressive enhancement, it's accessible, it's 4 lines of CSS, and it preserves every DOM assumption VB relies on.

```css
/* Apply to list items, table rows, card-list children */
[data-virtualize] > * {
  content-visibility: auto;
  contain-intrinsic-size: auto 80px;
}
```

**Tier 2 (Later): JS virtual scroll component** — Build when `data-grid` or `content-feed` ships, as a progressive enhancement on top of existing markup.

This covers the 10% case: genuinely large datasets (5,000+ items) loaded from APIs, where DOM node count itself is the bottleneck. Ship it as an opt-in behavior, not a default, with a paginated fallback for no-JS environments.

### Why Not Build the JS Version Now?

1. `content-visibility` hasn't been tried yet in VB — it may solve the need without JS complexity
2. The component architecture (`VBElement`, light DOM, cascade layers) needs no changes for Tier 1
3. The roadmap items (`data-grid`, `content-feed`) aren't actively being built yet — there's no consumer
4. Building the JS version without a concrete consumer risks designing the wrong API

---

## If We Build It: Architecture

If/when VB builds a JS virtual scroll component, here's the recommended approach.

### Design Principles

1. **Progressive enhancement**: Server renders all items (or a paginated subset). JS upgrades to virtual scroll. No-JS gets pagination.
2. **Light DOM**: Items live in the light DOM (no Shadow DOM). The component manages visibility, not encapsulation.
3. **Existing markup**: Wrap existing `<ul>`, `<ol>`, `<table>`, or custom elements. Don't force structural changes.
4. **Composable**: Work as an enhancement on `data-table`, `card-list`, and future components — not a standalone-only component.
5. **Accessible by default**: ARIA attributes managed automatically. Keyboard navigation included. Paginated fallback available.

### Component Design

```html
<!-- Tier 1: CSS-only (works today) -->
<ul data-virtualize>
  <li>Item 1</li>
  <li>Item 2</li>
  <!-- ... all items in DOM, browser skips rendering offscreen ones -->
</ul>

<!-- Tier 2: JS-enhanced (future) -->
<virtual-scroll
  item-height="80"
  buffer="5"
  role="feed"
  aria-label="Search results"
>
  <!-- Initial server-rendered items or paginated subset -->
  <li>Item 1</li>
  <li>Item 2</li>
</virtual-scroll>
```

### Internal Architecture

```
virtual-scroll (extends VBElement)
├── ScrollController
│   ├── Viewport measurement (ResizeObserver)
│   ├── Scroll position tracking (passive scroll listener)
│   └── Visible range calculation
├── DOMManager
│   ├── Item pool / recycling
│   ├── Spacer management (top/bottom padding)
│   └── ARIA attribute synchronization
├── DataAdapter (optional)
│   ├── Static: reads children from initial DOM
│   ├── Array: renders from JS array via template
│   └── Async: fetches pages from callback/URL
└── AccessibilityManager
    ├── aria-setsize / aria-posinset
    ├── Focus management
    ├── Keyboard navigation (Page Up/Down, Home/End)
    └── aria-busy during updates
```

### Key Implementation Details

**Item sizing**: Support three modes:
- `item-height="80"` — Fixed height (fastest, simplest)
- `item-height="estimate"` — Estimate then measure (uses ResizeObserver to correct after first render)
- `item-height="auto"` — Fully dynamic (measures every item, highest overhead)

**Scroll position**: Use a passive `scroll` event listener (not IntersectionObserver — IO has timing gaps that cause flicker during fast scrolling). IO is fine for lazy-loading images but not for frame-accurate virtual scrolling.

**DOM recycling**: Reuse DOM nodes when scrolling. Don't destroy and recreate — update `textContent`, attributes, and data bindings in place. This is the single biggest performance win after virtualization itself.

**CSS integration**: The component should emit a `--virtual-scroll-item-count` custom property and manage `data-virtual-index` attributes on items so VB's CSS can style based on position without relying on `:nth-child()`.

### What NOT to Build

- **Shadow DOM**: Breaks VB's styling model
- **Custom scrollbar**: Use the native scrollbar; custom ones are an accessibility nightmare
- **Infinite scroll as default**: Always provide a "Load More" or pagination fallback
- **Horizontal virtual scroll**: Out of scope for v1 — `layout-reel` with `content-visibility` covers this

---

## Implementation Phases

### Phase 1: CSS Utility (Tier 1)

**Effort**: Small  
**Files**: `src/custom-elements/layout-attributes.css` or new utility file  

1. Add `[data-virtualize]` styles using `content-visibility: auto` and `contain-intrinsic-size`
2. Support configurable intrinsic sizes via CSS custom property: `--virtualize-size: 80px`
3. Document on the existing layout utilities page
4. Test with `data-table` and `card-list` to measure render improvement

### Phase 2: Data-Table Integration

**Effort**: Medium  
**Files**: `src/web-components/data-table/logic.js`, styles  

1. Add `data-virtualize` attribute support to `data-table`
2. When present, use `content-visibility` on `<tr>` elements instead of pagination
3. Keep pagination as the no-JS fallback
4. Measure and document performance thresholds (when to use pagination vs. `content-visibility` vs. virtual scroll)

### Phase 3: JS Virtual Scroll Component (Tier 2)

**Effort**: Large  
**Prerequisite**: Active consumer (`data-grid` or `content-feed`)  

1. Build `<virtual-scroll>` extending `VBElement`
2. Fixed-height items only in v1
3. Static data adapter (reads existing children) in v1
4. Full accessibility: ARIA, keyboard nav, focus management
5. Ship with comprehensive demo and doc page
6. Integrate with `data-grid` as proof of concept

### Phase 4: Advanced Features

**Effort**: Large  
**Prerequisite**: Phase 3 stable  

1. Variable-height item support
2. Async data adapter (fetch pages from API)
3. DOM recycling for maximum performance
4. Grid mode (2D virtualization)
5. Integration with `content-feed` for infinite scroll pattern

---

## Sources

- [How I Built a Virtual Scroll Custom Element](https://www.joshuaamaju.com/blog/how-i-built-a-virtual-scroll-custom-element) — Joshua Amaju (Valaria)
- [WICG Virtual Scroller Proposal](https://github.com/WICG/virtual-scroller) — Archived, pivoted to Display Locking primitives
- [content-visibility: the new CSS property that boosts your rendering performance](https://web.dev/articles/content-visibility) — web.dev
- [Content-Visibility and Accessible Semantics](https://marcysutton.com/content-visibility-accessible-semantics) — Marcy Sutton (a11y analysis)
- [TanStack Virtual](https://tanstack.com/virtual/latest/docs/introduction) — Headless virtual scrolling library
- [Implementing Virtual Scrolling for 100k+ Items](https://medium.com/@sohail_saifi/implementing-virtual-scrolling-for-lists-with-100k-items-65867980c917) — Performance benchmarks
- [Virtual Scrolling Core Principles (React)](https://blog.logrocket.com/virtual-scrolling-core-principles-and-basic-implementation-in-react/) — Implementation patterns
- [Virtualize Large Lists with Angular CDK](https://web.dev/articles/virtualize-lists-with-angular-cdk) — Angular approach
- [WICG Native Virtual Scrolling Proposal](https://github.com/WICG/webcomponents/issues/791) — Web Components issue discussion
- [Introducing content-visibility: auto — A Hidden Performance Gem](https://cekrem.github.io/posts/content-visibility-auto-performance/) — Implementation guide
- [content-visibility Without Jittery Scrollbars](https://infrequently.org/2020/12/content-visibility-scroll-fix/) — Alex Russell on scrollbar fixes
- [catamphetamine/virtual-scroller](https://github.com/catamphetamine/virtual-scroller) — Framework-agnostic virtual scroll library
