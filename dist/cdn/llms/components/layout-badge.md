# <layout-badge>

Small inline status or count badge. Colour reinforces the text, never replaces it. Surface elements use bare data-* attributes.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/layout-badge/
- Vanilla Breeze 0.7.4

## Example

```html
<layout-badge>Default</layout-badge>
<layout-badge data-color="primary">Primary</layout-badge>
<layout-badge data-color="success">Success</layout-badge>
<layout-badge data-color="warning">Warning</layout-badge>
<layout-badge data-color="error">Error</layout-badge>
<layout-badge data-color="info">Info</layout-badge>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-size` | `s`, `l` |  | Size: s (11px floor) or l; omit for the default (--font-size-xs). |
| `data-color` | `primary`, `success`, `warning`, `error`, `info`, `brand`, `secondary`, `accent` |  | Semantic (primary, success, warning, error, info) or theme (brand, secondary, accent) colour. Colour is never the only signal: the badge text must carry the meaning. |
| `data-variant` | `subtle`, `outlined` |  | subtle (mode-aware tint with --color-*-text ink) or outlined (transparent, border in the text colour) instead of filled. |
| `data-shape` | `square`, `ribbon`, `notch`, `flag`, `double-arrow`, `stamp` |  | square: square corners instead of a pill. ribbon (V cut at the inline end), notch (V cut at the inline start), flag (point at the inline end), double-arrow (points at both ends) and stamp (concave corners) are decorative shapes painted behind the text; they mirror in RTL, never clip the label or the focus outline, and fall back to a bordered rectangle in forced colours. Tune the notch depth with --badge-notch. |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--badge-notch` | Notch / point depth of the decorative data-shape values (default 0.75em); the padding on the notched side grows by the same length. |
| `--badge-shape-fill` | Fill of a decorative shape (default: the badge background for its data-color / data-variant). Accepts gradients. |
