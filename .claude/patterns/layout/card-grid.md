# Card Grid

## Description

Responsive grid layout for displaying cards or similar content blocks. Uses CSS Grid's `auto-fit` for automatic column management based on available space.

## Anatomy

- **container**: The grid wrapper
- **items**: Card or content block children

## States

| State | Description |
|-------|-------------|
| Default | Responsive columns based on min-width |

## Variants

### Columns

**Attribute:** `data-columns`
**Values:** `auto`, `2`, `3`, `4`, `5`, `6`

### Min Width (for auto)

**Attribute:** `data-min`
**Values:** `small` (12rem), `default` (16rem), `large` (20rem)

### Gap

**Attribute:** `data-gap`
**Values:** `none`, `small`, `default`, `large`

### Alignment

**Attribute:** `data-align`
**Values:** `start`, `center`, `stretch`

## Baseline HTML

```html
<div class="card-grid">
  <article class="card">Card 1</article>
  <article class="card">Card 2</article>
  <article class="card">Card 3</article>
</div>
```

## Enhanced HTML

```html
<card-grid data-columns="auto" data-min="default" data-gap="default">
  <article class="card">Card 1</article>
  <article class="card">Card 2</article>
  <article class="card">Card 3</article>
  <article class="card">Card 4</article>
</card-grid>
```

## CSS

```css
@layer layout {
  card-grid,
  .card-grid {
    --card-grid-min: 16rem;
    --card-grid-gap: var(--spacing-lg, 1.5rem);

    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(var(--card-grid-min), 100%), 1fr));
    gap: var(--card-grid-gap);
  }

  /* Fixed column counts */
  card-grid[data-columns="2"],
  .card-grid[data-columns="2"] {
    grid-template-columns: repeat(2, 1fr);
  }

  card-grid[data-columns="3"],
  .card-grid[data-columns="3"] {
    grid-template-columns: repeat(3, 1fr);
  }

  card-grid[data-columns="4"],
  .card-grid[data-columns="4"] {
    grid-template-columns: repeat(4, 1fr);
  }

  card-grid[data-columns="5"],
  .card-grid[data-columns="5"] {
    grid-template-columns: repeat(5, 1fr);
  }

  card-grid[data-columns="6"],
  .card-grid[data-columns="6"] {
    grid-template-columns: repeat(6, 1fr);
  }

  /* Responsive fixed columns */
  @media (max-width: 63.999rem) {
    card-grid[data-columns="4"],
    card-grid[data-columns="5"],
    card-grid[data-columns="6"],
    .card-grid[data-columns="4"],
    .card-grid[data-columns="5"],
    .card-grid[data-columns="6"] {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 47.999rem) {
    card-grid[data-columns="3"],
    card-grid[data-columns="4"],
    card-grid[data-columns="5"],
    card-grid[data-columns="6"],
    .card-grid[data-columns="3"],
    .card-grid[data-columns="4"],
    .card-grid[data-columns="5"],
    .card-grid[data-columns="6"] {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 29.999rem) {
    card-grid[data-columns],
    .card-grid[data-columns] {
      grid-template-columns: 1fr;
    }
  }

  /* Min width variants for auto-fit */
  card-grid[data-min="small"],
  .card-grid[data-min="small"] {
    --card-grid-min: 12rem;
  }

  card-grid[data-min="large"],
  .card-grid[data-min="large"] {
    --card-grid-min: 20rem;
  }

  /* Gap variants */
  card-grid[data-gap="none"],
  .card-grid[data-gap="none"] {
    --card-grid-gap: 0;
  }

  card-grid[data-gap="small"],
  .card-grid[data-gap="small"] {
    --card-grid-gap: var(--spacing-md, 1rem);
  }

  card-grid[data-gap="large"],
  .card-grid[data-gap="large"] {
    --card-grid-gap: var(--spacing-xl, 2rem);
  }

  /* Alignment variants */
  card-grid[data-align="start"],
  .card-grid[data-align="start"] {
    align-items: start;
  }

  card-grid[data-align="center"],
  .card-grid[data-align="center"] {
    align-items: center;
  }

  card-grid[data-align="stretch"],
  .card-grid[data-align="stretch"] {
    align-items: stretch;
  }

  /* Equal height cards with stretch */
  card-grid[data-align="stretch"] > *,
  .card-grid[data-align="stretch"] > * {
    height: 100%;
  }
}
```

## Accessibility

- **Semantic Content**: Children should be semantic elements (articles, sections)
- **Order**: Visual order matches DOM order

## Examples

### Auto-Fit Product Grid

```html
<card-grid data-columns="auto" data-min="default" data-gap="default">
  <product-card>...</product-card>
  <product-card>...</product-card>
  <product-card>...</product-card>
  <product-card>...</product-card>
  <product-card>...</product-card>
</card-grid>
```

### Fixed 3-Column Blog Grid

```html
<card-grid data-columns="3" data-gap="large" data-align="stretch">
  <blog-card>...</blog-card>
  <blog-card>...</blog-card>
  <blog-card>...</blog-card>
</card-grid>
```

### Feature Icons Grid

```html
<card-grid data-columns="4" data-gap="default" data-align="start">
  <div class="feature">
    <x-icon name="zap"></x-icon>
    <h3>Fast</h3>
    <p>Lightning quick performance</p>
  </div>
  <!-- More features -->
</card-grid>
```

### Small Cards (Tight Grid)

```html
<card-grid data-min="small" data-gap="small">
  <div class="thumbnail">...</div>
  <div class="thumbnail">...</div>
  <div class="thumbnail">...</div>
</card-grid>
```

## Related Patterns

- [card](../content/card.md)
- [product-card](../content/product-card.md)
- [feature-grid](../content/feature-grid.md)
- [masonry](./masonry.md)
