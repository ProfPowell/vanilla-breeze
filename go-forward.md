# Vanilla Breeze: Go-Forward Assessment

## Current State Summary

### What's Been Built

**Phase 4 Complete** - Native element coverage has been implemented:
- **Tokens**: spacing, typography, colors, sizing, borders, motion (7 files)
- **Native Elements**: ~28 styled (button, input, details, dialog, table, headings, paragraph, anchor, code, blockquote, lists, hr, nav, image, video, iframe, canvas, svg, form, progress, meter, output, datalist, article, aside, section, header, footer, main, address, hgroup, search, figure, menu, inline-semantics)
- **Custom Elements**: 7 layout primitives (x-stack, x-cluster, x-grid, x-card, x-prose, x-center, x-sidebar)
- **Web Components**: 2 interactive (x-tabs, x-footnotes)

### What's Working Well

1. **Layer architecture** - Clean cascade control with `@layer tokens, reset, native-elements, custom-elements, web-components, partials, layouts, utils`
2. **Custom element patterns** - Elegant use of data-attributes: `<x-card data-variant="elevated" data-padding="l">`
3. **Token system** - Consistent design tokens with logical properties
4. **CSS nesting** - Modern, readable component styles

---

## Critical Issue: Naming Inconsistency

### The Problem

The project has **two conflicting variant patterns**:

**Custom Elements (Good)**:
```html
<x-card data-variant="elevated">   <!-- Clean, self-documenting -->
<x-stack data-gap="l">             <!-- Attribute describes purpose -->
<x-grid data-min="15rem">          <!-- No redundancy -->
```

**Native Elements (Problematic)**:
```html
<search class="search-compact">    <!-- Redundant! -->
<progress class="progress-success"> <!-- Element name repeated -->
<button class="secondary">         <!-- Better, but inconsistent mechanism -->
```

### Why This Matters

1. **Defeats the purpose** - Vanilla Breeze aims for simplicity; `search-compact` on `<search>` is noise
2. **Inconsistent mental model** - Custom elements use data-*, native elements use classes
3. **Longer markup** - More characters for no benefit
4. **Harder to maintain** - Two patterns to learn and remember

---

## Proposed Solution: Unified Variant Strategy

### Principle: Short Classes + Element Scoping

For native element variants, use **short class names** scoped by element selectors:

**Before** (redundant):
```html
<search class="search-compact">
<progress class="progress-success">
```

**After** (clean):
```html
<search class="compact">
<progress class="success">
```

**CSS using element.class scoping**:
```css
search.compact {
  display: flex;
  gap: var(--space-2xs);
  /* ... */
}

progress.success::-webkit-progress-value {
  background: var(--color-success);
}
```

### When to Use Data Attributes vs Classes

| Use Case | Mechanism | Example |
|----------|-----------|---------|
| **Visual variants** (size, style) | Short class | `<button class="secondary small">` |
| **Semantic state** (loading, error) | Data attribute | `<button data-state="loading">` |
| **Configuration** (columns, gap) | Data attribute | `<x-grid data-min="15rem">` |
| **Boolean flags** | Data presence | `<details data-group>` |

### The Rule

