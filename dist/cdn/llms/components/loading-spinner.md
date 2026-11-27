# <loading-spinner>

CSS-only animated loading spinner. Standalone: add role="status" + aria-label. Next to visible text: add aria-hidden="true".

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/loading-spinner/
- Vanilla Breeze 0.7.4

## Example

```html
<loading-spinner role="status" aria-label="Loading"></loading-spinner>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-size` | `xs`, `s`, `m`, `l`, `xl` | `m` | Spinner diameter and stroke: xs 0.75em, s 1em, m 1.5em, l 2.5em, xl 4em (em-relative, so it scales with the surrounding text). |
| `data-variant` | `primary`, `success`, `warning`, `error` |  | Arc colour from a theme token (--color-interactive / -success / -warning / -error). Without it the arc uses currentColor. |
| `data-overlay` | boolean |  | position: absolute; inset: 0 over the nearest positioned ancestor, with a translucent surface backdrop and the spinner centered. The container must have a non-static position. |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--spinner-size` | Spinner diameter (default 1.5em; data-size presets override). |
| `--spinner-width` | Ring stroke width (default 0.2em). |
| `--spinner-color` | Arc colour (default currentColor). |
| `--spinner-track` | Track colour (default the arc colour at 20% alpha). |
| `--spinner-speed` | Duration of one rotation (default 0.7s; 1.5s under reduced motion). |
