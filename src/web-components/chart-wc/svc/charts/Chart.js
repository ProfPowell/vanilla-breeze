import Defaults from '../Defaults.js';
import VElement from '../DOM/VElement.js';
import Title from '../components/Title.js';
import Legend from '../components/Legend.js';
import Tooltip from '../components/Tooltip.js';
import Stylesheet from '../styles/Stylesheet.js';
import createSVGContainer from '../DOM/structure.js';
import {compileDOM, escapeHtml} from '../utils/Utils.js';
import SVC from '../SVC.js';
import {
  tooltipInteraction, legendInteraction,
  keyboardNavigation, dataClickInteraction,
} from '../interactions/index.js';

/**
 * @typedef {Object} SVCConfig
 * @property {string[]} [palette] - Array of color strings used for series.
 * @property {Object} [style] - Root CSS style properties (font-family, color, etc.).
 * @property {Object} [title] - Title configuration.
 * @property {string} [title.text] - The title text. Enables the title when set.
 * @property {boolean} [title.enabled=true] - Whether to show the title.
 * @property {Object} [legend] - Legend configuration.
 * @property {boolean} [legend.enabled=true] - Whether to show the legend.
 * @property {Object} [tooltip] - Tooltip configuration.
 * @property {boolean} [tooltip.enabled=true] - Whether to show the tooltip.
 * @property {Function} [tooltip.format] - Custom formatter: `(label, value) => string`.
 *   For Line/Area/Column/Bar: label is the category key or index, value is numeric.
 *   For Scatter/Bubble: label is the series name, value is the raw data point array.
 * @property {Object} [plot] - Plot area configuration.
 * @property {boolean} [plot.vertical=true] - Orientation (Cartesian charts only).
 * @property {number} [plot.spacing=10] - Bar/column spacing as a percentage.
 * @property {Object} [plot.node] - Data-point node styling.
 * @property {boolean} [plot.node.enabled=true] - Whether to render data-point markers.
 * @property {Object} [plot.node.label] - Node label configuration.
 * @property {boolean} [plot.node.label.enabled=false] - Whether to show value labels on nodes.
 * @property {boolean} [plot.ring=false] - Render as a donut/ring chart (Pie only).
 * @property {Object} [axis] - Axis configuration (Cartesian charts only).
 * @property {Object} [axis.x] - X-axis options.
 * @property {boolean} [axis.x.enabled=true] - Whether to show the x-axis.
 * @property {Object} [axis.y] - Y-axis options.
 * @property {boolean} [axis.y.enabled=true] - Whether to show the y-axis.
 * @property {Object} [axis.label] - Axis label text configuration.
 * @property {Object} [guides] - Grid guide line configuration.
 * @property {Object} [scale] - Scale configuration.
 * @property {boolean} [scale.sorted=false] - Whether to sort associative keys.
 * @property {number} [scale.maxItems=15] - Max number of scale labels to display.
 * @property {Object} [center] - Center/donut hole configuration (Pie only).
 */

/**
 * Base class for all Charts
 */
let _chartIdCounter = 0;

class Chart extends SVC {
  #stylesheet;
  #defs;

  /**
   * Creates the instance of a chart. Can be used directly in Node.js.
   * @param {Object} options - The options object.
   * @param {SVCConfig} [options.config={}] - The configuration object.
   * @param {Array<Object>|Object} options.data - Series array (Cartesian) or key-value object (Pie).
   * @throws {Error} If `data` is not provided.
   */
  constructor({config = {}, data}) {
    super({config, data});

    // Input validation
    if (data == null) {
      throw new Error('SVC: "data" is required. Pass an array of series objects or a plain object for pie charts.');
    }

    this.data = data;
    // An optional user supplied palette
    this.palette = config.palette = config.palette || Defaults.defaultPalette();

    // Apply the user provided config to the chart's defaults.
    const defaults = this.applyConfigToDefaults(config);
    this.#defs = defaults.defs;
    this.config = defaults.config;

    // Register plugins from config
    if (Array.isArray(this.config.plugins)) {
      this.config.plugins.forEach((p) => this.hooks.registerPlugin(p));
    }

    this.hooks.run('configResolved', {
      config: this.config,
      data: this.data,
      chartType: this.constructor.type,
    });

    // Create a Stylesheet
    this.#stylesheet = new Stylesheet();
    // Unique scope ID to prevent CSS collisions between multiple charts on the same page
    this._scopeId = 'c' + (_chartIdCounter++);
    // Interaction functions (Legend, Tooltips)
    this.interactions = [];
    // Hold the virtual DOM
    this.structure = null;

    this.render();
  }

