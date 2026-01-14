# Card

## Description

Versatile content container for displaying grouped information. Cards can contain text, images, and actions. The base pattern for product-card, blog-card, and other specialized cards.

## Anatomy

- **container**: Card wrapper element
- **media**: Optional image or video header
- **body**: Main content area
- **title**: Card heading
- **description**: Supporting text
- **meta**: Optional metadata (date, category, etc.)
- **actions**: Optional action buttons or links

## States

| State | Description |
|-------|-------------|
| Default | Standard appearance |
| Hover | Elevated with shadow |
| Focus | Focus ring visible |
| Disabled | Reduced opacity, non-interactive |

## Variants

### Style

**Attribute:** `data-style`
**Values:** `default`, `outlined`, `elevated`, `flat`

### Direction

**Attribute:** `data-direction`
**Values:** `vertical`, `horizontal`

### Clickable

**Attribute:** `data-clickable`
**Values:** (boolean attribute)

## Baseline HTML

```html
<article class="card">
  <img src="image.jpg" alt="Card image" />
  <div>
    <h3>Card Title</h3>
    <p>Card description goes here.</p>
    <a href="/link">Learn more</a>
  </div>
</article>
```

## Enhanced HTML

```html
<content-card data-style="elevated" data-clickable>
  <a href="/article/example" data-card-link>
    <picture data-media>
      <source srcset="image.avif" type="image/avif" />
      <img src="image.jpg" alt="Article preview" loading="lazy" />
    </picture>

    <div data-body>
      <span data-meta>Category • 5 min read</span>
      <h3>Card Title</h3>
      <p>Brief description of the card content that provides context.</p>
    </div>
  </a>
</content-card>
```

## CSS

```css
@layer components {
  content-card {
    display: block;
    background: var(--surface);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: box-shadow var(--transition-fast), transform var(--transition-fast);

    /* Card link wrapper */
    & [data-card-link] {
      display: flex;
      flex-direction: column;
      height: 100%;
      text-decoration: none;
      color: inherit;
    }

    /* Media area */
    & [data-media] {
      aspect-ratio: 16 / 9;
      overflow: hidden;

      & img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--transition-base);
      }
    }

    /* Body area */
    & [data-body] {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--size-xs);
      padding: var(--size-l);
    }

    /* Meta text */
    & [data-meta] {
      font-size: var(--text-sm);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Title */
    & h3 {
      font-size: var(--text-lg);
      font-weight: var(--font-weight-semibold);
      margin: 0;
      line-height: 1.3;
    }

    /* Description */
    & p {
      color: var(--text-muted);
      margin: 0;
      line-height: 1.6;
    }

    /* Actions */
    & [data-actions] {
      display: flex;
      gap: var(--size-xs);
      margin-block-start: auto;
      padding-block-start: var(--size-m);
    }

    /* Style variants */
    &[data-style="default"] {
      border: 1px solid var(--border);
    }

    &[data-style="outlined"] {
      border: 2px solid var(--border);
      background: transparent;
    }

    &[data-style="elevated"] {
      box-shadow: var(--shadow-md);
    }

    &[data-style="flat"] {
      background: var(--surface-alt);
    }

    /* Clickable card */
    &[data-clickable] {
      cursor: pointer;

      &:hover {
        box-shadow: var(--shadow-lg);
        transform: translateY(-4px);

        & [data-media] img {
          transform: scale(1.05);
        }
      }

      &:focus-within {
        outline: 2px solid var(--focus-ring);
        outline-offset: 2px;
      }
    }

    /* Horizontal layout */
    &[data-direction="horizontal"] {
      & [data-card-link] {
        flex-direction: row;
      }

      & [data-media] {
        flex: 0 0 40%;
        aspect-ratio: 1;
      }
    }

    /* Disabled state */
    &[data-disabled] {
      opacity: 0.6;
      pointer-events: none;
    }
  }

  /* Responsive horizontal cards */
  @media (max-width: 480px) {
    content-card[data-direction="horizontal"] {
      & [data-card-link] {
        flex-direction: column;
      }

      & [data-media] {
        flex: none;
        aspect-ratio: 16 / 9;
      }
    }
  }
}
```

## Accessibility

- **Semantic Structure**: Uses `<article>` as container
- **Link Purpose**: Card link wraps content for single click target
- **Focus Visible**: Clear focus indicator on interactive cards
- **Image Alt**: Images have descriptive alt text

## Examples

### Basic Card

```html
<content-card data-style="default">
  <a href="/item" data-card-link>
    <picture data-media>
      <img src="image.jpg" alt="Preview" />
    </picture>
    <div data-body>
      <h3>Card Title</h3>
      <p>Description text.</p>
    </div>
  </a>
</content-card>
```

### Elevated Clickable Card

```html
<content-card data-style="elevated" data-clickable>
  <a href="/article" data-card-link>
    <picture data-media>
      <img src="article.jpg" alt="Article preview" />
    </picture>
    <div data-body>
      <span data-meta>News • Today</span>
      <h3>Breaking News Title</h3>
      <p>Summary of the article content.</p>
    </div>
  </a>
</content-card>
```

### Horizontal Card

```html
<content-card data-style="outlined" data-direction="horizontal">
  <a href="/product" data-card-link>
    <picture data-media>
      <img src="product.jpg" alt="Product" />
    </picture>
    <div data-body>
      <h3>Product Name</h3>
      <p>Product description.</p>
    </div>
  </a>
</content-card>
```

### Card with Actions

```html
<content-card data-style="elevated">
  <picture data-media>
    <img src="image.jpg" alt="Preview" />
  </picture>
  <div data-body>
    <h3>Card Title</h3>
    <p>Description text.</p>
    <div data-actions>
      <button data-button="primary">Action</button>
      <button data-button="secondary">Secondary</button>
    </div>
  </div>
</content-card>
```

## Related Patterns

- [product-card](./product-card.md)
- [blog-card](./blog-card.md)
- [feature-grid](./feature-grid.md)
