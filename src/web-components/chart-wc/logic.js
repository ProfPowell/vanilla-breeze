/**
 * <chart-wc> — SVG chart web component with built-in charting engine
 *
 * Progressive enhancement: semantic table → CSS chart → SVG chart.
 * Supports five data sources:
 *   1. JS property (.data)
 *   2. data-values attribute (JSON)
 *   3. <script type="application/json"> child
 *   4. <template data-chart-data> child
 *   5. Child <table> extraction
 */

import {
  LineChart,
  AreaChart,
  BarChart,
  ColumnChart,
  PieChart,
  RingChart,
  ScatterChart,
  BubbleChart,
} from './svc/main.js';

import {registerComponent} from '../../lib/bundle-registry.js';
import {VBElement} from '../../lib/vb-element.js';
import {extractTableData, extractTableConfig} from './table-extractor.js';
import {getVBChartConfig, createThemePlugin} from './theme-bridge.js';

const CHART_TYPES = {
  line: LineChart,
  area: AreaChart,
  bar: BarChart,
  column: ColumnChart,
  pie: PieChart,
  ring: RingChart,
  scatter: ScatterChart,
  bubble: BubbleChart,
};

function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mergeDeep(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return target;
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

class ChartWc extends VBElement {
  static get observedAttributes() {
    return [
      'data-type',
      'data-values',
      'data-config',
      'data-title',
      'data-subtitle',
      'data-legend',
      'data-tooltip',
      'data-palette',
      'data-label-x',
      'data-label-y',
      'data-size',
    ];
  }

  #data = null;
  #config = null;
  #chart = null;
  #renderQueued = false;
  #svgContainer = null;
  #shadowWrapper = null;

  // -- Public property API --

  set data(value) {
    if (this.#data === value) return;
    this.#data = value;
    this.#queueRender();
    this.#emitDataChanged('property');
  }

  get data() {
    return this.#data;
  }

  set config(value) {
    if (this.#config === value) return;
    this.#config = value;
    this.#queueRender();
    this.#emitDataChanged('property');
  }

  get config() {
    return this.#config;
  }

  /**
   * Emit a tagged data-changed event. Frameworks can filter by source to
   * avoid feedback loops (e.g. ignore their own .data assignments and only
   * react to internal changes like table re-extraction).
   */
  #emitDataChanged(source) {
    this.dispatchEvent(new CustomEvent('chart-wc:data-changed', {
      detail: { data: this.#data, config: this.#config, source },
      bubbles: true,
    }));
  }

  // -- Public methods --

  /**
   * Re-extract table data and re-render the chart.
   */
  refresh() {
    this.#queueRender();
  }

  /**
   * Get the current SVG markup.
   * @returns {string|null}
   */
  toSVG() {
    return this.#svgContainer?.querySelector('svg')?.outerHTML || null;
  }

  // -- Lifecycle --

  setup() {
    this.#queueRender();
  }

  teardown() {
    this.#destroyChart();
  }

  attributeChangedCallback() {
    if (!this.hasAttribute('data-upgraded')) return;
    this.#queueRender();
  }

  // -- Private --

  #queueRender() {
    if (!this.isConnected || this.#renderQueued) return;
    this.#renderQueued = true;
    Promise.resolve().then(() => {
      this.#renderQueued = false;
      if (this.isConnected) this.#render();
    });
  }

  /**
   * Resolve chart type from data-type attribute (or table's data-type).
   */
  #resolveChartType() {
    let type = (this.dataset.type || '').toLowerCase();
    if (!type) {
      const table = this.querySelector('table');
      type = (table?.dataset.type || 'bar').toLowerCase();
    }
    return CHART_TYPES[type] || BarChart;
  }

  /**
   * Resolve chart data from the five sources in priority order.
   * @returns {{data: *, tableConfig: object}|null}
   */
  #resolveData() {
    // 1. JS property
    if (this.#data != null) {
      return {data: parseJson(this.#data, null), tableConfig: {}};
    }

    // 2. data-values attribute
    const attrVal = this.dataset.values;
    if (attrVal != null) {
      return {data: parseJson(attrVal, null), tableConfig: {}};
    }

    // 3. <script type="application/json"> child
    const script = this.querySelector('script[type="application/json"]');
    if (script) {
      return {data: parseJson(script.textContent, null), tableConfig: {}};
    }

    // 4. <template data-chart-data> child
    const template = this.querySelector('template[data-chart-data]');
    if (template) {
      const content = template.content?.textContent || template.innerHTML;
      return {data: parseJson(content, null), tableConfig: {}};
    }

    // 5. Child <table>
    const table = this.querySelector('table');
    if (table) {
      const type = (this.dataset.type || table.dataset.type || 'bar').toLowerCase();
      const {data, config: tableDataConfig} = extractTableData(table, type);
      const tableAttrConfig = extractTableConfig(table);
      const tableConfig = mergeDeep(mergeDeep({}, tableDataConfig), tableAttrConfig);
      return {data, tableConfig};
    }

    return null;
  }

  /**
   * Build the merged SVC config object.
   */
  #resolveConfig(tableConfig = {}) {
    // Start with VB theme tokens
    const themeConfig = getVBChartConfig(this);

    // Merge: theme → table config → property config → attribute config
    const baseConfig = parseJson(this.#config, {}) || {};
    const attrConfig = parseJson(this.dataset.config, {}) || {};

    let config = {};
    config = mergeDeep(config, themeConfig);
    config = mergeDeep(config, tableConfig);
    config = mergeDeep(config, baseConfig);
    config = mergeDeep(config, attrConfig);

    // Axis labels: use data-label-x / data-label-y attributes, fall back to config, or hide
    const labelX = this.dataset.labelX;
    const labelY = this.dataset.labelY;
    config.axis = config.axis || {};
    config.axis.label = config.axis.label || {};
    if (labelX != null) {
      config.axis.label.x = {text: labelX, enabled: true};
    } else if (!config.axis.label.x?.text) {
      config.axis.label.x = config.axis.label.x || {};
      config.axis.label.x.enabled = false;
    }
    if (labelY != null) {
      config.axis.label.y = {text: labelY, enabled: true};
    } else if (!config.axis.label.y?.text) {
      config.axis.label.y = config.axis.label.y || {};
      config.axis.label.y.enabled = false;
    }

    // Pie chart: use uniform label sizing by default
    if (!config.plot?.node?.label?.scaleBySize) {
      config.plot = config.plot || {};
      config.plot.node = config.plot.node || {};
      config.plot.node.label = config.plot.node.label || {};
      config.plot.node.label.scaleBySize = false;
    }

    // Shorthand attributes override
    if (this.dataset.title != null) {
      const titleConfig = {text: this.dataset.title, enabled: true};
      if (this.dataset.subtitle != null) {
        titleConfig.subtitle = this.dataset.subtitle;
      }
      config.title = titleConfig;
    }
    if (this.dataset.legend != null) {
      config.legend = {enabled: true};
    }
    if (this.dataset.tooltip != null) {
      config.tooltip = {enabled: true};
    }
    if (this.dataset.palette != null) {
      const palette = parseJson(this.dataset.palette, null);
      if (palette) config.palette = palette;
    }

    // Sparkline mode: strip all chrome regardless of other config.
    // Forces axes, ticks, gridlines, axis labels, title, legend, and
    // tooltip off so the chart renders as a pure inline trend shape
    // sized by its container. Opt in via data-size="sparkline".
    if (this.dataset.size === 'sparkline') {
      config.axis = config.axis || {};
      config.axis.x = {...(config.axis.x || {}), enabled: false};
      config.axis.y = {...(config.axis.y || {}), enabled: false};
      config.axis.label = config.axis.label || {};
      config.axis.label.x = {...(config.axis.label.x || {}), enabled: false};
      config.axis.label.y = {...(config.axis.label.y || {}), enabled: false};
      config.ticks = config.ticks || {};
      config.ticks.x = {...(config.ticks.x || {}), enabled: false};
      config.ticks.y = {...(config.ticks.y || {}), enabled: false};
      config.guides = config.guides || {};
      config.guides.x = {...(config.guides.x || {}), enabled: false};
      config.guides.y = {...(config.guides.y || {}), enabled: false};
      config.title = {enabled: false};
      config.legend = {enabled: false};
      config.tooltip = {enabled: false};
    }

    // Register VB theme plugin for SVC hook system
    config.plugins = config.plugins || [];
    config.plugins.push(createThemePlugin(this));

    return config;
  }

  /**
   * Ensure the shadow DOM container exists. Create it if needed.
   * Shadow DOM isolates SVC's internal HTML/CSS from VB's cascade,
   * preventing style conflicts. CSS custom properties still inherit through.
   */
  #ensureSvgContainer() {
    if (this.#shadowWrapper && this.contains(this.#shadowWrapper)) return;

    this.#shadowWrapper = document.createElement('div');
    this.#shadowWrapper.setAttribute('data-chart-svg', '');
    this.#shadowWrapper.setAttribute('aria-hidden', 'true');
    this.appendChild(this.#shadowWrapper);

    const shadow = this.#shadowWrapper.attachShadow({mode: 'open'});

    // Sparkline overrides — scoped to a `.sparkline` class on the
    // container so the rules only fire when sparkline mode is active.
    // The chart engine still emits its own CSS for axes/labels/title/
    // legend/tooltip; this layer hides the residual scale labels (which
    // are always rendered regardless of the enabled flags) and strips
    // the figure padding so the trend shape fills its container edge to
    // edge. :host-context() is avoided for cross-browser portability.
    const sparkStyle = document.createElement('style');
    sparkStyle.textContent = `
      .sparkline figure[data-chart-id] {
        padding: 0;
        background: transparent;
      }
      .sparkline chart-canvas {
        padding: 0;
        grid-template-columns: 0 0 0 1fr;
        grid-template-rows: 1fr 0 0 0;
      }
      .sparkline chart-title,
      .sparkline chart-legend,
      .sparkline chart-axis,
      .sparkline chart-label,
      .sparkline .svc-scale-label-x,
      .sparkline .svc-scale-label-y,
      .sparkline .svc-origin-label,
      .sparkline .svc-axis-y-label-dummy,
      .sparkline .svc-ticks-x,
      .sparkline .svc-ticks-y {
        display: none !important;
      }
    `;
    shadow.appendChild(sparkStyle);

    this.#svgContainer = document.createElement('div');
    this.#svgContainer.style.cssText = 'width:100%;height:100%;overflow:visible;';
    shadow.appendChild(this.#svgContainer);
  }

  /**
   * Handle the source table: hide it visually but keep it accessible.
   */
  #processTable(table) {
    if (!table) return;

    const mode = this.dataset.chart || table.dataset.chart || 'replace';

    if (mode === 'replace') {
      /* Use the site-wide .visually-hidden utility from src/utils/visually-hidden.css
         instead of a chart-wc-scoped sr-only class. The bespoke rule
         (chart-wc > table.sr-only) was being partially overridden by cascade
         layers — position/clip/overflow applied but width/height did not, so
         the table rendered at its natural content size (~270 × 5236 on the
         /stats/ page) and added phantom scroll past the visible footer. */
      table.classList.add('visually-hidden');
      table.setAttribute('aria-hidden', 'false');
    }
  }

  #render() {
    const ChartType = this.#resolveChartType();
    const resolved = this.#resolveData();

    if (!resolved || !resolved.data) {
      this.dispatchEvent(new CustomEvent('chart-wc:error', {
        detail: {message: 'No chart data found'},
        bubbles: true,
      }));
      return;
    }

    const {data, tableConfig} = resolved;
    const config = this.#resolveConfig(tableConfig);

    // Clean up any previous chart
    this.#destroyChart();

    // Process source table
    const table = this.querySelector('table');
    this.#processTable(table);

    // Create SVG container
    this.#ensureSvgContainer();

    // Toggle sparkline class on the shadow container so the
    // sparkline-scoped CSS in the shadow root applies/clears.
    if (this.#svgContainer) {
      this.#svgContainer.classList.toggle(
        'sparkline', this.dataset.size === 'sparkline',
      );
    }

    try {
      this.dispatchEvent(new CustomEvent('chart-wc:config-resolved', {
        detail: {type: this.dataset.type || table?.dataset.type || 'bar', config},
        bubbles: true,
      }));

      this.#chart = new ChartType({config, data});
      this.#chart.mount(this.#svgContainer);

      this.dispatchEvent(new CustomEvent('chart-wc:render', {
        detail: {
          type: this.dataset.type || table?.dataset.type || 'bar',
          seriesCount: Array.isArray(data) ? data.length : Object.keys(data).length,
        },
        bubbles: true,
      }));
    } catch (err) {
      this.dispatchEvent(new CustomEvent('chart-wc:error', {
        detail: {message: err.message},
        bubbles: true,
      }));
    }
  }

  #destroyChart() {
    if (this.#chart) {
      this.#chart.destroy();
      this.#chart = null;
    }
    // Clean up SVG container contents but keep the element
    if (this.#svgContainer) {
      this.#svgContainer.innerHTML = '';
    }
  }
}

registerComponent('chart-wc', ChartWc);
export {ChartWc};
