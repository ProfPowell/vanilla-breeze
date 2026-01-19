# Clean Layout Research

Using native HTML elements with CSS grid named regions for all layouts.

## Core Concept

A single `data-layout` attribute on `body` (or container) automatically assigns CSS grid areas to semantic HTML children like `header`, `main`, `footer`, `nav`, `aside`. No attributes needed on children - CSS selectors like `body > header` target elements directly.

## Current State

The existing POC (`docs/examples/demos/layout-attributes.html`) demonstrates:
- `data-layout="stack|cluster|grid|page-stack|holy-grail|sidebar"`
- Comparison showing custom elements vs semantic HTML + attributes
- Holy grail uses named grid areas targeting `> header`, `> nav`, `> main`, `> aside`, `> footer`

## All Layouts Achievable?

| Layout | Zero Child Attrs | Mechanism | Notes |
|--------|-----------------|-----------|-------|
| Stack | YES | Flexbox column | `> main` gets flex:1 for sticky footer |
| Cluster | YES | Flexbox wrap | Any children |
| Grid | YES | Auto-fit minmax | Any children |
| Page Stack | YES | `> main { flex: 1 }` | Semantic targeting |
| Holy Grail | YES | Named grid areas | `> header/nav/main/aside/footer` |
| Sidebar | YES | Flexbox wrap | `:first-child`/`:last-child` |
| Dashboard | YES* | Named grid areas | *Mobile nav needs JS toggle |
| Split | YES | Grid fr units | Two children |
| Center | YES | Max-width + margin | Any container |
| Cover | **NO** | Flex column | Needs `data-principal` |
| Switcher | YES | Flex basis hack | Math-based responsive |

**Key finding**: 10 of 11 layouts work with zero child attributes. Only Cover needs one child attribute to identify the principal element.

## CSS Selector Strategies

### Direct Child Selectors
```css
[data-layout="holy-grail"] > header { grid-area: header; }
[data-layout="holy-grail"] > nav    { grid-area: nav; }
[data-layout="holy-grail"] > main   { grid-area: main; }
[data-layout="holy-grail"] > aside  { grid-area: aside; }
[data-layout="holy-grail"] > footer { grid-area: footer; }
```

### Sibling Selectors for Sidebar Detection
```css
/* Nav before main = sidebar on left */
[data-layout="sidebar"]:has(> nav + main) { ... }

/* Main before aside = sidebar on right */
[data-layout="sidebar"]:has(> main + aside) { ... }
```

### Position-Based for Generic Layouts
```css
[data-layout="sidebar"] > :first-child { flex-basis: 15rem; }
[data-layout="sidebar"] > :last-child  { flex-grow: 999; min-inline-size: 50%; }
```

### :has() for Conditional Layouts
```css
/* Holy grail without aside becomes two-column */
[data-layout="holy-grail"]:not(:has(> aside)) {
  grid-template-areas:
    "header header"
    "nav    main"
    "footer footer";
  grid-template-columns: 15rem 1fr;
}
```

## Complete Layout CSS

### Page Stack (Sticky Footer)
```css
[data-layout="page-stack"] {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

[data-layout="page-stack"] > main {
  flex: 1;
}
```

HTML:
```html
<body data-layout="page-stack">
  <header>...</header>
  <main>...</main>
  <footer>...</footer>
</body>
```

### Holy Grail (3-Column)
```css
[data-layout="holy-grail"] {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  grid-template-columns: minmax(10rem, 15rem) 1fr minmax(10rem, 20rem);
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
}

[data-layout="holy-grail"] > header { grid-area: header; }
[data-layout="holy-grail"] > nav    { grid-area: nav; }
[data-layout="holy-grail"] > main   { grid-area: main; }
[data-layout="holy-grail"] > aside  { grid-area: aside; }
[data-layout="holy-grail"] > footer { grid-area: footer; }

@media (max-width: 60rem) {
  [data-layout="holy-grail"] {
    grid-template-areas: "header" "nav" "main" "aside" "footer";
    grid-template-columns: 1fr;
  }
}
```

HTML:
```html
<body data-layout="holy-grail">
  <header>...</header>
  <nav>...</nav>
  <main>...</main>
  <aside>...</aside>
  <footer>...</footer>
</body>
```

### Dashboard (App Shell)
```css
[data-layout="dashboard"] {
  display: grid;
  grid-template-areas:
    "header header"
    "nav    main";
  grid-template-columns: var(--sidebar-width, 16rem) 1fr;
  grid-template-rows: auto 1fr;
  min-height: 100dvh;
}

[data-layout="dashboard"] > header {
  grid-area: header;
  position: sticky;
  top: 0;
}

[data-layout="dashboard"] > nav {
  grid-area: nav;
  position: sticky;
  top: var(--header-height, 3.5rem);
  height: calc(100dvh - var(--header-height, 3.5rem));
  overflow-y: auto;
}

[data-layout="dashboard"] > main {
  grid-area: main;
}

@media (max-width: 48rem) {
  [data-layout="dashboard"] {
    grid-template-areas: "header" "main";
    grid-template-columns: 1fr;
  }

  [data-layout="dashboard"] > nav {
    position: fixed;
    transform: translateX(-100%);
  }

  [data-layout="dashboard"][data-nav-open] > nav {
    transform: translateX(0);
  }
}
```

