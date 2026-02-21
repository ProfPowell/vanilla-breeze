# Container Queries Expansion

## Overview

Expand container query capabilities in VB's layout system. Sectioning elements already have `container-type: inline-size` (layout-attributes.css). This work adds named containers and an explicit opt-in attribute.

## Current State (as of 2026-02)

Container queries are used in:
- **Global**: `main, article, section, aside` have `container-type: inline-size` (layout-attributes.css)
- **5 existing `@container` rules**: media stacking (<25rem), grid collapse (<400px), switcher stacking (<30rem), semantic-card compact (<300px), table-wc card mode (<500px)
- **Named containers on page layout regions** (see Phase 1 below)
- **`data-container` attribute** for explicit opt-in (see Phase 2 below)

## Completed

### Phase 1: Named Containers on Page Layout Regions ✅

Added `container-name` to page layout children for targeted queries:

```css
/* data-page-layout children */
[data-page-layout] > main  { container-name: region-main; }
[data-page-layout] > nav   { container-name: region-nav; }
[data-page-layout] > aside { container-name: region-aside; }

/* Legacy data-layout="body-*" children (with demo class parity) */
[data-layout^="body-"] > main  { container-name: region-main; }
[data-layout^="body-"] > nav   { container-name: region-nav; }
[data-layout^="body-"] > aside { container-name: region-aside; }

/* Main-level templates */
main[data-layout="sidebar-left"] > nav     { container-name: region-main-nav; }
main[data-layout="sidebar-left"] > article { container-name: region-main-content; }
main[data-layout="sidebar-right"] > article { container-name: region-main-content; }
main[data-layout="sidebar-right"] > aside  { container-name: region-main-aside; }
```

This enables queries like `@container region-main (width < 40rem) { ... }`.

### Phase 2: `data-container` Attribute ✅

Explicit opt-in containment for non-semantic elements:

```css
[data-container] { container-type: inline-size; }
[data-container="card"]  { container-name: card; }
[data-container="panel"] { container-name: panel; }
[data-container="media"] { container-name: media; }
```

**Note:** The original proposal suggested `attr()` for dynamic `container-name` from HTML. This does **not work** in browsers — `attr()` only resolves to strings in `content`, not in `container-name`. The preset approach is the correct solution.

## Skipped (with rationale)

### Switcher Refactor to Container Queries — SKIPPED

The switcher already has a dual mechanism:
- **Primary**: Flexbox `calc((threshold - 100%) * 999)` — the canonical Every Layout pattern, smooth and proportional
- **Fallback**: `@container (width < 30rem)` — coarse CQ override

Replacing the flexbox trick with CQ would be a **regression**: the trick provides smooth, individual-item wrapping; CQ would create abrupt all-or-nothing switching.

### Fluid Gap with `cqw` Units — SKIPPED

VB's token-based gap system (discrete steps `3xs`–`3xl`) is intentionally predictable. Adding fluid `clamp(var(--size-s), 2cqw, var(--size-xl))` undermines the design token philosophy — designers can't predict what `2cqw` resolves to.

### Style Queries for Variant Propagation — SKIPPED (revisit later)

`@container style(--card-layout: featured)` is Chrome-only (no Firefox). VB handles variants via data attributes which work everywhere. Revisit when Firefox ships support.

### Phase 3 Component Container Queries — SKIPPED

The original proposals for stack/cluster/nav container query adaptations were speculative. The existing 5 container queries cover the necessary breakpoints. Adding more would increase CSS size without clear user demand.

## Browser Support

Container queries are Baseline 2023 — safe to use without fallbacks.

| Browser | Version |
|---------|---------|
| Chrome  | 105+    |
| Firefox | 110+    |
| Safari  | 16+     |
| Edge    | 105+    |

## Testing Checklist

- [x] No layout shifts from adding `container-name` (additive, doesn't change sizing)
- [x] Existing container queries (media stacking, grid collapse, switcher) still work
- [x] `@container region-main (width < 40rem)` fires on main area
- [x] `data-container` on a `<div>` establishes inline-size containment
- [ ] Verify no performance regression on kitchen-sink page
