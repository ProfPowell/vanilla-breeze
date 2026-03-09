# Vanilla Breeze — Chat Components Specification

**Status:** Draft v1.0 (corrected)
**Category:** Interactive / Conversational

---

## Overview

A layered set of chat UI components for Vanilla Breeze. Designed for any real-time or async conversational context: AI assistant, human support chat, customer messaging, or team chat.

The component set follows VB's framework philosophy: HTML-first, CSS-only where possible, progressive enhancement, light DOM, web platform APIs over dependencies.

### Design Principles

- **General purpose** — `data-role` is `user | agent | system`. "Agent" is a human support rep, an AI, or a bot. The component doesn't care.
- **Participant data lives in a JS `Map`** — `chat-window` maintains a `Map<id, participant>` populated via a `<script type="application/json" data-participants>` block or the `participants` setter. No invisible custom elements.
- **Typing state is message state** — no separate typing indicator element. A pending message carries `data-status="typing"` and CSS renders the animation. The same DOM node gets populated when real content arrives.
- **Avatars are optional children** — no default avatar behavior. Consumers place `<user-avatar data-size="sm">` as a direct child of `chat-message` when they want it.
- **Model attribution is one data attribute** — `data-model` on `chat-message`. Only meaningful in AI contexts; ignored otherwise.
- **Light DOM only** — VB standard. Only `icon-wc` uses Shadow DOM. All chat components use light DOM with `data-*` attribute selectors on child elements.
- **Existing primitives first** — sidebar uses `<dialog data-position="start">`, launcher uses `<dialog>` + fixed trigger button, badges use `<layout-badge>`, avatars use `<user-avatar>`. No new elements for solved problems.

---

## Component Inventory

5 new elements (CSS-only primitives + web components):

| Element | Type | Layer | Shadow DOM |
|---------|------|-------|------------|
| `<chat-thread>` | CSS-only | `custom-elements` | No |
| `<chat-message>` | CSS-only | `custom-elements` | No |
| `<chat-bubble>` | CSS-only | `custom-elements` | No |
| `<chat-input>` | FormAssociated Web Component | `web-components` | No |
| `<chat-window>` | Web Component | `web-components` | No |

Shell/launcher handled by existing VB primitives (`<dialog>`, `<button>`, `<layout-sidebar>`).

---

## Layer 1 — CSS-Only Display Primitives

### `<chat-thread>`

Scrollable message container. Grows to fill available height.

```html
<chat-thread role="log" aria-label="Support conversation" aria-live="polite">
  <!-- chat-message elements -->
</chat-thread>
```

**Attributes:**

| Attribute | Values | Description |
|-----------|--------|-------------|
| `role` | `log` | Required ARIA — signals live region semantics |
| `aria-label` | string | Describes the conversation context |
| `aria-live` | `polite` | Announces new messages to screen readers |

**CSS responsibilities:**
- `display: flex; flex-direction: column`
- `overflow-y: auto; scroll-behavior: smooth`
- `overflow-anchor: auto` keeps scroll pinned to bottom
- Gap between messages

**CSS variables:**
```css
chat-thread {
  --chat-thread-gap:     var(--size-m);
  --chat-thread-padding: var(--size-m);
}
```

---

### `<chat-message>`

A single turn. Handles layout (alignment), identity metadata, and state-driven sub-states including typing.

```html
<!-- Minimal -->
<chat-message data-role="user">
  <chat-bubble>Hello, I need help with my order.</chat-bubble>
</chat-message>

<!-- With optional avatar -->
<chat-message data-role="agent" data-from="sarah">
  <user-avatar data-size="sm">
    <img src="/avatars/sarah.jpg" alt="Sarah Chen" />
  </user-avatar>
  <chat-bubble>Hi! I can look into that for you.</chat-bubble>
</chat-message>

<!-- AI context: model attribution -->
<chat-message data-role="agent" data-from="assistant" data-model="claude-sonnet-4-6">
  <chat-bubble><p>Here's what I found...</p></chat-bubble>
</chat-message>

<!-- Typing state — same element, pending content -->
<chat-message data-role="agent" data-status="typing" data-from="sarah">
  <user-avatar data-size="sm">
    <img src="/avatars/sarah.jpg" alt="Sarah Chen" />
  </user-avatar>
  <chat-bubble></chat-bubble>
</chat-message>

<!-- System message -->
<chat-message data-role="system">
  <chat-bubble>Sarah joined the conversation.</chat-bubble>
</chat-message>
```

