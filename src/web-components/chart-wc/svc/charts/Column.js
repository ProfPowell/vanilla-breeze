import Cartesian from './Cartesian.js';
import VElement from '../DOM/VElement.js';
import {escapeHtml} from '../utils/Utils.js';

/**
 * Column Chart
 * @example
 * const chart = new ColumnChart({
 *   data: [
 *     { name: 'Q1', values: [20, 35, 50] },
 *   ],
 *   config: { title: { text: 'Quarterly Results' } },
 * });
 * const svg = chart.toString();
 */
class ColumnChart extends Cartesian {
  /**
   * Returns the stringified name of the chart type
   * @return {string} The type of the chart
   */
  static get type() {
    return 'column';
  }

  /**
   * Returns the default object configuration for the chart type
   * @return {object} Returns the defaults objct
   */
  static get defaults() {
    return {
      plot: {
        vertical: true,
        stacked: false,
        // units (as a percentage)
        spacing: 10,
        label: {
          enabled: false,
          format: null,
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
      // Bars
      'plot.node': {
        fill: 'primary',
      },
    };
  }

  /**
  * Creates the plot from the user provided data.
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
    let min;
    let max;

    const barSpacing = this.config.plot.spacing / 100;
    const scaleY = stats.y.scaleFactor;
    const scaleX = stats.x.scaleFactor;

    // Setup the plot object to be used in the tooltip
    stats.plot = {};

    if (this.config.plot.vertical) {
      min = stats.y.min;
      max = stats.y.max;
      stats.plot.vertical = true;
    } else {
      min = stats.x.min;
      max = stats.x.max;
      stats.plot.vertical = false;
    }

    stats.plot.barSpacing = this.config.plot.spacing / 100;

    const intervalLength = Math.abs(max - min);
    const distanceToZero = Math.abs(min);
    const originPoint = (distanceToZero / intervalLength) * 100;

    // Stacked mode — all four cases handled separately
    if (this.config.plot.stacked) {
      this._createStackedPlot({
        data, stats, subchartStretch,
        scaleX, scaleY, barSpacing, originPoint,
      });
      return;
    }

    // Test for key/value plots
    if (!Array.isArray(data[0].values)) {
      if (this.config.plot.vertical) {
        // Width of the bar
        const width = (scaleX / data.length);

        // Width of bar - barSpacing
        const adjustedWidth = width * (1 - (barSpacing * 2));

        stats.x.keys.forEach((key, index) => {
          data.forEach((series, plotindex) => {
            if (series.type === 'line') return;
            if (series.values[key] != null) {
              let y;
              const value = series.values[key];
              if (value > 0) {
                y = (stats.y.max - value) * scaleY + '%';
              } else {
                y = (100 - originPoint).toFixed(3) + '%';
              }

              // X position
              let x = (scaleX * index);
              x += (width * plotindex);

              // Adjusted position w/ bar spacing
              x += (width * barSpacing);

              subchartStretch.appendChild(
                  new VElement('rect', {
                    'class': ['plot', `plot-${plotindex}`, `plot-node-${plotindex}`],
                    'index': index,
                    'plot': plotindex,
                    'data-series': plotindex,
                    'data-key': key,
                    'data-value': value,
                    'height': Math.abs(value) * scaleY,
                    'x': x + '%',
                    'width': adjustedWidth + '%',
                    y,
                    'role': 'graphics-symbol',
                    'aria-roledescription': 'data point',
                    'aria-label': `${series.name || 'Series ' + (plotindex + 1)}, ${key}: ${value}`,
                  }),
              );
            }
          });
        });
      } else {
        // Height of the bar
        const height = scaleY / data.length;
        const adjustedHeight = height * (1 - (barSpacing * 2));
        const revKeys = stats.y.keys.slice().reverse();
        revKeys.forEach((key, index) => {
          data.forEach((series, plotindex) => {
            if (series.type === 'line') return;
            if (series.values[key] != null) {
              const value = series.values[key];
              let x;
              const width = Math.abs(value) * scaleX;
              if (value > 0) {
                x = originPoint.toFixed(3) + '%';
              } else {
                x = originPoint.toFixed(3) - width + '%';
              }

              // Y position
              let y = 100 - (scaleY * (index + 1));
              y += (height * plotindex);

              // Adjusted position w/ bar spacing
              y += (height * barSpacing);

              subchartStretch.appendChild(
                  new VElement('rect', {
                    'class': ['plot', `plot-${plotindex}`, `plot-node-${plotindex}`],
                    'index': index,
                    'plot': plotindex,
                    'data-series': plotindex,
                    'data-key': key,
                    'data-value': value,
                    'y': y + '%',
                    'width': width + '%',
                    'height': adjustedHeight + '%',
                    x,
                    'role': 'graphics-symbol',
                    'aria-roledescription': 'data point',
                    'aria-label': `${series.name || 'Series ' + (plotindex + 1)}, ${key}: ${value}`,
                  }),
              );
            }
          });
        });
      }
    } else {
      if (this.config.plot.vertical) {
        // Width of the bar, dependant upon the number of series
        const width = (scaleX / data.length);

        // Width of bar - barSpacing
        const adjustedWidth = width * (1 - (barSpacing * 2));
        data.forEach((series, plotindex) => {
          if (series.type === 'line') return;
          series.values.forEach((value, index) => {
            let y;
            if (value > 0) {
              y = (stats.y.max - value) * scaleY + '%';
            } else {
              y = (100 - originPoint).toFixed(3) + '%';
            }

            // X position
            let x = (scaleX * index);
            x += (width * plotindex);

            // Adjusted position w/ bar spacing
            x += (width * barSpacing);

            subchartStretch.appendChild(
                new VElement('rect', {
                  'class': ['plot', `plot-${plotindex}`, `plot-node-${plotindex}`],
                  'index': index,
                  'plot': plotindex,
                  'data-series': plotindex,
                  'data-index': index,
                  'data-value': value,
                  'height': Math.abs(value) * scaleY,
                  'x': x + '%',
                  'width': adjustedWidth + '%',
                  y,
                  'role': 'graphics-symbol',
                  'aria-roledescription': 'data point',
                  'aria-label': `${series.name || 'Series ' + (plotindex + 1)}, ${index}: ${value}`,
                }),
            );
          });
        });
      } else {
        const height = scaleY / data.length;
        const adjustedHeight = height * (1 - (barSpacing * 2));

        data.forEach((series, plotindex) => {
          if (series.type === 'line') return;
          series.values.forEach((value, index) => {
            let x;
            const width = Math.abs(value) * scaleX;
            if (value > 0) {
              x = originPoint.toFixed(3) + '%';
            } else {
              x = originPoint.toFixed(3) - width + '%';
            }

            // Y position
            let y = 100 - (scaleY * (index + 1));
            y += (height * plotindex);

            // Adjusted position w/ bar spacing
            y += (height * barSpacing);

            subchartStretch.appendChild(
                new VElement('rect', {
                  'class': ['plot', `plot-${plotindex}`, `plot-node-${plotindex}`],
                  'index': index,
                  'plot': plotindex,
                  'data-series': plotindex,
                  'data-index': index,
                  'data-value': value,
                  'y': y + '%',
                  'width': width + '%',
                  'height': adjustedHeight + '%',
                  x,
                  'role': 'graphics-symbol',
                  'aria-roledescription': 'data point',
                  'aria-label': `${series.name || 'Series ' + (plotindex + 1)}, ${index}: ${value}`,
                }),
            );
          });
        });
      }
    }

    // Overlay line-type series on top of bars
    this._renderLineSeries({
      data, stats, subchartStretch, subchartNoStretch,
    });

    // Data labels above bars
    if (this.config.plot.label.enabled) {
      this._renderDataLabels({
        data, stats, subchartNoStretch,
        scaleX, scaleY, barSpacing,
      });
    }
  }

  /**
   * Renders value labels above/beside each bar.
   * @param {Object} opts
   */
  _renderDataLabels({data, stats, subchartNoStretch, scaleX, scaleY, barSpacing}) {
    if (!subchartNoStretch) return;
    const isAssociative = !Array.isArray(data[0].values);
    const isVertical = this.config.plot.vertical;
    const format = this.config.plot.label.format;
    const columnCount = data.filter((s) => s.type !== 'line').length;

    data.forEach((series, plotindex) => {
      if (series.type === 'line') return;

      const entries = isAssociative
        ? (isVertical ? stats.x.keys : stats.y.keys).map(
          (key) => ({key, value: series.values[key]}),
        )
        : series.values.map((v, i) => ({key: i, value: v}));

      entries.forEach(({key, value}, index) => {
        if (value == null) return;
        const display = format
          ? format(value, key)
          : String(value);

        if (isVertical) {
          const catScale = scaleX;
          const barW = catScale / columnCount;
          const x = (catScale * index) + (barW * plotindex) +
            (barW / 2) + (barW * barSpacing);
          const y = (stats.y.max - value) * scaleY;

          const text = new VElement('text', {
            'x': x + '%',
            'y': (y - 1) + '%',
            'text-anchor': 'middle',
            'class': ['plot-node-label', `plot-node-label-${plotindex}`],
          });
          text.textContent = display;
          subchartNoStretch.appendChild(text);
        } else {
          const catScale = scaleY;
          const barH = catScale / columnCount;
          const revIndex = entries.length - 1 - index;
          const yPos = 100 - (catScale * (revIndex + 1)) +
            (barH * plotindex) + (barH / 2);
          const x = Math.abs(value) * scaleX;

          const text = new VElement('text', {
            'x': (x + 1) + '%',
            'y': yPos + '%',
            'alignment-baseline': 'middle',
            'class': ['plot-node-label', `plot-node-label-${plotindex}`],
          });
          text.textContent = display;
          subchartNoStretch.appendChild(text);
        }
      });
    });
  }

  /**
   * Renders series with `type: 'line'` as line overlays on the chart.
   * Line points are centered on category positions to align with bars.
   * @param {Object} opts
   */
  _renderLineSeries({data, stats, subchartStretch, subchartNoStretch}) {
    const isAssociative = !Array.isArray(data[0].values);
    const isVertical = this.config.plot.vertical;
    const scaleX = stats.x.scaleFactor;
    const scaleY = stats.y.scaleFactor;

    data.forEach((series, plotindex) => {
      if (series.type !== 'line') return;

      const keys = isVertical ? stats.x.keys : stats.y.keys;
      const values = isAssociative
        ? keys.map((key) => series.values[key] ?? null)
        : series.values;

      // Build line path with points centered on category positions
      const pathParts = [];
      let hasPrevious = false;

      for (let i = 0; i < values.length; i++) {
        if (values[i] == null) {
          hasPrevious = false;
          continue;
        }
        const x = isVertical
          ? (i * scaleX) + (scaleX / 2)
          : (stats.y.max - values[i]) * scaleY;
        const y = isVertical
          ? (stats.y.max - values[i]) * scaleY
          : 100 - ((i * scaleY) + (scaleY / 2));

        if (!hasPrevious) {
          pathParts.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
        } else {
          pathParts.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
        }
        hasPrevious = true;
      }

      if (pathParts.length === 0) return;

      const linePath = new VElement('path', {
        'd': pathParts.join(' '),
        'fill': 'none',
        'class': ['plot', `plot-${plotindex}`],
        'style': 'vector-effect: non-scaling-stroke',
      });
      subchartStretch.appendChild(linePath);

      // Add circle nodes at each data point
      if (subchartNoStretch) {
        for (let i = 0; i < values.length; i++) {
          if (values[i] == null) continue;
          const cx = isVertical
            ? ((i * scaleX) + (scaleX / 2)) + '%'
            : ((stats.y.max - values[i]) * scaleY) + '%';
          const cy = isVertical
            ? ((stats.y.max - values[i]) * scaleY) + '%'
            : (100 - ((i * scaleY) + (scaleY / 2))) + '%';
          const label = isAssociative && keys ? keys[i] : i;
          const name = series.name || 'Series ' + (plotindex + 1);

          subchartNoStretch.appendChild(new VElement('circle', {
            'cx': cx,
            'cy': cy,
            'r': 4,
            'class': ['plot-node', `plot-node-${plotindex}`],
            'node': i,
            'plot': plotindex,
            'role': 'graphics-symbol',
            'aria-roledescription': 'data point',
            'aria-label': `${name}, ${label}: ${values[i]}`,
          }));
        }
      }
    });
  }

  /**
   * Creates stacked bars/columns. Each series stacks on top of the previous.
   * @param {Object} opts
   */
  _createStackedPlot({
    data, stats, subchartStretch,
    scaleX, scaleY, barSpacing, originPoint,
  }) {
    const isAssociative = !Array.isArray(data[0].values);
    const isVertical = this.config.plot.vertical;

    // Full-width bars (not split per series)
    const categoryScale = isVertical ? scaleX : scaleY;
    const categorySize = categoryScale;
    const adjustedSize = categorySize * (1 - (barSpacing * 2));

    // Build ordered keys/indices
    const categories = isAssociative
      ? (isVertical ? stats.x.keys : stats.y.keys)
      : Array.from(
        {length: Math.max(...data.map((s) => s.values.length))},
        (_, i) => i,
      );

    categories.forEach((cat, catIndex) => {
      let runningPos = 0; // accumulated positive value
      let runningNeg = 0; // accumulated negative value

      data.forEach((series, plotindex) => {
        if (series.type === 'line') return;
        const value = isAssociative
          ? series.values[cat]
          : series.values[cat];
        if (value == null) return;

        const barLen = Math.abs(value) * (isVertical ? scaleY : scaleX);
        const seriesName =
          series.name || 'Series ' + (plotindex + 1);

        if (isVertical) {
          let y;
          if (value >= 0) {
            runningPos += value;
            y = (stats.y.max - runningPos) * scaleY;
          } else {
            y = (stats.y.max - runningNeg) * scaleY;
            runningNeg += value;
          }
          const x = (categoryScale * catIndex) +
            (categorySize * barSpacing);

          subchartStretch.appendChild(
            new VElement('rect', {
              'class': [
                'plot', `plot-${plotindex}`,
                `plot-node-${plotindex}`,
              ],
              'index': catIndex,
              'plot': plotindex,
              'data-series': plotindex,
              'data-key': isAssociative ? cat : undefined,
              'data-index': isAssociative ? undefined : catIndex,
              'data-value': value,
              'x': x + '%',
              'y': y + '%',
              'width': adjustedSize + '%',
              'height': barLen + '%',
              'role': 'graphics-symbol',
              'aria-roledescription': 'data point',
              'aria-label': `${seriesName}, ${cat}: ${value}`,
            }),
          );
        } else {
          // Horizontal (bar) stacking
          let x;
          if (value >= 0) {
            x = (originPoint + runningPos *
              (isAssociative ? scaleX : scaleX));
            runningPos += value;
          } else {
            runningNeg += value;
            x = originPoint + runningNeg * scaleX;
          }
          const revIndex = categories.length - 1 - catIndex;
          const yPos = 100 - (categoryScale * (revIndex + 1)) +
            (categorySize * barSpacing);

          subchartStretch.appendChild(
            new VElement('rect', {
              'class': [
                'plot', `plot-${plotindex}`,
                `plot-node-${plotindex}`,
              ],
              'index': catIndex,
              'plot': plotindex,
              'data-series': plotindex,
              'data-key': isAssociative ? cat : undefined,
              'data-index': isAssociative ? undefined : catIndex,
              'data-value': value,
              'x': x + '%',
              'y': yPos + '%',
              'width': barLen + '%',
              'height': adjustedSize + '%',
              'role': 'graphics-symbol',
              'aria-roledescription': 'data point',
              'aria-label': `${seriesName}, ${cat}: ${value}`,
            }),
          );
        }
      });
    });
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
      let xPercent = (((e.clientX - box.left)/ box.width));
      const index = Math.floor(xPercent * stats.x.scaleLength);

      let percentTotal = 0;
      let percentCount = 0;
      const dataset = chart.data;
      let key;
      if (stats.associative) {
        key = stats.x.keys[index];
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
      let yPercent = (stats.y.max - (percentTotal/percentCount)) * stats.y.scaleFactor;
      if (isNaN(yPercent)) {
        yPercent = stats.y.max * stats.y.scaleFactor;
      }
      const xPos = (stats.x.scaleFactor * index) + (stats.x.scaleFactor / 2);
      let yPos = (yPercent.toFixed(2));
      if (isNaN(xPos) || isNaN(yPos) || index < 0 || index >= stats.x.scaleLength) {
        return null;
      }

      // Associative tooltip positions
      if (stats.associative) {
        yPos = 100 - yPos;
      }
      // No crosshair line for column charts — position off-screen
      info.crosshair.x1 = -10;
      info.crosshair.x2 = -10;
      info.crosshair.y1 = -10;
      info.crosshair.y2 = -10;

      // Tooltip position — raw data position; clamping handled by tooltipInteraction
      info.tooltip.x = xPos + tooltipOffset;
      info.tooltip.y = yPos;

      dataset.forEach(function(series, i) {
        const name = escapeHtml((series.name) ? series.name : 'Series ' + i);
        if (state.toggles[i] !== false) {
          const val = stats.associative
            ? chart.data[i].values[key]
            : chart.data[i].values[index];
          const lbl = stats.associative ? key : index;
          let content;
          if (chart.config.tooltip.format) {
            try {
              content = escapeHtml(
                String(chart.config.tooltip.format(lbl, val)),
              );
            } catch (err) {
              console.warn('SVC: tooltip.format threw an error:', err);
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

export default ColumnChart;
