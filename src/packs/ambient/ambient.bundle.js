/* eslint-disable no-restricted-exports */
/**
 * Ambient Bundle — Manifest
 * Vanilla Breeze · season, daypart, weather and occasion styling
 */

export default {
  name: 'ambient',
  version: '0.1.0',
  label: 'Ambient',
  description: 'Opt-in styling that follows the season, time of day, weather and calendar occasions at the author\'s place. State is data attributes on <html>; looks are decorative tokens.',

  css: ['ambient.theme.css'],
  js: ['ambient.core.js'],
  head: 'ambient.head.js',

  effects: [],
  components: [],

  attributes: [
    'data-ambient', 'data-ambient-surface', 'data-ambient-toggle', 'data-ambient-debug',
    'data-season', 'data-daypart', 'data-weather', 'data-weather-intensity', 'data-occasion', 'data-occasion-day',
  ],

  tokens: [
    '--ambient-hue', '--ambient-chroma', '--ambient-wash', '--ambient-warmth', '--ambient-blend',
    '--color-ambient', '--color-ambient-surface', '--ambient-icon',
  ],
}
