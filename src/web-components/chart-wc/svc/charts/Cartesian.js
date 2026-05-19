import { Chart } from './Chart.js';
import { VElement } from '../DOM/VElement.js';
import * as Util from '../utils/Utils.js';
import { Baseline } from '../components/Baseline.js';
import { Tooltip } from '../components/Tooltip.js';
import { createMediaQueries } from '../components/ScaleQueries.js';
import {calculateStats} from '../stats/index.js';
import {createScale} from '../scales/index.js';

/**
 * Cartesian chart
 */
class Cartesian extends Chart {
  /**
   * Returns the default object configuration for the chart type
   * @return {object} Returns the defaults objct
   */
  static get defaults() {
    const sparkline = {
      width: 120,
      height: 120,
    };
    return {
      'l': {},
      'plot': {
        vertical: true,
      },
      'axis': {
        breakpoint: sparkline,
        x: {
          enabled: true,
        },
        y: {
          enabled: true,
        },
        label: {
          x: {
            enabled: true,
            text: 'Scale-X',
          },
          y: {
            enabled: true,
            text: 'Scale-Y',
          },
        },
        style: {
          'stroke': 'var(--chart-axis-color, #444)',
          'stroke-width': 0.3,
          'vector-effect': 'non-scaling-stroke',
        },
      },
      'baseline': {
        x: {},
        y: {},
        style: {
          'stroke': 'var(--chart-baseline-color, #888)',
          'stroke-width': 1,
        },
      },
      'ticks': {
        x: {
          enabled: true,
        },
        y: {
          enabled: true,
        },
        style: {
          'stroke-width': '1',
          'stroke': 'var(--chart-tick-color, #DDD)',
        },
      },
      'guides': {
        breakpoint: sparkline,
        x: {
          enabled: true,
        },
        y: {
          enabled: true,
        },
        style: {
          'stroke': 'var(--chart-grid-color, #e4e4e4)',
          'stroke-dasharray': '0, 0',
          'stroke-width': 1,
          'stroke-linecap': 'round',
        },
      },
      'scale': {
        sorted: false,
        minFontSize: 5,
        maxItems: 15,
        label: {
          style: {
            'text-align': 'center',
          },
        },
      },
    };
  }

  /**
   * Returns the name of the chart
   * @return {string}
   */
  getName() {
    return /** @type {any} */ (super.getName());
  }

