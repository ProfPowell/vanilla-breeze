# <recently-visited>

Device-local reader history lens (localStorage, never sent or aggregated). Pages are recorded only when opted in with <meta name="vb:track-history" content="on"> or by this element's presence; <html data-vb-no-track> and <meta name="vb:no-track-history"> opt out.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/recently-visited/
- Vanilla Breeze 0.7.4

## Example

```html
<recently-visited limit="20"></recently-visited>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `limit` | number | `25` | Max page groups rendered. Storage itself is capped separately at 100 entries by the tracker. |
| `include-current` | boolean |  | Also list the page the reader is on (excluded by default). |
| `data-heading-level` | number | `2` | Heading level 1-6 for the panel heading; 0 renders no heading (e.g. inside content-lens). |
| `data-label-heading` | string | `Recently visited` | Heading text. |
| `data-label-explainer` | string | `Stored on this device only. Never sent to a server.` | Privacy note under the heading. |
| `data-label-pause` | string | `Pause tracking` | Pause toggle label (static; aria-pressed carries the state). |
| `data-label-anchors` | string | `Show anchor visits` | Anchor-visits toggle label (static; aria-pressed carries the state). |
| `data-label-clear` | string | `Clear history` | Clear button label. |
| `data-label-empty` | string | `No recently visited pages yet.` | Message rendered when there is no history. |
| `data-label-anchor-one` | string | `anchor` | Anchor count noun when Intl.PluralRules selects "one". |
| `data-label-anchor-other` | string | `anchors` | Anchor count noun for every other plural category. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `recently-visited:clear` |  | Fires when the reader clears the local history. |
| `recently-visited:pause-toggle` | `{ paused }` | Fires when the reader pauses or resumes tracking. |
| `recently-visited:anchors-toggle` | `{ showAnchors }` | Fires when the reader shows or hides anchor visits. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `entries` | `Array<{ url, hash, title, hashTitle, ts }>` | Read-only. Stored history, most recent first; expired (30-day TTL), malformed and off-origin records are filtered out. |

## Accessibility

- Pattern: Button
- The component manages: `aria-pressed`, `aria-disabled`, `aria-label`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Toggle pause, toggle anchors or clear the history | Native behaviour of button |
