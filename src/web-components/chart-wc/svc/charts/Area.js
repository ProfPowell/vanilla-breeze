import LineChart from './Line.js';
import {formatNumber} from '../utils/Utils.js';

/**
 * Area Chart
 * @extends LineChart
 * @example
 * const chart = new AreaChart({
 *   data: [
 *     { name: 'Downloads', values: [100, 200, 150, 300] },
 *   ],
 *   config: { title: { text: 'Weekly Downloads' } },
 * });
 * const svg = chart.toString();
 */
class AreaChart extends LineChart {
  /**
   * Returns the stringified name of the chart type
   * @return {string} The type of the chart
   */
  static get type() {
    return 'area';
  }

  /**
   * Returns the default object configuration for the chart type
   * @return {object} Returns the defaults objct
   */
  static get defaults() {
    return {
      plot: {
        area: {
          style: {
            'fill-opacity': 'var(--area-fill-opacity, 0.5)',
            'stroke-width': '2%',
            'stroke-linecap': 'round',
          },
        },
        node: {
          enabled: false,
          size: 4,
          active: {
            style: {
              'stroke-width': '0.5%',
            },
          },
        },
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
      'plot': {
        stroke: 'primary',
      },
      'plot.area': {
        fill: 'primary',
        stroke: 'secondary',
      },
    };
  }

  /**
   * Returns an array of CSS classes for the specific plot index
   * @param {number} index - the plot index
   * @return {array}
   */
  getPlotClass(index) {
    return ['plot', `plot-${index}`, 'plot-area', `plot-area-${index}`];
  }

  /**
   * Modifies the line plot to add a closing line. This allows for the "area plot" to be filled.
   * @param {array} values
   * @return {array} Array of svg path directions
   */
  createPlotLine(values) {
    // Close the line path to create an area fill
    const chartLinePath = super.createPlotLine(values);
    const stats = this.stats;

    // Find first non-null value for closing the area path
    const firstVal = values.find((v) => v != null);
    if (firstVal == null) return chartLinePath;

    const x = formatNumber((values.length - 1 - stats.x.min) * stats.x.scaleFactor);
    const y = formatNumber(stats.y.max * stats.y.scaleFactor);
    const firstY = formatNumber((stats.y.max - firstVal) * stats.y.scaleFactor);
    chartLinePath.push(`L ${x} ${y} L 0 ${y} L 0 ${firstY}`);
    return chartLinePath;
  }
}

export default AreaChart;
