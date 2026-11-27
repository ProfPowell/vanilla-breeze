# <layout-canvas>

Elevated content surface (a panel with radius, shadow and a 1px edge: a hairline on a plain page, transparent under data-backdrop, CanvasText in forced colours). Attribute form: data-canvas on a semantic element (not data-layout), with the variant as its value: data-canvas (default), data-canvas="flush" or data-canvas="elevated". Below 37.5rem every canvas goes flush with reduced inline padding unless data-padding is set. Surface elements use bare data-* attributes.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/layout-canvas/
- Vanilla Breeze 0.7.4

## Example

```html
<!-- Attribute form (preferred) -->
<article data-canvas>
  <h2>Article with a canvas surface</h2>
  <p>The article itself is the surface: no wrapper element.</p>
</article>

<!-- Element form -->
<layout-canvas>
  <h2>Layout canvas element</h2>
  <p>The same surface as a wrapper.</p>
</layout-canvas>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-canvas` | (no value), `flush`, `elevated` |  | Attribute form: makes any element a canvas; the value is the variant (bare = default, flush, elevated). Use data-variant on the <layout-canvas> element instead. |
| `data-variant` | `flush`, `elevated` |  | Element form only: flush (no radius or shadow) or elevated (larger radius and shadow, 37.5rem and up). The attribute form puts the variant in data-canvas itself. |
| `data-max` | `narrow`, `normal`, `wide`, `prose` |  | Max inline size, centered: narrow / normal / wide (--content-* tokens) or prose (65ch). |
| `data-padding` | `none`, `s`, `m`, `l`, `xl` | `l` | Padding on all sides. An explicit value is kept below 37.5rem (otherwise the inline padding drops to --size-m there). |
| `data-canvas-depth` | `1`, `2` |  | Stacked-paper effect with 1 or 2 sheets behind the surface (37.5rem and wider; not on flush). |
