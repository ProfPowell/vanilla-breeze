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
import { resolve, dirname, relative } from 'node:path';
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

/**
 * Top-level statements of a stylesheet with comments stripped: each `@import`
 * (or other prelude ending in `;`) and each block's prelude. Nested content is
 * skipped by brace depth.
 */
const topLevel = (rel) => {
  const css = read(rel).replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  let depth = 0;
  let cur = '';
  let quote = null;
  for (const ch of css) {
    // Font @import URLs carry `;` inside their quotes (wght@400;700).
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      cur += ch;
      quote = ch;
    } else if (ch === '{') {
      if (depth === 0) out.push(`${cur.trim()} {`);
      depth++;
      cur = '';
    } else if (ch === '}') {
      depth--;
      cur = '';
    } else if (ch === ';' && depth === 0) {
      out.push(`${cur.trim()};`);
      cur = '';
    } else {
      cur += ch;
    }
  }
  return out;
};

describe('themes live in the bundle-theme layer', () => {
  // The cascade contract (src/main.css) reserves bundle-theme for themes, above
  // every framework layer and below packs. That only holds if every theme file
  // self-declares the layer: the bundled ones used to reach the bundle through
  // tokens/index.css (landing in the lowest layer) and the standalone CDN files
  // carried no @layer at all (landing above everything, packs included), so
  // the layer was declared everywhere and populated nowhere. Self-declaring
  // keeps dev (raw source links) and prod (esbuild output) identical.
  const themesDir = 'src/tokens/themes';
  const themeFiles = readdirSync(resolve(root, themesDir))
    .filter((name) => name.startsWith('_') && name.endsWith('.css'))
    .map((name) => `${themesDir}/${name}`);

  it('finds the theme files', () => {
    assert.ok(themeFiles.length > 40, `only ${themeFiles.length} theme files found`);
  });

  for (const file of themeFiles) {
    it(`${file} holds only @import lines and one @layer bundle-theme block at top level`, () => {
      const statements = topLevel(file);
      // _theme-template.css is documentation: every rule sits inside a comment.
      if (statements.length === 0) return;
      const layerBlocks = statements.filter((s) => s === '@layer bundle-theme {');
      const stray = statements.filter(
        (s) => s !== '@layer bundle-theme {' && !s.startsWith('@import '),
      );
      assert.equal(
        layerBlocks.length,
        1,
        `${file} must wrap its rules in exactly one top-level @layer bundle-theme { } block ` +
          `(found ${layerBlocks.length}). Font @imports stay above it.`,
      );
      assert.deepEqual(
        stray,
        [],
        `${file} has rules outside the bundle-theme layer — linked standalone they ` +
          `would be unlayered and beat every layer, packs included:\n  ${stray.join('\n  ')}`,
      );
    });
  }

  it('the bundled-theme barrel is imported by both entries without a layer() directive', () => {
    // Themes self-declare @layer bundle-theme, so importing the barrel with
    // layer(x) would nest them as x.bundle-theme — and importing it through
    // tokens/index.css is how they landed in the tokens layer before.
    for (const entry of ['src/main.css', 'src/main-core.css']) {
      const line = read(entry)
        .split('\n')
        .find((l) => /@import\s+["']\.\/tokens\/themes\/index\.css["']/.test(l));
      assert.ok(line, `${entry} must @import "./tokens/themes/index.css" directly.`);
      assert.doesNotMatch(
        line,
        /layer\s*\(/,
        `${entry} imports the theme barrel into a layer — that nests bundle-theme: ${line.trim()}`,
      );
    }
    assert.ok(
      !imports('src/tokens/index.css').some((spec) => spec.includes('themes/')),
      'src/tokens/index.css must not import the theme barrel — that puts themes in layer(tokens).',
    );
    const barrelStray = topLevel('src/tokens/themes/index.css').filter(
      (s) => !/^@import\s+["']\.\/_[\w-]+\.css["'];$/.test(s),
    );
    assert.deepEqual(barrelStray, [], 'src/tokens/themes/index.css must hold only theme @imports.');
  });
});

describe('standalone add-ons are layered', () => {
  // src/charts-standalone.css becomes /cdn/vanilla-breeze-charts.css, which
  // pages <link> beside the bundle. Unlayered it outranked every layer,
  // themes included (iocg); every import now lands in web-components. Order
  // safety across <link> positions comes from the CDN build's layer-order
  // prefix, the same mechanism the themes use.
  it('every import in src/charts-standalone.css lands in layer(web-components)', () => {
    const lines = read('src/charts-standalone.css')
      .split('\n')
      .filter((l) => /^@import\s/.test(l));
    assert.ok(lines.length >= 10, `only ${lines.length} imports found`);
    const unlayered = lines.filter((l) => !/layer\(web-components\)\s*;\s*$/.test(l));
    assert.deepEqual(unlayered, [], 'These charts imports would ship unlayered and beat every layer.');
  });
});

describe('the tokens layer holds custom properties only', () => {
  // main.css: "tokens: Design system variables. No selectors." Rules in the
  // tokens layer sit in the LOWEST layer and lose to every component rule —
  // backdrop's body padding and region elevation lived there for a year
  // (dtw6). Every file reachable from src/tokens/index.css may declare only
  // custom properties, plus the three root-level switches below.
  const ALLOWED = new Set([
    'color-scheme', // :root / [data-mode] light-dark hint
    'interpolate-size', // :root feature switch for animating to auto
    'transition', // :root transitions on the theme seed custom properties
  ]);
  const EXEMPT_AT = /^@(font-face|property|keyframes|counter-style|font-feature-values)\b/;

  /** Every file reachable from a barrel through relative @imports. */
  const reachable = (rel, seen = new Set()) => {
    if (seen.has(rel)) return seen;
    seen.add(rel);
    for (const spec of imports(rel)) {
      const target = resolve(dirname(resolve(root, rel)), spec);
      reachable(relative(root, target), seen);
    }
    return seen;
  };
  const files = [...reachable('src/tokens/index.css')];

  it('reaches the token files', () => {
    assert.ok(files.length > 15, `only ${files.length} files reachable from src/tokens/index.css`);
    assert.ok(!files.some((f) => f.includes('/themes/')), 'themes must not be reached from the tokens barrel');
  });

  for (const file of files) {
    it(`${file} declares no non-custom property in a selector rule`, () => {
      const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
      const stack = [];
      let buf = '';
      const offenders = [];
      for (const ch of css) {
        if (ch === '{') { stack.push(buf.trim().replace(/\s+/g, ' ')); buf = ''; }
        else if (ch === '}') { stack.pop(); buf = ''; }
        else if (ch === ';') {
          const decl = buf.trim();
          const prop = /^([a-z-]+)\s*:/.exec(decl)?.[1];
          if (prop && !prop.startsWith('--') && !ALLOWED.has(prop) && !stack.some((s) => EXEMPT_AT.test(s))) {
            offenders.push(`${stack.join(' > ')} :: ${decl.slice(0, 60)}`);
          }
          buf = '';
        } else buf += ch;
      }
      assert.deepEqual(
        offenders,
        [],
        `${file} carries application rules in the tokens layer — move them to src/utils/ (see dtw6):\n  ${offenders.join('\n  ')}`,
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
