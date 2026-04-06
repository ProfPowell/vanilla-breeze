import * as Util from './utils/Utils.js';
import {isPlainObject} from './utils/Utils.js';
import VElement from './DOM/VElement.js';

/**
 * Creates the default configuration object for every chart.
 * @constructor
 */
let _gradientIdCounter = 0;

class Defaults {
  /**
   * Generate a defaults object by reducing the amount of objects.
   * The order of the configuration objects matter; Each object's properties will
   * be overwritten/merged onto the next one.
   * @param {Array} palette - An array of palette colors
   * @param {Array} configs - An array of configuration objects
   */
  constructor(palette, ...configs) {
    this.config = configs.reduce((acc, config) => {
      return Util.deepAssign(acc, config);
    }, {});
    // Assign a palette if null.
    this.palette = palette || Defaults.defaultPalette();

    // If the palette is an array of colors, convert it to an array of objects.
    if (!isPlainObject(this.palette[0])) {
      this.palette = this.palette.map((color) => {
        return {
          primary: color,
          secondary: color,
        };
      });
    }

    // Create defs
    this.defs = this.createDefs();
    Util.deepAssign(this.config.l, Defaults.layoutProperties());
  }

  /**
   * CSS styling for the SVC structure
   * @return {object} a configuration object with structure styling
   */
  static layoutProperties() {
    return {
      wrap: {
        style: {
          background: 'var(--color-surface, #fff)',
        },
      },
      top: {
        style: {
          'justify-content': 'center',
          'align-items': 'center',
          'padding-block': '0.5em 2em',
          'padding-inline': '0.2em',
        },
      },
      ticks: {
        x: {
          style: {
            height: '10px',
          },
        },
        y: {
          style: {
            width: '1%',
          },
        },
      },
    };
  }
  /*
    3 types of palettes:

    // Standard
    [
      {
        primary: '#434',
        secondary: '#343'
      }
    ]

    // Gradients
    [
      {
        primary: {
          0: '#6bd0e4',
          33: '#604eb1',
          66: '#c88e66',
          100: '#c955a9'
        }
      }
    ]

    // Simplified
    ['#434', '#343']
  */

  /**
   * Returns a default palette object
   * @return {array} An array of objects with primary and secondary colors.
   */
  static defaultPalette() {
    return [{
      primary: 'var(--chart-series-1, #3b82f6)',
      secondary: 'var(--chart-series-1, #3b82f6)',
    },
    {
      primary: 'var(--chart-series-2, #ef4444)',
      secondary: 'var(--chart-series-2, #ef4444)',
    },
    {
      primary: 'var(--chart-series-3, #8b5cf6)',
      secondary: 'var(--chart-series-3, #8b5cf6)',
    },
    {
      primary: 'var(--chart-series-4, #f59e0b)',
      secondary: 'var(--chart-series-4, #f59e0b)',
    },
    {
      primary: 'var(--chart-series-5, #10b981)',
      secondary: 'var(--chart-series-5, #10b981)',
    }];
  }

  /**
   * Creates defs elements for gradients, and in the future patterns.
   * @return {Array} - An array of def elements
   */
  createDefs() {
    const defs = [];
    if (isPlainObject(this.palette[0]) &&
      isPlainObject(this.palette[0].primary)) {
      // Generate a new gradient definition
      this.palette.forEach((color, index) => {
        // Iterate through each type of color (primary, secondary...)
        Object.keys(color).forEach((type) => {
          const {
            url,
            def,
          } = this.generateGradient(color[type], index, type);
          // Assign the color type the appropriate colorid
          color[type] = `url(#${url})`;
          defs.push(def);
        });
      });
    }
    return defs;
  }

  /**
   * Generates a gradient element based on user input.
   * @param {object} color - The user supplied gradient object.
   * e.g.
   *  {
   *     orientation: 'vertical' || 'horizontal'
   *     n: '#FFF' // where n is a color stop value from 0-100
   *     n: '#434'
   *  }
   * @param {number} index - The plotindex
   * @param {type} type - primary, secondary, ...
   * @return {object} - contains the url and the def Element
   */
  generateGradient(color, index, type) {
    const orientation = (color['orientation']) || 'vertical';
    const url = 'svc-grad-' + index + '-' + type + '-' + (_gradientIdCounter++);
    const def = new VElement('linearGradient', {
      id: url,
      x1: '0%',
      y1: '0%',
      x2: (orientation === 'vertical') ? '0%' : '100%',
      y2: (orientation === 'vertical') ? '100%' : '0%',
    });

    Object.keys(color).forEach((stop) => {
      if (!isNaN(parseInt(stop))) {
        def.appendChild(new VElement('stop', {
          'offset': stop + '%',
          'stop-color': color[stop],
        }));
      }
    });
    return {
      url,
      def,
    };
  }

  /**
   * Apply the palette to the default object.
   * @param {Object} specs - An object containing a key of an object path,
   *  and directions of what colors should go where.
   *  e.g. { 'plot.node.label': { fill: 'primary'} } means that the object in the properties
   *  plot -> node -> label, will have a fill color from the 'primary' color in the palette.
   * @param {Object} palette - An array of palette colors in the form of:
   *   {
   *     primary: 'red', secondary: 'green'...
   *   }
   */
  applyPalette(specs) {
    for (const path in specs) {
      if (Object.hasOwn(specs, path)) {
        // Get the object inside of the defaults that we want to populate an instance array
        const target = getObject(path, this.config);
        if (!target) {
          // Silently skip — path may not exist when a component is disabled
          continue;
        }

        const properties = specs[path];
        // Instantiate an instances object if it does not exist
        if (!target.instances) {
          target.instances = [];
        }

        // We want to create n number of instances (one per palette)
        this.palette.forEach((instancePalette, index) => {
          const computedProps = {};

          // Iterate through the unique css properies that we want to colorize
          for (const prop in properties) {
            if (Object.hasOwn(properties, prop)) {
              // primary, secondary, accent
              const paletteType = properties[prop];
              if (Object.prototype.hasOwnProperty.call(instancePalette, paletteType)) {
                computedProps[prop] = instancePalette[paletteType];
              } else {
                computedProps[prop] = paletteType;
              }
            }
          }

          // Combine any existing target.instances[index] with the newly created one.
          if (target.instances[index]) {
            Object.keys(computedProps).forEach((prop) => {
              // Only apply new styling from the palette. If styling is already in an instance, we keep it.
              if (typeof target.instances[index][prop] === 'undefined') {
                target.instances[index][prop] = computedProps[prop];
              }
            });
            // Util.deepAssign(target.instances[index], computedProps);
          } else {
            target.instances.push(computedProps);
          }
        });
      }
    }

    /**
     * Takes a stringified path and an object, traverses through the object.
     * @param {*} pathStr - a stringified object path, delimited by '.'
     * @param {*} target - the object to traverse through
     * @return {object} Returns the requested object, or null if not found
     */
    function getObject(pathStr, target) {
      const paths = pathStr.split('.');
      let obj = target;
      let notFound = false;
      paths.forEach((path) => {
        if (obj[path]) {
          obj = obj[path];
        } else {
          notFound = true;
        }
      });
      return (notFound) ? null : obj;
    }
  }
}
export default Defaults;
