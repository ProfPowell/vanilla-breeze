# <chart-wc>

SVG chart component with progressive enhancement: semantic table → CSS chart → SVG chart.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/chart-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<chart-wc
  data-type="line"
  data-title="Weekly Users"
  data-label-x="Day of Week"
  data-label-y="Users"
  data-legend
  data-tooltip
  data-values='[
    {"name": "Desktop", "values": {"Mon": 120, "Tue": 180, "Wed": 150, "Thu": 210, "Fri": 190, "Sat": 80, "Sun": 60}},
    {"name": "Mobile",  "values": {"Mon": 80,  "Tue": 120, "Wed": 160, "Thu": 140, "Fri": 200, "Sat": 220, "Sun": 180}}
  ]'>
</chart-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-type` | `bar`, `column`, `line`, `area`, `pie`, `ring`, `scatter`, `bubble` |  | Chart type to render |
| `data-values` | string |  | Chart data as JSON string |
| `data-config` | string |  | Chart config overrides as JSON string |
| `data-title` | string |  | Chart title text; also the caption of the generated data table |
| `data-subtitle` | string |  | Subtitle shown under data-title (requires data-title) |
| `data-label-x` | string |  | X / category axis label; also the category column header of the generated data table |
| `data-label-y` | string |  | Y / value axis label |
| `data-legend` | (no value), `true`, `false` | `true` | Series legend with show/hide checkboxes. On by default; "false" hides it (bare or "true" keeps it on). Wins over data-config. Moves under the plot when the chart is 400px wide or less. |
| `data-tooltip` | (no value), `true`, `false` | `true` | Hover tooltips. On by default; "false" turns them off (bare or "true" keeps them on). Wins over data-config. |
| `data-palette` | string |  | Custom color palette as JSON array |
| `data-chart` | `replace`, `enhance` |  | How to handle an authored source table: replace (default) visually hides it after the chart mounts but keeps it in the accessibility tree; enhance keeps it visible. Also readable from the table's own data-chart. |
| `data-size` | `sparkline` |  | Render mode. sparkline strips all chrome (axes, ticks, gridlines, labels, title, legend, tooltip) for use as an inline trend chart sized by its container. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-chart-series` | th | boolean |  | Mark this column as a data series for chart extraction |
| `data-chart-label` | th | boolean |  | Mark this column as the label/category axis |
| `data-chart-ignore` | th | boolean |  | Exclude this column from chart data extraction |

## Structure

| Child | Description |
| --- | --- |
| `<table>` | Optional source table — data is extracted; the table stays the screen-reader (and print) version of the chart. Without one, chart-wc generates a table[data-chart-generated] from the data. |
| `<script type='application/json'>` | Optional inline JSON data source |
| `<template data-chart-data>` | Optional template-based JSON data source |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `chart-wc:render` | `{ type, seriesCount }` | Fired after SVG chart renders successfully |
| `chart-wc:error` | `{ message }` | Fired when no data is found or chart rendering fails (the data table is then left visible) |
| `chart-wc:config-resolved` | `{ type, config }` | Fired before each render with the merged engine config (mutable, for last-minute tweaks) |
| `chart-wc:data-changed` | `{ data, config, source: 'property' }` | Fired when .data or .config is assigned |
| `chart-wc:upgraded` |  | Fired once after the component upgrades; safe signal for the first .data assignment |

## Methods

| Method | Description |
| --- | --- |
| `refresh()` | Re-extract table data and re-render |
| `toSVG()` | Get current SVG markup |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `data` | `Array\|Object` | Get/set chart data programmatically |
| `config` | `Object` | Get/set chart config programmatically |

## Accessibility

- Pattern: Image with data table alternative
- You provide: A data table or data source, and a data-title (used as the table caption or the image name)
- The component manages: `role="img"`, `aria-hidden`, `aria-label`, `tabindex`, `hidden`
