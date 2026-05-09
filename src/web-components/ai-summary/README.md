# `<ai-summary>`

Summarise wrapped content via Chrome's Summarizer API, with optional inline-endpoint and external deep-link fallbacks. Conforms to [AI page-tools v1](../../../admin/specs/ai-page-tools-v1.md).

## Quick example

```html
<ai-summary
    type="key-points"
    length="medium"
    fallback-url="https://claude.ai/new?q={prompt}"
    fallback-label="Read with Claude">
  <article>
    <h2>Headline</h2>
    <p>Body…</p>
  </article>
</ai-summary>
```

Provider resolution per click: **local Chrome Summarizer → `endpoint=` → `fallback-url=` → unavailable.**

## API

See [`api.json`](./api.json) for the full attribute / event surface.

| Attribute        | Default                          | Notes                                   |
|------------------|----------------------------------|-----------------------------------------|
| `type`           | `key-points`                     | `tldr` / `teaser` / `headline` also.    |
| `length`         | `medium`                         | `short` / `long` also.                  |
| `format`         | `markdown`                       | `plain-text` also.                      |
| `shared-context` | —                                | Passed to `Summarizer.create()`.        |
| `endpoint`       | —                                | Inline fallback. POST JSON, stream text. |
| `fallback-url`   | —                                | Deep-link template. Tokens: `{prompt}`, `{url}`, `{title}`, `{content}`. |
| `fallback-label` | —                                | Override trigger label in deep-link mode. |
| `fallback-prompt`| `Summarize this article: {url}` | Override the `{prompt}` substitution.    |

## Files

- [`logic.js`](./logic.js) — extends `VBElement`, uses `src/lib/ai/`.
- [`styles.css`](./styles.css) — light DOM, theme-token aware.
- [`api.json`](./api.json) — public contract.
- [`static.html`](./static.html) — pre-upgrade fallback.
