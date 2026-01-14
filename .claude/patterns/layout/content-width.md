# Content Width

## Description

Container utility that constrains content to a maximum width and centers it horizontally. Essential for readable content and consistent page layouts.

## Anatomy

- **container**: The width-constraining wrapper
- **content**: Any child content

## States

| State | Description |
|-------|-------------|
| Default | Standard max-width with padding |

## Variants

### Size

**Attribute:** `data-width`
**Values:** `narrow`, `default`, `wide`, `full`

### Padding

**Attribute:** `data-padding`
**Values:** `none`, `default`, `large`

## Baseline HTML

```html
<div class="content-width">
  <h1>Page Title</h1>
  <p>Content goes here...</p>
</div>
```

## Enhanced HTML

```html
<content-width data-width="default" data-padding="default">
  <h1>Page Title</h1>
  <p>Content goes here...</p>
</content-width>
```

## CSS

```css
@layer layout {
  content-width,
  .content-width {
    --content-width-narrow: 40rem;
    --content-width-default: 65rem;
    --content-width-wide: 80rem;
    --content-padding: var(--size-l);

    display: block;
    width: 100%;
    max-width: var(--content-width-default);
    margin-inline: auto;
    padding-inline: var(--content-padding);
  }

  /* Width variants */
  content-width[data-width="narrow"],
  .content-width[data-width="narrow"] {
    max-width: var(--content-width-narrow);
  }

  content-width[data-width="wide"],
  .content-width[data-width="wide"] {
    max-width: var(--content-width-wide);
  }

  content-width[data-width="full"],
  .content-width[data-width="full"] {
    max-width: none;
  }

  /* Padding variants */
  content-width[data-padding="none"],
  .content-width[data-padding="none"] {
    padding-inline: 0;
  }

  content-width[data-padding="large"],
  .content-width[data-padding="large"] {
    padding-inline: var(--size-xl);
  }

  /* Prose optimization for narrow content */
  content-width[data-width="narrow"] {
    & p,
    & li {
      max-width: 65ch;
    }
  }
}
```

## Accessibility

- **Semantic Neutral**: Uses block display, doesn't interfere with document structure
- **Responsive**: Maintains readability across screen sizes

## Examples

### Standard Content

```html
<content-width>
  <article>
    <h1>Article Title</h1>
    <p>Article content with optimal line length for readability.</p>
  </article>
</content-width>
```

### Narrow Prose

```html
<content-width data-width="narrow">
  <article class="prose">
    <h1>Blog Post</h1>
    <p>Long-form content benefits from narrower width for easier reading.</p>
  </article>
</content-width>
```

### Wide Layout

```html
<content-width data-width="wide">
  <div class="card-grid">
    <!-- More horizontal space for grid layouts -->
  </div>
</content-width>
```

### No Padding (Full Container Control)

```html
<content-width data-width="default" data-padding="none">
  <nav>
    <!-- Navigation that handles its own padding -->
  </nav>
</content-width>
```

## Related Patterns

- [full-bleed](./full-bleed.md)
- [layout-stack](../navigation/layout-stack.md)
- [stack](./stack.md)
