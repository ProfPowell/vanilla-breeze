# Split Layout

## Description

Two-column layout that divides content into primary and secondary areas. Commonly used for text + image combinations, feature highlights, or content with supporting visuals.

## Anatomy

- **container**: The split layout wrapper
- **primary**: Main content area (typically text)
- **secondary**: Supporting content area (typically media)

## States

| State | Description |
|-------|-------------|
| Default | Side-by-side columns |
| Stacked | Mobile-first stacked layout |

## Variants

### Ratio

**Attribute:** `data-ratio`
**Values:** `equal`, `wide-left`, `wide-right`

### Order

**Attribute:** `data-order`
**Values:** `default`, `reverse`

### Alignment

**Attribute:** `data-align`
**Values:** `start`, `center`, `end`, `stretch`

### Gap

**Attribute:** `data-gap`
**Values:** `none`, `small`, `default`, `large`

## Baseline HTML

```html
<div class="split-layout">
  <div>
    <h2>Feature Title</h2>
    <p>Feature description text goes here.</p>
  </div>
  <div>
    <img src="feature.jpg" alt="Feature illustration" />
  </div>
</div>
```

## Enhanced HTML

```html
<split-layout data-ratio="wide-left" data-align="center" data-gap="large">
  <div data-primary>
    <h2>Feature Title</h2>
    <p>Feature description with more emphasis on the text content.</p>
    <a href="/learn-more" data-button="primary">Learn More</a>
  </div>
  <div data-secondary>
    <img src="feature.jpg" alt="Feature illustration" />
  </div>
</split-layout>
```

## CSS

```css
@layer layout {
  split-layout,
  .split-layout {
    display: grid;
    gap: var(--split-gap, var(--size-xl));
    align-items: var(--split-align, center);
  }

  /* Default: stacked on mobile, side-by-side on larger screens */
  @media (min-width: 48rem) {
    split-layout,
    .split-layout {
      grid-template-columns: 1fr 1fr;
    }
  }

  /* Ratio variants */
  @media (min-width: 48rem) {
    split-layout[data-ratio="wide-left"],
    .split-layout[data-ratio="wide-left"] {
      grid-template-columns: 3fr 2fr;
    }

    split-layout[data-ratio="wide-right"],
    .split-layout[data-ratio="wide-right"] {
      grid-template-columns: 2fr 3fr;
    }
  }

  /* Order variants */
  split-layout[data-order="reverse"] > :first-child,
  .split-layout[data-order="reverse"] > :first-child {
    order: 2;
  }

  split-layout[data-order="reverse"] > :last-child,
  .split-layout[data-order="reverse"] > :last-child {
    order: 1;
  }

  /* On mobile, reverse order stacks image first */
  @media (max-width: 47.999rem) {
    split-layout[data-order="reverse"],
    .split-layout[data-order="reverse"] {
      & > :first-child {
        order: 1;
      }
      & > :last-child {
        order: 2;
      }
    }
  }

  /* Alignment variants */
  split-layout[data-align="start"],
  .split-layout[data-align="start"] {
    --split-align: start;
  }

  split-layout[data-align="center"],
  .split-layout[data-align="center"] {
    --split-align: center;
  }

  split-layout[data-align="end"],
  .split-layout[data-align="end"] {
    --split-align: end;
  }

  split-layout[data-align="stretch"],
  .split-layout[data-align="stretch"] {
    --split-align: stretch;
  }

  /* Gap variants */
  split-layout[data-gap="none"],
  .split-layout[data-gap="none"] {
    --split-gap: 0;
  }

  split-layout[data-gap="small"],
  .split-layout[data-gap="small"] {
    --split-gap: var(--size-m);
  }

  split-layout[data-gap="large"],
  .split-layout[data-gap="large"] {
    --split-gap: var(--size-2xl);
  }

  /* Images in secondary area */
  split-layout img,
  .split-layout img {
    width: 100%;
    height: auto;
    border-radius: var(--radius-lg, 0.75rem);
  }

  /* Content styling */
  split-layout [data-primary],
  .split-layout [data-primary] {
    display: flex;
    flex-direction: column;
    gap: var(--size-m);
  }

  split-layout [data-primary] h2,
  .split-layout [data-primary] h2 {
    margin: 0;
  }

  split-layout [data-primary] p,
  .split-layout [data-primary] p {
    margin: 0;
    color: var(--text-muted, oklch(0.5 0 0));
  }
}
```

## Accessibility

- **Source Order**: Content order in HTML should be logical
- **Images**: Proper alt text for secondary images
- **Responsive**: Stacks appropriately on mobile

## Examples

### Feature with Image

```html
<split-layout data-align="center">
  <div data-primary>
    <h2>Powerful Analytics</h2>
    <p>Track your performance with real-time dashboards and comprehensive reports.</p>
    <a href="/analytics">Explore Analytics</a>
  </div>
  <div data-secondary>
    <img src="analytics-preview.png" alt="Analytics dashboard preview" />
  </div>
</split-layout>
```

### Alternating Sections

```html
<section>
  <split-layout data-align="center">
    <div data-primary>
      <h2>First Feature</h2>
      <p>Description of the first feature.</p>
    </div>
    <div data-secondary>
      <img src="feature-1.jpg" alt="Feature 1" />
    </div>
  </split-layout>
</section>

<section>
  <split-layout data-order="reverse" data-align="center">
    <div data-primary>
      <h2>Second Feature</h2>
      <p>Description of the second feature.</p>
    </div>
    <div data-secondary>
      <img src="feature-2.jpg" alt="Feature 2" />
    </div>
  </split-layout>
</section>
```

### Wide Text Area

```html
<split-layout data-ratio="wide-left" data-gap="large">
  <div data-primary>
    <h2>Our Story</h2>
    <p>A longer narrative that benefits from more horizontal space. The text area takes up more room while the image remains as supporting content.</p>
  </div>
  <div data-secondary>
    <img src="about.jpg" alt="Our team" />
  </div>
</split-layout>
```

## Related Patterns

- [layout-sidebar](../navigation/layout-sidebar.md)
- [feature-grid](../content/feature-grid.md)
- [hero](../content/hero.md)
