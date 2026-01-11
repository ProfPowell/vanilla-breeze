# Vanilla Breeze Project Overview

A platform-first HTML component system built on semantic HTML, CSS layers, and progressive enhancement.

## Philosophy and Core Tenets

1. **HTML-first**: Semantic markup works without CSS/JS
2. **CSS-second**: Styling via layers, no build step required
3. **JS-third**: Enhancement only, never required for core functionality
4. **Less is more**: Prefer native elements + data-attributes over custom elements
5. **Zero deployed dependencies**: Works in any environment
6. **Limited tooling**: Repository tooling is focused to avoid complexity

---

## Architecture

### CSS Layer Cascade

```css
@layer tokens, reset, native-elements, custom-elements, web-components, utils;
```

This creates predictable specificity:
1. Design tokens (lowest)
2. Reset/normalization
3. Native element styling
4. Custom element styling
5. Web component styling
6. Utility classes (highest)

### Directory Structure

```
vanilla-breeze/
├── src/
│   ├── main.css              # Entry point (imports all layers)
│   ├── main.js               # Entry point (imports JS utilities)
│   ├── base/                 # Reset and foundational styles
│   ├── tokens/               # Design tokens (CSS custom properties)
│   │   └── themes/           # Brand theme files
│   ├── native-elements/      # CSS for semantic HTML elements (37)
│   ├── custom-elements/      # Non-interactive layout components (15)
│   ├── web-components/       # Interactive web components (10)
│   ├── utils/                # Utility CSS and JavaScript
│   ├── lib/                  # Utility libraries (theme manager)
│   └── icons/                # Icon handling (Lucide)
├── docs/                     # Documentation site
└── scripts/                  # Build/utility scripts
```

---

## Design Tokens

Located in `/src/tokens/`. All use CSS custom properties.

### Colors (`colors.css`)

- **Gray scale**: oklch-based, 50-950 variants
- **Brand hues**: Primary (260°), Secondary (200°), Accent (30°)
- **Status colors**: Success, Warning, Error, Info
- **Semantic colors**: Surface, Text, Border, Interactive, Overlay
- **Light/Dark mode**: via `light-dark()` function
- **Theming**: Override `--hue-primary`, `--hue-secondary`, `--hue-accent`

### Typography (`typography.css`)

| Token | Values |
|-------|--------|
| Font families | Sans (system-ui), Serif (Charter), Mono (ui-monospace) |
| Font sizes | xs-5xl (12px-48px) |
| Line heights | none-loose (1-1.75) |
| Font weights | light-bold (300-700) |
| Letter spacing | tight-wider (-0.025em to 0.05em) |
| Measure | narrow-wide (45ch-80ch) |

### Spacing (`spacing.css`)

T-shirt sizing with base unit of 0.25rem (4px):
- `--size-3xs` (2px) through `--size-3xl` (64px)
- Open Props numeric aliases: `--size-1` through `--size-10`

### Other Tokens

- **Borders**: widths (thin/medium/thick), radii (xs-2xl, full)
- **Shadows**: xs-2xl scale, inset variants
- **Motion**: durations (instant-slower: 50ms-500ms), easing functions
- **Reduced motion**: All durations become 0ms when `prefers-reduced-motion`

### Themes

Pre-built brand themes in `/src/tokens/themes/`:
- forest, ocean, sunset
- Template for custom themes
- Override hue variables for easy customization

---

## Native Elements

Located in `/src/native-elements/` (37 directories). CSS-only styling for semantic HTML.

### Categories

| Category | Elements |
|----------|----------|
| Typography | headings, paragraph, anchor, code, blockquote, lists, hr, inline-semantics |
| Interactive | button, input, details, dialog, tooltip |
| Data | table (with sticky headers) |
| Navigation | nav |
| Multimedia | image, video, iframe, canvas, svg |
| Forms | form, progress, meter, output, datalist |
| Sectioning | article, aside, section, header, footer, main, address, hgroup, search |
| Content | figure, menu |

