# Stats Pattern

Metric cards and stat displays with numbers, labels, and change indicators. Perfect for dashboards and data summaries.

- Documentation: https://vanilla-breeze.com/docs/patterns/data/stats/
- Vanilla Breeze 0.7.4

## Overview

Stats patterns display key metrics at a glance. They combine large numbers with supporting context like labels, change indicators, and icons to help users quickly understand important data.

This page is the no-JS recipe. For the enhanced form with consistent layout, theme-driven trend coloring, drill-down anchors, and skeleton loading, use `<score-card>`. Adopting it is a small markup change: shadow-DOM slots only accept direct children, so the title, value, and change move out of the `<figure>` and sit directly under `<score-card>` with `slot` attributes (see score-card's static fallback).

Key features:
- Semantic HTML using `<figure>`, `<figcaption>`, and `<data>`
- Machine-readable values via the `value` attribute on `<data>`
- Trend indicators using `data-trend` attributes
- Scoped CSS for minimal class usage
- Responsive grid layout

## Simple Number Grid

A clean grid of stat figures with labels and large numbers. Each stat uses a `<figure>` element with a `<figcaption>` for the label and `<data>` for the machine-readable value. `data-layout="grid"` lays them out; the scoped CSS keys on the figure's own structure, so no class is needed.

Simple stats grid:

```html
<section data-layout="grid" data-layout-min="s" data-layout-gap="l" aria-label="Key metrics">
  <figure>
    <figcaption>Total Users</figcaption>
    <data value="24521">24,521</data>
  </figure>

  <figure>
    <figcaption>Revenue</figcaption>
    <data value="48352">$48,352</data>
  </figure>

  <figure>
    <figcaption>Orders</figcaption>
    <data value="1429">1,429</data>
  </figure>

  <figure>
    <figcaption>Conversion</figcaption>
    <data value="0.032">3.2%</data>
  </figure>
</section>
```

Scoped CSS:

```css
/* A stat: a figure whose caption is followed by a <data> value */
@scope (figure:has(> figcaption + data)) {
  :scope {
    display: flex;
    flex-direction: column;
    gap: var(--size-2xs);
    margin: 0;
  }

  figcaption {
    font-size: var(--font-size-s);
    color: var(--color-text-muted);
  }

  :scope > data {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
  }
}
```

## With Change Indicators

Stats with trend indicators showing change from a previous period. Uses `<small>` with a `data-trend` attribute for semantic color styling. The percentage change is wrapped in a nested `<data>` element for machine-readability.

Stats with change indicators:

```html
<section data-layout="grid" data-layout-min="s" data-layout-gap="l" aria-label="Key metrics">
  <figure>
    <figcaption>Total Users</figcaption>
    <data value="24521">24,521</data>
    <small data-trend="up">
      <icon-wc name="trending-up" size="sm"></icon-wc>
      <data value="0.125">+12.5%</data> vs last month
    </small>
  </figure>

  <figure>
    <figcaption>Bounce Rate</figcaption>
    <data value="0.423">42.3%</data>
    <small data-trend="down">
      <icon-wc name="trending-down" size="sm"></icon-wc>
      <data value="-0.031">-3.1%</data> vs last month
    </small>
  </figure>
</section>
```

Trend indicator styles:

```css
@scope (figure:has(> figcaption + data)) {
  small {
    display: flex;
    align-items: center;
    gap: var(--size-2xs);
    font-size: var(--font-size-s);
  }

  small[data-trend="up"] { color: var(--color-success); }
  small[data-trend="down"] { color: var(--color-error); }
}
```

## Card-Based Stats

Each stat in its own card with an icon for visual distinction. At this point the recipe is exactly what `<score-card>` packages: title, value, change and icon slots, with `trend="up|down"` colouring the change.

No custom CSS: `<score-card>` draws the tile, sizes the value and places the icon.

Card-based stats:

```html
<section data-layout="grid" data-layout-min="m" data-layout-gap="l" aria-label="Key metrics">
  <score-card trend="up">
    <span slot="title">Total Users</span>
    <data slot="value" value="24521">24,521</data>
    <small slot="change"><data value="0.125">+12.5%</data> from last month</small>
    <icon-wc slot="icon" name="users" size="md"></icon-wc>
  </score-card>

  <score-card trend="up">
    <span slot="title">Revenue</span>
    <data slot="value" value="48352">$48,352</data>
    <small slot="change"><data value="0.082">+8.2%</data> from last month</small>
    <icon-wc slot="icon" name="dollar-sign" size="md"></icon-wc>
  </score-card>
</section>
```

## Semantic Benefits

This pattern uses semantic HTML elements that provide meaning beyond visual presentation:
- `<figure>`: Groups the stat as a self-contained unit of content
- `<figcaption>`: Provides the label/caption for the figure
- `<data value="">`: Contains machine-readable values for parsing by scripts or assistive technologies. The `value` attribute holds the raw number while the text content shows the formatted display. Can be nested inside `<small>` to make change percentages machine-readable too
- `<small>`: Indicates secondary information (the trend/change indicator)

## Usage Notes

- Machine-readable values: Always include the raw number in the `value` attribute (e.g., `value="24521"` for "24,521" or `value="0.032"` for "3.2%"). Use nested `<data>` inside trend indicators for machine-readable change values (e.g., `<data value="0.125">+12.5%</data>`)
- Color semantics: Use `data-trend="up"` for positive trends and `data-trend="down"` for negative trends
- Accessibility: The semantic structure helps screen readers understand the relationship between labels and values
- Responsive: The grid automatically adjusts column count based on container width
- Context: Include context in trend indicators (e.g., "vs last month") so users understand what the change refers to

## Related

Machine-readable values

Self-contained content

Card container element

Full dashboard layouts with stats

Enhanced KPI tile component
