/**
 * Fonts Display Bundle — Manifest
 * Vanilla Breeze · Display & Editorial Fonts
 *
 * Fraunces + Cormorant + Bodoni Moda.
 */

export const bundle = {
  name: 'fonts-display',
  version: '1.0.0',
  label: 'Display Fonts',
  description: 'Display and editorial variable fonts: Fraunces (WONK/SOFT axes), Cormorant (Garamond-lineage), Bodoni Moda (dramatic contrast).',

  css: [
    { role: 'theme', href: 'fonts-display.theme.css' },
  ],

  js: [],

  components: [],
  effects: [],

  fonts: [
    { family: 'Fraunces',    file: 'fraunces-variable.woff2',          weight: '100 900', style: 'normal', axes: ['wght', 'opsz', 'WONK', 'SOFT'] },
    { family: 'Fraunces',    file: 'fraunces-variable-italic.woff2',   weight: '100 900', style: 'italic', axes: ['wght', 'opsz', 'WONK', 'SOFT'] },
    { family: 'Cormorant',   file: 'cormorant-variable.woff2',         weight: '300 700', style: 'normal', axes: ['wght'] },
    { family: 'Cormorant',   file: 'cormorant-variable-italic.woff2',  weight: '300 700', style: 'italic', axes: ['wght'] },
    { family: 'Bodoni Moda', file: 'bodoni-moda-variable.woff2',       weight: '400 900', style: 'normal', axes: ['wght', 'opsz'] },
    { family: 'Bodoni Moda', file: 'bodoni-moda-variable-italic.woff2', weight: '400 900', style: 'italic', axes: ['wght', 'opsz'] },
  ],

  tokenOverrides: [
    '--font-display', '--vb-font-editorial', '--vb-font-dramatic',
  ],
}
