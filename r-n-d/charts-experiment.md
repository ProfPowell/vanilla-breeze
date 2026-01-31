# Progressive Enhancement Charts Experiment

## Overview

This experiment explores integrating CSS-only charting capabilities into Vanilla Breeze, based on our [vanilla-charts fork](https://github.com/ProfPowell/vanilla-charts) of Charts.css.

### Goals

1. **Progressive enhancement** - Data is accessible as HTML tables without CSS
2. **Design token integration** - Charts use Vanilla Breeze color/spacing tokens
3. **Minimal footprint** - No JavaScript required for basic charts
4. **Accessibility** - Screen readers see data as tables, not decorative elements

### Non-Goals

- Real-time data updates (use JS charting libraries)
- Complex interactivity (tooltips, drill-down)
- 3D visualizations

---

## Charts.css Foundation

The vanilla-charts fork provides CSS-only charting using semantic HTML tables:

```html
<table class="charts-css bar">
  <caption>Monthly Revenue</caption>
  <thead>
    <tr><th scope="col">Month</th><th scope="col">Revenue</th></tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">January</th>
      <td style="--value: 0.65">$6,500</td>
    </tr>
    <tr>
      <th scope="row">February</th>
      <td style="--value: 0.80">$8,000</td>
    </tr>
  </tbody>
</table>
```

### Supported Chart Types

| Type | Class | Description |
|------|-------|-------------|
| Bar | `.bar` | Horizontal bars |
| Column | `.column` | Vertical columns |
| Line | `.line` | Connected points |
| Area | `.area` | Filled line chart |
| Pie | `.pie` | Circular segments |
| Radial | `.radial` | Circular bars |
| Polar | `.polar` | Polar coordinate |
| Radar | `.radar` | Spider/web chart |
| Mixed | `.mixed` | Combined types |

---

## Integration Strategy

### 1. CSS Layer Integration

Charts CSS will be added as a dedicated layer:

```css
@layer charts {
  /* Chart-specific styles */
}
```

This allows proper cascade control with Vanilla Breeze's existing layers.

### 2. Design Token Mapping

Replace hardcoded colors with Vanilla Breeze tokens:

```css
/* Before (Charts.css) */
.charts-css td {
  background-color: #f00;
}

/* After (Vanilla Breeze integration) */
.vb-chart td {
  background-color: var(--color-primary);
}
```

#### Color Palette for Data Series

```css
:root {
  --chart-series-1: var(--color-primary);
  --chart-series-2: var(--color-accent);
  --chart-series-3: var(--color-success);
  --chart-series-4: var(--color-warning);
  --chart-series-5: var(--color-error);
  --chart-series-6: var(--color-info);
}
```

### 3. Naming Convention

Rename from `charts-css` to `vb-chart` for consistency:

```html
<!-- Charts.css original -->
<table class="charts-css bar">

<!-- Vanilla Breeze integration -->
<table class="vb-chart bar">
```

---

## Component API Design

### Basic Chart

```html
<table class="vb-chart bar">
  <caption>Sales by Region</caption>
  <tbody>
    <tr>
      <th scope="row">North</th>
      <td style="--value: 0.75">$75,000</td>
    </tr>
  </tbody>
</table>
```

### Chart Modifiers

| Modifier | Effect |
|----------|--------|
| `data-labels` | Show data labels on bars |
| `data-axes` | Show X/Y axes |
| `data-gap="s\|m\|l"` | Gap between bars |
| `data-legend` | Show legend below chart |
| `data-stacked` | Stack multiple series |

### Multi-Series Data

```html
<table class="vb-chart column" data-stacked>
  <caption>Quarterly Sales</caption>
  <thead>
    <tr>
      <th scope="col">Quarter</th>
      <th scope="col">Product A</th>
      <th scope="col">Product B</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Q1</th>
      <td style="--value: 0.60">$60k</td>
      <td style="--value: 0.40">$40k</td>
    </tr>
  </tbody>
</table>
```

---

## CSS Architecture

### File Structure

```
src/
  css/
    charts/
      _index.css      # Entry point with @layer
      _base.css       # Common chart styles
      _bar.css        # Bar chart specific
      _column.css     # Column chart specific
      _line.css       # Line chart specific
      _area.css       # Area chart specific
      _tokens.css     # Chart-specific tokens
```

### Layer Structure

```css
@layer charts {
  @layer tokens, base, bar, column, line, area;
}
```

### Base Styles

```css
@layer charts.base {
  .vb-chart {
    /* Reset table styling */
    border-collapse: collapse;
    border-spacing: 0;

    /* Chart container */
    --chart-height: 200px;
    --chart-gap: var(--size-xs);

    /* Hide caption visually, keep accessible */
    & caption {
      font-weight: 600;
      margin-block-end: var(--size-s);
    }

    /* Data cells become visual bars */
    & td {
      position: relative;
      background: var(--chart-series-1);
    }
  }
}
```

---

## Progressive Enhancement Considerations

### Without CSS

The table remains fully functional and readable:

```
Monthly Revenue
Month     Revenue
January   $6,500
February  $8,000
March     $9,200
```

### With CSS

The same table transforms into a visual bar chart.

### Print Styles

```css
@media print {
  .vb-chart {
    /* Show as table for printing */
    display: table;
  }

  .vb-chart td::before,
  .vb-chart td::after {
    display: none;
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .vb-chart td {
    transition: none;
  }
}
```

---

## Accessibility

### ARIA Considerations

Since charts are semantic tables, they're already accessible. Additional considerations:

1. **Caption** - Always include `<caption>` for chart title
2. **Headers** - Use `<th scope="row">` and `<th scope="col">`
3. **Data values** - Include text content in `<td>` cells

### Screen Reader Experience

```html
<table class="vb-chart bar">
  <caption>Monthly Sales</caption>
  <tbody>
    <tr>
      <th scope="row">January</th>
      <td style="--value: 0.65">$6,500</td>
    </tr>
  </tbody>
</table>
```

Screen reader announces: "Monthly Sales, table. Row 1: January, $6,500"

---

## Implementation Phases

### Phase 1: Foundation

- [ ] Create chart layer in CSS architecture
- [ ] Define chart-specific design tokens
- [ ] Implement base table reset
- [ ] Create bar chart CSS

### Phase 2: Core Chart Types

- [ ] Column charts
- [ ] Line charts
- [ ] Area charts

### Phase 3: Advanced Features

- [ ] Multi-series support
- [ ] Stacked charts
- [ ] Legend component
- [ ] Axes and labels

### Phase 4: Extended Types

- [ ] Pie charts
- [ ] Radial charts
- [ ] Radar charts

---

## Testing Plan

### Visual Testing

- Screenshots at various viewport sizes
- Theme switching (light/dark)
- High contrast mode

### Accessibility Testing

- Screen reader testing (VoiceOver, NVDA)
- Keyboard navigation
- Color contrast validation

### Progressive Enhancement Testing

- Disable CSS, verify table remains readable
- Print preview testing
- Reduced motion testing

---

## Open Questions

1. Should we support a Web Component wrapper (`<vb-chart>`) for enhanced features?
2. How to handle dynamic data updates without JavaScript?
3. Should we include optional JavaScript for tooltips?
4. What's the maximum number of data points we can reasonably support?

---

## References

- [Charts.css Documentation](https://chartscss.org/)
- [Vanilla Charts Fork](https://github.com/ProfPowell/vanilla-charts)
- [CSS Charts Without JavaScript](https://css-tricks.com/css-charts/)
- [WCAG 2.1 Non-text Content](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html)
