/**
 * The layout vocabulary is parsed out of the CSS, never hand-listed.
 * A second copy of this list is a second thing to drift — the same
 * failure vanilla-breeze-zccp removed from the JS entry points.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readLayoutVocabulary, ESCAPE_HATCH_PROPS, LAYOUT_ATTR_RE } from '../../scripts/quality/layout-vocabulary.js';

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
