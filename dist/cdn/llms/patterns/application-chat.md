# Chat

Chat integration patterns: floating launcher, embedded with sidebar, and full-page layouts using existing VB primitives.

- Documentation: https://vanilla-breeze.com/docs/patterns/application/chat/
- Vanilla Breeze 0.7.4

## Overview

These patterns compose `<chat-window>` with existing VB primitives to create complete chat experiences. No new custom elements are needed — `<dialog>`, `commandfor`, and `<layout-sidebar>` handle the shell.

## Floating Launcher

A fixed-position FAB button opens a `<dialog>` containing `chat-window`. The `commandfor`/`command` attributes handle open/close automatically with proper focus management.

Floating chat launcher:

```html
<style>
.chat-trigger {
  position: fixed;
  inset-block-end: var(--size-xl);
  inset-inline-end: var(--size-xl);
  z-index: 1000;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 16px oklch(0% 0 0 / 0.2);
  transition: transform var(--duration-fast) var(--ease-default),
              box-shadow var(--duration-fast) var(--ease-default);
}
.chat-trigger:hover {
  transform: scale(1.06);
  box-shadow: 0 6px 20px oklch(0% 0 0 / 0.28);
}
.chat-trigger:active { transform: scale(0.96); }
</style>

<!-- Fixed trigger button -->
<button commandfor="chat-dialog" command="show-modal"
        class="chat-trigger" aria-label="Open chat">
  <icon-wc name="message-circle"></icon-wc>
</button>

<!-- Dialog contains chat-window -->
<dialog id="chat-dialog">
  <chat-window endpoint="/api/chat">
    <script type="application/json" data-participants>
    { "user": { "name": "You", "role": "user" },
      "assistant": { "name": "Assistant", "role": "agent" } }
    </script>
    <header>
      <h3>AI Assistant</h3>
      <button commandfor="chat-dialog" command="close"
              class="ghost small" aria-label="Close">
        <icon-wc name="x"></icon-wc>
      </button>
    </header>
    <chat-thread role="log" aria-label="Chat" aria-live="polite">
    </chat-thread>
    <chat-input name="message">
      <textarea data-grow rows="1" placeholder="Ask anything..."></textarea>
      <footer>
        <button type="submit" class="small" data-send aria-label="Send">
          <icon-wc name="send"></icon-wc>
        </button>
      </footer>
    </chat-input>
  </chat-window>
</dialog>
```

## Unread Badge

Add an unread count using `<layout-badge>` positioned over the trigger button.

Trigger with unread badge:

```html
<button commandfor="chat-dialog" command="show-modal"
        class="chat-trigger" aria-label="Open chat">
  <icon-wc name="message-circle"></icon-wc>
  <layout-badge data-color="error" data-size="s">3</layout-badge>
</button>
```

Position the badge over the trigger:

```css
.chat-trigger {
  position: relative;
}

.chat-trigger layout-badge {
  position: absolute;
  inset-block-start: calc(-1 * var(--size-2xs));
  inset-inline-end: calc(-1 * var(--size-2xs));
}
```

## Embedded with Sidebar

For always-visible chat panels, use `<layout-sidebar>` with a chat history list in the aside. The sidebar collapses on narrow viewports.

Embedded chat with sidebar:

```html
<layout-sidebar data-layout-sidebar-width="narrow">
  <aside>
    <nav aria-label="Chat history">
      <a href="/chat/5" aria-current="true">Current conversation</a>
      <a href="/chat/4">Refund request</a>
      <a href="/chat/3">Setup help</a>
    </nav>
  </aside>
  <chat-window endpoint="/api/ai">
    <script type="application/json" data-participants>
    { "user": { "name": "You", "role": "user" },
      "assistant": { "name": "Assistant", "role": "agent" } }
    </script>
    <header>
      <h3>Support Chat</h3>
    </header>
    <chat-thread role="log" aria-label="Support conversation" aria-live="polite">
    </chat-thread>
    <chat-input name="message">
      <textarea data-grow rows="1" placeholder="Type a message..."></textarea>
      <footer>
        <button type="submit" class="small" data-send aria-label="Send">
          <icon-wc name="send"></icon-wc>
        </button>
      </footer>
    </chat-input>
  </chat-window>
</layout-sidebar>
```

## Full-Page with History Drawer

A full-viewport chat: give the window `block-size: 100dvh` in your stylesheet. The history drawer uses `<dialog data-position="start">` for a slide-in panel triggered from the header.

Full-page chat:

```html
<chat-window endpoint="/api/ai" class="full-page">
  <script type="application/json" data-participants>
  { "user": { "name": "You", "role": "user" },
    "assistant": { "name": "Assistant", "role": "agent" } }
  </script>
  <header>
    <button commandfor="chat-history" command="show-modal"
            class="ghost small" aria-label="History">
      <icon-wc name="sidebar"></icon-wc>
    </button>
    <h3>Chat</h3>
    <select data-model-select aria-label="Select model">
      <option value="claude-sonnet-4-6">Sonnet 4.6</option>
      <option value="claude-haiku-4-5">Haiku 4.5</option>
    </select>
  </header>
  <chat-thread role="log" aria-label="Conversation" aria-live="polite">
  </chat-thread>
  <chat-input name="message">
    <textarea data-grow rows="1" data-max-rows="8"
              placeholder="Ask anything..."></textarea>
    <footer>
      <button type="submit" class="small" data-send aria-label="Send">
        <icon-wc name="send"></icon-wc>
      </button>
    </footer>
  </chat-input>
</chat-window>

<dialog id="chat-history" data-position="start">
  <header>
    <h3>History</h3>
    <button commandfor="chat-history" command="close" class="ghost small" aria-label="Close history">
      <icon-wc name="x"></icon-wc>
    </button>
  </header>
  <nav aria-label="Previous conversations">
    <a href="/chat/5" aria-current="true">Current conversation</a>
    <a href="/chat/4">Refund request</a>
    <a href="/chat/3">Setup help</a>
  </nav>
</dialog>
```

Fill the viewport:

```css
chat-window.full-page {
  block-size: 100dvh;
}
```

## Related

- `<chat-window>` — The orchestrating web component
- `<chat-input>` — Form-associated input
- `<chat-thread>` — Scrollable message container
- `<dialog>` — Native modal/drawer
- `<layout-sidebar>` — Split panel layout