### Key Patterns

- Uses design tokens for spacing, colors, sizing
- Data attributes for variants: `data-gap`, `data-align`, `data-variant`
- Progressive enhancement-friendly
- Accessibility-first with ARIA where needed

### Notable Implementations

**Button variants**:
```html
<button>Primary</button>
<button class="secondary">Secondary</button>
<button class="ghost">Ghost</button>
<button data-size="small">Small</button>
```

**Nav variants**:
```html
<nav class="horizontal pills">...</nav>
<nav class="tabs">...</nav>
<nav class="breadcrumb" data-separator="chevron">...</nav>
<nav class="tree">...</nav>  <!-- Collapsible tree navigation -->
<nav class="pagination">...</nav>
```

**Table features**:
- Sticky headers with `[data-sticky-header]`
- Sticky first column with `[data-sticky-column]`
- Striped rows, hover states

---

## Custom Elements (Layout)

Located in `/src/custom-elements/` (15 elements). Non-interactive layout containers using CSS Grid/Flexbox. No JavaScript logic.

### Layout Elements

| Element | Purpose |
|---------|---------|
| `layout-stack` | Vertical flex column with gap |
| `layout-grid` | CSS Grid with auto-fit columns |
| `layout-cluster` | Horizontal flex with wrapping |
| `layout-sidebar` | Sidebar + main content layout |
| `layout-center` | Centered content container |
| `layout-card` | Card container with padding/shadow |
| `layout-cover` | Full-height layout |
| `layout-reel` | Horizontal scrolling container |
| `layout-switcher` | Responsive multi-column |
| `layout-imposter` | Absolute positioning layout |
| `layout-text` | Text content wrapper |
| `layout-badge` | Badge/label container |

### Utility Elements

- `token-swatch` - Token visualization
- `status-message` - Status display
- `user-avatar` - Avatar display

### Usage Pattern

```html
<layout-stack data-gap="m" data-align="center">
  <h1>Title</h1>
  <p>Content</p>
</layout-stack>

<layout-sidebar data-side="left" data-gap="l">
  <nav>Sidebar</nav>
  <main>Content</main>
</layout-sidebar>
```

---

## Web Components (Interactive)

Located in `/src/web-components/` (10 components). JavaScript-enhanced components.

### Component List

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `accordion-wc` | Collapsible panels | Built on details/summary, single-open mode, keyboard nav |
| `tabs-wc` | Tabbed interface | ARIA tablist/tab/tabpanel, keyboard nav |
| `toast-wc` | Toast notifications | Auto-dismiss, positioning |
| `tooltip-wc` | Tooltip overlays | Positioned with arrow |
| `dropdown-wc` | Dropdown menus | Click/keyboard triggered |
| `footnotes-wc` | Footnote references | Modal/popover display |
| `icon-wc` | SVG icon wrapper | Lucide integration, size variants |
| `theme-picker` | Theme selection | Mode switching, brand themes |
| `heading-links` | Heading anchors | Auto-generates linkable IDs |
| `page-toc` | Table of contents | Scroll-spy, auto-generated or manual markup |

### Common Patterns

```javascript
class MyComponent extends HTMLElement {
  #privateField;  // Private fields for encapsulation

  connectedCallback() {
    // Setup when added to DOM
  }

  disconnectedCallback() {
    // Cleanup when removed
  }
}
customElements.define('my-component', MyComponent);
```

### Progressive Enhancement

Web components support both modes:

**Auto-generated** (empty element):
```html
<page-toc data-levels="h2,h3"></page-toc>
```

**Manual markup** (enhanced with scroll-spy):
```html
<page-toc>
  <details class="page-toc-details" open>
    <summary class="page-toc-summary">On this page</summary>
    <nav class="page-toc-nav">
      <ul class="page-toc-list">
        <li><a href="#section">Section</a></li>
      </ul>
    </nav>
  </details>
</page-toc>
```

---

## Key Conventions

### Data Attributes for Configuration

