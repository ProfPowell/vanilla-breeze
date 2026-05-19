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
   * @return {Object} {ticks: VElement[], labels: VElement[], guides: VElement[]}
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
      elements.labels.push(createLabel(type, position, labelText));
    }
    return elements;
  }
}

export { CategoryScale };
