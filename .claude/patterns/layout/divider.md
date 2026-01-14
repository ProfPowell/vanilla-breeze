# Divider

## Description

Visual separator for distinguishing content sections. Uses the semantic `<hr>` element with enhanced styling options.

## Anatomy

- **line**: The divider element itself

## States

| State | Description |
|-------|-------------|
| Default | Horizontal line separator |

## Variants

### Orientation

**Attribute:** `data-orientation`
**Values:** `horizontal` (default), `vertical`

### Style

**Attribute:** `data-style`
**Values:** `solid`, `dashed`, `dotted`, `gradient`

### Spacing

**Attribute:** `data-spacing`
**Values:** `none`, `small`, `default`, `large`

### Label

**Attribute:** `data-label`
**Values:** Text to display in center of divider

## Baseline HTML

```html
<hr />
```

## Enhanced HTML

```html
<layout-divider data-style="solid" data-spacing="default"></layout-divider>

<!-- With label -->
<layout-divider data-label="or"></layout-divider>
```

## CSS

```css
@layer layout {
  layout-divider,
  hr.divider {
    --divider-color: var(--border, oklch(0.85 0 0));
    --divider-spacing: var(--size-l);
    --divider-thickness: 1px;

    display: flex;
    align-items: center;
    gap: var(--size-m);
    margin-block: var(--divider-spacing);
    border: none;
    color: var(--text-muted, oklch(0.5 0 0));
    font-size: var(--text-sm, 0.875rem);
  }

  /* Line using pseudo-elements */
  layout-divider::before,
  layout-divider::after,
  hr.divider::before,
  hr.divider::after {
    content: "";
    flex: 1;
    height: var(--divider-thickness);
    background: var(--divider-color);
  }

  /* Without label - single line */
  layout-divider:not([data-label])::after,
  hr.divider:not([data-label])::after {
    display: none;
  }

  layout-divider:not([data-label])::before,
  hr.divider:not([data-label])::before {
    flex: 1;
  }

  /* With label - show both lines */
  layout-divider[data-label]::before,
  layout-divider[data-label]::after,
  hr.divider[data-label]::before,
  hr.divider[data-label]::after {
    flex: 1;
  }

  /* Style variants */
  layout-divider[data-style="dashed"]::before,
  layout-divider[data-style="dashed"]::after,
  hr.divider[data-style="dashed"]::before,
  hr.divider[data-style="dashed"]::after {
    background: none;
    border-top: var(--divider-thickness) dashed var(--divider-color);
    height: 0;
  }

  layout-divider[data-style="dotted"]::before,
  layout-divider[data-style="dotted"]::after,
  hr.divider[data-style="dotted"]::before,
  hr.divider[data-style="dotted"]::after {
    background: none;
    border-top: var(--divider-thickness) dotted var(--divider-color);
    height: 0;
  }

  layout-divider[data-style="gradient"]::before,
  hr.divider[data-style="gradient"]::before {
    background: linear-gradient(to right, transparent, var(--divider-color));
  }

  layout-divider[data-style="gradient"]::after,
  hr.divider[data-style="gradient"]::after {
    background: linear-gradient(to left, transparent, var(--divider-color));
  }

  /* Spacing variants */
  layout-divider[data-spacing="none"],
  hr.divider[data-spacing="none"] {
    --divider-spacing: 0;
  }

  layout-divider[data-spacing="small"],
  hr.divider[data-spacing="small"] {
    --divider-spacing: var(--size-xs);
  }

  layout-divider[data-spacing="large"],
  hr.divider[data-spacing="large"] {
    --divider-spacing: var(--size-2xl);
  }

  /* Vertical orientation */
  layout-divider[data-orientation="vertical"],
  hr.divider[data-orientation="vertical"] {
    flex-direction: column;
    margin-block: 0;
    margin-inline: var(--divider-spacing);
    height: auto;
    align-self: stretch;
  }

  layout-divider[data-orientation="vertical"]::before,
  layout-divider[data-orientation="vertical"]::after,
  hr.divider[data-orientation="vertical"]::before,
  hr.divider[data-orientation="vertical"]::after {
    width: var(--divider-thickness);
    height: auto;
    flex: 1;
  }

  /* Decorative dividers */
  layout-divider[data-decorative],
  hr.divider[data-decorative] {
    --divider-thickness: 2px;
  }

  layout-divider[data-decorative]::before,
  hr.divider[data-decorative]::before {
    max-width: 4rem;
    background: var(--primary, oklch(0.55 0.2 250));
    margin-inline: auto;
  }

  /* Icon in label */
  layout-divider [data-icon],
  hr.divider [data-icon] {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-full, 9999px);
    background: var(--surface, white);
    border: 1px solid var(--border, oklch(0.85 0 0));
  }
}
```

## JavaScript Enhancement

```javascript
class LayoutDivider extends HTMLElement {
  connectedCallback() {
    // Add label text if data-label is set
    const label = this.getAttribute('data-label');
    if (label && !this.textContent.trim()) {
      this.textContent = label;
    }

    // Set role for accessibility
    this.setAttribute('role', 'separator');

    if (this.getAttribute('data-orientation') === 'vertical') {
      this.setAttribute('aria-orientation', 'vertical');
    }
  }
}

customElements.define('layout-divider', LayoutDivider);
```

## Accessibility

- **Semantic**: Uses `role="separator"` for screen readers
- **Orientation**: `aria-orientation` for vertical dividers
- **Decorative**: If purely decorative, use `aria-hidden="true"`

## Examples

### Simple Divider

```html
<section>
  <h2>First Section</h2>
  <p>Content here...</p>
</section>

<layout-divider></layout-divider>

<section>
  <h2>Second Section</h2>
  <p>More content...</p>
</section>
```

### Divider with Label

```html
<button>Sign in with Email</button>

<layout-divider data-label="or"></layout-divider>

<button>Continue with Google</button>
```

### Dashed Divider

```html
<layout-divider data-style="dashed" data-spacing="small"></layout-divider>
```

### Gradient Divider

```html
<layout-divider data-style="gradient" data-spacing="large"></layout-divider>
```

### Decorative Section Break

```html
<article>
  <p>End of first part...</p>

  <layout-divider data-decorative data-spacing="large"></layout-divider>

  <p>Beginning of second part...</p>
</article>
```

### Vertical Divider (in Cluster)

```html
<layout-cluster data-gap="md" data-align="center">
  <span>Option A</span>
  <layout-divider data-orientation="vertical" data-spacing="small"></layout-divider>
  <span>Option B</span>
  <layout-divider data-orientation="vertical" data-spacing="small"></layout-divider>
  <span>Option C</span>
</layout-cluster>
```

### Divider with Icon

```html
<layout-divider>
  <span data-icon>
    <x-icon name="star"></x-icon>
  </span>
</layout-divider>
```

## Related Patterns

- [spacer](./spacer.md)
- [stack](./stack.md)
- [content-width](./content-width.md)
