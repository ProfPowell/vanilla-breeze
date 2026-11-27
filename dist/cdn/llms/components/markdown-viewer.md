# <markdown-viewer>

Render markdown content with progressive enhancement. Supports external files, inline content, pluggable parsers, and VB theme integration.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/markdown-viewer/
- Vanilla Breeze 0.7.4

## Example

```html
<markdown-viewer>
  <pre>
# Hello world

This is **inline** markdown with a graceful fallback.
The raw text is visible if JS is disabled.
  </pre>
</markdown-viewer>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | string |  | URL of external markdown file |
| `allow-cross-origin` | boolean |  | Permit a src on another origin (CORS still applies; content is still sanitized unless sanitize="off"). Without it src must be same-origin http(s); redirects are re-checked |
| `sanitize` | `on`, `off`, `false` | `on` | Sanitizing is on unless this is "off" or "false" (any other value, or no attribute, keeps it on). Off writes parser output raw with innerHTML: trusted first-party markdown only, never with a cross-origin or user-influenced src |
| `highlight` | boolean |  | Fire per-block markdown-viewer:highlight events after render |
| `ping` | string |  | URL to ping with render metadata via sendBeacon |
| `data-theme` | string |  | Theme name propagated to .md-content container |
| `data-label-error` | string | `Failed to load markdown` | Text of the role="alert" message shown when src fails to load or parse and no <pre> fallback is visible |
| `data-auto-mermaid` | boolean |  | Upgrade ```mermaid fences in the rendered output to <diagram-wc> (main.js loads the markdown-mermaid bridge when present) |
| `data-rendered` | boolean |  | Present after successful render |
| `data-loading` | boolean |  | Present while fetching external content |
| `data-error` | boolean |  | Present if fetch or parse fails |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `markdown-viewer:fetch` | `{ src }` | Fired when external fetch begins |
| `markdown-viewer:rendered` | `{ src, node }` | Fired after parse and render complete |
| `markdown-viewer:highlight` | `{ node, language }` | Fired per code block when highlight attribute is set |
| `markdown-viewer:error` | `{ error }` | Fired on fetch or parse failure |

## Methods

| Method | Description |
| --- | --- |
| `render()` | Force a re-render from the current content source |
| `reload()` | Re-fetch the src URL and re-render |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `parser` | `Function\|null` | Custom parser function (markdown string → HTML string). Overrides the default marked parser. Its output is still sanitized unless sanitize="off" |
| `markdown` | `string` | Get the current markdown source, or set a string to render it instead of the slots/src (null or '' falls back to them) |

## Accessibility

- Pattern: Live region
- You provide: A fallback <pre> child if the raw source should stay readable when rendering fails
- The component manages: `role="note"`, `role="alert"`
