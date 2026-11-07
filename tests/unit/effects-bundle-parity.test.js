/**
 * Effects runtime bundle parity.
 *
 * The VB effects runtime (src/lib/vb.js) reaches a bundle through any effect
 * module that imports it. Its built-in registrations live in two side-effect
 * modules: src/lib/vb-triggers.js (scroll, hover, click, time…) and
 * src/lib/vb-transitions.js (the data-transition presets). Only main.js and
 * main-autoload.js imported them, so on core, core+extras and effects-pack
 * pages — including the production docs site — every data-trigger did
 * nothing (entrance effects stayed hidden) and every data-transition preset
 * got an unnamed fallback.
 *
 * Invariant: every bundle entry whose static/dynamic import graph reaches
 * vb.js also reaches vb-triggers.js and vb-transitions.js.
 *
 * A built-bundle twin (tests/components/effects-bundle-parity.spec.js) checks
 * the registries on the real dist bundles after a build.
 *
 * Run: node --test tests/unit/effects-bundle-parity.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const src = resolve(root, 'src');

const RUNTIME = resolve(src, 'lib/vb.js');
const TRIGGERS = resolve(src, 'lib/vb-triggers.js');
const TRANSITIONS = resolve(src, 'lib/vb-transitions.js');

/** Every file the CDN build uses as a JS entry point (scripts/build-cdn.js). */
function entries() {
  const list = [
    'main.js', 'main-core.js', 'main-autoload.js', 'main-charts.js',
    'dev.js', 'doc-extras.js', 'web-components/extras.js',
  ].map((f) => resolve(src, f)).filter(existsSync);
  const packs = resolve(src, 'packs');
  for (const name of readdirSync(packs, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    for (const suffix of ['', '.effects', '.components', '.bundle']) {
      const file = join(packs, name, `${name}${suffix}.js`);
      if (existsSync(file)) list.push(file);
    }
  }
  return list;
}

const IMPORT_RE = /(?:^|[\s;])import\s*(?:[^'"()]*?\sfrom\s*)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|export\s+[^'"]*?\sfrom\s*['"]([^'"]+)['"]/g;

/** All local modules reachable from `file` (static + literal dynamic imports). */
function graph(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const code = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  for (const m of code.matchAll(IMPORT_RE)) {
    const spec = m[1] || m[2] || m[3];
    if (!spec || !spec.startsWith('.')) continue;
    const target = resolve(dirname(file), spec);
    if (existsSync(target) && target.endsWith('.js')) graph(target, seen);
  }
  return seen;
}

describe('effects runtime bundle parity', () => {
  const all = entries();

  it('finds the entries that bundle the runtime', () => {
    const withRuntime = all.filter((e) => graph(e).has(RUNTIME)).map((e) => relative(root, e));
    // Sanity: the known runtime carriers are detected (guards against the
    // import scanner silently matching nothing).
    for (const expected of ['src/main.js', 'src/main-core.js', 'src/main-autoload.js', 'src/web-components/extras.js', 'src/packs/effects/effects.js']) {
      assert.ok(withRuntime.includes(expected), `${expected} should bundle src/lib/vb.js`);
    }
  });

  for (const entry of all) {
    const rel = relative(root, entry);
    it(`${rel}: ships triggers + transition presets wherever it ships the runtime`, () => {
      const reach = graph(entry);
      if (!reach.has(RUNTIME)) return;
      assert.ok(reach.has(TRIGGERS), `${rel} bundles src/lib/vb.js but not src/lib/vb-triggers.js`);
      assert.ok(reach.has(TRANSITIONS), `${rel} bundles src/lib/vb.js but not src/lib/vb-transitions.js`);
    });
  }
});
