# <diagram-wc>

Declarative diagram renderer — wraps Mermaid (v1) with VB token-driven theming, lazy load, and HTML-first authoring via fenced code blocks

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/diagram-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<diagram-wc type="mermaid" caption="Login flow">
  <pre><code class="language-mermaid">flowchart LR
    accTitle: Login flow
    accDescr: Valid credentials create a session; invalid ones return to the visit step.
    A[Visit] --> B{Valid creds?}
    B -->|Yes| C[Session]
    B -->|No| A
  </code></pre>
</diagram-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `type` | string |  | Backend selector. v1 only supports "mermaid" |
| `src` | string |  | URL of a diagram source file (.mmd). Takes priority over inline <pre><code> source; fetched once per URL (not refetched when the element is moved). |
| `caption` | string |  | Rendered as <figcaption> below the SVG |
| `loading` | string |  | "lazy" defers render until the element scrolls into view |
| `data-theme-base` | string |  | Mermaid base theme: base\|default\|dark\|forest\|neutral. Default "base" so VB tokens win. |
| `min-height` | string |  | CSS length reserved for the diagram before render to prevent layout shift |
| `data-label-error` | string | `Diagram syntax error: {message}` | Text of the error note, also announced to screen readers; {message} is the first line of the parser error. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `diagram-wc:ready` | `{ svg: string, type: string, source: string }` | After a successful render (initial, source change or theme re-render) |
| `diagram-wc:error` | `{ error: Error, source: string\|null, type: string }` | Render or src fetch failed. If nothing has rendered yet the <pre> source is shown with an error note; otherwise the prior figure stays visible |
| `diagram-wc:source-changed` | `{ source: string }` | The .source setter assigned a new value |
| `diagram-wc:upgraded` |  | Fired once after the component upgrades |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `source` | `string` | Get/set the diagram source. Setting it re-renders (the prior figure stays until the new one is ready, and on a parse error) and fires diagram-wc:source-changed. Kept across disconnect/reconnect. |
| `svg` | `string` | Serialized markup of the currently rendered SVG, or an empty string before the first render |

## Accessibility

- Pattern: Figure with labelled SVG
- You provide: A caption attribute, or accTitle and accDescr lines in the Mermaid source, to name and describe the diagram
- The component manages: `aria-labelledby`, `aria-describedby`
