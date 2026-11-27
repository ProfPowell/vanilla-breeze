# <chat-thread>

Scrollable message container for chat conversations. Grows to fill available height; add role='log' for screen reader announcements.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/chat-thread/
- Vanilla Breeze 0.7.4

## Example

```html
<chat-thread role="log" aria-label="Support conversation" aria-live="polite" tabindex="0">
  <chat-message data-role="agent" data-from-label="Bot">
    <chat-bubble><p>Welcome! How can I help?</p></chat-bubble>
  </chat-message>
  <chat-message data-role="user">
    <chat-bubble><p>I have a question.</p></chat-bubble>
  </chat-message>
</chat-thread>
```
