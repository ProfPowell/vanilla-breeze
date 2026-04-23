#!/usr/bin/env node
/**
 * Assemble the final deployable site by merging build outputs into site/dist/pages/.
 *
 * Runs after `npm run build:cdn` (produces dist/cdn/) and `cd site && npm run build`
 * (produces site/dist/pages/). Copies CDN bundles, icons, VB source for dev
 * references, and demo/docs assets so the generated HTML's absolute paths resolve.
 *
 * Shared by GitHub Actions and Cloudflare Pages — don't inline these copies in CI.
 */

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const pagesDir = join(repoRoot, 'site', 'dist', 'pages');

if (!existsSync(pagesDir)) {
  console.error(`✘ site output not found at ${pagesDir}`);
  console.error('  Run `npm run build:cdn && cd site && npm run build` first.');
  process.exit(1);
}

const copyOpts = { recursive: true, force: true };

/**
 * Clear a symlink at the destination so cpSync can replace it with real files.
 * Local dev uses setup-preview.js which creates symlinks; CI paths are fresh.
 */
function clearSymlink(dest) {
  try {
    if (lstatSync(dest).isSymbolicLink()) rmSync(dest, { force: true });
  } catch { /* not present */ }
}

function copyDir(src, dest, { optional = false } = {}) {
  const absSrc = resolve(repoRoot, src);
  if (!existsSync(absSrc)) {
    if (optional) return;
    throw new Error(`source missing: ${src}`);
  }
  clearSymlink(dest);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(absSrc, dest, copyOpts);
  console.log(`  ${src} → ${dest.replace(repoRoot + '/', '')}`);
}

function copyFile(src, dest, { optional = false } = {}) {
  const absSrc = resolve(repoRoot, src);
  if (!existsSync(absSrc)) {
    if (optional) return;
    throw new Error(`source missing: ${src}`);
  }
  clearSymlink(dest);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(absSrc, dest, { force: true });
  console.log(`  ${src} → ${dest.replace(repoRoot + '/', '')}`);
}

console.log('Assembling site output...');

// Local dev uses setup-preview.js to create symlinks inside pagesDir (e.g.
// site/dist/pages/src → repo/src). Clear them up front so cpSync doesn't
// refuse to copy a source onto itself via symlink.
function clearSymlinksIn(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    try {
      if (lstatSync(full).isSymbolicLink()) rmSync(full, { force: true });
    } catch { /* ignore */ }
  }
}
clearSymlinksIn(pagesDir);
clearSymlinksIn(join(pagesDir, 'src'));
clearSymlinksIn(join(pagesDir, 'docs'));
clearSymlinksIn(join(pagesDir, 'docs', 'snippets'));
clearSymlinksIn(join(pagesDir, 'docs', 'patterns'));


// CDN bundles (referenced as /cdn/… in generated HTML)
copyDir('dist/cdn', join(pagesDir, 'cdn'));

// Icons under /src/icons/…
copyDir('src/icons', join(pagesDir, 'src', 'icons'));

// VB source for dev references (/src/base/…, /src/tokens/…, etc.)
//
// Demo HTML files load /src/main.js and /src/main-full.css raw. Both of
// these transitively import from the dirs below — any missing one causes
// the browser to 404 and reject the asset with a MIME-type mismatch.
//
// To audit: grep the tree for /src/<dir>/ references from demos/ and
// follow the static-import chain from src/main.js, src/main-full.css,
// and src/main-autoload.js.
const srcDirs = [
  'base',
  'tokens',
  'native-elements',
  'custom-elements',
  'web-components',
  'utils',
  'lib',
  'charts',
  'shapes',    // imported transitively from utils/index.css
  'effects',   // imported by main.js / main-autoload.js
  'data',      // emoji-picker dynamic imports (emoji-data-extended.js)
  'labs',      // labs.css referenced by lab demos
  'packs',     // design-system / icons / kawaii / memphis / fonts demos
];
for (const d of srcDirs) {
  copyDir(join('src', d), join(pagesDir, 'src', d));
}

// Loose CSS/JS files at src/*.{css,js}
const srcRoot = join(repoRoot, 'src');
for (const entry of readdirSync(srcRoot)) {
  const full = join(srcRoot, entry);
  if (statSync(full).isFile() && /\.(css|js)$/.test(entry)) {
    copyFile(join('src', entry), join(pagesDir, 'src', entry));
  }
}

// Demo HTML and docs CSS under /docs/…
// Use dist/demos/ (post-rewrite) so iframed demos reference the bundled
// CDN assets (/cdn/vanilla-breeze-autoload.js etc.) instead of the raw
// /src/main.js — the raw path fans out to 20+ individual logic.js
// requests per iframe, with each one doing a 304-revalidate roundtrip
// on repeat visits. The pre-build step (build:demos, wired into the
// build:site-assets npm script) produces dist/demos/ with those paths
// rewritten.
// Cloudflare Pages response headers — sets Cache-Control on /cdn/*
// so assets don't revalidate on every page load (304 roundtrips).
copyFile('_headers', join(pagesDir, '_headers'));

copyDir('dist/demos/snippets/demos', join(pagesDir, 'docs', 'snippets', 'demos'));
copyDir('dist/demos/patterns/demos', join(pagesDir, 'docs', 'patterns', 'demos'));
copyFile('demos/docs.css', join(pagesDir, 'docs', 'docs.css'));
copyFile('demos/homepage.css', join(pagesDir, 'docs', 'homepage.css'));
copyDir('dist/demos/tools', join(pagesDir, 'docs', 'tools'), { optional: true });
copyDir('dist/demos/examples', join(pagesDir, 'docs', 'examples'), { optional: true });

// Alpenglow demo site. Local dev gets this via setup-preview.js as a
// symlink; CF Pages needs a real copy because symlinks don't survive the
// Pages artifact upload. Without this, /docs/alpenglow/ 200s with the VB
// home page HTML because CF Pages falls back to /index.html for missing
// routes (the bug the audit script surfaced).
copyDir('dist/demos/alpenglow', join(pagesDir, 'docs', 'alpenglow'), { optional: true });

console.log('✓ Site assembly complete');