**Attributes:**

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-role` | `user \| agent \| system` | Controls alignment and color |
| `data-from` | participant id or display string | Resolved against participant `Map` |
| `data-from-label` | string | Written by `chat-window` JS after resolving participant id |
| `data-model` | string | AI model identifier; shown in meta line when present |
| `data-status` | `sending \| sent \| error \| typing` | Message state |
| `data-timestamp` | ISO 8601 | Rendered as `<time>` inside the message |

**Layout rules:**

| `data-role` | Alignment | Bubble style |
|-------------|-----------|-------------|
| `user` | right | Primary color |
| `agent` | left | Surface / border |
| `system` | center | Muted, minimal chrome |

**Grid layout for optional avatar:**

```css
chat-message {
  display: grid;
  grid-template-columns: auto 1fr;  /* [avatar] [bubble] */
  align-items: end;
  gap: var(--size-xs);
}

chat-message[data-role="user"] {
  grid-template-columns: 1fr auto;  /* [bubble] [avatar] */
}

/* Collapse avatar column when no user-avatar child */
chat-message:not(:has(> user-avatar)) {
  grid-template-columns: 1fr;
}
```

**Meta line (sender + model):**

Resolved display name written to `data-from-label` by `chat-window` JS; CSS renders it via `content: attr(data-from-label)` on `::before`. Hidden for `data-role="user"` by default.

**Typing state:**

When `data-status="typing"`, `chat-bubble::after` renders animated dots via CSS background gradients. No JS animation; only JS sets/removes the attribute. When real content arrives, populate `chat-bubble` innerHTML and remove `data-status`.

**CSS variables:**
```css
chat-message {
  --chat-user-bg:       var(--color-primary);
  --chat-user-color:    var(--color-text-on-primary);
  --chat-agent-bg:      var(--color-surface-sunken);
  --chat-agent-color:   var(--color-text);
  --chat-bubble-radius: var(--radius-m);
  --chat-meta-size:     var(--font-size-xs);
  --chat-meta-color:    var(--color-text-muted);
}
```

---

### `<chat-bubble>`

Content wrapper. Callout shape, typography, code blocks, and typing dot animation.

```html
<chat-bubble>
  <p>Paragraph content with <strong>formatting</strong>.</p>
  <pre><code>console.log('code blocks work')</code></pre>
</chat-bubble>
```

**Typing dots (CSS-only animation):**

```css
chat-message[data-status="typing"] chat-bubble {
  min-width: 3.5rem;
  min-height: 2rem;
  display: flex;
  align-items: center;
}

chat-message[data-status="typing"] chat-bubble::after {
  content: '';
  display: inline-block;
  width: 28px;
  height: 8px;
  background:
    radial-gradient(circle, currentColor 2px, transparent 2px)   0px center / 8px 8px no-repeat,
    radial-gradient(circle, currentColor 2px, transparent 2px)  10px center / 8px 8px no-repeat,
    radial-gradient(circle, currentColor 2px, transparent 2px)  20px center / 8px 8px no-repeat;
  animation: vb-typing-dots 1.2s infinite ease-in-out;
  opacity: 0.6;
}

@keyframes vb-typing-dots {
  0%, 100% { opacity: 0.6; transform: translateY(0); }
  16%       { opacity: 1;   transform: translateY(-2px); }
}

@media (prefers-reduced-motion: reduce) {
  chat-message[data-status="typing"] chat-bubble::after {
    animation: none;
    opacity: 0.4;
  }
}
```

> **Note on Markdown:** `chat-bubble` makes no assumption about content rendering. Consumers sanitize before injecting HTML.

---

## Layer 2 — `<chat-input>` (FormAssociated Web Component)

Auto-growing textarea with send controls. Light DOM, reuses VB's `textarea[data-grow]` pattern.

### HTML

```html
<!-- Inside chat-window (typical) -->
<chat-input name="message">
  <textarea data-grow rows="1" data-max-rows="8"
            placeholder="Ask anything..."></textarea>
  <footer>
    <button type="submit" class="small" data-send aria-label="Send">
      <icon-wc name="send"></icon-wc>
    </button>
  </footer>
