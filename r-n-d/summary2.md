# Future CSS: New Mental Models for Layout Systems

## The Big Shifts

### 1. From Selector-Based to Value-Based Logic

**Current model:** Different selectors apply different values
```css
body[data-layout="a"] { grid-template: ...; }
body[data-layout="b"] { grid-template: ...; }
```

**Future model:** Single property with conditional logic
```css
body {
  grid-template: if(
    style(--layout: a): ...;
    style(--layout: b): ...;
  );
}
```

**Why it matters:**
- Fewer rules, less specificity management
- Logic is co-located with the property
- Easier to trace what value applies

---

### 2. From Media Query Blocks to Inline Responsiveness

**Current:**
```css
.element { width: 100%; }
@media (min-width: 768px) { .element { width: 50%; } }
@media (min-width: 1024px) { .element { width: 33%; } }
```

**Future:**
```css
.element {
  width: if(
    media(width < 768px): 100%;
    media(width < 1024px): 50%;
    default: 33%
  );
}
```

**Why it matters:**
- Responsive behavior defined at point of use
- No hunting through media query blocks
- Composes naturally with other conditions

---

### 3. From Utility Classes to Declarative Attributes

**Current (Tailwind-style):**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

**Future with extended attr():**
```html
<div data-cols="1" data-cols-md="2" data-cols-lg="3" data-gap="1rem">
```
```css
[data-cols] {
  display: grid;
  grid-template-columns: repeat(attr(data-cols integer), 1fr);
  gap: attr(data-gap length, 1rem);
}
```

**Why it matters:**
- HTML becomes more semantic (data describes intent)
- CSS is generic, HTML is specific
- No build step for utility generation

---

### 4. From Repeated Patterns to True Mixins

**Current:** Copy-paste or preprocessor
```css
.card { display: flex; flex-direction: column; gap: 1rem; }
.panel { display: flex; flex-direction: column; gap: 1rem; }
```

**Future:**
```css
@mixin --flex-stack {
  display: flex;
  flex-direction: column;
  gap: var(--stack-gap, 1rem);
}

.card { @apply --flex-stack; }
.panel { @apply --flex-stack; --stack-gap: 0.5rem; }
```

**Why it matters:**
- Native reuse without preprocessors
- Customizable via CSS custom properties
- Works with cascade and specificity

---

## New Patterns Enabled

### Pattern: Self-Describing Layouts
```html
<body 
  data-layout="grid"
  data-template="
    'header header' auto
    'nav    main'   1fr
    'footer footer' auto
  "
  data-cols="200px 1fr"
  data-gap="1rem"
>
```
```css
[data-layout="grid"] {
  display: grid;
  grid-template: attr(data-template string);
  grid-template-columns: attr(data-cols string);
  gap: attr(data-gap length, 0);
}
```

The HTML **is** the layout specification. CSS just interprets it.

---

### Pattern: Stateful Components Without JavaScript
```css
details {
  --open: if(open: 1; default: 0);
  
  & > summary + * {
    height: calc(var(--open) * auto);
    opacity: var(--open);
    transition: opacity 0.2s;
  }
}

dialog {
  --shown: if(open: 1; default: 0);
  opacity: var(--shown);
  transform: scale(calc(0.9 + var(--shown) * 0.1));
}
```

CSS reads element state directly, no class toggling.

---

### Pattern: Computed Layout Tokens
```css
:root {
  --viewport-category: if(
    media(width < 640px): xs;
    media(width < 768px): sm;
    media(width < 1024px): md;
    media(width < 1280px): lg;
    default: xl
  );
  
  --layout-cols: if(
    style(--viewport-category: xs): 1;
    style(--viewport-category: sm): 2;
    style(--viewport-category: md): 3;
    default: 4
  );
  
  --layout-gap: if(
    style(--viewport-category: xs): var(--gap-sm);
    style(--viewport-category: sm): var(--gap-md);
    default: var(--gap-lg)
  );
}

/* Components just use the tokens */
.grid {
  grid-template-columns: repeat(var(--layout-cols), 1fr);
  gap: var(--layout-gap);
}
```

Centralized responsive logic, decentralized consumption.

---

### Pattern: Container-Aware Grid Areas
```css
main {
  container-name: content-area;
  
  & > article {
    grid-area: if(
      container(width > 800px): main-article;
      default: content
    );
  }
  
  & > aside {
    grid-area: if(
      container(width > 800px): main-aside;
      default: content
    );
    order: if(container(width > 800px): 0; default: 1);
  }
}
```

Grid areas reassign based on container size.

---

## The Elegant Composition

Putting it all together—what Vanilla Breeze could look like:
```css
/* === Mixins === */
@mixin --semantic-grid-area(--parent) {
  &:is(header) { grid-area: attr(data-grid-area ident, var(--parent)-header); }
  &:is(nav) { grid-area: attr(data-grid-area ident, var(--parent)-nav); }
  &:is(main) { grid-area: attr(data-grid-area ident, var(--parent)-main); }
  &:is(article) { grid-area: attr(data-grid-area ident, var(--parent)-article); }
  &:is(aside) { grid-area: attr(data-grid-area ident, var(--parent)-aside); }
  &:is(section) { grid-area: attr(data-grid-area ident, var(--parent)-section); }
  &:is(footer) { grid-area: attr(data-grid-area ident, var(--parent)-footer); }
}

@mixin --responsive-layout(--mobile, --tablet, --desktop) {
  display: grid;
  gap: var(--layout-gap);
  
  grid-template: if(
    media(width < 768px): var(--mobile);
    media(width < 1024px): var(--tablet);
    default: var(--desktop)
  );
}

/* === Application === */
body[data-layout] {
  @apply --responsive-layout(
    --mobile: var(--tpl-stack),
    --tablet: var(--tpl-sidebar),
    --desktop: attr(data-template string, var(--tpl-sidebar))
  );
  
  & > * {
    @apply --semantic-grid-area(--parent: body);
  }
}

main[data-layout] {
  @apply --responsive-layout(
    --mobile: "main-header" auto "main-article" 1fr / 1fr,
    --tablet: attr(data-template string),
    --desktop: attr(data-template string)
  );
  
  & > * {
    @apply --semantic-grid-area(--parent: main);
  }
}
```

**Result:** ~30 lines of CSS that handles:
- Semantic grid area assignment
- Responsive breakpoints
- Custom template overrides via HTML attributes
- Nested layout containers

---

## Timeline Reality Check

| Feature | Status | Expected |
|---------|--------|----------|
| CSS Nesting | ✅ Baseline 2024 | Now |
| `@property` | ✅ Baseline 2024 | Now |
| `:has()` | ✅ Baseline 2024 | Now |
| Container Queries | ✅ Baseline 2024 | Now |
| `style()` queries | 🟡 Chrome 111+ | 2025 |
| `if()` | 📝 Draft | 2025-2026 |
| CSS Mixins | 📝 Proposal | 2026+ |
| Extended `attr()` | 📝 Draft | 2026+ |
| `random()` | 📝 Early proposal | 2027+ |

---

## Pragmatic Approach

**Use now:**
- `@layer`, `@property`, nesting, `:has()`, container queries
- Custom properties for everything

**Polyfill/progressive enhance:**
- `style()` queries (limited support)

**Design for:**
- `if()` - structure your custom properties to be ready
- Extended `attr()` - use data attributes semantically now

**Wait on:**
- Mixins, `random()`, `sibling-index()`