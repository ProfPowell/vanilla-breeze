/**
 * Gradient utilities — generate CSS gradient strings from stop data.
 */

/**
 * @typedef {{ color: string, position: number }} GradientStop
 */

/**
 * Generate a CSS gradient string from stops and options.
 * @param {GradientStop[]} stops
 * @param {{ type?: string, angle?: number, interpolation?: string }} opts
 * @returns {string}
 */
export function buildGradientCSS(stops, { type = 'linear', angle = 90, interpolation = 'oklab' } = {}) {
  if (stops.length < 2) return 'transparent';

  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const colorStops = sorted.map(s => `${s.color} ${s.position}%`).join(', ');
  const space = interpolation !== 'srgb' ? ` in ${interpolation}` : '';

  if (type === 'radial') {
    return `radial-gradient(circle${space}, ${colorStops})`;
  }
  return `linear-gradient(${angle}deg${space}, ${colorStops})`;
}

/**
 * Generate default stops from a comma-separated color string.
 * @param {string} colorsStr
 * @returns {GradientStop[]}
 */
export function parseColorStops(colorsStr) {
  if (!colorsStr) return defaultStops();

  const colors = colorsStr.split(',').map(c => c.trim()).filter(Boolean);
  if (colors.length < 2) return defaultStops();

  return colors.map((color, i) => ({
    color,
    position: Math.round((i / (colors.length - 1)) * 100),
  }));
}

/**
 * Default two-stop gradient.
 * @returns {GradientStop[]}
 */
export function defaultStops() {
  return [
    { color: '#6366f1', position: 0 },
    { color: '#ec4899', position: 100 },
  ];
}
