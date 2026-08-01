/**
 * The layout vocabulary is parsed out of the CSS, never hand-listed.
 * A second copy of this list is a second thing to drift — the same
 * failure vanilla-breeze-zccp removed from the JS entry points.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readLayoutVocabulary, readPresenceAttrs, ESCAPE_HATCH_PROPS, LAYOUT_ATTR_RE } from '../../scripts/quality/layout-vocabulary.js';

describe('readLayoutVocabulary', () => {
  const vocab = readLayoutVocabulary();

  it('finds every layout attribute that has enumerated values', () => {
    for (const attr of ['min', 'max', 'gap', 'threshold', 'content-min', 'item-width']) {
      assert.ok(vocab.has(attr), `data-layout-${attr} missing from the parsed vocabulary`);
    }
  });

  it('keys attributes without the data-layout- prefix', () => {
    assert.ok(!vocab.has('data-layout-min'));
  });

  it('reads values from both the element and attribute forks', () => {
    // gap is defined in layout-attributes.css; item-width only in
    // layout-reel/styles.css. Both must be picked up.
    assert.ok(vocab.get('item-width').has('full'), 'element-fork file not scanned');
    assert.ok(vocab.get('gap').has('m'), 'attribute-fork file not scanned');
  });

  it('names the three escape-hatch custom properties', () => {
    assert.deepEqual(
      [...ESCAPE_HATCH_PROPS].sort(),
      ['--layout-content-min', '--layout-min', '--layout-threshold'],
    );
  });

  it('throws when required layout-attributes.css is missing', () => {
    assert.throws(
      () => readLayoutVocabulary('/nonexistent/root'),
      (err) => err.message.includes('Required vocabulary file missing'),
      'should throw with clear error message for missing layout-attributes.css',
    );
  });
});

describe('LAYOUT_ATTR_RE', () => {
  it('extracts attributes from HTML strings', () => {
    const html = '<section data-layout="grid" data-layout-min="15rem" data-layout-gap="m">';
    const matches = [...html.matchAll(LAYOUT_ATTR_RE)];

    assert.equal(matches.length, 2, 'should extract two attributes');
    assert.equal(matches[0][1], 'min', 'first attribute name');
    assert.equal(matches[0][2], '15rem', 'first attribute value');
    assert.equal(matches[1][1], 'gap', 'second attribute name');
    assert.equal(matches[1][2], 'm', 'second attribute value');
  });
});

describe('tokenized layout vocabulary', () => {
  const vocab = readLayoutVocabulary();

  it('min is the t-shirt scale plus auto — no raw lengths', () => {
    assert.deepEqual(
      [...vocab.get('min')].sort(),
      ['auto', 'l', 'm', 's', 'xl', 'xs'],
      'data-layout-min still enumerates raw lengths; they belong to --layout-min now.',
    );
  });

  it('threshold and content-min are tokenized', () => {
    assert.deepEqual([...vocab.get('threshold')].sort(), ['l', 'm', 's']);
    assert.deepEqual([...vocab.get('content-min')].sort(), ['l', 'm', 's']);
  });

  // These carry counts and positions, not lengths — bare integers are correct
  // for them (data-layout-subgrid="2", data-layout-limit="3",
  // data-layout-column-count="2", data-layout-order="99"). Everything else in
  // the layout vocabulary must be a named token. Do not re-add a length-taking
  // attribute here just because it happens to fail the check — that means a
  // raw length regressed and needs tokenizing, not exempting.
  const COUNT_ATTRS = new Set([
    'subgrid', // number of subgrid tracks, e.g. data-layout-subgrid="4"
    'limit', // item count before forced wrap, e.g. data-layout-limit="3"
    'column-count', // explicit column count, e.g. data-layout-column-count="2"
    'order', // flex/grid order position, e.g. data-layout-order="99"
  ]);

  it('no layout attribute enumerates a raw length anywhere', () => {
    const offenders = [];
    for (const [attr, values] of vocab) {
      if (COUNT_ATTRS.has(attr)) continue;
      for (const v of values) {
        if (/^[\d.]+(rem|px|vh|dvh|svh|vw|%)$/.test(v) || /^\d+$/.test(v)) {
          offenders.push(`data-layout-${attr}="${v}"`);
        }
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'Raw lengths are not part of the HTML API — use a token or --layout-*.',
    );
  });

  it('behavioral keywords survive tokenization', () => {
    // full is inline-size:100%, xl is 30rem — different things, both needed.
    assert.ok(vocab.get('item-width').has('full'));
    assert.ok(vocab.get('item-width').has('xl'));
    assert.ok(vocab.get('min').has('auto'));
  });
});

describe('readLayoutVocabulary strips CSS comments', () => {
  // A commented-out selector must not widen the parsed vocabulary — that
  // would silently admit values the rule is meant to catch. Build a
  // synthetic root so this doesn't depend on any real comment existing in
  // the repo today.
  it('does not admit a value that only appears inside a /* ... */ comment', () => {
    const root = mkdtempSync(join(tmpdir(), 'vb-layout-vocab-'));
    const base = join(root, 'src', 'custom-elements');
    mkdirSync(base, { recursive: true });
    writeFileSync(
      join(base, 'layout-attributes.css'),
      [
        '[data-layout="grid"][data-layout-min="m"] { --_min: 15rem; }',
        '/* commented out: [data-layout="grid"][data-layout-min="220px"] { --_min: 220px; } */',
        '/* multi-line comment',
        '   [data-layout="grid"][data-layout-min="999px"] { --_min: 999px; }',
        '*/',
      ].join('\n'),
    );

    const vocab = readLayoutVocabulary(root);
    assert.ok(vocab.get('min').has('m'), 'the real, uncommented selector must still be read');
    assert.ok(!vocab.get('min').has('220px'), 'a single-line-comment value must not be admitted');
    assert.ok(!vocab.get('min').has('999px'), 'a multi-line-comment value must not be admitted');
  });
});

