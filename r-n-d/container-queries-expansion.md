# Container Queries Expansion

## Overview

Expand `container-type: inline-size` beyond cards to sectioning elements, enabling component-level responsive design throughout the framework.

## Current State

Container queries are currently applied to:
- `semantic-card` (added 2026-01-25)
- `layout-card` (added 2026-01-25)
- `table-wc` (existing)
- `layout-attributes.css` line 1038 (for card lists)

## Proposed Changes

### Phase 1: Sectioning Elements

Add `container-type: inline-size` to semantic sectioning elements:

```css
/* In src/native-elements or a new src/utils/containers.css */
main,
article,
section,
aside {
  container-type: inline-size;
}
```

**Files to modify:**
- Option A: Create `src/utils/containers.css` and import in `src/utils/index.css`
- Option B: Add to `src/base/reset.css` (affects all pages)

**Recommendation:** Option A - keeps it opt-in via utils layer.

### Phase 2: Container Query Utilities

Add utility classes for elements that need container context:

```css
/* src/utils/containers.css */

/* Explicit container establishment */
[data-container] {
  container-type: inline-size;
}

[data-container="size"] {
  container-type: size;
}

/* Named containers for targeted queries */
[data-container-name] {
  container-name: attr(data-container-name);
}
```

### Phase 3: Component Container Queries

Add container-aware variants to existing components where beneficial:

#### Stack Layout
```css
/* When stack is in a narrow container, reduce gap */
[data-layout="stack"] {
  container-type: inline-size;

  @container (max-width: 300px) {
    --_gap: var(--size-s);
  }
}
```

#### Cluster Layout
```css
/* Switch from row to column in narrow containers */
[data-layout="cluster"] {
  @container (max-width: 250px) {
    flex-direction: column;
    align-items: stretch;
  }
}
```

#### Navigation
```css
/* Compact nav items in narrow sidebar */
nav {
  container-type: inline-size;

  @container (max-width: 200px) {
    /* Hide text, show icons only */
    & [data-nav-text] {
      display: none;
    }
  }
}
```

## Testing Checklist

- [ ] Verify no layout shifts when container-type is added
- [ ] Test nested containers (card inside article inside main)
- [ ] Confirm container queries fire at correct breakpoints
- [ ] Check performance with many containers on page
- [ ] Test with existing demos (kitchen-sink, table-responsive)

## Browser Support

Container queries are Baseline 2023 - safe to use without fallbacks.

| Browser | Version |
|---------|---------|
| Chrome | 105+ |
| Firefox | 110+ |
| Safari | 16+ |
| Edge | 105+ |

## Risks

1. **Performance** - Many containers on a page could impact layout calculations
2. **Specificity** - Container queries don't increase specificity, but nested contexts can be confusing
3. **Debugging** - Container query breakpoints aren't as visible in DevTools as media queries

## Success Criteria

- Components adapt to their container width, not viewport
- Existing demos continue to work
- No performance regression on kitchen-sink page
