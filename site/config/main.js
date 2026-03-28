/**
 * Cook build config for the Vanilla Breeze documentation site.
 */
export default {
  srcPath: 'src',
  distPath: 'dist',

  sitemap: {
    url: 'https://profpowell.github.io/vanilla-breeze',
  },

  // Directories that are used during build but not copied to dist
  buildOnlyPaths: ['layouts', 'includes'],

  // Custom plugins
  plugins: {
    before: ['generate-sidebars'],
    default: ['normalize-legacy-nunjucks', 'generate-api-tables', 'generate-indexes', 'render-dynamic-pages'],
    after: [],
  },
  pluginPath: 'plugins',

  // Disable features not needed for PoC
  images: { enabled: false },
  formats: { markdown: false, json: false, feed: null, llmsTxt: false },
  fragments: { enabled: false },

  // Components path (if we need Cook components)
  components: {
    path: 'components',
  },
};
