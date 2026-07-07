#!/usr/bin/env node
/**
 * Build production demo files
 *
 * Copies demo HTML files from demos/ to dist/demos/ with production
 * asset paths. Source demos reference /src/main.css and /src/main.js
 * which fan out to 300+ module requests per iframe — this rewrites
 * them to use the pre-built CDN bundles instead.
 *
 * Non-HTML assets (images, videos, etc.) are copied as-is.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEMOS = join(ROOT, 'demos');
const OUT = join(ROOT, 'dist', 'demos');

/** Directories containing demo HTML files (non-HTML files are copied verbatim) */
const DEMO_DIRS = [
  'examples/demos',
  'examples/fixtures',
  'patterns/demos',
  'snippets/demos',
  'alpenglow',
  'integrations/web-components',
];

/** Top-level files to copy verbatim */
const TOP_FILES = [
  'docs.css',
  'homepage.css',
];

/** Asset path replacements: source → production */
const REPLACEMENTS = [
  ['href="/src/main.css"',               'href="/cdn/vanilla-breeze.css"'],
  ['src="/src/main.js"',                 'src="/cdn/vanilla-breeze-autoload.js"'],
  ['src="/src/doc-extras.js"',            'src="/cdn/doc-extras.js"'],
  ['href="/src/charts-standalone.css"',   'href="/cdn/vanilla-breeze-charts.css"'],
  ['src="/src/charts-standalone.js"',     'src="/cdn/vanilla-breeze-charts.js"'],
];

/**
 * Regex replacements: raw theme source links → built per-theme CDN files
 * @type {Array<[RegExp, string]>}
 */
const REGEX_REPLACEMENTS = [
  [/href="\/src\/tokens\/themes\/_(?:brand|extreme)-([\w-]+)\.css"/g, 'href="/cdn/themes/$1.css"'],
];

let totalFiles = 0;
let rewrittenFiles = 0;

// --- Process each demo directory -------------------------------------------

for (const relDir of DEMO_DIRS) {
  const srcDir = join(DEMOS, relDir);
  const destDir = join(OUT, relDir);

  /** @type {string[]} */
  let entries;
  try {
    entries = /** @type {string[]} */ (readdirSync(srcDir, { recursive: true }));
  } catch {
    console.log(`  skip ${relDir}/ (not found)`);
    continue;
  }

  for (const entry of entries) {
    const srcPath = join(srcDir, entry);
    if (statSync(srcPath).isDirectory()) continue;

    const destPath = join(destDir, entry);
    mkdirSync(dirname(destPath), { recursive: true });
    totalFiles++;

    if (extname(entry) === '.html') {
      let html = readFileSync(srcPath, 'utf-8');
      let changed = false;

      for (const [from, to] of REPLACEMENTS) {
        if (html.includes(from)) {
          html = html.replaceAll(from, to);
          changed = true;
        }
      }

      for (const [pattern, to] of REGEX_REPLACEMENTS) {
        const next = html.replace(pattern, to);
        if (next !== html) {
          html = next;
          changed = true;
        }
      }

      writeFileSync(destPath, html);
      if (changed) rewrittenFiles++;
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// --- Copy top-level files --------------------------------------------------

for (const file of TOP_FILES) {
  const srcPath = join(DEMOS, file);
  const destPath = join(OUT, file);
  try {
    mkdirSync(dirname(destPath), { recursive: true });
    copyFileSync(srcPath, destPath);
    totalFiles++;
    console.log(`  copied ${file}`);
  } catch {
    console.log(`  skip ${file} (not found)`);
  }
}

// --- Summary ---------------------------------------------------------------

console.log(`\nbuild-demos: ${totalFiles} files processed, ${rewrittenFiles} rewritten`);
