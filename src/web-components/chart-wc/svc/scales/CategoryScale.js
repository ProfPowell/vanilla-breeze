import * as Util from '../utils/Utils.js';
import {createTick, createGuide, createLabel, applyLabelFormat} from './LinearScale.js';

/**
 * Category scale for associative (key-value) data.
 * Handles bar/column centering and key-based labels.
 */
class CategoryScale {
  /** @type {any} */ type;
  /** @type {any} */ config;
  /** @type {any} */ stats;
  /** @type {any} */ chartType;

  constructor(options) {
    Object.assign(this, options);
  }

  /**
   * Renders ticks, guides, and labels for a category scale.
   * @returns {object} {ticks: VElement[], labels: VElement[], guides: VElement[]}
   */
  render() {
    const {type, config, stats} = this;
    /** @type {{ticks: any[], labels: any[], guides: any[]}} */
    const elements = {ticks: [], labels: [], guides: []};
    const {ticks, step, max} = stats[type];
    const chartType = this.chartType;
    const isBarColumn = (chartType === 'bar' || chartType === 'column');
    const isKeyAxis = (type === 'x' && config.plot.vertical) || (type === 'y' && !config.plot.vertical);

    for (let index = 0; index < ticks; index++) {
      let position;
      let dataIndex;

      if (isBarColumn && isKeyAxis) {
        // Center position on bar/column nodes
        const halfBarWidth = stats[type].scaleFactor / 2;
        const percentageOfTick = ticks <= 1 ? 0 : (index / (ticks - 1));
        dataIndex = Math.floor((stats[type].scaleLength - 1) * percentageOfTick);
        if (dataIndex === stats[type].scaleLength) {
          dataIndex--;
        }
        position = Util.formatNumber(dataIndex * stats[type].scaleFactor + halfBarWidth);
      } else if (isKeyAxis) {
        // Line/area: the first key sits at 0% and the last at 100%. Position
        // from the key index, not from the rounded scaleFactor: 6 x 16.67
        // is 100.02, which the > 100 check below used to drop, losing the
        // last label, tick and guide.
        dataIndex = index * step;
        const lastIndex = stats[type].scaleLength - 1;
        if (dataIndex > lastIndex) continue;
        position = Util.formatNumber(lastIndex > 0 ? (dataIndex / lastIndex) * 100 : 0);
      } else {
        position = Util.formatNumber(index * step * stats[type].scaleFactor);
      }

      if (position > 100) continue;

      // Ticks
      elements.ticks.push(createTick(type, position));

      // Guides
      const guide = createGuide(type, index, ticks, position, config);
      if (guide) elements.guides.push(guide);

      // Labels — use key text from stats
      let labelText;
      if (type === 'x' && config.plot.vertical) {
        const keyIndex = dataIndex ?? Math.round(index * (stats.x.keys.length - 1) / Math.max(ticks - 1, 1));
        labelText = `${stats.x.keys[keyIndex]}`;
      } else if (type === 'y' && !config.plot.vertical) {
        const keyIndex = dataIndex ?? Math.round(index * (stats.y.keys.length - 1) / Math.max(ticks - 1, 1));
        labelText = `${stats.y.keys[keyIndex]}`;
      } else {
        // Value axis for category data — numeric labels
        labelText = (type === 'x')
          ? `${(index * step)}`
          : `${max - (index * step)}`;
      }

      labelText = applyLabelFormat(labelText, type, config);
      const label = createLabel(type, position, labelText);
      // A line/area x label at the right edge ends at its tick instead of
      // being centred on it, so it stays inside the chart.
      if (type === 'x' && isKeyAxis && !isBarColumn && index > 0 && position === 100) {
        label.options.class.push('scale-label-x-end');
      }
      elements.labels.push(label);
    }
    return elements;
  }
}

export { CategoryScale };