describe('readPresenceAttrs', () => {
  const presenceAttrs = readPresenceAttrs();

  it('includes attributes with no value vocabulary at all', () => {
    // centered/sticky/intrinsic never appear as data-layout-X="value"
    // anywhere — a bare [data-layout-X] selector is their whole contract.
    for (const attr of ['centered', 'sticky', 'intrinsic']) {
      assert.ok(presenceAttrs.has(attr), `data-layout-${attr} should be presence-only`);
    }
  });

  it('excludes attributes that have ANY value-bearing selector, even ones that also have a bare guard', () => {
    // threshold, overlap, and subgrid all pair a bare "catch-all" selector
    // ([data-layout="switcher"][data-layout-reverse][data-layout-threshold],
    // [data-layout="cluster"][data-layout-overlap] > *,
    // [data-layout="grid"][data-layout-subgrid] > *) with real
    // [data-layout-X="token"] rules. The bare form there means "this guard
    // applies whatever the value is," not "there is no vocabulary" — an
    // earlier version of readPresenceAttrs got this wrong and fully
    // exempted all three from validation (data-layout-threshold="99rem"
    // and data-layout-overlap="99px" went unflagged). Any value-bearing
    // selector for an attribute means it has a real vocabulary and must
    // stay validated, regardless of a coexisting bare guard.
    for (const attr of ['threshold', 'overlap', 'subgrid']) {
      assert.ok(!presenceAttrs.has(attr), `data-layout-${attr} has real token values; must stay validated`);
    }
  });

  it('excludes gap, which has a local single-mode bare guard but a real multi-mode vocabulary', () => {
    // [data-layout="center"][data-layout-gap] is a bare guard (switches
    // center to a flex column for any gap value), but gap is also a real
    // token vocabulary reused across ten layout modes. data-layout-gap="0"
    // (a real bug fixed in this batch) must still be flagged.
    assert.ok(!presenceAttrs.has('gap'), 'gap has a real token vocabulary; must stay validated');
  });

  it('excludes min, which has no bare form at all', () => {
    assert.ok(!presenceAttrs.has('min'), 'min has a real token vocabulary; must stay validated');
  });
});