</chat-input>

<!-- Inside native form -->
<form action="/support/reply" method="POST">
  <chat-input name="message">
    <textarea data-grow rows="1" placeholder="Reply..."></textarea>
    <footer>
      <button type="submit" class="small" data-send aria-label="Send">
        <icon-wc name="send"></icon-wc>
      </button>
    </footer>
  </chat-input>
</form>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | `message` | Form field name |
| `maxlength` | number | `4000` | Character limit |
| `minlength` | number | `1` | Prevents empty send |
| `disabled` | boolean | -- | Disables input and controls |
| `autofocus` | boolean | -- | Focus on connect |

### Light DOM Structure

```
chat-input
├── textarea[data-grow]           ← auto-resizing via VB's textarea-grow-init
└── footer
    ├── button[data-attach]       (optional — future vb-file-picker)
    └── button[data-send]         ← send trigger
```

The `textarea[data-grow]` attribute is auto-initialized by VB's existing `textarea-grow-init.js` MutationObserver — no extra JS needed for auto-resize.

### Keyboard Behavior

| Key | Action |
|-----|--------|
| `Enter` | Submit |
| `Shift+Enter` | Insert newline |
| `Escape` | Clear input |

### FormAssociated / ElementInternals

`static formAssociated = true`. Participates in native form submit, `FormData`, `reset()`, and `:invalid` / `:valid` pseudo-classes via `setFormValue()` and `setValidity()`.

### Submit Contract

Always fires `chat-input:send` (bubbles):

```javascript
new CustomEvent('chat-input:send', {
  bubbles: true,
  detail: { message, from: string|null, model: string|null }
})
```

Component disables itself during parent `chat-window` fetch cycle. On error: fires `chat-input:error`, sets `data-status="error"`.

### Public API

| Member | Type | Description |
|--------|------|-------------|
| `value` | string (get/set) | Current textarea content |
| `focus()` | method | Focus textarea |
| `reset()` | method | Clear value |
| `disabled` | boolean (get/set) | Disable state |

### Events

| Event | Detail | When |
|-------|--------|------|
| `chat-input:send` | `{ message, from, model }` | Submit |
| `chat-input:error` | `{ error, status }` | Fetch failure |
| `chat-input:input` | `{ value, length }` | Keystroke (debounced 100ms) |

### CSS Variables

```css
chat-input {
  --chat-input-bg:         var(--color-surface);
  --chat-input-border:     var(--border-width-thin) solid var(--color-border);
  --chat-input-radius:     var(--radius-m);
  --chat-input-padding:    var(--size-s);
  --chat-input-max-height: 12lh;
}
```

---

## Layer 3 — `<chat-window>` (Web Component)

The composed shell. Wires `chat-thread`, participant `Map`, `chat-input`, and an optional model selector.

### HTML

```html
<!-- AI chat with model selector -->
<chat-window data-endpoint="/api/ai">
  <header>
    <h3>AI Assistant</h3>
    <select data-model-select aria-label="Select model">
      <option value="claude-sonnet-4-6">Sonnet 4.6</option>
      <option value="claude-opus-4-6">Opus 4.6</option>
      <option value="claude-haiku-4-5">Haiku 4.5</option>
    </select>
  </header>
  <chat-thread role="log" aria-label="AI conversation" aria-live="polite">
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

<!-- Support chat with SSR-hydrated messages -->
<chat-window data-endpoint="/api/support">
  <script type="application/json" data-participants>
  {
    "user":  { "name": "You", "role": "user" },
    "sarah": { "name": "Sarah Chen", "role": "agent", "avatar": "/avatars/sarah.jpg" }
  }
  </script>
  <header>
    <h3>Support Chat</h3>
  </header>
  <chat-thread role="log" aria-label="Support conversation" aria-live="polite">
    <chat-message data-role="agent" data-from="sarah" data-from-label="Sarah Chen">
      <user-avatar data-size="sm">
        <img src="/avatars/sarah.jpg" alt="Sarah Chen" />
      </user-avatar>
      <chat-bubble><p>Welcome! How can I help?</p></chat-bubble>
    </chat-message>
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
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-endpoint` | URL | -- | API endpoint for chat requests |
| `data-model` | string | -- | Active model; synced with `[data-model-select]` child |
| `data-empty-message` | string | `"Send a message to start."` | Empty thread text |

