# Vanilla Breeze: Project Plan

A layered HTML component system extending HTML's native model.

---

## Current State (January 2026)

### What's Built

| Category | Count | Elements |
|----------|-------|----------|
| **Tokens** | 7 files | spacing, typography, colors, sizing, borders, motion |
| **Native Elements** | ~36 | All major HTML elements styled with variants |
| **Custom Elements** | 12 | layout-stack, layout-cluster, layout-grid, layout-card, layout-center, layout-sidebar, layout-cover, layout-switcher, layout-imposter, x-prose, x-frame, x-reel |
| **Web Components** | 6 | x-tabs, x-footnotes, x-accordion, x-dialog, x-tooltip, x-toast |
| **Documentation** | Complete | /docs/ site with element pages, tokens, kitchen sink |

### Architecture

**CSS Layer Order:**
```css
@layer tokens, reset, native-elements, custom-elements, web-components, utils;
```

**Page Styling Pattern:**
```html
<html lang="en" data-page="docs">
```
Uses `[data-page="docs"] > body > element` selectors instead of wrapper divs and classes.

---

## Conventions

### Variant Strategy

**Native elements** use short classes with element scoping:
```html
<button class="secondary small">Cancel</button>
<progress class="success">Loading...</progress>
```

```css
button.secondary { /* styles */ }
progress.success::-webkit-progress-value { background: var(--color-success); }
```

**Custom elements** use data-attributes for configuration:
```html
<layout-stack data-gap="l">
<layout-grid data-min="15rem" data-gap="m">
<layout-card data-variant="elevated" data-padding="l">
```

### Naming Rules

| Use Case | Mechanism | Example |
|----------|-----------|---------|
| Visual variants | Short class | `<button class="secondary">` |
| Semantic state | Data attribute | `<button data-state="loading">` |
| Configuration | Data attribute | `<layout-grid data-min="15rem">` |
| Boolean flags | Data presence | `<details data-group>` |

### Invariants (Always True)

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

---

## Remaining Roadmap

### Phase 5: Extended Layout Components

Add remaining Every Layout patterns:

| Component | Purpose | Status |
|-----------|---------|--------|
| `layout-cover` | Hero/cover layout with centered content | Done |
| `x-frame` | Aspect ratio container | Done |
| `x-reel` | Horizontal scrolling container | Done |
| `layout-switcher` | Flex direction toggle at breakpoint | Done |
| `layout-imposter` | Fixed/absolute positioning helper | Done |

### Phase 6: Interactive Web Components

| Component | Purpose | Status |
|-----------|---------|--------|
| `x-tabs` | Tab panels | Done |
| `x-footnotes` | Footnote references | Done |
| `x-accordion` | Collapsible panels | Done |
| `x-dialog` | Modal with focus trap | Done |
| `x-toast` | Notification system | Done |
| `x-tooltip` | Contextual hints | Done |
| `x-dropdown` | Accessible menus | Not started |

### Phase 7: Token Alignment (Optional)

Align tokens with Open Props naming if desired:
- `--space-*` → `--size-*`
- Numbered scale instead of t-shirt sizes

### Phase 8: Wireframe Mode

CSS layer that transforms components into sketch/wireframe style for prototyping.

### Phase 9: Integration Demos

- Simple static site demo
- SPA application demo

---

## Token Reference

### Spacing
```css
--size-3xs: 0.125rem;
--size-2xs: 0.25rem;
--size-xs: 0.5rem;
--size-s: 0.75rem;
--size-m: 1rem;
--size-l: 1.5rem;
--size-xl: 2rem;
--size-2xl: 3rem;
--size-3xl: 4rem;
```

### Typography
```css
--font-sans: system-ui, -apple-system, sans-serif;
--font-serif: Charter, "Bitstream Charter", serif;
--font-mono: ui-monospace, "Cascadia Code", monospace;

--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-md: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;
--font-size-2xl: 1.5rem;
--font-size-3xl: 1.875rem;
--font-size-4xl: 2.25rem;
```

### Content Widths
```css
--content-narrow: 40rem;
--content-normal: 60rem;
--content-wide: 80rem;
```

---

## Success Criteria

- [ ] All HTML elements have baseline styling
- [ ] 10+ layout components available (CSS-only)
- [ ] 6+ interactive web components
- [x] Documentation with live examples
- [ ] Bundle size < 20KB CSS (gzipped)
- [x] Zero-JS core functionality preserved
- [ ] WCAG 2.1 AA compliance throughout
