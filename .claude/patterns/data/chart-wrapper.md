# Chart Wrapper

## Description

Container pattern for embedding charts and data visualizations. Provides consistent styling, accessibility labels, and responsive behavior for third-party charting libraries.

## Anatomy

- **container**: The chart wrapper
- **header**: Optional title and description
- **chart**: The chart area (slot for library output)
- **legend**: Optional legend (if not in chart)
- **footer**: Optional source/notes

## States

| State | Description |
|-------|-------------|
| Loading | Placeholder while data loads |
| Loaded | Chart is displayed |
| Error | Failed to load data |
| Empty | No data available |

## Variants

### Aspect Ratio

**Attribute:** `data-ratio`
**Values:** `16:9`, `4:3`, `1:1`, `auto`

### Size

**Attribute:** `data-size`
**Values:** `compact`, `default`, `full`

## Baseline HTML

```html
<figure class="chart-wrapper">
  <figcaption>Monthly Revenue</figcaption>
  <div class="chart-area">
    <!-- Chart library renders here -->
  </div>
</figure>
```

## Enhanced HTML

```html
<chart-wrapper data-ratio="16:9" data-size="default">
  <header data-header>
    <h3 data-title>Monthly Revenue</h3>
    <p data-description>Revenue trends over the past 12 months</p>
  </header>

  <div data-chart role="img" aria-label="Bar chart showing monthly revenue from January to December 2024">
    <!-- Chart library output (Canvas, SVG, etc.) -->
  </div>

  <div data-legend>
    <span data-legend-item data-color="primary">Revenue</span>
    <span data-legend-item data-color="secondary">Expenses</span>
  </div>

  <footer data-footer>
    <span data-source>Source: Financial Reports 2024</span>
    <span data-updated>Updated: Jan 15, 2025</span>
  </footer>
</chart-wrapper>
```

## CSS

```css
@layer components {
  chart-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--size-m);
    background: var(--surface, white);
    border: 1px solid var(--border, oklch(0.85 0 0));
    border-radius: var(--radius-lg);
    padding: var(--size-l);
  }

  /* Header */
  chart-wrapper [data-header] {
    display: flex;
    flex-direction: column;
    gap: var(--size-2xs);
  }

  chart-wrapper [data-title] {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text);
  }

  chart-wrapper [data-description] {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  /* Chart area */
  chart-wrapper [data-chart] {
    position: relative;
    width: 100%;
    min-height: 12rem;
  }

  /* Aspect ratio variants */
  chart-wrapper[data-ratio="16:9"] [data-chart] {
    aspect-ratio: 16 / 9;
  }

  chart-wrapper[data-ratio="4:3"] [data-chart] {
    aspect-ratio: 4 / 3;
  }

  chart-wrapper[data-ratio="1:1"] [data-chart] {
    aspect-ratio: 1 / 1;
  }

  chart-wrapper[data-ratio="auto"] [data-chart] {
    aspect-ratio: auto;
    min-height: 16rem;
  }

  /* Make canvas/svg fill container */
  chart-wrapper [data-chart] canvas,
  chart-wrapper [data-chart] svg {
    width: 100% !important;
    height: 100% !important;
    display: block;
  }

  /* Legend */
  chart-wrapper [data-legend] {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-m);
    justify-content: center;
    padding-block-start: var(--size-m);
    border-block-start: 1px solid var(--border);
  }

  chart-wrapper [data-legend-item] {
    display: flex;
    align-items: center;
    gap: var(--size-2xs);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  chart-wrapper [data-legend-item]::before {
    content: "";
    width: 0.75rem;
    height: 0.75rem;
    border-radius: var(--radius-sm);
    background: var(--legend-color, var(--primary));
  }

  chart-wrapper [data-legend-item][data-color="primary"]::before {
    --legend-color: var(--primary, oklch(0.55 0.2 250));
  }

  chart-wrapper [data-legend-item][data-color="secondary"]::before {
    --legend-color: oklch(0.6 0.15 180);
  }

  chart-wrapper [data-legend-item][data-color="success"]::before {
    --legend-color: oklch(0.55 0.15 145);
  }

  chart-wrapper [data-legend-item][data-color="warning"]::before {
    --legend-color: oklch(0.7 0.15 85);
  }

  chart-wrapper [data-legend-item][data-color="error"]::before {
    --legend-color: oklch(0.55 0.2 25);
  }

  /* Footer */
  chart-wrapper [data-footer] {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--size-xs);
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  /* Size variants */
  chart-wrapper[data-size="compact"] {
    padding: var(--size-m);
  }

  chart-wrapper[data-size="compact"] [data-chart] {
    min-height: 8rem;
  }

  chart-wrapper[data-size="compact"] [data-title] {
    font-size: var(--text-base);
  }

  chart-wrapper[data-size="full"] {
    padding: var(--size-xl);
  }

  chart-wrapper[data-size="full"] [data-chart] {
    min-height: 20rem;
  }

  /* Loading state */
  chart-wrapper[data-loading] [data-chart] {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-alt);
  }

  chart-wrapper[data-loading] [data-chart]::after {
    content: "";
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: chart-spin 0.8s linear infinite;
  }

  @keyframes chart-spin {
    to { transform: rotate(360deg); }
  }

  /* Error state */
  chart-wrapper[data-error] [data-chart] {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--size-xs);
    background: oklch(0.98 0.02 25);
    color: var(--error);
  }

  chart-wrapper[data-error] [data-chart]::before {
    content: "⚠️";
    font-size: 2rem;
  }

  chart-wrapper[data-error] [data-chart]::after {
    content: attr(data-error-message);
    font-size: var(--text-sm);
  }

  /* Empty state */
  chart-wrapper[data-empty] [data-chart] {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--size-xs);
    background: var(--surface-alt);
    color: var(--text-muted);
  }

  chart-wrapper[data-empty] [data-chart]::before {
    content: "📊";
    font-size: 2rem;
    opacity: 0.5;
  }

  chart-wrapper[data-empty] [data-chart]::after {
    content: "No data available";
    font-size: var(--text-sm);
  }

  /* Print styles */
  @media print {
    chart-wrapper {
      break-inside: avoid;
      border: none;
      padding: 0;
    }

    chart-wrapper [data-chart] {
      min-height: auto;
    }
  }
}
```

