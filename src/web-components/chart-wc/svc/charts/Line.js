import Cartesian from './Cartesian.js';
import VElement from '../DOM/VElement.js';
import * as Util from '../utils/Utils.js';
import {escapeHtml} from '../utils/Utils.js';
import {CURVE_TENSION, CURVE_SMOOTHNESS} from '../constants.js';

/**
 * Line Chart
 * @example
 * const chart = new LineChart({
 *   data: [
 *     { name: 'Sales', values: [10, 40, 30, 50] },
 *     { name: 'Costs', values: [5, 25, 15, 35] },
 *   ],
 *   config: { title: { text: 'Revenue vs Costs' } },
 * });
 * const svg = chart.toString();
 */
class LineChart extends Cartesian {
  /**
   * Returns the stringified name of the chart type
   * @return {string} The type of the chart
   */
  static get type() {
    return 'line';
  }

  /**
   * Returns the default object configuration for the chart type
   * @return {object} Returns the defaults objct
   */
  static get defaults() {
    return {
      plot: {
        style: {
          'fill': 'none',
          'vector-effect': 'non-scaling-stroke',
        },
        node: {
          type: 'open',
          size: 4,
          style: {
            'stroke-width': '0.2%', // Stroke-width should be larger if the type is open.
            'stroke-linecap': 'round',
          },
          active: {
            style: {
              'stroke-width': '0.5%',
              'stroke-linecap': 'round',
            },
          },
        },
      },
    };
  }

  /**
   * Return the specifications object for the chart. Used to apply styling
   * such as fills and strokes to different parts of the SVG
   * @param {object} config - the configuration object, used to determine plot node styling
   * @return {object}
   */
  static specs(config) {
    const specs = {
      // Plot lines
      'plot': {
        stroke: 'primary',
      },

      // Active plot nodes
      'plot.node.active': {
        fill: 'secondary',
        stroke: 'secondary',
      },
    };

    if (config.plot.node.enabled) {
      specs['plot.node'] = {
        stroke: 'primary',
      };
      if (config.plot.node.type == 'closed') {
        specs['plot.node'].fill = 'primary';
      } else {
        specs['plot.node'].fill = '#FFF';
      }
    }
    return specs;
  }

  /**
   * Returns an array of CSS classes for the specific plot index
   * @param {number} index - the plot index
   * @return {array}
   */
  getPlotClass(index) {
    return ['plot', `plot-${index}`];
  }

