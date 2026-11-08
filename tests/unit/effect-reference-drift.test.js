/**
 * Effect reference drift gate.
 *
 * The data-effect catalogue and each effect's class / custom-property tables
 * are generated at build time (site/plugins/generate-effect-reference.js →
 * site/data/effectReference.js) from the effect CSS and JS. Only prose is
 * hand-written. This test fails when the two drift apart:
 *
 *   - every effect in the source has catalogue prose, and no prose describes
 *     an effect the source no longer has,
 *   - every class and custom property the source exposes has a description,
 *     and no description is left for one that is gone,
 *   - the data-effect page has a section and an options marker for every
 *     effect, and mentions no --vb-* property the effects do not read,
 *   - bundle badges follow real bundle membership (stamp ships its filter
 *     script wherever its CSS ships; the entrance effects are not "core").
 *
 * Run: node --test tests/unit/effect-reference-drift.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EFFECTS,
  PROP_DOCS,
  CLASS_DOCS,
  readEffects,
  shipsIn,
  propDoc,
  classDoc,
  renderCatalogue,
} from '../../site/data/effectReference.js';
import { GenerateEffectReference } from '../../site/plugins/generate-effect-reference.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (/** @type {string} */ p) => readFileSync(resolve(root, p), 'utf8');

const effects = readEffects(root);
const byName = new Map(effects.map((e) => [e.name, e]));
const page = read('site/src/pages/docs/attributes/data-effect.html');

describe('effect catalogue vs source', () => {
  it('finds the effects from CSS and JS', () => {
    for (const n of ['fade-in', 'reveal', 'typewriter', 'flipboard', 'stamp', 'rating', 'animate-image', 'depth-pulse', 'memphis-dots']) {
      assert.ok(byName.has(n), `${n} missing from the derived catalogue`);
    }
  });

  it('every source effect has prose, and all prose has an effect', () => {
    const source = new Set(effects.map((e) => e.name));
    const missing = [...source].filter((n) => !EFFECTS[n]);
    const stale = Object.keys(EFFECTS).filter((n) => !source.has(n));
    assert.deepEqual(missing, [], `effects without EFFECTS prose: ${missing.join(', ')}`);
    assert.deepEqual(stale, [], `EFFECTS prose for effects the source no longer has: ${stale.join(', ')}`);
  });

  it('every class and custom property has a description', () => {
    const gaps = [];
    for (const e of effects) {
      for (const c of e.classes) if (!classDoc(e.name, c)) gaps.push(`${e.name} .${c}`);
      for (const p of e.props) if (!propDoc(e.name, p.name)) gaps.push(`${e.name} ${p.name}`);
    }
    assert.deepEqual(gaps, []);
  });

  it('no description is left for a class or property that is gone', () => {
    const classes = new Set(effects.flatMap((e) => e.classes.flatMap((c) => [c, `${e.name}:${c}`])));
    const props = new Set(effects.flatMap((e) => e.props.flatMap((p) => [p.name, `${e.name}:${p.name}`])));
    assert.deepEqual(Object.keys(CLASS_DOCS).filter((k) => !classes.has(k)), []);
    assert.deepEqual(Object.keys(PROP_DOCS).filter((k) => !props.has(k)), []);
  });

  it('internal plumbing never shows up as an option', () => {
    for (const e of effects) {
      for (const p of e.props) assert.doesNotMatch(p.name, /^--(vb-anim-|_|vb-stagger-index)/, `${e.name} exposes ${p.name}`);
    }
  });

  it('real defaults are read from the source', () => {
    const def = (/** @type {string} */ e, /** @type {string} */ p) => byName.get(e)?.props.find((x) => x.name === p)?.default;
    assert.equal(def('pulse', '--vb-duration'), '1.5s');
    assert.equal(def('fade-in', '--vb-duration'), '300ms');
    assert.equal(def('slide-up', '--vb-slide-distance'), '40px');
    assert.equal(def('typewriter', '--vb-typewriter-speed'), '50ms');
    assert.equal(def('flipboard', '--vb-flip-ms'), '60ms');
    assert.equal(def('blink', '--vb-blink-count'), '5');
  });
});

describe('bundle badges follow real bundle membership', () => {
  const ships = (/** @type {string} */ n) => shipsIn(/** @type {any} */ (byName.get(n))).map((b) => b.id);

  it('entrance and loop effects are full-bundle, not core', () => {
    for (const n of ['fade-in', 'slide-up', 'pulse', 'blink', 'neon', 'marquee', 'stamp', 'flipboard']) {
      assert.ok(!ships(n).includes('core'), `${n} is badged core but core.css does not carry it`);
      assert.ok(ships(n).includes('full'), `${n} should ship in the full bundle`);
    }
  });

  it('core effects really ship in the core CSS and JS', () => {
    for (const n of ['reveal', 'highlight', 'shimmer', 'gradient-text']) assert.ok(ships(n).includes('core'), n);
  });

  it('the stamp filter script ships with every JS bundle paired with the stamp CSS', () => {
    const stamp = byName.get('stamp');
    assert.ok(stamp?.js, 'stamp registers a JS effect');
    for (const b of ['full', 'autoload', 'extras']) assert.ok(stamp.jsBundles.includes(b), `stamp.js missing from ${b}`);
  });

  it('pack effects are badged with their pack', () => {
    assert.deepEqual(ships('depth-pulse'), ['pack:fonts-expressive']);
    assert.deepEqual(ships('memphis-dots'), ['pack:memphis']);
    assert.ok(ships('typewriter').includes('pack:effects'));
    assert.ok(ships('particles').includes('pack:kawaii'));
  });
});

describe('data-effect page', () => {
  it('has the catalogue marker and renders it', async () => {
    assert.match(page, /\{\{\s*effectCatalogue\(\)\s*\}\}/);
    const file = { src: page };
    await new GenerateEffectReference({ file }).init();
    assert.doesNotMatch(file.src, /\{\{\s*effect/, 'unreplaced effect marker');
    assert.doesNotMatch(file.src, /unknown effect/);
    assert.match(renderCatalogue(root), /<code>memphis-zigzag<\/code>/);
  });

  it('has a section and options table for every effect it documents', () => {
    const markers = new Set([...page.matchAll(/effectOptions\("([a-z0-9-]+)"\)/g)].map((m) => m[1]));
    for (const e of effects) {
      const meta = EFFECTS[e.name];
      if (meta.href && !meta.href.startsWith('/docs/attributes/data-effect/')) {
        // Documented elsewhere; still listed in the catalogue.
        if (!e.name.startsWith('memphis-')) assert.ok(markers.has(e.name), `${e.name}: no effectOptions marker`);
        continue;
      }
      assert.match(page, new RegExp(`id="${meta.section}"`), `${e.name}: no #${meta.section} section`);
      assert.ok(markers.has(e.name), `${e.name}: no effectOptions marker`);
    }
    for (const m of markers) assert.ok(byName.has(m), `effectOptions("${m}") names no effect`);
  });

  it('mentions no --vb-* property the effects do not read', () => {
    const real = new Set(effects.flatMap((e) => e.props.map((p) => p.name)));
    const mentioned = new Set([...page.matchAll(/--vb-[a-z0-9-]+/g)].map((m) => m[0]));
    const invented = [...mentioned].filter((p) => !real.has(p));
    assert.deepEqual(invented, [], `undocumented-in-source properties on the page: ${invented.join(', ')}`);
  });
});
