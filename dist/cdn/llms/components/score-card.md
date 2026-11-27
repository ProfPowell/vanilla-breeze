# <score-card>

Single KPI tile for dashboards: title, headline value, optional change indicator, sparkline (composed with <chart-wc>), description, and icon. Wrap in <a href> for drill-down. Slotted children must be direct children of the host.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/score-card/
- Vanilla Breeze 0.7.4

## Example

```html
<score-card>
  <span slot="title">Orders</span>
  <data slot="value" value="1429">1,429</data>
</score-card>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `trend` | `up`, `down`, `flat` |  | Drives change-indicator color and exposes :state(trend-up\|trend-down\|trend-flat) |
| `tone` | `default`, `success`, `warning`, `error`, `info` |  | Optional accent color applied to the icon slot |
| `layout` | `stack`, `cluster`, `compact` |  | Grid template variant: vertical stack, icon-cluster row, or dense compact |
| `loading` | boolean |  | Skeleton placeholder state via :state(loading); mirrored to aria-busy="true" on the host |

## Slots

| Slot | Description |
| --- | --- |
| `title` | Metric label |
| `value` | Headline number — use <data value="..."> for machine-readable values |
| `change` | Delta indicator — recommend nested <data> for the change value |
| `sparkline` | Trend visualisation — compose with <chart-wc data-type="line\|area"> or any sized element |
| `description` | Supporting context line below the metric |
| `icon` | Brand or category icon (recommend <icon-wc>) |

## Parts

| Part | Description |
| --- | --- |
| `card` | Outer grid container |
| `title` | Title slot wrapper |
| `value` | Value slot wrapper |
| `change` | Change slot wrapper |
| `sparkline` | Sparkline slot wrapper |
| `description` | Description slot wrapper |
| `icon` | Icon slot wrapper |

## Accessibility

- Pattern: Static content
- The component manages: `aria-busy`
