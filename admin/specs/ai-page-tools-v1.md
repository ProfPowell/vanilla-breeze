# Vanilla Breeze AI Page-Tools — v1

> **Status:** stable, 2026-05-08
> **Owner:** VB AI page-tools epic ([`vanilla-breeze-ddm0`](../../.beads/issues.jsonl))
> **Consumers:** `<ai-summary>`, `<ai-chat>` (Phase 1). Future `ai-*` components must conform unless this spec is bumped to v2.
> **Source of truth:** this file. Shared implementation in [`src/lib/ai/`](../../src/lib/ai/).

This is the cross-component contract for AI-powered page-tool components in Vanilla Breeze. It covers availability detection, fallback resolution, provider configuration, and the public attribute / event surface every `<ai-*>` component must honour.

The contract is **provider-neutral**. VB does not bake in Anthropic, OpenAI, or any other vendor. Components ship working integrations with Chrome's built-in on-device APIs (Summarizer, LanguageModel, …) and accept author-configured URLs for everything else.

---

## Section A — Provider resolution order

Every `<ai-*>` component picks a provider once per request, in this order:

1. **`local`** — Chrome's built-in API (`Summarizer`, `LanguageModel`, …). Used when [`checkAvailability`](#availability-states) returns `available`, `downloadable`, or `downloading`.
2. **`endpoint`** — the URL configured via the `endpoint="…"` attribute. The component POSTs JSON and streams the response inline.
3. **`deep-link`** — the URL template configured via `fallback-url="…"`. Opens in a new tab; the user finishes the task externally.
4. **`unavailable`** — none of the above. The component shows a quiet "unavailable" state and the trigger goes inert.

Implementation: [`resolveProvider`](../../src/lib/ai/availability.js).

---

## Section B — Availability states

`checkAvailability(apiName)` returns one of:

| State          | Meaning                                                                |
|----------------|------------------------------------------------------------------------|
| `available`    | Local API ready, model loaded.                                          |
| `downloadable` | Local API present; first call will trigger model download.              |
| `downloading`  | Model download in progress.                                             |
| `unavailable`  | API present but the device cannot run it (insufficient disk, etc.).     |
| `unsupported`  | API is not exposed to the page (today's Safari/Firefox, or thrown).     |

`available` / `downloadable` / `downloading` route to the **local** provider. `unavailable` / `unsupported` fall through to `endpoint` → `deep-link` → `unavailable`.

The `data-state` attribute on the host element reflects internal lifecycle, not raw availability. Each component documents its own state vocabulary.

---

## Section C — Inline endpoint wire format

When provider is `endpoint`, the component issues:

```
POST {endpoint}
Content-Type: application/json

{
  "prompt":  "<component-composed task prompt>",
  "content": "<extracted page content>"   // optional
  "mode":    "summarize" | "chat" | …      // component-specified hint
}
```

Acceptable response shapes:

| Content-Type                 | Behaviour                                                   |
|------------------------------|-------------------------------------------------------------|
| `text/plain` (any charset)   | Streamed; chunks yielded via `TextDecoder` as they arrive.  |
| `application/json`           | Single `{ "text": "…" }` payload, yielded once.             |

Anything else, or a non-2xx status, is an error. Implementation: [`callEndpoint`](../../src/lib/ai/endpoint.js).

Implementations on the server side are unconstrained — wrap Anthropic's API, OpenAI's API, a self-hosted model, anything that conforms to the wire format above.

---

## Section D — Deep-link template tokens

When provider is `deep-link`, the component composes a URL by substituting these tokens in the `fallback-url` template (URL-encoded on substitution):

| Token       | Source                                                                  |
|-------------|-------------------------------------------------------------------------|
| `{prompt}`  | Component-composed task prompt. Each component ships a sensible default; authors override with `fallback-prompt="…"`. |
| `{url}`     | `location.href`.                                                         |
| `{title}`   | `document.title`.                                                        |
| `{content}` | Extracted page text (length-capped — long URLs may be rejected). Optional. |

Provider-neutral: the same template syntax works for `claude.ai`, `chatgpt.com`, `perplexity.ai`, `mailto:`, internal tools, and anything else that accepts a URL with a query string.

Default prompts per component (override via `fallback-prompt`):

- `<ai-summary>` — `"Summarize this article: {url}"`
- `<ai-chat>` — `"Help me explore this article: {title} ({url})"`

Implementation: [`expandFallbackURL`](../../src/lib/ai/fallback.js).

---

## Section E — Required public surface

Every `<ai-*>` component MUST expose:

### Attributes

| Attribute            | Direction | Purpose                                                              |
|----------------------|-----------|----------------------------------------------------------------------|
| `endpoint`           | input     | Inline-fallback HTTP URL. Optional.                                  |
| `fallback-url`       | input     | Deep-link URL template. Optional.                                    |
| `fallback-label`     | input     | Override the default trigger label when in deep-link mode.           |
| `fallback-prompt`    | input     | Override the component's default `{prompt}` text.                    |
| `data-state`         | output    | Reflects lifecycle (`checking`, `ready`, `streaming`, `unavailable`, `error`, …). Component-specific vocabulary, documented in its `api.json`. |

### Events (colon-namespaced, matches `markdown-viewer:rendered` / `page-toc:navigate`)

| Event                          | Detail                       |
|--------------------------------|------------------------------|
| `ai-{name}:state`              | `{ state }`                  |
| `ai-{name}:result` *or* `ai-{name}:message` | Component-specific payload |
| `ai-{name}:error`              | `{ error }`                  |

Components MAY add component-specific events (e.g. `ai-chat:context-overflow`). They MUST NOT rename or skip the three above.

---

## Section F — Authoring conventions

- **Light DOM.** No shadow root. Matches `mark-down`, `markdown-viewer`, `reader-view`. Streamed markdown output is rendered through `<markdown-viewer>` for theme integration.
- **Attributes for config; slots for content.** Long config (system prompts, starter chips) goes in child `<template data-role="system">` / `<template data-role="starters">` elements.
- **State as `data-state`** on the host. CSS handles visual differences. No `.classList` juggling for lifecycle.
- **Lazy session creation.** Local Chrome APIs require user activation. `checkAvailability` runs on connect; `create()` runs on first user gesture.
- **No automatic content extraction without consent.** Components extract page text only when explicitly targeted via `context="…"` or by wrapping content as children.

---

## Section G — Versioning

This spec is **v1**. Breaking changes (renaming attributes, changing the wire format, changing the resolution order) require bumping to `v2` in a new file (`ai-page-tools-v2.md`) and updating each component's `api.json`. Forward-compatible additions (new optional attributes, new events) can land in `v1.x` revisions in this file.

VB is pre-release. Breaking the spec is permitted while the corpus is still small; it gets harder later.
