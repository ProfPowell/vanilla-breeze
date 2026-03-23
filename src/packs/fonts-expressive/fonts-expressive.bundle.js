/**
 * Fonts Expressive Bundle — Manifest
 * Vanilla Breeze · Expressive & Color Fonts
 *
 * Nabla (COLR v1) + Honk + Kablammo.
 */

export const bundle = {
  name: 'fonts-expressive',
  version: '1.0.0',
  label: 'Expressive Fonts',
  description: 'Color and morphology fonts for hero/creative contexts: Nabla (COLR v1 3D depth), Honk (inflatable neon), Kablammo (comic impact).',

  css: [
    { role: 'theme', href: 'fonts-expressive.theme.css' },
  ],

  js: [],

  components: [],
  effects: [],

  fonts: [
    { family: 'Nabla',    file: 'nabla-variable.woff2',    weight: '400', style: 'normal', axes: ['EDPT', 'FLAT'], colr: 'v1' },
    { family: 'Honk',     file: 'honk-variable.woff2',     weight: '400', style: 'normal', axes: ['MORF', 'SHLN'] },
    { family: 'Kablammo', file: 'kablammo-variable.woff2',  weight: '400', style: 'normal', axes: ['MORF'] },
  ],

  tokenOverrides: [
    '--vb-font-nabla', '--vb-font-honk', '--vb-font-kablammo',
  ],
}
