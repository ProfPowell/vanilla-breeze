/* eslint-disable no-restricted-exports */
/**
 * Memphis Bundle — Manifest
 * Vanilla Breeze · Memphis Group (1981–88)
 */

export default {
  name: 'memphis',
  version: '1.0.0',
  label: 'Memphis',
  description: 'Memphis Group (1981–88) aesthetic: bold flat colour, geometric patterns, hard drop shadows, zigzag borders, anti-functionalist ornament.',

  css: ['memphis.theme.css', 'memphis.effects.css'],
  js: ['memphis.effects.js'],

  effects: [
    { name: 'zigzag', selector: '[data-effect~="memphis-zigzag"]', type: 'css' },
    { name: 'dots', selector: '[data-effect~="memphis-dots"]', type: 'css' },
    { name: 'stripe', selector: '[data-effect~="memphis-stripe"]', type: 'css' },
    { name: 'confetti', selector: '[data-effect~="memphis-confetti"]', type: 'css' },
    { name: 'squiggle', selector: '[data-effect~="memphis-squiggle"]', type: 'css' },
  ],

  components: [],

  tokenOverrides: {
    '--color-primary': 'oklch(58% 0.240 26)',
    '--radius-m': '0',
    '--font-display': '"Boogaloo", "Futura", sans-serif',
    '--font-sans': '"Outfit", "Century Gothic", sans-serif',
    '--font-mono': '"Space Mono", "Courier New", monospace',
    '--ease-default': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
}
