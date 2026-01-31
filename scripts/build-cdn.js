#!/usr/bin/env node
/**
 * Build CDN distribution files using esbuild
 *
 * Creates stable-named bundled files for CDN distribution:
 * - cdn/vanilla-breeze.css (all CSS bundled, @imports resolved)
 * - cdn/vanilla-breeze.js (all JS bundled, ES module)
 *
 * These files can be referenced via GitHub Pages or unpkg after npm publish.
 */

import * as esbuild from 'esbuild';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const CDN = join(DIST, 'cdn');

// Ensure cdn directory exists
if (!existsSync(CDN)) {
  mkdirSync(CDN, { recursive: true });
}

async function buildCDN() {
  console.log('Building CDN files with esbuild...\n');

  // Build CSS bundle - esbuild resolves all @import statements
  const cssResult = await esbuild.build({
    entryPoints: [join(SRC, 'main.css')],
    bundle: true,
    minify: true,
    outfile: join(CDN, 'vanilla-breeze.css'),
    logLevel: 'info',
  });

  // Build JS bundle - bundles all imports into single ES module
  // ignoreSideEffects: false ensures all JS files are included even if
  // package.json sideEffects array would otherwise exclude them
  const jsResult = await esbuild.build({
    entryPoints: [join(SRC, 'main.js')],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: join(CDN, 'vanilla-breeze.js'),
    logLevel: 'info',
    ignoreAnnotations: true,  // Include all imports regardless of sideEffects
  });

  // Build Labs CSS bundle (experimental features)
  const labsCssPath = join(SRC, 'labs', 'labs.css');
  if (existsSync(labsCssPath)) {
    await esbuild.build({
      entryPoints: [labsCssPath],
      bundle: true,
      minify: true,
      outfile: join(CDN, 'vanilla-breeze-labs.css'),
      logLevel: 'info',
    });
  }

  // Build Labs JS bundle (experimental features)
  const labsJsPath = join(SRC, 'labs', 'labs.js');
  if (existsSync(labsJsPath)) {
    await esbuild.build({
      entryPoints: [labsJsPath],
      bundle: true,
      minify: true,
      format: 'esm',
      outfile: join(CDN, 'vanilla-breeze-labs.js'),
      logLevel: 'info',
    });
  }

  console.log('\nCDN files ready at dist/cdn/');
  console.log('After deployment, reference via:');
  console.log('  CSS: https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze.css');
  console.log('  JS:  https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze.js');
  console.log('  Labs CSS: https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze-labs.css');
  console.log('  Labs JS:  https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze-labs.js');
}

buildCDN().catch(e => {
  console.error('CDN build failed:', e);
  process.exit(1);
});
