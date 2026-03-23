/**
 * Icons Bundle — Manifest
 * Vanilla Breeze · Material Symbols
 *
 * Variable icon font with FILL, wght, GRAD, opsz axes.
 * Coexists with <icon-wc> SVG icon system.
 */

export const bundle = {
  name: 'icons',
  version: '1.0.0',
  label: 'Material Symbols Icons',
  description: 'Material Symbols Outlined variable icon font. Context-aware weight and optical size. Attractor animations via data-vb-attract.',

  css: [
    { role: 'theme',   href: 'icons.theme.css' },
    { role: 'effects', href: 'icons.effects.css' },
  ],

  js: [
    { role: 'effects', src: 'icons.effects.js' },
  ],

  components: [],

  effects: [
    { name: 'attract-pulse',   selector: '[data-vb-attract="pulse"]',   type: 'css' },
    { name: 'attract-beat',    selector: '[data-vb-attract="beat"]',    type: 'css' },
    { name: 'attract-breathe', selector: '[data-vb-attract="breathe"]', type: 'css' },
    { name: 'attract-bounce',  selector: '[data-vb-attract="bounce"]',  type: 'css' },
    { name: 'attract-wiggle',  selector: '[data-vb-attract="wiggle"]',  type: 'css' },
    { name: 'whimsy',          selector: '[data-vb-whimsy]',           type: 'js' },
  ],

  fonts: [
    { family: 'Material Symbols Outlined', file: 'material-symbols-outlined.woff2', weight: '100 700', style: 'normal', axes: ['FILL', 'wght', 'GRAD', 'opsz'] },
  ],

  tokenOverrides: [
    '--vb-icon-fill', '--vb-icon-weight', '--vb-icon-grad', '--vb-icon-opsz',
  ],
}
