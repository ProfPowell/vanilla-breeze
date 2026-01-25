# Grid Identity System - Optional Module

## Overview

Extract the grid identity concept from zen-garden as an opt-in module. This allows semantic HTML elements to automatically register grid areas based on their role in the document structure.

## Concept

Instead of manually assigning grid areas:
```css
/* Manual approach */
.my-header { grid-area: header; }
.my-nav { grid-area: nav; }
.my-main { grid-area: main; }
```

Semantic elements get grid areas automatically:
```css
/* Identity approach */
body > header { grid-area: body-header; }
body > nav { grid-area: body-nav; }
body > main { grid-area: body-main; }
```

## Proposed Implementation

### File: `src/custom-elements/layout-grid-identity.css`

This is an **opt-in** module, not automatically imported.

```css
/* ==========================================================================
   Grid Identity System

   Semantic HTML elements automatically register grid areas.
   Import this file to enable identity-based grid layouts.

   Usage:
   1. Import: @import "vanilla-breeze/layout-grid-identity.css";
   2. Apply: <body data-layout="page-sidebar">
   ========================================================================== */

/* --- Body-level landmarks --- */
body > header { grid-area: body-header; }
body > nav { grid-area: body-nav; }
body > main { grid-area: body-main; }
body > aside { grid-area: body-aside; }
body > footer { grid-area: body-footer; }

/* Secondary nav (if two navs exist) */
body > nav:nth-of-type(2) { grid-area: body-nav-secondary; }

/* --- Main-level structure --- */
main > header { grid-area: main-header; }
main > nav { grid-area: main-nav; }
main > article { grid-area: main-article; }
main > section { grid-area: main-section; }
main > aside { grid-area: main-aside; }
main > footer { grid-area: main-footer; }

/* --- Article-level structure --- */
article > header { grid-area: article-header; }
article > section { grid-area: article-content; }
article > aside { grid-area: article-aside; }
article > footer { grid-area: article-footer; }

/* --- Explicit overrides via data attribute --- */
[data-grid-area] { grid-area: var(--_grid-area); }
[data-grid-area="hero"] { --_grid-area: hero; }
[data-grid-area="sidebar"] { --_grid-area: sidebar; }
[data-grid-area="content"] { --_grid-area: content; }
[data-grid-area="feature"] { --_grid-area: feature; }
[data-grid-area="cta"] { --_grid-area: cta; }
[data-grid-area="toc"] { --_grid-area: toc; }
```

### File: `src/custom-elements/layout-page.css`

Page-level layout templates that use grid identity:

```css
/* ==========================================================================
   Page Layout Templates

   Requires: layout-grid-identity.css

   Usage: <body data-layout="page-sidebar">
   ========================================================================== */

/* --- Base page grid --- */
body[data-layout^="page-"] {
  display: grid;
  min-height: 100dvh;
  gap: var(--layout-gap, 0);
}

/* --- Stack (mobile-first default) --- */
body[data-layout="page-stack"] {
  grid-template:
    "body-header" auto
    "body-nav" auto
    "body-main" 1fr
    "body-footer" auto
    / 1fr;
}

/* --- Sidebar Left --- */
body[data-layout="page-sidebar"] {
  grid-template:
    "body-header body-header" auto
    "body-nav    body-main"   1fr
    "body-footer body-footer" auto
    / var(--sidebar-width, 280px) 1fr;
}

@media (width < 768px) {
  body[data-layout="page-sidebar"] {
    grid-template:
      "body-header" auto
      "body-main" 1fr
      "body-nav" auto
      "body-footer" auto
      / 1fr;
  }
}

/* --- Sidebar Right --- */
body[data-layout="page-sidebar-right"] {
  grid-template:
    "body-header body-header" auto
    "body-main   body-aside"  1fr
    "body-footer body-footer" auto
    / 1fr var(--sidebar-width, 280px);
}

/* --- Holy Grail --- */
body[data-layout="page-holy-grail"] {
  grid-template:
    "body-header body-header body-header" auto
    "body-nav    body-main   body-aside"  1fr
    "body-footer body-footer body-footer" auto
    / var(--sidebar-width, 280px) 1fr var(--sidebar-width, 280px);
}

@media (width < 1024px) {
  body[data-layout="page-holy-grail"] {
    grid-template:
      "body-header body-header" auto
      "body-nav    body-main"   1fr
      "body-footer body-footer" auto
      / var(--sidebar-width, 280px) 1fr;

    & > aside {
      display: none;
    }
  }
}

@media (width < 768px) {
  body[data-layout="page-holy-grail"] {
    grid-template:
      "body-header" auto
      "body-main" 1fr
      "body-footer" auto
      / 1fr;

    & > nav,
    & > aside {
      display: none;
    }
  }
}

/* --- :has() Adaptations --- */

/* Adjust when nav is absent */
body[data-layout="page-sidebar"]:not(:has(> nav)) {
  grid-template-columns: 1fr;
}

/* Adjust when aside present in main */
main:has(> aside) {
  display: grid;
  grid-template:
    "main-article main-aside" 1fr
    / 1fr var(--sidebar-width, 280px);
  gap: var(--layout-gap, 1rem);
}

@media (width < 768px) {
  main:has(> aside) {
    grid-template:
      "main-article" 1fr
      "main-aside" auto
      / 1fr;
  }
}
```

## Usage Example

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="vanilla-breeze.css">
  <link rel="stylesheet" href="vanilla-breeze/layout-grid-identity.css">
  <link rel="stylesheet" href="vanilla-breeze/layout-page.css">
</head>
<body data-layout="page-sidebar">
  <header>Site Header</header>
  <nav>Navigation</nav>
  <main>
    <article>Main Content</article>
    <aside>Article Sidebar</aside>
  </main>
  <footer>Site Footer</footer>
</body>
</html>
```

No classes needed - semantic elements find their grid areas automatically.

## Comparison with Current Approach

| Aspect | Current (layout-attributes) | Grid Identity |
|--------|---------------------------|---------------|
| Target | Any element | Semantic HTML only |
| Scope | Component layouts | Page layouts |
| Approach | Utility-first | Convention-based |
| Classes needed | None (data attrs) | None |
| Learning curve | Low | Low |
| Flexibility | High | Medium |

**They are complementary:**
- Use grid identity for page structure
- Use layout-attributes for component arrangement

## Integration Path

1. Create files as opt-in imports (not in main bundle)
2. Add demo page showing usage
3. Document in docs/layouts.html
4. Consider adding to main bundle later if adoption is high

## Testing Checklist

- [ ] Demo: page-stack layout
- [ ] Demo: page-sidebar layout
- [ ] Demo: page-holy-grail layout
- [ ] Demo: main with aside auto-grid
- [ ] Demo: missing nav adaptation via :has()
- [ ] Responsive breakpoints work correctly
- [ ] Works with existing layout-attributes inside main
- [ ] Print styles hide nav/aside appropriately

## Risks

1. **Conflict potential** - If user manually sets grid-area, identity rules may interfere
2. **Specificity** - Direct child selectors (`body > header`) are specific but can be overridden
3. **Learning** - Users must understand the naming convention (body-header, main-article, etc.)

## Success Criteria

- Page layouts achievable with zero custom CSS
- Works with standard semantic HTML
- Responsive without additional media queries in user code
- No conflicts with existing layout-attributes system
