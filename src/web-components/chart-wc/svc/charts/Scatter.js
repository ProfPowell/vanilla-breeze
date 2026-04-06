import Cartesian from './Cartesian.js';
import VElement from '../DOM/VElement.js';
import {escapeHtml} from '../utils/Utils.js';

/**
 * Scatter Chart
 * @example
 * const chart = new ScatterChart({
 *   data: [
 *     { name: 'Group A', values: [[1, 2], [3, 5], [6, 4]] },
 *   ],
 *   config: { title: { text: 'X vs Y' } },
 * });
 * const svg = chart.toString();
 */
class ScatterChart extends Cartesian {
  /**
   * Returns the stringified name of the chart type
   * @return {string} The type of the chart
   */
  static get type() {
    return 'scatter';
  }

  /**
   * Returns the default object configuration for the chart type
   * @return {object} Returns the defaults objct
   */
  static get defaults() {
    return {
      plot: {
        size: 4,
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
   * Callback function for mousehover events on the plot. Determines the location
   * of the tooltip along with the chart's data to be displayed as text.
   * @param {*} state
   * @param {*} instance
   * @param {*} chart
   * @return {Function} the tooltip location function
   */
  tooltipLocation(state, instance, chart) {
    return function tooltipLocation(e) {
      // Lazily build the spatial node map on first call
      if (!state.nodeMap) {
        state.nodeMap = createNodeMap(instance);
      }

      const info = {
        tooltip: {},
        crosshair: {},
      };

      const tooltipOffset = 1;
      let tooltipText = '';
      const target = instance.querySelector('chart-plot');
      const box = target.getBoundingClientRect();
      let xPercent = (((e.clientX - box.left)/ box.width));
      let yPercent = (((e.clientY - box.top)/ box.height));

      xPercent = Math.floor(xPercent * 100);
      yPercent = Math.floor(yPercent * 100);

      const xTens = Math.floor(xPercent/10);
      const xOnes = parseInt((xPercent/10).toFixed(1).split('.')[1]);
      const yTens = Math.floor(yPercent/10);

      // Search current cell and neighboring cells for improved hover tolerance
      var nodes = null;
      var searchOffsets = [[0,0], [-1,0], [1,0], [0,-1], [0,1]];
      for (var s = 0; s < searchOffsets.length; s++) {
        var sy = yTens + searchOffsets[s][0];
        var sx = xTens + searchOffsets[s][1];
        if (sy >= 0 && sy < 10 && sx >= 0 && sx < 10 && state.nodeMap[sy] && state.nodeMap[sy][sx]) {
          // Check exact ones position first, then any nodes in the cell
          var found = state.nodeMap[sy][sx][xOnes];
          if (!found) {
            // Check neighboring ones positions for tolerance
            for (var oi = Math.max(0, xOnes - 1); oi <= Math.min(9, xOnes + 1); oi++) {
              if (state.nodeMap[sy][sx][oi]) {
                found = state.nodeMap[sy][sx][oi];
                break;
              }
            }
          }
          if (found) {
            nodes = found;
            break;
          }
        }
      }

      if (!nodes) {
        return;
      }

      // Disable crosshair
      info.crosshair.x1 = -1;
      info.crosshair.x2 = -1;
      info.crosshair.y1 = -1;
      info.crosshair.y2 = -1;

      // Tooltip position — raw cursor position; clamping handled by tooltipInteraction
      info.tooltip.x = xPercent + tooltipOffset;
      info.tooltip.y = yPercent;
      nodes.forEach((node) => {
        const series = node.getAttribute('data-series');
        const index = node.getAttribute('data-index');
        const val = chart.data[series].values[index];
        const label = escapeHtml(
          chart.data[series].name || 'Series ' + series,
        );
        let content;
        if (chart.config.tooltip.format) {
          try {
            content = escapeHtml(
              String(chart.config.tooltip.format(label, val)),
            );
          } catch (e) {
            console.warn('SVC: tooltip.format threw an error:', e);
            content = escapeHtml(String(val));
          }
        } else {
          content = escapeHtml(String(val));
        }
        tooltipText += `<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${series}">${label}</span> : (${content})
        </div>`;
      });
      info.tooltip.text = tooltipText;
      return info;
    };
  }

  /**
  * Creates the plot and markers from the user provided data.
  * @param {object} data - the user supplied data
  * @param {object} stats - the computed constraints of the chart
  * @param {object} subchartNoStretch - the parent VElement container
  */
  createPlot({
    data,
    stats,
    subchartNoStretch,
  }) {
    data.forEach((series, index) => {
      const values = series.values;
      values.forEach((pair, nodeindex) => {
        const x = pair[0];
        const y = pair[1];
        const seriesName = series.name || `Series ${index + 1}`;
        const nodeCircle = new VElement('circle', {
          'cx': ((x - stats.x.min) * stats.x.scaleFactor).toFixed(3) + '%',
          'cy': ((stats.y.max - y) * stats.y.scaleFactor).toFixed(3) + '%',
          'r': this.config.plot.size,
          'class': ['plot-node', `plot-${index}`, `plot-node-${index}`],
          'data-index': nodeindex,
          'data-series': index,
          'role': 'graphics-symbol',
          'aria-roledescription': 'data point',
          'aria-label': `${seriesName}, (${x}, ${y})`,
        });
        subchartNoStretch.appendChild(nodeCircle);
      });
    });
  }
}

/**
 * Creates a fuzzy region map for mouse over events to detect nearby nodes.
 * @param {Element} instance - the chart container
 * @return {Array} A 3D array of nodes in proximity
 */
function createNodeMap(instance) {
  const nodeMap = Array.from(new Array(10)).map(() => Array.from(new Array(10)).map(() => []));
  instance.querySelectorAll('.svc-plot-node').forEach((node) => {
    const series = parseInt(node.getAttribute('data-series'), 10);
    const x = parseInt(node.getAttribute('cx'));
    const y = parseInt(node.getAttribute('cy'));
    const xTens = Math.min(9, Math.floor(x / 10));
    const xOnes = parseInt((x / 10).toFixed(1).split('.')[1]);
    const yTens = Math.min(9, Math.floor(y / 10));
    nodeMap[yTens][xTens][xOnes] = nodeMap[yTens][xTens][xOnes] || [];
    nodeMap[yTens][xTens][xOnes][series] = node;
  });
  return nodeMap;
}

export default ScatterChart;
