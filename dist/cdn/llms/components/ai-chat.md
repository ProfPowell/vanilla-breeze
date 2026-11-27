# <ai-chat>

On-device chat via Chrome's LanguageModel API. Optionally page-aware via context selector. Inline endpoint and external deep-link fallbacks. Conforms to admin/specs/ai-page-tools-v1.md.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/ai-chat/
- Vanilla Breeze 0.7.4

## Example

```html
<ai-chat
    context="#article"
    context-label="this article"
    placeholder="Ask about this page…">
  <template data-role="system">
    Answer using only the page content provided.
    If the answer isn't there, say so plainly.
  </template>
  <template data-role="starters">
    Summarize the article in 3 bullets.
    What problem does the author identify?
  </template>
</ai-chat>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `context` | string |  | CSS selector of a page region whose text is folded into the system prompt. Empty = general chat. |
| `context-label` | string |  | Human-friendly label for the context region (shown in the ribbon and used in the system prompt header). |
| `system` | string |  | System-prompt prefix. May also be supplied via <template data-role='system'>; attribute wins. |
| `placeholder` | string | `Type a message…` | Textarea placeholder text. Reactive via attributeChangedCallback. |
| `endpoint` | string |  | Inline-fallback HTTP URL (POST JSON, streamed text/plain or one-shot application/json). Sends prior turns as messages[] (admin/specs/ai-page-tools-v1.md §C, v1.1). |
| `fallback-url` | string |  | Deep-link URL template. Tokens: {prompt} {url} {title} {content}. {content} is the context region's text, capped at 1500 characters (empty without a context attribute). Provider-neutral. |
| `fallback-label` | string |  | Override the deep-link option label in the chat-window provider select. |
| `fallback-prompt` | string | `Help me explore this article: {title} ({url})` | Override the {prompt} string substituted into fallback-url. |
| `data-state` | `checking`, `ready`, `downloading`, `streaming`, `error`, `unavailable` |  | Lifecycle state. Per admin/specs/ai-page-tools-v1.md. |
| `data-context-state` | `ok`, `large`, `missing` |  | Reflects extracted page context size against the Nano budget. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `ai-chat:state` | `{ state, provider }` | Fires on every data-state transition. |
| `ai-chat:message` | `{ role, text }` | Fires once per completed message (user or assistant). |
| `ai-chat:context-overflow` | `{}` | Bubbled from the underlying session's contextoverflow event. |
| `ai-chat:error` | `{ error }` | Fires when generation fails. |

## Methods

| Method | Description |
| --- | --- |
| `reset()` | Abort any reply, destroy the current session, and clear the log and the conversation history sent to endpoints. |
| `stop()` | Abort the in-flight reply, if any. Same as the Stop button or Escape. |

## Accessibility

- Pattern: Live region
- The component manages: `role="log"`, `role="group"`, `aria-live`, `aria-label`, `aria-busy`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` | Send the message | Focus in the message field (handled by chat-input) |
| `Escape` | Stop the reply that is being generated; the draft in the message field is kept | While a reply is streaming |
