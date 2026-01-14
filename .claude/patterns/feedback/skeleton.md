# Skeleton

## Description

Loading placeholder that mimics content structure while data loads. Reduces perceived wait time and prevents layout shifts.

## Anatomy

- **container**: Wrapper matching content dimensions
- **shapes**: Placeholder shapes (text lines, circles, rectangles)
- **shimmer**: Optional animated highlight effect

## States

| State | Description |
|-------|-------------|
| Loading | Skeleton visible |
| Loaded | Replaced with actual content |

## Variants

### Type

**Attribute:** `data-type`
**Values:** `text`, `heading`, `avatar`, `image`, `card`, `table-row`

### Animation

**Attribute:** `data-animation`
**Values:** `pulse`, `shimmer`, `none`

## Baseline HTML

```html
<div class="skeleton" aria-busy="true" aria-label="Loading content">
  <div class="skeleton-line"></div>
  <div class="skeleton-line"></div>
  <div class="skeleton-line" style="width: 60%"></div>
</div>
```

## Enhanced HTML

```html
<skeleton-loader data-type="card" data-animation="shimmer">
  <div data-skeleton="image"></div>
  <div data-skeleton="heading"></div>
  <div data-skeleton="text"></div>
  <div data-skeleton="text" style="width: 80%"></div>
</skeleton-loader>
```

## CSS

```css
@layer components {
  skeleton-loader {
    display: block;

    /* Base skeleton shape */
    & [data-skeleton] {
      background: var(--skeleton-bg, oklch(0.9 0 0));
      border-radius: var(--radius-sm);
      position: relative;
      overflow: hidden;
    }

    /* Text line */
    & [data-skeleton="text"] {
      height: 1rem;
      width: 100%;
      margin-block-end: var(--size-xs);
    }

    /* Heading */
    & [data-skeleton="heading"] {
      height: 1.5rem;
      width: 60%;
      margin-block-end: var(--size-m);
    }

    /* Avatar */
    & [data-skeleton="avatar"] {
      width: 3rem;
      height: 3rem;
      border-radius: var(--radius-full);
    }

    & [data-skeleton="avatar-sm"] {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-full);
    }

    & [data-skeleton="avatar-lg"] {
      width: 4rem;
      height: 4rem;
      border-radius: var(--radius-full);
    }

    /* Image placeholder */
    & [data-skeleton="image"] {
      width: 100%;
      aspect-ratio: 16 / 9;
      margin-block-end: var(--size-m);
    }

    /* Button placeholder */
    & [data-skeleton="button"] {
      height: 2.5rem;
      width: 8rem;
      border-radius: var(--radius-md);
    }

    /* Pulse animation */
    &[data-animation="pulse"] [data-skeleton] {
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    /* Shimmer animation */
    &[data-animation="shimmer"] [data-skeleton]::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent,
        oklch(1 0 0 / 0.4),
        transparent
      );
      transform: translateX(-100%);
      animation: skeleton-shimmer 1.5s ease-in-out infinite;
    }
  }

  @keyframes skeleton-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes skeleton-shimmer {
    100% {
      transform: translateX(100%);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    skeleton-loader [data-skeleton],
    skeleton-loader [data-skeleton]::after {
      animation: none;
    }
  }
}

/* Pre-built skeleton patterns */
@layer components {
  /* Card skeleton */
  skeleton-loader[data-type="card"] {
    padding: var(--size-m);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  /* Table row skeleton */
  skeleton-loader[data-type="table-row"] {
    display: grid;
    grid-template-columns: 3rem 1fr 1fr 1fr 6rem;
    gap: var(--size-m);
    padding: var(--size-m);
    align-items: center;

    & [data-skeleton] {
      margin: 0;
    }
  }

  /* List item skeleton */
  skeleton-loader[data-type="list-item"] {
    display: flex;
    gap: var(--size-m);
    padding: var(--size-m);
    align-items: flex-start;

    & [data-skeleton="avatar"] {
      flex-shrink: 0;
    }

    & > div {
      flex: 1;
    }
  }

  /* Profile skeleton */
  skeleton-loader[data-type="profile"] {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--size-m);
    padding: var(--size-xl);

    & [data-skeleton="avatar-lg"] {
      margin-block-end: var(--size-xs);
    }
  }
}
```

