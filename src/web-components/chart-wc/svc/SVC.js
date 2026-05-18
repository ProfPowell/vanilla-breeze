import { VElement } from './DOM/VElement.js';
import { Hooks } from './Hooks.js';
import {deepAssign} from './utils/Utils.js';

/**
 * Safely embed a value in a script context by JSON-stringifying it
 * and escaping sequences that could break out of CDATA or script tags.
 * @param {*} value
 * @return {string}
 */
function _safeJsonEmbed(value) {
  return JSON.stringify(value)
      .replace(/<\//g, '<\\/')
      .replace(/]]>/g, ']]\\>')
      .replace(/<!--/g, '<\\!--')
      .replace(/<\?/g, '<\\?');
}

/**
 * Base class for all charts, contains public interface and data handling methods
 * @constructor
 */
class SVC {
  /** @type {Hooks} */
  hooks = new Hooks();
  /** @type {{ root: any, body: any } | null} Subclass-defined */
  structure = null;

  /** @param {any} [_options] */
  constructor(_options) { /* subclasses may consume options */ }

  /**
   * Subclass-defined: compile a structure node to an SVG/HTML string.
   * @param {any} _node
   * @param {any} [_opts]
   * @returns {string}
   */
  compile(_node, _opts) { return ''; }

  /**
   * Subclass-defined: compile to HTML.
   * @param {any} _node
   * @param {any} [_opts]
   * @returns {string}
   */
  compileHTML(_node, _opts) { return ''; }

  /**
   * Subclass-defined: merge config into defaults.
   * @param {any} _config
   * @returns {any}
   */
  applyConfigToDefaults(_config) { return _config; }

  /** Subclass-defined: re-render the chart. */
  render() { /* implemented by subclasses */ }
  /**
   * Creates a SVG string of the chart with the appropriate XML header. Use this method if creating a .svg file.
   * @param {object} [options] - Options object.
   * @param {boolean} [options.prerendered] - Adds a tag in the SVG element to designate that this is a
   * prerendered chart. Used for re-hydration strategies.
   * @param {boolean} [options.includeScripts] - Adds inline scripts to bake in interactivity.
   * @return {string}
   */
  toFile(options = {}) {
    const opts = normalizeFileOptions(options);
    // Add headers and doctype for XML
    const HEADER = `<?xml version="1.0" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`;
    const structure = this.structure;
    if (!structure) return HEADER;
    const {body} = structure;
    let script;
    if (opts.includeScripts) {
      script = this._createScripts(this.structure);
      body.appendChild(script);
    }
    // Create the chart
    let svg = this.compile(structure.root);
    if (opts.includeScripts && script) {
      body.removeChild(script);
    }
    // Inject a data attr to the svg tag to signal if it's prerendered or not. (Used for re-hydration)
    if (opts.prerendered) {
      svg = svg.slice(0, svg.indexOf('svg') + 3) + ' data-prerendered=""' + svg.slice(svg.indexOf('svg') + 3);
    }
    return HEADER + svg;

    function normalizeFileOptions(value) {
      if (typeof value === 'object' && value !== null) {
        const prerendered = Boolean(value.prerendered);
        // Default includeScripts to false when prerendered (hydration path)
        const defaultScripts = prerendered ? false : true;
        return {
          prerendered,
          includeScripts: value.includeScripts ?? defaultScripts,
        };
      }
      return {
        prerendered: Boolean(value),
        includeScripts: true,
      };
    }
  }

  /**
   * Returns the SVG string without the XML header.
   * @return {string} The chart as a string
   */
  toString() {
    return this.structure ? this.compile(this.structure.root) : '';
  }

  /**
   * Returns the chart as an HTML string (no foreignObject wrapper).
   * The output is a `<figure>` containing HTML chrome (title, legend,
   * axis labels) with SVG islands for data visualization. Suitable for
   * embedding in HTML pages via SSG/SSR, and for hydration on the client.
   * @param {Object} [options]
   * @param {boolean} [options.prerendered] - Mark as prerendered for hydration.
   * @return {string} The chart as an HTML string
   */
  toHTML({prerendered} = {}) {
    return this.compileHTML(this.structure, {prerendered});
  }

  /**
   * Export the chart as a Blob. Supports 'image/svg+xml' and 'image/png'.
   * PNG export requires a browser environment (uses Canvas).
   * @param {string} [type='image/svg+xml'] - MIME type.
   * @param {Object} [options] - Export options.
   * @param {number} [options.width=800] - PNG width in pixels.
   * @param {number} [options.height=600] - PNG height in pixels.
   * @return {Promise<Blob>}
   */
  async toBlob(type = 'image/svg+xml', {width = 800, height = 600} = {}) {
    if (typeof Blob === 'undefined') {
      throw new Error('SVC: toBlob() requires a browser environment.');
    }
    const svgString = this.toString();

    if (type === 'image/svg+xml') {
      return new Blob([svgString], {type: 'image/svg+xml'});
    }

    if (type === 'image/png') {
      if (typeof document === 'undefined') {
        throw new Error(
          'SVC: PNG export requires a browser environment with Canvas.',
        );
      }
      return this._svgToPngBlob(svgString, width, height);
    }

    throw new Error(`SVC: Unsupported export type "${type}".`);
  }

