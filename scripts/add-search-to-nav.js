#!/usr/bin/env node
/**
 * Add search-wc to the web components navigation on all element pages
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DOCS = join(ROOT, 'docs');

function getHtmlFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

console.log('Adding search-wc to navigation...');
const htmlFiles = getHtmlFiles(DOCS);

let updatedCount = 0;

for (const filePath of htmlFiles) {
  let content = readFileSync(filePath, 'utf-8');

  // Skip if already has search-wc in nav
  if (content.includes('search-wc.html">search-wc</a>')) {
    continue;
  }

  // Add search-wc after theme-wc in the web components nav
  const pattern = /(<li><a href="\/docs\/elements\/web-components\/theme-wc\.html"[^>]*>theme-wc<\/a><\/li>)\n(\s*)(<li><a href="\/docs\/elements\/web-components\/icons\.html")/;

  if (pattern.test(content)) {
    content = content.replace(
      pattern,
      `$1\n$2<li><a href="/docs/elements/web-components/search-wc.html">search-wc</a></li>\n$2$3`
    );
    writeFileSync(filePath, content);
    updatedCount++;
    console.log(`  Updated: ${filePath.replace(ROOT, '')}`);
  }
}

console.log(`\nDone! Updated ${updatedCount} files.`);
