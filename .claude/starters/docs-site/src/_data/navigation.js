{{#IF_FRAMEWORK_ELEVENTY}}
/**
 * Navigation structure for documentation sidebar
 * Edit this file to customize the sidebar navigation
 */
export default {
  docs: [
    {
      title: 'Getting Started',
      items: [
        { title: 'Installation', url: '/docs/getting-started/installation/' },
        { title: 'Quick Start', url: '/docs/getting-started/quick-start/' }
      ]
    },
    {
      title: 'Guides',
      items: [
        { title: 'Configuration', url: '/docs/guides/configuration/' }
      ]
    },
    {
      title: 'API Reference',
      items: [
        { title: 'Overview', url: '/docs/api-reference/overview/' }
      ]
    }
  ]
};
{{/IF_FRAMEWORK_ELEVENTY}}