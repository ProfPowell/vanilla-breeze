/**
 * Eleventy Configuration for Vanilla Breeze
 *
 * This is a starter configuration file for Eleventy projects
 * using Vanilla Breeze. Copy and customize for your project.
 */

module.exports = function(eleventyConfig) {
  // ==================== FILTERS ====================

  // Date formatting
  eleventyConfig.addFilter('dateFormat', (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  eleventyConfig.addFilter('dateToISO', (date) => {
    return new Date(date).toISOString();
  });

  // String helpers
  eleventyConfig.addFilter('slugify', (str) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  });

  eleventyConfig.addFilter('startsWith', (str, prefix) => {
    return str && str.startsWith(prefix);
  });

  // ==================== SHORTCODES ====================

  // Code block shortcode
  eleventyConfig.addPairedShortcode('codeBlock', (content, lang = '', filename = '') => {
    const langAttr = lang ? ` data-language="${lang}"` : '';
    const fileAttr = filename ? ` data-filename="${filename}"` : '';
    const codeClass = lang ? ` class="language-${lang}"` : '';

    return `<code-block${langAttr}${fileAttr}>
      <pre><code${codeClass}>${escapeHtml(content.trim())}</code></pre>
    </code-block>`;
  });

  // Browser window shortcode
  eleventyConfig.addShortcode('browserWindow', (src, url = 'https://example.com', title = 'Demo') => {
    const srcAttr = src ? ` src="${src}"` : '';
    return `<browser-window${srcAttr} url="${url}" title="${title}" shadow></browser-window>`;
  });

  // Icon shortcode
  eleventyConfig.addShortcode('icon', (name, size = 'md') => {
    return `<icon-wc name="${name}" size="${size}"></icon-wc>`;
  });

  // ==================== COLLECTIONS ====================

  // Blog posts collection
  eleventyConfig.addCollection('posts', (collectionApi) => {
    return collectionApi
      .getFilteredByGlob('src/blog/**/*.md')
      .sort((a, b) => b.date - a.date);
  });

  // Tags collection
  eleventyConfig.addCollection('tagList', (collectionApi) => {
    const tags = new Set();
    collectionApi.getAll().forEach((item) => {
      if (item.data.tags) {
        item.data.tags.forEach((tag) => {
          if (tag !== 'post' && tag !== 'all') {
            tags.add(tag);
          }
        });
      }
    });
    return [...tags].sort();
  });

  // ==================== PASSTHROUGH COPY ====================

  // Copy static assets
  eleventyConfig.addPassthroughCopy('src/css');
  eleventyConfig.addPassthroughCopy('src/js');
  eleventyConfig.addPassthroughCopy('src/images');
  eleventyConfig.addPassthroughCopy('src/fonts');
  eleventyConfig.addPassthroughCopy({ 'src/favicon.*': '/' });

  // ==================== LAYOUTS ====================

  // Add layout aliases
  eleventyConfig.addLayoutAlias('base', 'base.njk');
  eleventyConfig.addLayoutAlias('page', 'page.njk');
  eleventyConfig.addLayoutAlias('docs', 'docs.njk');
  eleventyConfig.addLayoutAlias('blog', 'blog.njk');

  // ==================== CONFIGURATION ====================

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      layouts: '_layouts',
      data: '_data'
    },
    templateFormats: ['njk', 'md', 'html'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk'
  };
};

// Helper function
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
