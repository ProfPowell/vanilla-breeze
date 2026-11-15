/**
 * Every reviewed state of data-review must have a visible effect without
 * .labeled: it recolours the edge data-provenance draws. fact-checked used
 * to set only a custom property, so it showed nothing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const root = postcss.parse(readFileSync('src/native-elements/provenance/styles.css', 'utf8'));

for (const state of ['fact-checked', 'editor-reviewed']) {
  test(`data-review="${state}" recolours the provenance edge`, () => {
    let found = false;
    root.walkRules(`[data-review="${state}"]`, (rule) => {
      rule.walkDecls('border-inline-start-color', (d) => {
        found = d.value === 'var(--review-color)';
      });
    });
    assert.ok(found, `[data-review="${state}"] sets no border-inline-start-color`);
  });
}
