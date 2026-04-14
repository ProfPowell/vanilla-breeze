#!/usr/bin/env node
/**
 * setup-preview.js — Set up asset symlinks for local preview.
 *
 * After a Cook build, dist/pages/ needs access to VB's CDN bundles,
 * source icons, demo HTML files, and docs CSS.
 *
 * All paths point to the VB repo root — no external dependencies.
 */
import { symlinkSync, existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, '../dist/pages');
const repoRoot = resolve(__dirname, '../..');

function link(target, linkPath) {
  if (existsSync(linkPath)) return;
  if (!existsSync(target)) { console.log(`  ✗ skipped ${linkPath.replace(dist + '/', '')} (target missing: ${target})`); return; }
  try {
    symlinkSync(target, linkPath);
    console.log(`  ✓ ${linkPath.replace(dist + '/', '')}`);
  } catch (e) {
    console.log(`  ✗ ${linkPath.replace(dist + '/', '')}: ${e.message}`);
  }
}

function copy(src, dest) {
  if (!existsSync(src)) { console.log(`  ✗ skipped ${dest.replace(dist + '/', '')} (source missing)`); return; }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`  ✓ copied ${dest.replace(dist + '/', '')}`);
}

console.log('Setting up preview assets from VB repo...\n');

// CDN bundles (built by npm run build:cdn at repo root)
link(resolve(repoRoot, 'dist/cdn'), resolve(dist, 'cdn'));

// VB source (icons, dev CSS/JS)
link(resolve(repoRoot, 'src'), resolve(dist, 'src'));

// Demo HTML files — prefer built demos (dist/demos/) over raw source (demos/)
const builtDemos = resolve(repoRoot, 'dist/demos');

function demoSource(relPath) {
  const built = resolve(builtDemos, relPath);
  const raw   = resolve(repoRoot, 'demos', relPath);
  if (existsSync(built)) { console.log(`  (using built demos for ${relPath})`); return built; }
  return raw;
}

mkdirSync(resolve(dist, 'docs/snippets'), { recursive: true });
link(demoSource('snippets/demos'), resolve(dist, 'docs/snippets/demos'));

mkdirSync(resolve(dist, 'docs/patterns'), { recursive: true });
link(demoSource('patterns/demos'), resolve(dist, 'docs/patterns/demos'));

// Theme lab surfaces
mkdirSync(resolve(dist, 'docs/tools/theme-lab'), { recursive: true });
link(demoSource('tools/theme-lab/surfaces'), resolve(dist, 'docs/tools/theme-lab/surfaces'));

// Example demos
mkdirSync(resolve(dist, 'docs/examples'), { recursive: true });
link(demoSource('examples/demos'), resolve(dist, 'docs/examples/demos'));

// Alpenglow brand demo
link(demoSource('alpenglow'), resolve(dist, 'docs/alpenglow'));

// Docs CSS — prefer built copies
function demoCss(file) {
  const built = resolve(builtDemos, file);
  const raw   = resolve(repoRoot, 'demos', file);
  return existsSync(built) ? built : raw;
}

copy(demoCss('docs.css'), resolve(dist, 'docs/docs.css'));
copy(demoCss('homepage.css'), resolve(dist, 'docs/homepage.css'));

// Favicons
copy(resolve(repoRoot, 'demos/favicon.svg'), resolve(dist, 'favicon.svg'));
copy(resolve(repoRoot, 'demos/favicon-32x32.png'), resolve(dist, 'favicon-32x32.png'));
copy(resolve(repoRoot, 'demos/apple-touch-icon.png'), resolve(dist, 'apple-touch-icon.png'));

console.log('\nDone.');
