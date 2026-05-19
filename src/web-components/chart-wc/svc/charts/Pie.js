import { Chart } from './Chart.js';
import { VElement } from '../DOM/VElement.js';
import { Tooltip } from '../components/Tooltip.js';
import * as Util from '../utils/Utils.js';
import {escapeHtml, isPlainObject} from '../utils/Utils.js';

/**
 * Pie Chart
 * @example
 * const chart = new PieChart({
 *   data: { Apples: 30, Oranges: 45, Bananas: 25 },
 *   config: { title: { text: 'Fruit Distribution' } },
 * });
 * const svg = chart.toString();
 */
class PieChart extends Chart {
  /**
   * Returns the stringified name of the chart type
   * @return {string} The type of the chart
   */
  static get type() {
    return 'pie';
  }

  /**
   * Returns the default object configuration for the chart type
   * @return {object} Returns the defaults objct
   */
  static get defaults() {
    return {
      plot: {
        ring: false,
        node: {
          label: {
            enabled: true,
            placement: 'auto',
            scaleBySize: true,
            limitBySize: true,
            multiplier: 1,
            threshold: 12,
            style: {
              'font-size': 'clamp(8px, 0.6vmin, 16px)',
            },
          },
        },
      },
      center: {
        size: '40%',
        style: {
          fill: '#fff',
        },
        label: {
          style: {
            'font-size': '5vmin',
            'transform': 'translate(0%, -50%)',
            'text-align': 'center',
          },
          container: {
            style: {
              'display': 'flex',
              'justify-content': 'center',
              'align-items': 'center',
            },
          },
          title: {
            style: {
              'font-size': '7vmin',
            },
          },
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
      'plot': {
        fill: 'primary',
      },
      'plot.node': {
        fill: 'primary',
      },
    };
  }

  /**
   * Parses the configuration object and applies it to the virtual DOM structure
   * @param {Object} structure - An object containing virtual dom elements
   * @return {Object} The Structure
   */
  parse(structure) {
    structure = super.parse(structure);
    const {layoutChart} = structure;

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

    this.createPlot({
      layoutChart,
      subchartStretch,
      subchartNoStretch,
    });

    subchartNoStretch.appendChild(new VElement('g'));

    // Add post-styles once the chart is painted
    const postStyle = new VElement('style');
    postStyle.innerHTML = `.plot {opacity: 1;}.svc-loading {opacity:0;}`;
    layoutChart.appendChild(postStyle);
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
  * Creates the plot and markers from the user provided data.
  * @param {object} options
  * @param {object} [options.layoutChart] - the chart layout
  * @param {object} [options.subchartStretch] - the parent VElement container
  * @param {object} options.subchartNoStretch
  * @throws {Error} If `data` is not a plain object with numeric values.
  */
  createPlot({
    layoutChart: _layoutChart,
    subchartStretch: _subchartStretch,
    subchartNoStretch,
  }) {
    const data = this.data;
    if (!isPlainObject(data)) {
      throw new Error(
        'SVC: Pie chart "data" must be a plain object with numeric values, ' +
        'e.g. { "Apples": 30, "Oranges": 70 }.',
      );
    }
    // Validate: no negative values
    Object.keys(data).forEach((key) => {
      if (typeof data[key] !== 'number') {
        throw new Error(
          `SVC: Pie chart value for "${key}" must be a number.`,
        );
      }
      if (data[key] < 0) {
        throw new Error(
          `SVC: Pie chart value for "${key}" is negative (${data[key]}). ` +
          'Pie charts require non-negative values.',
        );
      }
    });

    const pieSum = Object.keys(data).reduce((acc, key) => {
      return acc += data[key];
    }, 0);

    // Guard against zero-sum data — render empty-state text
    if (pieSum === 0) {
      const emptyText = new VElement('text', {
        'x': '50%',
        'y': '50%',
        'text-anchor': 'middle',
        'alignment-baseline': 'middle',
        'class': ['loading'],
      });
      emptyText.textContent = 'No data';
      subchartNoStretch.appendChild(emptyText);
      return;
    }

    let runningSum = 0;
    let colorCount = 0;

    const colors = this.config.plot.node.instances.map((config) => {
      return config.fill;
    });

    Object.keys(data).forEach((key, index) => {
      const value = data[key];
      const fractionOfPie = value/pieSum;
      const startPosition = runningSum/pieSum;
      const color = colors[colorCount % colors.length];
      const sliceCoords = this.calculateSlice(fractionOfPie, startPosition);
      const sliceElement = this.createSlice(sliceCoords, color, index, value, pieSum, key);
      subchartNoStretch.appendChild(sliceElement);
      colorCount++;
      runningSum += value;
    });

    const center = new VElement('svg', {
      height: '100%',
      width: '100%',
      overflow: 'visible',
      viewBox: '0 0 100 100',
      class: ['nodeGroup'],
    });

    if (this.config.plot.ring) {
      // Parse center size — convert percentage to viewBox units
      const centerSize = parseFloat(this.config.center.size) || 40;
      const centerRadius = centerSize / 2;
      center.appendChild(new VElement('circle', {
        cx: '50',
        cy: '50',
        r: String(centerRadius),
        fill: 'var(--color-surface, #fff)',
        class: ['center'],
      }));
    }

    subchartNoStretch.appendChild(center);
  }

  /**
   * Calculates the size of each pie slce
   * @param {*} fractionOfPie
   * @param {*} startPosition
   * @return {object} Each slice dimensions
   */
  calculateSlice(fractionOfPie, startPosition) {
    const radius = 50;
    const xStart = Math.cos((startPosition + fractionOfPie) * 2 * Math.PI) * radius + radius;
    const yStart = Math.sin((startPosition + fractionOfPie) * 2 * Math.PI) * radius + radius;
    const xEnd = Math.cos(startPosition * 2 * Math.PI) * radius + radius;
    const yEnd = Math.sin(startPosition * 2 * Math.PI) * radius + radius;
    const startDegrees = startPosition * 360;
    const endDegrees = (fractionOfPie * 360) + startDegrees;

    const degrees = (endDegrees + startDegrees) / 2;
    let xCenter = (50 + 50 * Math.cos(degrees * 2 * Math.PI / 360));
    let yCenter = (50 + 50 * Math.sin(degrees * 2 * Math.PI / 360));

    xCenter = (xCenter + 50) * 0.5;
    yCenter = (yCenter + 50) * 0.5;
    const degreeLength = endDegrees - startDegrees;

    return {
      radius,
      degrees,
      degreeLength,
      start: {
        x: xStart,
        y: yStart,
      },
      end: {
        x: xEnd,
        y: yEnd,
      },
      center: {
        x: xCenter,
        y: yCenter,
      },
    };
  }

  /**
   * Creates a SVG Slice path
   * @param {*} coords
   * @param {*} color
   * @param {*} index
   * @param {*} value
   * @param {*} sum
   * @param {*} key
   * @return {object} the virtual svg element
   */
  createSlice(coords, color, index, value, sum, key) {
    const {radius, start, end, center, degreeLength} = coords;
    const sliceSVG = new VElement('svg', {
      height: '100%',
      width: '100%',
      overflow: 'visible',
      viewBox: '0 0 100 100',
      class: ['nodeGroup'],
    });
    const largeArcSweep = (degreeLength > 180) ? 1 : 0;
    const moveTo = `M ${radius} ${radius}`;
    const lineTo = `L${start.x} ${start.y}`;
    const arc = `A ${radius} ${radius} 0 ${largeArcSweep} 0 ${end.x} ${end.y}`;
    const percentage = ((value / sum) * 100).toFixed(0);
    sliceSVG.appendChild(new VElement('path', {
      'fill': color,
      'style': 'vector-effect: non-scaling-stroke',
      'd': `${moveTo} ${lineTo} ${arc} Z`,
      'alignment-baseline': 'middle',
      'text-anchor': 'middle',
      'data-key': key,
      'data-value': value,
      'tabindex': '0',
      'class': ['plot-node', `plot-node-${index}`],
      'role': 'graphics-symbol',
      'aria-roledescription': 'slice',
      'aria-label': `${key}: ${percentage}%`,
    }));

    if (this.config.plot.node.label.enabled) {
      const {multiplier, threshold, limitBySize, scaleBySize, placement} =
        this.config.plot.node.label;
      const isSmall = degreeLength <= threshold;
      const useExternal = placement === 'outside' ||
        (placement === 'auto' && isSmall);

      if (useExternal) {
        // External label with leader line for small slices
        const midAngle = coords.degrees * Math.PI / 180;
        const lineEnd = 55; // just outside the pie
        const labelDist = 62; // label position
        const lx1 = 50 + 48 * Math.cos(midAngle);
        const ly1 = 50 + 48 * Math.sin(midAngle);
        const lx2 = 50 + lineEnd * Math.cos(midAngle);
        const ly2 = 50 + lineEnd * Math.sin(midAngle);
        const labelX = 50 + labelDist * Math.cos(midAngle);
        const labelY = 50 + labelDist * Math.sin(midAngle);
        const anchor = Math.cos(midAngle) >= 0 ? 'start' : 'end';

        // Leader line
        sliceSVG.appendChild(new VElement('line', {
          'x1': lx1.toFixed(1),
          'y1': ly1.toFixed(1),
          'x2': lx2.toFixed(1),
          'y2': ly2.toFixed(1),
          'stroke': 'var(--chart-label-color, #737373)',
          'stroke-width': '0.5',
          'class': ['plot-leader'],
        }));

        const text = new VElement('text', {
          'fill': 'var(--chart-label-color, #737373)',
          'x': labelX.toFixed(1),
          'y': labelY.toFixed(1),
          'alignment-baseline': 'middle',
          'text-anchor': anchor,
          'style': 'font-size: 0.35em;',
          'class': ['plot-node-label', `plot-node-label-${index}`],
        });
        text.innerHTML = `${escapeHtml(key)} ${percentage}%`;
        sliceSVG.appendChild(text);
      } else if (!this.config.plot.ring) {
        // Internal label (original behavior for large slices)
        let fontSize;
        if (scaleBySize) {
          fontSize = 0.37 * multiplier * (degreeLength / 100);
        }
        const text = new VElement('text', {
          'fill': '#fff',
          'x': center.x,
          'y': center.y,
          'style': scaleBySize
            ? `font-size: ${Util.formatNumber(fontSize)}em;`
            : '',
          'alignment-baseline': 'middle',
          'text-anchor': 'middle',
          'class': (limitBySize && degreeLength > threshold) || !limitBySize
            ? ['plot-node-label']
            : ['plot-node-label', 'hide'],
        });
        text.innerHTML = percentage + '%';
        sliceSVG.appendChild(text);
      }
    }
    return sliceSVG;
  }

  /**
   * Tooltip location for pie/ring charts.
   * Detects hovered slice by mouse angle relative to pie center.
   * @param {Object} state
   * @param {Element} instance
   * @param {Object} chart
   * @return {Function} event handler returning tooltip info
   */
  tooltipLocation(state, instance, chart) {
    return function tooltipLocation(e) {
      let target = instance.querySelector('chart-plot');
      if (!target) return null;
      let box = target.getBoundingClientRect();

      // Find the actual pie SVG (preserveAspectRatio means it's centered)
      let pieSvg = target.querySelector('.svc-nodeGroup');
      let pieBox = pieSvg ? pieSvg.getBoundingClientRect() : box;

      // Mouse position relative to pie circle center
      let centerX = pieBox.left + pieBox.width / 2;
      let centerY = pieBox.top + pieBox.height / 2;
      let dx = e.clientX - centerX;
      let dy = e.clientY - centerY;

      // Use the smaller dimension as the radius reference
      let pieRadius = Math.min(pieBox.width, pieBox.height) / 2;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > pieRadius) return null;

      // Ring hole — ignore if inside the donut hole
      if (chart.config.plot.ring) {
        let ringSize = parseFloat(chart.config.center.size) || 40;
        let holeRadius = pieRadius * (ringSize / 100);
        if (dist < holeRadius) return null;
      }

      // Calculate angle (0° = right, clockwise) — matches calculateSlice
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * Math.PI;
      let fraction = angle / (2 * Math.PI);

      // Tooltip position as percentage of chart-plot
      let xPercent = ((e.clientX - box.left) / box.width) * 100;
      let yPercent = ((e.clientY - box.top) / box.height) * 100;

      // Find which slice this angle falls in
      let data = chart.data;
      let keys = Object.keys(data);
      let total = keys.reduce(function(sum, k) {
        return sum + (data[k] || 0);
      }, 0);
      if (total === 0) return null;

      let running = 0;
      let hitKey = null;
      let hitValue = 0;
      let hitIndex = 0;
      for (let i = 0; i < keys.length; i++) {
        let val = data[keys[i]] || 0;
        let sliceFraction = val / total;
        if (fraction >= running &&
            fraction < running + sliceFraction) {
          hitKey = keys[i];
          hitValue = val;
          hitIndex = i;
          break;
        }
        running += sliceFraction;
      }
      if (!hitKey) return null;

      let percentage = ((hitValue / total) * 100).toFixed(1);
      let info = {
        tooltip: {},
        crosshair: {x1: -10, x2: -10, y1: -10, y2: -10},
      };

      // Position tooltip near the mouse
      info.tooltip.x = xPercent;
      info.tooltip.y = yPercent;

      let name = escapeHtml(String(hitKey));
      let content;
      if (chart.config.tooltip && chart.config.tooltip.format) {
        try {
          content = escapeHtml(
            String(chart.config.tooltip.format(hitKey, hitValue)),
          );
        } catch (e) {
          console.warn('SVC: tooltip.format threw an error:', e);
          content = name + ': ' + percentage + '%';
        }
      } else {
        content = name + ': ' + percentage + '%';
      }

      info.tooltip.text =
        '<div class="svc-tooltip-content">' +
        '<span class="svc-tooltip-label-title ' +
        'svc-tooltip-label-title-' + hitIndex + '">' +
        name + '</span> : ' + content + '</div>';

      info.index = hitIndex;
      return info;
    };
  }
}

export { PieChart };
