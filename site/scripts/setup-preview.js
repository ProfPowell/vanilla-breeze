#!/usr/bin/env node
/**
 * setup-preview.js — Set up asset symlinks and copies for local preview.
 *
 * After a Cook build, the dist/pages/ directory needs access to VB's
 * CDN bundles, source icons, demo HTML files, and docs CSS. This script
 * creates the necessary symlinks and copies.
 *
 * Usage: node scripts/setup-preview.js
 */
import { symlinkSync, existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, '../dist/pages');
const siteOutput = resolve(__dirname, '../../site-11ty/_site');
const vbSrc = resolve(__dirname, '../../src');

function link(target, linkPath) {
  if (existsSync(linkPath)) return;
  try {
    symlinkSync(target, linkPath);
    console.log(`  ✓ ${linkPath.replace(dist + '/', '')} → ${target}`);
  } catch (e) {
    console.log(`  ✗ ${linkPath}: ${e.message}`);
  }
}

function copy(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`  ✓ copied ${dest.replace(dist + '/', '')}`);
}

console.log('Setting up preview assets...\n');

// CDN bundles (CSS, JS, packs)
link(resolve(siteOutput, 'cdn'), resolve(dist, 'cdn'));

// VB source (icons, dev CSS/JS)
link(vbSrc, resolve(dist, 'src'));

// Demo HTML files
mkdirSync(resolve(dist, 'docs/snippets'), { recursive: true });
link(resolve(siteOutput, 'docs/snippets/demos'), resolve(dist, 'docs/snippets/demos'));

mkdirSync(resolve(dist, 'docs/patterns'), { recursive: true });
link(resolve(siteOutput, 'docs/patterns/demos'), resolve(dist, 'docs/patterns/demos'));

// Docs CSS
copy(resolve(siteOutput, 'docs/docs.css'), resolve(dist, 'docs/docs.css'));
copy(resolve(siteOutput, 'docs/homepage.css'), resolve(dist, 'docs/homepage.css'));

// Theme lab surfaces (for homepage theme preview iframe)
mkdirSync(resolve(dist, 'docs/tools/theme-lab'), { recursive: true });
link(resolve(siteOutput, 'docs/tools/theme-lab/surfaces'), resolve(dist, 'docs/tools/theme-lab/surfaces'));

// Favicons
copy(resolve(siteOutput, 'favicon.svg'), resolve(dist, 'favicon.svg'));
copy(resolve(siteOutput, 'favicon-32x32.png'), resolve(dist, 'favicon-32x32.png'));
copy(resolve(siteOutput, 'apple-touch-icon.png'), resolve(dist, 'apple-touch-icon.png'));

// Pagefind CSS/JS (if pagefind has been run)
// Already in dist/pages/pagefind/ from npx pagefind

console.log('\nDone. Run: npx http-server dist/pages -p 3456 -c-1');
