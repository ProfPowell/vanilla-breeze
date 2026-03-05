/**
 * Site metadata — available as `site.*` in all templates.
 *
 * ELEVENTY_ENV=development  → dev mode  (serve raw source files)
 * ELEVENTY_ENV=production   → prod mode (serve CDN bundles)
 */

const isDev = process.env.ELEVENTY_ENV === 'development';

export default {
  title: 'Vanilla Breeze',
  description: 'A layered HTML component system extending HTML\'s native model',
  url: 'https://profpowell.github.io/vanilla-breeze',
  isDev,

  // CSS entry point (core — no decorative themes, no charts, no dev utils)
  css: isDev ? '/src/main.css' : '/cdn/vanilla-breeze-core.css',

  // JS entry point (core components + extras)
  js: isDev ? '/src/main.js' : '/cdn/vanilla-breeze-core.js',

  // Extras JS (niche/heavy components — geo-map, emoji-picker, etc.)
  extrasJs: isDev ? null : '/cdn/vanilla-breeze-extras.js',

  // Pack loading (prod only — dev uses full main.js/main.css which includes everything)
  uiJs: isDev ? null : '/cdn/packs/ui.full.js',
  uiCss: isDev ? null : '/cdn/packs/ui.full.css',
  effectsJs: isDev ? null : '/cdn/packs/effects.full.js',
  effectsCss: isDev ? null : '/cdn/packs/effects.full.css',
  prototypeJs: isDev ? null : '/cdn/packs/prototype.full.js',
  prototypeCss: isDev ? null : '/cdn/packs/prototype.full.css',

  // Charts CSS add-on (per-page via includeCharts front matter)
  chartsCss: isDev ? '/src/charts-standalone.css' : '/cdn/vanilla-breeze-charts.css',

  // Dev CSS add-on (debug overlays, wireframe)
  devCss: isDev ? '/src/dev.css' : '/cdn/vanilla-breeze-dev.css',

  // Dev JS add-on (content model validation)
  devJs: isDev ? '/src/dev.js' : '/cdn/vanilla-breeze-dev.js',

  // View transitions CSS
  viewTransitionsCss: isDev ? '/src/utils/view-transitions.css' : null,

  // Doc-extras (code-block + browser-window) — always use the pre-built bundle
  // (11ty has no bundler at dev time, so bare imports don't work)
  docExtrasJs: '/cdn/doc-extras.js',

  // Docs CSS
  docsCss: '/docs/docs.css',

  // Labs CSS (optional, per-page)
  labsCss: isDev ? '/src/labs/labs.css' : '/cdn/vanilla-breeze-labs.css',
};
