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
import {viewTransitionSwap} from '../../lib/vb-view-transition.js';
import {extractTableData, extractTableConfig} from './table-extractor.js';
import {getVBChartConfig, createThemePlugin} from './theme-bridge.js';
import {buildDataTable} from './data-table.js';

/** Author-supplied data table (never the one chart-wc generates). */
const SOURCE_TABLE = 'table:not([data-chart-generated])';

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

/**
 * @param {*} value
 * @param {*} [fallback]
 */
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
      'data-chart',
    ];
  }

  /** @type {any} */
  #data = null;
  /** @type {any} */
  #config = null;
  /** @type {{ destroy: () => void, mount: (el: Element) => any } | null} */
  #chart = null;
  #renderQueued = false;
  /** @type {HTMLDivElement | null} */
  #svgContainer = null;
  /** @type {HTMLDivElement | null} */
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
      const table = /** @type {HTMLTableElement | null} */ (this.querySelector(SOURCE_TABLE));
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
    const template = /** @type {HTMLTemplateElement | null} */ (this.querySelector('template[data-chart-data]'));
    if (template) {
      const content = template.content?.textContent || template.innerHTML;
      return {data: parseJson(content, null), tableConfig: {}};
    }

    // 5. Child <table>
    const table = /** @type {HTMLTableElement | null} */ (this.querySelector(SOURCE_TABLE));
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
    // Legend and tooltip are on by default (the engine's defaults). The
    // attributes switch them: bare or any value but "false" is on, "false"
    // is off. They win over data-config and the table's own attributes.
    for (const name of ['legend', 'tooltip']) {
      const value = this.dataset[name];
      if (value != null) {
        config[name] = {...config[name], enabled: value !== 'false'};
      }
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
   * After a successful mount: hide the data table visually but keep it in
   * the accessibility tree (it is the chart's text alternative — the SVG is
   * aria-hidden). An authored table in data-chart="enhance" mode stays
   * visible. See styles.css for why the hidden table is display:block.
   * @param {HTMLTableElement | null} table
   */
  #hideTable(table) {
    if (!table) return;
    const generated = table.hasAttribute('data-chart-generated');
    const mode = this.dataset.chart || table.dataset.chart || 'replace';
    if (!generated && mode !== 'replace') {
      this.#showTable(table);
      return;
    }
    if (!table.classList.contains('visually-hidden')) {
      table.classList.add('visually-hidden');
      table.setAttribute('data-chart-hidden', '');
    }
  }

  /**
   * Undo #hideTable (enhance mode, or the chart failed to render).
   * @param {HTMLTableElement | null} table
   */
  #showTable(table) {
    if (!table?.hasAttribute('data-chart-hidden')) return;
    table.classList.remove('visually-hidden');
    table.removeAttribute('data-chart-hidden');
  }

  /**
   * Keep a generated data table in sync with non-table data sources, or
   * remove it when the data comes from an authored table.
   * @param {*} data
   * @param {string} type
   * @param {any} config
   * @returns {HTMLTableElement | null}
   */
  #syncGeneratedTable(data, type, config) {
    const old = /** @type {HTMLTableElement | null} */ (this.querySelector(':scope > table[data-chart-generated]'));
    const caption = [this.dataset.title ?? config?.title?.text, this.dataset.subtitle]
      .filter(Boolean).join(' — ');
    const table = buildDataTable({
      data, type, caption,
      labelX: this.dataset.labelX, labelY: this.dataset.labelY,
    });
    if (!table) {
      old?.remove();
      return null;
    }
    table.setAttribute('data-chart-generated', '');
    // Keep the previous hidden state so a re-render doesn't flash the table.
    if (old?.hasAttribute('data-chart-hidden')) {
      table.classList.add('visually-hidden');
      table.setAttribute('data-chart-hidden', '');
    }
    if (old) old.replaceWith(table);
    else this.prepend(table);
    return table;
  }

  /**
   * With a data table present the SVG is aria-hidden (the table is the text
   * alternative). Without one (data the table builder can't tabulate) the
   * SVG is exposed as a single image named by the chart title instead.
   * @param {HTMLTableElement | null} table
   * @param {any} config
   */
  #labelChart(table, config) {
    const wrapper = this.#shadowWrapper;
    if (!wrapper) return;
    if (table) {
      wrapper.setAttribute('aria-hidden', 'true');
      wrapper.removeAttribute('role');
      wrapper.removeAttribute('aria-label');
    } else {
      wrapper.removeAttribute('aria-hidden');
      wrapper.setAttribute('role', 'img');
      wrapper.setAttribute('aria-label', this.dataset.title || config?.title?.text || 'Chart');
    }
  }

  /**
   * The SVG is aria-hidden (the data table is the accessible version), so
   * nothing inside it may be focusable: SVC's keyboard navigation
   * (tabindex=0 on chart-plot) and pie slices are taken out of the tab order.
   */
  #removeHiddenFocusables() {
    this.#svgContainer?.querySelectorAll('[tabindex]').forEach((el) => {
      el.setAttribute('tabindex', '-1');
    });
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
    const sourceTable = /** @type {HTMLTableElement | null} */ (this.querySelector(SOURCE_TABLE));
    const typeName = (this.dataset.type || sourceTable?.dataset.type || 'bar').toLowerCase();
    // Text alternative: the authored table, or one generated from the data.
    const table = sourceTable || this.#syncGeneratedTable(data, typeName, config);

    // The swap: destroy any prior chart and mount the new one. Wrapped in
    // a View Transition on re-renders so the chart crossfades instead of
    // flashing white between data/theme/type changes.
    const isReRender = this.#chart != null;
    const swap = () => {
      this.#destroyChart();
      this.#ensureSvgContainer();

      if (this.#svgContainer) {
        this.#svgContainer.classList.toggle(
          'sparkline', this.dataset.size === 'sparkline',
        );
      }

      try {
        this.dispatchEvent(new CustomEvent('chart-wc:config-resolved', {
          detail: {type: typeName, config},
          bubbles: true,
        }));

        const chart = new ChartType({config, data});
        this.#chart = chart;
        if (this.#svgContainer) chart.mount(this.#svgContainer);
        this.#removeHiddenFocusables();

        // Only now that the chart is on screen does the table step aside.
        this.#shadowWrapper?.removeAttribute('hidden');
        this.#hideTable(table);
        this.#labelChart(table, config);

        this.dispatchEvent(new CustomEvent('chart-wc:render', {
          detail: {
            type: typeName,
            seriesCount: Array.isArray(data) ? data.length : Object.keys(data).length,
          },
          bubbles: true,
        }));
      } catch (err) {
        // Chart failed: drop the empty chart box and show the table.
        this.#destroyChart();
        this.#shadowWrapper?.setAttribute('hidden', '');
        this.#showTable(table);
        const msg = err instanceof Error ? err.message : String(err);
        this.dispatchEvent(new CustomEvent('chart-wc:error', {
          detail: {message: msg},
          bubbles: true,
        }));
      }
    };

    if (isReRender) {
      viewTransitionSwap(this, swap, 'chart-vt');
    } else {
      swap();
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
