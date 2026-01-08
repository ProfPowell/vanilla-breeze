# Comparison Table

## Description

Side-by-side feature comparison table for products, plans, or options. Uses sticky headers and visual indicators for easy scanning.

## Anatomy

- **wrapper**: Responsive scroll container
- **table**: The comparison table
- **header**: Product/plan names with optional pricing
- **feature-group**: Grouped features with section headers
- **feature-row**: Individual feature with check/cross indicators
- **cta**: Call-to-action buttons

## States

| State | Description |
|-------|-------------|
| Default | All columns visible |
| Highlighted | Recommended column emphasized |
| Sticky | Headers stick on scroll |

## Variants

### Columns

**Attribute:** `data-columns`
**Values:** `2`, `3`, `4`, `5`

### Style

**Attribute:** `data-style`
**Values:** `default`, `cards`, `minimal`

## Baseline HTML

```html
<div class="comparison-table">
  <table>
    <thead>
      <tr>
        <th></th>
        <th>Basic</th>
        <th>Pro</th>
        <th>Enterprise</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Storage</td>
        <td>5 GB</td>
        <td>50 GB</td>
        <td>Unlimited</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Enhanced HTML

```html
<comparison-table data-columns="3" data-style="default">
  <table>
    <thead>
      <tr>
        <th data-feature-header>Features</th>
        <th data-plan>
          <span data-plan-name>Starter</span>
          <span data-plan-price>$9/mo</span>
        </th>
        <th data-plan data-recommended>
          <span data-badge>Most Popular</span>
          <span data-plan-name>Pro</span>
          <span data-plan-price>$29/mo</span>
        </th>
        <th data-plan>
          <span data-plan-name>Enterprise</span>
          <span data-plan-price>Custom</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr data-group-header>
        <td colspan="4">Core Features</td>
      </tr>
      <tr>
        <td data-feature>Projects</td>
        <td data-value>3</td>
        <td data-value data-recommended>Unlimited</td>
        <td data-value>Unlimited</td>
      </tr>
      <tr>
        <td data-feature>Team Members</td>
        <td data-value>1</td>
        <td data-value data-recommended>10</td>
        <td data-value>Unlimited</td>
      </tr>
      <tr>
        <td data-feature>API Access</td>
        <td data-check="false"></td>
        <td data-check="true" data-recommended></td>
        <td data-check="true"></td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td></td>
        <td><a href="#" data-cta>Get Started</a></td>
        <td data-recommended><a href="#" data-cta="primary">Start Free Trial</a></td>
        <td><a href="#" data-cta>Contact Sales</a></td>
      </tr>
    </tfoot>
  </table>
</comparison-table>
```

## CSS

```css
@layer components {
  comparison-table {
    display: block;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  comparison-table table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
  }

  /* Header */
  comparison-table thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--surface, white);
  }

  comparison-table th {
    padding: var(--spacing-lg);
    text-align: center;
    vertical-align: bottom;
    border-block-end: 2px solid var(--border, oklch(0.85 0 0));
  }

  comparison-table th[data-feature-header] {
    text-align: start;
    font-weight: var(--font-weight-medium);
    color: var(--text-muted);
  }

  /* Plan headers */
  comparison-table th[data-plan] {
    min-width: 10rem;
  }

  comparison-table [data-plan-name] {
    display: block;
    font-size: var(--text-xl);
    font-weight: var(--font-weight-bold);
    color: var(--text);
  }

  comparison-table [data-plan-price] {
    display: block;
    font-size: var(--text-lg);
    font-weight: var(--font-weight-medium);
    color: var(--text-muted);
    margin-block-start: var(--spacing-xs);
  }

  /* Recommended column */
  comparison-table [data-recommended] {
    background: oklch(0.97 0.02 250);
    position: relative;
  }

  comparison-table th[data-recommended] {
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    border: 2px solid var(--primary);
    border-block-end: none;
  }

  comparison-table td[data-recommended] {
    border-inline: 2px solid var(--primary);
  }

  comparison-table tfoot td[data-recommended] {
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    border: 2px solid var(--primary);
    border-block-start: none;
  }

  comparison-table [data-badge] {
    display: inline-block;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    background: var(--primary);
    color: var(--primary-contrast);
    border-radius: var(--radius-full);
    margin-block-end: var(--spacing-sm);
  }

  /* Body */
  comparison-table tbody td {
    padding: var(--spacing-md) var(--spacing-lg);
    text-align: center;
    border-block-end: 1px solid var(--border, oklch(0.9 0 0));
  }

  comparison-table td[data-feature] {
    text-align: start;
    font-weight: var(--font-weight-medium);
    color: var(--text);
  }

  comparison-table td[data-value] {
    font-size: var(--text-sm);
    color: var(--text);
  }

  /* Group headers */
  comparison-table tr[data-group-header] td {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    background: var(--surface-alt);
    text-align: start;
  }

  /* Check/cross indicators */
  comparison-table td[data-check]::before {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: var(--radius-full);
    font-weight: var(--font-weight-bold);
  }

  comparison-table td[data-check="true"]::before {
    content: "✓";
    background: oklch(0.95 0.05 145);
    color: oklch(0.4 0.15 145);
  }

  comparison-table td[data-check="false"]::before {
    content: "—";
    background: var(--surface-alt);
    color: var(--text-muted);
  }

  /* Footer / CTAs */
  comparison-table tfoot td {
    padding: var(--spacing-lg);
    text-align: center;
    border-block-start: 2px solid var(--border);
  }

  comparison-table [data-cta] {
    display: inline-block;
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    color: var(--text);
    background: var(--surface);
    transition: background var(--transition-fast);
  }

  comparison-table [data-cta]:hover {
    background: var(--surface-alt);
  }

  comparison-table [data-cta="primary"] {
    background: var(--primary);
    color: var(--primary-contrast);
    border-color: var(--primary);
  }

  comparison-table [data-cta="primary"]:hover {
    background: var(--primary-hover);
  }

  /* Cards style variant */
  comparison-table[data-style="cards"] th[data-plan] {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  /* Minimal style variant */
  comparison-table[data-style="minimal"] th,
  comparison-table[data-style="minimal"] td {
    border: none;
  }

  comparison-table[data-style="minimal"] tbody tr:hover {
    background: var(--overlay-light);
  }
}

