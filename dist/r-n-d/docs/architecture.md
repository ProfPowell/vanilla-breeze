# Zen Garden Architecture

This document describes the architectural decisions and patterns used in the Zen Garden CSS system.

## Three-Layer Token System

The design token architecture follows a three-tier hierarchy:

```
┌─────────────────────────────────────────────────────────────┐
│                        core/tokens.css                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Primitives  │→ │  Semantic   │→ │     Component       │  │
│  │ (raw values)│  │ (contextual)│  │  (specific usage)   │  │
│  │             │  │             │  │                     │  │
│  │ --gray-500  │  │ --color-text│  │ --button-primary-bg │  │
│  │ --space-4   │  │ --gap-md    │  │ --card-padding      │  │
│  │ --radius-md │  │ --radius-   │  │ --input-radius      │  │
│  │             │  │   interactive│ │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Primitive Tokens

Raw design values without semantic meaning:

```css
:root {
  --gray-100: oklch(97% 0 0);
  --gray-500: oklch(55% 0 0);
  --space-4: 1rem;
  --radius-md: 0.5rem;
}
```

### Semantic Tokens

Contextual mappings that reference primitives:

```css
:root {
  --color-text: var(--gray-900);
  --color-text-muted: var(--gray-600);
  --color-surface: var(--gray-50);
  --gap-md: var(--space-4);
}
```

### Component Tokens

Specific usage tokens for components:

```css
:root {
  --button-primary-bg: var(--color-primary);
  --card-padding: var(--space-5);
  --input-radius: var(--radius-interactive);
}
```

## Grid Identity System

The grid identity system automatically maps semantic HTML elements to grid areas:

```
┌─────────────────────────────────────────────────────────────┐
│                       core/grid.css                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Grid Identity Layer                                  │   │
│  │   body > header { grid-area: body-header; }         │   │
│  │   body > nav    { grid-area: body-nav; }            │   │
│  │   body > main   { grid-area: body-main; }           │   │
│  │   body > aside  { grid-area: body-aside; }          │   │
│  │   body > footer { grid-area: body-footer; }         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Layout Templates (as CSS tokens)                     │   │
│  │   --tpl-stack, --tpl-sidebar-left, --tpl-holy-grail │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Layout Templates as Tokens

Grid templates are stored as CSS custom properties:

```css
:root {
  --tpl-sidebar-left:
    "body-header body-header" auto
    "body-nav    body-main"   1fr
    "body-footer body-footer" auto
    / var(--nav-width, 280px) 1fr;

  --tpl-holy-grail:
    "body-header body-header body-header" auto
    "body-nav    body-main   body-aside"  1fr
    "body-footer body-footer body-footer" auto
    / var(--nav-width, 220px) 1fr var(--aside-width, 280px);
}
```

### Data-Attribute Layout Switching

Layout changes are triggered by `data-layout` attributes:

```css
body[data-layout="sidebar-left"] {
  grid-template: var(--tpl-sidebar-left);
}

body[data-layout="holy-grail"] {
  grid-template: var(--tpl-holy-grail);
}
```

## CSS Layers

The system uses `@layer` for cascade control:

```css
@layer reset, tokens, base, components, theme, utilities;
```

| Layer | Purpose |
|-------|---------|
| `reset` | Browser normalization |
| `tokens` | Design token definitions |
| `base` | Element styles (typography, links) |
| `components` | Component styles (buttons, cards, inputs) |
| `theme` | Theme overrides |
| `utilities` | Utility classes |

## Theme Architecture

Themes work by overriding semantic and component tokens:

```css
@layer theme {
  [data-theme="swiss"] {
    --color-primary: oklch(50% 0.25 25);
    --radius-interactive: 0;
    --shadow-card: none;
    --font-heading: "Helvetica Neue", sans-serif;
  }
}
```

### Additive Theme System

Themes only override what changes — everything else cascades through:

- Base defines 50+ tokens
- Swiss theme only overrides ~30 tokens
- The rest inherit from base automatically

### Dark Mode Support

Each theme supports `data-mode="dark"`:

```css
[data-theme="swiss"][data-mode="dark"] {
  --color-surface: var(--gray-900);
  --color-text: var(--gray-100);
}
```

## Key Innovations

### 1. `:has()`-Powered Adaptations

Layout adapts to content presence:

```css
/* Auto-adjust when nav is absent */
body[data-layout="sidebar-left"]:not(:has(> nav)) {
  grid-template-columns: 1fr;
}

/* Auto-grid when aside present */
main:has(> aside) {
  display: grid;
  grid-template-columns: 1fr var(--sidebar-width);
}
```

### 2. Pure CSS State Management

Using `:checked` for interactive components without JavaScript:

```css
#layout-stack:checked ~ .page-container {
  grid-template: var(--tpl-stack);
}
```

### 3. Container Queries for Component Responsiveness

Components respond to their container, not the viewport:

```css
.card-grid {
  container-type: inline-size;
}

@container (width < 400px) {
  .card { flex-direction: column; }
}
```