### Sidebar (Two-Column Flex)
```css
[data-layout="sidebar"] {
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-m);
}

[data-layout="sidebar"] > :first-child {
  flex-basis: 15rem;
  flex-grow: 1;
}

[data-layout="sidebar"] > :last-child {
  flex-basis: 0;
  flex-grow: 999;
  min-inline-size: 50%;
}

[data-layout="sidebar"][data-side="end"] {
  flex-direction: row-reverse;
}
```

### Split (Ratio Grid)
```css
[data-layout="split"] {
  display: grid;
  grid-template-columns: var(--ratio, 1fr 1fr);
  gap: var(--size-xl);
  align-items: center;
}

[data-layout="split"][data-ratio="2:1"] { --ratio: 2fr 1fr; }
[data-layout="split"][data-ratio="1:2"] { --ratio: 1fr 2fr; }
[data-layout="split"][data-ratio="golden"] { --ratio: 1.618fr 1fr; }

@media (max-width: 48rem) {
  [data-layout="split"] {
    grid-template-columns: 1fr;
  }
}
```

### Center
```css
[data-layout="center"] {
  max-inline-size: var(--content-width, 60rem);
  margin-inline: auto;
  padding-inline: var(--grid-margin);
}

[data-layout="center"][data-max="narrow"] { --content-width: 45rem; }
[data-layout="center"][data-max="prose"]  { --content-width: 65ch; }
[data-layout="center"][data-max="wide"]   { --content-width: 80rem; }
```

### Cover (Requires Child Attr)
```css
[data-layout="cover"] {
  display: flex;
  flex-direction: column;
  min-block-size: 100dvh;
  padding: var(--size-m);
}

[data-layout="cover"] > header {
  margin-block-end: auto;
}

[data-layout="cover"] > [data-principal] {
  margin-block: auto;
}

[data-layout="cover"] > footer {
  margin-block-start: auto;
}

/* Single child auto-centers */
[data-layout="cover"] > :only-child {
  margin-block: auto;
}
```

### Switcher (Container-Query-like)
```css
[data-layout="switcher"] {
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-m);
}

[data-layout="switcher"] > * {
  flex-grow: 1;
  flex-basis: calc((var(--threshold, 30rem) - 100%) * 999);
}

[data-layout="switcher"][data-threshold="25rem"] { --threshold: 25rem; }
[data-layout="switcher"][data-threshold="35rem"] { --threshold: 35rem; }
```

## Advantages Over Custom Elements

| Aspect | Custom Elements | Semantic + Attributes |
|--------|----------------|----------------------|
| HTML semantics | Generic wrappers | Native article/section/nav |
| DOM nodes | Extra wrapper | No extra nodes |
| DevTools | Shows `<layout-stack>` | Shows `<article>` |
| Composability | Nested elements | Single element, multiple attrs |
| Accessibility | Neutral | Built-in landmarks |
| Learning curve | New elements | Standard HTML |

## Separation of Concerns

The attribute approach provides better separation:

**Structure (HTML)**:
```html
<body>
  <header>...</header>
  <nav>...</nav>
  <main>...</main>
  <aside>...</aside>
  <footer>...</footer>
</body>
```

**Layout (single attribute)**:
```html
<body data-layout="holy-grail">
```

**Styling (CSS)**:
```css
[data-layout="holy-grail"] { ... }
```

The HTML structure is semantic and meaningful regardless of styling. The `data-layout` attribute is purely presentational control - change it and the same HTML displays differently.

## Recommendation

**Hybrid approach**:
1. Use semantic HTML + `data-layout` for page-level layouts (page-stack, holy-grail, dashboard)
2. Use `data-layout` on any container for component-level layouts (stack, cluster, grid)
3. Keep custom elements as optional progressive enhancement
4. Accept one child attribute (`data-principal`) for Cover layout only

This achieves the cleanest separation of concerns while maintaining full layout capability.

## Implementation Priority

1. **Phase 1**: Stack, Cluster, Grid, Center (highest usage, simplest)
2. **Phase 2**: Page Stack, Split, Sidebar (common patterns)
3. **Phase 3**: Holy Grail, Dashboard (complex grid)
4. **Phase 4**: Cover, Switcher (special cases)

## Browser Support

All techniques have excellent support:
- CSS Grid named areas: 96%+
- `:has()` selector: 92%+ (Chrome 105+, Safari 15.4+, Firefox 121+)
- Flexbox wrap: 99%+
- CSS custom properties: 97%+

## Open Questions

1. Should `data-layout` default to something on `<body>` if not specified?
2. How to handle nested layouts (e.g., sidebar within main)?
3. Should we provide utility layouts like `data-layout="prose"` for typography?
4. How do we handle the Cover principal without child attributes?