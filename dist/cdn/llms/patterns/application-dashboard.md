# Dashboard

Dashboard layouts with stat cards, charts, and data tables. Build comprehensive admin interfaces and analytics views.

- Documentation: https://vanilla-breeze.com/docs/patterns/application/dashboard/
- Vanilla Breeze 0.7.4

## Overview

Dashboard patterns combine multiple components to create data-rich interfaces. These layouts organize statistics, visualizations, and tabular data in a way that's easy to scan and understand.

Key features:
- KPI tiles with `<score-card>`: title, value, change, sparkline and icon slots, coloured by `trend`
- Charts with `<chart-wc>`, sized by a responsive grid
- Native `<table>` styling inside `<data-table>`, with `<layout-badge>` for status and `<user-avatar>` for identity
- Responsive grid layouts using `data-layout-min` for automatic column sizing
- Consistent spacing and `<layout-card>`-based organization

## Stats Grid Dashboard

A dashboard focused on key metrics displayed in `<score-card>` tiles. Each tile slots a title, a `<data>` value, a `<small>` change line, a sparkline and an icon; `trend="up|down"` colours the change, and wrapping the tile in a link makes it a drill-down.

`<score-card>` styles its own tile. The page supplies two small rules: the stroke of an inline SVG sparkline, coloured by the card's trend, and the link wrapper that makes a tile clickable. Swap the SVG for `<chart-wc slot="sparkline" data-size="sparkline">` to drop the first rule.

dashboard-stats.html:

```html
<main data-layout="center" data-layout-max="wide" data-layout-gap="xl">
  <!-- Page Header -->
  <header data-layout="cluster" data-layout-justify="between" data-layout-align="center">
    <hgroup>
      <h1>Dashboard</h1>
      <p>Overview of your business metrics</p>
    </hgroup>
    <layout-cluster data-layout-gap="s">
      <button type="button" class="button secondary">
        <icon-wc name="calendar" size="sm"></icon-wc>
        Last 30 days
      </button>
      <button type="button" class="button">
        <icon-wc name="download" size="sm"></icon-wc>
        Export
      </button>
    </layout-cluster>
  </header>

  <!-- Stats Grid -->
  <layout-grid data-layout-gap="l" data-layout-min="m">
    <a href="#revenue">
      <score-card trend="up" tone="success">
        <span slot="title">Total Revenue</span>
        <data slot="value" value="45231">$45,231</data>
        <small slot="change"><data value="0.12">+12%</data> from last month</small>
        <svg slot="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none" role="img" aria-label="Revenue trend, increasing">
          <path d="M 0 22 L 20 19 L 40 17 L 60 12 L 80 8 L 100 4"/>
          <circle cx="100" cy="4" r="2"/>
        </svg>
        <icon-wc slot="icon" name="dollar-sign" size="md"></icon-wc>
      </score-card>
    </a>

    <a href="#tasks">
      <score-card trend="down" tone="warning">
        <span slot="title">Tasks Completed</span>
        <data slot="value" value="0.89">89%</data>
        <small slot="change"><data value="-0.04">-4%</data> from last month</small>
        <!-- sparkline… -->
        <icon-wc slot="icon" name="check-circle" size="md"></icon-wc>
      </score-card>
    </a>
    <!-- Additional score cards... -->
  </layout-grid>
</main>
```

Sparkline and link CSS:

```css
svg[slot="sparkline"]        { display: block; inline-size: 100%; block-size: 100%; }
svg[slot="sparkline"] path   { fill: none; stroke: currentColor; stroke-width: 2; vector-effect: non-scaling-stroke; }
svg[slot="sparkline"] circle { fill: currentColor; }
score-card[trend="up"]   [slot="sparkline"] { color: var(--color-success); }
score-card[trend="down"] [slot="sparkline"] { color: var(--color-error); }

a:has(score-card) {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-m);
}
a:has(score-card):hover score-card {
  transform: translateY(-2px);
  border-color: var(--color-interactive);
}
```

## Charts Dashboard

An analytics layout: a row of `<score-card>` tiles above a responsive grid of `<layout-card>` panels, each holding a `<chart-wc>`. `<chart-wc>` ships in the separate charts bundle, so the page loads `vanilla-breeze-charts.css` and `vanilla-breeze-charts.js`.

## Data Table Dashboard

A dashboard centered on tabular data with a filter bar, status badges via `<layout-badge>`, user avatars via `<user-avatar>`, and row actions. The native `<table>` sits in `<data-table>`, whose container query lets `data-responsive="card"` turn rows into cards in a narrow card.

No extra CSS is needed. A button whose only child is an `<icon-wc>` and which carries an `aria-label` is squared automatically.

dashboard-table.html:

```html
<layout-card data-padding="none">
  <data-table>
    <table data-responsive="card">
      <thead>
        <tr>
          <th scope="col">Customer</th>
          <th scope="col">Email</th>
          <th scope="col">Status</th>
          <th scope="col">Amount</th>
          <th scope="col">Date</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <layout-cluster data-layout-gap="s" data-layout-nowrap>
              <user-avatar data-size="sm">
                <span data-fallback>JD</span>
              </user-avatar>
              <span>John Doe</span>
            </layout-cluster>
          </td>
          <td>john.doe@example.com</td>
          <td>
            <layout-badge data-color="success" data-variant="subtle" data-size="l">Completed</layout-badge>
          </td>
          <td>$250.00</td>
          <td>Jan 15, 2026</td>
          <td>
            <layout-cluster data-layout-gap="xs" data-layout-nowrap>
              <button type="button" class="button ghost small" aria-label="View order">
                <icon-wc name="eye" size="sm"></icon-wc>
              </button>
              <button type="button" class="button ghost small" aria-label="Edit order">
                <icon-wc name="edit" size="sm"></icon-wc>
              </button>
              <button type="button" class="button ghost small" aria-label="More actions">
                <icon-wc name="more-vertical" size="sm"></icon-wc>
              </button>
            </layout-cluster>
          </td>
        </tr>
      </tbody>
    </table>
  </data-table>
</layout-card>
```

## Configuration

Dashboard patterns use these layout attributes and components:

## Usage Notes

- KPI tiles: `<score-card>` lays out its slots and colours the change by `trend`; put the number in `<data value>` so the raw value stays machine-readable
- Native tables: Vanilla Breeze styles `<table>` elements directly — no custom classes needed. Wrap the table in `<data-table>` and add `data-responsive="card"` to reflow rows on small screens, or use a `[data-table-scroll]` wrapper for horizontal scrolling.
- Loading states: Show skeleton placeholders while data loads to prevent layout shift
- Responsive layout: The grid automatically adjusts columns based on `data-layout-min`; test on mobile to ensure usability
- Charts: `<chart-wc>` reads `data-values` JSON or a child `<table>`; another library can render into the same `<layout-card>` slot instead
- Semantic colors: Use `--color-success` for positive trends, `--color-error` for negative
- Empty states: Provide helpful empty states when no data is available
- Accessibility: Ensure tables have proper `scope` attributes and buttons have `aria-label`
- Real-time updates: Consider using subtle animations when stats update dynamically

## Related

Application shell layouts with navigation

Stat card patterns and change indicators

Card component with padding and variant options

Status badges with semantic colors

Avatar component with fallback initials

SVG icon component with size variants

KPI tile with value, change and sparkline slots

SVG charts from JSON or a table
