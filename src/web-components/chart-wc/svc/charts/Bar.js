import ColumnChart from './Column.js';
import {escapeHtml} from '../utils/Utils.js';

/**
 * Bar Chart
 * @extends ColumnChart
 * @example
 * const chart = new BarChart({
 *   data: [
 *     { name: 'Regions', values: { East: 40, West: 60, North: 30 } },
 *   ],
 *   config: { title: { text: 'Sales by Region' } },
 * });
 * const svg = chart.toString();
 */
class BarChart extends ColumnChart {
  /**
   * Returns the stringified name of the chart type
   * @return {string} The type of the chart
   */
  static get type() {
    return 'bar';
  }
  /**
   * Returns the default object configuration for the chart type
   * @return {object} Returns the defaults objct
   */
  static get defaults() {
    return {
      plot: {
        vertical: false,
      },
    };
  }

  /**
   * Callback function for mousehover events on the plot. Determines the location
   * of the tooltip along with the chart's data to be displayed as text.
   * @param {*} state
   * @param {*} instance
   * @param {*} chart
   * @return {object} the tooltip info object
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
      let yPercent = (((e.clientY - box.top)/ box.height));
      if (stats.associative) {
        yPercent = 1 - yPercent;
      }

      const index = (stats.y.scaleLength-1) - Math.floor(yPercent * stats.y.scaleLength);

      let percentTotal = 0;
      let percentCount = 0;
      const dataset = chart.data;
      let key;
      if (stats.associative) {
        if (chart.config.plot.vertical) {
          key = stats.x.keys[index];
        } else {
          key = stats.y.keys[index];
        }
      }
      dataset.forEach(function(series) {
        if (stats.associative && series.values[key] != null) {
          percentTotal += series.values[key];
          percentCount++;
        } else if (!stats.associative && series.values[index] != null) {
          percentTotal += series.values[index];
          percentCount++;
        }
      });

      let xPercent = percentTotal/percentCount * stats.x.scaleFactor;
      if (isNaN(xPercent)) {
        xPercent = stats.x.max * stats.x.scaleFactor;
      }
      const xPos = xPercent.toFixed(2);
      let yPos = (100 * yPercent.toFixed(2));

      if (isNaN(xPos) || isNaN(yPos) || index < 0 || index >= stats.x.scaleLength) {
        return null;
      }

      // Associative tooltip positions
      if (stats.associative) {
        yPos = 100 - yPos;
      }
      // No crosshair line for bar charts — position off-screen
      info.crosshair.x1 = -10;
      info.crosshair.x2 = -10;
      info.crosshair.y1 = -10;
      info.crosshair.y2 = -10;


      // Tooltip position — raw data position; clamping handled by tooltipInteraction
      info.tooltip.x = xPos + tooltipOffset;
      info.tooltip.y = yPos + tooltipOffset;

      dataset.forEach(function(series, i) {
        const name = escapeHtml((series.name) ? series.name : 'Series ' + i);
        if (state.toggles[i] !== false) {
          let content;
          const val = stats.associative ? chart.data[i].values[key] : chart.data[i].values[index];
          const lbl = stats.associative ? key : index;
          if (chart.config.tooltip.format) {
            try {
              content = escapeHtml(String(chart.config.tooltip.format(lbl, val)));
            } catch (e) {
              console.warn('SVC: tooltip.format threw an error:', e);
              content = `(${escapeHtml(String(lbl))} : ${escapeHtml(String(val))})`;
            }
          } else {
            content = `(${escapeHtml(String(lbl))} : ${escapeHtml(String(val))})`;
          }
          tooltipText += `<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${i}">${name}</span> : ${content}
          </div>`;
        }
      });
      info.tooltip.text = tooltipText;
      info.index = index;

      return info;
    };
  }
}

export default BarChart;
