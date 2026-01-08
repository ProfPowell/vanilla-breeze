# Vanilla Breeze: Complete Roadmap
## Future Phases for Comprehensive HTML Component Coverage

---

## Executive Summary

This roadmap outlines the path from current POC to a complete, production-ready HTML component system. Key objectives:

1. **Complete HTML element coverage** - Style all ~100 standard HTML elements
2. **Expanded component library** - CSS-only inert components + interactive web components
3. **Open Props-compatible theming** - Token system aligned with Open Props patterns
4. **Wireframe mode** - Prototype-first development workflow
5. **Integration demos** - Simple sites, Astro SSG, and SPA applications

---

## Current State Inventory

### What Exists

| Category | Count | Elements |
|----------|-------|----------|
| Native Elements | 13 | headings, paragraph, anchor, code, blockquote, lists, hr, button, input, details, dialog, table, nav |
| Custom Elements | 7 | x-stack, x-cluster, x-grid, x-card, x-prose, x-center, x-sidebar |
| Web Components | 2 | x-tabs, x-footnotes |
| Tokens | 7 files | spacing, typography, colors, sizing, borders, motion |

### What's Missing (Gap Analysis)

**Native Elements Not Styled** (~60+ elements):
- Content Sectioning: `<article>`, `<aside>`, `<section>`, `<header>`, `<footer>`, `<main>`, `<address>`, `<hgroup>`, `<search>`
- Text: `<figure>`, `<figcaption>`, `<menu>`
- Inline: `<abbr>`, `<cite>`, `<dfn>`, `<kbd>`, `<mark>`, `<q>`, `<s>`, `<samp>`, `<sub>`, `<sup>`, `<time>`, `<u>`, `<var>`, `<bdi>`, `<bdo>`, `<ruby>`, `<rt>`, `<rp>`, `<wbr>`, `<del>`, `<ins>`, `<data>`
- Multimedia: `<img>`, `<picture>`, `<video>`, `<audio>`, `<track>`, `<source>`, `<iframe>`, `<embed>`, `<object>`, `<canvas>`, `<svg>`, `<map>`, `<area>`
- Forms: `<form>`, `<datalist>`, `<meter>`, `<progress>`, `<output>`, `<optgroup>`

**Layout Components Needed**:
- x-frame (aspect ratio container)
- x-cover (hero/cover layout)
- x-switcher (flex/responsive toggle)
- x-reel (horizontal scroll)
- x-imposter (overlay positioning)
- x-icon (icon wrapper)

**Web Components Needed**:
- x-dialog (modal with focus trap)
- x-accordion (multi-panel disclosure)
- x-toast (notifications)
- x-tooltip (contextual hints)
- x-dropdown (accessible menus)
- x-carousel (image/content slider)
- x-lightbox (image viewer)

---

## Phase 4: Complete Native Element Coverage

### 4.1 Content Sectioning Elements

**Files to create:**
```
src/native-elements/
├── article/styles.css     # <article> - standalone content
├── aside/styles.css       # <aside> - sidebars, callouts
├── section/styles.css     # <section> - generic sections
├── header/styles.css      # <header> - intro content
├── footer/styles.css      # <footer> - closing content
├── main/styles.css        # <main> - primary content
├── address/styles.css     # <address> - contact info
├── hgroup/styles.css      # <hgroup> - heading groups
└── search/styles.css      # <search> - search forms
```

**Key styling considerations:**
- Minimal base styling (these are structural)
- Variant classes for common patterns:
  - `.article-blog`, `.article-card`
  - `.aside-sidebar`, `.aside-callout`, `.aside-note`
  - `.header-site`, `.header-page`, `.header-card`
  - `.footer-site`, `.footer-article`

### 4.2 Text Content Elements

**Files to create:**
```
src/native-elements/
├── figure/styles.css      # <figure> + <figcaption>
└── menu/styles.css        # <menu> - toolbar/context menus
```

**Figure patterns:**
```css
figure {
  margin: 0;

  & > img,
  & > video,
  & > picture {
    inline-size: 100%;
    block-size: auto;
  }
}

figcaption {
  font-size: var(--text-s);
  color: var(--color-text-muted);
  margin-block-start: var(--space-s);
}

/* Variants */
.figure-full { /* full bleed */ }
.figure-float-start { /* float left */ }
.figure-float-end { /* float right */ }
```

