import VElement from '../DOM/VElement.js';

/**
 * Tooltip Class
 */
class Tooltip {
  /**
   * Creates the tooltip object
   * @param {object} obj
   */
  constructor({stats, data, config, type}) {
    this.data = data;
    this.config = config;
    this.type = type;
    if (type !== 'pie') {
      this.min = stats.y.min;
      this.max = stats.y.max;
      this.stats = stats;
    }
  }

  /**
   * Returns the defaults of the Tooltip class
   * @return {object} Tooltip config
   */
  static get defaults() {
    return {
      'tooltip': {
        breakpoint: {
          width: 275,
          height: 275,
        },
        enabled: true,
        container: {
          style: {
            display: 'flex',
          },
        },
        crosshair: {
          style: {
            'z-index': -1,
          },
        },
        label: {
          style: {
            'background-color': 'var(--chart-tooltip-bg, var(--color-surface, #fff))',
            'box-shadow': 'var(--chart-tooltip-shadow, 0 2px 4px rgba(0, 0, 0, 0.2))',
            'color': 'var(--chart-tooltip-color, var(--chart-label-color, #737373))',
            'padding': '1em',
            'z-index': 2,
          },
          title: {
            instances: [],
          },
        },
      },
    };
  }

  /**
   * Renders the tooltip VElement
   * @return {object}
   */
  render() {
    return {
      tooltip: this.createDOM(),
      htmlTooltip: this._createHTMLTooltip(),
    };
  }

  /**
   * Creates a tooltip element
   * @return {object} VElement
   */
  createDOM() {
    // All chart types get the standard tooltip (including pie and ring)
    return this._createCartesianTooltip();
  }

  _createCartesianTooltip() {
    const tooltip = new VElement('g', {
      'id': 'svc-tooltip-box',
      'class': ['tooltip', 'hide'],
    });

    // Start crosshair off-screen so it's not visible on initial load
    const crosshair = new VElement('line', {
      'class': ['tooltip-crosshair'],
      'y1': '-10%',
      'y2': '-10%',
      'x1': '-10%',
      'x2': '-10%',
      'stroke': 'var(--chart-crosshair-color, #777)',
    });
    tooltip.appendChild(crosshair);
    tooltip.appendChild(this._createTooltipForeignObject(
      'svc-tooltip-label', ['tooltip-label', 'hide'],
      {'role': 'tooltip', 'aria-live': 'polite'},
    ));
    return tooltip;
  }

  _createRingTooltip() {
    const tooltip = new VElement('g', {
      'id': 'svc-center-label-box',
      'class': ['tooltip', 'hide'],
    });
    tooltip.appendChild(this._createTooltipForeignObject(
      'svc-center-label', ['center-label'],
      {'aria-live': 'polite'},
    ));
    return tooltip;
  }

  /**
   * Creates an HTML tooltip overlay (no foreignObject).
   * Returns { crosshair: VElement, tooltipBox: VElement }.
   */
  _createHTMLTooltip() {
    // Crosshair stays as SVG line inside the plotarea SVG
    // Start off-screen so it's not visible on initial load
    const crosshair = new VElement('line', {
      'class': ['tooltip-crosshair'],
      'y1': '-10%',
      'y2': '-10%',
      'x1': '-10%',
      'x2': '-10%',
      'stroke': 'var(--chart-crosshair-color, #777)',
    });

    // Tooltip label as a positioned HTML div (no foreignObject)
    const tooltipBox = new VElement('div', {
      'id': 'svc-tooltip-box',
      'class': ['tooltip', 'hide'],
      'style': 'position:absolute;top:0;left:0;' +
        'width:100%;height:100%;pointer-events:none;',
    });
    const container = new VElement('div', {
      'class': ['tooltip-container'],
      'style': 'position:absolute;pointer-events:auto;',
    });
    const label = new VElement('div', {
      'id': 'svc-tooltip-label',
      'class': ['tooltip-label', 'hide'],
      'role': 'tooltip',
      'aria-live': 'polite',
    });
    container.appendChild(label);
    tooltipBox.appendChild(container);

    return {crosshair, tooltipBox};
  }

  _createTooltipForeignObject(labelId, labelClasses, labelAttrs) {
    const fo = new VElement('foreignObject', {
      'class': ['tooltip-fo'],
      'width': '100%',
      'height': '100%',
    });
    const body = new VElement('body', {
      'xmlns': 'http://www.w3.org/1999/xhtml',
      'style': 'width:100%;height:100%;',
    });
    fo.appendChild(body);
    body.appendChild(new VElement('meta', {
      'name': 'viewport',
      'content': 'width=device-width, initial-scale=1',
    }));
    const container = new VElement('div', {
      'class': ['tooltip-container'],
    });
    body.appendChild(container);
    const label = new VElement('div', {
      'id': labelId,
      'class': labelClasses,
      ...labelAttrs,
    });
    container.appendChild(label);
    return fo;
  }
}

export default Tooltip;
