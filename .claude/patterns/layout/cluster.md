# Cluster

## Description

Horizontal layout utility for grouping inline elements with consistent spacing and wrapping. Ideal for tags, buttons, navigation items, and any horizontal grouping of items.

## Anatomy

- **container**: The cluster wrapper
- **items**: Inline or inline-block children

## States

| State | Description |
|-------|-------------|
| Default | Horizontal items with wrapping |

## Variants

### Gap

**Attribute:** `data-gap`
**Values:** `none`, `xs`, `sm`, `md`, `lg`, `xl`

### Justify

**Attribute:** `data-justify`
**Values:** `start`, `center`, `end`, `between`, `around`

### Align

**Attribute:** `data-align`
**Values:** `start`, `center`, `end`, `baseline`, `stretch`

### Wrap

**Attribute:** `data-wrap`
**Values:** `wrap` (default), `nowrap`

## Baseline HTML

```html
<div class="cluster">
  <span class="tag">HTML</span>
  <span class="tag">CSS</span>
  <span class="tag">JavaScript</span>
</div>
```

## Enhanced HTML

```html
<layout-cluster data-gap="sm" data-justify="start" data-align="center">
  <span class="tag">HTML</span>
  <span class="tag">CSS</span>
  <span class="tag">JavaScript</span>
  <span class="tag">React</span>
</layout-cluster>
```

## CSS

```css
@layer layout {
  layout-cluster,
  .cluster {
    --cluster-gap: var(--spacing-sm, 0.5rem);
    --cluster-justify: flex-start;
    --cluster-align: center;

    display: flex;
    flex-wrap: wrap;
    gap: var(--cluster-gap);
    justify-content: var(--cluster-justify);
    align-items: var(--cluster-align);
  }

  /* Gap variants */
  layout-cluster[data-gap="none"],
  .cluster[data-gap="none"] {
    --cluster-gap: 0;
  }

  layout-cluster[data-gap="xs"],
  .cluster[data-gap="xs"] {
    --cluster-gap: var(--spacing-xs, 0.25rem);
  }

  layout-cluster[data-gap="sm"],
  .cluster[data-gap="sm"] {
    --cluster-gap: var(--spacing-sm, 0.5rem);
  }

  layout-cluster[data-gap="md"],
  .cluster[data-gap="md"] {
    --cluster-gap: var(--spacing-md, 1rem);
  }

  layout-cluster[data-gap="lg"],
  .cluster[data-gap="lg"] {
    --cluster-gap: var(--spacing-lg, 1.5rem);
  }

  layout-cluster[data-gap="xl"],
  .cluster[data-gap="xl"] {
    --cluster-gap: var(--spacing-xl, 2rem);
  }

  /* Justify variants */
  layout-cluster[data-justify="start"],
  .cluster[data-justify="start"] {
    --cluster-justify: flex-start;
  }

  layout-cluster[data-justify="center"],
  .cluster[data-justify="center"] {
    --cluster-justify: center;
  }

  layout-cluster[data-justify="end"],
  .cluster[data-justify="end"] {
    --cluster-justify: flex-end;
  }

  layout-cluster[data-justify="between"],
  .cluster[data-justify="between"] {
    --cluster-justify: space-between;
  }

  layout-cluster[data-justify="around"],
  .cluster[data-justify="around"] {
    --cluster-justify: space-around;
  }

  /* Align variants */
  layout-cluster[data-align="start"],
  .cluster[data-align="start"] {
    --cluster-align: flex-start;
  }

  layout-cluster[data-align="center"],
  .cluster[data-align="center"] {
    --cluster-align: center;
  }

  layout-cluster[data-align="end"],
  .cluster[data-align="end"] {
    --cluster-align: flex-end;
  }

  layout-cluster[data-align="baseline"],
  .cluster[data-align="baseline"] {
    --cluster-align: baseline;
  }

  layout-cluster[data-align="stretch"],
  .cluster[data-align="stretch"] {
    --cluster-align: stretch;
  }

  /* No wrap */
  layout-cluster[data-wrap="nowrap"],
  .cluster[data-wrap="nowrap"] {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  /* Common item styling within clusters */
  layout-cluster > *,
  .cluster > * {
    flex-shrink: 0;
  }
}
```

## Accessibility

- **Semantic Neutral**: Pure layout utility
- **Overflow**: Scrollable when nowrap to maintain access to all items

## Examples

### Tag List

```html
<layout-cluster data-gap="xs">
  <span class="tag">Design</span>
  <span class="tag">Development</span>
  <span class="tag">Marketing</span>
  <span class="tag">Strategy</span>
</layout-cluster>
```

### Button Group

```html
<layout-cluster data-gap="sm" data-justify="end">
  <button data-button="secondary">Cancel</button>
  <button data-button="primary">Save Changes</button>
</layout-cluster>
```

### Social Links

```html
<layout-cluster data-gap="md" data-justify="center">
  <a href="https://twitter.com" aria-label="Twitter">
    <x-icon name="twitter"></x-icon>
  </a>
  <a href="https://github.com" aria-label="GitHub">
    <x-icon name="github"></x-icon>
  </a>
  <a href="https://linkedin.com" aria-label="LinkedIn">
    <x-icon name="linkedin"></x-icon>
  </a>
</layout-cluster>
```

### Header with Logo and Nav

```html
<header>
  <layout-cluster data-justify="between" data-align="center">
    <a href="/" class="logo">Brand</a>
    <nav>
      <layout-cluster data-gap="lg">
        <a href="/about">About</a>
        <a href="/products">Products</a>
        <a href="/contact">Contact</a>
      </layout-cluster>
    </nav>
  </layout-cluster>
</header>
```

### Filter Pills

```html
<layout-cluster data-gap="sm" data-wrap="nowrap">
  <button class="pill" data-active>All</button>
  <button class="pill">Active</button>
  <button class="pill">Completed</button>
  <button class="pill">Archived</button>
</layout-cluster>
```

### Card Meta (Icon + Text Pairs)

```html
<layout-cluster data-gap="md" data-align="center">
  <span class="meta-item">
    <x-icon name="calendar"></x-icon>
    Jan 15, 2025
  </span>
  <span class="meta-item">
    <x-icon name="user"></x-icon>
    John Doe
  </span>
  <span class="meta-item">
    <x-icon name="clock"></x-icon>
    5 min read
  </span>
</layout-cluster>
```

### Centered Actions

```html
<layout-cluster data-gap="md" data-justify="center">
  <a href="/signup" data-button="primary">Get Started</a>
  <a href="/demo" data-button="secondary">Watch Demo</a>
</layout-cluster>
```

## Related Patterns

- [stack](./stack.md)
- [card-grid](./card-grid.md)
- [site-header](../navigation/site-header.md)