  get stylesheet() {
    return this.#stylesheet;
  }

  get defs() {
    return this.#defs;
  }

  /**
   * Walk the class inheritance tree and grab each defaults object and apply it to the user's config
   * @param {*} config - the user supplied configuration object
   * @return {object} the defaults object
   */
  applyConfigToDefaults(config) {
    let defaultObjs = [];
    let classObj = Object.getPrototypeOf(this);
    while (classObj.constructor.name !== 'Object') {
      if (classObj.constructor.defaults) {
        defaultObjs.push(classObj.constructor.defaults);
      }
      classObj = Object.getPrototypeOf(classObj);
    }

    // Reverse the order. We want the highest inheritance class to have less priority when
    // overriding config;
    defaultObjs = defaultObjs.reverse();

    // Add default components
    const components = {
      'legend': Legend,
      'tooltip': Tooltip,
    };
    // Check the user attrubutes and default attributes
    Object.keys(components).forEach((name) => {
      if (!config[name] || config[name].enabled) {
        defaultObjs.push(components[name].defaults);
      }
    });

    if (config.title && config.title.text) {
      defaultObjs.push(Title.defaults);
    }

    // Create a default attribute object with the palette and the various attribute objects
    const defaults = new Defaults(this.palette, ...defaultObjs, config);

    // Apply the palette from the Chart defaults
    defaults.applyPalette(Chart.specs());

    // Apply the chart type's palette
    defaults.applyPalette(this.constructor.specs(defaults.config));
    return defaults;
  }