  /**
  * Creates the plot line from the user provided data.
  * @param {object} values - the user supplied data
  * @return {array} - An array of line paths
  */
  createPlotLine(values) {
    const stats = this.stats;
    // Create the paths of each line, drawing cardinal splines for smoothing.
    // Null values create gaps (path breaks) in the line.
    const chartLinePath = [];
    const f = CURVE_TENSION;
    const t = CURVE_SMOOTHNESS;
    let m = 0;

    let dx1 = 0;
    let dy1 = 0;
    let dx2;
    let dy2;
    let previous = null;

    for (let i = 0; i < values.length; i++) {
      if (values[i] == null) {
        // Gap: reset state for next segment
        previous = null;
        dx1 = 0;
        dy1 = 0;
        continue;
      }

      const current = {
        x: Util.formatNumber((i - stats.x.min) * stats.x.scaleFactor),
        y: Util.formatNumber((stats.y.max - values[i]) * stats.y.scaleFactor),
      };

      if (!previous) {
        // Start of a new segment
        chartLinePath.push(`M ${current.x} ${current.y}`);
        previous = current;
        continue;
      }

      // Find next non-null value for curve tangent calculation
      let next = null;
      for (let j = i + 1; j < values.length; j++) {
        if (values[j] != null) {
          next = {
            x: Util.formatNumber((j - stats.x.min) * stats.x.scaleFactor),
            y: Util.formatNumber((stats.y.max - values[j]) * stats.y.scaleFactor),
          };
          break;
        }
      }

      if (!next) {
        dx2 = dy2 = 0;
      } else {
        // Calculate curves based off of f, m, and t.
        m = (next.y - previous.y) / (next.x - previous.x);
        dx2 = (next.x - current.x) * -f;
        dy2 = dx2 * m * t;
      }
      const cp1x = Util.formatNumber(previous.x - dx1);
      const cp1y = Util.formatNumber(previous.y - dy1);
      const cp2x = Util.formatNumber(current.x + dx2);
      const cp2y = Util.formatNumber(current.y + dy2);
      chartLinePath.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`);

      dx1 = dx2;
      dy1 = dy2;
      previous = current;
    }
    return chartLinePath;
  }

  /**
  * Creates the plot and markers from the user provided data.
  * @param {object} data - the user supplied data
  * @param {object} stats - the computed constraints of the chart
  * @param {object} subchartStretch - the parent VElement container
  */
  createPlot({
    data,
    stats,
    subchartStretch,
    subchartNoStretch,
  }) {
    this.stats = stats;
    data.forEach((series, index) => {
      // Normalize associative data ({key: val}) to ordered array using stats.x.keys
      const values = Array.isArray(series.values)
        ? series.values
        : stats.x.keys.map((key) => series.values[key] ?? null);
      const chartLineOptions = {
        'class': this.getPlotClass(index),
        'plot': index,
      };
      if (this.constructor.type === 'line') {
        chartLineOptions.fill = 'none';
      }
      const chartLine = new VElement('path', chartLineOptions);
      subchartStretch.appendChild(chartLine);

      const chartLinePath = this.createPlotLine(values);

      chartLine.setAttribute('d', chartLinePath.join(' '));


      values.forEach((value, nodeindex) => {
        // Skip null values (gaps in associative data)
        if (value == null) return;

        // Plot Nodes
        if (this.config.plot.node.enabled) {
          const x = Util.formatNumber((nodeindex - stats.x.min) * stats.x.scaleFactor) + '%';
          const y = Util.formatNumber((stats.y.max - value) * stats.y.scaleFactor) + '%';
          const seriesName = series.name || `Series ${index + 1}`;
          const label = stats.associative && stats.x.keys
            ? stats.x.keys[nodeindex] || nodeindex
            : nodeindex;
          const nodeCircle = new VElement('circle', {
            cx: x,
            cy: y,
            r: this.config.plot.node.size,
            class: ['plot-node', `plot-node-${index}`],
            node: nodeindex,
            plot: index,
            'role': 'graphics-symbol',
            'aria-roledescription': 'data point',
            'aria-label': `${seriesName}, ${label}: ${value}`,
          });
          subchartNoStretch.appendChild(nodeCircle);
        }

        // Plot Node Labels
        if (this.config.plot.node.label.enabled) {
          const textNode = new VElement('text', {
            x: Util.formatNumber((nodeindex - stats.x.min) * stats.x.scaleFactor) + '%',
            y: Util.formatNumber((stats.y.max - value) * stats.y.scaleFactor) + '%',
            fill: 'black',
            class: ['plot-node-label', `plot-node-label-${index}`],
          });
          textNode.innerHTML = value;
          subchartNoStretch.appendChild(textNode);
        }
      });
    });
  }


  /**
   * Computes where the tooltip needs to be placed
   * @param {*} state
   * @param {*} instance
   * @param {*} chart
   * @return {object} Tooltip Object
   */
  tooltipLocation(state, instance, chart) {
    return function tooltipLocation(e) {
      const info = {
        tooltip: {},
        crosshair: {},
      };

      const tooltipOffset = 1;
      let tooltipText = '';
      const stats = chart.stats;
      const target = instance.querySelector('chart-plot');
      const box = target.getBoundingClientRect();
      const xPercent = (((e.clientX - box.left)/ box.width));
      const index = Math.floor(xPercent * stats.x.scaleLength);

      let percentTotal = 0;
      let percentCount = 0;
      const dataset = chart.data;
      // For associative data, map numeric index to key
      const key = stats.associative ? stats.x.keys[index] : index;
      dataset.forEach(function(series) {
        const val = stats.associative ? series.values[key] : series.values[index];
        if (val != null) {
          percentTotal += val;
          percentCount++;
        }
      });

      let yPercent = (stats.y.max - (percentTotal/percentCount)) * stats.y.scaleFactor;
      if (isNaN(yPercent)) {
        yPercent = stats.y.max * stats.y.scaleFactor;
      }
      const xPos = (stats.x.scaleFactor * index);
      const yPos = yPercent.toFixed(2);

      if (isNaN(xPos) || isNaN(yPos) || index < 0 || index >= stats.x.scaleLength) {
        return null;
      }
      info.crosshair.x1 = xPos;
      info.crosshair.x2 = xPos;
      info.crosshair.y1 = 0;
      info.crosshair.y2 = 100;

      // Tooltip position — raw data position; clamping handled by tooltipInteraction
      info.tooltip.x = xPos + tooltipOffset;
      info.tooltip.y = yPos;

      dataset.forEach(function(series, i) {
        const name = escapeHtml((series.name) ? series.name : 'Series ' + i);
        const val = stats.associative ? chart.data[i].values[key] : chart.data[i].values[index];
        const label = stats.associative ? key : index;
        let content;
        if (chart.config.tooltip.format) {
          try {
            content = escapeHtml(String(chart.config.tooltip.format(label, val)));
          } catch (e) {
            console.warn('SVC: tooltip.format threw an error:', e);
            content = `(${escapeHtml(String(label))} : ${escapeHtml(String(val))})`;
          }
        } else {
          content = `(${escapeHtml(String(label))} : ${escapeHtml(String(val))})`;
        }
        if (state.toggles[i] !== false) {
          tooltipText += `<div class="svc-tooltip-content">
            <span class="svc-tooltip-label-title svc-tooltip-label-title-${i}">${name}</span> :
            ${content}
          </div>`;
        }
      });
      info.tooltip.text = tooltipText;
      info.index = index;

      return info;
    };
  }
}

export default LineChart;
