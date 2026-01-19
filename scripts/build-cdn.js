#!/usr/bin/env node
/**
 * Build CDN distribution files
 *
 * Creates stable-named bundled files for CDN distribution:
 * - cdn/vanilla-breeze.css (all CSS bundled)
 * - cdn/vanilla-breeze.js (all JS bundled, ES module)
 *
 * These files can be referenced via GitHub Pages or unpkg after npm publish.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const CDN = join(DIST, 'cdn');

// Ensure cdn directory exists
if (!existsSync(CDN)) {
  mkdirSync(CDN, { recursive: true });
}

// Find the bundled main files in dist/assets
const assetsDir = join(DIST, 'assets');
if (!existsSync(assetsDir)) {
  console.error('Error: dist/assets not found. Run `npm run build` first.');
  process.exit(1);
}

const assets = readdirSync(assetsDir);

// Find main CSS file (main-*.css)
const mainCss = assets.find(f => f.startsWith('main-') && f.endsWith('.css'));
if (!mainCss) {
  console.error('Error: Could not find main CSS bundle in dist/assets');
  process.exit(1);
}

// Find main JS file (main-*.js)
const mainJs = assets.find(f => f.startsWith('main-') && f.endsWith('.js'));
if (!mainJs) {
  console.error('Error: Could not find main JS bundle in dist/assets');
  process.exit(1);
}

// Copy CSS
const cssContent = readFileSync(join(assetsDir, mainCss), 'utf-8');
writeFileSync(join(CDN, 'vanilla-breeze.css'), cssContent);
console.log(`Created: cdn/vanilla-breeze.css (${(cssContent.length / 1024).toFixed(1)}KB)`);

// Copy JS
const jsContent = readFileSync(join(assetsDir, mainJs), 'utf-8');
writeFileSync(join(CDN, 'vanilla-breeze.js'), jsContent);
console.log(`Created: cdn/vanilla-breeze.js (${(jsContent.length / 1024).toFixed(1)}KB)`);

console.log('\nCDN files ready at dist/cdn/');
console.log('After deployment, reference via:');
console.log('  CSS: https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze.css');
console.log('  JS:  https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze.js');
