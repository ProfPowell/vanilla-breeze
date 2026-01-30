# Integration Guide

How to integrate Zen Garden patterns into the main Vanilla Breeze library.

## Integration Candidates

### 1. Three-Tier Token System

**Current**: Flat token lists in main library
**Proposed**: Primitives → Semantic → Component hierarchy

```css
/* Instead of flat tokens */
--btn-bg: #3b82f6;

/* Use layered tokens */
--blue-500: oklch(60% 0.2 250);           /* Primitive */
--color-primary: var(--blue-500);          /* Semantic */
--button-primary-bg: var(--color-primary); /* Component */
```

**Benefits**:
- Easier theme creation (only override semantic layer)
- Better maintainability
- Clearer naming hierarchy

### 2. Grid Identity System

**Current**: Explicit `data-component` attributes on landmarks
**Proposed**: Auto-registration based on DOM structure

```css
/* Auto-assign grid areas to semantic elements */
body > header { grid-area: body-header; }
body > nav    { grid-area: body-nav; }
body > main   { grid-area: body-main; }
```

**Benefits**:
- Cleaner HTML (no extra attributes)
- More semantic
- Matches HTML5 landmark elements

### 3. Layout Templates as Tokens

**Current**: Layout classes or complex selectors
**Proposed**: Grid templates stored as CSS custom properties

```css
:root {
  --tpl-sidebar-left:
    "body-header body-header" auto
    "body-nav    body-main"   1fr
    "body-footer body-footer" auto
    / var(--nav-width, 280px) 1fr;
}

body[data-layout="sidebar-left"] {
  grid-template: var(--tpl-sidebar-left);
}
```

**Benefits**:
- Runtime layout switching without JS
- Customizable via CSS custom properties
- Predictable responsive behavior

### 4. CSS Layer Architecture

**Current**: Specificity-based cascade
**Proposed**: `@layer` for explicit cascade control

```css
@layer reset, tokens, base, components, theme, utilities;
```

**Benefits**:
- No more specificity battles
- Predictable override behavior
- Cleaner theme authoring

### 5. `:has()` Adaptations

**Current**: Explicit container classes
**Proposed**: Content-aware layouts using `:has()`

```css
/* Auto-adjust when aside is present */
main:has(> aside) {
  display: grid;
  grid-template-columns: 1fr var(--aside-width);
}
```

**Benefits**:
- Less JavaScript needed
- Layouts adapt to content automatically
- Reduced class management

## Migration Strategy

### Phase 1: Token System (Low Risk)

1. Add primitive token layer to existing tokens
2. Create semantic mappings
3. Gradually replace direct primitive usage with semantic tokens

### Phase 2: Grid Identity (Medium Risk)

1. Add grid identity rules alongside existing system
2. Test with semantic HTML pages
3. Deprecate explicit `data-component` for landmarks

### Phase 3: Layout Templates (Medium Risk)

1. Add layout template tokens
2. Add `data-layout` attribute support
3. Document migration path from class-based layouts

### Phase 4: CSS Layers (Higher Risk)

1. Audit current cascade dependencies
2. Introduce layers incrementally
3. Update documentation for theme authors

## Compatibility Considerations

### Browser Support Requirements

These features require:
- CSS `@layer` (Baseline 2022) - All modern browsers
- CSS Nesting (Baseline 2023) - Chrome 120+, Firefox 117+, Safari 17.2+
- `:has()` (Baseline 2023) - Chrome 105+, Firefox 121+, Safari 15.4+
- `oklch()` (Baseline 2023) - All modern browsers

### Progressive Enhancement

For older browsers:
1. Provide fallback token values
2. Use feature queries for `:has()` enhancements
3. Consider PostCSS processing for CSS nesting

```css
/* Fallback for oklch() */
:root {
  --color-primary: #3b82f6;
  --color-primary: oklch(60% 0.2 250);
}

/* Feature query for :has() */
@supports selector(:has(*)) {
  main:has(> aside) {
    /* enhanced layout */
  }
}
```

## Testing Checklist

Before integration:

- [ ] Test all layouts at mobile, tablet, desktop breakpoints
- [ ] Verify theme switching works correctly
- [ ] Test dark mode in all themes
- [ ] Check container query behavior
- [ ] Verify `:has()` fallbacks work
- [ ] Test with screen readers
- [ ] Check keyboard navigation
- [ ] Validate CSS in W3C validator
