# Blog Card

## Description

Card specifically designed for blog post previews. Displays featured image, category, title, excerpt, author, and publication date. Links to full article.

## Anatomy

- **container**: Card wrapper element
- **image**: Featured image
- **category**: Post category or tag
- **title**: Post headline
- **excerpt**: Brief summary
- **author**: Author avatar and name
- **date**: Publication date
- **reading-time**: Estimated read time

## States

| State | Description |
|-------|-------------|
| Default | Standard appearance |
| Hover | Elevated with image zoom |
| Focus | Focus ring visible |

## Variants

### Size

**Attribute:** `data-size`
**Values:** `small`, `medium`, `large`

### Featured

**Attribute:** `data-featured`
**Values:** (boolean attribute)

## Baseline HTML

```html
<article class="blog-card">
  <img src="post-image.jpg" alt="Post featured image" />
  <span class="category">Technology</span>
  <h3><a href="/blog/post-slug">Blog Post Title Here</a></h3>
  <p>Brief excerpt from the blog post that gives readers an idea of what to expect...</p>
  <footer>
    <span>Jane Doe</span>
    <time datetime="2025-01-15">Jan 15, 2025</time>
  </footer>
</article>
```

## Enhanced HTML

```html
<blog-card data-size="medium">
  <a href="/blog/post-slug" data-card-link>
    <picture data-image>
      <source srcset="post-image.avif" type="image/avif" />
      <source srcset="post-image.webp" type="image/webp" />
      <img src="post-image.jpg" alt="Post featured image" loading="lazy" />
    </picture>

    <div data-body>
      <span data-category>Technology</span>
      <h3>Blog Post Title Here</h3>
      <p data-excerpt>Brief excerpt from the blog post that gives readers an idea of what to expect from the full article.</p>

      <footer data-meta>
        <div data-author>
          <img src="author-avatar.jpg" alt="" width="32" height="32" />
          <span>Jane Doe</span>
        </div>
        <time datetime="2025-01-15">Jan 15, 2025</time>
        <span data-reading-time>5 min read</span>
      </footer>
    </div>
  </a>
</blog-card>
```

## CSS

```css
@layer components {
  blog-card {
    display: block;
    background: var(--surface);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--border);
    transition: box-shadow var(--transition-fast), transform var(--transition-fast);

    &:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-4px);

      & [data-image] img {
        transform: scale(1.05);
      }
    }

    &:focus-within {
      outline: 2px solid var(--focus-ring);
      outline-offset: 2px;
    }

    /* Link wrapper */
    & [data-card-link] {
      display: flex;
      flex-direction: column;
      height: 100%;
      text-decoration: none;
      color: inherit;
    }

    /* Featured image */
    & [data-image] {
      aspect-ratio: 16 / 9;
      overflow: hidden;

      & img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--transition-base);
      }
    }

    /* Body content */
    & [data-body] {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--size-xs);
      padding: var(--size-l);
    }

    /* Category badge */
    & [data-category] {
      display: inline-block;
      width: fit-content;
      padding: var(--size-2xs) var(--size-xs);
      font-size: var(--text-xs);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary);
      background: var(--primary-subtle);
      border-radius: var(--radius-sm);
    }

    /* Title */
    & h3 {
      font-size: var(--text-xl);
      font-weight: var(--font-weight-semibold);
      line-height: 1.3;
      margin: 0;
    }

    /* Excerpt */
    & [data-excerpt] {
      color: var(--text-muted);
      line-height: 1.6;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Meta footer */
    & [data-meta] {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--size-m);
      margin-block-start: auto;
      padding-block-start: var(--size-m);
      font-size: var(--text-sm);
      color: var(--text-muted);
    }

    /* Author */
    & [data-author] {
      display: flex;
      align-items: center;
      gap: var(--size-xs);

      & img {
        width: 2rem;
        height: 2rem;
        border-radius: var(--radius-full);
        object-fit: cover;
      }
    }

    /* Reading time */
    & [data-reading-time] {
      margin-inline-start: auto;
    }

    /* Size variants */
    &[data-size="small"] {
      & [data-image] {
        aspect-ratio: 4 / 3;
      }

      & [data-body] {
        padding: var(--size-m);
      }

      & h3 {
        font-size: var(--text-base);
      }

      & [data-excerpt] {
        -webkit-line-clamp: 2;
      }
    }

    &[data-size="large"] {
      & h3 {
        font-size: var(--text-2xl);
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
        font-size: var(--text-2xl);
      }
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    blog-card[data-featured] {
      grid-column: span 1;

      & [data-card-link] {
        flex-direction: column;
      }

      & [data-image] {
        flex: none;
        aspect-ratio: 16 / 9;
      }
    }
  }
}
```

## Schema.org Markup

Add structured data for SEO:

```html
<blog-card itemscope itemtype="https://schema.org/BlogPosting">
  <a href="/blog/post-slug" data-card-link itemprop="url">
    <picture data-image>
      <img src="post-image.jpg" alt="" itemprop="image" />
    </picture>
    <div data-body>
      <span data-category itemprop="articleSection">Technology</span>
      <h3 itemprop="headline">Blog Post Title</h3>
      <p data-excerpt itemprop="description">Excerpt...</p>
      <footer data-meta>
        <div data-author itemprop="author" itemscope itemtype="https://schema.org/Person">
          <span itemprop="name">Jane Doe</span>
        </div>
        <time datetime="2025-01-15" itemprop="datePublished">Jan 15, 2025</time>
      </footer>
    </div>
  </a>
</blog-card>
```

## Accessibility

- **Semantic Structure**: Uses `<article>` as container
- **Link Purpose**: Card link wraps all content
- **Time Element**: Uses `<time>` with datetime attribute
- **Image Alt**: Featured image has descriptive alt text
- **Author Image**: Author avatar is decorative (empty alt)

## Examples

### Standard Blog Card

```html
<blog-card>
  <a href="/blog/post" data-card-link>
    <picture data-image>
      <img src="image.jpg" alt="Post preview" />
    </picture>
    <div data-body>
      <span data-category>Design</span>
      <h3>Post Title</h3>
      <p data-excerpt>Excerpt text...</p>
      <footer data-meta>
        <div data-author>
          <img src="avatar.jpg" alt="" width="32" height="32" />
          <span>Author Name</span>
        </div>
        <time datetime="2025-01-15">Jan 15</time>
      </footer>
    </div>
  </a>
</blog-card>
```

### Featured Blog Card

```html
<blog-card data-featured>
  <!-- Same structure, spans 2 columns, horizontal layout -->
</blog-card>
```

### Small Blog Card

```html
<blog-card data-size="small">
  <!-- Compact version for sidebars -->
</blog-card>
```

## Related Patterns

- [card](./card.md)
- [product-card](./product-card.md)
- [feature-grid](./feature-grid.md)
