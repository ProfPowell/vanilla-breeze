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
 * @returns {string[]|null} Array of color strings, or null if none set
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
 * Read a CSS custom property, returning the trimmed value or null.
 * @param {CSSStyleDeclaration} style
 * @param {string} prop
 * @returns {string|null}
 */
function token(style, prop) {
  const v = style.getPropertyValue(prop).trim();
  return v || null;
}

/**
 * Read VB chart tokens and return a partial SVC config object.
 * @param {Element} element - The element to read computed styles from
 * @returns {object} SVC config fragment
 */
export function getVBChartConfig(element) {
  const style = getComputedStyle(element);
  const config = {};

  // Root style tokens
  const labelColor = token(style, '--chart-label-color');
  const fontFamily = token(style, '--chart-font-family');
  if (labelColor || fontFamily) {
    config.style = {};
    if (labelColor) config.style.color = labelColor;
    if (fontFamily) config.style['font-family'] = fontFamily;
  }

  // Axis tokens
  const axisColor = token(style, '--chart-axis-color');
  if (axisColor) {
    config.axis = {style: {stroke: axisColor}};
  }

  // Grid guide tokens
  const gridColor = token(style, '--chart-grid-color');
  if (gridColor) {
    config.guides = {style: {stroke: gridColor}};
  }

  // Baseline tokens
  const baselineColor = token(style, '--chart-baseline-color');
  if (baselineColor) {
    config.baseline = {style: {stroke: baselineColor}};
  }

  // Tick tokens
  const tickColor = token(style, '--chart-tick-color');
  if (tickColor) {
    config.ticks = {style: {stroke: tickColor}};
  }

  // Title tokens
  const titleColor = token(style, '--chart-title-color');
  const titleSize = token(style, '--chart-title-size');
  if (titleColor || titleSize) {
    config.title = config.title || {};
    config.title.style = {};
    if (titleColor) config.title.style.color = titleColor;
    if (titleSize) config.title.style['font-size'] = titleSize;
  }

  // Subtitle tokens
  const subtitleColor = token(style, '--chart-subtitle-color');
  const subtitleSize = token(style, '--chart-subtitle-size');
  if (subtitleColor || subtitleSize) {
    config.title = config.title || {};
    config.title.subtitle = config.title.subtitle || {};
    config.title.subtitle.style = {};
    if (subtitleColor) config.title.subtitle.style.color = subtitleColor;
    if (subtitleSize) config.title.subtitle.style['font-size'] = subtitleSize;
  }

  // Tooltip tokens
  const tooltipBg = token(style, '--chart-tooltip-bg');
  const tooltipColor = token(style, '--chart-tooltip-color');
  const tooltipShadow = token(style, '--chart-tooltip-shadow');
  if (tooltipBg || tooltipColor || tooltipShadow) {
    config.tooltip = config.tooltip || {};
    config.tooltip.label = config.tooltip.label || {};
    config.tooltip.label.style = {};
    if (tooltipBg) config.tooltip.label.style['background-color'] = tooltipBg;
    if (tooltipColor) config.tooltip.label.style.color = tooltipColor;
    if (tooltipShadow) config.tooltip.label.style['box-shadow'] = tooltipShadow;
  }

  // Palette from VB tokens
  const palette = getVBPalette(element);
  if (palette) {
    config.palette = palette;
  }

  return config;
}

/**
 * Create an SVC plugin that reads VB theme tokens at config resolution time.
 * Use this with SVC's plugin system: config.plugins = [createThemePlugin(element)]
 * @param {Element} element - The element to read computed styles from
 * @returns {Object} SVC plugin object
 */
export function createThemePlugin(element) {
  return {
    name: 'vb-theme-bridge',
    hooks: {
      configResolved({config}) {
        const themeConfig = getVBChartConfig(element);
        // Merge theme tokens into config (lowest priority — user config wins)
        if (themeConfig.style) {
          config.style = Object.assign({}, themeConfig.style, config.style);
        }
        if (themeConfig.palette && !config._paletteFromUser) {
          config.palette = themeConfig.palette;
        }
      },
    },
  };
}
