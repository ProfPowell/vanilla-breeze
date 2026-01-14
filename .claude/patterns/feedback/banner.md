# Banner

## Description

Site-wide announcement bar typically positioned at the top of the page. Used for important announcements, promotions, or system status messages that apply globally.

## Anatomy

- **container**: Full-width banner wrapper
- **content**: Message text and optional link
- **action**: Optional CTA button
- **dismiss**: Optional close button

## States

| State | Description |
|-------|-------------|
| Default | Standard appearance |
| Dismissed | Hidden after user dismissal |

## Variants

### Type

**Attribute:** `data-type`
**Values:** `info`, `success`, `warning`, `error`, `promo`

### Position

**Attribute:** `data-position`
**Values:** `top`, `bottom`

### Sticky

**Attribute:** `data-sticky`
**Values:** (boolean)

## Baseline HTML

```html
<div role="banner" class="site-banner">
  <p>🎉 New feature available! <a href="/features">Learn more</a></p>
  <button aria-label="Dismiss">×</button>
</div>
```

## Enhanced HTML

```html
<site-banner data-type="promo" data-position="top" data-sticky>
  <div data-content>
    <p>🎉 Black Friday Sale: Get 50% off all plans! <a href="/pricing">Shop now</a></p>
  </div>
  <button data-dismiss aria-label="Dismiss banner">
    <x-icon name="x"></x-icon>
  </button>
</site-banner>
```

## CSS

```css
@layer components {
  site-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--size-m);
    padding: var(--size-xs) var(--size-l);
    text-align: center;
    font-size: var(--text-sm);

    /* Content */
    & [data-content] {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: var(--size-xs);
    }

    & p {
      margin: 0;
    }

    & a {
      color: inherit;
      font-weight: var(--font-weight-medium);
      text-decoration: underline;
      text-underline-offset: 2px;

      &:hover {
        text-decoration-thickness: 2px;
      }
    }

    /* Action button */
    & [data-action] {
      padding: var(--size-2xs) var(--size-m);
      font-size: var(--text-sm);
      font-weight: var(--font-weight-medium);
      text-decoration: none;
      border-radius: var(--radius-sm);
      background: oklch(1 0 0 / 0.2);
      color: inherit;
      border: 1px solid oklch(1 0 0 / 0.3);
      transition: background var(--transition-fast);

      &:hover {
        background: oklch(1 0 0 / 0.3);
      }
    }

    /* Dismiss button */
    & [data-dismiss] {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      opacity: 0.7;
      transition: opacity var(--transition-fast);

      &:hover {
        opacity: 1;
      }
    }

    /* Type variants */
    &[data-type="info"] {
      background: var(--info, oklch(0.5 0.15 250));
      color: white;
    }

    &[data-type="success"] {
      background: var(--success, oklch(0.5 0.15 145));
      color: white;
    }

    &[data-type="warning"] {
      background: var(--warning, oklch(0.75 0.15 85));
      color: var(--warning-dark, oklch(0.3 0.1 85));
    }

    &[data-type="error"] {
      background: var(--error, oklch(0.55 0.2 25));
      color: white;
    }

    &[data-type="promo"] {
      background: linear-gradient(135deg, oklch(0.5 0.2 300), oklch(0.5 0.2 250));
      color: white;
    }

    /* Position variants */
    &[data-position="top"] {
      order: -1;
    }

    &[data-position="bottom"] {
      order: 9999;
    }

    /* Sticky */
    &[data-sticky] {
      position: sticky;
      z-index: var(--z-sticky);

      &[data-position="top"] {
        top: 0;
      }

      &[data-position="bottom"] {
        bottom: 0;
      }
    }
  }

  /* Hidden state */
  site-banner[hidden] {
    display: none;
  }

  /* Dismiss animation */
  @keyframes banner-dismiss {
    to {
      opacity: 0;
      height: 0;
      padding-block: 0;
      overflow: hidden;
    }
  }

  site-banner[data-dismissing] {
    animation: banner-dismiss 0.2s ease-out forwards;
  }
}

/* Responsive */
@media (max-width: 480px) {
  site-banner {
    flex-wrap: wrap;
    padding: var(--size-m);

    & [data-content] {
      width: 100%;
    }
  }
}
```

## JavaScript Enhancement

```javascript
class SiteBanner extends HTMLElement {
  static storageKey = 'dismissed-banners';

  connectedCallback() {
    // Check if already dismissed
    const bannerId = this.id || this.textContent.slice(0, 50);
    const dismissed = JSON.parse(localStorage.getItem(SiteBanner.storageKey) || '[]');

    if (dismissed.includes(bannerId)) {
      this.hidden = true;
      return;
    }

    this.querySelector('[data-dismiss]')?.addEventListener('click', () => {
      this.dismiss(bannerId);
    });
  }

  dismiss(bannerId) {
    // Save dismissal
    const dismissed = JSON.parse(localStorage.getItem(SiteBanner.storageKey) || '[]');
    dismissed.push(bannerId);
    localStorage.setItem(SiteBanner.storageKey, JSON.stringify(dismissed));

    // Animate out
    this.setAttribute('data-dismissing', '');
    this.addEventListener('animationend', () => {
      this.hidden = true;
    }, { once: true });
  }
}

customElements.define('site-banner', SiteBanner);
```

## Accessibility

- **Role**: Can use `role="banner"` for site-wide announcements
- **Dismiss**: Button has accessible label
- **Color Contrast**: Ensure text is readable on colored backgrounds
- **Persistence**: Consider not dismissing for critical announcements

## Examples

### Promo Banner

```html
<site-banner data-type="promo" data-position="top">
  <div data-content>
    <p>🚀 Launch week! New features every day.</p>
    <a href="/launch">See what's new</a>
  </div>
  <button data-dismiss aria-label="Dismiss">
    <x-icon name="x"></x-icon>
  </button>
</site-banner>
```

### Warning Banner (No Dismiss)

```html
<site-banner data-type="warning" data-position="top" data-sticky>
  <div data-content>
    <p>⚠️ Scheduled maintenance on Dec 28, 2-4 AM UTC.</p>
  </div>
</site-banner>
```

### Info Banner with Action

```html
<site-banner data-type="info">
  <div data-content>
    <p>Your trial ends in 3 days.</p>
    <a href="/upgrade" data-action>Upgrade now</a>
  </div>
</site-banner>
```

### Cookie Consent Banner

```html
<site-banner data-type="info" data-position="bottom" data-sticky id="cookie-banner">
  <div data-content>
    <p>We use cookies to improve your experience. <a href="/privacy">Learn more</a></p>
    <button data-action>Accept</button>
  </div>
</site-banner>
```

## Related Patterns

- [alert](./alert.md)
- [toast](./toast.md)
- [site-header](../navigation/site-header.md)
