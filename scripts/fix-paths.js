#!/usr/bin/env node
/**
 * Post-build script to fix paths for GitHub Pages deployment
 *
 * Rewrites absolute paths in built HTML/JS files to include the base URL.
 * Uses negative lookahead so paths already prefixed are not doubled.
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

// Remove trailing slash for consistent handling
const base = BASE_URL.replace(/\/$/, '');
// Escape for use in regex
const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

console.log(`Rewriting paths with base URL: ${base}`);

let fixedFiles = 0;

/**
 * Build regex that matches an absolute path NOT already prefixed.
 * E.g. href="/docs/" matches, but href="/vanilla-breeze/docs/" does not.
 */
function makePatterns(attr) {
  // Match attr="/..." where / is not followed by the base path (minus leading slash)
  // Also skip protocol-relative URLs (//), hash-only (#), and data URIs
  const baseDir = base.slice(1); // "vanilla-breeze"
  return new RegExp(
    `${attr}="\\/((?!${baseDir}\\/|\\/).)`,
    'g'
  );
}

// HTML attribute patterns
const htmlPatterns = [
  { regex: makePatterns('href'), attr: 'href' },
  { regex: makePatterns('src'), attr: 'src' },
  { regex: makePatterns('action'), attr: 'action' },
  { regex: makePatterns('srcset'), attr: 'srcset' },
];

// Also fix meta refresh redirects: content="0;url=/..."
const metaRefreshRegex = new RegExp(
  `content="(\\d+;url=)\\/((?!${base.slice(1)}\\/|\\/).)`,
  'g'
);

function processHtmlFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const original = content;

  for (const { regex, attr } of htmlPatterns) {
    // Reset lastIndex since we reuse the regex
    regex.lastIndex = 0;
    content = content.replace(regex, `${attr}="${base}/$1`);
  }

  // Fix meta refresh URLs
  metaRefreshRegex.lastIndex = 0;
  content = content.replace(metaRefreshRegex, `content="$1${base}/$2`);

  if (content !== original) {
    writeFileSync(filePath, content);
    fixedFiles++;
    console.log(`  Fixed: ${filePath}`);
  }
}

function processJsFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const original = content;

  // Fix icon paths: '/src/icons' -> '/vanilla-breeze/src/icons'
  const baseDir = base.slice(1);
  content = content.replace(
    new RegExp(`(['"])\\/(src\\/icons)(?!.*${baseDir})`, 'g'),
    `$1${base}/$2`
  );

  if (content !== original) {
    writeFileSync(filePath, content);
    fixedFiles++;
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

processDirectory(DIST_DIR);

console.log(`Path rewriting complete! (${fixedFiles} files updated)`);