### Participant Data

Participants are declared via a `<script type="application/json" data-participants>` block inside `chat-window`, or set programmatically via the `participants` setter. No invisible custom elements.

```html
<chat-window>
  <script type="application/json" data-participants>
  {
    "user":      { "name": "You", "role": "user" },
    "sarah":     { "name": "Sarah Chen", "role": "agent", "avatar": "/avatars/sarah.jpg" },
    "assistant": { "name": "Assistant", "role": "agent", "model": "claude-sonnet-4-6" }
  }
  </script>
  <!-- ... -->
</chat-window>
```

`chat-window` reads this on `connectedCallback` and builds a `Map<id, participant>`. On message append, JS resolves `data-from` id to display name and writes `data-from-label` so CSS can render it.

### Light DOM Structure

```
chat-window
├── <script type="application/json" data-participants>  (optional, hidden)
├── header
│   ├── h3 (title)
│   └── select[data-model-select]  (optional — hidden if absent)
├── chat-thread[role="log"]
│   └── chat-message elements
└── chat-input
    ├── textarea[data-grow]
    └── footer > button[data-send]
```

### Orchestration on `chat-input:send`

1. Build `chat-message[data-role="user"]` -> append -> scroll
2. Build `chat-message[data-role="agent", data-status="typing"]` -> append -> scroll; `aria-label="[name] is typing"` set on it
3. Disable `chat-input`
4. Await response from `data-endpoint`
5. Populate typing message with real content; remove `data-status="typing"`
6. Re-enable `chat-input`; restore focus

The typing animation lives in the same DOM node as the eventual reply — no element swap, no flicker.

### Model Selector

Standard `<select data-model-select>` child element. `chat-window` queries for it on connect. Hidden entirely when no model select is present (non-AI contexts get no selector automatically).

### Public API

| Member | Type | Description |
|--------|------|-------------|
| `model` | string (get/set) | Current model |
| `participants` | `Map<id, object>` (get/set) | Participant registry |
| `clearThread()` | method | Remove all dynamic messages |
| `appendMessage(role, html, from?)` | method | Programmatic message append |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `chat-window:model-change` | `{ model }` | Model selector changed |

---

## Shell Integration — Existing VB Primitives

The original spec proposed `<chat-launcher>`, `<chat-balloon>`, `<chat-sidebar>`, and `<chat-participant>` as new custom elements. These are eliminated in favor of existing VB patterns that already solve these problems.

### Launcher Pattern

A fixed-position trigger button opens a `<dialog>` containing `<chat-window>`. No new element needed.

```html
<!-- Fixed trigger button -->
<button commandfor="chat-dialog" command="show-modal"
        class="chat-trigger" aria-label="Open chat">
  <icon-wc name="message-circle"></icon-wc>
</button>

<!-- Dialog contains chat-window -->
<dialog id="chat-dialog">
  <chat-window data-endpoint="/api/chat">
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

**Trigger button CSS snippet** (optional — consumers can style their own):

```css
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
```

**Unread badge** (using existing `<layout-badge>`):

```html
<button commandfor="chat-dialog" command="show-modal"
        class="chat-trigger" aria-label="Open chat">
  <icon-wc name="message-circle"></icon-wc>
  <layout-badge data-color="error" data-size="sm"
                style="position:absolute;inset-block-start:-4px;inset-inline-end:-4px">
    3
  </layout-badge>
</button>
```

### Sidebar as Drawer

VB already has `<dialog data-position="start">` for slide-in drawer panels. Use this for chat history or participant rosters.

```html
<!-- Toggle button in chat-window header -->
<button commandfor="chat-history" command="show-modal"
        class="ghost small" aria-label="Chat history">
  <icon-wc name="sidebar"></icon-wc>
</button>

