# Product Card

## Description

E-commerce product display card with image, title, price, and purchase action. Optimized for product listings and grids with support for sale prices, ratings, and quick view.

## Anatomy

- **container**: Card wrapper element
- **image**: Product image or gallery
- **badge**: Optional sale/new badge
- **title**: Product name
- **price**: Current price (and original if on sale)
- **rating**: Optional star rating
- **description**: Brief product summary
- **action**: Add to cart or view button

## States

| State | Description |
|-------|-------------|
| Default | Standard appearance |
| Hover | Elevated with quick actions |
| Focus | Focus ring visible |
| Out of Stock | Disabled with overlay |

## Variants

### Style

**Attribute:** `data-style`
**Values:** `default`, `compact`, `detailed`

### Featured

**Attribute:** `data-featured`
**Values:** (boolean) - Larger, prominent display

## Baseline HTML

```html
<article class="product-card">
  <img src="product.jpg" alt="Product Name" />
  <h3>Product Name</h3>
  <data value="29.99">$29.99</data>
  <button>Add to Cart</button>
</article>
```

## Enhanced HTML

```html
<product-card data-style="default">
  <a href="/products/widget-pro" data-card-link>
    <picture data-image>
      <source srcset="product.avif" type="image/avif" />
      <source srcset="product.webp" type="image/webp" />
      <img src="product.jpg" alt="Widget Pro - Stainless Steel" loading="lazy" />
    </picture>

    <span data-badge="sale">-20%</span>

    <div data-body>
      <span data-category>Accessories</span>
      <h3>Widget Pro</h3>

      <div data-rating aria-label="4.5 out of 5 stars">
        <x-icon name="star" data-filled></x-icon>
        <x-icon name="star" data-filled></x-icon>
        <x-icon name="star" data-filled></x-icon>
        <x-icon name="star" data-filled></x-icon>
        <x-icon name="star-half" data-filled></x-icon>
        <span>(128 reviews)</span>
      </div>

      <p data-description>Premium stainless steel widget with ergonomic design.</p>

      <div data-price>
        <data value="39.99" data-sale>$39.99</data>
        <data value="49.99" data-original><s>$49.99</s></data>
      </div>
    </div>
  </a>

  <div data-actions>
    <button type="button" data-add-cart>
      <x-icon name="shopping-cart"></x-icon>
      Add to Cart
    </button>
    <button type="button" data-wishlist aria-label="Add to wishlist">
      <x-icon name="heart"></x-icon>
    </button>
  </div>
</product-card>
```

## CSS