  /**
   * Parses the configuration object and applies it to the virtual DOM structure
   * @param {Object} structure - An object containing virtual dom elements
   * @return {Object} The Structure
   */
  parse(structure) {
    structure = super.parse(structure);

    const data = this.data;
    const stylesheet = this.stylesheet;
    const config = this.config;

    const {
      layoutChart,
      layoutXAxis,
      layoutYAxis,
      layoutOriginLeft,
      layoutOriginCenter,
      layoutOriginRight,
      layoutYTicks,
      layoutXTicks,
      layoutXAxisLabel,
      layoutYAxisLabel,
    } = structure;
    // Create and cache stats for use later when creating tooltip and legend interactions
    const stats = this.stats = calculateStats(data, this.config, /** @type {any} */ (this.constructor).type);
    this.data = data;

    this.hooks.run('beforeRender', {config, data, stats, structure});

    // X & Y TICKS, GUIDES, LABELS
    // -----------------------
    ['x', 'y'].forEach((type) => {
      const scaleType = detectScaleType(type, stats, config);
      const elements = createScale(scaleType, {
        type,
        config,
        stats,
        data,
        chartType: /** @type {any} */ (this.constructor).type,
      }).render();
      Object.keys(elements).forEach((section) => {
        if (section === 'labels') {
          elements[section].forEach((el) => {
            if (type === 'x') {
              layoutXAxis.appendChild(el);
            } else {
              layoutYAxis.appendChild(el);
            }
          });
        } else if (section === 'ticks') {
          // Experimental ticks
          if (type === 'x' && config.ticks.x.enabled) {
            elements[section].forEach((el) => {
              layoutXTicks.appendChild(el);
            });
          } else if (type === 'y' && config.ticks.y.enabled) {
            elements[section].forEach((el) => {
              layoutYTicks.appendChild(el);
            });
          }
        } else {
          // Create a group based on the type
          const g = new VElement('g', {
            class: [type + '-' + section],
          });
          elements[section].forEach((el) => {
            g.appendChild(el);
          });
          layoutChart.appendChild(g);
        }
      });
    });

    // X-AXIS
    // -----------------------
    const describedByIds = [];
    if (config.axis.x.enabled) {
      layoutChart.appendChild(this.createAxis({
        type: 'x',
      }));
    }
    if (config.axis.label.x.enabled) {
      const xLabelId = `svc-axis-x-label-${this._scopeId}`;
      const axisLabel = new VElement('div', {
        'class': ['l-axis-label-text-x'],
        'id': xLabelId,
        'role': 'note',
      });
      axisLabel.innerHTML = `<span class="svc-axis-label-x">${Util.escapeHtml(config.axis.label.x.text)}</span>`;
      layoutXAxisLabel.appendChild(axisLabel);
      describedByIds.push(xLabelId);
    }

    // Y-AXIS
    // -----------------------
    if (config.axis.y.enabled) {
      layoutChart.appendChild(this.createAxis({
        type: 'y',
      }));
    }

    if (config.axis.label.y.enabled) {
      const yLabelId = `svc-axis-y-label-${this._scopeId}`;
      const axisLabel = new VElement('div', {
        'class': ['l-axis-y-label-text'],
        'id': yLabelId,
        'role': 'note',
      });
      axisLabel.innerHTML = `<span class="svc-axis-label-y">${Util.escapeHtml(config.axis.label.y.text)}</span>`;
      layoutYAxisLabel.appendChild(axisLabel);
      describedByIds.push(yLabelId);
    }

    // Associate axis labels with the chart root for screen readers
    if (describedByIds.length > 0) {
      structure.root.setAttribute(
        'aria-describedby',
        describedByIds.join(' '),
      );
    }

    // DUMMY LABELS
    // -----------------------
    // This is for the x&y axis to resize to the longest text,
    // since each label has position: absolute;
    const dummyYAxis = new VElement('div', {
      class: ['axis-y-label-dummy'],
    });
    dummyYAxis.innerHTML = '0';
    layoutOriginLeft.appendChild(dummyYAxis);
    layoutYAxisLabel.appendChild(dummyYAxis);

    const dummyXTick = new VElement('div', {
      style: 'height: 1%; min-height:10px;',
    });
    layoutOriginCenter.appendChild(dummyXTick);


    const dummyLabel = new VElement('div', {
      class: ['origin-label', 'scale-label'],
    });

    if (stats.associative && !config.plot.vertical) {
      // Find the longest key string
      const keys = stats.y.keys;
      let longestLength = 0;
      keys.forEach((key) => {
        longestLength = (key.length > longestLength) ? key.length : longestLength;
      });
      // Fill with n 0s
      dummyLabel.innerHTML = new Array(longestLength + 1).join('0');
    } else {
      // Take the largest number
      dummyLabel.innerHTML = stats.y.max;
    }

    layoutOriginCenter.appendChild(dummyLabel);
    layoutYAxis.appendChild(dummyLabel);

    layoutOriginRight.setAttrs({
      style: 'width: 1%;',
    });


    // Y BASELINE
    // -----------------------
    if (stats.y.min < 0) {
      layoutChart.appendChild(new Baseline({
        type: 'y',
        stats,
        stroke: config.baseline.style.stroke,
        width: config.baseline.style['stroke-width'],
      }).render());
    }

    // X BASELINE
    // -----------------------
    if (stats.x.min < 0) {
      layoutChart.appendChild(new Baseline({
        type: 'x',
        stats,
        stroke: config.baseline.style.stroke,
        width: config.baseline.style['stroke-width'],
      }).render());
    }

    // PLOT CONTAINERS
    // -----------------------
    /*
     Create the graph. We'll need two containers,
     one that scales and one that maintains aspect ratio
    */
    const subchartStretch = this.createGraph({
      stretch: true,
    });
    layoutChart.appendChild(subchartStretch);

    const subchartNoStretch = this.createGraph({
      stretch: false,
    });
    layoutChart.appendChild(subchartNoStretch);


    // PLOT
    // -----------------------
    /** @type {any} */ (this).createPlot({
      data,
      stats,
      subchartStretch,
      subchartNoStretch,
    });

    // Add post-styles once the chart is painted
    const postStyle = new VElement('style');
    postStyle.innerHTML = `.plot {opacity: 1;} .svc-loading {opacity:0;}`;
    layoutChart.appendChild(postStyle);

    // TOOLTIP
    // -----------------------

    // Add responsive media queries to handle scale text
    stylesheet.addRaw(createMediaQueries({stats, config}));

    return structure;
  }

  /**
   * Create the tooltip script code
   * @return {object} Containing the tooltip element
   */
  createScript() {
    return (new Tooltip({
      stats: this.stats,
      data: this.data,
      config: this.config,
    })).render();
  }

  /**
   * Creates a virtual dom element for either the x or y axis.
   * @param {object} obj.type - Which axis to create
   * @return {object} virtual dom element
   */
  createAxis({type}) {
    if (type === 'x') {
      return new VElement('line', {
        'x1': '0%',
        'x2': '100%',
        'y1': '100%',
        'y2': '100%',
        'class': ['axis', 'axis-x'],
      });
    } else {
      return new VElement('line', {
        'x1': '0%',
        'x2': '0%',
        'y1': '0%',
        'y2': '100%',
        'class': ['axis', 'axis-y'],
      });
    }
  }

}

/**
 * Detect the appropriate scale type for an axis.
 * Checks explicit config override, then falls back to auto-detection.
 * @param {string} axisType - 'x' or 'y'
 * @param {Object} stats - computed chart stats
 * @param {Object} config - chart configuration
 * @return {string} scale type name ('linear' or 'category')
 */
function detectScaleType(axisType, stats, config) {
  // Allow explicit override via config
  if (config.scale?.[axisType]?.type) {
    return config.scale[axisType].type;
  }
  return stats.associative ? 'category' : 'linear';
}

export { Cartesian };