<!-- Drawer dialog -->
<dialog id="chat-history" data-position="start">
  <header>
    <h3>History</h3>
    <button commandfor="chat-history" command="close" class="ghost small">
      <icon-wc name="x"></icon-wc>
    </button>
  </header>
  <nav aria-label="Previous conversations">
    <a href="/chat/5">Refund request</a>
    <a href="/chat/4">Setup help</a>
  </nav>
</dialog>
```

### Sidebar as Split Layout

For always-visible sidebar panels (embedded chat with history), use `<layout-sidebar>`:

```html
<layout-sidebar data-layout-side="start" data-layout-sidebar-width="narrow">
  <aside>
    <nav aria-label="Chat history">
      <a href="/chat/5" aria-current="true">Current conversation</a>
      <a href="/chat/4">Refund request</a>
      <a href="/chat/3">Setup help</a>
    </nav>
  </aside>
  <chat-window data-endpoint="/api/ai">
    <!-- full chat-window content -->
  </chat-window>
</layout-sidebar>
```

---

## `<user-avatar>` Integration

`<user-avatar>` is an existing VB custom element. In chat, it's placed as a direct child of `chat-message` — no `slot` attribute needed.

```html
<chat-message data-role="agent" data-from="sarah">
  <user-avatar data-size="sm">
    <img src="/avatars/sarah.jpg" alt="Sarah Chen" />
  </user-avatar>
  <chat-bubble>Message text here.</chat-bubble>
</chat-message>
```

`chat-message` uses a two-column grid: `[avatar] [bubble]` for agent, `[bubble] [avatar]` for user. The `:not(:has(> user-avatar))` selector collapses the avatar column to a single-column layout when absent.

**With status indicator:**

```html
<user-avatar data-size="sm" data-shape="circle">
  <img src="/avatars/sarah.jpg" alt="Sarah Chen" />
  <span data-status="online"></span>
</user-avatar>
```

---

## Attachments

> **Status: TODO — blocked on `vb-file-picker`.**

The attach button can be placed in `chat-input`'s `<footer>`:

```html
<chat-input name="message">
  <textarea data-grow rows="1" placeholder="Type a message..."></textarea>
  <footer>
    <button type="button" class="ghost small" data-attach
            aria-label="Attach file (coming soon)">
      <icon-wc name="paperclip"></icon-wc>
    </button>
    <button type="submit" class="small" data-send aria-label="Send">
      <icon-wc name="send"></icon-wc>
    </button>
  </footer>
</chat-input>
```

---

## Streaming — Future (v2)

Out of scope for v1. The DOM structure doesn't preclude it. Planned approach: `chat-window` appends the typing message immediately, then streams tokens into the bubble — same element, no swap.

---

## CSS Architecture

Chat CSS lives in VB's existing layer system — no new layers, no dot notation:

```css
/* src/custom-elements/index.css — add imports: */
@import "./chat-thread/styles.css";
@import "./chat-message/styles.css";
@import "./chat-bubble/styles.css";

