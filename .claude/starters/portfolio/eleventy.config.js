module.exports = function (eleventyConfig) {
  // Passthrough copy
  eleventyConfig.addPassthroughCopy('src/images');
  eleventyConfig.addPassthroughCopy('src/styles');

  // Collections
  eleventyConfig.addCollection('projects', function (collectionApi) {
    return collectionApi
      .getFilteredByGlob('src/projects/*.md')
      .sort((a, b) => (b.data.order || 0) - (a.data.order || 0));
  });

  // Filters
  eleventyConfig.addFilter('limit', (arr, limit) => arr.slice(0, limit));

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    templateFormats: ['njk', 'md', 'html'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
};
