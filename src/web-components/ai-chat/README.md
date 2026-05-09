# `<ai-chat>`

On-device chat via Chrome's `LanguageModel` (Prompt) API. Optionally page-aware: with a `context` selector, the targeted region's text is folded into the system prompt so the model can answer questions about the surrounding article. Conforms to [AI page-tools v1](../../../admin/specs/ai-page-tools-v1.md).

## Quick example

```html
<!-- General chat -->
<ai-chat
    placeholder="Ask anything…"
    fallback-url="https://claude.ai/new?q={prompt}"
    fallback-label="Ask Claude">
</ai-chat>

<!-- Page-aware chat -->
<ai-chat
    context="#article"
    context-label="this article"
    placeholder="Ask about this page…"
    endpoint="/api/ai/chat"
    fallback-url="https://claude.ai/new?q={prompt}"
    fallback-label="Continue with Claude">
  <template data-role="system">
    Answer using only the page content. If the answer isn't there, say so.
  </template>
  <template data-role="starters">
    Summarize the article in 3 bullets.
    What problem did the author identify?
  </template>
</ai-chat>
```

Provider resolution per session: **local Chrome LanguageModel → `endpoint=` → `fallback-url=` → unavailable.**

## API

See [`api.json`](./api.json).

| Attribute        | Default                          | Notes                                       |
|------------------|----------------------------------|---------------------------------------------|
| `context`        | —                                | CSS selector of the region to read.         |
| `context-label`  | the selector                     | Friendly label shown in the ribbon.         |
| `system`         | —                                | System-prompt prefix.                       |
| `placeholder`    | `Type a message…`                | Textarea placeholder.                       |
| `endpoint`       | —                                | Inline fallback. POST JSON, stream text.    |
| `fallback-url`   | —                                | Deep-link template.                         |
| `fallback-label` | —                                | Trigger label in deep-link mode.            |
| `fallback-prompt`| `Help me explore this article: {title} ({url})` | Override `{prompt}` substitution. |

## Slots / templates

- `<template data-role="system">` — long system-prompt copy. The `system` attribute wins if both are set.
- `<template data-role="starters">` — one prompt per line. Renders a chip row that disappears once a message exists.

## Files

- [`logic.js`](./logic.js)
- [`styles.css`](./styles.css)
- [`api.json`](./api.json)
- [`static.html`](./static.html)
