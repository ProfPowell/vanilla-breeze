{{#IF_FRAMEWORK_ELEVENTY}}
export default function(eleventyConfig) {
  // Pass through static assets
  eleventyConfig.addPassthroughCopy('src/assets');

  // Add date filter
  eleventyConfig.addFilter('readableDate', (dateObj) => {
    return new Date(dateObj).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // Create docs collection sorted by order
  eleventyConfig.addCollection('docs', (collectionApi) => {
    return collectionApi
      .getFilteredByGlob('src/docs/**/*.md')
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

{{#IF_CODE_HIGHLIGHTING_HIGHLIGHT_JS}}
  // Syntax highlighting with highlight.js
  const markdownIt = require('markdown-it');
  const highlightjs = require('highlight.js');

  const md = markdownIt({
    html: true,
    highlight: (str, lang) => {
      if (lang && highlightjs.getLanguage(lang)) {
        return highlightjs.highlight(str, { language: lang }).value;
      }
      return '';
    }
  });

  eleventyConfig.setLibrary('md', md);
{{/IF_CODE_HIGHLIGHTING_HIGHLIGHT_JS}}

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data'
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk'
  };
}
{{/IF_FRAMEWORK_ELEVENTY}}