## JavaScript Enhancement

```javascript
class SkeletonLoader extends HTMLElement {
  static observedAttributes = ['hidden'];

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'hidden' && newValue !== null) {
      this.setAttribute('aria-busy', 'false');
    }
  }

  connectedCallback() {
    this.setAttribute('aria-busy', 'true');
    this.setAttribute('aria-label', 'Loading content');
  }

  // Helper to create skeleton from template
  static fromTemplate(type) {
    const templates = {
      card: `
        <div data-skeleton="image"></div>
        <div data-skeleton="heading"></div>
        <div data-skeleton="text"></div>
        <div data-skeleton="text" style="width: 80%"></div>
      `,
      'list-item': `
        <div data-skeleton="avatar"></div>
        <div>
          <div data-skeleton="heading" style="width: 40%"></div>
          <div data-skeleton="text"></div>
        </div>
      `,
      profile: `
        <div data-skeleton="avatar-lg"></div>
        <div data-skeleton="heading" style="width: 50%"></div>
        <div data-skeleton="text" style="width: 30%"></div>
      `
    };

    const skeleton = document.createElement('skeleton-loader');
    skeleton.setAttribute('data-type', type);
    skeleton.setAttribute('data-animation', 'shimmer');
    skeleton.innerHTML = templates[type] || templates.card;
    return skeleton;
  }
}

customElements.define('skeleton-loader', SkeletonLoader);
```

## Accessibility

- **Aria Busy**: `aria-busy="true"` indicates loading state
- **Aria Label**: Describes loading content
- **Reduced Motion**: Respects user preferences
- **Color Contrast**: Skeleton shapes are visible but subtle

## Examples

### Card Skeleton

```html
<skeleton-loader data-type="card" data-animation="shimmer">
  <div data-skeleton="image"></div>
  <div data-skeleton="heading"></div>
  <div data-skeleton="text"></div>
  <div data-skeleton="text" style="width: 60%"></div>
</skeleton-loader>
```

### Table Skeleton

```html
<table>
  <tbody>
    <tr>
      <td colspan="5">
        <skeleton-loader data-type="table-row" data-animation="pulse">
          <div data-skeleton="avatar-sm"></div>
          <div data-skeleton="text"></div>
          <div data-skeleton="text"></div>
          <div data-skeleton="text" style="width: 80%"></div>
          <div data-skeleton="button"></div>
        </skeleton-loader>
      </td>
    </tr>
    <!-- Repeat for multiple rows -->
  </tbody>
</table>
```

### List Item Skeleton

```html
<skeleton-loader data-type="list-item" data-animation="shimmer">
  <div data-skeleton="avatar"></div>
  <div>
    <div data-skeleton="heading" style="width: 50%"></div>
    <div data-skeleton="text"></div>
    <div data-skeleton="text" style="width: 70%"></div>
  </div>
</skeleton-loader>
```

### Profile Skeleton

```html
<skeleton-loader data-type="profile" data-animation="shimmer">
  <div data-skeleton="avatar-lg"></div>
  <div data-skeleton="heading" style="width: 40%"></div>
  <div data-skeleton="text" style="width: 25%"></div>
</skeleton-loader>
```

### Inline Text Skeleton

```html
<p>
  Loading user:
  <skeleton-loader data-animation="pulse" style="display: inline-block; width: 8rem;">
    <div data-skeleton="text" style="display: inline-block; width: 100%; margin: 0;"></div>
  </skeleton-loader>
</p>
```

## Related Patterns

- [empty-state](./empty-state.md)
- [progress-bar](./progress-bar.md)
- [card](../content/card.md)