  /**
   * Export the chart as a data URL string.
   * @param {string} [type='image/svg+xml'] - MIME type.
   * @param {Object} [options] - Export options (see toBlob).
   * @return {Promise<string>}
   */
  async toDataURL(type = 'image/svg+xml', options) {
    if (typeof FileReader === 'undefined') {
      throw new Error(
        'SVC: toDataURL() requires a browser environment with FileReader.',
      );
    }
    const blob = await this.toBlob(type, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(/** @type {string} */ (reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Trigger a file download in the browser.
   * @param {string} [filename='chart.svg'] - Download filename.
   * @param {Object} [options] - Export options (see toBlob).
   * @return {Promise<void>}
   */
  async download(filename = 'chart.svg', options) {
    if (typeof document === 'undefined') {
      throw new Error('SVC: download() requires a browser environment.');
    }
    const ext = filename.split('.').pop()?.toLowerCase();
    const type = ext === 'png' ? 'image/png' : 'image/svg+xml';
    const blob = await this.toBlob(type, options);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Convert SVG string to PNG Blob via Canvas.
   * @param {string} svgString
   * @param {number} width
   * @param {number} height
   * @return {Promise<Blob>}
   * @private
   */
  _svgToPngBlob(svgString, width, height) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const blob = new Blob([svgString], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        if (!ctx) { reject(new Error('SVC: 2D canvas context unavailable.')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            resolve(pngBlob);
          } else {
            reject(new Error('SVC: PNG export failed.'));
          }
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('SVC: Failed to load SVG for PNG export.'));
      };
      img.src = url;
    });
  }

  /**
   * Inserts the chart SVG into a DOM container and hydrates it with event handlers.
   * @param {Element} container - A DOM element to render the chart into.
   * @return {object|null} The interaction state, or null if container is missing.
   */
  mount(container) {
    if (!container || typeof document === 'undefined') {
      return null;
    }
    container.innerHTML = this.toHTML();
    this._state = this.hydrate(container);
    this._container = container;
    // ResizeObserver needs an Element, not a ShadowRoot
    const observeTarget = /** @type {any} */ (container).host || container;
    this._observeResize(observeTarget);
    return this._state;
  }

  /**
   * @deprecated Use mount(container) instead.
   * Creates a DOM element dynamically with the chart inside. Attaches event listeners to the Element.
   * @return {Element | null} A DOM element with the svg chart inside.
   */
  createElement() {
    if (typeof document === 'undefined') {
      return null;
    }
    const container = document.createElement('div');
    this.mount(container);
    return container;
  }

  /**
   * Attaches interaction handlers to a pre-rendered chart.
   * @param {Element} container - A DOM element that contains the SVG chart.
   * @return {object|null} The interaction state or null if no container was provided.
   */
  hydrate(container) {
    if (!container) {
      return null;
    }
    /** @type {{ functions: Record<string, any> }} */
    const state = {
      functions: {},
    };
    /** @type {any[]} */
    const interactions = /** @type {any} */ (this).interactions || [];
    interactions.forEach((interaction) => {
      state.functions[interaction.name] = interaction(state, container, this);
    });
    this._state = state;
    this._container = container;
    return state;
  }

  /**
   * Update the chart with new data and/or config. Re-renders in place.
   * @param {Object} options
   * @param {Array|Object} [options.data] - New data (replaces existing)
   * @param {Object} [options.config] - Config overrides (merged with existing)
   * @return {object|null} The new interaction state, or null if not mounted.
   */
  update({data, config} = {}) {
    if (!this._container) return null;
    const container = this._container;

    // Clean up old state without clearing container reference
    if (this._state && this._state._tooltipCleanup) {
      this._state._tooltipCleanup();
    }
    this._state = null;

    // Apply updates
    if (data != null) this.data = data;
    if (config != null) {
      deepAssign(this.config, config);
      // Re-apply defaults so newly enabled components get their defaults
      this.config = this.applyConfigToDefaults(this.config).config;
    }

    // Re-render
    this.interactions = [];
    this.render();

    // Re-mount into same container
    container.innerHTML = this.toString();
    this._state = this.hydrate(container);
    this._container = container;

    return this._state;
  }

  /**
   * Cleans up event listeners and timeouts. Call when removing the chart.
   */
  destroy() {
    this.hooks.run('beforeDestroy', {
      container: this._container,
      state: this._state,
    });
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._state && this._state._tooltipCleanup) {
      this._state._tooltipCleanup();
    }
    if (this._container) {
      this._container.innerHTML = '';
    }
    this._state = null;
    this._container = null;
    this.hooks.destroy();
  }

  /**
   * Observe container resize and fire the onResize hook.
   * @param {Element} container
   */
  _observeResize(container) {
    if (typeof ResizeObserver === 'undefined') return;
    this._resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        this.hooks.run('onResize', {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
          container,
        });
      }
    });
    this._resizeObserver.observe(container);
  }

  /**
   * Creates stringified javascript event handlers for the chart.
   * Used when creating .svg files to bake in interactivity.
   * @param {*} _structure
   * @return {object} A VElement object containing stringified javascript
   */
  _createScripts(_structure) {
    const script = new VElement('script', {
      class: ['chart-script'],
    });

    let toExecute = '';
    /** @type {string[]} */
    const functions = [];
    const interactions = /** @type {any} */ (this).interactions || [];
    interactions.forEach((/** @type {any} */ fn) => {
      toExecute += fn.toString() + '\n';
      functions.push(fn.name);
    });

    const self = /** @type {any} */ (this);
    toExecute += `
    var chart = {
      stats: ${_safeJsonEmbed(self.stats || {})},
      data: ${_safeJsonEmbed(self.data)},
      config: ${_safeJsonEmbed(self.config)}
    };
    var svgRoot = document.currentScript.closest('svg');
    var state = { functions: []};`;

    functions.forEach((fnName) => {
      toExecute += `state.functions['${fnName}'] = ${fnName}(state, svgRoot, chart);`;
    });

    script.innerHTML = '//<![CDATA[\n' + toExecute + '\n//]]>';
    return script;
  }
}

export { SVC };
