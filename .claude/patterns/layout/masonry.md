# Masonry

## Description

Pinterest-style layout where items of varying heights are arranged to minimize vertical gaps. Uses CSS columns for a pure CSS solution, with optional JavaScript for more control.

## Anatomy

- **container**: The masonry wrapper
- **items**: Variable-height content blocks

## States

| State | Description |
|-------|-------------|
| Default | CSS columns layout |
| Enhanced | JavaScript-positioned masonry |

## Variants

### Columns

**Attribute:** `data-columns`
**Values:** `2`, `3`, `4`, `auto`

### Gap

**Attribute:** `data-gap`
**Values:** `none`, `small`, `default`, `large`

## Baseline HTML

```html
<div class="masonry">
  <article class="masonry-item">Content of varying height</article>
  <article class="masonry-item">Shorter content</article>
  <article class="masonry-item">Much longer content that takes more vertical space</article>
</div>
```

## Enhanced HTML

```html
<masonry-grid data-columns="3" data-gap="default">
  <article data-item>
    <img src="image1.jpg" alt="Photo 1" />
    <p>Caption for photo 1</p>
  </article>
  <article data-item>
    <img src="image2.jpg" alt="Photo 2" />
  </article>
  <article data-item>
    <img src="image3.jpg" alt="Photo 3" />
    <p>Longer caption that wraps to multiple lines</p>
  </article>
</masonry-grid>
```

## CSS

```css
@layer layout {
  masonry-grid,
  .masonry {
    --masonry-columns: 3;
    --masonry-gap: var(--size-l);

    column-count: var(--masonry-columns);
    column-gap: var(--masonry-gap);
  }

  masonry-grid > *,
  .masonry > * {
    break-inside: avoid;
    margin-bottom: var(--masonry-gap);
  }

  /* Remove margin from last items to prevent extra space */
  masonry-grid > *:last-child,
  .masonry > *:last-child {
    margin-bottom: 0;
  }

  /* Column variants */
  masonry-grid[data-columns="2"],
  .masonry[data-columns="2"] {
    --masonry-columns: 2;
  }

  masonry-grid[data-columns="3"],
  .masonry[data-columns="3"] {
    --masonry-columns: 3;
  }

  masonry-grid[data-columns="4"],
  .masonry[data-columns="4"] {
    --masonry-columns: 4;
  }

  masonry-grid[data-columns="auto"],
  .masonry[data-columns="auto"] {
    column-count: auto;
    column-width: 16rem;
  }

  /* Responsive columns */
  @media (max-width: 63.999rem) {
    masonry-grid[data-columns="4"],
    .masonry[data-columns="4"] {
      --masonry-columns: 3;
    }
  }

  @media (max-width: 47.999rem) {
    masonry-grid[data-columns="3"],
    masonry-grid[data-columns="4"],
    .masonry[data-columns="3"],
    .masonry[data-columns="4"] {
      --masonry-columns: 2;
    }
  }

  @media (max-width: 29.999rem) {
    masonry-grid,
    .masonry {
      --masonry-columns: 1;
    }
  }

  /* Gap variants */
  masonry-grid[data-gap="none"],
  .masonry[data-gap="none"] {
    --masonry-gap: 0;
  }

  masonry-grid[data-gap="small"],
  .masonry[data-gap="small"] {
    --masonry-gap: var(--size-xs);
  }

  masonry-grid[data-gap="large"],
  .masonry[data-gap="large"] {
    --masonry-gap: var(--size-xl);
  }

  /* Item styling */
  masonry-grid [data-item],
  .masonry .masonry-item {
    background: var(--surface, white);
    border-radius: var(--radius-lg, 0.75rem);
    overflow: hidden;
  }

  masonry-grid [data-item] img,
  .masonry .masonry-item img {
    width: 100%;
    height: auto;
    display: block;
  }

  masonry-grid [data-item] > :not(img),
  .masonry .masonry-item > :not(img) {
    padding: var(--size-m);
  }
}
```

## JavaScript Enhancement

```javascript
// Optional JavaScript for true masonry with better control
class MasonryGrid extends HTMLElement {
  static observedAttributes = ['data-columns'];

  connectedCallback() {
    // CSS columns work well for most cases
    // Only use JS masonry if needed for:
    // - Animation on load
    // - Dynamic reordering
    // - Infinite scroll insertion

    this.items = this.querySelectorAll('[data-item]');

    // Optional: Animate items on load
    if (this.hasAttribute('data-animate')) {
      this.animateItems();
    }

    // Optional: Lazy load images
    this.observeImages();
  }

  animateItems() {
    this.items.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(1rem)';

      setTimeout(() => {
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, index * 50);
    });
  }

  observeImages() {
    const images = this.querySelectorAll('img[data-src]');
    if (!images.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach((img) => observer.observe(img));
  }
}

customElements.define('masonry-grid', MasonryGrid);
```

## Accessibility

- **Content Order**: CSS columns change visual order from DOM order; ensure logical reading order
- **Images**: Proper alt text for all images
- **Focus Order**: Tab order follows DOM, not visual order

## Examples

### Photo Gallery

```html
<masonry-grid data-columns="3" data-gap="default">
  <article data-item>
    <img src="photo1.jpg" alt="Sunset over mountains" />
  </article>
  <article data-item>
    <img src="photo2.jpg" alt="City skyline at night" />
    <p>Downtown after dark</p>
  </article>
  <article data-item>
    <img src="photo3.jpg" alt="Beach waves" />
  </article>
  <!-- More photos -->
</masonry-grid>
```

### Pinterest-Style Pins

```html
<masonry-grid data-columns="4" data-gap="small">
  <article data-item>
    <img src="pin1.jpg" alt="Recipe preview" />
    <h3>Chocolate Cake Recipe</h3>
    <p>The best chocolate cake you'll ever make...</p>
  </article>
  <article data-item>
    <img src="pin2.jpg" alt="DIY project" />
    <h3>Weekend DIY Project</h3>
  </article>
  <!-- More pins -->
</masonry-grid>
```

### Blog Post Cards

```html
<masonry-grid data-columns="auto" data-gap="large">
  <blog-card>
    <img src="post1.jpg" alt="" />
    <h3>Long Article Title Here</h3>
    <p>This is a longer excerpt that demonstrates varying content heights...</p>
  </blog-card>
  <blog-card>
    <h3>Quick Tip</h3>
    <p>Short content</p>
  </blog-card>
  <!-- More cards -->
</masonry-grid>
```

## Related Patterns

- [card-grid](./card-grid.md)
- [gallery](../content/gallery.md)
- [blog-card](../content/blog-card.md)
