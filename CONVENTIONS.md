# Vanilla Breeze Conventions

This document establishes the naming and styling conventions for Vanilla Breeze to ensure consistency and prevent session drift.

## Core Principles

1. **Native elements get short class names** - Use element.class scoping
2. **Custom elements use data-attributes** - For configuration and state
3. **State is always data-attributes** - Never classes for dynamic state
4. **Logical properties only** - inline-size, block-size, not width, height
5. **OKLCH colors** - Modern color format throughout

## Native Element Styling

### Short Classes with Element Scoping

Native element variants use short, semantic class names. The CSS scopes them to the element using element.class selectors.

```html
<!-- Correct -->
<search class="compact header">...</search>
<progress class="success s">...</progress>
<nav class="horizontal pills">...</nav>
<table class="striped compact">...</table>
<form class="stacked">...</form>

<!-- Wrong (redundant prefixing) -->
<search class="search-compact search-header">...</search>
<progress class="progress-success progress-s">...</progress>
```

### CSS Pattern

```css
/* Native elements use element.class scoping with nesting */
search {
  display: block;

  &.compact {
    display: flex;
    gap: var(--space-2xs);
  }

  &.header {
    max-inline-size: 300px;
  }
}

progress {
  /* Base styles */

  &.xs { block-size: var(--space-3xs); }
  &.s  { block-size: var(--space-2xs); }
  &.m  { block-size: var(--space-xs); }

  &.success { /* green styling */ }
  &.warning { /* amber styling */ }
  &.error   { /* red styling */ }
}
```

## Custom Element Styling

### Data-Attributes for Configuration

Custom elements use data-attributes for all configuration. This provides a clear API and enables CSS scoping.

```html
<!-- Correct -->
<layout-card data-variant="elevated" data-padding="l">
<layout-stack data-gap="m" data-align="center">
<tabs-wc data-orientation="vertical">

<!-- Wrong -->
<layout-card class="elevated" class="padding-large">
```

### CSS Pattern

```css
/* Custom elements use data-attribute selectors */
layout-card {
  display: block;

  &[data-variant="elevated"] {
    box-shadow: var(--shadow-m);
  }

  &[data-padding="l"] {
    padding: var(--space-l);
  }
}
```

## State Management

State is **always** expressed via data-attributes, never classes.

```html
<!-- Correct -->
<button data-state="loading">
<dialog data-state="open">
<accordion-wc data-expanded>

<!-- Wrong -->
<button class="is-loading">
<dialog class="open">
```

### CSS Pattern

```css
button {
  &[data-state="loading"] {
    opacity: 0.7;
    pointer-events: none;
  }
}

dialog {
  &[data-state="open"] {
    display: block;
  }
}
```

## Helper Classes

Generic helper classes (not scoped to elements) use short names:

```css
.group {  /* Form group wrapper */ }
.actions { /* Form actions container */ }
.help {   /* Help text */ }
.error {  /* Error text */ }
```

Used within form context:
```html
<form class="stacked">
  <div class="group">
    <label>Name</label>
    <input type="text" />
    <span class="help">Enter your full name</span>
  </div>
  <div class="actions end">
    <button type="submit">Save</button>
  </div>
</form>
```

## Token Naming

Design tokens follow a consistent pattern:

```css
/* Spacing */
--space-3xs, --space-2xs, --space-xs, --space-s, --space-m, --space-l, --space-xl, --space-2xl, --space-3xl

/* Typography */
--text-xs, --text-s, --text-m, --text-l, --text-xl, --text-2xl

/* Colors */
--color-text, --color-text-muted
--color-surface, --color-surface-raised
--color-border
--color-interactive

/* Radius */
--radius-s, --radius-m, --radius-l, --radius-full

/* Border */
--border-thin, --border-medium

/* Shadows */
--shadow-s, --shadow-m, --shadow-l

/* Duration */
--duration-fast, --duration-normal

/* Easing */
--ease-default
```

## Logical Properties

Always use CSS logical properties for layout:

```css
/* Correct */
inline-size: 100%;
block-size: auto;
padding-inline: var(--space-m);
padding-block: var(--space-s);
margin-inline-start: auto;
border-block-end: 1px solid var(--color-border);

/* Wrong */
width: 100%;
height: auto;
padding-left: var(--space-m);
padding-right: var(--space-m);
margin-left: auto;
border-bottom: 1px solid var(--color-border);
```

## Color Format

Use OKLCH for all color values:

```css
/* Correct */
color: oklch(50% 0.15 250);
background: oklch(98% 0.01 250);

/* Wrong */
color: #0066cc;
background: rgb(240, 240, 240);
```

## Quick Reference

| Element Type | Configuration | State | Example |
|-------------|---------------|-------|---------|
| Native (`<nav>`, `<table>`) | Short classes | data-* | `<nav class="horizontal pills">` |
| Custom (`<layout-card>`) | data-* | data-* | `<layout-card data-variant="elevated">` |
| Any element | - | data-* | `<button data-state="loading">` |

## Invariants (Never Break These)

1. **Never** use redundant element-prefixed classes (`search-compact`)
2. **Never** use classes for dynamic state (use `data-state`, `data-loading`, etc.)
3. **Never** use physical CSS properties for layout (`left`, `right`, `top`, `bottom`)
4. **Never** skip element scoping in CSS for native element variants
5. **Always** use OKLCH for colors
6. **Always** use logical properties for layout
