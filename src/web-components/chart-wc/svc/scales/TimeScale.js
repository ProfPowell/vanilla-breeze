import * as Util from '../utils/Utils.js';
import {createTick, createGuide, createLabel, applyLabelFormat} from './LinearScale.js';

/**
 * Time scale for date/time x-axes.
 * Handles date parsing and formatting using native Date and Intl APIs.
 * Zero dependencies.
 *
 * Data values should be timestamps (ms since epoch), ISO date strings,
 * or anything parseable by `new Date()`.
 */
class TimeScale {
  constructor(options) {
    Object.assign(this, options);
  }

  /**
   * Renders ticks, guides, and labels for a time scale.
   * @return {Object} {ticks: VElement[], labels: VElement[], guides: VElement[]}
   */
  render() {
    const {type, config, stats} = this;
    const elements = {ticks: [], labels: [], guides: []};
    const {min, max, ticks} = stats[type];

    const timeMin = toTimestamp(min);
    const timeMax = toTimestamp(max);
    const range = timeMax - timeMin;

    if (range <= 0 || !Number.isFinite(range)) {
      return elements;
    }

    const formatter = pickFormatter(range);
    const tickCount = Math.min(ticks, 12); // Cap at 12 ticks for readability

    for (let i = 0; i < tickCount; i++) {
      const fraction = i / Math.max(tickCount - 1, 1);
      const position = Util.formatNumber(fraction * 100);
      const timestamp = timeMin + (range * fraction);

      if (position > 100) continue;

      elements.ticks.push(createTick(type, position));

      const guide = createGuide(type, i, tickCount, position, config);
      if (guide) elements.guides.push(guide);

      let labelText = formatter(new Date(timestamp));
      labelText = applyLabelFormat(labelText, type, config);
      elements.labels.push(createLabel(type, position, labelText));
    }

    return elements;
  }
}

/**
 * Convert a value to a Unix timestamp in milliseconds.
 * @param {number|string|Date} value
 * @return {number}
 */
function toTimestamp(value) {
  if (typeof value === 'number') return value;
  const d = new Date(value);
  return d.getTime();
}

/**
 * Pick an appropriate date formatter based on the time range.
 * @param {number} rangeMs - total range in milliseconds
 * @return {Function} formatter(date) => string
 */
function pickFormatter(rangeMs) {
  const DAY = 86400000;
  const MONTH = DAY * 30;
  const YEAR = DAY * 365;

  if (rangeMs < DAY) {
    // Hours/minutes
    return (d) => d.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'});
  }
  if (rangeMs < MONTH) {
    // Days
    return (d) => d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
  }
  if (rangeMs < YEAR * 2) {
    // Months
    return (d) => d.toLocaleDateString(undefined, {month: 'short', year: '2-digit'});
  }
  // Years
  return (d) => d.toLocaleDateString(undefined, {year: 'numeric'});
}

export default TimeScale;
