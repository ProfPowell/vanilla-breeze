# <analytics-panel>

Visitor-facing view of what analytics is doing on this page: whether it runs, why it is off, and which fields an event carries, with a Pause / Resume control.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/analytics-panel/
- Vanilla Breeze 0.7.4

## Example

```html
<analytics-panel></analytics-panel>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `heading` | string | `Analytics on this page` | Override the panel heading text |
| `heading-level` | `1`, `2`, `3`, `4`, `5`, `6` | `2` | Level of the panel heading; the field-list subheading is one level below (max 6) |
| `compact` | boolean |  | Tighter layout (smaller heading, text and buttons) for embedding alongside other UI |
| `data-state` | `active`, `debug`, `paused`, `off` |  | Reflected runtime state: active (sending), debug (console transport), paused (visitor paused this tab), off (any other reason) |
| `data-reason` | `user`, `gpc`, `dnt`, `consent`, `disabled`, `iframe`, `uninitialized` |  | Reflected when analytics is not sending: why |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `analytics-panel:optout` |  | Fired when the user pauses analytics for this tab |
| `analytics-panel:optin` |  | Fired when the user resumes analytics for this tab |

## Accessibility

- Pattern: Button
- The component manages: `role="status"`, `aria-pressed`, `aria-disabled`, `aria-describedby`, `aria-labelledby`, `aria-hidden`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Pause or resume analytics, or refresh the panel | Native behaviour of <button> |
