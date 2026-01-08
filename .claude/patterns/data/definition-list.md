# Definition List

## Description

Semantic display of key-value pairs using the native `<dl>` element. Ideal for metadata, specifications, settings, and any labeled data.

## Anatomy

- **container**: The definition list wrapper
- **group**: Term and definition pair
- **term**: The label/key (`<dt>`)
- **definition**: The value (`<dd>`)

## States

| State | Description |
|-------|-------------|
| Default | Standard key-value display |

## Variants

### Layout

**Attribute:** `data-layout`
**Values:** `stacked`, `inline`, `grid`

### Alignment

**Attribute:** `data-align`
**Values:** `start`, `end`

### Dividers

**Attribute:** `data-dividers`
**Values:** `true`, `false`

## Baseline HTML

```html
<dl>
  <dt>Name</dt>
  <dd>John Doe</dd>
  <dt>Email</dt>
  <dd>john@example.com</dd>
</dl>
```

## Enhanced HTML

```html
<definition-list data-layout="grid" data-dividers>
  <div data-group>
    <dt>Name</dt>
    <dd>John Doe</dd>
  </div>
  <div data-group>
    <dt>Email</dt>
    <dd>john@example.com</dd>
  </div>
  <div data-group>
    <dt>Phone</dt>
    <dd>+1 (555) 123-4567</dd>
  </div>
  <div data-group>
    <dt>Location</dt>
    <dd>San Francisco, CA</dd>
  </div>
</definition-list>
```

## CSS

```css
@layer components {
  definition-list,
  dl.definition-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin: 0;
  }

  definition-list [data-group],
  dl.definition-list > div {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  definition-list dt,
  dl.definition-list dt {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-muted, oklch(0.5 0 0));
  }

  definition-list dd,
  dl.definition-list dd {
    margin: 0;
    font-size: var(--text-base);
    color: var(--text, oklch(0.2 0 0));
  }

  /* Inline layout */
  definition-list[data-layout="inline"] [data-group],
  dl.definition-list[data-layout="inline"] > div {
    flex-direction: row;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--spacing-md);
  }

  definition-list[data-layout="inline"] dt {
    flex-shrink: 0;
  }

  definition-list[data-layout="inline"] dd {
    text-align: end;
  }

  /* Grid layout */
  definition-list[data-layout="grid"] {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
  }

  @media (max-width: 29.999rem) {
    definition-list[data-layout="grid"] {
      grid-template-columns: 1fr;
    }
  }

  /* Dividers */
  definition-list[data-dividers] [data-group],
  dl.definition-list[data-dividers] > div {
    padding-block-end: var(--spacing-md);
    border-block-end: 1px solid var(--border, oklch(0.9 0 0));
  }

  definition-list[data-dividers] [data-group]:last-child,
  dl.definition-list[data-dividers] > div:last-child {
    padding-block-end: 0;
    border-block-end: none;
  }

  /* Alignment */
  definition-list[data-align="end"] dd {
    text-align: end;
  }

  /* Compact variant */
  definition-list[data-compact] {
    gap: var(--spacing-sm);
  }

  definition-list[data-compact] dt {
    font-size: var(--text-xs);
  }

  definition-list[data-compact] dd {
    font-size: var(--text-sm);
  }

  /* With icons */
  definition-list [data-icon] {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  definition-list [data-icon] svg {
    width: 1rem;
    height: 1rem;
    color: var(--text-muted);
  }

  /* Copyable values */
  definition-list [data-copyable] {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  definition-list [data-copy-btn] {
    padding: var(--spacing-xs);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  definition-list [data-group]:hover [data-copy-btn],
  definition-list [data-copy-btn]:focus {
    opacity: 1;
  }

  definition-list [data-copy-btn]:hover {
    background: var(--overlay-light);
    color: var(--text);
  }

  /* Links in definitions */
  definition-list dd a {
    color: var(--primary);
    text-decoration: none;
  }

  definition-list dd a:hover {
    text-decoration: underline;
  }

  /* Badge values */
  definition-list [data-badge] {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-full);
    background: var(--surface-alt);
  }
}
```

## JavaScript Enhancement

```javascript
class DefinitionList extends HTMLElement {
  connectedCallback() {
    // Add copy functionality
    this.querySelectorAll('[data-copyable]').forEach((dd) => {
      const value = dd.textContent.trim();
      const btn = document.createElement('button');
      btn.setAttribute('data-copy-btn', '');
      btn.setAttribute('aria-label', 'Copy to clipboard');
      btn.innerHTML = '📋';

      btn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(value);
        btn.innerHTML = '✓';
        setTimeout(() => (btn.innerHTML = '📋'), 2000);
      });

      dd.appendChild(btn);
    });
  }
}

customElements.define('definition-list', DefinitionList);
```

## Accessibility

- **Semantic**: Uses native `<dl>`, `<dt>`, `<dd>` elements
- **Relationships**: Terms and definitions are properly associated
- **Copyable**: Copy buttons have aria-labels

## Examples

### Profile Details

```html
<definition-list data-layout="stacked" data-dividers>
  <div data-group>
    <dt>Full Name</dt>
    <dd>John Doe</dd>
  </div>
  <div data-group>
    <dt>Email</dt>
    <dd data-copyable>john@example.com</dd>
  </div>
  <div data-group>
    <dt>Member Since</dt>
    <dd>January 15, 2024</dd>
  </div>
  <div data-group>
    <dt>Status</dt>
    <dd><span data-badge>Active</span></dd>
  </div>
</definition-list>
```

### Product Specifications

```html
<definition-list data-layout="inline" data-dividers>
  <div data-group>
    <dt>Dimensions</dt>
    <dd>10" × 8" × 4"</dd>
  </div>
  <div data-group>
    <dt>Weight</dt>
    <dd>2.5 lbs</dd>
  </div>
  <div data-group>
    <dt>Material</dt>
    <dd>Aluminum</dd>
  </div>
  <div data-group>
    <dt>Color</dt>
    <dd>Space Gray</dd>
  </div>
</definition-list>
```

### Settings Grid

```html
<definition-list data-layout="grid">
  <div data-group>
    <dt>Language</dt>
    <dd>English (US)</dd>
  </div>
  <div data-group>
    <dt>Timezone</dt>
    <dd>Pacific Time (PT)</dd>
  </div>
  <div data-group>
    <dt>Currency</dt>
    <dd>USD ($)</dd>
  </div>
  <div data-group>
    <dt>Date Format</dt>
    <dd>MM/DD/YYYY</dd>
  </div>
</definition-list>
```

## Related Patterns

- [key-value](./key-value.md)
- [data-table](./data-table.md)
- [card](../content/card.md)
