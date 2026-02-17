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

  // CSS entry point
  css: isDev ? '/src/main.css' : '/cdn/vanilla-breeze.css',

  // JS entry point
  js: isDev ? '/src/main.js' : '/cdn/vanilla-breeze.js',

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