```css
@layer components {
  product-card {
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: box-shadow var(--transition-fast), transform var(--transition-fast);

    &:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-4px);

      & [data-image] img {
        transform: scale(1.05);
      }

      & [data-actions] {
        opacity: 1;
        transform: translateY(0);
      }
    }

    &:focus-within {
      outline: 2px solid var(--focus-ring);
      outline-offset: 2px;
    }

    /* Card link */
    & [data-card-link] {
      display: flex;
      flex-direction: column;
      flex: 1;
      text-decoration: none;
      color: inherit;
    }

    /* Product image */
    & [data-image] {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      background: var(--surface-alt);

      & img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--transition-base);
      }
    }

    /* Badges */
    & [data-badge] {
      position: absolute;
      top: var(--size-xs);
      left: var(--size-xs);
      padding: var(--size-2xs) var(--size-xs);
      font-size: var(--text-xs);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      border-radius: var(--radius-sm);
      z-index: 1;
    }

    & [data-badge="sale"] {
      background: var(--error, #ef4444);
      color: white;
    }

    & [data-badge="new"] {
      background: var(--success, #22c55e);
      color: white;
    }

    /* Body content */
    & [data-body] {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--size-2xs);
      padding: var(--size-m);
    }

    /* Category */
    & [data-category] {
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    /* Title */
    & h3 {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.3;
      margin: 0;
    }

    /* Rating */
    & [data-rating] {
      display: flex;
      align-items: center;
      gap: var(--size-2xs);
      font-size: var(--text-sm);
      color: var(--text-muted);

      & x-icon {
        color: var(--warning, #f59e0b);
        font-size: 0.875em;
      }
    }

    /* Description */
    & [data-description] {
      font-size: var(--text-sm);
      color: var(--text-muted);
      line-height: 1.5;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Price */
    & [data-price] {
      display: flex;
      align-items: center;
      gap: var(--size-xs);
      margin-block-start: auto;
      padding-block-start: var(--size-xs);
    }

    & [data-sale] {
      font-size: var(--text-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--error, #ef4444);
    }

    & [data-original] {
      font-size: var(--text-sm);
      color: var(--text-muted);
    }

    & [data-price] data:only-child {
      font-size: var(--text-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text);
    }

    /* Actions */
    & [data-actions] {
      display: flex;
      gap: var(--size-xs);
      padding: var(--size-m);
      padding-block-start: 0;
      opacity: 0;
      transform: translateY(0.5rem);
      transition: opacity var(--transition-fast), transform var(--transition-fast);
    }

    & [data-add-cart] {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--size-xs);
      padding: var(--size-xs) var(--size-m);
      background: var(--primary);
      color: var(--primary-contrast);
      border: none;
      border-radius: var(--radius-md);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: background var(--transition-fast);

      &:hover {
        background: var(--primary-hover);
      }
    }

    & [data-wishlist] {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--size-xs);
      background: var(--surface-alt);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background var(--transition-fast);

      &:hover {
        background: var(--overlay-light);
      }
    }

    /* Compact variant */
    &[data-style="compact"] {
      & [data-image] {
        aspect-ratio: 4 / 3;
      }

      & [data-body] {
        padding: var(--size-xs);
      }

      & [data-description],
      & [data-rating] {
        display: none;
      }
    }

    /* Detailed variant */
    &[data-style="detailed"] {
      & [data-description] {
        -webkit-line-clamp: 3;
      }

      & [data-actions] {
        opacity: 1;
        transform: none;
      }
    }

    /* Featured variant */
    &[data-featured] {
      grid-column: span 2;

      & [data-card-link] {
        flex-direction: row;
      }

      & [data-image] {
        flex: 0 0 50%;
        aspect-ratio: auto;
      }

      & h3 {
        font-size: var(--text-xl);
      }
    }

    /* Out of stock */
    &[data-out-of-stock] {
      & [data-image]::after {
        content: "Out of Stock";
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: oklch(0 0 0 / 0.5);
        color: white;
        font-weight: var(--font-weight-medium);
      }

      & [data-add-cart] {
        opacity: 0.5;
        pointer-events: none;
      }
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    product-card {
      & [data-actions] {
        opacity: 1;
        transform: none;
      }

      &[data-featured] {
        grid-column: span 1;

        & [data-card-link] {
          flex-direction: column;
        }

        & [data-image] {
          flex: none;
          aspect-ratio: 1;
        }
      }
    }
  }
}
```

## Schema.org Markup

```html
<product-card itemscope itemtype="https://schema.org/Product">
  <a href="/products/widget" data-card-link itemprop="url">
    <picture data-image>
      <img src="product.jpg" alt="Widget Pro" itemprop="image" />
    </picture>
    <div data-body>
      <h3 itemprop="name">Widget Pro</h3>
      <div itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
        <meta itemprop="ratingValue" content="4.5" />
        <meta itemprop="reviewCount" content="128" />
      </div>
      <div data-price itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        <data value="39.99" itemprop="price">$39.99</data>
        <meta itemprop="priceCurrency" content="USD" />
        <link itemprop="availability" href="https://schema.org/InStock" />
      </div>
    </div>
  </a>
</product-card>
```

## Accessibility

- **Semantic Structure**: Uses `<article>` as container
- **Image Alt**: Descriptive alt text for product images
- **Rating Label**: `aria-label` describes star rating
- **Button Labels**: Actions have clear text or aria-labels
- **Focus Visible**: Clear focus indicator

## Examples

### Basic Product Card

```html
<product-card>
  <a href="/product/1" data-card-link>
    <picture data-image>
      <img src="product.jpg" alt="Product Name" />
    </picture>
    <div data-body>
      <h3>Product Name</h3>
      <div data-price>
        <data value="29.99">$29.99</data>
      </div>
    </div>
  </a>
  <div data-actions>
    <button data-add-cart>Add to Cart</button>
  </div>
</product-card>
```

### Sale Product

```html
<product-card>
  <a href="/product/2" data-card-link>
    <picture data-image>
      <img src="sale-product.jpg" alt="Sale Item" />
    </picture>
    <span data-badge="sale">-30%</span>
    <div data-body>
      <h3>Sale Item</h3>
      <div data-price>
        <data value="34.99" data-sale>$34.99</data>
        <data value="49.99" data-original><s>$49.99</s></data>
      </div>
    </div>
  </a>
</product-card>
```

### Compact Style

```html
<product-card data-style="compact">
  <!-- Smaller image, no description -->
</product-card>
```

### Out of Stock

```html
<product-card data-out-of-stock>
  <!-- Overlay and disabled button -->
</product-card>
```

## Related Patterns

- [card](./card.md)
- [blog-card](./blog-card.md)
- [feature-grid](./feature-grid.md)
