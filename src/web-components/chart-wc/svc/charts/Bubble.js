import { VElement } from '../DOM/VElement.js';
import { ScatterChart } from './Scatter.js';
import {BUBBLE_SIZE_DIVISOR, BUBBLE_DEFAULT_OPACITY} from '../constants.js';

/**
 * Bubble Chart
 * @extends ScatterChart
 * @example
 * const chart = new BubbleChart({
 *   data: [
 *     { name: 'Products', values: [[1, 2, 10], [3, 5, 20], [6, 4, 15]] },
 *   ],
 *   config: { title: { text: 'Sales Bubbles' } },
 * });
 * const svg = chart.toString();
 */
class BubbleChart extends ScatterChart {
  /**
   * Returns the stringified name of the chart type
   * @return {string} The type of the chart
   */
  static get type() {
    return 'bubble';
  }

  /**
   * Returns the default object configuration for the chart type
   * @return {object} Returns the defaults objct
   */
  static get defaults() {
    return {
      plot: {
        maxSize: 4,
        node: {},
      },
    };
  }

  /**
   * Return the specifications object for the chart. Used to apply styling
   * such as fills and strokes to different parts of the SVG
   * @return {object}
   */
  static specs() {
    return {
      'plot.node': {
        fill: 'primary',
      },
    };
  }

  /**
   * Creates the plot of the chart by creating an SVG shape for every plot node.
   * @param {object} obj
   * @param {object} obj.data - The user supplied data
   * @param {object} obj.stats
   * @param {object} [obj.subchartStretch]
   * @param {object} obj.subchartNoStretch
   */
  createPlot({
    data,
    stats,
    subchartStretch: _subchartStretch,
    subchartNoStretch,
  }) {
    data.forEach((series, index) => {
      const values = series.values;
      values.forEach((triple, nodeindex) => {
        const x = triple[0];
        const y = triple[1];
        const size = triple[2];

        const seriesName = series.name || `Series ${index + 1}`;
        // Normalize size against the dataset's size range (stats.alt)
        const sizeRange = stats.alt.max - stats.alt.min || 1;
        const normalizedSize = (Math.abs(size) - stats.alt.min) / sizeRange;
        const nodeCircle = new VElement('circle', {
          'cx': ((x - stats.x.min) * stats.x.scaleFactor).toFixed(3) + '%',
          'cy': ((stats.y.max - y) * stats.y.scaleFactor).toFixed(3) + '%',
          'r': (normalizedSize * this.config.plot.maxSize + 0.5) + '%',
          'style': `opacity: ${BUBBLE_DEFAULT_OPACITY}`,
          'class': ['plot-node', `plot-${index}`, `plot-node-${index}`],
          'data-index': nodeindex,
          'data-series': index,
          'role': 'graphics-symbol',
          'aria-roledescription': 'data point',
          'aria-label': `${seriesName}, (${x}, ${y}), size: ${size}`,
        });

        subchartNoStretch.appendChild(nodeCircle);
      });
    });
  }
}

export { BubbleChart };
