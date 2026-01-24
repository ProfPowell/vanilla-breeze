# Browser Support

This document details the CSS features used in Zen Garden and their browser compatibility.

## Minimum Browser Requirements

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 120+ | Full support |
| Firefox | 121+ | Full support |
| Safari | 17+ | Full support |
| Edge | 120+ | Chromium-based, matches Chrome |

## Feature Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Baseline |
|---------|--------|---------|--------|----------|
| `@layer` | 99+ | 97+ | 15.4+ | 2022 |
| CSS Nesting | 120+ | 117+ | 17.2+ | 2023 |
| `:has()` | 105+ | 121+ | 15.4+ | 2023 |
| `oklch()` | 111+ | 113+ | 15.4+ | 2023 |
| `light-dark()` | 123+ | 120+ | 17.5+ | 2024 |
| `@property` | 85+ | 128+ | 15.4+ | 2024 |
| Container Queries | 105+ | 110+ | 16+ | 2023 |
| `100dvh` | 108+ | 101+ | 15.4+ | 2022 |
| `text-wrap: balance` | 114+ | 121+ | 17.5+ | 2023 |
| Subgrid | 117+ | 71+ | 16+ | 2023 |
| Scroll-Driven Animations | 115+ | - | - | Partial |
| View Transitions API | 111+ | - | 18+ | Partial |

## Feature Details

### CSS Layers (`@layer`)

**Status**: Widely supported (Baseline 2022)

```css
@layer reset, tokens, base, components, theme;
```

All modern browsers support CSS layers. No fallback needed for target browsers.

### CSS Nesting

**Status**: Widely supported (Baseline 2023)

```css
.card {
  padding: 1rem;

  & h2 {
    margin: 0;
  }
}
```

Native nesting is supported in all target browsers. PostCSS nesting can be used for older browser support if needed.

### `:has()` Selector

**Status**: Widely supported (Baseline 2023)

```css
main:has(> aside) {
  display: grid;
}
```

Firefox 121+ (released Dec 2023) was the last major browser to add support.

### `oklch()` Color Function

**Status**: Widely supported (Baseline 2023)

```css
--color-primary: oklch(60% 0.2 250);
```

All modern browsers support `oklch()`. Provides perceptually uniform color manipulation.

### `light-dark()` Function

**Status**: Newer (Baseline 2024)

```css
--color-text: light-dark(black, white);
```

Requires `color-scheme` to be set. Fallback:

```css
/* Fallback for older browsers */
--color-text: black;
--color-text: light-dark(black, white);
```

### Container Queries

**Status**: Widely supported (Baseline 2023)

```css
.card-grid {
  container-type: inline-size;
}

@container (width < 400px) {
  .card { flex-direction: column; }
}
```

### Dynamic Viewport Units (`dvh`, `svh`, `lvh`)

**Status**: Widely supported (Baseline 2022)

```css
min-height: 100dvh;
```

Provides proper mobile viewport handling.

### Scroll-Driven Animations

**Status**: Partial support (Chrome/Edge only)

```css
animation-timeline: view();
animation-range: entry 0% cover 40%;
```

Currently only Chrome 115+ and Edge 115+. Firefox has behind a flag. Safari implementing.

**Fallback**: Animations work without scroll-driving; they just play immediately.

### View Transitions API

**Status**: Partial support

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}
```

Chrome 111+ and Safari 18+. Firefox not yet implemented.

**Fallback**: Changes happen instantly without transitions.

## Progressive Enhancement Strategy

The Zen Garden demos use progressive enhancement:

1. **Core functionality works everywhere** - Layouts, themes, and basic interactions work in all modern browsers

2. **Enhanced features are additive** - Scroll-driven animations, view transitions add polish but aren't required

3. **Feature queries for safety**:

```css
@supports (animation-timeline: view()) {
  .scroll-animated {
    animation: fade-in linear;
    animation-timeline: view();
  }
}
```

## Reduced Motion Support

All animations respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Known Issues

### Firefox

- Scroll-driven animations not yet supported (behind flag)
- View Transitions API not yet implemented

### Safari

- Some `@property` animations may have different timing
- View Transitions API requires Safari 18+

### Mobile Browsers

- Container queries work but may impact performance on older devices
- Test `100dvh` on iOS Safari for address bar behavior

## Testing Recommendations

1. **Primary testing**: Chrome 120+, Firefox 121+, Safari 17+
2. **Mobile testing**: iOS Safari 17+, Chrome Android
3. **Feature testing**: Manually verify scroll-driven animations and view transitions degrade gracefully
