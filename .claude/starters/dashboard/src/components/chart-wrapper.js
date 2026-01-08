/**
 * Chart Wrapper
 * Lightweight chart component with canvas rendering
 * Note: For production, consider using Chart.js or similar
 */

class ChartWrapper extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'data', 'labels', 'title'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.canvas = null;
    this.ctx = null;
  }

  connectedCallback() {
    this.render();
    this.drawChart();
  }

  attributeChangedCallback() {
    if (this.canvas) {
      this.drawChart();
    }
  }

  get type() {
    return this.getAttribute('type') || 'bar';
  }

  get chartData() {
    try {
      return JSON.parse(this.getAttribute('data') || '[]');
    } catch {
      return [];
    }
  }

  get labels() {
    try {
      return JSON.parse(this.getAttribute('labels') || '[]');
    } catch {
      return [];
    }
  }

  get title() {
    return this.getAttribute('title') || '';
  }

  drawChart() {
    if (!this.ctx || this.chartData.length === 0) return;

    const canvas = this.canvas;
    const ctx = this.ctx;
    const width = canvas.width;
    const height = canvas.height;
    const data = this.chartData;
    const labels = this.labels;
    const padding = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get max value for scaling
    const maxValue = Math.max(...data) || 1;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw based on type
    if (this.type === 'bar') {
      this.drawBarChart(ctx, data, labels, maxValue, chartWidth, chartHeight, padding);
    } else if (this.type === 'line') {
      this.drawLineChart(ctx, data, labels, maxValue, chartWidth, chartHeight, padding);
    }
  }

  drawBarChart(ctx, data, labels, maxValue, chartWidth, chartHeight, padding) {
    const barWidth = chartWidth / data.length - 10;
    const primaryColor = getComputedStyle(this).getPropertyValue('--primary') || '#1e40af';

    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * (chartWidth / data.length) + 5;
      const y = padding + chartHeight - barHeight;

      // Draw bar
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw label
      if (labels[index]) {
        ctx.fillStyle = '#666';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth / 2, padding + chartHeight + 20);
      }
    });
  }

  drawLineChart(ctx, data, labels, maxValue, chartWidth, chartHeight, padding) {
    const primaryColor = getComputedStyle(this).getPropertyValue('--primary') || '#1e40af';
    const pointRadius = 4;

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = primaryColor;
    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw label
      if (labels[index]) {
        ctx.fillStyle = '#666';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x, padding + chartHeight + 20);
        ctx.fillStyle = primaryColor;
      }
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .chart-container {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e5e5e5);
          border-radius: var(--radius-lg, 0.5rem);
          padding: var(--space-4, 1rem);
        }

        .chart-title {
          font-size: var(--text-lg, 1.125rem);
          font-weight: var(--font-semibold, 600);
          margin-block-end: var(--space-4, 1rem);
        }

        canvas {
          inline-size: 100%;
          block-size: auto;
        }
      </style>

      <div class="chart-container">
        ${this.title ? `<h3 class="chart-title">${this.title}</h3>` : ''}
        <canvas width="400" height="200"></canvas>
      </div>
    `;

    this.canvas = this.shadowRoot.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
  }
}

customElements.define('chart-wrapper', ChartWrapper);
