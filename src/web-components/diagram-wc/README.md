# diagram-wc

Declarative diagram renderer for Vanilla Breeze. v1 wraps Mermaid; the `type` attribute is reserved for future backends (D2, Kroki).

## Authoring

```html
<diagram-wc type="mermaid" caption="Login flow">
  <pre><code class="language-mermaid">flowchart LR
    A[Visit] --> B{Valid creds?}
    B -->|Yes| C[Session]
    B -->|No| A
  </code></pre>
</diagram-wc>
```

Without JS the page shows the source as a readable code block. With JS the source is replaced by an SVG `<figure>`, optionally captioned, that keeps the source in a collapsed "Diagram source" `<details>`. Moving the element keeps the rendered figure and the current source (including one set via `.source`); `src` is fetched once per URL.

`src` takes priority over inline source. On a render error the previous figure stays visible with an error note; if nothing has rendered yet the source is shown as a `<pre>`.

## Theme integration

Tokens are read at render time via `getComputedStyle` and mapped to Mermaid `themeVariables` in `src/lib/diagram-tokens.js`. The component subscribes to the `vb:theme-change` event and re-renders so theme switches propagate without authoring.

## Markdown integration

`<markdown-viewer>` already emits `<pre><code class="language-mermaid">` for Mermaid fences. To upgrade those automatically, set `data-auto-mermaid` on the viewer:

```html
<markdown-viewer data-auto-mermaid>
  <script type="text/markdown">
    ```mermaid
    flowchart LR
      A --> B
    ```
  </script>
</markdown-viewer>
```

`<markdown-editor>` works the same way (its preview is a `<markdown-viewer>` under the hood). The bridge debounces re-enhancement during typing.

For manual wiring use `enhanceMermaidFences(root)` from `enhance.js` (re-exported by `logic.js`, so the CDN build `dist/cdn/components/diagram-wc.js` exports it too).

## Accessibility

The SVG keeps Mermaid's `graphics-document` role so node text stays reachable. Name it with Mermaid `accTitle:` (falls back to the `caption` attribute; no generic default is invented) and describe it with `accDescr:`. The source listing is always linked from the SVG via `aria-describedby`.

## Security and CSP

- Only page script chooses the Mermaid module: `window.VB_MERMAID_URL` (set before the first render), else the pinned jsDelivr URL. There is no per-element override — markup, including sanitized markdown, must not pick an imported module.
- CSP: `script-src https://cdn.jsdelivr.net` (or self-host and set `VB_MERMAID_URL`). Mermaid injects `<style>` into each SVG, so `style-src` needs `'unsafe-inline'`.
- Dynamic `import()` can't carry SRI; the URL is version-pinned. Self-host for integrity guarantees.

## Notes

- Mermaid (~360 KB gzip) is loaded via dynamic `import()` of a CDN URL on first render only. It never lands in the core or pack bundles.
- `mermaid.initialize()` is global, so config + render run through one module-level queue.
- `securityLevel: 'strict'` is hard-coded.
- For lazy (viewport-triggered) render set `loading="lazy"`.
