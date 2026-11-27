# <status-wc>

Visual state indicator. Variant drives color + animation. Pairs with status-message (textual) and notification-wc (action-bearing).

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/status-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<status-wc data-variant="live">Live</status-wc>
<status-wc data-variant="online">Available</status-wc>
<status-wc data-variant="paused">Drained</status-wc>
<status-wc data-variant="error">Failing</status-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-variant` | string |  | Built-in: live, recording, streaming, error, online, running, away, paused, busy, offline, stopped. Custom variants supported via CSS only. |
| `data-size` | string |  | xs \| sm \| md (default) \| lg — dot diameter scale |
| `data-position` | string |  | before (default) \| after \| only — dot position relative to label; "only" visually hides label |
| `data-pulse` | string |  | on \| off — override the variant's default animation |
| `data-live` | string |  | Set to "off" to drop role="status"/aria-live (decorative use) |
| `data-label-*` | string |  | Visually hidden default label per variant, used when the element has no slot text (e.g. data-label-online="En ligne"). Defaults: the English variant name (Live, Recording, Streaming, Error, Online, Running, Away, Paused, Busy, Offline, Stopped); a custom variant falls back to its name. |
| `aria-label` | string |  | Explicit name; with no slot text it is also used as the visually hidden label text |
| `role` |  |  | Defaults to "status" unless the author sets role/aria-live or data-live="off" |
| `aria-live` |  |  | Defaults to "polite" alongside role="status" |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `status-wc:change` |  | Fires when data-variant mutates after upgrade (not for the initial value). detail: { variant, previousVariant } |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `variant` | `string \| null` | Reads and writes data-variant (null/empty removes it) |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--status-dot-size` | Dot diameter (overrides data-size) |
| `--status-dot-color` | Dot color (overrides variant default) |
| `--status-dot-ring` | Dot ring colour (default: a darker shade of the dot colour in light mode, the dot colour in dark mode) |
| `--status-pulse-duration` | Pulse cycle duration |
| `--status-animation` | Direct animation shorthand override |
| `--status-gap` | Gap between dot and label |

## Accessibility

- Pattern: Live region
- You provide: Text content or a data-variant, so the status has a text label
- The component manages: `role="status"`, `aria-live`, `aria-hidden`
