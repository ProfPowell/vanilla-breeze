#!/usr/bin/env node
/**
 * Post-build script to fix paths for GitHub Pages deployment
 *
 * Rewrites absolute paths in built HTML files to include the base URL.
 * Only runs when BASE_URL environment variable is set.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.BASE_URL;
const DIST_DIR = 'dist';

if (!BASE_URL || BASE_URL === '/') {
  console.log('No BASE_URL set or BASE_URL is "/", skipping path rewriting');
  process.exit(0);
}

// Remove trailing slash from BASE_URL for consistent handling
const baseUrl = BASE_URL.replace(/\/$/, '');

console.log(`Rewriting paths with base URL: ${baseUrl}`);

// Patterns to rewrite - only rewrite paths that start with /docs/ or /src/
// These are internal site links that need the base URL prefix
const patterns = [
  // Navigation links: href="/docs/..." -> href="/vanilla-breeze/docs/..."
  { regex: /href="\/docs\//g, replacement: `href="${baseUrl}/docs/` },
  { regex: /href='\/docs\//g, replacement: `href='${baseUrl}/docs/` },
  // Source links: href="/src/..." -> href="/vanilla-breeze/src/..."
  { regex: /href="\/src\//g, replacement: `href="${baseUrl}/src/` },
  { regex: /href='\/src\//g, replacement: `href='${baseUrl}/src/` },
  // Script src: src="/src/..." -> src="/vanilla-breeze/src/..."
  { regex: /src="\/src\//g, replacement: `src="${baseUrl}/src/` },
  { regex: /src='\/src\//g, replacement: `src='${baseUrl}/src/` },
];

// Also fix JS files that reference /src/icons
const jsPatterns = [
  // Icon path in JS: '/src/icons' -> '/vanilla-breeze/src/icons'
  { regex: /'\/src\/icons'/g, replacement: `'${baseUrl}/src/icons'` },
  { regex: /"\/src\/icons"/g, replacement: `"${baseUrl}/src/icons"` },
];

function processHtmlFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  for (const { regex, replacement } of patterns) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      modified = true;
    }
  }

  if (modified) {
    writeFileSync(filePath, content);
    console.log(`  Fixed: ${filePath}`);
  }
}

function processJsFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  for (const { regex, replacement } of jsPatterns) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      modified = true;
    }
  }

  if (modified) {
    writeFileSync(filePath, content);
    console.log(`  Fixed JS: ${filePath}`);
  }
}

function processDirectory(dir) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.endsWith('.html')) {
      processHtmlFile(fullPath);
    } else if (entry.endsWith('.js')) {
      processJsFile(fullPath);
    }
  }
}

// Process all HTML and JS files in dist
processDirectory(DIST_DIR);

console.log('Path rewriting complete!');
