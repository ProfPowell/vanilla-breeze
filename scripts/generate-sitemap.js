#!/usr/bin/env node
/**
 * Generate site/dist/pages/sitemap.xml from the assembled deploy directory.
 *
 * Runs after assemble-site.js — at that point site/dist/pages/ is the final
 * shape Cloudflare Pages will serve. Walks the tree, picks one canonical URL
 * per route (the index.html in each directory), and writes the XML alongside
 * everything else so /sitemap.xml resolves on production.
 *
 * Cook ships its own sitemap plugin but it scans dist/ (not dist/pages/),
 * uses the wrong base URL, and writes outside the deploy dir — so this
 * replaces it. The Cook plugin is disabled by removing the `sitemap` block
 * from site/config/main.js.
 */

import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(__dirname);
const pagesDir = join(repoRoot, 'site', 'dist', 'pages');

const SITE_URL = process.env.SITE_URL || 'https://vanilla-breeze.com';

// Exclude paths that aren't standalone destinations.
const EXCLUDE = [
  /^\/cdn\//,                  // bundled JS/CSS
  /^\/src\//,                  // VB raw source served for dev refs
  /^\/pagefind\//,             // search index assets
  /^\/_/,                      // _headers, _routes.json, etc.
  /^\/404\b/,                  // error page
  /^\/docs\/snippets\/[^/]+\//, // demo embeds (snippets index itself stays)
  /^\/docs\/examples\/demos\//, // demo embed pages
  /^\/docs\/patterns\/demos\//, // demo embed pages
  /^\/docs\/tools\/.+\//,      // interactive tool sub-pages (tools index stays)
];

if (!existsSync(pagesDir)) {
  console.error(`✘ Pages dir not found: ${pagesDir}`);
  console.error('  Run the full build first.');
  process.exit(1);
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) yield* walk(path);
    else if (entry === 'index.html' || entry.endsWith('.html')) yield path;
  }
}

const today = new Date().toISOString().slice(0, 10);
const urls = new Set();

for (const path of walk(pagesDir)) {
  const rel = '/' + relative(pagesDir, path).split('\\').join('/');
  if (EXCLUDE.some(rx => rx.test(rel))) continue;
  // Canonicalise: index.html → trailing-slash URL; foo.html → /foo/
  const url = rel.endsWith('/index.html')
    ? rel.replace(/\/index\.html$/, '/')
    : rel.replace(/\.html$/, '/');
  urls.add(url || '/');
}

const sortedUrls = [...urls].sort();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sortedUrls.map(u => `  <url>
    <loc>${SITE_URL}${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync(join(pagesDir, 'sitemap.xml'), xml);
console.log(`✓ Generated sitemap.xml — ${sortedUrls.length} URLs at ${SITE_URL}`);
