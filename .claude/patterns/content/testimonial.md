# Testimonial

## Description

Customer quote or endorsement displaying feedback, attribution, and optional company/role information. Used to build trust and social proof.

## Anatomy

- **container**: Quote wrapper element
- **quote**: Customer testimonial text
- **attribution**: Customer information
- **avatar**: Customer photo
- **name**: Customer name
- **role**: Job title or description
- **company**: Company name or logo
- **rating**: Optional star rating

## States

| State | Description |
|-------|-------------|
| Default | Standard appearance |

## Variants

### Style

**Attribute:** `data-style`
**Values:** `default`, `card`, `featured`, `minimal`

### Alignment

**Attribute:** `data-align`
**Values:** `start`, `center`

## Baseline HTML

```html
<blockquote class="testimonial">
  <p>"This product transformed our workflow. We've seen a 50% increase in productivity since switching."</p>
  <footer>
    <cite>
      <strong>Jane Doe</strong>
      <span>CEO, TechCorp</span>
    </cite>
  </footer>
</blockquote>
```

## Enhanced HTML

```html
<testimonial-card data-style="card" data-align="center">
  <blockquote>
    <p>"This product transformed our workflow. We've seen a 50% increase in productivity since switching. The team loves it."</p>
  </blockquote>

  <footer data-attribution>
    <img data-avatar src="customer-avatar.jpg" alt="" width="64" height="64" />
    <div>
      <cite data-name>Jane Doe</cite>
      <span data-role>CEO</span>
      <span data-company>TechCorp</span>
    </div>
  </footer>

  <div data-rating aria-label="5 out of 5 stars">
    <x-icon name="star" data-filled></x-icon>
    <x-icon name="star" data-filled></x-icon>
    <x-icon name="star" data-filled></x-icon>
    <x-icon name="star" data-filled></x-icon>
    <x-icon name="star" data-filled></x-icon>
  </div>
</testimonial-card>
```

## CSS

```css
@layer components {
  testimonial-card {
    display: block;

    /* Quote styling */
    & blockquote {
      margin: 0;
      padding: 0;

      & p {
        font-size: var(--text-lg);
        line-height: 1.7;
        color: var(--text);
        margin: 0;

        &::before {
          content: """;
          color: var(--primary);
          font-size: 2em;
          line-height: 0;
          vertical-align: -0.3em;
          margin-inline-end: var(--size-2xs);
        }

        &::after {
          content: """;
        }
      }
    }

    /* Attribution */
    & [data-attribution] {
      display: flex;
      align-items: center;
      gap: var(--size-m);
      margin-block-start: var(--size-l);
    }

    & [data-avatar] {
      width: 4rem;
      height: 4rem;
      border-radius: var(--radius-full);
      object-fit: cover;
    }

    & [data-name] {
      display: block;
      font-style: normal;
      font-weight: var(--font-weight-semibold);
      color: var(--text);
    }

    & [data-role],
    & [data-company] {
      font-size: var(--text-sm);
      color: var(--text-muted);
    }

    & [data-role]::after {
      content: " at ";
    }

    /* Rating */
    & [data-rating] {
      display: flex;
      gap: var(--size-2xs);
      margin-block-start: var(--size-m);

      & x-icon {
        color: var(--warning, #f59e0b);
      }
    }

    /* Style variants */
    &[data-style="card"] {
      padding: var(--size-xl);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }

    &[data-style="featured"] {
      padding: var(--size-2xl);
      background: var(--primary);
      color: var(--primary-contrast);
      border-radius: var(--radius-lg);

      & blockquote p {
        font-size: var(--text-xl);
        color: inherit;

        &::before {
          color: oklch(1 0 0 / 0.5);
        }
      }

      & [data-name] {
        color: inherit;
      }

      & [data-role],
      & [data-company] {
        color: oklch(1 0 0 / 0.8);
      }
    }

    &[data-style="minimal"] {
      padding-inline-start: var(--size-l);
      border-inline-start: 3px solid var(--primary);
    }

    /* Alignment variants */
    &[data-align="center"] {
      text-align: center;

      & [data-attribution] {
        flex-direction: column;
        text-align: center;
      }

      & [data-rating] {
        justify-content: center;
      }
    }
  }
}
```

## Schema.org Markup

```html
<testimonial-card itemscope itemtype="https://schema.org/Review">
  <blockquote>
    <p itemprop="reviewBody">"Testimonial text..."</p>
  </blockquote>
  <footer data-attribution itemprop="author" itemscope itemtype="https://schema.org/Person">
    <img data-avatar src="avatar.jpg" alt="" />
    <div>
      <cite data-name itemprop="name">Jane Doe</cite>
      <span data-role itemprop="jobTitle">CEO</span>
    </div>
  </footer>
  <div data-rating itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
    <meta itemprop="ratingValue" content="5" />
    <meta itemprop="bestRating" content="5" />
    <!-- stars -->
  </div>
</testimonial-card>
```

## Accessibility

- **Semantic Structure**: Uses `<blockquote>` with `<cite>` for attribution
- **Star Rating**: Includes aria-label describing the rating
- **Avatar Image**: Decorative image with empty alt

## Examples

### Card Style

```html
<testimonial-card data-style="card">
  <blockquote>
    <p>"Amazing product, highly recommend!"</p>
  </blockquote>
  <footer data-attribution>
    <img data-avatar src="avatar.jpg" alt="" width="64" height="64" />
    <div>
      <cite data-name>John Smith</cite>
      <span data-role>Developer</span>
      <span data-company>StartupCo</span>
    </div>
  </footer>
</testimonial-card>
```

### Featured Style

```html
<testimonial-card data-style="featured" data-align="center">
  <blockquote>
    <p>"The best decision we ever made for our business."</p>
  </blockquote>
  <footer data-attribution>
    <img data-avatar src="avatar.jpg" alt="" width="64" height="64" />
    <div>
      <cite data-name>Sarah Johnson</cite>
      <span data-role>CTO</span>
      <span data-company>Enterprise Inc</span>
    </div>
  </footer>
</testimonial-card>
```

### With Rating

```html
<testimonial-card data-style="card">
  <div data-rating aria-label="5 out of 5 stars">
    <x-icon name="star"></x-icon>
    <x-icon name="star"></x-icon>
    <x-icon name="star"></x-icon>
    <x-icon name="star"></x-icon>
    <x-icon name="star"></x-icon>
  </div>
  <blockquote>
    <p>"Exceeded all expectations!"</p>
  </blockquote>
  <footer data-attribution>
    <cite data-name>Customer Name</cite>
  </footer>
</testimonial-card>
```

## Related Patterns

- [card](./card.md)
- [stats](./stats.md)
- [logo-cloud](./logo-cloud.md)