- **Classes** for visual appearance variants (what it looks like)
- **Data attributes** for state and configuration (what it's doing)

---

## Specific Refactoring Required

### Native Elements to Fix

| Element | Current | Proposed |
|---------|---------|----------|
| `<search>` | `.search-compact`, `.search-inline`, `.search-icon` | `.compact`, `.inline`, `.with-icon` |
| `<progress>` | `.progress-xs`, `.progress-success` | `.xs`, `.s`, `.m`, `.l` + `.success`, `.warning`, `.error` |
| `<button>` | `.secondary`, `.ghost`, `.small` | Already good! Keep as-is |
| `<figure>` | `.figure-full`, `.figure-float-start` | `.full`, `.float-start`, `.float-end` |
| `<aside>` | `.aside-sidebar`, `.aside-callout` | `.sidebar`, `.callout`, `.note` |

### CSS Pattern

Use CSS nesting with element scoping:

```css
/* search/styles.css */
search {
  display: block;

  &.compact {
    display: flex;
    gap: var(--space-2xs);
    /* ... */
  }

  &.inline {
    display: flex;
    gap: var(--space-xs);
  }

  &.with-icon {
    position: relative;
    /* ... */
  }
}
```

---

## Broader Architecture Decisions

### 1. Token Alignment with Open Props

The plan mentions Open Props alignment (Phase 7). **Recommendation: Defer this.**

Current tokens work well. Renaming everything introduces churn without clear benefit. If/when Open Props compatibility matters, it can be added as an optional compatibility layer.

### 2. Wireframe Mode

Phase 8 proposes a wireframe mode. This is a nice-to-have but not foundational. **Recommendation: Low priority.**

### 3. Interactive Web Components

Phase 6 proposes x-dialog, x-accordion, x-toast, x-tooltip, x-dropdown, x-carousel, x-lightbox.

**Recommendation: Be conservative.** Each component adds maintenance burden. Prioritize:
1. x-dialog (modal with focus trap) - Most commonly needed
2. x-accordion - Common FAQ/details pattern
3. x-toast - Feedback system

Skip carousel/lightbox initially - these are complex and often better served by libraries.

### 4. Partials and Layouts

Current architecture has partials (site-header, site-footer, site-nav) and layouts. These are in plan.md but not yet implemented.

**Recommendation: Implement sparingly.** The core value is the CSS layer, not pre-built HTML structures.

---

## Skills Alignment

The loaded skills provide strong guidance. Key skills to leverage:

| Skill | How It Informs Vanilla Breeze |
|-------|------------------------------|
| **css-author** | Layer architecture, OKLCH colors, logical properties |
| **data-attributes** | State/config via data-*, classes for variants |
| **custom-elements** | CSS-only elements, x-* ad-hoc pattern |
| **xhtml-author** | Valid, semantic HTML as foundation |
| **progressive-enhancement** | Works without JS first |

### Skills Confirm Our Approach

From **data-attributes** skill:
> "Data attributes replace classes for **dynamic concerns**"
> "Use classes sparingly for **multi-variant components**"

This supports: classes for visual variants, data-* for state.

From **css-author** skill:
> "Target elements, not class soup"
> "Custom elements provide semantic styling targets without classes"

This supports: element.class selectors, not `.element-variant` patterns.

---

## Recommended Priority Order

### Immediate (Before Continuing Development)

1. **Fix naming redundancy** - Refactor `.search-compact` -> `.compact`, etc.
2. **Document the convention** - Add CONVENTIONS.md explaining the variant strategy
3. **Audit existing CSS** - Ensure all native elements follow the pattern

### Short-term (Next Development Cycle)

4. **Complete x-dialog** - Most-needed interactive component
5. **Add missing layout primitives** - x-cover, x-frame, x-reel (from Every Layout)
6. **Create demo page** - Showcase all components with examples

### Medium-term (Future Cycles)

7. **Documentation site** - Interactive examples for all components
8. **Integration demos** - Simple site, Astro integration
9. **Additional web components** - x-accordion, x-toast as needed

### Low Priority / Defer

- Open Props token renaming (adds complexity, little value)
- Wireframe mode (nice-to-have)
- Carousel/lightbox components (use libraries instead)

---

## Decisions Made (Session 2026-01-08)

1. **Variant mechanism**: Short classes with element scoping (**confirmed**)

2. **Scope of library**: Comprehensive - build all web components (**user chose more ambitious**)

3. **Token system**: Align with Open Props naming (**user chose more ambitious**)

4. **Partials/Layouts**: Both CSS core + patterns as reference (**confirmed**)

---

## Session Drift Prevention

To prevent session drift, establish these invariants:

### Always True
- Native element variants use **short classes** (`.compact`, not `.search-compact`)
- Custom element configuration uses **data-attributes** (`data-gap`, `data-variant`)
- State is **always data-attributes** (`data-state`, `data-loading`, `data-open`)
- CSS uses **element scoping** (`search.compact`, not `.search-compact`)
- All measurements use **logical properties** (`inline-size`, not `width`)
- All colors use **OKLCH** format

### Never Do
- Don't add redundant element-prefixed class names
- Don't use classes for dynamic state
- Don't add physical properties (left, right, top, bottom) except for transforms/shadows
- Don't add components that need heavy JS when CSS-only solutions exist
- Don't rename tokens without strong justification

---

## Summary

Vanilla Breeze has a solid foundation. The main issue is naming inconsistency between native and custom element variants. The fix is straightforward:

1. **Refactor** native element classes to short names (`search.compact`, not `.search-compact`)
2. **Document** the convention clearly
3. **Continue** building on the existing architecture

The skills loaded provide excellent guidance - particularly css-author and data-attributes. Following their patterns will keep the library simple, elegant, and maintainable.