/* Mobile: scroll hint */
@media (max-width: 47.999rem) {
  comparison-table::after {
    content: "Scroll to see more →";
    display: block;
    padding: var(--spacing-sm);
    text-align: center;
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
}
```

## Accessibility

- **Semantic Table**: Proper `<thead>`, `<tbody>`, `<tfoot>` structure
- **Headers**: Column headers clearly identify each plan
- **Visual Indicators**: Check marks have text alternatives
- **Responsive**: Horizontal scroll with hint on mobile

## Examples

### Pricing Comparison

```html
<comparison-table data-columns="3">
  <table>
    <thead>
      <tr>
        <th data-feature-header>Compare Plans</th>
        <th data-plan>
          <span data-plan-name>Free</span>
          <span data-plan-price>$0</span>
        </th>
        <th data-plan data-recommended>
          <span data-badge>Best Value</span>
          <span data-plan-name>Pro</span>
          <span data-plan-price>$19/mo</span>
        </th>
        <th data-plan>
          <span data-plan-name>Team</span>
          <span data-plan-price>$49/mo</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td data-feature>Users</td>
        <td data-value>1</td>
        <td data-value data-recommended>5</td>
        <td data-value>Unlimited</td>
      </tr>
      <tr>
        <td data-feature>Storage</td>
        <td data-value>1 GB</td>
        <td data-value data-recommended>100 GB</td>
        <td data-value>1 TB</td>
      </tr>
      <tr>
        <td data-feature>Priority Support</td>
        <td data-check="false"></td>
        <td data-check="true" data-recommended></td>
        <td data-check="true"></td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td></td>
        <td><a href="#" data-cta>Sign Up Free</a></td>
        <td data-recommended><a href="#" data-cta="primary">Start Trial</a></td>
        <td><a href="#" data-cta>Contact Sales</a></td>
      </tr>
    </tfoot>
  </table>
</comparison-table>
```

### Feature Comparison

```html
<comparison-table data-style="minimal">
  <table>
    <thead>
      <tr>
        <th data-feature-header>Feature</th>
        <th>Product A</th>
        <th>Product B</th>
      </tr>
    </thead>
    <tbody>
      <tr data-group-header>
        <td colspan="3">Performance</td>
      </tr>
      <tr>
        <td data-feature>Speed</td>
        <td data-value>Fast</td>
        <td data-value>Very Fast</td>
      </tr>
      <tr>
        <td data-feature>Reliability</td>
        <td data-check="true"></td>
        <td data-check="true"></td>
      </tr>
    </tbody>
  </table>
</comparison-table>
```

## Related Patterns

- [data-table](./data-table.md)
- [pricing-table](../content/pricing-table.md)
- [card-grid](../layout/card-grid.md)
