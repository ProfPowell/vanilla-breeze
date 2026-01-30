# Zen Garden: CSS Named Grid Areas R&D

A modernized CSS Zen Garden exploration using named grid areas, CSS layers, and a three-tier design token architecture. This R&D effort demonstrates how semantic HTML can auto-register into CSS grid layouts without classes.

## Quick Start

```bash
# Start a local server
python3 -m http.server 8000

# Open the showcase
open http://localhost:8000/showcase/

# Browse all examples
open http://localhost:8000/examples/
```

## Directory Structure

```
zen-garden/
├── README.md                    # This file
│
├── core/                        # CORE CSS (integration candidates)
│   ├── tokens.css               # Design tokens (primitives → semantic → component)
│   ├── grid.css                 # Grid identity system
│   └── base.css                 # Base component styles
│
├── themes/                      # THEME LAYER (swappable)
│   ├── swiss.css                # Swiss minimalist
│   ├── organic.css              # Organic/nature
│   ├── brutalist.css            # Brutalist
│   └── cyber.css                # Neon cyber
│
├── showcase/                    # ORIGINAL ZEN GARDEN DEMO
│   └── index.html               # The CSS Zen Garden-style showcase
│
├── examples/                    # DEMOS (organized by complexity)
│   ├── pure-css/                # No JavaScript required
│   │   ├── layout-switcher.html
│   │   ├── tabs-accordion.html
│   │   ├── responsive-grid.html
│   │   └── landing-page.html
│   ├── minimal-js/              # Data-attribute flipping only
│   │   ├── dashboard.html
│   │   └── theme-builder.html
│   ├── interactive/             # Full JavaScript demos
│   │   ├── component-lab.html
│   │   └── animation-motion.html
│   └── index.html               # Demo index/navigation
│
└── docs/                        # EVALUATION DOCUMENTATION
    ├── architecture.md          # Token layers, grid identity, CSS layers
    ├── integration-guide.md     # How to integrate into main library
    └── browser-support.md       # Compatibility notes
```

## Core Concept

**Grid Identity System**: Semantic HTML elements (`header`, `nav`, `main`, `aside`, `footer`) automatically receive grid-area names based on their DOM position. Layout switching happens via `data-layout` attributes on the body — no class changes required on children.

```html
<!-- Elements auto-register to grid areas -->
<body data-layout="sidebar-left" data-theme="swiss">
  <header>...</header>  <!-- grid-area: body-header -->
  <nav>...</nav>        <!-- grid-area: body-nav -->
  <main>...</main>      <!-- grid-area: body-main -->
  <footer>...</footer>  <!-- grid-area: body-footer -->
</body>
```

## Usage

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="stylesheet" href="core/tokens.css">
  <link rel="stylesheet" href="core/grid.css">
  <link rel="stylesheet" href="core/base.css">
  <link rel="stylesheet" href="themes/swiss.css">
</head>
<body data-layout="sidebar-left" data-theme="swiss">
  <header>...</header>
  <nav>...</nav>
  <main>...</main>
  <footer>...</footer>
</body>
</html>
```

## Available Layouts

Switch via `data-layout` on `<body>`:

| Layout | Description |
|--------|-------------|
| `stack` | Mobile-first vertical stack |
| `sidebar-left` | Navigation on left, content right |
| `sidebar-right` | Content left, sidebar right |
| `holy-grail` | Classic three-column layout |
| `app-shell` | Persistent nav with horizontal header |
| `dashboard` | Header + collapsible nav + main |
| `article` | Centered content (max-width: 65ch) |
| `landing` | Full-width sections (hero, feature, cta) |

## Themes

| Theme | Character |
|-------|-----------|
| **Swiss** | Clean, precise, grid-based. Zero-radius, no shadows, stark typography. |
| **Organic** | Warm earth tones, flowing curves, subtle textures. |
| **Brutalist** | Raw, honest, unpolished. Harsh shadows, monospace, exposed structure. |
| **Cyber** | Dark backgrounds, glowing accents, terminal aesthetics. |

Each theme supports `data-mode="dark"` for dark variants.

## Examples by Complexity Tier

### Tier 1: Pure CSS (No JavaScript)

| Demo | Description |
|------|-------------|
| **Layout Switcher** | Switch between 5 layouts using `:checked` and radio buttons |
| **Tabs & Accordion** | Radio button tabs and native `<details>` accordion |
| **Responsive Grid** | Container queries, `auto-fit/minmax()`, CSS Subgrid |
| **Landing Page** | Marketing page with `data-layout="landing"` |

### Tier 2: Minimal JS (Data Attribute Flipping)

| Demo | Description |
|------|-------------|
| **Dashboard** | Collapsible sidebar with ~7 lines of JS |
| **Theme Builder** | Live CSS custom property manipulation |

### Tier 3: Interactive (Full JavaScript)

| Demo | Description |
|------|-------------|
| **Component Lab** | Interactive testing with component selector and code export |
| **Animation & Motion** | Scroll-driven animations and View Transitions API |

## Modern CSS Features

| Feature | Usage | Baseline |
|---------|-------|----------|
| `@layer` | Cascade control without specificity wars | 2022 |
| `@property` | Typed custom properties with animation | 2024 |
| `oklch()` | Perceptually uniform color manipulation | 2023 |
| `light-dark()` | Single-line theme mode switching | 2024 |
| CSS Nesting | Cleaner, scoped selectors | 2023 |
| `:has()` | Parent-aware styling | 2023 |
| `container-type` | Container queries | 2023 |

## Documentation

- [Architecture](docs/architecture.md) - Token layers, grid identity, CSS layers
- [Integration Guide](docs/integration-guide.md) - How to integrate into main library
- [Browser Support](docs/browser-support.md) - Compatibility notes

## Browser Support

Requires browsers with support for:
- CSS `@layer` (Baseline 2022)
- CSS Nesting (Baseline 2023)
- `:has()` (Baseline 2023)
- `oklch()` (Baseline 2023)

Tested: Chrome 120+, Firefox 121+, Safari 17+
