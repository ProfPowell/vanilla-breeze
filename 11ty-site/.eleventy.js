import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

export default function(eleventyConfig) {
  // ----- Nunjucks configuration -----
  eleventyConfig.setNunjucksEnvironmentOptions({
    autoescape: false,   // HTML content must not be escaped
    throwOnUndefined: false,
  });

  // ----- Passthrough copies -----
  // VB library source (for dev mode — browser resolves native imports)
  eleventyConfig.addPassthroughCopy({ [join(ROOT, 'src')]: 'src' });

  // CDN bundles (for prod mode)
  eleventyConfig.addPassthroughCopy({ [join(ROOT, 'dist/cdn')]: 'cdn' });

  // Doc-specific CSS and demo HTML files
  eleventyConfig.addPassthroughCopy({ [join(ROOT, 'docs')]: 'docs' });

  // Static assets (favicons, etc.) — copy specific files to avoid
  // conflicts with the docs/ passthrough copy above
  eleventyConfig.addPassthroughCopy({ [join(ROOT, 'public/favicon.svg')]: 'favicon.svg' });
  eleventyConfig.addPassthroughCopy({ [join(ROOT, 'public/favicon-32x32.png')]: 'favicon-32x32.png' });
  eleventyConfig.addPassthroughCopy({ [join(ROOT, 'public/apple-touch-icon.png')]: 'apple-touch-icon.png' });
  eleventyConfig.addPassthroughCopy({ [join(ROOT, 'public/pagefind')]: 'pagefind' });

  // ----- Watch targets -----
  // Rebuild when VB source changes
  eleventyConfig.addWatchTarget(join(ROOT, 'src'));
  eleventyConfig.addWatchTarget(join(ROOT, 'docs'));

  // ----- Global data -----
  eleventyConfig.addGlobalData('pathPrefix', process.env.PATH_PREFIX || '/');

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    templateFormats: ['njk', 'html', 'md'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    pathPrefix: process.env.PATH_PREFIX || '/',
  };
}
