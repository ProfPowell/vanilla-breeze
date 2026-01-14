# Stats

## Description

Display of key metrics and numbers. Used to highlight important statistics, achievements, or data points. Often found on landing pages and dashboards.

## Anatomy

- **container**: Stats section wrapper
- **heading**: Optional section title
- **grid**: Grid of stat items
- **stat**: Individual stat container
- **value**: The number or metric
- **label**: Description of the stat
- **icon**: Optional icon

## States

| State | Description |
|-------|-------------|
| Default | Standard appearance |
| Animated | Count-up animation on scroll |

## Variants

### Style

**Attribute:** `data-style`
**Values:** `default`, `cards`, `minimal`, `highlight`

### Columns

**Attribute:** `data-columns`
**Values:** `2`, `3`, `4`

## Baseline HTML

```html
<section class="stats">
  <dl>
    <div>
      <dt>Active Users</dt>
      <dd>10,000+</dd>
    </div>
    <div>
      <dt>Countries</dt>
      <dd>50+</dd>
    </div>
    <div>
      <dt>Uptime</dt>
      <dd>99.9%</dd>
    </div>
  </dl>
</section>
```

## Enhanced HTML

```html
<stats-section data-style="cards" data-columns="4">
  <header>
    <h2>Trusted by teams worldwide</h2>
    <p>Join thousands of companies using our platform.</p>
  </header>

  <dl data-grid>
    <div data-stat>
      <dd data-value>10,000+</dd>
      <dt data-label>Active Users</dt>
    </div>
    <div data-stat>
      <dd data-value>50+</dd>
      <dt data-label>Countries</dt>
    </div>
    <div data-stat>
      <dd data-value>99.9%</dd>
      <dt data-label>Uptime</dt>
    </div>
    <div data-stat>
      <dd data-value>24/7</dd>
      <dt data-label>Support</dt>
    </div>
  </dl>
</stats-section>
```

## CSS

```css
@layer components {
  stats-section {
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

    /* Stats grid */
    & [data-grid] {
      display: grid;
      gap: var(--size-xl);
      max-width: var(--content-max-width);
      margin: 0 auto;
    }

    /* Individual stat */
    & [data-stat] {
      display: flex;
      flex-direction: column;
      gap: var(--size-2xs);
      text-align: center;
    }

    & [data-value] {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: var(--font-weight-bold);
      line-height: 1;
      color: var(--primary);
      margin: 0;
    }

    & [data-label] {
      font-size: var(--text-base);
      color: var(--text-muted);
    }

    /* Column variants */
    &[data-columns="2"] [data-grid] {
      grid-template-columns: repeat(2, 1fr);
    }

    &[data-columns="3"] [data-grid] {
      grid-template-columns: repeat(3, 1fr);
    }

    &[data-columns="4"] [data-grid] {
      grid-template-columns: repeat(4, 1fr);
    }

    /* Style variants */
    &[data-style="cards"] [data-stat] {
      padding: var(--size-xl);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }

    &[data-style="minimal"] {
      & [data-stat] {
        padding: var(--size-l) 0;
        border-block-start: 1px solid var(--border);
      }
    }

    &[data-style="highlight"] {
      background: var(--primary);
      color: var(--primary-contrast);
      border-radius: var(--radius-lg);

      & [data-value] {
        color: inherit;
      }

      & [data-label] {
        color: oklch(1 0 0 / 0.8);
      }
    }

    /* With icons */
    & [data-stat] x-icon {
      font-size: 2rem;
      color: var(--primary);
      margin-block-end: var(--size-xs);
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    stats-section {
      &[data-columns="3"] [data-grid],
      &[data-columns="4"] [data-grid] {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  }

  @media (max-width: 480px) {
    stats-section {
      & [data-grid] {
        grid-template-columns: 1fr !important;
      }
    }
  }
}
```

## JavaScript Enhancement

Optional: Count-up animation on scroll:

```javascript
class StatsSection extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute('data-animate')) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateStats();
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });

    observer.observe(this);
  }

  animateStats() {
    this.querySelectorAll('[data-value]').forEach(el => {
      const target = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
      const suffix = el.textContent.replace(/[0-9.,]/g, '');
      let current = 0;
      const increment = target / 50;

      const animate = () => {
        current += increment;
        if (current < target) {
          el.textContent = Math.floor(current).toLocaleString() + suffix;
          requestAnimationFrame(animate);
        } else {
          el.textContent = target.toLocaleString() + suffix;
        }
      };
      animate();
    });
  }
}

customElements.define('stats-section', StatsSection);
```

## Accessibility

- **Semantic Structure**: Uses `<dl>`, `<dt>`, `<dd>` for data
- **Reduced Motion**: Animation respects `prefers-reduced-motion`

## Examples

### Four-Column Cards

```html
<stats-section data-style="cards" data-columns="4">
  <dl data-grid>
    <div data-stat>
      <dd data-value>500K+</dd>
      <dt data-label>Downloads</dt>
    </div>
    <div data-stat>
      <dd data-value>4.9</dd>
      <dt data-label>Rating</dt>
    </div>
    <div data-stat>
      <dd data-value>100+</dd>
      <dt data-label>Integrations</dt>
    </div>
    <div data-stat>
      <dd data-value>24/7</dd>
      <dt data-label>Support</dt>
    </div>
  </dl>
</stats-section>
```

### Highlighted Section

```html
<stats-section data-style="highlight" data-columns="3">
  <dl data-grid>
    <div data-stat>
      <dd data-value>$1M+</dd>
      <dt data-label>Saved by customers</dt>
    </div>
    <div data-stat>
      <dd data-value>50%</dd>
      <dt data-label>Time reduction</dt>
    </div>
    <div data-stat>
      <dd data-value>98%</dd>
      <dt data-label>Satisfaction</dt>
    </div>
  </dl>
</stats-section>
```

### With Icons

```html
<stats-section data-style="cards" data-columns="3">
  <dl data-grid>
    <div data-stat>
      <x-icon name="users"></x-icon>
      <dd data-value>10K+</dd>
      <dt data-label>Users</dt>
    </div>
    <!-- more stats -->
  </dl>
</stats-section>
```

## Related Patterns

- [feature-grid](./feature-grid.md)
- [hero](./hero.md)
- [testimonial](./testimonial.md)
