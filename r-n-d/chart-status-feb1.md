# Chart Experiments Status - February 1, 2026

## Overview

The Vanilla Breeze Charts module provides a CSS-only charting system built on semantic HTML tables. Data remains accessible without CSS and transforms into visual charts with CSS applied.

**Demo:** https://vb.test/lab/experiments/charts/

## Architecture

### File Structure

```
src/charts/
├── index.css      # Main entry, imports all chart modules
├── tokens.css     # Chart-specific design tokens
├── base.css       # Table reset and common patterns
├── bar.css        # Horizontal bar charts
├── column.css     # Vertical column charts
├── line.css       # Line charts (clip-path polygon)
├── area.css       # Area charts (clip-path polygon)
├── pie.css        # Pie and donut charts (conic-gradient)
├── legend.css     # Legend component styling
└── tooltip.css    # Hover/focus tooltip system

src/lib/
└── charts.js      # JavaScript helpers for dynamic charts
```

### Design Principles

1. **Progressive Enhancement** - Charts are semantic `<table>` elements that display as readable data tables without CSS
2. **CSS-Only Rendering** - Visual presentation uses only CSS (no canvas/SVG)
3. **Accessible by Default** - Screen readers see proper table structure with headers
4. **Print Friendly** - `@media print` reverts to table layout
5. **Motion Safe** - Respects `prefers-reduced-motion`

## Chart Types

### Completed & Stable

| Type | API | Status |
|------|-----|--------|
| **Bar** | `--value: 0-1` | Stable |
| **Column** | `--value: 0-1` | Stable |
| **Pie** | `conic-gradient` on tbody | Stable |
| **Donut** | `data-donut` modifier | Stable |

### Recently Fixed (Feb 1)

| Type | API | Status |
|------|-----|--------|
| **Line** | `--start`, `--end` per cell | Fixed |
| **Area** | `--start`, `--end` per cell | Fixed |

Line and area charts were rewritten to use the **Charts.css clip-path polygon pattern** for drawing actual connecting lines between data points. Previously they only showed disconnected dots.

## API Reference

### Bar/Column Charts

```html
<table class="vb-chart" data-type="bar">
  <caption>Chart Title</caption>
  <tbody>
    <tr>
      <th scope="row">Label</th>
      <td style="--value: 0.75">75%</td>
    </tr>
  </tbody>
</table>
```

### Line/Area Charts (Updated Feb 1)

```html
<table class="vb-chart" data-type="line" data-grid>
  <caption>Weekly Data</caption>
  <tbody>
    <tr>
      <th scope="row">Mon</th>
      <td style="--start: 0.45; --end: 0.45">450</td>
    </tr>
    <tr>
      <th scope="row">Tue</th>
      <td style="--start: 0.45; --end: 0.62">620</td>
    </tr>
    <!-- Key: --start = previous row's --end -->
  </tbody>
</table>
```

The `--start` and `--end` variables define line segment endpoints using `clip-path: polygon()`. Each cell's `--start` should equal the previous cell's `--end` to create continuity.

### Pie Charts

```html
<table class="vb-chart" data-type="pie">
  <caption>Market Share</caption>
  <tbody style="--seg-1: 0.45; --seg-2: 0.25; ...">
    <tr>
      <th scope="row">Company A</th>
      <td style="--value: 0.45; --start: 0" data-series="1">45%</td>
    </tr>
  </tbody>
</table>
```

## Modifiers

| Attribute | Effect |
|-----------|--------|
| `data-type="bar\|column\|line\|area\|pie"` | Chart type |
| `data-grid` | Show background grid lines |
| `data-tooltip` | Enable hover/focus tooltips |
| `data-labels` | Show value labels on bars |
| `data-gap="s\|m\|l"` | Spacing between items |
| `data-size="s\|l"` | Chart height variant |
| `data-donut` | Hollow center for pie charts |
| `data-series="1-6"` | Series color assignment |

## JavaScript API

The `charts.js` module provides helpers for dynamic chart creation:

```javascript
import { charts } from '/src/lib/charts.js';

// Create from data
charts.create({
  container: '#chart',
  type: 'bar',
  caption: 'Sales',
  data: [
    { label: 'Q1', value: 100 },
    { label: 'Q2', value: 150 }
  ],
  modifiers: { tooltip: true }
});

// Update existing chart
charts.update('#chart', newData);

// Animate entry
charts.animate('#chart', { stagger: 100 });
```

## Recent Commits

| Date | Commit | Description |
|------|--------|-------------|
| Feb 1 | `6bd0a56` | Add code-block examples for line/area charts |
| Feb 1 | `1082757` | Remove redundant code blocks from demo |
| Feb 1 | `14c5361` | Fix line/area with clip-path polygon pattern |
| Jan 31 | `838b7c4` | Fix tooltips, legend colors, line display |
| Jan 31 | `e3dc6f0` | Add CSS-only charts with progressive enhancement |

## Known Issues

1. **Line/Area JS API** - The JavaScript `charts.create()` method doesn't yet support the new `--start`/`--end` pattern for line/area charts. It still uses `--value` only.

2. **Multi-series Line Charts** - No support for multiple overlapping line series on same chart.

3. **Axis Labels** - Y-axis value labels (0, 25%, 50%, etc.) not implemented.

## Future Considerations

- **Stacked bar/column charts** - `data-stacked` modifier exists but incomplete
- **Grouped bar charts** - Multiple series side-by-side
- **Sparklines** - Minimal inline charts
- **Responsive breakpoints** - Switch chart type at narrow widths
- **Animation on scroll** - `charts.animateOnScroll()` exists but needs testing

## Dependencies

- Vanilla Breeze design tokens (colors, spacing, typography)
- No external charting libraries
- Works with any framework (Astro, vanilla HTML, etc.)

---

*Status as of February 1, 2026*
