# CTA (Call to Action)

## Description

Prominent section encouraging user action. Typically contains a headline, supporting text, and action buttons. Used to drive conversions at key points in a page.

## Anatomy

- **container**: CTA section wrapper
- **content**: Text content area
- **headline**: Primary message
- **subhead**: Supporting text
- **actions**: Action buttons

## States

| State | Description |
|-------|-------------|
| Default | Standard appearance |

## Variants

### Style

**Attribute:** `data-style`
**Values:** `default`, `highlight`, `minimal`, `banner`

### Alignment

**Attribute:** `data-align`
**Values:** `start`, `center`, `split`

## Baseline HTML

```html
<section class="cta">
  <h2>Ready to get started?</h2>
  <p>Join thousands of teams already using our platform.</p>
  <div>
    <a href="/signup">Start Free Trial</a>
    <a href="/contact">Contact Sales</a>
  </div>
</section>
```

## Enhanced HTML

```html
<cta-section data-style="highlight" data-align="center">
  <div data-content>
    <h2>Ready to transform your workflow?</h2>
    <p>Join thousands of teams already using our platform to build better products faster.</p>
    <div data-actions>
      <a href="/signup" data-button="primary">Start Free Trial</a>
      <a href="/contact" data-button="secondary">Contact Sales</a>
    </div>
  </div>
</cta-section>
```

## CSS

```css
@layer components {
  cta-section {
    display: block;
    padding: var(--size-2xl) var(--size-l);

    /* Content wrapper */
    & [data-content] {
      max-width: 48rem;
      margin-inline: auto;
    }

    /* Headline */
    & h2 {
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      line-height: 1.2;
      margin-block-end: var(--size-m);
    }

    /* Supporting text */
    & p {
      font-size: var(--text-lg);
      color: var(--text-muted);
      margin-block-end: var(--size-xl);
      line-height: 1.6;
    }

    /* Actions */
    & [data-actions] {
      display: flex;
      flex-wrap: wrap;
      gap: var(--size-m);
    }

    & [data-button] {
      display: inline-flex;
      align-items: center;
      gap: var(--size-xs);
      padding: var(--size-m) var(--size-xl);
      font-size: var(--text-base);
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
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }

    /* Style variants */
    &[data-style="default"] {
      background: var(--surface-alt);
      border-radius: var(--radius-lg);
    }

    &[data-style="highlight"] {
      background: var(--primary);
      color: var(--primary-contrast);
      border-radius: var(--radius-lg);

      & h2 {
        color: inherit;
      }

      & p {
        color: oklch(1 0 0 / 0.85);
      }

      & [data-button="primary"] {
        background: white;
        color: var(--primary);
      }

      & [data-button="secondary"] {
        background: transparent;
        color: white;
        border-color: oklch(1 0 0 / 0.3);
      }
    }

    &[data-style="minimal"] {
      padding-block: var(--size-xl);
      border-block-start: 1px solid var(--border);
    }

    &[data-style="banner"] {
      padding: var(--size-l);
      background: var(--surface-alt);

      & [data-content] {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--size-l);
        max-width: var(--content-max-width);
      }

      & h2 {
        font-size: var(--text-xl);
        margin: 0;
      }

      & p {
        margin: 0;
        font-size: var(--text-base);
      }
    }

    /* Alignment variants */
    &[data-align="center"] {
      text-align: center;

      & [data-actions] {
        justify-content: center;
      }
    }

    &[data-align="start"] {
      text-align: start;

      & [data-actions] {
        justify-content: flex-start;
      }
    }

    &[data-align="split"] {
      & [data-content] {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--size-xl);
        max-width: var(--content-max-width);
      }

      & p {
        margin: 0;
      }
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    cta-section {
      &[data-align="split"] [data-content],
      &[data-style="banner"] [data-content] {
        flex-direction: column;
        text-align: center;
      }

      & [data-actions] {
        flex-direction: column;
        width: 100%;

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

- **Heading Hierarchy**: Uses h2 (adjust based on page context)
- **Button Labels**: CTAs have clear, actionable text
- **Color Contrast**: Sufficient contrast in all variants

## Examples

### Centered Highlight CTA

```html
<cta-section data-style="highlight" data-align="center">
  <div data-content>
    <h2>Start building today</h2>
    <p>No credit card required. Free 14-day trial.</p>
    <div data-actions>
      <a href="/signup" data-button="primary">Get Started Free</a>
    </div>
  </div>
</cta-section>
```

### Split Layout CTA

```html
<cta-section data-style="default" data-align="split">
  <div data-content>
    <div>
      <h2>Need help choosing?</h2>
      <p>Our team is here to help you find the right plan.</p>
    </div>
    <div data-actions>
      <a href="/contact" data-button="primary">Talk to Sales</a>
    </div>
  </div>
</cta-section>
```

### Banner CTA

```html
<cta-section data-style="banner">
  <div data-content>
    <div>
      <h2>Limited time offer</h2>
      <p>Get 20% off annual plans this month.</p>
    </div>
    <div data-actions>
      <a href="/pricing" data-button="primary">View Pricing</a>
    </div>
  </div>
</cta-section>
```

### Minimal CTA

```html
<cta-section data-style="minimal" data-align="center">
  <div data-content>
    <h2>Questions?</h2>
    <p>Check our FAQ or reach out to support.</p>
    <div data-actions>
      <a href="/faq" data-button="secondary">View FAQ</a>
      <a href="/contact" data-button="secondary">Contact Us</a>
    </div>
  </div>
</cta-section>
```

## Related Patterns

- [hero](./hero.md)
- [banner](../feedback/banner.md)
- [feature-grid](./feature-grid.md)
