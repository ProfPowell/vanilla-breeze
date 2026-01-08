# Spacer

## Description

Invisible layout utility that adds consistent vertical or horizontal space. Use sparingly—prefer component-level spacing with stack/cluster patterns when possible.

## Anatomy

- **spacer**: An empty element that takes up space

## States

| State | Description |
|-------|-------------|
| Default | Fixed space based on size |

## Variants

### Size

**Attribute:** `data-size`
**Values:** `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`

### Orientation

**Attribute:** `data-orientation`
**Values:** `vertical` (default), `horizontal`

### Responsive

**Attribute:** `data-responsive`
**Values:** Size reduces on mobile

## Baseline HTML

```html
<div class="spacer" data-size="lg"></div>
```

## Enhanced HTML

```html
<layout-spacer data-size="xl"></layout-spacer>
```

## CSS

```css
@layer layout {
  layout-spacer,
  .spacer {
    --spacer-size: var(--spacing-md, 1rem);

    display: block;
    flex-shrink: 0;
  }

  /* Vertical (default) - adds height */
  layout-spacer:not([data-orientation="horizontal"]),
  .spacer:not([data-orientation="horizontal"]) {
    height: var(--spacer-size);
    width: 100%;
  }

  /* Horizontal - adds width */
  layout-spacer[data-orientation="horizontal"],
  .spacer[data-orientation="horizontal"] {
    width: var(--spacer-size);
    height: auto;
    display: inline-block;
  }

  /* Size variants */
  layout-spacer[data-size="xs"],
  .spacer[data-size="xs"] {
    --spacer-size: var(--spacing-xs, 0.25rem);
  }

  layout-spacer[data-size="sm"],
  .spacer[data-size="sm"] {
    --spacer-size: var(--spacing-sm, 0.5rem);
  }

  layout-spacer[data-size="md"],
  .spacer[data-size="md"] {
    --spacer-size: var(--spacing-md, 1rem);
  }

  layout-spacer[data-size="lg"],
  .spacer[data-size="lg"] {
    --spacer-size: var(--spacing-lg, 1.5rem);
  }

  layout-spacer[data-size="xl"],
  .spacer[data-size="xl"] {
    --spacer-size: var(--spacing-xl, 2rem);
  }

  layout-spacer[data-size="2xl"],
  .spacer[data-size="2xl"] {
    --spacer-size: var(--spacing-2xl, 3rem);
  }

  layout-spacer[data-size="3xl"],
  .spacer[data-size="3xl"] {
    --spacer-size: var(--spacing-3xl, 4rem);
  }

  /* Responsive - reduces on mobile */
  @media (max-width: 47.999rem) {
    layout-spacer[data-responsive],
    .spacer[data-responsive] {
      --spacer-size: calc(var(--spacer-size) * 0.6);
    }
  }

  /* Flex spacer - expands to fill available space */
  layout-spacer[data-flex],
  .spacer[data-flex] {
    flex: 1;
    min-height: var(--spacer-size);
  }

  layout-spacer[data-orientation="horizontal"][data-flex],
  .spacer[data-orientation="horizontal"][data-flex] {
    min-width: var(--spacer-size);
    min-height: auto;
  }
}
```

## Accessibility

- **Hidden**: Purely decorative, no semantic meaning
- **Aria Hidden**: Should have `aria-hidden="true"` if using custom element

## Examples

### Between Sections

```html
<section class="hero">
  <h1>Welcome</h1>
</section>

<layout-spacer data-size="2xl"></layout-spacer>

<section class="features">
  <h2>Features</h2>
</section>
```

### Responsive Spacing

```html
<section class="content">
  <h2>Our Process</h2>
</section>

<layout-spacer data-size="3xl" data-responsive></layout-spacer>

<section class="cta">
  <h2>Get Started</h2>
</section>
```

### Horizontal Spacing (Inline)

```html
<div class="inline-items">
  <span>Item 1</span>
  <layout-spacer data-size="md" data-orientation="horizontal"></layout-spacer>
  <span>Item 2</span>
</div>
```

### Flex Spacer (Push to Edge)

```html
<header style="display: flex; align-items: center;">
  <a href="/" class="logo">Brand</a>
  <nav>...</nav>
  <layout-spacer data-flex data-orientation="horizontal"></layout-spacer>
  <button>Login</button>
</header>
```

### Page Footer Spacing

```html
<main>
  <!-- Page content -->
</main>

<layout-spacer data-size="3xl"></layout-spacer>

<footer>
  <!-- Footer content -->
</footer>
```

## When to Use

**Use Spacer When:**
- Adding space between major page sections
- Creating breathing room that isn't tied to a specific component
- Need responsive spacing that changes based on viewport

**Prefer Alternatives When:**
- Spacing within a component → Use `stack` or `cluster`
- Margin/padding on existing elements → Use CSS directly
- Content separation with visual indication → Use `divider`

## Anti-Patterns

```html
<!-- ❌ Don't: Multiple spacers for small gaps -->
<div>
  <p>Text</p>
  <layout-spacer data-size="sm"></layout-spacer>
  <p>More text</p>
  <layout-spacer data-size="sm"></layout-spacer>
  <p>Even more</p>
</div>

<!-- ✅ Do: Use stack for consistent spacing -->
<layout-stack data-gap="sm">
  <p>Text</p>
  <p>More text</p>
  <p>Even more</p>
</layout-stack>
```

## Related Patterns

- [stack](./stack.md)
- [divider](./divider.md)
- [content-width](./content-width.md)
