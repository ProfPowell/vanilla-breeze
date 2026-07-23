/**
 * Bundle parity guards for the core vs full CSS graphs.
 *
 * The core bundle (src/main-core.css) and the full bundle (src/main.css) are
 * built from hand-maintained barrel files. Historically they drifted: core.css
 * gained imports the full barrel never got, the full barrel gained imports core
 * never got, and the @property block was forked between the two entries — so a
 * component could ship unstyled in one bundle and styled in the other, and
 * theme-seed transitions snapped instead of interpolating on core.
 *
 * These tests encode the two invariants that make that class of bug impossible
 * to reintroduce silently:
 *
 *   1. core ⊆ full — the slim bundle may omit imports, but must never contain
 *      an import the full bundle lacks.
 *   2. Both entries register the SAME @property set, which is guaranteed
 *      structurally by both importing src/properties.css rather than each
 *      carrying its own copy.
 *
 * Run: node --test tests/unit/bundle-parity.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

/** Relative import specifiers in a CSS barrel, in source order. */
const imports = (rel) =>
  [...read(rel).matchAll(/@import\s+["']([^"']+)["']/g)].map((m) => m[1]);

/** Names of every @property registered in a file. Comments are stripped first —
 *  several files legitimately *mention* a registration in prose. */
const properties = (rel) =>
  [...read(rel).replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@property\s+(--[\w-]+)/g)].map(
    (m) => m[1],
  );

describe('core ⊆ full barrel parity', () => {
  for (const [core, full] of [
    ['src/custom-elements/core.css', 'src/custom-elements/index.css'],
    ['src/web-components/core.css', 'src/web-components/index.css'],
  ]) {
    it(`${core} imports nothing missing from ${full}`, () => {
      const fullSet = new Set(imports(full));
      const orphans = imports(core).filter((spec) => !fullSet.has(spec));
      assert.deepEqual(
        orphans,
        [],
        `These are imported by the core barrel but not the full one, so they ` +
          `ship styled in the slim bundle and unstyled in the full bundle. ` +
          `Add them to ${full}.`,
      );
    });
  }
});

describe('@property registration parity', () => {
  const entries = ['src/main.css', 'src/main-core.css'];

  for (const entry of entries) {
    it(`${entry} imports the shared @property file instead of forking it`, () => {
      assert.ok(
        imports(entry).includes('./properties.css'),
        `${entry} must @import "./properties.css" so both bundles register the same set.`,
      );
      assert.deepEqual(
        properties(entry),
        [],
        `${entry} declares @property inline. Move it to src/properties.css — ` +
          `an inline block is exactly how the core/full sets drifted before.`,
      );
    });
  }

  it('the shared file is imported without a layer() directive', () => {
    // @property is ignored inside @layer, and esbuild can drop a layered one
    // entirely — which breaks [data-icon] masks and theme-seed interpolation.
    for (const entry of entries) {
      const line = read(entry)
        .split('\n')
        .find((l) => l.includes('./properties.css'));
      assert.ok(line, `${entry} has no properties.css import`);
      assert.ok(
        !/layer\s*\(/.test(line),
        `${entry} imports properties.css into a cascade layer: ${line.trim()}`,
      );
    }
  });

  it('no layered stylesheet declares @property', () => {
    // Everything under src/ except the entry points and properties.css reaches
    // a bundle through an @import ... layer(...) directive. @property is
    // ignored inside a cascade layer, so a registration written there is dead:
    // the property stays unregistered, which means no interpolation, no type
    // checking, and no initial-value fallback.
    //
    // Only the directories below reach a bundle through layer(). src/labs/ is
    // its own esbuild entry point and src/packs/*.css are <link>ed directly, so
    // their registrations land at top level and are legitimate.
    const layeredRoots = [
      'src/base',
      'src/custom-elements',
      'src/native-elements',
      'src/tokens',
      'src/utils',
      'src/web-components',
      'src/charts',
    ];
    const offenders = [];
    const walk = (dir) => {
      for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(rel);
        else if (entry.name.endsWith('.css')) {
          for (const name of properties(rel)) offenders.push(`${rel} → ${name}`);
        }
      }
    };
    layeredRoots.forEach(walk);
    assert.deepEqual(
      offenders,
      [],
      'Move these registrations to src/properties.css — inside @layer they are ignored.',
    );
  });

  it('registers every theme seed that colors.css transitions', () => {
    // colors.css declares a transition on these seeds. An unregistered custom
    // property is not interpolable, so the theme switch snaps instead.
    const registered = new Set(properties('src/properties.css'));
    for (const seed of [
      '--hue-primary',
      '--hue-secondary',
      '--hue-accent',
      '--lightness-primary',
      '--lightness-secondary',
      '--lightness-accent',
      '--chroma-primary',
      '--chroma-secondary',
      '--chroma-accent',
      '--chroma-surface-tint',
    ]) {
      assert.ok(registered.has(seed), `${seed} is not registered in src/properties.css`);
    }
  });
});
