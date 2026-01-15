# Toast

## Description

Temporary notification that appears and auto-dismisses. Used for non-critical feedback about completed actions. Uses the `<toast-wc>` Web Component for consistent behavior.

## Anatomy

- **container**: Toast region (`<toast-wc>`)
- **toast**: Individual toast notification (`.toast` div)
- **icon**: Status indicator icon (`.icon`)
- **message**: Notification text (`.message`)
- **action**: Optional action button (`.action`)
- **close**: Dismiss button (`.close`)

## States

| State | Description |
|-------|-------------|
| Entering | Slide-in animation |
| Visible | Shown with auto-dismiss countdown |
| Hiding | Fade-out animation |

## Variants

### Variant (Type)

**Attribute (on toast):** `data-variant`
**Values:** `info`, `success`, `warning`, `error`

### Position

**Attribute (on container):** `data-position`
**Values:** `top-end` (default), `top-start`, `bottom-end`, `bottom-start`, `top-center`, `bottom-center`

> **Note:** Position values use logical properties (`start`/`end`) for RTL support.

## Baseline HTML

Toasts require JavaScript to function. Provide an empty container:

```html
<!-- Toast container -->
<toast-wc data-position="bottom-end"></toast-wc>
```

## JavaScript API

The `<toast-wc>` component provides a programmatic API:

```javascript
// Get the toast container
const toasts = document.querySelector('toast-wc');

// Show a toast
toasts.show({
  message: 'Changes saved successfully',
  variant: 'success',
  duration: 5000  // Auto-dismiss after 5 seconds
});

// Show with action button
toasts.show({
  message: 'Item deleted',
  variant: 'info',
  action: 'Undo',
  onAction: () => restoreItem()
});

// Show persistent toast (no auto-dismiss)
toasts.show({
  message: 'Failed to save. Please try again.',
  variant: 'error',
  duration: 0,
  dismissible: true
});
```

### API Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `message` | string | Required | The notification text |
| `variant` | string | `'info'` | Style variant: `info`, `success`, `warning`, `error` |
| `duration` | number | `5000` | Auto-dismiss time in ms (0 = no auto-dismiss) |
| `dismissible` | boolean | `true` | Show close button |
| `action` | string | `undefined` | Optional action button text |
| `onAction` | function | `undefined` | Callback when action clicked |

### Container Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-position` | `'top-end'` | Toast position on screen |
| `data-duration` | `5000` | Default auto-dismiss duration |
| `data-max` | `5` | Maximum visible toasts (others queue) |

## CSS

```css
@layer components {
  /* Toast container positioning */
  toast-wc {
    position: fixed;
    z-index: var(--z-toast, 1100);
    display: flex;
    flex-direction: column;
    gap: var(--size-s);
    pointer-events: none;
    max-inline-size: min(24rem, calc(100vw - var(--size-l)));

    /* Default: top-end */
    inset-block-start: var(--size-m);
    inset-inline-end: var(--size-m);
    align-items: flex-end;

    /* Position variants */
    &[data-position="top-start"] {
      inset-inline-start: var(--size-m);
      inset-inline-end: auto;
      align-items: flex-start;
    }

    &[data-position="bottom-end"] {
      inset-block-start: auto;
      inset-block-end: var(--size-m);
      flex-direction: column-reverse;
    }

    &[data-position="bottom-start"] {
      inset-block-start: auto;
      inset-block-end: var(--size-m);
      inset-inline-start: var(--size-m);
      inset-inline-end: auto;
      align-items: flex-start;
      flex-direction: column-reverse;
    }

    &[data-position="top-center"],
    &[data-position="bottom-center"] {
      inset-inline-start: 50%;
      inset-inline-end: auto;
      transform: translateX(-50%);
      align-items: center;
    }

    &[data-position="bottom-center"] {
      inset-block-start: auto;
      inset-block-end: var(--size-m);
      flex-direction: column-reverse;
    }
  }
}
```

## Accessibility

- **ARIA Live**: Container has `role="region"`, `aria-live="polite"`, and `aria-label="Notifications"`
- **ARIA Alert**: Individual toasts have `role="alert"`
- **Focus**: Toasts don't steal focus from current task
- **Timing**: Respects `prefers-reduced-motion` for animations
- **Actions**: Action and close buttons are keyboard accessible

## Examples

### Success Toast

```javascript
toasts.show({
  message: 'Changes saved!',
  variant: 'success'
});
```

### Error Toast (No Auto-dismiss)

```javascript
toasts.show({
  message: 'Failed to save. Please try again.',
  variant: 'error',
  duration: 0
});
```

### Toast with Action

```javascript
toasts.show({
  message: 'Item deleted.',
  variant: 'info',
  action: 'Undo',
  onAction: () => undoDelete()
});
```

### Warning Toast with Custom Duration

```javascript
toasts.show({
  message: 'Your session will expire in 5 minutes.',
  variant: 'warning',
  duration: 10000
});
```

### Dismiss All Toasts

```javascript
toasts.dismissAll();
```

## Events

The component dispatches events for lifecycle tracking:

```javascript
toasts.addEventListener('toast-show', (e) => {
  console.log('Toast shown:', e.detail.toast);
});

toasts.addEventListener('toast-hide', (e) => {
  console.log('Toast hidden:', e.detail.toast);
});
```

## Related Patterns

- [alert](./alert.md)
- [banner](./banner.md)
- [modal](./modal.md)
