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
import { gzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const CDN = join(DIST, 'cdn');

// Read version from package.json for build injection
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
const VERSION = pkg.version;

// Common esbuild options for JS builds
const JS_DEFAULTS = {
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2022'],
  legalComments: 'none',
  sourcemap: 'linked',
  define: {
    '__VB_VERSION__': JSON.stringify(VERSION),
  },
};

// Common esbuild options for CSS builds
const CSS_DEFAULTS = {
  bundle: true,
  minify: true,
  sourcemap: 'linked',
};

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
      ...CSS_DEFAULTS,
      entryPoints: [join(themesDir, file)],
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
        ...JS_DEFAULTS,
        entryPoints: [logicPath],
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
        ...JS_DEFAULTS,
        entryPoints: [iconPath],
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
    ...CSS_DEFAULTS,
    entryPoints: [join(SRC, 'main-full.css')],
    outfile: join(CDN, 'vanilla-breeze.css'),
    logLevel: 'info',
  });

  // Build core CSS bundle (slim — no decorative themes)
  await esbuild.build({
    ...CSS_DEFAULTS,
    entryPoints: [join(SRC, 'main.css')],
    outfile: join(CDN, 'vanilla-breeze-core.css'),
    logLevel: 'info',
  });

  // Build charts CSS add-on
  const chartsPath = join(SRC, 'charts-standalone.css');
  if (existsSync(chartsPath)) {
    await esbuild.build({
      ...CSS_DEFAULTS,
      entryPoints: [chartsPath],
      outfile: join(CDN, 'vanilla-breeze-charts.css'),
      logLevel: 'info',
    });
  }

  // Build dev CSS add-on
  const devCssPath = join(SRC, 'dev.css');
  if (existsSync(devCssPath)) {
    await esbuild.build({
      ...CSS_DEFAULTS,
      entryPoints: [devCssPath],
      outfile: join(CDN, 'vanilla-breeze-dev.css'),
      logLevel: 'info',
    });
  }

  // Build full JS bundle (backwards compat)
  await esbuild.build({
    ...JS_DEFAULTS,
    entryPoints: [join(SRC, 'main.js')],
    outfile: join(CDN, 'vanilla-breeze.js'),
    logLevel: 'info',
    ignoreAnnotations: true,
  });

  // Build core JS bundle (slim)
  const coreJsPath = join(SRC, 'main-core.js');
  if (existsSync(coreJsPath)) {
    await esbuild.build({
      ...JS_DEFAULTS,
      entryPoints: [coreJsPath],
      outfile: join(CDN, 'vanilla-breeze-core.js'),
      logLevel: 'info',
      ignoreAnnotations: true,
    });
  }

  // Build extras JS bundle
  const extrasJsPath = join(SRC, 'web-components', 'extras.js');
  if (existsSync(extrasJsPath)) {
    await esbuild.build({
      ...JS_DEFAULTS,
      entryPoints: [extrasJsPath],
      outfile: join(CDN, 'vanilla-breeze-extras.js'),
      logLevel: 'info',
      ignoreAnnotations: true,
    });
  }

  // Build dev JS add-on
  const devJsPath = join(SRC, 'dev.js');
  if (existsSync(devJsPath)) {
    await esbuild.build({
      ...JS_DEFAULTS,
      entryPoints: [devJsPath],
      outfile: join(CDN, 'vanilla-breeze-dev.js'),
      logLevel: 'info',
      ignoreAnnotations: true,
    });
  }

  // Build Labs CSS bundle (experimental features)
  const labsCssPath = join(SRC, 'labs', 'labs.css');
  if (existsSync(labsCssPath)) {
    await esbuild.build({
      ...CSS_DEFAULTS,
      entryPoints: [labsCssPath],
      outfile: join(CDN, 'vanilla-breeze-labs.css'),
      logLevel: 'info',
    });
  }

  // Build Labs JS bundle (experimental features)
  const labsJsPath = join(SRC, 'labs', 'labs.js');
  if (existsSync(labsJsPath)) {
    await esbuild.build({
      ...JS_DEFAULTS,
      entryPoints: [labsJsPath],
      outfile: join(CDN, 'vanilla-breeze-labs.js'),
      logLevel: 'info',
    });
  }

  // Build extended emoji dataset (opt-in, separate file)
  const emojiExtPath = join(SRC, 'data', 'emoji-data-extended.js');
  if (existsSync(emojiExtPath)) {
    await esbuild.build({
      ...JS_DEFAULTS,
      entryPoints: [emojiExtPath],
      outfile: join(CDN, 'emoji-extended.js'),
      logLevel: 'info',
    });
  }

  // Build precache manifest for service worker
  const precacheManifest = [
    '/cdn/vanilla-breeze-core.css',
    '/cdn/vanilla-breeze-core.js',
    '/cdn/themes/manifest.json',
  ];

  // Build service worker (IIFE format, no sourcemap for SW)
  const swPath = join(SRC, 'sw.js');
  if (existsSync(swPath)) {
    await esbuild.build({
      entryPoints: [swPath],
      bundle: true,
      minify: true,
      format: 'iife',
      target: ['es2022'],
      legalComments: 'none',
      outfile: join(CDN, 'sw.js'),
      logLevel: 'info',
      define: {
        '__VB_VERSION__': JSON.stringify(VERSION),
        '__VB_PRECACHE__': JSON.stringify(precacheManifest),
      },
    });
  }

  // Build autoloader entry point
  const autoloadPath = join(SRC, 'main-autoload.js');
  if (existsSync(autoloadPath)) {
    await esbuild.build({
      ...JS_DEFAULTS,
      entryPoints: [autoloadPath],
      outfile: join(CDN, 'vanilla-breeze-autoload.js'),
      logLevel: 'info',
      ignoreAnnotations: true,
    });
  }

  // --- Individual builds ---
  await buildThemes();
  await buildComponents();

  // --- Size summary ---
  console.log(`\nCDN build complete (v${VERSION})`);
  console.log('─'.repeat(50));

  const coreBundles = ['vanilla-breeze-core.css', 'vanilla-breeze-core.js'];
  const fullBundles = ['vanilla-breeze.css', 'vanilla-breeze.js'];

  for (const [label, files] of [['Core', coreBundles], ['Full', fullBundles]]) {
    let rawTotal = 0;
    let gzipTotal = 0;
    for (const file of files) {
      const p = join(CDN, file);
      if (existsSync(p)) {
        const content = readFileSync(p);
        rawTotal += content.length;
        gzipTotal += gzipSync(content, { level: 9 }).length;
      }
    }
    console.log(`  ${label}: ${(rawTotal / 1024).toFixed(1)} KB raw, ${(gzipTotal / 1024).toFixed(1)} KB gzip`);
  }

  console.log('─'.repeat(50));
  console.log('  Files at: dist/cdn/');
}

buildCDN().catch(e => {
  console.error('CDN build failed:', e);
  process.exit(1);
});
