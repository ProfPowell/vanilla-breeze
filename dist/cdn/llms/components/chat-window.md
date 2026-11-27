# <chat-window>

Light DOM orchestrator for chat UI

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/chat-window/
- Vanilla Breeze 0.7.4

## Example

```html
<chat-window endpoint="/api/ai" model="claude-sonnet-4-6">
  <script type="application/json" data-participants>
  {
    "user":      { "name": "You", "role": "user" },
    "assistant": { "name": "Assistant", "role": "agent" }
  }
  </script>
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
    <textarea data-grow rows="1" data-max-rows="8" aria-label="Message"
              placeholder="Ask anything..."></textarea>
    <footer>
      <button type="submit" class="small" data-send aria-label="Send">
        <icon-wc name="send"></icon-wc>
      </button>
    </footer>
  </chat-input>
</chat-window>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `endpoint` | string |  | API endpoint; POSTs { message, model } (latest message only) and reads html/message/content from the JSON reply. Omit for custom transport |
| `model` | string |  | Active model; synced with [data-model-select] (property-driven after connect) |
| `empty-message` | string | `Send a message to start.` | Empty thread placeholder text |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-participants` | script | boolean |  | JSON participant map: { id: { name, role } } |
| `data-model-select` | select | boolean |  | Model selector inside the header; synced with model |
| `data-role` | chat-message | `user`, `agent`, `system` |  | Message role; user content is always text |
| `data-from` | chat-message | string |  | Participant id, resolved to data-from-label |
| `data-from-label` | chat-message | string |  | Sender name (written by the runtime from participants) |
| `data-status` | chat-message | `typing`, `error` |  | Typing placeholder or failed reply |
| `data-model` | chat-message | string |  | Model attribution on agent replies |
| `data-chat-typing` | span | boolean |  | Visually hidden typing label inside a typing chat-bubble (runtime) |
| `data-chat-empty` | p | boolean |  | Empty-thread placeholder inside chat-thread (runtime) |

## Structure

| Child | Description |
| --- | --- |
| `chat-thread[role=log]` | Message list; always rendered |
| `chat-input` | Composer; its chat-input:send drives the send cycle |
| `header` | Title and optional select[data-model-select] |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `chat-window:send` | `{ message, typingElement }` | A message was sent and no endpoint is set; finish with resolveTyping(typingElement, html) |
| `chat-window:error` | `{ error, status }` | The built-in fetch transport failed |
| `chat-window:model-change` | `{ model }` | The model selector changed |
| `chat-window:messages-changed` | `{ messages, source: 'property' }` | The messages setter updated the thread |

## Methods

| Method | Description |
| --- | --- |
| `appendMessage(role, content, from?)` | Append and return a chat-message; user content is text, other roles sanitized HTML |
| `resolveTyping(el, content, { error? })` | Finish a typing placeholder: fill its bubble, clear data-status (or set error) and the typing label |
| `clearThread()` | Remove all messages |
| `scrollToBottom()` | Scroll the thread to the newest message |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `messages` | `Array<{ id, role, content, from? }>` | Get the thread as data, or assign to replace the whole thread (keyed diff by id); content is text for role user, sanitized HTML otherwise |
| `model` | `string` | Active model; syncs with select[data-model-select] |
| `participants` | `Map<string, { name, role }>` | Participant registry; setting re-resolves data-from-label |

## Accessibility

- Pattern: Live region
- You provide: A <chat-thread role="log" aria-live="polite"> with an aria-label, and a chat-input
