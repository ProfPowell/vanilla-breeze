import * as Util from '../utils/Utils.js';
import {createTick, createGuide, createLabel, applyLabelFormat} from './LinearScale.js';

/**
 * Logarithmic scale for data spanning multiple orders of magnitude.
 * Produces ticks at powers of 10 (1, 10, 100, 1000, ...).
 */
class LogScale {
  /** @type {any} */ type;
  /** @type {any} */ config;
  /** @type {any} */ stats;

  constructor(options) {
    Object.assign(this, options);
  }

  /**
   * Renders ticks, guides, and labels for a logarithmic scale.
   * @return {Object} {ticks: VElement[], labels: VElement[], guides: VElement[]}
   */
  render() {
    const {type, config, stats} = this;
    /** @type {{ticks: any[], labels: any[], guides: any[]}} */
    const elements = {ticks: [], labels: [], guides: []};
    const {min, max} = stats[type];

    // Clamp min to at least 1 for log scale (log10(0) is -Infinity)
    const logMin = Math.max(min, 1);
    const logMinPow = Math.floor(Math.log10(logMin));
    const logMaxPow = Math.ceil(Math.log10(Math.max(max, 1)));
    const logRange = logMaxPow - logMinPow;

    if (logRange <= 0) {
      // Fallback: data doesn't span enough range for log scale
      return elements;
    }

    const ticks = logRange + 1;

    for (let i = 0; i < ticks; i++) {
      const power = logMinPow + i;
      const value = Math.pow(10, power);
      const position = Util.formatNumber((i / logRange) * 100);

      if (position > 100) continue;

      // For y-axis, invert position (0% is top, 100% is bottom)
      const displayPosition = type === 'y' ? Util.formatNumber(100 - position) : position;

      elements.ticks.push(createTick(type, displayPosition));

      const guide = createGuide(type, i, ticks, displayPosition, config);
      if (guide) elements.guides.push(guide);

      let labelText = formatLogLabel(value);
      labelText = applyLabelFormat(labelText, type, config);
      elements.labels.push(createLabel(type, displayPosition, labelText));
    }

    return elements;
  }
}

/**
 * Format a log scale value. Uses compact notation for large numbers.
 * @param {number} value
 * @return {string}
 */
function formatLogLabel(value) {
  if (value >= 1000000) return (value / 1000000) + 'M';
  if (value >= 1000) return (value / 1000) + 'K';
  return String(value);
}

export { LogScale };
