# <comment-wc>

EXPERIMENTAL / STUB: inline "Add comment" action for selection-menu. Pins to a <review-surface>, which ships in the separate @profpowell/vb-project-planning package and not in Vanilla Breeze; without one the button is aria-disabled with a described reason.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/comment-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<review-surface editable>
  <selection-menu for="my-article">
    <highlight-wc></highlight-wc>
    <note-wc></note-wc>
    <comment-wc></comment-wc>
  </selection-menu>

  <article id="my-article">
    <p>Select text and click the comment icon to create a pin.</p>
  </article>
</review-surface>
```

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `aria-disabled` | button | string |  | Set by the component to "true" when no review-surface is found (resolved again on every click) |
| `aria-describedby` | button | string |  | Set by the component while disabled; points at the visually-hidden reason text |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `comment-wc:created` | `{ text, x, y }` | A pin was added to the resolved review-surface (x / y are percentages of its box) |

## Accessibility

- Pattern: Button
- You provide: A review-surface (from @profpowell/vb-project-planning) for the comment to attach to; without one the button is marked unavailable
- The component manages: `aria-label`, `aria-disabled`, `aria-describedby`, `aria-hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Start a comment on the current selection | Native behaviour of <button> |
