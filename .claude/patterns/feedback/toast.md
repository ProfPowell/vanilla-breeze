# Toast

## Description

Temporary notification that appears and auto-dismisses. Used for non-critical feedback about completed actions. Toasts stack and can be dismissed manually.

## Anatomy

- **container**: Toast region (holds all toasts)
- **toast**: Individual toast notification
- **icon**: Status indicator icon
- **message**: Notification text
- **action**: Optional action button
- **dismiss**: Close button
- **progress**: Auto-dismiss progress bar

## States

| State | Description |
|-------|-------------|
| Entering | Slide-in animation |
| Default | Visible with countdown |
| Exiting | Fade-out animation |

## Variants

### Type

**Attribute:** `data-type`
**Values:** `info`, `success`, `warning`, `error`

### Position

**Attribute (on container):** `data-position`
**Values:** `top-right`, `top-center`, `top-left`, `bottom-right`, `bottom-center`, `bottom-left`

## Baseline HTML

Toasts require JavaScript to function. Provide `<output>` for screen reader announcements:

```html
<output role="status" aria-live="polite" class="sr-only">
  <!-- Screen reader announcements -->
</output>
```

## Enhanced HTML

```html
<!-- Toast container -->
<toast-region data-position="bottom-right">
  <!-- Toasts are inserted here dynamically -->
</toast-region>

<!-- Individual toast structure -->
<toast-message data-type="success">
  <x-icon name="check-circle" data-icon></x-icon>
  <div data-content>
    <p>Changes saved successfully!</p>
  </div>
  <button data-dismiss aria-label="Dismiss">
    <x-icon name="x"></x-icon>
  </button>
  <div data-progress></div>
</toast-message>
```

## CSS

```css
@layer components {
  /* Toast region */
  toast-region {
    position: fixed;
    z-index: var(--z-toast, 1100);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    pointer-events: none;
    max-width: 24rem;
    width: 100%;

    /* Position variants */
    &[data-position="top-right"] {
      top: 0;
      right: 0;
    }

    &[data-position="top-center"] {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
    }

    &[data-position="top-left"] {
      top: 0;
      left: 0;
    }

    &[data-position="bottom-right"] {
      bottom: 0;
      right: 0;
      flex-direction: column-reverse;
    }

    &[data-position="bottom-center"] {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      flex-direction: column-reverse;
    }

    &[data-position="bottom-left"] {
      bottom: 0;
      left: 0;
      flex-direction: column-reverse;
    }
  }

  /* Individual toast */
  toast-message {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    pointer-events: auto;
    position: relative;
    overflow: hidden;

    /* Icon */
    & [data-icon] {
      flex-shrink: 0;
    }

    /* Content */
    & [data-content] {
      flex: 1;
      min-width: 0;
    }

    & p {
      margin: 0;
      line-height: 1.4;
    }

    /* Action button */
    & [data-action] {
      font-size: var(--text-sm);
      font-weight: var(--font-weight-medium);
      color: var(--primary);
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      text-decoration: underline;
      margin-block-start: var(--spacing-xs);

      &:hover {
        text-decoration: none;
      }
    }

    /* Dismiss button */
    & [data-dismiss] {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      opacity: 0.5;
      transition: opacity var(--transition-fast);

      &:hover {
        opacity: 1;
      }
    }

    /* Progress bar */
    & [data-progress] {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: currentColor;
      opacity: 0.3;
      transform-origin: left;
      animation: toast-progress 5s linear forwards;
    }

    /* Type variants */
    &[data-type="info"] {
      border-left: 4px solid var(--info, oklch(0.5 0.15 250));

      & [data-icon] { color: var(--info); }
    }

    &[data-type="success"] {
      border-left: 4px solid var(--success, oklch(0.5 0.15 145));

      & [data-icon] { color: var(--success); }
    }

    &[data-type="warning"] {
      border-left: 4px solid var(--warning, oklch(0.7 0.15 85));

      & [data-icon] { color: var(--warning); }
    }

    &[data-type="error"] {
      border-left: 4px solid var(--error, oklch(0.55 0.2 25));

      & [data-icon] { color: var(--error); }
    }
  }

  /* Animations */
  @keyframes toast-enter {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes toast-exit {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  @keyframes toast-progress {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }

  toast-message {
    animation: toast-enter 0.3s ease-out;
  }

  toast-message[data-exiting] {
    animation: toast-exit 0.2s ease-in forwards;
  }

  /* Left-side positions animate differently */
  toast-region[data-position*="left"] toast-message {
    animation-name: toast-enter-left;
  }

  @keyframes toast-enter-left {
    from {
      opacity: 0;
      transform: translateX(-100%);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    toast-message {
      animation: none;
    }

    toast-message [data-progress] {
      animation: none;
    }
  }
}
```

## JavaScript Enhancement

```javascript
class ToastRegion extends HTMLElement {
  static instance;

  connectedCallback() {
    ToastRegion.instance = this;
  }

  static show(message, options = {}) {
    const region = ToastRegion.instance;
    if (!region) return;

    const toast = document.createElement('toast-message');
    toast.setAttribute('data-type', options.type || 'info');

    const icon = options.type === 'success' ? 'check-circle' :
                 options.type === 'error' ? 'alert-circle' :
                 options.type === 'warning' ? 'alert-triangle' : 'info';

    toast.innerHTML = `
      <x-icon name="${icon}" data-icon></x-icon>
      <div data-content>
        <p>${message}</p>
        ${options.action ? `<button data-action>${options.actionLabel || 'Undo'}</button>` : ''}
      </div>
      <button data-dismiss aria-label="Dismiss">
        <x-icon name="x"></x-icon>
      </button>
      ${options.duration !== 0 ? '<div data-progress></div>' : ''}
    `;

    // Dismiss handler
    toast.querySelector('[data-dismiss]').addEventListener('click', () => {
      toast.dismiss();
    });

    // Action handler
    if (options.action) {
      toast.querySelector('[data-action]').addEventListener('click', options.action);
    }

    // Auto dismiss
    const duration = options.duration ?? 5000;
    if (duration > 0) {
      toast.querySelector('[data-progress]').style.animationDuration = `${duration}ms`;
      setTimeout(() => toast.dismiss(), duration);
    }

    region.appendChild(toast);
    return toast;
  }
}

class ToastMessage extends HTMLElement {
  dismiss() {
    this.setAttribute('data-exiting', '');
    this.addEventListener('animationend', () => {
      this.remove();
    }, { once: true });
  }
}

customElements.define('toast-region', ToastRegion);
customElements.define('toast-message', ToastMessage);

// Usage: ToastRegion.show('File uploaded!', { type: 'success' });
```

## Accessibility

- **Live Region**: Uses `role="status"` with `aria-live="polite"`
- **Focus**: Toasts don't steal focus
- **Timing**: Auto-dismiss respects reduced motion
- **Actions**: Action buttons are keyboard accessible

## Examples

### Success Toast

```javascript
ToastRegion.show('Changes saved!', { type: 'success' });
```

### Error Toast (No Auto-dismiss)

```javascript
ToastRegion.show('Failed to save. Please try again.', {
  type: 'error',
  duration: 0
});
```

### Toast with Action

```javascript
ToastRegion.show('Item deleted.', {
  type: 'info',
  action: () => undoDelete(),
  actionLabel: 'Undo'
});
```

### Custom Duration

```javascript
ToastRegion.show('Processing...', {
  type: 'info',
  duration: 10000 // 10 seconds
});
```

## Related Patterns

- [alert](./alert.md)
- [banner](./banner.md)
- [modal](./modal.md)