/* src/web-components/index.css — add imports: */
@import "./chat-input/styles.css";
@import "./chat-window/styles.css";
```

CSS-only display primitives go in `custom-elements` layer. Web component styles go in `web-components` layer. This matches how every other VB component is organized.

---

## Existing VB Primitives Reused

| Need | Existing VB Primitive | Source |
|------|----------------------|--------|
| Auto-growing textarea | `textarea[data-grow]` MutationObserver auto-init | `src/utils/textarea-grow-init.js` |
| FormAssociated CE | `static formAssociated = true` + `attachInternals()` | `src/web-components/combo-box/logic.js` |
| Button styling | `button.small`, `button.ghost`, `button.secondary` | `src/native-elements/button/styles.css` |
| Drawer panel | `<dialog data-position="start">` | `src/native-elements/dialog/styles.css` |
| Split layout | `<layout-sidebar>` | `src/custom-elements/layout-sidebar/` |
| Avatar | `<user-avatar data-size="sm">` + child `<img>` | `src/custom-elements/user-avatar/` |
| Badge | `<layout-badge data-color="error">` | `src/custom-elements/layout-badge/` |
| Empty state | `<status-message data-variant="neutral">` | `src/custom-elements/status-message/` |
| Icons | `<icon-wc name="...">` | `src/web-components/icon-wc/` |
| Trigger pattern | `data-trigger`, `data-send` on child element | `src/web-components/drop-down/logic.js` |
| Dialog open/close | `commandfor`/`command` attributes | `src/native-elements/dialog/` |

---

## Accessibility Checklist

- `chat-thread`: `role="log"` + `aria-live="polite"` + `aria-label`
- `chat-message`: `role="article"` (when agent) + `aria-label` combining sender + timestamp
- Typing message: `aria-label="[name] is typing"` set by `chat-window`
- `chat-bubble`: presentational wrapper
- `chat-input textarea`: `aria-label`, focus management
- Send button: `aria-label="Send"` + `aria-disabled` when empty
- Model `<select>`: `aria-label="Select model"`
- Dialog launcher: `commandfor`/`command` handles focus management
- `prefers-reduced-motion`: typing animation off, no scroll animations

---

## Token Reference

All CSS custom properties used in chat components and their VB sources:

| Usage | VB Token | Source |
|-------|----------|--------|
| Primary background | `--color-primary` | `tokens/colors.css` |
| Text on primary | `--color-text-on-primary` | `tokens/colors.css` |
| Surface background | `--color-surface` | `tokens/colors.css` |
| Raised surface | `--color-surface-raised` | `tokens/colors.css` |
| Sunken surface | `--color-surface-sunken` | `tokens/colors.css` |
| Body text | `--color-text` | `tokens/colors.css` |
| Muted text | `--color-text-muted` | `tokens/colors.css` |
| Borders | `--color-border` | `tokens/colors.css` |
| Error color | `--color-error` | `tokens/colors.css` |
| Success color | `--color-success` | `tokens/colors.css` |
| 4px spacing | `--size-2xs` | `tokens/spacing.css` |
| 8px spacing | `--size-xs` | `tokens/spacing.css` |
| 12px spacing | `--size-s` | `tokens/spacing.css` |
| 16px spacing | `--size-m` | `tokens/spacing.css` |
| 24px spacing | `--size-l` | `tokens/spacing.css` |
| 32px spacing | `--size-xl` | `tokens/spacing.css` |
| 12px font | `--font-size-xs` | `tokens/typography.css` |
| 14px font | `--font-size-sm` | `tokens/typography.css` |
| 16px font | `--font-size-md` | `tokens/typography.css` |
| 2px radius | `--radius-xs` | `tokens/borders.css` |
| 4px radius | `--radius-s` | `tokens/borders.css` |
| 8px radius | `--radius-m` | `tokens/borders.css` |
| 12px radius | `--radius-l` | `tokens/borders.css` |
| Full radius | `--radius-full` | `tokens/borders.css` |
| Thin border | `--border-width-thin` | `tokens/borders.css` |
| Fast transition | `--duration-fast` | `tokens/` |
| Default easing | `--ease-default` | `tokens/` |

---

## Phased Implementation

### Phase 1 — CSS-Only Primitives
- `src/custom-elements/chat-thread/styles.css`
- `src/custom-elements/chat-message/styles.css`
- `src/custom-elements/chat-bubble/styles.css`
- Add imports to `src/custom-elements/index.css`
- Static demo showing all states (user/agent/system, typing, avatars, no-avatar)

### Phase 2 — `<chat-input>` Web Component
- `src/web-components/chat-input/logic.js` + `styles.css`
- Light DOM, FormAssociated, reuses `textarea[data-grow]`
- Keyboard: Enter=submit, Shift+Enter=newline, Escape=clear
- Events: `chat-input:send`, `chat-input:error`, `chat-input:input`

### Phase 3 — `<chat-window>` Web Component
- `src/web-components/chat-window/logic.js` + `styles.css`
- Participant data via JS `Map` (no hidden CE)
- Orchestration: append user msg -> show typing -> populate response -> refocus
- Model `<select>` handled via `[data-model-select]` child query

### Phase 4 — Shell Integration
- Launcher pattern: `<dialog>` + fixed trigger `<button>` (CSS snippet for `.chat-trigger`)
- Sidebar pattern: `<dialog data-position="start">` for drawer
- Composition examples for AI widget, embedded support, full-page chat

### Phase 5 — Docs & Tests
- Nunjucks doc page per component + demo HTML
- `navigation.json` entries, elements index entries
- Unit tests (`tests/unit/`), Playwright component tests (`tests/components/`)
- Visual regression screenshots (`tests/visual/`)

---

## Full Composition Examples

### AI assistant widget (floating launcher)

```html
<button commandfor="ai-chat" command="show-modal"
        class="chat-trigger" aria-label="Ask AI">
  <icon-wc name="message-circle"></icon-wc>
