# <chat-message>

A single chat turn with role-based alignment, optional avatar support, sender metadata, and message state indicators.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/chat-message/
- Vanilla Breeze 0.7.4

## Example

```html
<chat-message data-role="user">
  <chat-bubble><p>Hello, I need help with my order.</p></chat-bubble>
</chat-message>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-role` | `user`, `agent`, `system` |  |  |
| `data-from` | string |  |  |
| `data-from-label` | string |  |  |
| `data-status` | string |  |  |
| `data-model` | string |  |  |
