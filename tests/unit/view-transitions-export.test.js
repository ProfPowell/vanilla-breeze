/**
 * The cross-document view-transitions opt-in ships as a package export.
 *
 * The docs used to point at `vanilla-breeze/utils/view-transitions.css`,
 * which no export resolved and no build produced (/cdn/utils/… was a 404).
 * The file is now built by scripts/build-cdn.js to dist/cdn/
 * view-transitions.css and exported as `vanilla-breeze/view-transitions-css`.
 * This checks the build config without running the build.
 *
 * Run: node --test tests/unit/view-transitions-export.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const build = readFileSync('scripts/build-cdn.js', 'utf8');

test('package.json exports ./view-transitions-css from dist/cdn', () => {
  assert.equal(pkg.exports['./view-transitions-css'], './dist/cdn/view-transitions.css');
  assert.ok(pkg.files.includes('dist/cdn/'), 'dist/cdn/ is published');
});

test('build-cdn.js builds src/utils/view-transitions.css to CDN/view-transitions.css', () => {
  assert.match(build, /^const CDN = join\(DIST, 'cdn'\);$/m, 'CDN is dist/cdn');
  assert.match(build, /^const DIST = join\(ROOT, 'dist'\);$/m, 'DIST is <root>/dist');
  const block = build.match(/entryPoints:\s*\[join\(SRC, 'utils', 'view-transitions\.css'\)\],\s*outfile:\s*join\(CDN, 'view-transitions\.css'\)/);
  assert.ok(block, 'esbuild entry for utils/view-transitions.css → join(CDN, "view-transitions.css")');
  // Bundled (not copied), so the vt-keyframes.css import is inlined.
  const call = build.slice(build.lastIndexOf('esbuild.build({', block.index), block.index);
  assert.match(call, /\.\.\.CSS_DEFAULTS/, 'built with CSS_DEFAULTS (bundle: true)');
  assert.match(build, /const CSS_DEFAULTS = \{\s*bundle: true/);
});

test('the source exists and is not part of the main bundles', () => {
  assert.ok(existsSync('src/utils/view-transitions.css'));
  for (const entry of ['src/main.css', 'src/main-core.css', 'src/utils/index.css']) {
    assert.doesNotMatch(readFileSync(entry, 'utf8'), /view-transitions\.css/, `${entry} must not opt every page in`);
  }
});
