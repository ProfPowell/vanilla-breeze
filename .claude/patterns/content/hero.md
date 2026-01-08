# Hero

## Description

Large, prominent section typically at the top of a page. Used to introduce content, capture attention, and provide a clear call-to-action. Supports various layouts and media backgrounds.

## Anatomy

- **container**: Full-width wrapper section
- **content**: Text content area (headline, subhead, CTA)
- **headline**: Primary heading (h1)
- **subhead**: Supporting text
- **actions**: Call-to-action buttons
- **media**: Optional background image, video, or illustration

## States

| State | Description |
|-------|-------------|
| Default | Standard hero display |
| Loading | Background media loading |

## Variants

### Size

**Attribute:** `data-size`
**Values:** `small`, `medium`, `large`, `full`

### Alignment

**Attribute:** `data-align`
**Values:** `start`, `center`, `end`

### Layout

**Attribute:** `data-layout`
**Values:** `stacked`, `split`, `overlay`

## Baseline HTML

```html
<section class="hero">
  <h1>Welcome to Our Platform</h1>
  <p>Build better products with our comprehensive toolkit designed for modern teams.</p>
  <div>
    <a href="/signup">Get Started</a>
    <a href="/demo">Watch Demo</a>
  </div>
</section>
```

## Enhanced HTML

```html
<hero-section data-size="large" data-align="center" data-layout="stacked">
  <picture data-background>
    <source srcset="/hero-bg.avif" type="image/avif" />
    <source srcset="/hero-bg.webp" type="image/webp" />
    <img src="/hero-bg.jpg" alt="" loading="eager" />
  </picture>

  <div data-content>
    <h1>Welcome to Our Platform</h1>
    <p>Build better products with our comprehensive toolkit designed for modern teams.</p>
    <div data-actions>
      <a href="/signup" data-button="primary">Get Started Free</a>
      <a href="/demo" data-button="secondary">Watch Demo</a>
    </div>
  </div>
</hero-section>
```

## CSS

```css
@layer components {
  hero-section {
    --hero-padding: var(--spacing-2xl);
    --hero-min-height: 60vh;

    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--hero-min-height);
    padding: var(--hero-padding);
    overflow: hidden;

    /* Background media */
    & [data-background] {
      position: absolute;
      inset: 0;
      z-index: -1;

      & img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    /* Overlay for text readability */
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        oklch(0 0 0 / 0.3),
        oklch(0 0 0 / 0.5)
      );
      z-index: 0;
    }

    /* Content area */
    & [data-content] {
      position: relative;
      z-index: 1;
      max-width: 48rem;
      color: var(--hero-text, white);
    }

    & h1 {
      font-size: clamp(2rem, 5vw, 4rem);
      line-height: 1.1;
      margin-block-end: var(--spacing-md);
    }

    & p {
      font-size: clamp(1.125rem, 2vw, 1.5rem);
      line-height: 1.5;
      margin-block-end: var(--spacing-lg);
      opacity: 0.9;
    }

    /* Actions */
    & [data-actions] {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    & [data-button] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-xl);
      font-size: var(--text-lg);
      font-weight: var(--font-weight-medium);
      text-decoration: none;
      border-radius: var(--radius-md);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);

      &:hover {
        transform: translateY(-2px);
      }
    }

    & [data-button="primary"] {
      background: var(--primary);
      color: var(--primary-contrast);
    }

    & [data-button="secondary"] {
      background: oklch(1 0 0 / 0.2);
      color: white;
      border: 1px solid oklch(1 0 0 / 0.3);
    }

    /* Size variants */
    &[data-size="small"] {
      --hero-min-height: 40vh;
      --hero-padding: var(--spacing-xl);
    }

    &[data-size="medium"] {
      --hero-min-height: 60vh;
    }

    &[data-size="large"] {
      --hero-min-height: 80vh;
    }

    &[data-size="full"] {
      --hero-min-height: 100vh;
    }

    /* Alignment variants */
    &[data-align="start"] {
      justify-content: flex-start;
      text-align: start;
    }

    &[data-align="center"] {
      justify-content: center;
      text-align: center;

      & [data-actions] {
        justify-content: center;
      }
    }

    &[data-align="end"] {
      justify-content: flex-end;
      text-align: end;

      & [data-actions] {
        justify-content: flex-end;
      }
    }

    /* Split layout */
    &[data-layout="split"] {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-2xl);

      &::before {
        display: none;
      }

      & [data-background] {
        position: relative;
        order: 1;
      }

      & [data-content] {
        display: flex;
        flex-direction: column;
        justify-content: center;
        color: var(--text);
      }
    }

    /* No background variant */
    &:not(:has([data-background])) {
      background: var(--surface-alt);

      &::before {
        display: none;
      }

      & [data-content] {
        color: var(--text);
      }

      & [data-button="secondary"] {
        background: var(--surface);
        color: var(--text);
        border-color: var(--border);
      }
    }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    hero-section {
      --hero-padding: var(--spacing-xl) var(--spacing-lg);

      &[data-layout="split"] {
        grid-template-columns: 1fr;

        & [data-background] {
          max-height: 50vh;
        }
      }

      & [data-actions] {
        flex-direction: column;

        & [data-button] {
          width: 100%;
          justify-content: center;
        }
      }
    }
  }
}
```

## Accessibility

- **Heading Hierarchy**: Uses h1 for main headline
- **Image Alt**: Background images use empty alt (decorative) or descriptive alt
- **Button Labels**: CTAs have clear, actionable text
- **Color Contrast**: Text overlay ensures readability over images
- **Reduced Motion**: Respects `prefers-reduced-motion` for animations

## Examples

### Centered Hero with Background

```html
<hero-section data-size="large" data-align="center">
  <picture data-background>
    <img src="/hero.jpg" alt="" />
  </picture>
  <div data-content>
    <h1>Build Something Amazing</h1>
    <p>Start your journey with our powerful platform.</p>
    <div data-actions>
      <a href="/start" data-button="primary">Get Started</a>
    </div>
  </div>
</hero-section>
```

### Split Layout Hero

```html
<hero-section data-layout="split" data-size="large">
  <div data-content>
    <h1>Modern Web Development</h1>
    <p>Create stunning websites with our intuitive tools.</p>
    <div data-actions>
      <a href="/try" data-button="primary">Try Free</a>
      <a href="/learn" data-button="secondary">Learn More</a>
    </div>
  </div>
  <picture data-background>
    <img src="/illustration.svg" alt="Platform illustration" />
  </picture>
</hero-section>
```

### Simple Hero (No Background)

```html
<hero-section data-size="medium" data-align="center">
  <div data-content>
    <h1>Documentation</h1>
    <p>Everything you need to get started with our API.</p>
  </div>
</hero-section>
```

### Full-Height Landing Hero

```html
<hero-section data-size="full" data-align="center">
  <video data-background autoplay muted loop playsinline>
    <source src="/hero-video.mp4" type="video/mp4" />
  </video>
  <div data-content>
    <h1>The Future of Work</h1>
    <p>Reimagine how your team collaborates.</p>
    <div data-actions>
      <a href="/signup" data-button="primary">Start Free Trial</a>
      <a href="/demo" data-button="secondary">Book a Demo</a>
    </div>
  </div>
</hero-section>
```

## Related Patterns

- [cta](./cta.md)
- [feature-grid](./feature-grid.md)
- [page-shell](../layout/page-shell.md)
