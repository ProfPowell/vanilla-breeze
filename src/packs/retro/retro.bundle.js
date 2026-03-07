/**
 * Retro Bundle — Manifest
 * Vanilla Breeze · Retro / CRT
 *
 * Exports metadata only — does not register anything.
 * Used by tooling, devtools, and activateBundle().
 */

export const bundle = {
  name: 'retro',
  version: '1.0.0',
  label: 'Retro / CRT',
  description: 'Phosphor terminals, split-flap boards, VU meters. Peak 1979.',

  css: [
    { role: 'theme',   href: 'retro.theme.css' },
    { role: 'effects', href: 'retro.effects.css' },
  ],

  js: [
    { role: 'effects',    src: 'retro.effects.js' },
    { role: 'components', src: 'retro.components.js' },
  ],

  components: [],

  effects: [
    { name: 'flipboard',    selector: '[data-effect~="flipboard"]',    type: 'js' },
    { name: 'stamp',        selector: '[data-effect~="stamp"]',        type: 'js' },
    { name: 'blink',        selector: '[data-effect~="blink"]',        type: 'css' },
    { name: 'neon',         selector: '[data-effect~="neon"]',         type: 'css' },
    { name: 'text-3d',      selector: '[data-effect~="text-3d"]',      type: 'css' },
    { name: 'outline',      selector: '[data-effect~="outline"]',      type: 'css' },
    { name: 'hard-shadow',  selector: '[data-effect~="hard-shadow"]',  type: 'css' },
    { name: 'rainbow',      selector: '[data-effect~="rainbow"]',      type: 'css' },
    { name: 'marquee',      selector: '[data-effect~="marquee"]',      type: 'css' },
  ],

  tokenOverrides: [
    '--hue-primary', '--hue-secondary', '--hue-accent',
    '--color-primary', '--color-surface', '--color-surface-sunken',
    '--radius-s', '--radius-m', '--radius-l',
    '--font-mono', '--ease-out', '--shadow-m',
  ],
}
