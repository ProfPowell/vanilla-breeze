# Full Bleed

## Description

Layout utility that allows content to break out of its container and span the full viewport width. Useful for hero sections, images, and accent areas within otherwise constrained layouts.

## Anatomy

- **container**: The full-width wrapper
- **content**: Optional inner content container

## States

| State | Description |
|-------|-------------|
| Default | Full viewport width |

## Variants

### Style

**Attribute:** `data-style`
**Values:** `default`, `contained` (content stays centered)

### Background

**Attribute:** `data-bg`
**Values:** `none`, `surface`, `accent`, `dark`

## Baseline HTML

```html
<div class="full-bleed">
  <img src="hero.jpg" alt="Hero image" />
</div>
```

## Enhanced HTML

```html
<full-bleed data-bg="accent">
  <content-width>
    <h2>Featured Section</h2>
    <p>Content stays centered while background spans full width.</p>
  </content-width>
</full-bleed>
```

## CSS

```css
@layer layout {
  full-bleed,
  .full-bleed {
    display: block;
    width: 100vw;
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
  }

  /* Contained variant - centers content inside */
  full-bleed[data-style="contained"],
  .full-bleed[data-style="contained"] {
    display: flex;
    justify-content: center;
  }

  full-bleed[data-style="contained"] > *,
  .full-bleed[data-style="contained"] > * {
    width: 100%;
    max-width: var(--content-width-default, 65rem);
    padding-inline: var(--size-l);
  }

  /* Background variants */
  full-bleed[data-bg="surface"],
  .full-bleed[data-bg="surface"] {
    background: var(--surface-alt, oklch(0.98 0 0));
  }

  full-bleed[data-bg="accent"],
  .full-bleed[data-bg="accent"] {
    background: var(--primary, oklch(0.55 0.2 250));
    color: var(--primary-contrast, white);
  }

  full-bleed[data-bg="dark"],
  .full-bleed[data-bg="dark"] {
    background: oklch(0.15 0 0);
    color: white;
  }

  /* Images inside full-bleed */
  full-bleed img,
  .full-bleed img {
    width: 100%;
    height: auto;
    display: block;
  }

  /* Padding for content sections */
  full-bleed[data-bg]:not([data-bg="none"]),
  .full-bleed[data-bg]:not([data-bg="none"]) {
    padding-block: var(--size-2xl);
  }
}
```

## Accessibility

- **Semantic Neutral**: Pure layout utility
- **Images**: Ensure proper alt text on images

## Examples

### Full-Width Image

```html
<content-width>
  <p>Regular content above...</p>
</content-width>

<full-bleed>
  <img src="wide-image.jpg" alt="Panoramic landscape view" />
</full-bleed>

<content-width>
  <p>Regular content below...</p>
</content-width>
```

### Accent Section

```html
<full-bleed data-bg="accent" data-style="contained">
  <section>
    <h2>Call to Action</h2>
    <p>This section has a colored background that spans the full width.</p>
    <a href="/signup">Get Started</a>
  </section>
</full-bleed>
```

### Dark Feature Section

```html
<full-bleed data-bg="dark" data-style="contained">
  <section>
    <h2>Premium Features</h2>
    <div class="feature-grid">
      <!-- Features here -->
    </div>
  </section>
</full-bleed>
```

### Hero with Background Image

```html
<full-bleed data-style="contained" style="background-image: url('hero-bg.jpg'); background-size: cover;">
  <div class="hero-content">
    <h1>Welcome</h1>
    <p>Hero content overlaid on background</p>
  </div>
</full-bleed>
```

## Related Patterns

- [content-width](./content-width.md)
- [hero](../content/hero.md)
- [page-shell](../navigation/page-shell.md)
