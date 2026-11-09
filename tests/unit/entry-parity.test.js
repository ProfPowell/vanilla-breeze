/**
 * Parity guards for the JS entry points and their lazy-load table.
 *
 * Sibling of bundle-parity.test.js, which covers the CSS graph. Same disease,
 * different half of the framework: hand-maintained parallel copies that drift
 * silently.
 *
 * Two invariants live here.
 *
 *   1. GUARDS COME FROM ONE TABLE. main.js, main-core.js and main-autoload.js
 *      each used to carry their own list of
 *      `if (document.querySelector(SEL)) import(MOD)` lines. main-core.js — the
 *      entry the production docs site ships — had 2 of main.js's 19, so ~17
 *      enhancements were dead in production with nothing to indicate it. Guards
 *      now derive from src/lib/lazy-guards.js, and an inline guard in an entry
 *      is a test failure.
 *
 *   2. core ⊆ full and extras ⊆ full. web-components/core.js imported 8 modules
 *      the full barrel lacked and extras.js imported 13, so components shipped
 *      live in the CDN bundles and inert in dev demos loading /src/main.js.
 *
 * Plus the guard table's own health: selectors must agree with the selector the
 * target module actually registers, and every module must exist.
 *
 * Run: node --test tests/unit/entry-parity.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CORE_GUARDS } from '../../src/lib/lazy-guards.js';
import { EXTRAS_GUARDS, FULL_GUARDS } from '../../src/lib/lazy-guards-full.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => readFileSync(resolve(root, rel), 'utf8');

const ENTRIES = ['src/main.js', 'src/main-core.js', 'src/main-autoload.js'];

/** Static import/re-export specifiers in a JS module, in source order. */
const specifiers = (rel) =>
  [...read(rel).matchAll(/^(?:import|export)\s+(?:[^'"]*from\s*)?['"]([^'"]+)['"]/gm)].map(
    (m) => m[1],
  );

/** Resolve a relative specifier against its importer, as a repo-relative path. */
const resolveFrom = (importerRel, spec) =>
  relative(root, resolve(root, dirname(importerRel), spec));

/**
 * Every module a file statically pulls in, with the given barrels expanded one
 * level so the core and full graphs are comparable — main.js reaches components
 * through web-components/index.js while main-core.js reaches them through
 * web-components/core.js, and those two specifiers are never going to match.
 *
 * @param {string} rel
 * @param {string[]} [expand] - repo-relative barrels to inline.
 * @returns {Set<string>}
 */
function graph(rel, expand = []) {
  const out = new Set();
  for (const spec of specifiers(rel)) {
    const target = resolveFrom(rel, spec);
    if (expand.includes(target)) {
      for (const nested of specifiers(target)) out.add(resolveFrom(target, nested));
    } else {
      out.add(target);
    }
  }
  return out;
}

/**
 * Split a selector list on top-level commas — `:is(img, video)[data-mock]` is
 * one selector, not two.
 *
 * @param {string} selector
 * @returns {string[]}
 */
function splitSelectorList(selector) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of selector) {
    if (char === '(' || char === '[') depth++;
    else if (char === ')' || char === ']') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * The literal specifier out of each guard's `load` arrow, in table order. Read
 * from source rather than called, so the check does not need a DOM. Matching
 * only the `load:` form keeps the prose examples in each file's header out of
 * the result.
 *
 * @param {string} rel
 * @returns {string[]}
 */
const guardSpecifiers = (rel) =>
  [...read(rel).matchAll(/load:\s*\(\)\s*=>\s*import\('([^']+)'\)/g)].map((m) => m[1]);

/** @typedef {import('../../src/lib/lazy-guards.js').LazyGuard} LazyGuard */

/**
 * Both halves of the table, paired with the file that declares them.
 * @type {Array<[string, readonly LazyGuard[]]>}
 */
const TABLES = [
  ['src/lib/lazy-guards.js', CORE_GUARDS],
  ['src/lib/lazy-guards-full.js', EXTRAS_GUARDS],
];

describe('lazy-load guards derive from one table', () => {
  for (const entry of ENTRIES) {
    it(`${entry} declares no inline querySelector guard`, () => {
      const inline = read(entry)
        .split('\n')
        .filter((line) => /querySelector\(/.test(line) && /import\(/.test(line));
      assert.deepEqual(
        inline,
        [],
        `Move these into src/lib/lazy-guards.js — an inline guard is invisible ` +
          `to the other two entries, which is how enhancements ship dead:\n` +
          inline.join('\n'),
      );
    });

    it(`${entry} runs the shared table`, () => {
      const source = read(entry);
      assert.match(
        source,
        /import \{ run(Core|Full)Guards \} from '\.\/lib\/lazy-guards(-full)?\.js'/,
        `${entry} must import its guard runner from the shared table.`,
      );
      assert.match(
        source,
        /^run(Core|Full)Guards\(\);$/m,
        `${entry} must call its guard runner.`,
      );
    });
  }

  it('only the core entry imports the core-only half of the table', () => {
    // main-core.js must NOT reach lazy-guards-full.js: esbuild inlines every
    // dynamic import reachable from an entry, so importing the full table would
    // pull the markdown/emoji/highlights modules into the slim bundle (+24 KB
    // gzip) purely to never run them.
    assert.match(read('src/main-core.js'), /runCoreGuards\(\);/);
    assert.doesNotMatch(
      read('src/main-core.js'),
      /lazy-guards-full/,
      'main-core.js must not import the full guard table — it drags the ' +
        'extras-tier modules into the slim bundle.',
    );
    for (const entry of ['src/main.js', 'src/main-autoload.js']) {
      assert.match(read(entry), /runFullGuards\(\);/);
    }
  });

  it('the full set is the core set plus the extras set', () => {
    assert.deepEqual(
      FULL_GUARDS.map((g) => g.selector),
      [...CORE_GUARDS, ...EXTRAS_GUARDS].map((g) => g.selector),
    );
  });
});

describe('guard table health', () => {
  for (const [file, table] of TABLES) {
    it(`every guard in ${file} points at a module that exists`, () => {
      // The load functions hold literal specifiers so esbuild can resolve them;
      // read them back out of the source to check the files are real.
      const targets = guardSpecifiers(file);
      assert.equal(
        targets.length,
        table.length,
        'Every guard must use a literal import() specifier.',
      );
      const missing = targets.filter((spec) => !existsSync(resolve(root, 'src/lib', spec)));
      assert.deepEqual(missing, [], 'Guard targets that do not exist on disk.');
    });
  }

  it('no selector is guarded twice', () => {
    const seen = new Set();
    const duplicates = [];
    for (const { selector } of FULL_GUARDS) {
      if (seen.has(selector)) duplicates.push(selector);
      seen.add(selector);
    }
    assert.deepEqual(duplicates, [], 'Duplicate guard selectors in the table.');
  });

  it('guard selectors match the selector each module registers', () => {
    // A module that calls registerInit(SELECTOR, …) only ever enhances
    // SELECTOR. A guard broader than that fetches and evaluates the module for
    // markup it will never touch (main.js guarded [data-floating-label] while
    // the module only handles form-field[data-floating-label]); a guard
    // narrower than that leaves matching markup unenhanced.
    const mismatches = [];
    for (const [file, table] of TABLES) {
      const specs = guardSpecifiers(file);
      table.forEach((guard, i) => {
        const moduleSource = readFileSync(resolve(root, 'src/lib', specs[i]), 'utf8');
        if (!/registerInit\(SELECTOR/.test(moduleSource)) return;
        const declared = moduleSource.match(/^const SELECTOR = '([^']+)';/m);
        if (!declared) return;

        const guarded = splitSelectorList(guard.selector);
        const uncovered = splitSelectorList(declared[1]).filter(
          (part) => !guarded.includes(part),
        );
        if (uncovered.length) {
          mismatches.push(
            `${specs[i]} registers "${declared[1]}" but the guard is ` +
              `"${guard.selector}" (missing: ${uncovered.join(', ')})`,
          );
        }
      });
    }

    assert.deepEqual(mismatches, [], mismatches.join('\n'));
  });
});

describe('every full-barrel util is reachable from the core and autoload entries', () => {
  // web-components/index.js (the full barrel, and what dev demos load via
  // /src/main.js) statically imports every utils/*-init.js. The core and
  // autoload entries do not import that barrel, so a util only reaches them
  // through a static import in their own graph or through a guard. A util with
  // neither works in dev demos and is dead in vanilla-breeze-core.js and the
  // autoload bundle (built demo pages) — how [data-audio-playlist] shipped.
  const guarded = new Set(
    [...guardSpecifiers('src/lib/lazy-guards.js'), ...guardSpecifiers('src/lib/lazy-guards-full.js')]
      .map((spec) => resolveFrom('src/lib/lazy-guards.js', spec)),
  );
  const utilInits = [...graph('src/web-components/index.js')].filter((m) =>
    /^src\/utils\/.+-init\.js$/.test(m),
  );

  /** @type {Array<[string, string[]]>} */
  const REACH_ENTRIES = [
    ['src/main-core.js', ['src/web-components/core.js']],
    ['src/main-autoload.js', ['src/web-components/core.js']],
  ];
  for (const [entry, expand] of REACH_ENTRIES) {
    it(`${entry} reaches every utils/*-init.js the full barrel imports`, () => {
      const reachable = graph(entry, expand);
      // The slim core bundle deliberately leaves the extras tier out: pages
      // pair it with vanilla-breeze-extras.js, which carries those utils.
      const extrasTier = entry === 'src/main-core.js'
        ? new Set([
            ...graph('src/web-components/extras.js'),
            ...guardSpecifiers('src/lib/lazy-guards-full.js').map((spec) =>
              resolveFrom('src/lib/lazy-guards-full.js', spec),
            ),
          ])
        : new Set();
      const dead = utilInits.filter(
        (m) => !reachable.has(m) && !guarded.has(m) && !extrasTier.has(m),
      );
      assert.deepEqual(
        dead,
        [],
        `These utils are live in /src/main.js but never load from ${entry}. ` +
          `Add a guard to src/lib/lazy-guards.js or lazy-guards-full.js (or a static import):\n  ${dead.join('\n  ')}`,
      );
    });
  }

  it('[data-audio-playlist] is a core-tier guard', () => {
    assert.ok(
      CORE_GUARDS.some((g) => g.selector === '[data-audio-playlist]'),
      'audio-playlist-init.js needs a core guard so core and autoload pages load it.',
    );
  });
});

describe('core ⊆ full JS graph parity', () => {
  const full = graph('src/main.js', ['src/web-components/index.js']);

  it('no module reaches src/main.js through a bare specifier', () => {
    // src/web-components/index.js is loaded raw over HTTP by dev demos, so
    // anything statically reachable from the full barrel must be resolvable by
    // a browser with no import map. (marked is vendored for this reason, kdkb.)
    const bare = [...full].filter(
      (spec) => !spec.startsWith('src/') && !spec.startsWith('node:'),
    );
    assert.deepEqual(
      bare,
      [],
      'A bare specifier in the full barrel graph kills /src/main.js in dev — ' +
        'every component stops registering, not just this one.',
    );
  });

  /** @type {Array<[string, string, string[]]>} */
  const SUBSET_ENTRIES = [
    ['web-components/core.js', 'src/main-core.js', ['src/web-components/core.js']],
    ['web-components/extras.js', 'src/web-components/extras.js', []],
  ];
  for (const [label, rel, expand] of SUBSET_ENTRIES) {
    it(`${label} imports nothing the full entry graph lacks`, () => {
      const orphans = [...graph(rel, expand)].filter(
        (spec) =>
          !full.has(spec) &&
          !spec.startsWith('src/lib/lazy-guards'),
      );
      assert.deepEqual(
        orphans,
        [],
        `These modules ship in a CDN bundle but never reach src/main.js, so ` +
          `they are inert in dev demos and in the full bundle. Add them to ` +
          `src/web-components/index.js:\n  ${orphans.join('\n  ')}`,
      );
    });
  }
});
