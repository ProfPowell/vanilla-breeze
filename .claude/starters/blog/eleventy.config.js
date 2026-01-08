const rssPlugin = require('@11ty/eleventy-plugin-rss');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

module.exports = function (eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(rssPlugin);
  eleventyConfig.addPlugin(syntaxHighlight);

  // Pass through static assets
  eleventyConfig.addPassthroughCopy('src/styles');
  eleventyConfig.addPassthroughCopy('src/images');

  // Date filters
  eleventyConfig.addFilter('dateDisplay', (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  eleventyConfig.addFilter('dateISO', (date) => {
    return new Date(date).toISOString();
  });

  eleventyConfig.addFilter('dateRFC2822', (date) => {
    return new Date(date).toUTCString();
  });

  // Get posts collection (exclude drafts in production)
  eleventyConfig.addCollection('posts', (collectionApi) => {
    return collectionApi
      .getFilteredByGlob('src/posts/**/*.md')
      .filter((post) => {
        if (process.env.NODE_ENV === 'production') {
          return !post.data.draft;
        }
        return true;
      })
      .sort((a, b) => b.date - a.date);
  });

  // Get all unique tags
  eleventyConfig.addCollection('tagList', (collectionApi) => {
    const tagSet = new Set();
    collectionApi.getAll().forEach((item) => {
      if (item.data.tags) {
        item.data.tags.forEach((tag) => {
          if (tag !== 'posts') {
            tagSet.add(tag);
          }
        });
      }
    });
    return [...tagSet].sort();
  });

  // Count posts per tag
  eleventyConfig.addFilter('postsByTag', (posts, tag) => {
    return posts.filter((post) => post.data.tags && post.data.tags.includes(tag));
  });

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
};