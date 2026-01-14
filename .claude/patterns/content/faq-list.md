# FAQ List

## Description

Accordion-style FAQ list using native `<details>` and `<summary>` elements. Provides expandable question/answer pairs with progressive enhancement.

## Anatomy

- **container**: FAQ section wrapper
- **heading**: Optional section title
- **list**: Container for FAQ items
- **item**: Individual FAQ (details/summary)
- **question**: Question text (summary)
- **answer**: Collapsible answer content

## States

| State | Description |
|-------|-------------|
| Default | All items collapsed |
| Expanded | Item open, showing answer |
| Collapsed | Item closed |

## Variants

### Style

**Attribute:** `data-style`
**Values:** `default`, `cards`, `minimal`

### Exclusive

**Attribute:** `data-exclusive`
**Values:** (boolean) - Only one item open at a time

## Baseline HTML

```html
<section class="faq">
  <h2>Frequently Asked Questions</h2>
  <div>
    <details>
      <summary>What is your return policy?</summary>
      <p>We offer 30-day returns on all items with original packaging.</p>
    </details>
    <details>
      <summary>How long does shipping take?</summary>
      <p>Standard shipping takes 3-5 business days.</p>
    </details>
  </div>
</section>
```

## Enhanced HTML

```html
<faq-list data-style="cards">
  <header>
    <h2>Frequently Asked Questions</h2>
    <p>Find answers to common questions about our service.</p>
  </header>

  <div data-items>
    <details name="faq">
      <summary>What is your return policy?</summary>
      <div data-answer>
        <p>We offer a 30-day return policy on all items. Products must be in original packaging and unused condition.</p>
      </div>
    </details>

    <details name="faq">
      <summary>How long does shipping take?</summary>
      <div data-answer>
        <p>Standard shipping takes 3-5 business days. Express shipping is available for 1-2 day delivery.</p>
      </div>
    </details>

    <details name="faq">
      <summary>Do you offer international shipping?</summary>
      <div data-answer>
        <p>Yes, we ship to over 50 countries. International shipping times vary by location, typically 7-14 business days.</p>
      </div>
    </details>

    <details name="faq">
      <summary>How can I track my order?</summary>
      <div data-answer>
        <p>Once your order ships, you'll receive an email with tracking information. You can also track orders in your account dashboard.</p>
      </div>
    </details>
  </div>
</faq-list>
```

## CSS

```css
@layer components {
  faq-list {
    display: block;
    padding: var(--size-2xl) var(--size-l);

    /* Section header */
    & > header {
      max-width: 40rem;
      margin-inline: auto;
      margin-block-end: var(--size-2xl);
      text-align: center;

      & h2 {
        font-size: clamp(1.5rem, 3vw, 2.5rem);
        margin-block-end: var(--size-xs);
      }

      & p {
        font-size: var(--text-lg);
        color: var(--text-muted);
      }
    }

    /* Items container */
    & [data-items] {
      max-width: 48rem;
      margin-inline: auto;
      display: flex;
      flex-direction: column;
      gap: var(--size-m);
    }

    /* Individual FAQ item */
    & details {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    & summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--size-m);
      padding: var(--size-l);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      background: var(--surface);
      transition: background var(--transition-fast);
      list-style: none;

      &::-webkit-details-marker {
        display: none;
      }

      &::after {
        content: "+";
        font-size: 1.5em;
        line-height: 1;
        color: var(--text-muted);
        transition: transform var(--transition-fast);
      }

      &:hover {
        background: var(--surface-alt);
      }
    }

    & details[open] summary::after {
      content: "−";
    }

    /* Answer content */
    & [data-answer] {
      padding: 0 var(--size-l) var(--size-l);
      color: var(--text-muted);
      line-height: 1.7;

      & p:first-child {
        margin-block-start: 0;
      }

      & p:last-child {
        margin-block-end: 0;
      }
    }

    /* Cards style variant */
    &[data-style="cards"] details {
      background: var(--surface);
      box-shadow: var(--shadow-sm);
    }

    &[data-style="cards"] details[open] {
      box-shadow: var(--shadow-md);
    }

    /* Minimal style variant */
    &[data-style="minimal"] {
      & details {
        border: none;
        border-radius: 0;
        border-block-end: 1px solid var(--border);
      }

      & details:last-child {
        border-block-end: none;
      }

      & summary {
        padding-inline: 0;
        background: transparent;
      }

      & [data-answer] {
        padding-inline: 0;
      }
    }
  }

  /* Animation */
  @media (prefers-reduced-motion: no-preference) {
    faq-list [data-answer] {
      animation: faq-expand 0.2s ease-out;
    }

    @keyframes faq-expand {
      from {
        opacity: 0;
        transform: translateY(-0.5rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
}
```

## JavaScript Enhancement

Optional: Exclusive mode (one item at a time):

```javascript
class FaqList extends HTMLElement {
  connectedCallback() {
    // The `name` attribute on details handles exclusive mode natively
    // This is for browsers without name attribute support
    if (!this.hasAttribute('data-exclusive')) return;

    this.addEventListener('toggle', (e) => {
      if (e.target.open) {
        this.querySelectorAll('details[open]').forEach(details => {
          if (details !== e.target) details.open = false;
        });
      }
    }, true);
  }
}

customElements.define('faq-list', FaqList);
```

## Schema.org Markup

Add structured data for SEO (FAQ rich results):

```html
<faq-list itemscope itemtype="https://schema.org/FAQPage">
  <div data-items>
    <details itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <summary itemprop="name">What is your return policy?</summary>
      <div data-answer itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p itemprop="text">We offer 30-day returns on all items.</p>
      </div>
    </details>
    <!-- more items -->
  </div>
</faq-list>
```

## Accessibility

- **Native Elements**: Uses `<details>` and `<summary>` for built-in a11y
- **Keyboard**: Enter/Space toggles items
- **Screen Readers**: States announced automatically
- **Focus Visible**: Clear focus styles on summary

## Examples

### Default Style

```html
<faq-list>
  <div data-items>
    <details name="faq">
      <summary>Question here?</summary>
      <div data-answer><p>Answer here.</p></div>
    </details>
  </div>
</faq-list>
```

### Cards Style

```html
<faq-list data-style="cards">
  <header>
    <h2>FAQ</h2>
  </header>
  <div data-items>
    <!-- items -->
  </div>
</faq-list>
```

### Minimal Style

```html
<faq-list data-style="minimal">
  <div data-items>
    <!-- items -->
  </div>
</faq-list>
```

### Pre-expanded Item

```html
<details name="faq" open>
  <summary>This item starts open</summary>
  <div data-answer><p>Content visible by default.</p></div>
</details>
```

## Related Patterns

- [hero](./hero.md)
- [cta](./cta.md)
- [card](./card.md)
