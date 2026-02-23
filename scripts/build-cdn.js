#!/usr/bin/env node
/**
 * Build CDN distribution files using esbuild
 *
 * Creates stable-named bundled files for CDN distribution:
 * - cdn/vanilla-breeze.css (full bundle, backwards compat)
 * - cdn/vanilla-breeze-core.css (slim, no decorative themes)
 * - cdn/vanilla-breeze-charts.css (charts add-on)
 * - cdn/vanilla-breeze-dev.css (debug/wireframe add-on)
 * - cdn/vanilla-breeze.js (full bundle, backwards compat)
 * - cdn/vanilla-breeze-core.js (slim, core components only)
 * - cdn/vanilla-breeze-extras.js (niche/heavy components)
 * - cdn/vanilla-breeze-dev.js (debug utilities)
 * - cdn/themes/*.css (individual theme files)
 * - cdn/themes/manifest.json (theme metadata)
 * - cdn/components/*.js (individual component files)
 * - cdn/components/manifest.json (component metadata)
 * - cdn/sw.js (service worker)
 *
 * These files can be referenced via GitHub Pages or unpkg after npm publish.
 */

import * as esbuild from 'esbuild';
import { mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const CDN = join(DIST, 'cdn');

// Ensure directories exist
for (const dir of [CDN, join(CDN, 'themes'), join(CDN, 'components')]) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Build individual theme CSS files and manifest
 */
async function buildThemes() {
  const themesDir = join(SRC, 'tokens', 'themes');
  const outDir = join(CDN, 'themes');
  const manifest = {};

  const files = readdirSync(themesDir).filter(f => {
    // Include brand and extreme themes, skip access, index, and template files
    if (!f.endsWith('.css')) return false;
    if (f.startsWith('_access-')) return false;
    if (f === 'index.css') return false;
    if (f.includes('template')) return false;
    return f.startsWith('_brand-') || f.startsWith('_extreme-');
  });

  console.log(`Building ${files.length} individual theme files...`);

  for (const file of files) {
    // Derive output name: _brand-ocean.css -> ocean.css, _extreme-cyber.css -> cyber.css
    const name = file
      .replace(/^_brand-/, '')
      .replace(/^_extreme-/, '');
    const themeId = name.replace('.css', '');

    const result = await esbuild.build({
      entryPoints: [join(themesDir, file)],
      bundle: true,
      minify: true,
      outfile: join(outDir, name),
      write: true,
      logLevel: 'silent',
    });

    const outPath = join(outDir, name);
    const size = statSync(outPath).size;
    manifest[themeId] = { file: name, size };
  }

  writeFileSync(
    join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`  ${files.length} themes → dist/cdn/themes/`);
  console.log(`  manifest.json written (${Object.keys(manifest).length} entries)`);
}

/**
 * Build individual component JS files and manifest
 */
async function buildComponents() {
  const wcDir = join(SRC, 'web-components');
  const outDir = join(CDN, 'components');
  const manifest = {};

  const dirs = readdirSync(wcDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`Building individual component files...`);
  let count = 0;

  for (const dir of dirs) {
    const logicPath = join(wcDir, dir, 'logic.js');
    if (!existsSync(logicPath)) continue;

    // Read the logic file to extract the tag name from customElements.define()
    const content = readFileSync(logicPath, 'utf-8');
    const defineMatch = content.match(/customElements\.define\(\s*['"]([^'"]+)['"]/);
    if (!defineMatch) continue;

    const tagName = defineMatch[1];

    try {
      await esbuild.build({
        entryPoints: [logicPath],
        bundle: true,
        minify: true,
        format: 'esm',
        outfile: join(outDir, `${dir}.js`),
        logLevel: 'silent',
        ignoreAnnotations: true,
      });

      const outPath = join(outDir, `${dir}.js`);
      const size = statSync(outPath).size;
      manifest[tagName] = { file: `${dir}.js`, size };
      count++;
    } catch {
      // Skip components that fail to build individually
      console.warn(`  Warning: skipped ${dir} (build error)`);
    }
  }

  // Also handle icon-wc which has a different file structure
  const iconPath = join(wcDir, 'icon-wc', 'icon-wc.js');
  if (existsSync(iconPath) && !manifest['x-icon']) {
    try {
      await esbuild.build({
        entryPoints: [iconPath],
        bundle: true,
        minify: true,
        format: 'esm',
        outfile: join(outDir, 'icon-wc.js'),
        logLevel: 'silent',
        ignoreAnnotations: true,
      });

      const outPath = join(outDir, 'icon-wc.js');
      const size = statSync(outPath).size;
      const iconContent = readFileSync(iconPath, 'utf-8');
      const iconDefine = iconContent.match(/customElements\.define\(\s*['"]([^'"]+)['"]/);
      if (iconDefine) {
        manifest[iconDefine[1]] = { file: 'icon-wc.js', size };
      }
    } catch {
      console.warn('  Warning: skipped icon-wc (build error)');
    }
  }

  writeFileSync(
    join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`  ${count} components → dist/cdn/components/`);
  console.log(`  manifest.json written (${Object.keys(manifest).length} entries)`);
}

async function buildCDN() {
  console.log('Building CDN files with esbuild...\n');

  // --- Full backwards-compatible bundles ---

  // Build full CSS bundle (backwards compat — includes all themes)
  await esbuild.build({
    entryPoints: [join(SRC, 'main-full.css')],
    bundle: true,
    minify: true,
    outfile: join(CDN, 'vanilla-breeze.css'),
    logLevel: 'info',
  });

  // Build core CSS bundle (slim — no decorative themes)
  await esbuild.build({
    entryPoints: [join(SRC, 'main.css')],
    bundle: true,
    minify: true,
    outfile: join(CDN, 'vanilla-breeze-core.css'),
    logLevel: 'info',
  });

  // Build charts CSS add-on
  const chartsPath = join(SRC, 'charts-standalone.css');
  if (existsSync(chartsPath)) {
    await esbuild.build({
      entryPoints: [chartsPath],
      bundle: true,
      minify: true,
      outfile: join(CDN, 'vanilla-breeze-charts.css'),
      logLevel: 'info',
    });
  }

  // Build dev CSS add-on
  const devCssPath = join(SRC, 'dev.css');
  if (existsSync(devCssPath)) {
    await esbuild.build({
      entryPoints: [devCssPath],
      bundle: true,
      minify: true,
      outfile: join(CDN, 'vanilla-breeze-dev.css'),
      logLevel: 'info',
    });
  }

  // Build full JS bundle (backwards compat)
  await esbuild.build({
    entryPoints: [join(SRC, 'main.js')],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: join(CDN, 'vanilla-breeze.js'),
    logLevel: 'info',
    ignoreAnnotations: true,
  });

  // Build core JS bundle (slim)
  const coreJsPath = join(SRC, 'main-core.js');
  if (existsSync(coreJsPath)) {
    await esbuild.build({
      entryPoints: [coreJsPath],
      bundle: true,
      minify: true,
      format: 'esm',
      outfile: join(CDN, 'vanilla-breeze-core.js'),
      logLevel: 'info',
      ignoreAnnotations: true,
    });
  }

  // Build extras JS bundle
  const extrasJsPath = join(SRC, 'web-components', 'extras.js');
  if (existsSync(extrasJsPath)) {
    await esbuild.build({
      entryPoints: [extrasJsPath],
      bundle: true,
      minify: true,
      format: 'esm',
      outfile: join(CDN, 'vanilla-breeze-extras.js'),
      logLevel: 'info',
      ignoreAnnotations: true,
    });
  }

  // Build dev JS add-on
  const devJsPath = join(SRC, 'dev.js');
  if (existsSync(devJsPath)) {
    await esbuild.build({
      entryPoints: [devJsPath],
      bundle: true,
      minify: true,
      format: 'esm',
      outfile: join(CDN, 'vanilla-breeze-dev.js'),
      logLevel: 'info',
      ignoreAnnotations: true,
    });
  }

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

  // Build extended emoji dataset (opt-in, separate file)
  const emojiExtPath = join(SRC, 'data', 'emoji-data-extended.js');
  if (existsSync(emojiExtPath)) {
    await esbuild.build({
      entryPoints: [emojiExtPath],
      bundle: true,
      minify: true,
      format: 'esm',
      outfile: join(CDN, 'emoji-extended.js'),
      logLevel: 'info',
    });
  }

  // Build service worker
  const swPath = join(SRC, 'sw.js');
  if (existsSync(swPath)) {
    await esbuild.build({
      entryPoints: [swPath],
      bundle: true,
      minify: true,
      format: 'iife',
      outfile: join(CDN, 'sw.js'),
      logLevel: 'info',
    });
  }

  // Build autoloader entry point
  const autoloadPath = join(SRC, 'main-autoload.js');
  if (existsSync(autoloadPath)) {
    await esbuild.build({
      entryPoints: [autoloadPath],
      bundle: true,
      minify: true,
      format: 'esm',
      outfile: join(CDN, 'vanilla-breeze-autoload.js'),
      logLevel: 'info',
      ignoreAnnotations: true,
    });
  }

  // --- Individual builds ---
  await buildThemes();
  await buildComponents();

  console.log('\nCDN files ready at dist/cdn/');
  console.log('After deployment, reference via:');
  console.log('  Full CSS:  https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze.css');
  console.log('  Core CSS:  https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze-core.css');
  console.log('  Full JS:   https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze.js');
  console.log('  Core JS:   https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze-core.js');
  console.log('  Extras JS: https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze-extras.js');
  console.log('  Charts:    https://profpowell.github.io/vanilla-breeze/cdn/vanilla-breeze-charts.css');
  console.log('  Themes:    https://profpowell.github.io/vanilla-breeze/cdn/themes/{name}.css');
}

buildCDN().catch(e => {
  console.error('CDN build failed:', e);
  process.exit(1);
});
