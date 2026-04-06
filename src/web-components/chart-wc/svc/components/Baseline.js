import VElement from '../DOM/VElement.js';

/**
 * Baseline class
 */
class Baseline {
  /**
   * Constructor for the baseline axis to designate positive and negative
   * values
   * @param {*} options
   */
  constructor(options) {
    Object.assign(this, options);
  }
  /**
   * Creates a baseline for either the x or y.
   * @return {object} The virtual dom element for the baseline
   */
  render() {
    const {type, stats, stroke, width} = this;
    const {min, max} = stats[type];
    const intervalLength = Math.abs(max - min);
    const distanceToZero = Math.abs(min);
    const originPoint = (distanceToZero / intervalLength) * 100;

    if (type === 'x') {
      // Assuming this is negative, the distance to zero is:
      return new VElement('line', {
        'class': ['baseline', 'baseline-x'],
        'x1': (originPoint).toFixed(3) + '%',
        'y1': '0%',
        'x2': ((originPoint)).toFixed(3) + '%',
        'y2': '100%',
        'stroke': stroke,
        'stroke-width': width,
      });
    } else {
      return new VElement('line', {
        'class': ['baseline', 'baseline-y'],
        'x1': '0%',
        'y1': (100 - originPoint).toFixed(3) + '%',
        'x2': '100%',
        'y2': (100 - originPoint).toFixed(3) + '%',
        'stroke': stroke,
        'stroke-width': width,
      });
    }
  }
}

export default Baseline;
