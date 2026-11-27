# <user-avatar>

CSS-only avatar shell: a photo <img>, an initials / icon fallback stacked under it, and an optional presence dot. No JavaScript; the accessible name comes from the img alt, or from role="img" + aria-label on the host when the avatar is initials-only.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/user-avatar/
- Vanilla Breeze 0.7.4

## Example

```html
<user-avatar data-size="sm">
  <span data-fallback>SM</span>
</user-avatar>
<user-avatar data-size="lg">
  <span data-fallback>LG</span>
</user-avatar>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-size` | `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | `md` | Size: xs (1.5rem) to 2xl (8rem); omit for md (3rem). Initials never drop below 0.625rem. |
| `data-shape` | `rounded`, `square` |  | rounded (large radius) or square (medium radius) instead of a circle. |
| `data-ring` | boolean |  | Decorative ring (surface gap + border colour); kept inside overlap clusters, drawn as an outline in forced colours. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-fallback` | span | boolean |  | Initials or icon shown when there is no photo; stacked under the <img>, so a failed or transparent image reveals it. Add aria-hidden="true" when the host or img already carries the name. |
| `data-status` | span | `online`, `away`, `busy`, `offline` |  | Presence dot (colour + shape). Give it text: role="img" aria-label="Online", or text content, which is read but clipped visually. |