### 4.3 Inline Text Semantics

**Files to create:**
```
src/native-elements/
├── abbreviation/styles.css   # <abbr> - tooltips, dotted underline
├── citation/styles.css       # <cite> - work titles
├── definition/styles.css     # <dfn> - defined terms
├── keyboard/styles.css       # <kbd> - keyboard input (extends code)
├── quotation/styles.css      # <q> - inline quotes with localized marks
├── strikethrough/styles.css  # <s>, <del> - removed text
├── subscript/styles.css      # <sub>, <sup> - positioning
├── time/styles.css           # <time> - datetime styling
├── variable/styles.css       # <var> - variables
├── insert/styles.css         # <ins> - inserted text
├── data/styles.css           # <data> - machine data
└── ruby/styles.css           # <ruby>, <rt>, <rp> - annotations
```

### 4.4 Multimedia Elements

**Files to create:**
```
src/native-elements/
├── image/styles.css       # <img>, <picture> base styling
├── video/styles.css       # <video>, <audio> players
├── iframe/styles.css      # <iframe> responsive embeds
├── canvas/styles.css      # <canvas> containers
└── svg/styles.css         # <svg> inline styling
```

**Key patterns:**
```css
/* Responsive images */
img {
  max-inline-size: 100%;
  block-size: auto;
  display: block;
}

/* Responsive embeds */
.embed-responsive {
  position: relative;
  aspect-ratio: 16 / 9;

  & > iframe {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
  }
}

/* Video with poster fallback */
video {
  inline-size: 100%;
  block-size: auto;
  background: var(--color-gray-900);
}
```

### 4.5 Form Extensions

**Files to extend/create:**
```
src/native-elements/
├── form/styles.css        # <form> layout patterns
├── datalist/styles.css    # <datalist> dropdown styling
├── meter/styles.css       # <meter> gauge styling
├── progress/styles.css    # <progress> loading bars
└── output/styles.css      # <output> calculated results
```

**Progress/Meter patterns:**
```css
progress {
  appearance: none;
  inline-size: 100%;
  block-size: var(--space-s);
  border-radius: var(--radius-full);
  overflow: hidden;

  &::-webkit-progress-bar {
    background: var(--color-surface-raised);
  }

  &::-webkit-progress-value {
    background: var(--color-interactive);
    transition: inline-size var(--duration-normal) var(--ease-out);
  }
}

/* Variants */
progress.progress-sm { block-size: var(--space-2xs); }
progress.progress-lg { block-size: var(--space-m); }
progress.progress-success { --progress-color: var(--color-success); }
progress.progress-warning { --progress-color: var(--color-warning); }
progress.progress-error { --progress-color: var(--color-error); }
```

---

## Phase 5: Extended Layout Components (CSS-only)

### 5.1 New Inert Components

| Component | Purpose | Key Attributes |
|-----------|---------|----------------|
| `x-frame` | Aspect ratio container | `data-ratio="16:9\|4:3\|1:1\|custom"` |
| `x-cover` | Hero/cover layout with centered content | `data-min-height`, `data-center` |
| `x-switcher` | Flexbox that switches direction at breakpoint | `data-threshold`, `data-limit` |
| `x-reel` | Horizontal scrolling container | `data-gap`, `data-no-scrollbar` |
| `x-imposter` | Fixed/absolute positioning helper | `data-position`, `data-margin` |
| `x-icon` | Icon wrapper with sizing | `data-size="s\|m\|l"`, `data-space` |
| `x-visually-hidden` | Accessible hidden content | (no attributes) |
| `x-skip-link` | Skip to content link | `data-target` |

**x-cover example:**
```css
x-cover {
  display: flex;
  flex-direction: column;
  min-block-size: var(--_min-height, 100vh);
  padding: var(--space-l);

  & > * {
    margin-block: var(--space-l);
  }

  & > :first-child:not([data-centered]) {
    margin-block-start: 0;
  }

  & > :last-child:not([data-centered]) {
    margin-block-end: 0;
  }

  & > [data-centered] {
    margin-block: auto;
  }
}
```