## JavaScript Enhancement

```javascript
class ChartWrapper extends HTMLElement {
  connectedCallback() {
    this.chartArea = this.querySelector('[data-chart]');

    // Observe resize for responsive charts
    if (this.chartArea) {
      this.resizeObserver = new ResizeObserver(() => {
        this.dispatchEvent(new CustomEvent('resize', {
          detail: {
            width: this.chartArea.clientWidth,
            height: this.chartArea.clientHeight
          }
        }));
      });
      this.resizeObserver.observe(this.chartArea);
    }
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
  }

  setLoading(loading) {
    if (loading) {
      this.setAttribute('data-loading', '');
      this.removeAttribute('data-error');
      this.removeAttribute('data-empty');
    } else {
      this.removeAttribute('data-loading');
    }
  }

  setError(message) {
    this.removeAttribute('data-loading');
    this.removeAttribute('data-empty');
    this.setAttribute('data-error', '');
    this.chartArea.setAttribute('data-error-message', message || 'Failed to load chart');
  }

  setEmpty() {
    this.removeAttribute('data-loading');
    this.removeAttribute('data-error');
    this.setAttribute('data-empty', '');
  }

  // Helper to get accessible description
  getAccessibleLabel() {
    return this.chartArea?.getAttribute('aria-label') || '';
  }
}

customElements.define('chart-wrapper', ChartWrapper);
```

## Accessibility

- **Role**: Chart area has `role="img"` with `aria-label`
- **Alt Text**: Descriptive label explains the chart content
- **Data Table**: Consider providing an accessible data table alternative
- **Reduced Motion**: Respect `prefers-reduced-motion` for animations

## Examples

### Bar Chart

```html
<chart-wrapper data-ratio="16:9">
  <header data-header>
    <h3 data-title>Sales by Region</h3>
  </header>
  <div data-chart role="img" aria-label="Bar chart showing sales by region. North: $45K, South: $32K, East: $28K, West: $51K">
    <canvas id="sales-chart"></canvas>
  </div>
  <div data-legend>
    <span data-legend-item data-color="primary">Q1 2025</span>
  </div>
</chart-wrapper>
```

### Pie Chart (Square)

```html
<chart-wrapper data-ratio="1:1" data-size="compact">
  <header data-header>
    <h3 data-title>Traffic Sources</h3>
  </header>
  <div data-chart role="img" aria-label="Pie chart of traffic sources">
    <!-- Chart.js pie chart -->
  </div>
</chart-wrapper>
```

### Loading State

```html
<chart-wrapper data-loading data-ratio="16:9">
  <header data-header>
    <h3 data-title>Loading Chart...</h3>
  </header>
  <div data-chart></div>
</chart-wrapper>
```

### With Data Table Alternative

```html
<chart-wrapper data-ratio="4:3">
  <header data-header>
    <h3 data-title>Monthly Trends</h3>
  </header>
  <div data-chart role="img" aria-describedby="chart-data">
    <canvas></canvas>
  </div>
  <details>
    <summary>View data table</summary>
    <table id="chart-data">
      <thead>
        <tr><th>Month</th><th>Value</th></tr>
      </thead>
      <tbody>
        <tr><td>January</td><td>$12,500</td></tr>
        <!-- More rows -->
      </tbody>
    </table>
  </details>
</chart-wrapper>
```

## Related Patterns

- [stats](../content/stats.md)
- [card](../content/card.md)
- [data-table](./data-table.md)