  /**
  * Contains the main chart default object, that all charts will override.
  * @return {object} The base defaults
  */
  static get defaults() {
    return {
      'palette': Defaults.defaultPalette(),
      'style': {
        'font-family': 'var(--chart-font-family, inherit)',
        'font-weight': 300,
        'color': 'var(--chart-label-color, #737373)',
      },
      'legend': {
        enabled: true,
      },
      'tooltip': {
        enabled: true,
      },
      'plot': {
        node: {
          enabled: true,
          instances: [],
          active: {
            instances: [],
          },
          label: {
            enabled: false,
            instances: [],
          },
        },
        instances: [],
        style: {
          overflow: 'visible',
        },
      },
      // Plot top includes items like nodes, to overflow outside the plotarea
      'plot-top': {
        style: {
          overflow: 'visible',
        },
      },
      'plotarea': {
        style: {
          fill: 'var(--color-surface, #fff)',
          overflow: 'visible',
        },
      },
      'loading': {
        enabled: true,
        style: {
          'font-size': '1.5em',
          'fill': 'var(--chart-label-color, #616161)',
          'text-anchor': 'middle',
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
      // Plot label text
      'plot.node.label': {
        fill: 'primary',
      },
      'tooltip.label.title': {
        color: 'primary',
      },
    };
  }

  /**
   * Takes the configuration object and parsed statistics, and creates the SVG
   * from the virtual dom.
   */
  render() {
    // Create a title
    if (this.config.title) {
      this.title = new Title(this.config);
    }

    // Create a legend
    if (this.config.legend) {
      this.legend = new Legend({
        config: this.config,
        data: this.data,
        chart: this.chart,
      });
    }

    // Create the vDOM
    const interactive = !!(this.config.tooltip?.enabled || this.config.legend?.enabled);
    let structure = createSVGContainer({interactive});

    // Add scope ID for CSS isolation between multiple charts
    structure.wrap.setAttribute('data-chart-id', this._scopeId);

    // Set ARIA attributes on root SVG
    const chartType = this.constructor.type || 'chart';
    if (this.config.title && this.config.title.text) {
      const safeTitle = escapeHtml(this.config.title.text);
      structure.root.setAttribute('aria-label', safeTitle);
      // Add <desc> element summarizing the chart
      const desc = new VElement('desc');
      desc.innerHTML = `${chartType} chart: ${safeTitle}`;
      structure.root.prependChild(desc);
    } else {
      const seriesCount = Array.isArray(this.data) ? this.data.length : Object.keys(this.data).length;
      structure.root.setAttribute('aria-label', `${chartType} chart with ${seriesCount} data series`);
    }

    // Parse the data and config. Apply it to the structure.
    structure = this.parse(structure);
    this.structure = this.parseComponents(structure);

    this.hooks.run('afterRender', {
      config: this.config,
      data: this.data,
      stats: this.stats,
      structure: this.structure,
    });
  }

  /**
   * Parses the configuration object and applies it to the virtual DOM structure
   * @param {Object} structure - An object containing virtual dom elements
   * @return {Object} The Structure
   */
  parse(structure) {
    const {layoutChart} = structure;

    // DEFS
    // -----------------------
    // Chart definitions (colors) Attach each def that was previously calculated from the palette
    const defsElement = new VElement('defs');
    this.defs.forEach((def) => {
      defsElement.appendChild(def);
    });
    layoutChart.appendChild(defsElement);
    return structure;
  }

  /**
   * Parses components such as title, tooltip, and legend
   * @param {Object} structure - An object containing virtual dom elements
   * @return {Object} The structure
   */
  parseComponents(structure) {
    const {body, top, layoutChart} = structure;
    // Title
    if (this.config.title && this.config.title.enabled) {
      top.appendChild(this.title.render());
    }
    // Legend
    if (this.config.legend && this.config.legend.enabled) {
      const legend = new VElement('chart-legend');
      legend.appendChild(this.legend.render(null, null, this.constructor.type));
      body.appendChild(legend);
      this.interactions.push(legendInteraction);
    }
    // Tooltip
    if (this.config.tooltip && this.config.tooltip.enabled) {
      this.tooltip = new Tooltip({
        stats: this.stats,
        data: this.data,
        config: this.config,
        type: this.constructor.type,
      }).render();

      layoutChart.appendChild(this.tooltip.tooltip);
      // Only push tooltip interactions if the chart type provides a tooltipLocation method
      if (typeof this.tooltipLocation === 'function') {
        this.interactions.push(tooltipInteraction);
        this.interactions.push(this.tooltipLocation);
      }
      this.interactions.push(keyboardNavigation);
    }
    // Always register click interaction — independent of tooltip/legend
    this.interactions.push(dataClickInteraction);
    return structure;
  }

  /**
    * Generate CSS, compile virtualDOM into a stringified DOM element
    * @param {Object} root - The top level element object.
    * @param {boolean} isSparkline
    * @return {string} - The stringified SVC output
    */
  compile(root, _isSparkline) {
    // Remove previously compiled style element to prevent duplication
    if (this._styleElement) {
      root.removeChild(this._styleElement);
    }
    // Generate CSS to inject into the SVG
    this._styleElement = this.compileStyles();
    root.prependChild(this._styleElement);

    // Generate out the DOM string by compiling the virtual DOM
    return compileDOM(root);
  }

  /**
   * Compile the chart as HTML (no foreignObject wrapper).
   * Outputs a `<figure>` with SVG islands for data visualization.
   * @param {Object} structure - The chart's virtual DOM structure.
   * @param {Object} [options]
   * @param {boolean} [options.prerendered] - Add prerendered marker.
   * @return {string} The chart as an HTML string
   */
  compileHTML(structure, {prerendered} = {}) {
    const wrap = structure.wrap;
    const root = structure.root;

    // Save original wrap options so we can restore after compilation
    const savedOptions = {...wrap.options};

    // Copy ARIA attributes from SVG root to the HTML figure
    if (root.options['aria-label']) {
      wrap.setAttribute('aria-label', root.options['aria-label']);
    }
    if (root.options['aria-describedby']) {
      wrap.setAttribute(
        'aria-describedby', root.options['aria-describedby'],
      );
    }
    wrap.setAttribute(
      'role', root.options['role'] || 'figure',
    );
    if (prerendered) {
      wrap.setAttribute('data-prerendered', '');
    }

    // Manage style element on wrap (separate from SVG path)
    if (this._htmlStyleElement) {
      wrap.removeChild(this._htmlStyleElement);
    }
    this._htmlStyleElement = this.compileStyles();
    wrap.prependChild(this._htmlStyleElement);

    // Swap SVG tooltip (foreignObject) for HTML tooltip (div)
    const layoutChart = structure.layoutChart;
    const plotarea = structure.plotarea;
    const svgTooltip = this.tooltip?.tooltip;
    const htmlTooltip = this.tooltip?.htmlTooltip;
    if (svgTooltip && htmlTooltip && plotarea) {
      layoutChart.removeChild(svgTooltip);
      layoutChart.appendChild(htmlTooltip.crosshair);
      plotarea.appendChild(htmlTooltip.tooltipBox);
    }

    const html = compileDOM(wrap);

    // Restore original state for toString()/toFile() path
    wrap.options = savedOptions;
    if (this._htmlStyleElement) {
      wrap.removeChild(this._htmlStyleElement);
    }
    if (svgTooltip && htmlTooltip && plotarea) {
      layoutChart.removeChild(htmlTooltip.crosshair);
      plotarea.removeChild(htmlTooltip.tooltipBox);
      layoutChart.appendChild(svgTooltip);
    }

    return html;
  }

  // Returns a style vDOM element
  /**
   * Creates a style element to hold all chart styling.
   * @return {Object} A style VElement
   */
  compileStyles() {
    const style = new VElement('style');
    const numInstances = (this.constructor.type !== 'pie') ? this.data.length : Object.keys(this.data).length;
    const styles = this.stylesheet.convertconfig(this.config, numInstances, this._scopeId) + this.stylesheet.sheet;
    style.innerHTML = `@layer charts { ${styles} }`;
    return style;
  }

  // SUB ROUTINES
  /**
   * Create a graph virtual element
   * @param {object} obj.stretch - Boolean to determine if the chart should have
   * the preserveAspectRatio property present.
   * @return {object} The virtual element for the graph
   */
  createGraph({
    stretch,
  }) {
    if (stretch) {
      return new VElement('svg', {
        'x': '0%',
        'y': '0%',
        'width': '100%',
        'height': '100%',
        'viewBox': '0, 0, 100, 100',
        'preserveAspectRatio': 'none',
        'xmlns': 'http://www.w3.org/2000/svg',
        'class': ['plot'],
      });
    } else {
      return new VElement('svg', {
        'x': '0%',
        'y': '0%',
        'width': '100%',
        'height': '100%',
        'xmlns': 'http://www.w3.org/2000/svg',
        'class': ['plot-top'],
      });
    }
  }

  /**
   * Creates a SVG rect for the background
   * @return {object}
   */
  createBackground() {
    // Create chart background
    return new VElement('rect', {
      width: '100%',
      height: '100%',
      x: '0%',
      y: '0%',
      class: ['container'],
    });
  }

  /**
   * Creates a SVG rect for the plot area
   * @param {object} obj.config - the user's config
   * @return {object} The plot area element
   */
  createPlotArea({
    config: _config,
  }) {
    return new VElement('rect', {
      x: '0%',
      y: '0%',
      width: '100%',
      height: '100%',
      class: ['plotarea'],
    });
  }
}

export default Chart;
