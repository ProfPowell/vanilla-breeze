/**
 * Kawaii Bundle — Manifest
 * Vanilla Breeze · Kawaii / Cute
 */

export default {
  name: 'kawaii',
  version: '1.0.0',
  label: 'Kawaii / Cute',
  description: 'Pastel pink/mint/lavender palette, pill shapes, bouncy motion, Cherry Bomb One display font, sparkle effects.',

  css: ['kawaii.theme.css', 'kawaii.effects.css'],
  js: ['kawaii.effects.js'],

  effects: [
    { name: 'starburst', selector: '[data-starburst]', type: 'css' },
    { name: 'sparkle', selector: '[data-sparkle]', type: 'css' },
    { name: 'bounce', selector: '[data-bounce]', type: 'css' },
    { name: 'wiggle', selector: '[data-wiggle]', type: 'css' },
    { name: 'particles', selector: '[data-particles]', type: 'js' },
  ],

  components: [],

  tokenOverrides: {
    '--color-primary': 'oklch(55% 0.18 350)',
    '--radius-m': '1rem',
    '--font-sans': '"Nunito", "Quicksand", system-ui, sans-serif',
    '--font-display': '"Cherry Bomb One", "Nunito", cursive',
    '--ease-default': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
}