</button>

<dialog id="ai-chat">
  <chat-window data-endpoint="/api/ai">
    <script type="application/json" data-participants>
    {
      "user":      { "name": "You", "role": "user" },
      "assistant": { "name": "Assistant", "role": "agent", "avatar": "/icons/bot.svg", "model": "claude-sonnet-4-6" }
    }
    </script>
    <header>
      <h3>AI Assistant</h3>
      <select data-model-select aria-label="Select model">
        <option value="claude-sonnet-4-6">Sonnet 4.6</option>
        <option value="claude-haiku-4-5">Haiku 4.5</option>
      </select>
      <button commandfor="ai-chat" command="close"
              class="ghost small" aria-label="Close">
        <icon-wc name="x"></icon-wc>
      </button>
    </header>
    <chat-thread role="log" aria-label="AI conversation" aria-live="polite">
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
</dialog>
```

### Embedded support panel (always visible, with sidebar)

```html
<layout-sidebar data-layout-side="start" data-layout-sidebar-width="narrow">
  <aside>
    <header>
      <h4>Participants</h4>
    </header>
    <ul>
      <li>
        <user-avatar data-size="sm">
          <img src="/avatars/sarah.jpg" alt="" />
          <span data-status="online"></span>
        </user-avatar>
        Sarah Chen
        <layout-badge data-color="success" data-size="sm">Online</layout-badge>
      </li>
    </ul>
  </aside>

  <chat-window data-endpoint="/api/support">
    <script type="application/json" data-participants>
    {
      "user":  { "name": "You", "role": "user" },
      "sarah": { "name": "Sarah Chen", "role": "agent", "avatar": "/avatars/sarah.jpg" }
    }
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

### Full-page chat with history drawer

```html
<chat-window data-endpoint="/api/ai" style="height:100dvh">
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
    <button commandfor="chat-history" command="close" class="ghost small">
      <icon-wc name="x"></icon-wc>
    </button>
  </header>
  <nav aria-label="Previous conversations">
    <a href="/chat/5" aria-current="true">Current conversation</a>
    <a href="/chat/4">Refund request</a>
    <a href="/chat/3">Setup help</a>
  </nav>
  <footer>
    <button class="ghost small">
      <icon-wc name="settings"></icon-wc> Preferences
    </button>
    <button class="ghost small">
      <icon-wc name="help-circle"></icon-wc> Help
    </button>
  </footer>
</dialog>
```

---

## Open Questions

1. **History serialization** — should `chat-window` expose a `history` getter returning structured message data for persistence?
2. **`content-type` negotiation** — auto-switch to `multipart/form-data` when attachments present, or require opt-in attribute?
3. **Code highlighting** — v1 ships styled `<pre><code>` only; Platform Highlight API tracked for v1.1.
4. **Streaming** — v2 feature. DOM structure is ready. Token-by-token append into existing bubble element.

---

## Deliverables

| Item | Status |
|------|--------|
| `chat-thread`, `chat-message`, `chat-bubble` CSS primitives | Spec complete |
| Typing state via `data-status="typing"` + CSS dots | Spec complete |
| `chat-input` FormAssociated WC (light DOM) | Spec complete |
| Participant data via `Map` + JSON script block | Spec complete |
| `chat-window` shell (light DOM) | Spec complete |
| `select[data-model-select]` integration | Spec complete |
| `user-avatar` child integration (no slots) | Spec complete |
| Launcher via `<dialog>` + `commandfor` | Spec complete |
| Sidebar via `<dialog data-position="start">` | Spec complete |
| Attachment stub + future `vb-file-picker` TODO | Noted |
| Streaming | v2 |
| POC demo | See `chat-poc.html` |
