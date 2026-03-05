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

  components: [
    {
      tag: 'audio-player',
      contract: 'audio-player',
      label: 'Audio Player',
      load: () => import('./components/audio-player/audio-player.js'),
    },
  ],

  effects: [
    { name: 'flipboard',    selector: '[data-flipboard]',  type: 'js' },
    { name: 'stamp-filter', selector: '[data-stamp]',      type: 'js' },
    { name: 'blink',        selector: '[data-blink]',      type: 'css' },
    { name: 'neon',         selector: '[data-neon]',       type: 'css' },
    { name: 'text-3d',      selector: '[data-text-3d]',    type: 'css' },
    { name: 'outline',      selector: '[data-outline]',    type: 'css' },
    { name: 'hard-shadow', selector: '[data-hard-shadow]', type: 'css' },
    { name: 'stamp',        selector: '[data-stamp]',      type: 'css' },
    { name: 'rainbow',      selector: '[data-rainbow]',    type: 'css' },
    { name: 'marquee',      selector: '[data-marquee]',    type: 'css' },
  ],

  tokenOverrides: [
    '--hue-primary', '--hue-secondary', '--hue-accent',
    '--color-primary', '--color-surface', '--color-surface-sunken',
    '--radius-s', '--radius-m', '--radius-l',
    '--font-mono', '--ease-out', '--shadow-m',
  ],
}