**x-reel example:**
```css
x-reel {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  gap: var(--_gap, var(--space-m));
  scrollbar-color: var(--color-gray-400) transparent;

  & > * {
    flex-shrink: 0;
  }

  &[data-no-scrollbar] {
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
}
```

### 5.2 Register All Inert Components

Update `src/custom-elements/register.js`:
```javascript
const inertElements = [
  // Existing
  'x-stack', 'x-cluster', 'x-grid', 'x-card',
  'x-prose', 'x-center', 'x-sidebar',
  // New
  'x-frame', 'x-cover', 'x-switcher', 'x-reel',
  'x-imposter', 'x-icon', 'x-visually-hidden', 'x-skip-link'
];
```

---

## Phase 6: Interactive Web Components

### 6.1 x-dialog (Modal)

**Purpose**: Enhance native `<dialog>` with:
- Automatic focus trap
- Escape key handling
- Click-outside-to-close
- Scroll lock on body
- Animation on open/close
- Multiple sizes

**Structure:**
```html
<x-dialog data-size="m">
  <dialog>
    <header>
      <h2>Title</h2>
      <button data-close aria-label="Close">×</button>
    </header>
    <div>Content</div>
    <footer>
      <button data-close class="secondary">Cancel</button>
      <button data-confirm>Confirm</button>
    </footer>
  </dialog>
</x-dialog>
```

**API:**
```javascript
const dialog = document.querySelector('x-dialog');
dialog.open();   // Show modal
dialog.close();  // Close modal
dialog.addEventListener('x-confirm', handler);
dialog.addEventListener('x-cancel', handler);
```

### 6.2 x-accordion

**Purpose**: Multi-panel disclosure widget with:
- Single-open mode (like radio)
- Multi-open mode
- Keyboard navigation (Arrow keys, Home/End)
- ARIA accordion pattern

**Structure:**
```html
<x-accordion data-exclusive>
  <details name="acc-1">
    <summary>Panel 1</summary>
    <div>Content 1</div>
  </details>
  <details name="acc-1">
    <summary>Panel 2</summary>
    <div>Content 2</div>
  </details>
</x-accordion>
```

### 6.3 x-toast

**Purpose**: Notification system with:
- Auto-dismiss timer
- Stacking/queuing
- Position variants (top, bottom, corners)
- Type variants (info, success, warning, error)
- Dismiss button

**Structure:**
```html
<x-toast-container data-position="bottom-end">
  <!-- Toasts injected here -->
</x-toast-container>
```

**API:**
```javascript
import { toast } from './x-toast/logic.js';
toast('Message saved!', { type: 'success', duration: 3000 });
toast.error('Failed to save');
toast.info('New message received');
```

### 6.4 x-tooltip

**Purpose**: Contextual hints with:
- Hover/focus trigger
- Positioning (top, bottom, left, right)
- Arrow pointer
- Delay options
- Accessible by default

**Structure:**
```html
<button aria-describedby="tip-1">
  Save
  <x-tooltip id="tip-1">Save your changes</x-tooltip>
</button>
```

### 6.5 x-dropdown

**Purpose**: Accessible dropdown menus:
- Button trigger
- Menu items with keyboard nav
- Submenus (nested)
- Disabled items
- Dividers

**Structure:**
```html
<x-dropdown>
  <button>Menu</button>
  <menu>
    <li><button>Action 1</button></li>
    <li><button>Action 2</button></li>
    <li role="separator"></li>
    <li><button disabled>Disabled</button></li>
  </menu>
</x-dropdown>
```

### 6.6 x-carousel

**Purpose**: Image/content slider:
- Swipe/drag support
- Keyboard navigation
- Dot indicators
- Prev/Next buttons
- Auto-play (optional)
- Reduced motion support

### 6.7 x-lightbox

**Purpose**: Image gallery viewer:
- Full-screen overlay
- Zoom support
- Keyboard navigation
- Touch gestures
- Caption support
- Preloading

---

## Phase 7: Open Props Token Alignment

### 7.1 Token Refactoring

