# Feature Grid

## Description

Grid layout displaying feature highlights or benefits. Each feature has an icon, title, and description. Used to showcase product capabilities or service offerings.

## Anatomy

- **container**: Grid wrapper section
- **heading**: Optional section title and intro
- **grid**: Grid of feature items
- **feature**: Individual feature card
- **icon**: Feature icon or illustration
- **title**: Feature heading
- **description**: Feature explanation

## States

| State | Description |
|-------|-------------|
| Default | Standard grid display |

## Variants

### Columns

**Attribute:** `data-columns`
**Values:** `2`, `3`, `4`

### Style

**Attribute:** `data-style`
**Values:** `cards`, `minimal`, `centered`

## Baseline HTML

```html
<section class="feature-grid">
  <h2>Why Choose Us</h2>
  <p>Everything you need to succeed.</p>

  <div class="grid">
    <article>
      <h3>Fast Performance</h3>
      <p>Lightning-fast load times with optimized delivery.</p>
    </article>
    <article>
      <h3>Secure by Default</h3>
      <p>Enterprise-grade security built into every layer.</p>
    </article>
    <article>
      <h3>24/7 Support</h3>
      <p>Expert help whenever you need it.</p>
    </article>
  </div>
</section>
```

## Enhanced HTML

```html
<feature-grid data-columns="3" data-style="cards">
  <header>
    <h2>Why Choose Us</h2>
    <p>Everything you need to succeed.</p>
  </header>

  <div data-grid>
    <article>
      <x-icon name="zap" size="lg"></x-icon>
      <h3>Fast Performance</h3>
      <p>Lightning-fast load times with globally distributed CDN and optimized delivery.</p>
    </article>

    <article>
      <x-icon name="shield" size="lg"></x-icon>
      <h3>Secure by Default</h3>
      <p>Enterprise-grade security with encryption, SSO, and compliance certifications.</p>
    </article>

    <article>
      <x-icon name="headphones" size="lg"></x-icon>
      <h3>24/7 Support</h3>
      <p>Expert help whenever you need it, with average response times under 2 hours.</p>
    </article>

    <article>
      <x-icon name="puzzle" size="lg"></x-icon>
      <h3>Integrations</h3>
      <p>Connect with 100+ tools you already use, from Slack to Salesforce.</p>
    </article>

    <article>
      <x-icon name="trending-up" size="lg"></x-icon>
      <h3>Analytics</h3>
      <p>Deep insights into your performance with real-time dashboards.</p>
    </article>

    <article>
      <x-icon name="users" size="lg"></x-icon>
      <h3>Team Collaboration</h3>
      <p>Work together seamlessly with shared workspaces and permissions.</p>
    </article>
  </div>
</feature-grid>
```

## CSS

```css
@layer components {
  feature-grid {
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

    /* Grid layout */
    & [data-grid] {
      display: grid;
      gap: var(--size-xl);
      max-width: var(--content-max-width);
      margin-inline: auto;
    }

    /* Feature items */
    & article {
      display: flex;
      flex-direction: column;
      gap: var(--size-xs);
    }

    & article x-icon {
      color: var(--primary);
      margin-block-end: var(--size-xs);
    }

    & article h3 {
      font-size: var(--text-lg);
      font-weight: var(--font-weight-semibold);
      margin: 0;
    }

    & article p {
      color: var(--text-muted);
      margin: 0;
      line-height: 1.6;
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

    /* Cards style */
    &[data-style="cards"] article {
      padding: var(--size-l);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      transition: box-shadow var(--transition-fast), transform var(--transition-fast);

      &:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }
    }

    /* Minimal style */
    &[data-style="minimal"] article {
      padding: var(--size-m) 0;
      border-block-start: 1px solid var(--border);
    }

    /* Centered style */
    &[data-style="centered"] article {
      text-align: center;
      align-items: center;
    }
  }

  /* Responsive */
  @media (max-width: 1024px) {
    feature-grid {
      &[data-columns="4"] [data-grid] {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  }

  @media (max-width: 768px) {
    feature-grid {
      &[data-columns="3"] [data-grid],
      &[data-columns="4"] [data-grid] {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  }

  @media (max-width: 480px) {
    feature-grid {
      & [data-grid] {
        grid-template-columns: 1fr !important;
      }
    }
  }
}
```

## Accessibility

- **Semantic Structure**: Uses `<section>`, `<article>`, and heading hierarchy
- **Icon Labels**: Icons are decorative (text provides meaning)
- **Focus States**: Card hover states also apply on focus

## Examples

### Three-Column Cards

```html
<feature-grid data-columns="3" data-style="cards">
  <header>
    <h2>Platform Features</h2>
  </header>
  <div data-grid>
    <article>
      <x-icon name="zap"></x-icon>
      <h3>Speed</h3>
      <p>Optimized for performance.</p>
    </article>
    <!-- more features -->
  </div>
</feature-grid>
```

### Four-Column Minimal

```html
<feature-grid data-columns="4" data-style="minimal">
  <div data-grid>
    <!-- features without header -->
  </div>
</feature-grid>
```

### Two-Column Centered

```html
<feature-grid data-columns="2" data-style="centered">
  <header>
    <h2>How It Works</h2>
    <p>Simple steps to get started.</p>
  </header>
  <div data-grid>
    <!-- centered features -->
  </div>
</feature-grid>
```

## Related Patterns

- [hero](./hero.md)
- [stats](./stats.md)
- [card](./card.md)
