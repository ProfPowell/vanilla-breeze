# <change-set>

Interactive change tracking group: a caption from author/datetime plus Tracking / Final / Original toggles over its <ins> / <del> descendants

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/change-set/
- Vanilla Breeze 0.7.4

## Example

```html
<change-set datetime="2026-02-20" author="tpowell">
  <p>
    Send requests to
    <del>/api/v1/upload</del>
    <ins>/api/v2/ingest</ins>
    with a
    <del>Content-Type: application/xml</del>
    <ins>Content-Type: application/json</ins>
    header.
  </p>
</change-set>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `view` | `final`, `original` |  | Which text is visible: final (insertions only), original (deletions only); omitted = tracking (both, with announced markers). Observed; works without JS |
| `datetime` | string |  | ISO date of the change set; rendered in the caption and the controls' name |
| `author` | string |  | Author of the changes; rendered in the caption and the controls' name |
| `controls` | `none` |  | "none" renders no toggle controls (fixed view) |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-controls` | div | boolean |  | Set by the component on the role="group" toggle container |
| `data-action` | button | `tracking`, `final`, `original` |  | Set by the component: the view a toggle selects |
| `aria-pressed` | button | `true`, `false` |  | Set by the component: true on the toggle matching the current view |
| `data-change-caption` | p | boolean |  | Set by the component on the author/datetime caption |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `change-set:view` | `{ view: 'tracking' \| 'final' \| 'original', source?: 'api' }` | View changed via the toggles (no source) or the view property (source: 'api'). Bubbles |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `view` | `'tracking' \| 'final' \| 'original'` | Get / set the view. Setting the current view is a no-op; unknown values are ignored |

## CSS custom properties

| Property | Description |
| --- | --- |
| `undefined` |  |
| `undefined` |  |
| `undefined` |  |
| `undefined` |  |

## Accessibility

- Pattern: Button
- You provide: <ins> and <del> elements marking the changes
- The component manages: `role="group"`, `aria-label`, `aria-pressed`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Switch to that view of the changes | Native behaviour of <button> |