Refactor tokens to align with [Open Props](https://open-props.style/) naming conventions:

**Current → Open Props-style:**

```css
/* Spacing: match Open Props size scale */
--size-1: 0.25rem;    /* was --space-3xs */
--size-2: 0.5rem;     /* was --space-2xs */
--size-3: 0.75rem;    /* was --space-xs */
--size-4: 1rem;       /* was --space-s */
--size-5: 1.25rem;    /* was --space-m */
--size-6: 1.5rem;     /* was --space-l */
--size-7: 1.75rem;    /* was --space-xl */
--size-8: 2rem;       /* was --space-2xl */
/* ... up to --size-15 */

/* Typography */
--font-size-0: 0.75rem;
--font-size-1: 0.875rem;
--font-size-2: 1rem;
--font-size-3: 1.125rem;
/* ... up to --font-size-8 */

/* Borders */
--border-size-1: 1px;
--border-size-2: 2px;
--border-size-3: 4px;

--radius-1: 0.25rem;
--radius-2: 0.5rem;
--radius-3: 1rem;
--radius-round: 1e5px;

/* Shadows (Open Props style) */
--shadow-1: 0 1px 2px -1px hsl(var(--shadow-color) / 0.1);
--shadow-2: 0 3px 5px -2px hsl(var(--shadow-color) / 0.1);
--shadow-3: 0 6px 10px -3px hsl(var(--shadow-color) / 0.1);
/* ... up to --shadow-6 */

/* Animations */
--ease-1: cubic-bezier(0.25, 0, 0.5, 1);
--ease-2: cubic-bezier(0.25, 0, 0.4, 1);
--ease-3: cubic-bezier(0.25, 0, 0.3, 1);
--ease-in-1: cubic-bezier(0.25, 0, 1, 1);
--ease-out-1: cubic-bezier(0, 0, 0.75, 1);

/* Aspect Ratios */
--ratio-square: 1;
--ratio-landscape: 4/3;
--ratio-portrait: 3/4;
--ratio-widescreen: 16/9;
--ratio-ultrawide: 18/5;
--ratio-golden: 1.618/1;
```

### 7.2 Theme System

**Theme structure:**
```
src/themes/
├── _base.css           # Core tokens (required)
├── light.css           # Light theme colors
├── dark.css            # Dark theme colors
├── ocean.css           # Ocean blue theme
├── forest.css          # Green nature theme
├── sunset.css          # Warm orange theme
├── midnight.css        # Deep purple theme
└── index.css           # Theme switcher
```

**Theme file example (`ocean.css`):**
```css
@media (prefers-color-scheme: light) {
  :root[data-theme="ocean"], .theme-ocean {
    --color-primary: oklch(55% 0.15 230);
    --color-primary-hover: oklch(45% 0.18 230);
    --color-surface: oklch(98% 0.01 230);
    --color-surface-raised: oklch(96% 0.02 230);
    --color-text: oklch(20% 0.02 230);
    --color-text-muted: oklch(45% 0.05 230);
    --color-border: oklch(85% 0.03 230);
    --color-interactive: var(--color-primary);
    /* ... */
  }
}

@media (prefers-color-scheme: dark) {
  :root[data-theme="ocean"], .theme-ocean {
    --color-primary: oklch(70% 0.12 230);
    --color-surface: oklch(15% 0.02 230);
    /* ... */
  }
}
```

**Theme switching:**
```javascript
// Theme switcher component
document.documentElement.setAttribute('data-theme', 'ocean');

// Or via CSS class
document.body.classList.add('theme-ocean');
```

---

## Phase 8: Wireframe Prototype Mode

### 8.1 Concept

A CSS layer that transforms the component library into wireframe/prototype mode for rapid mockups:

**Activation:**
```html
<!-- Add wireframe class to enable -->
<body class="wireframe">
  <!-- Or via data attribute -->
<body data-mode="wireframe">
```

### 8.2 Wireframe Styles

```css
@layer wireframe {
  .wireframe,
  [data-mode="wireframe"] {
    /* Typography becomes placeholders */
    --wireframe-text: oklch(50% 0 0);
    --wireframe-bg: oklch(95% 0 0);
    --wireframe-border: oklch(70% 0 0);
    --wireframe-accent: oklch(60% 0.1 250);

    /* All colors become grayscale */
    & * {
      color: var(--wireframe-text) !important;
      background-color: var(--wireframe-bg) !important;
      border-color: var(--wireframe-border) !important;
    }

    /* Interactive elements get accent */
    & button,
    & a,
    & input,
    & select,
    & textarea {
      border: 2px dashed var(--wireframe-accent) !important;
      background: oklch(90% 0.02 250) !important;
    }

    /* Images become placeholders */
    & img,
    & video,
    & iframe,
    & canvas {
      background: repeating-linear-gradient(
        45deg,
        var(--wireframe-border),
        var(--wireframe-border) 10px,
        var(--wireframe-bg) 10px,
        var(--wireframe-bg) 20px
      ) !important;
      opacity: 0;
    }

    & img::after,
    & video::after {
      content: "📷 " attr(alt);
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      inset: 0;
    }

    /* Font becomes sketchy */
    & * {
      font-family: 'Comic Neue', 'Comic Sans MS', cursive !important;
    }

    /* Rounded corners become more pronounced */
    & * {
      border-radius: var(--radius-3) !important;
    }

    /* Cards get hand-drawn effect */
    & x-card {
      box-shadow: 3px 3px 0 var(--wireframe-border) !important;
      transform: rotate(-0.5deg);
    }

    & x-card:nth-child(even) {
      transform: rotate(0.5deg);
    }
  }

  /* Annotation mode */
  .wireframe-annotate [data-note]::after {
    content: attr(data-note);
    position: absolute;
    top: 0;
    right: 0;
    background: yellow;
    padding: 2px 6px;
    font-size: 10px;
    font-family: sans-serif;
    border-radius: 0 0 0 4px;
  }
}
```

### 8.3 Wireframe Utilities

```html
<!-- Placeholder text -->
<p data-placeholder="3-lines">...</p>
<p data-placeholder="paragraph">...</p>

<!-- Placeholder images -->
<div data-placeholder="image" data-ratio="16:9"></div>
<div data-placeholder="avatar"></div>
<div data-placeholder="logo"></div>

<!-- Layout annotations -->
<section data-note="Hero section">...</section>
<nav data-note="Primary navigation">...</nav>

<!-- TODO markers -->
<div data-todo="Implement user avatar dropdown">...</div>
```

---

## Phase 9: Integration Demos

### 9.1 Simple Static Site

**Location:** `demos/simple-site/`

**Structure:**
```
demos/simple-site/
├── index.html          # Homepage
├── about.html          # About page
├── contact.html        # Contact form
├── blog/
│   ├── index.html      # Blog listing
│   └── post.html       # Single post
└── styles.css          # Site-specific overrides
```

**Purpose:** Demonstrate:
- Zero-JS capability
- All native elements in context
- Layout components for page structure
- Nav component patterns
- Form styling

### 9.2 Astro SSG Site

**Location:** `demos/astro-site/`

**Structure:**
```
demos/astro-site/
├── astro.config.mjs
├── src/
│   ├── layouts/
│   │   ├── Base.astro
│   │   ├── Blog.astro
│   │   └── Landing.astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Card.astro
│   │   └── ...
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   └── blog/
│   │       ├── index.astro
│   │       └── [slug].astro
│   └── content/
│       └── blog/
│           └── *.md
├── public/
└── package.json
```

**Purpose:** Demonstrate:
- Component islands architecture
- Partial hydration with web components
- Content collections
- SSG-optimized loading
- Theme switching
- Dark mode

### 9.3 SPA Application

**Location:** `demos/spa-app/`

**Structure:**
```
demos/spa-app/
├── index.html
├── src/
│   ├── main.js
│   ├── router.js
│   ├── store.js
│   ├── views/
│   │   ├── Dashboard.js
│   │   ├── Settings.js
│   │   └── Profile.js
│   ├── components/
│   │   ├── AppShell.js
│   │   ├── Sidebar.js
│   │   └── Header.js
│   └── styles/
│       └── app.css
└── package.json
```

**Purpose:** Demonstrate:
- All interactive web components
- State management integration
- Dynamic theming
- Toast notifications
- Modal dialogs
- Complex forms
- Real-time updates

---

## Phase 10: Documentation Site

### 10.1 Structure

```
docs/
├── index.html                 # Landing page
├── getting-started/
│   ├── installation.html
│   ├── quick-start.html
│   └── browser-support.html
├── tokens/
│   ├── spacing.html
│   ├── typography.html
│   ├── colors.html
│   └── ...
├── native-elements/
│   ├── index.html            # Overview
│   ├── [element].html        # Per-element page
│   └── ...
├── components/
│   ├── layout/
│   │   ├── stack.html
│   │   ├── cluster.html
│   │   └── ...
│   └── interactive/
│       ├── tabs.html
│       ├── dialog.html
│       └── ...
├── themes/
│   ├── overview.html
│   ├── customization.html
│   └── presets.html
├── wireframe/
│   └── guide.html
└── recipes/
    ├── forms.html
    ├── navigation.html
    ├── cards.html
    └── ...
```

### 10.2 Documentation Features

- Live code examples (editable)
- Copy-to-clipboard for code snippets
- Theme switcher demo
- Accessibility checklist per component
- Browser support tables
- Bundle size indicators

---

## Implementation Timeline

| Phase | Focus | Estimated Effort |
|-------|-------|------------------|
| **Phase 4** | Complete native elements (~50 more) | Large |
| **Phase 5** | Extended layout components (+8) | Medium |
| **Phase 6** | Interactive web components (+7) | Large |
| **Phase 7** | Open Props token alignment + themes | Medium |
| **Phase 8** | Wireframe prototype mode | Small |
| **Phase 9** | Integration demos (3 sites) | Medium |
| **Phase 10** | Documentation site | Medium |

---

## Priority Order Recommendation

### High Priority (Do First)
1. **Phase 7.1** - Token alignment (foundation for everything)
2. **Phase 4.4** - Multimedia elements (img, video - frequently used)
3. **Phase 4.5** - Form extensions (progress, meter - UX critical)
4. **Phase 6.1** - x-dialog (most requested interactive component)
5. **Phase 6.3** - x-toast (essential for app feedback)

### Medium Priority
6. **Phase 5** - Extended layout components (x-frame, x-cover, x-reel)
7. **Phase 6.2** - x-accordion
8. **Phase 7.2** - Theme system + presets
9. **Phase 4.1** - Content sectioning elements
10. **Phase 8** - Wireframe mode

### Lower Priority (Enhancement)
11. **Phase 4.3** - Inline text semantics (edge cases)
12. **Phase 6.4-6.7** - Additional interactive components
13. **Phase 9** - Integration demos
14. **Phase 10** - Documentation site

---

## Success Criteria

- [ ] All 100+ HTML elements have baseline styling
- [ ] 15+ layout components available (CSS-only)
- [ ] 10+ interactive web components
- [ ] 5+ theme presets (light/dark variants each)
- [ ] Wireframe mode toggleable with single class
- [ ] 3 integration demo sites working
- [ ] Documentation with live examples
- [ ] Bundle size < 20KB CSS (gzipped)
- [ ] Zero-JS core functionality preserved
- [ ] WCAG 2.1 AA compliance throughout

---

## Technical Decisions

### CSS Architecture
- Continue using `@layer` for cascade control
- Open Props-compatible naming for tokens
- Logical properties throughout (RTL ready)
- Container queries for component-level responsiveness

### JavaScript Philosophy
- Web components for progressive enhancement only
- No framework dependencies
- ES modules for tree-shaking
- Custom events for component communication

### Theming Strategy
- CSS custom properties as single source
- Support both `prefers-color-scheme` and manual toggle
- Theme files as standalone imports
- HSL/OKLCH for programmatic color manipulation

### Accessibility
- ARIA patterns from WAI-ARIA Authoring Practices
- Keyboard navigation for all interactive components
- Focus management in dialogs/modals
- Reduced motion support

---

## References

- [MDN HTML Elements Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements)
- [Open Props](https://open-props.style/)
- [Every Layout](https://every-layout.dev/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)
