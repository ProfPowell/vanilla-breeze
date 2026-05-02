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

Without JS the page shows the source as a readable code block. With JS the source is replaced by an SVG `<figure>`, optionally captioned. The original `<pre>` is preserved for `teardown()` to restore on disconnect.

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

For manual wiring see `enhance.js`'s `enhanceMermaidFences(root)`.

## Notes

- Mermaid (~360 KB gzip) is loaded via dynamic `import('mermaid')` inside `setup()` only. It never lands in the core or pack bundles.
- `securityLevel: 'strict'` is hard-coded.
- For lazy (viewport-triggered) render set `loading="lazy"`.
