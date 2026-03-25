/**
 * VB Theme Bridge for SVC Charts
 *
 * Reads Vanilla Breeze design tokens (CSS custom properties) from the DOM
 * and converts them into SVC chart configuration (palette, axis colors, etc.).
 */

const SERIES_COUNT = 6;

/**
 * Read the VB chart palette from computed styles.
 * Returns an array of hex colors derived from --chart-series-1 through --chart-series-6.
 * @param {Element} element - The element to read computed styles from
 * @returns {string[]} Array of color strings
 */
export function getVBPalette(element) {
  const style = getComputedStyle(element);
  const colors = [];

  for (let i = 1; i <= SERIES_COUNT; i++) {
    const value = style.getPropertyValue(`--chart-series-${i}`).trim();
    if (value) colors.push(value);
  }

  return colors.length > 0 ? colors : null;
}

/**
 * Read VB chart tokens and return a partial SVC config object.
 * @param {Element} element - The element to read computed styles from
 * @returns {object} SVC config fragment with style and axis properties
 */
export function getVBChartConfig(element) {
  const style = getComputedStyle(element);
  const config = {};

  const labelColor = style.getPropertyValue('--chart-label-color').trim();
  const axisColor = style.getPropertyValue('--chart-axis-color').trim();
  const gridColor = style.getPropertyValue('--chart-grid-color').trim();
  const surface = style.getPropertyValue('--color-surface').trim();
  const textColor = style.getPropertyValue('--color-text').trim();

  if (labelColor || axisColor || gridColor) {
    config.style = {};
    if (labelColor) config.style.color = labelColor;
  }

  // Palette from VB tokens
  const palette = getVBPalette(element);
  if (palette) {
    config.palette = palette;
  }

  return config;
}
