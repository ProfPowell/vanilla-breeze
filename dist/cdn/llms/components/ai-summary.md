# <ai-summary>

Summarise wrapped content via Chrome's Summarizer API, with optional inline endpoint fallback and external deep-link fallback. Conforms to admin/specs/ai-page-tools-v1.md.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/ai-summary/
- Vanilla Breeze 0.7.4

## Example

```html
<ai-summary type="key-points" length="medium" format="markdown">
  <article>
    <h2>Headline</h2>
    <p>Body content…</p>
  </article>
</ai-summary>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `type` | `key-points`, `tldr`, `teaser`, `headline` | `key-points` | Summarizer type — passed through to Summarizer.create(). |
| `length` | `short`, `medium`, `long` | `medium` | Summary length hint. |
| `format` | `markdown`, `plain-text` | `markdown` | Output format. plain-text output is rendered as text (no markdown-viewer). |
| `shared-context` | string |  | Optional shared context passed to Summarizer.create(). |
| `endpoint` | string |  | Inline-fallback HTTP URL (POST JSON, streamed text/plain or one-shot application/json). Wire format: admin/specs/ai-page-tools-v1.md §C. |
| `fallback-url` | string |  | Deep-link URL template. Tokens: {prompt} {url} {title} {content}. {content} is the wrapped text, capped at 1500 characters. Provider-neutral. |
| `fallback-label` | string |  | Override the trigger label when in deep-link mode. |
| `fallback-prompt` | string | `Summarize this article: {url}` | Override the {prompt} string substituted into fallback-url. |
| `data-state` | `checking`, `ready`, `downloading`, `streaming`, `complete`, `error`, `unavailable`, `deep-link` |  | Lifecycle state. Per admin/specs/ai-page-tools-v1.md. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `ai-summary:state` | `{ state, provider }` | Fires on every data-state transition. Provider is one of 'local'\|'endpoint'\|'deep-link'\|'unavailable'. |
| `ai-summary:result` | `{ text, provider }` | Fires once with the full summary on stream completion. |
| `ai-summary:error` | `{ error }` | Fires on any failure path (network, AI API, parsing). |

## Methods

| Method | Description |
| --- | --- |
| `stop()` | Abort the in-flight summary, if any. Same as the Stop button or Escape. |

## Accessibility

- Pattern: Live region
- The component manages: `role="status"`, `aria-live`, `aria-busy`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | Stop the summary that is being generated | While a summary is being generated |
