/**
 * Vanilla Breeze Charts - JavaScript Helpers
 *
 * Provides utilities for:
 * - Creating charts from JSON data
 * - Generating pie chart gradients
 * - Auto-generating legends
 * - Enhanced tooltips
 * - Dynamic data updates
 */

export const charts = {
  /**
   * Create chart from data array
   * @param {Object} options - Chart configuration
   * @param {string|Element} options.container - CSS selector or DOM element
   * @param {string} options.type - Chart type (bar, column, line, area, pie)
   * @param {string} options.caption - Chart title
   * @param {Array} options.data - Data array [{label, value, displayValue?, series?}]
   * @param {Object} options.modifiers - Optional modifiers {labels, legend, tooltip, gap, size}
   * @returns {HTMLTableElement|null} The created chart element
   */
  create({ container, type = 'bar', caption, data, modifiers = {} }) {
    const target = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!target) {
      console.warn('[VB Charts] Container not found:', container);
      return null;
    }

    // Redirect pie charts to specialized method
    if (type === 'pie') {
      return this.createPie({ container: target, caption, data, modifiers });
    }

    const table = document.createElement('table');
    table.className = 'vb-chart';
    table.dataset.type = type;

    // Apply modifiers
    if (modifiers.labels) table.dataset.labels = '';
    if (modifiers.tooltip) table.dataset.tooltip = '';
    if (modifiers.gap) table.dataset.gap = modifiers.gap;
    if (modifiers.size) table.dataset.size = modifiers.size;
    if (modifiers.axes) table.dataset.axes = modifiers.axes;
    if (modifiers.stacked) table.dataset.stacked = '';
    if (modifiers.grouped) table.dataset.grouped = '';
    if (modifiers.grid) table.dataset.grid = '';

    // Caption
    if (caption) {
      const cap = document.createElement('caption');
      cap.textContent = caption;
      table.appendChild(cap);
    }

    // Body
    const tbody = document.createElement('tbody');
    const maxValue = Math.max(...data.map(d => d.value));

    data.forEach((item) => {
      const tr = document.createElement('tr');

      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = item.label;

      const td = document.createElement('td');
      const normalizedValue = maxValue > 0 ? item.value / maxValue : 0;
      td.style.setProperty('--value', normalizedValue.toFixed(4));
      td.textContent = item.displayValue ?? item.value;

      if (item.series) td.dataset.series = item.series;

      if (modifiers.labels) {
        td.dataset.label = item.displayValue ?? item.value;
      }

      if (modifiers.tooltip) {
        td.dataset.tooltip = `${item.label}: ${item.displayValue ?? item.value}`;
        td.tabIndex = 0; // Make focusable for keyboard users
      }

      tr.appendChild(th);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    target.appendChild(table);

    // Generate legend if series data provided
    if (modifiers.legend && modifiers.series) {
      this.generateLegend(target, modifiers.series);
    }

    return table;
  },

  /**
   * Create pie chart with calculated conic-gradient segments
   * @param {Object} options - Chart configuration
   * @returns {HTMLTableElement|null} The created chart element
   */
  createPie({ container, caption, data, modifiers = {} }) {
    const target = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!target) {
      console.warn('[VB Charts] Container not found:', container);
      return null;
    }

    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) {
      console.warn('[VB Charts] Pie chart total is zero');
      return null;
    }

    const table = document.createElement('table');
    table.className = 'vb-chart';
    table.dataset.type = 'pie';

    if (modifiers.size) table.dataset.size = modifiers.size;
    if (modifiers.donut) table.dataset.donut = '';
    if (modifiers.half) table.dataset.half = '';

    if (caption) {
      const cap = document.createElement('caption');
      cap.textContent = caption;
      table.appendChild(cap);
    }

    const tbody = document.createElement('tbody');
    let startAngle = 0;

    // Build conic-gradient stops
    const gradientStops = [];

    data.forEach((item, index) => {
      const percentage = item.value / total;
      const endAngle = startAngle + percentage;
      const seriesNum = index + 1;
      const color = `var(--chart-series-${seriesNum})`;

      gradientStops.push(
        `${color} ${(startAngle * 360).toFixed(2)}deg ${(endAngle * 360).toFixed(2)}deg`
      );

      // Create accessible row (visually hidden but readable)
      const tr = document.createElement('tr');

      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = item.label;

      const td = document.createElement('td');
      td.style.setProperty('--value', percentage.toFixed(4));
      td.style.setProperty('--start', startAngle.toFixed(4));
      td.textContent = item.displayValue ?? `${Math.round(percentage * 100)}%`;
      td.dataset.series = seriesNum;

      tr.appendChild(th);
      tr.appendChild(td);
      tbody.appendChild(tr);

      startAngle = endAngle;
    });

    // Apply conic-gradient to tbody
    tbody.style.background = `conic-gradient(${gradientStops.join(', ')})`;
    table.appendChild(tbody);
    target.appendChild(table);

    // Auto-generate legend for pie charts (unless explicitly disabled)
    if (modifiers.legend !== false) {
      this.generateLegend(target, data.map((d, i) => ({
        label: d.label,
        series: i + 1
      })));
    }

    return table;
  },

  /**
   * Generate legend element for chart
   * @param {Element} container - Container to append legend to
   * @param {Array} series - Array of {label, series} objects
   * @returns {HTMLDivElement} The created legend element
   */
  generateLegend(container, series) {
    const target = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!target) return null;

    const legend = document.createElement('div');
    legend.className = 'vb-chart-legend';

    series.forEach(item => {
      const legendItem = document.createElement('span');
      legendItem.className = 'vb-chart-legend-item';
      legendItem.dataset.series = item.series;
      legendItem.textContent = item.label;
      legend.appendChild(legendItem);
    });

    target.appendChild(legend);
    return legend;
  },

  /**
   * Enable tooltips on existing chart
   * @param {string|Element} chartSelector - Chart selector or element
   */
  enableTooltips(chartSelector) {
    const chart = typeof chartSelector === 'string'
      ? document.querySelector(chartSelector)
      : chartSelector;

    if (!chart) return;

    chart.dataset.tooltip = '';

    chart.querySelectorAll('td').forEach(td => {
      const th = td.closest('tr')?.querySelector('th');
      const label = th?.textContent || '';
      const value = td.textContent;
      td.dataset.tooltip = label ? `${label}: ${value}` : value;
      td.tabIndex = 0;
    });
  },

  /**
   * Update chart data dynamically
   * @param {string|Element} chartSelector - Chart selector or element
   * @param {Array} newData - New data array [{label?, value, displayValue?}]
   */
  update(chartSelector, newData) {
    const chart = typeof chartSelector === 'string'
      ? document.querySelector(chartSelector)
      : chartSelector;

    if (!chart) return;

    const type = chart.dataset.type;
    const maxValue = Math.max(...newData.map(d => d.value));
    const rows = chart.querySelectorAll('tbody tr');

    if (type === 'pie') {
      // Rebuild pie chart gradient
      const total = newData.reduce((sum, d) => sum + d.value, 0);
      let startAngle = 0;
      const gradientStops = [];

      rows.forEach((row, index) => {
        if (newData[index]) {
          const td = row.querySelector('td');
          const th = row.querySelector('th');
          const item = newData[index];
          const percentage = item.value / total;
          const endAngle = startAngle + percentage;
          const seriesNum = index + 1;

          gradientStops.push(
            `var(--chart-series-${seriesNum}) ${(startAngle * 360).toFixed(2)}deg ${(endAngle * 360).toFixed(2)}deg`
          );

          td.style.setProperty('--value', percentage.toFixed(4));
          td.style.setProperty('--start', startAngle.toFixed(4));
          td.textContent = item.displayValue ?? `${Math.round(percentage * 100)}%`;

          if (item.label && th) {
            th.textContent = item.label;
          }

          startAngle = endAngle;
        }
      });

      const tbody = chart.querySelector('tbody');
      if (tbody) {
        tbody.style.background = `conic-gradient(${gradientStops.join(', ')})`;
      }
    } else {
      // Update bar/column/line/area charts
      rows.forEach((row, index) => {
        if (newData[index]) {
          const td = row.querySelector('td');
          const th = row.querySelector('th');
          const item = newData[index];
          const normalizedValue = maxValue > 0 ? item.value / maxValue : 0;

          td.style.setProperty('--value', normalizedValue.toFixed(4));
          td.textContent = item.displayValue ?? item.value;

          if (td.dataset.label !== undefined) {
            td.dataset.label = item.displayValue ?? item.value;
          }

          if (td.dataset.tooltip !== undefined) {
            const label = item.label ?? th?.textContent ?? '';
            td.dataset.tooltip = `${label}: ${item.displayValue ?? item.value}`;
          }

          if (item.label && th) {
            th.textContent = item.label;
          }
        }
      });
    }
  },

  /**
   * Create animated entry effect
   * @param {string|Element} chartSelector - Chart selector or element
   * @param {Object} options - Animation options {duration, delay, stagger}
   */
  animate(chartSelector, options = {}) {
    const chart = typeof chartSelector === 'string'
      ? document.querySelector(chartSelector)
      : chartSelector;

    if (!chart) return;

    const {
      duration = 600,
      delay = 0,
      stagger = 50
    } = options;

    const cells = chart.querySelectorAll('td');

    // Store original values
    const originalValues = Array.from(cells).map(td =>
      td.style.getPropertyValue('--value')
    );

    // Set to zero
    cells.forEach(td => td.style.setProperty('--value', '0'));

    // Animate to actual values
    setTimeout(() => {
      cells.forEach((td, index) => {
        setTimeout(() => {
          td.style.setProperty('--value', originalValues[index]);
        }, index * stagger);
      });
    }, delay);
  },

  /**
   * Observe chart for viewport entry and animate
   * @param {string|Element} chartSelector - Chart selector or element
   * @param {Object} options - IntersectionObserver options
   */
  animateOnScroll(chartSelector, options = {}) {
    const chart = typeof chartSelector === 'string'
      ? document.querySelector(chartSelector)
      : chartSelector;

    if (!chart || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animate(entry.target, options);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: options.threshold ?? 0.2,
      rootMargin: options.rootMargin ?? '0px'
    });

    observer.observe(chart);
  }
};

// Expose globally for non-module usage
if (typeof window !== 'undefined') {
  window.VanillaBreeze = window.VanillaBreeze || {};
  window.VanillaBreeze.charts = charts;
}

export default charts;
