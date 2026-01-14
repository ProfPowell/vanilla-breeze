# Key-Value

## Description

Single key-value pair display for showing labeled data. A building block for stats, metadata, and configuration displays.

## Anatomy

- **container**: The key-value wrapper
- **key**: The label
- **value**: The data

## States

| State | Description |
|-------|-------------|
| Default | Standard display |

## Variants

### Layout

**Attribute:** `data-layout`
**Values:** `stacked`, `inline`, `centered`

### Size

**Attribute:** `data-size`
**Values:** `small`, `default`, `large`

## Baseline HTML

```html
<div class="key-value">
  <span class="key">Status</span>
  <span class="value">Active</span>
</div>
```

## Enhanced HTML

```html
<key-value data-layout="stacked" data-size="large">
  <span data-key>Total Revenue</span>
  <span data-value>$124,500</span>
</key-value>
```

## CSS

```css
@layer components {
  key-value {
    display: flex;
    flex-direction: column;
    gap: var(--size-2xs);
  }

  key-value [data-key] {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-muted, oklch(0.5 0 0));
  }

  key-value [data-value] {
    font-size: var(--text-base);
    font-weight: var(--font-weight-normal);
    color: var(--text, oklch(0.2 0 0));
  }

  /* Inline layout */
  key-value[data-layout="inline"] {
    flex-direction: row;
    align-items: baseline;
    gap: var(--size-xs);
  }

  key-value[data-layout="inline"] [data-key]::after {
    content: ":";
  }

  /* Centered layout */
  key-value[data-layout="centered"] {
    align-items: center;
    text-align: center;
  }

  /* Size variants */
  key-value[data-size="small"] [data-key] {
    font-size: var(--text-xs);
  }

  key-value[data-size="small"] [data-value] {
    font-size: var(--text-sm);
  }

  key-value[data-size="large"] [data-key] {
    font-size: var(--text-base);
  }

  key-value[data-size="large"] [data-value] {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
  }

  /* Hero stat variant */
  key-value[data-hero] {
    align-items: center;
    text-align: center;
    padding: var(--size-l);
  }

  key-value[data-hero] [data-value] {
    font-size: var(--text-3xl);
    font-weight: var(--font-weight-bold);
    background: linear-gradient(135deg, var(--primary), oklch(0.6 0.2 280));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* With icon */
  key-value[data-icon] {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--size-m);
  }

  key-value [data-icon-wrapper] {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-alt, oklch(0.95 0 0));
    border-radius: var(--radius-md);
    color: var(--primary);
  }

  key-value[data-icon] [data-content] {
    display: flex;
    flex-direction: column;
    gap: var(--size-2xs);
  }

  /* Trend indicator */
  key-value [data-trend] {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2xs);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
  }

  key-value [data-trend="up"] {
    color: oklch(0.5 0.15 145);
  }

  key-value [data-trend="down"] {
    color: oklch(0.5 0.15 25);
  }

  key-value [data-trend="neutral"] {
    color: var(--text-muted);
  }

  /* Copyable value */
  key-value [data-copyable] {
    display: flex;
    align-items: center;
    gap: var(--size-xs);
  }

  key-value [data-copy] {
    padding: var(--size-2xs);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  key-value:hover [data-copy] {
    opacity: 1;
  }

  /* Card wrapper */
  key-value[data-card] {
    padding: var(--size-l);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  /* Link value */
  key-value [data-value] a {
    color: var(--primary);
    text-decoration: none;
  }

  key-value [data-value] a:hover {
    text-decoration: underline;
  }
}
```

## Accessibility

- **Semantic**: Uses spans with clear labeling
- **Copy Action**: Buttons have aria-labels
- **Screen Reader**: Key provides context for value

## Examples

### Simple Key-Value

```html
<key-value>
  <span data-key>Status</span>
  <span data-value>Active</span>
</key-value>
```

### Large Stat

```html
<key-value data-size="large" data-layout="centered">
  <span data-key>Total Users</span>
  <span data-value>12,847</span>
</key-value>
```

### Stat with Trend

```html
<key-value data-size="large">
  <span data-key>Revenue</span>
  <span data-value>
    $45,231
    <span data-trend="up">↑ 12.5%</span>
  </span>
</key-value>
```

### With Icon

```html
<key-value data-icon>
  <span data-icon-wrapper>
    <svg><!-- icon --></svg>
  </span>
  <div data-content>
    <span data-key>Downloads</span>
    <span data-value>1.2M</span>
  </div>
</key-value>
```

### Inline with Copy

```html
<key-value data-layout="inline">
  <span data-key>API Key</span>
  <span data-value data-copyable>
    sk_live_abc123...
    <button data-copy aria-label="Copy API key">📋</button>
  </span>
</key-value>
```

### Card Stat

```html
<key-value data-card data-size="large" data-layout="centered">
  <span data-key>Monthly Active Users</span>
  <span data-value>24.5K</span>
</key-value>
```

## Related Patterns

- [definition-list](./definition-list.md)
- [stats](../content/stats.md)
- [card](../content/card.md)
