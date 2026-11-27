# <popularity-index>

Aggregated most-visited lens. Reads /api/analytics/popular (or any { pages: [{ url, title?, views }] } endpoint), enriches titles/provenance from pages.json, and reflects loading/ready/empty/unavailable state.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/popularity-index/
- Vanilla Breeze 0.7.4

## Example

```html
<popularity-index limit="10" window="7d"
                  data-meta-src="/pages.json"></popularity-index>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `analytics-src` | string | `/api/analytics/popular` | Popularity endpoint URL. Re-fetches when changed. |
| `data-meta-src` | string |  | Optional pages.json URL; fills missing titles and adds the provenance chip. Fetched in parallel with the endpoint. |
| `data-lens-src` | string |  | Shared lens pages.json URL (forwarded by content-lens); metadata fallback when data-meta-src is unset. Never used as the endpoint. |
| `limit` | number | `10` | Max entries shown (clamped to at least 1). |
| `window` | string |  | Time window forwarded as ?window=. The VB endpoint accepts 24h, 7d (default) and 30d. |
| `data-heading-level` | number | `2` | Heading level 1-6 for the panel heading; 0 renders no heading (e.g. inside content-lens, which already labels the lens). |
| `data-label-heading` | string | `Most visited` | Heading text. |
| `data-label-view` | string | `view` | Count noun used when Intl.PluralRules selects "one". |
| `data-label-views` | string | `views` | Count noun for every other plural category. |
| `data-label-unavailable` | string | `Popularity data is unavailable right now.` | Message when the endpoint fails (internal error detail is never shown). |
| `data-label-empty` | string | `Not enough data yet to surface most-visited pages.` | Message when the endpoint returns no usable pages. |
| `data-state` | `loading`, `ready`, `empty`, `unavailable` |  | Reflected load state; aria-busy="true" accompanies loading. Hide the panel with popularity-index[data-state="unavailable"] { display: none }. |
| `data-error` | string |  | Internal error detail for debugging when data-state="unavailable" (never rendered). |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `popularity-index:state` | `{ state }` | Fires when a load settles (ready, empty or unavailable). |

## Accessibility

- Pattern: Native links in an ordered list
- The component manages: `aria-busy`