```html
<!-- Variants -->
<button data-variant="secondary">...</button>

<!-- Sizes -->
<layout-stack data-gap="m">...</layout-stack>

<!-- States -->
<details data-state="open">...</details>

<!-- Layout control -->
<layout-sidebar data-side="left" data-sticky>...</layout-sidebar>
```

### CSS Custom Property Naming

```css
--[category]-[semantic]-[variant]

/* Examples */
--color-primary
--color-text-muted
--size-m
--duration-fast
--ease-out
--font-size-lg
```

### Accessibility Patterns

- ARIA roles and attributes on all interactive elements
- Keyboard navigation (Arrow, Home, End, Enter, Escape)
- Focus management and visible focus indicators
- Screen reader announcements
- Respects `prefers-reduced-motion`
- Color contrast compliance

---

## Theme System

### Mode Switching

```javascript
// ThemeManager handles:
// - Light/dark/auto modes
// - System preference detection (prefers-color-scheme)
// - localStorage persistence
// - Event-driven updates
```

### Brand Themes

Themes override three hue variables:
```css
:root {
  --hue-primary: 260;    /* Purple-blue */
  --hue-secondary: 200;  /* Cyan */
  --hue-accent: 30;      /* Orange */
}
```

Pre-built themes:
- **ocean**: Blue/teal palette
- **forest**: Green/earth palette
- **sunset**: Orange/warm palette

### Color System

Uses OKLCH color space:
- Perceptually uniform
- Easy lightness/chroma manipulation
- `light-dark()` function for automatic mode switching

```css
--color-primary: light-dark(
  oklch(45% 0.2 var(--hue-primary)),
  oklch(70% 0.15 var(--hue-primary))
);
```

---

## Build and Tooling

### Dependencies

**Dev only** (none in production):
- `vite` - Dev server and build
- `html-validate` - HTML validation
- `lucide-static` - Icons
- `@profpowell/code-block` - Docs only
- `@profpowell/browser-window` - Docs only

### Scripts

```bash
npm run dev       # Start dev server at localhost:5173
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint:html # Validate HTML
npm run icons:sync # Sync Lucide icons
```

### No Build Required

The core library works without any build step:
```html
<link rel="stylesheet" href="path/to/main.css">
<script type="module" src="path/to/main.js"></script>
```

---

## Documentation Site

Located in `/docs/`. Self-demonstrating - uses vanilla-breeze components.

### Structure

- `/docs/index.html` - Home/dashboard
- `/docs/elements/` - Element documentation
  - `/native/` - Native element pages
  - `/custom/` - Custom element pages
- `/docs/tokens/` - Token reference
- `/docs/examples/` - Usage examples
- `/docs/integrations/` - Framework integration guides

### Page Pattern

Documentation pages use:
- `data-page="docs"` attribute on `<html>`
- Shared `docs.css` for documentation-specific styling
- `layout-sidebar` for nav + content
- `page-toc` for on-page navigation
- `heading-links` for linkable headings
- `nav.tree` for hierarchical navigation

---

## Recent Enhancements (Navigation Refactor)

### Phase 1: CSS Variable Foundation
- Added private CSS variables to `nav` for consistent hover/active states
- Reduced redundancy across nav variants

### Phase 2: Visual Unification
- Tree nav and page-toc now share visual patterns
- Both use +/- disclosure indicators
- Both use left border accent for active state
- Consistent spacing and typography

### Phase 3: Progressive Enhancement
- `page-toc` supports both auto-generated and manual markup modes
- Manual markup enhanced with scroll-spy
- Works without JavaScript for basic navigation

---

## Summary

Vanilla Breeze prioritizes:
- **Semantic HTML** over custom markup
- **CSS styling** over JavaScript behavior
- **Progressive enhancement** over JavaScript requirements
- **Native browser features** over polyfills
- **Zero runtime dependencies** over convenience libraries
- **Accessibility** as a core requirement, not an afterthought

The result is a component system that works everywhere, degrades gracefully, and puts content and semantics first.
