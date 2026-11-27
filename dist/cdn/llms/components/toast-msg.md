# <toast-msg>

Toast notification stack: one polite live region, queued toasts beyond max, auto-dismiss that pauses on hover/focus, localisable labels

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/toast/
- Vanilla Breeze 0.7.4

## Example

```html
<!-- Toast container (place once in your HTML) -->
<toast-msg id="notifications" position="top-end"></toast-msg>

<!-- Show toast via JavaScript -->
<script>
  const toast = document.getElementById('notifications');
  toast.show({
    message: 'This is a toast notification!',
    variant: 'info'
  });
</script>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `position` | `top-start`, `top-center`, `top-end`, `bottom-start`, `bottom-center`, `bottom-end` |  | Screen position for the toast stack (default top-end); centred positions stay centred in RTL |
| `duration` | number |  | Default auto-dismiss duration in milliseconds (default 5000; 0 = stay until dismissed). The timer pauses while the pointer is over the stack, focus is inside it, or the page is hidden |
| `max` | number |  | Maximum number of visible toasts (default 5); further toasts queue and appear as others dismiss |
| `data-label-region` | string |  | Accessible name of the stack; an authored aria-label wins (default "Notifications") |
| `data-label-dismiss` | string |  | Close button label (default "Dismiss") |
| `data-label-info` | string |  | Visually hidden prefix spoken before info messages (default "Info") |
| `data-label-success` | string |  | Visually hidden prefix spoken before success messages (default "Success") |
| `data-label-warning` | string |  | Visually hidden prefix spoken before warning messages (default "Warning") |
| `data-label-error` | string |  | Visually hidden prefix spoken before error messages (default "Error") |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `toast-msg:enqueued` | `{ message, variant, duration, source, toast, queued }` | Fired (bubbles) on every show() call; queued is true when the toast waits behind max |
| `toast-msg:show` | `{ toast }` | Fired (bubbles) when a toast becomes visible |
| `toast-msg:hide` | `{ toast }` | Fired (bubbles) when a toast has been removed |

## Methods

| Method | Description |
| --- | --- |
| `show(options)` | Show a toast. options: { message, variant ('info'\|'success'\|'warning'\|'error'), duration, dismissible (default true), action, onAction, source }. Returns the toast element |
| `dismiss(toast)` | Dismiss one toast (also non-dismissible ones) or drop it from the queue |
| `dismissAll()` | Dismiss every visible toast and clear the queue |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `queue` | `Array<{ message, variant, state }>` | Read-only. Visible then queued toasts; state is 'visible' or 'queued' |

## Accessibility

- Pattern: Live region
- The component manages: `role="log"`, `aria-live`, `aria-relevant`, `aria-label`, `aria-hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | Dismiss the toast that holds focus and move focus to the next toast or back to where it was | Focus on a button inside a toast |
