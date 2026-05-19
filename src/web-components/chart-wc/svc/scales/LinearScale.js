import { VElement } from '../DOM/VElement.js';
import * as Util from '../utils/Utils.js';

/**
 * Linear numeric scale for array-based data.
 * Handles positive, negative, and mixed ranges with numeric labels.
 */
class LinearScale {
  /** @type {any} */ type;
  /** @type {any} */ config;
  /** @type {any} */ stats;

  constructor(options) {
    Object.assign(this, options);
  }

  /**
   * Renders ticks, guides, and labels for a linear numeric scale.
   * @return {Object} {ticks: VElement[], labels: VElement[], guides: VElement[]}
   */
  render() {
    const {type, config, stats} = this;
    /** @type {{ticks: any[], labels: any[], guides: any[]}} */
    const elements = {ticks: [], labels: [], guides: []};
    const {min, max, ticks, step} = stats[type];

    for (let index = 0; index < ticks; index++) {
      const position = Util.formatNumber(index * step * stats[type].scaleFactor);

      if (position > 100) continue;

      // Ticks
      elements.ticks.push(createTick(type, position));

      // Guides
      const guide = createGuide(type, index, ticks, position, config);
      if (guide) elements.guides.push(guide);

      // Labels
      let labelText;
      if (type === 'x') {
        labelText = `${min + (index * step)}`;
      } else {
        labelText = `${max - (index * step)}`;
      }

      labelText = applyLabelFormat(labelText, type, config);
      elements.labels.push(createLabel(type, position, labelText));
    }
    return elements;
  }
}

/**
 * Create a tick VElement.
 * @param {string} type - 'x' or 'y'
 * @param {number} position - percentage position
 * @return {VElement}
 */
function createTick(type, position) {
  if (type === 'x') {
    return new VElement('line', {
      'x1': position + '%', 'y1': '0%',
      'x2': position + '%', 'y2': '100%',
      'class': ['ticks', 'ticks-x'],
    });
  }
  return new VElement('line', {
    'x1': '0%', 'y1': position + '%',
    'x2': '100%', 'y2': position + '%',
    'class': ['ticks', 'ticks-y'],
  });
}

/**
 * Create a guide VElement (or null if not applicable).
 * @param {string} type - 'x' or 'y'
 * @param {number} index - tick index
 * @param {number} ticks - total tick count
 * @param {number} position - percentage position
 * @param {Object} config
 * @return {VElement|null}
 */
function createGuide(type, index, ticks, position, config) {
  if (type === 'x') {
    if (index !== 0 && config.guides.x.enabled) {
      return new VElement('line', {
        'x1': position + '%', 'y1': '100%',
        'x2': position + '%', 'y2': '0%',
        'class': ['guides', 'guides-x'],
      });
    }
  } else {
    if (index !== ticks - 1 && config.guides.y.enabled) {
      return new VElement('line', {
        'x1': '0%', 'y1': position + '%',
        'x2': '100%', 'y2': position + '%',
        'class': ['guides', 'guides-y'],
      });
    }
  }
  return null;
}

/**
 * Create a label VElement.
 * @param {string} type - 'x' or 'y'
 * @param {number} position - percentage position
 * @param {string} text - label text
 * @return {VElement}
 */
function createLabel(type, position, text) {
  const prop = type === 'x' ? 'left' : 'top';
  const label = new VElement('div', {
    'style': `${prop}: ${position}%`,
    'class': ['scale-label', `scale-label-${type}`],
  });
  label.textContent = text;
  return label;
}

/**
 * Apply user-provided label format callback if configured.
 * @param {string} labelText
 * @param {string} type - 'x' or 'y'
 * @param {Object} config
 * @return {string}
 */
function applyLabelFormat(labelText, type, config) {
  if (type === 'x' && Util.propertyExists(config, 'scale.label.x.format')) {
    try {
      return config.scale.label.x.format(labelText);
    } catch (e) {
      console.warn('SVC: scale.label.x.format threw an error:', e);
    }
  } else if (type === 'y' && Util.propertyExists(config, 'scale.label.y.format')) {
    try {
      return config.scale.label.y.format(labelText);
    } catch (e) {
      console.warn('SVC: scale.label.y.format threw an error:', e);
    }
  }
  return labelText;
}

export { LinearScale };
// Re-export helpers for CategoryScale reuse
export {createTick, createGuide, createLabel, applyLabelFormat};
