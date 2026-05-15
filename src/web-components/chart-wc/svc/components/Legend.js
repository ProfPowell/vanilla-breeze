import { VElement } from '../DOM/VElement.js';

/**
 * Legend class
 */
let _legendIdCounter = 0;

class Legend {
  /**
   * @param {object} obj.config - the user config object
   * @param {object} obj.data - the user data
   */
  constructor({config, data}) {
    this.config = config;
    this.data = data;
  }

  /**
   * Returns the defaults for the legend object
   */
  static get defaults() {
    const breakpoint = {
      width: 300,
      height: 275,
    };
    return {
      l: {},
      legend: {
        breakpoint,
        enabled: true,
        style: {
          'margin': 0,
          'padding': 0,
          'flex-direction': 'column',
          'flex-wrap': 'wrap',
          'justify-content': 'center',
          'background-color':
            'var(--color-surface, rgba(255,255,255,0.8))',
          'z-index': 2,
        },
        item: {
          style: {
            'display': 'flex',
            'align-items': 'center',
            'padding': '0.5em',
            'color': 'var(--chart-label-color, #616161)',
            'white-space': 'nowrap',
          },
        },
      },
    };
  }

  /**
   * Legend render
   * @param {*} _stylesheet - unused (kept for API compatibility)
   * @param {*} _structure
   * @param {*} type
   * @param {*} _scopeId
   * @return {object} virtual dom of legend
   */
  render(_stylesheet, _structure, type, _scopeId) {
    return this.createLegend(type);
  }

  /**
   * Creates the legend as a VElement tree.
   * Uses --_series-color custom property for checkbox coloring
   * instead of per-series addRule() calls.
   * @param {string} chartType
   * @return {VElement} the legend <ul> element
   */
  createLegend(chartType) {
    const legend = new VElement('ul', {
      class: ['legend'],
    });
    const legendId = _legendIdCounter++;

    const items = (chartType !== 'pie')
      ? this.data.map((s, i) => ({
        name: s.name || 'Series ' + i, index: i,
      }))
      : Object.keys(this.data).map((key, i) => ({
        name: key, index: i,
      }));

    items.forEach(({name, index}) => {
      // Resolve series color from palette
      const color = this._getSeriesColor(index);

      const li = new VElement('li', {
        class: ['legend-item'],
      });

      const checkboxId = `legend-item-${index}-${legendId}`;
      const checkbox = new VElement('input', {
        'type': 'checkbox',
        'id': checkboxId,
        'data-series': index,
        'checked': '',
        'style': `--_series-color: ${color}`,
      });
      li.appendChild(checkbox);

      const label = new VElement('label', {
        'id': `legend-item-text-${index}-${legendId}`,
        'for': checkboxId,
      });
      label.textContent = name;
      li.appendChild(label);

      legend.appendChild(li);
    });

    return legend;
  }

  /**
   * Resolve the series color from the palette config.
   * @param {number} index
   * @return {string} CSS color value
   */
  _getSeriesColor(index) {
    let plotColors;
    if (this.config.plot.instances &&
        this.config.plot.instances.length > 0) {
      plotColors = this.config.plot.instances[
        index % this.config.plot.instances.length
      ];
    } else if (this.config.plot.node?.instances &&
        this.config.plot.node.instances.length > 0) {
      plotColors = this.config.plot.node.instances[
        index % this.config.plot.node.instances.length
      ];
    }

    if (plotColors && plotColors.stroke) return plotColors.stroke;
    if (plotColors && plotColors.fill) return plotColors.fill;
    return '#777';
  }
}

export { Legend };
