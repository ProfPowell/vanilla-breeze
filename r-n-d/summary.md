# Vanilla Breeze: Semantic Grid Identity System

## Advanced Techniques Employed

### 1. CSS `@property` Typed Custom Properties (Baseline 2024)
```css
@property --sidebar-width {
  syntax: "<length> | <percentage> | auto";
  inherits: true;
  initial-value: 280px;
}
```

**Benefits:**
- Type validation prevents invalid values
- Enables animation of custom properties
- Provides fallback initial values
- Inheritance control

**Browser support:** Chrome 85+, Safari 15.4+, Firefox 128+

---

### 2. CSS Cascade Layers (`@layer`)
```css
@layer grid-identity, grid-layouts, grid-responsive, grid-utilities;
```

**Benefits:**
- Explicit specificity control without `!important` wars
- Utilities can override layouts regardless of source order
- Third-party CSS can be contained

---

### 3. Container Queries for Component Layouts
```css
main, article, section, aside {
  container-type: inline-size;
}

@container (max-width: 400px) {
  article[data-layout] {
    grid-template: /* narrow layout */;
  }
}
```

**Why it matters:** Layout decisions at the component level, not viewport level. An `<article>` in a narrow sidebar behaves differently than one in the main content area.

---

### 4. View Transitions API for Layout Changes
```javascript
async transition(newLayout) {
  const transition = document.startViewTransition(() => {
    this.layout = newLayout;
  });
  await transition.finished;
}
```

**Benefits:**
- Browser-native layout animations
- Automatic cross-fade between states
- No manual keyframe management

---

### 5. CSS Anchor Positioning (Experimental)
```css
@supports (anchor-name: --test) {
  body > nav { anchor-name: --body-nav; }
  
  [data-anchor="nav"] {
    position: fixed;
    position-anchor: --body-nav;
    top: anchor(bottom);
  }
}
```

**Use case:** Floating elements (tooltips, menus, toolbars) that track grid-positioned elements.

---

### 6. Scroll-Driven Animations for Progressive Headers
```css
@supports (animation-timeline: scroll()) {
  header[data-sticky] {
    animation: shrink-header linear;
    animation-timeline: scroll();
    animation-range: 0 100px;
  }
}
```

**Benefits:** No JavaScript scroll listeners for header shrink effects.

---

### 7. `:has()` Selector for Layout-Aware Styling
```css
/* Adjust layout when sidebar is empty */
body:has(> nav:empty) {
  grid-template-columns: 1fr;
}

/* Different main layout when it contains aside */
main:has(> aside) {
  grid-template-columns: 1fr var(--sidebar-narrow);
}

/* Header styling based on presence of nav */
body:has(> nav) > header {
  padding-inline-start: var(--sidebar-width);
}
```

---

### 8. `grid-template` Variable Injection
```css
:root {
  --tpl-holy-grail:
    "body-header body-header body-header" auto
    "body-nav    body-main   body-aside"  1fr
    "body-footer body-footer body-footer" auto
    / var(--sidebar-width) 1fr var(--sidebar-width);
}

body[data-layout="holy-grail"] {
  grid-template: var(--tpl-holy-grail);
}
```

**Power move:** JavaScript can inject entirely new templates:
```javascript
document.documentElement.style.setProperty('--tpl-custom',
  `"header header" auto
   "nav    main"   1fr
   / 100px 1fr`
);
```

---

## Emergent Patterns

### Pattern 1: Structural Selectors as Layout API

The HTML structure itself becomes the layout specification:
```html
<!-- This HTML implies a specific layout capability -->
<body data-layout="holy-grail">
  <header>...</header>
  <nav>...</nav>
  <main>...</main>
  <aside>...</aside>
  <footer>...</footer>
</body>
```

No classes needed. The elements' positions in the DOM declare their grid areas.

---

### Pattern 2: Layout Composition via Nesting
```html
<body data-layout="sidebar-left">
  <main data-layout="article-aside">
    <article>
      <header>...</header>
      <section>...</section>
      <footer>...</footer>
    </article>
    <aside>...</aside>
  </main>
</body>
```

Each level can have its own grid layout, and grid areas cascade contextually.

---

### Pattern 3: State-Driven Layout Modifiers
```html
<body data-layout="dashboard" data-sidebar="collapsed" data-gap="none">
```

Layout + modifier attributes compose without specificity conflicts (thanks to `@layer`).

---

### Pattern 4: Progressive Enhancement for Advanced Features
```css
/* Base works everywhere */
body[data-layout] { display: grid; }

/* Enhanced where supported */
@supports (anchor-name: --test) { /* ... */ }
@supports (animation-timeline: scroll()) { /* ... */ }
```

---

### Pattern 5: Container Size Categories via ResizeObserver
```javascript
// JS sets data-container-size="xs|sm|md|lg" on observed elements
```
```css
article[data-container-size="xs"] {
  /* Compact layout */
}
```

Polyfills container queries for older browsers while providing a hook for custom logic.

---

## Selectors Worth Noting

| Selector | Purpose |
|----------|---------|
| `body > nav` | Direct child = page-level nav |
| `main > nav` | Section navigation |
| `body:has(> aside)` | Layout adjusts to content presence |
| `[data-layout] > [data-sticky]` | Generic sticky within any layout |
| `nav:nth-of-type(2)` | Secondary nav gets distinct area |
| `body[data-sidebar="collapsed"]` | State-based layout modification |

---

## What's Not Yet Possible

1. **`attr()` for grid-area** - Would enable `<section data-grid-area="hero">` without predefined CSS rules. Currently in CSS Values Level 5 draft.

2. **CSS Mixins** - Would allow `@apply layout-holy-grail` style composition. Proposed but not implemented.

3. **Native Layout Transitions** - `grid-template` can't animate smoothly yet. View Transitions API is the workaround.

4. **Subgrid with Named Areas** - Works but browser support is still catching up for complex cases.

---

## Usage Example
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="vanilla-breeze-grid.css">
</head>
<body data-layout="dashboard" data-gap="md">
  <header data-sticky>Dashboard</header>
  <nav data-sticky>
    <a href="/">Home</a>
    <a href="/reports">Reports</a>
  </nav>
  <main data-layout="stack">
    <header>Welcome</header>
    <article>Content here</article>
  </main>
  <footer>© 2025</footer>
  
  <script type="module">
    import { initLayoutSystem } from './vanilla-breeze-layout.js';
    
    const { controller } = initLayoutSystem({
      responsive: {
        '(max-width: 768px)': 'stack',
        '(min-width: 769px)': 'dashboard'
      },
      persist: true
    });
    
    // Toggle sidebar with button
    document.querySelector('#menu-toggle')
      ?.addEventListener('click', () => controller.toggleSidebar());
  </script>
</body>
</html>
```