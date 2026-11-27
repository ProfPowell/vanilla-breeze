# <site-legal>

Legal and compliance content container for copyright, license, privacy, and terms links

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/site-legal/
- Vanilla Breeze 0.7.4

## Example

```html
<site-legal>
  <span>&copy; 2026 Acme Inc</span>
  <span>MIT License</span>
</site-legal>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-justify` | `start`, `center`, `end`, `between` | `center` | Row alignment (sets --site-legal-justify). start and between also clip the separator that would lead a wrapped row. |

## Structure

| Child | Description |
| --- | --- |
| `<span>` | Copyright or license text (author the year as text, e.g. <time datetime="2026">2026</time>) |
| `<a>` | Legal page link (privacy, terms); always underlined |
| `<ul> / <ol>` | List form: a single list whose <li> children are the items (list semantics and an item count) |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--sep-list` | Separator text between items (default "\00B7", a middle dot); decorative, kept out of link names |
| `--site-legal-justify` | justify-content of the row (default center); start or space-between also clip the separator that would lead a wrapped row |
