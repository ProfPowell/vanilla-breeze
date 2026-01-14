# Logo Cloud

## Description

Grid or row of partner, client, or integration logos. Used to show social proof, partnerships, and integrations. Often appears on landing pages and about pages.

## Anatomy

- **container**: Section wrapper
- **heading**: Optional title (e.g., "Trusted by", "Partners")
- **logos**: Grid or row of logos
- **logo**: Individual logo image

## States

| State | Description |
|-------|-------------|
| Default | Static logo display |
| Animated | Scroll/carousel animation |

## Variants

### Layout

**Attribute:** `data-layout`
**Values:** `grid`, `row`, `marquee`

### Style

**Attribute:** `data-style`
**Values:** `default`, `muted`, `dark`

## Baseline HTML

```html
<section class="logo-cloud">
  <h2>Trusted by leading companies</h2>
  <ul>
    <li><img src="logo1.svg" alt="Company One" /></li>
    <li><img src="logo2.svg" alt="Company Two" /></li>
    <li><img src="logo3.svg" alt="Company Three" /></li>
    <li><img src="logo4.svg" alt="Company Four" /></li>
  </ul>
</section>
```

## Enhanced HTML

```html
<logo-cloud data-layout="row" data-style="muted">
  <h2>Trusted by innovative teams</h2>
  <ul data-logos>
    <li><img src="logos/company1.svg" alt="Company One" loading="lazy" /></li>
    <li><img src="logos/company2.svg" alt="Company Two" loading="lazy" /></li>
    <li><img src="logos/company3.svg" alt="Company Three" loading="lazy" /></li>
    <li><img src="logos/company4.svg" alt="Company Four" loading="lazy" /></li>
    <li><img src="logos/company5.svg" alt="Company Five" loading="lazy" /></li>
    <li><img src="logos/company6.svg" alt="Company Six" loading="lazy" /></li>
  </ul>
</logo-cloud>
```

## CSS

```css
@layer components {
  logo-cloud {
    display: block;
    padding: var(--size-xl) var(--size-l);
    text-align: center;

    /* Heading */
    & h2 {
      font-size: var(--text-sm);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      margin-block-end: var(--size-xl);
    }

    /* Logos container */
    & [data-logos] {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: var(--size-xl) var(--size-2xl);
      list-style: none;
      margin: 0;
      padding: 0;
      max-width: var(--content-max-width);
      margin-inline: auto;
    }

    /* Individual logo */
    & [data-logos] img {
      height: 2rem;
      width: auto;
      max-width: 8rem;
      object-fit: contain;
    }

    /* Layout variants */
    &[data-layout="grid"] [data-logos] {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
      gap: var(--size-xl);

      & li {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }

    &[data-layout="row"] [data-logos] {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    &[data-layout="marquee"] {
      overflow: hidden;

      & [data-logos] {
        flex-wrap: nowrap;
        animation: marquee 30s linear infinite;
        width: max-content;
      }

      &:hover [data-logos] {
        animation-play-state: paused;
      }
    }

    /* Style variants */
    &[data-style="muted"] [data-logos] img {
      filter: grayscale(100%) opacity(0.5);
      transition: filter var(--transition-fast);

      &:hover {
        filter: grayscale(0%) opacity(1);
      }
    }

    &[data-style="dark"] {
      background: var(--surface-dark, #1a1a1a);
      padding: var(--size-2xl);
      border-radius: var(--radius-lg);

      & h2 {
        color: oklch(1 0 0 / 0.7);
      }

      & [data-logos] img {
        filter: brightness(0) invert(1);
      }
    }
  }

  /* Marquee animation */
  @keyframes marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }

  /* Respect reduced motion */
  @media (prefers-reduced-motion: reduce) {
    logo-cloud[data-layout="marquee"] [data-logos] {
      animation: none;
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    logo-cloud {
      & [data-logos] img {
        height: 1.5rem;
      }
    }
  }
}
```

## Accessibility

- **Alt Text**: Each logo has descriptive alt text
- **Reduced Motion**: Marquee animation respects user preferences
- **Semantic List**: Uses `<ul>` for logo collection

## Examples

### Muted Row Layout

```html
<logo-cloud data-layout="row" data-style="muted">
  <h2>Powering teams at</h2>
  <ul data-logos>
    <li><img src="logo1.svg" alt="Acme Corp" /></li>
    <li><img src="logo2.svg" alt="TechStart" /></li>
    <li><img src="logo3.svg" alt="DataFlow" /></li>
    <li><img src="logo4.svg" alt="CloudNet" /></li>
  </ul>
</logo-cloud>
```

### Grid Layout

```html
<logo-cloud data-layout="grid">
  <h2>Our Partners</h2>
  <ul data-logos>
    <!-- 8-12 logos work well in grid -->
  </ul>
</logo-cloud>
```

### Marquee Animation

```html
<logo-cloud data-layout="marquee" data-style="muted">
  <h2>Trusted by 1000+ companies</h2>
  <ul data-logos>
    <!-- Double the logos for seamless loop -->
    <li><img src="logo1.svg" alt="Company 1" /></li>
    <li><img src="logo2.svg" alt="Company 2" /></li>
    <!-- repeat all logos for continuous animation -->
  </ul>
</logo-cloud>
```

### Dark Background

```html
<logo-cloud data-layout="row" data-style="dark">
  <h2>Integrations</h2>
  <ul data-logos>
    <li><img src="slack.svg" alt="Slack" /></li>
    <li><img src="github.svg" alt="GitHub" /></li>
    <li><img src="jira.svg" alt="Jira" /></li>
  </ul>
</logo-cloud>
```

### No Heading

```html
<logo-cloud data-layout="row" data-style="muted">
  <ul data-logos>
    <!-- logos only -->
  </ul>
</logo-cloud>
```

## Related Patterns

- [testimonial](./testimonial.md)
- [stats](./stats.md)
- [feature-grid](./feature-grid.md)
