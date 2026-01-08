# Alert

## Description

Inline message for providing feedback about an action or state. Used to communicate success, warnings, errors, or informational messages within the page flow.

## Anatomy

- **container**: Alert wrapper with role="alert" or role="status"
- **icon**: Status indicator icon
- **content**: Message text
- **title**: Optional heading
- **actions**: Optional action buttons
- **dismiss**: Optional close button

## States

| State | Description |
|-------|-------------|
| Default | Standard appearance |
| Dismissing | Fade-out animation |

## Variants

### Type

**Attribute:** `data-type`
**Values:** `info`, `success`, `warning`, `error`

### Style

**Attribute:** `data-style`
**Values:** `default`, `filled`, `outlined`, `subtle`

## Baseline HTML

```html
<div role="alert" class="alert">
  <p><strong>Error:</strong> Please check your input and try again.</p>
</div>
```

## Enhanced HTML

```html
<alert-message data-type="error" data-style="filled">
  <x-icon name="alert-circle" data-icon></x-icon>
  <div data-content>
    <strong data-title>Error</strong>
    <p>Please check your input and try again.</p>
  </div>
  <button data-dismiss aria-label="Dismiss">
    <x-icon name="x"></x-icon>
  </button>
</alert-message>
```

## CSS

```css
@layer components {
  alert-message {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-md);
    line-height: 1.5;

    /* Icon */
    & [data-icon] {
      flex-shrink: 0;
      margin-block-start: 0.125em;
    }

    /* Content */
    & [data-content] {
      flex: 1;
      min-width: 0;
    }

    & [data-title] {
      display: block;
      font-weight: var(--font-weight-semibold);
      margin-block-end: var(--spacing-xs);
    }

    & p {
      margin: 0;
    }

    /* Actions */
    & [data-actions] {
      display: flex;
      gap: var(--spacing-sm);
      margin-block-start: var(--spacing-sm);
    }

    /* Dismiss button */
    & [data-dismiss] {
      flex-shrink: 0;
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

    /* Type variants - Default style */
    &[data-type="info"] {
      background: var(--info-subtle, oklch(0.95 0.05 250));
      color: var(--info, oklch(0.5 0.15 250));
      border: 1px solid var(--info-border, oklch(0.85 0.1 250));

      & [data-icon] { color: var(--info); }
    }

    &[data-type="success"] {
      background: var(--success-subtle, oklch(0.95 0.05 145));
      color: var(--success, oklch(0.5 0.15 145));
      border: 1px solid var(--success-border, oklch(0.85 0.1 145));

      & [data-icon] { color: var(--success); }
    }

    &[data-type="warning"] {
      background: var(--warning-subtle, oklch(0.95 0.08 85));
      color: var(--warning-dark, oklch(0.45 0.12 85));
      border: 1px solid var(--warning-border, oklch(0.85 0.1 85));

      & [data-icon] { color: var(--warning, oklch(0.7 0.15 85)); }
    }

    &[data-type="error"] {
      background: var(--error-subtle, oklch(0.95 0.05 25));
      color: var(--error, oklch(0.5 0.2 25));
      border: 1px solid var(--error-border, oklch(0.85 0.1 25));

      & [data-icon] { color: var(--error); }
    }

    /* Filled style */
    &[data-style="filled"] {
      border: none;
      color: white;

      &[data-type="info"] { background: var(--info); }
      &[data-type="success"] { background: var(--success); }
      &[data-type="warning"] { background: var(--warning); color: var(--warning-dark); }
      &[data-type="error"] { background: var(--error); }

      & [data-icon] { color: inherit; }
    }

    /* Outlined style */
    &[data-style="outlined"] {
      background: transparent;
      border-width: 2px;
    }

    /* Subtle style */
    &[data-style="subtle"] {
      background: transparent;
      border: none;
      padding-inline: 0;
    }
  }

  /* Dismiss animation */
  @keyframes alert-dismiss {
    to {
      opacity: 0;
      transform: translateX(1rem);
    }
  }

  alert-message[data-dismissing] {
    animation: alert-dismiss 0.2s ease-out forwards;
  }
}
```

## JavaScript Enhancement

```javascript
class AlertMessage extends HTMLElement {
  connectedCallback() {
    this.querySelector('[data-dismiss]')?.addEventListener('click', () => {
      this.dismiss();
    });
  }

  dismiss() {
    this.setAttribute('data-dismissing', '');
    this.addEventListener('animationend', () => {
      this.remove();
    }, { once: true });
  }
}

customElements.define('alert-message', AlertMessage);
```

## Accessibility

- **Role**: Uses `role="alert"` for errors/warnings, `role="status"` for info/success
- **Live Region**: Alerts are announced by screen readers immediately
- **Dismiss Button**: Has accessible label
- **Focus**: Consider moving focus after dismissal

## Examples

### Info Alert

```html
<alert-message data-type="info">
  <x-icon name="info" data-icon></x-icon>
  <div data-content>
    <p>Your session will expire in 5 minutes.</p>
  </div>
</alert-message>
```

### Success Alert with Title

```html
<alert-message data-type="success">
  <x-icon name="check-circle" data-icon></x-icon>
  <div data-content>
    <strong data-title>Success!</strong>
    <p>Your changes have been saved.</p>
  </div>
</alert-message>
```

### Error Alert with Actions

```html
<alert-message data-type="error" role="alert">
  <x-icon name="alert-circle" data-icon></x-icon>
  <div data-content>
    <strong data-title>Payment Failed</strong>
    <p>Your card was declined. Please try a different payment method.</p>
    <div data-actions>
      <button data-button="primary">Update Payment</button>
      <button data-button="secondary">Contact Support</button>
    </div>
  </div>
  <button data-dismiss aria-label="Dismiss">
    <x-icon name="x"></x-icon>
  </button>
</alert-message>
```

### Filled Style

```html
<alert-message data-type="warning" data-style="filled">
  <x-icon name="alert-triangle" data-icon></x-icon>
  <div data-content>
    <p>Your account is approaching its storage limit.</p>
  </div>
</alert-message>
```

## Related Patterns

- [banner](./banner.md)
- [toast](./toast.md)
- [modal](./modal.md)
