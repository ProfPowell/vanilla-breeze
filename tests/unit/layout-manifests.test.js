/**
 * Layout manifests match their CSS.
 *
 * Every src/custom-elements/layout-* directory ships an api.json. Those
 * manifests used to live in src/htmlvalidate/api-overrides.json with
 * attribute names the CSS never read (data-gap for data-layout-gap), so the
 * html-validate registry described an API that did not exist. This gate
 * derives each layout's real vocabulary from its CSS selectors
 * (readLayoutVocabularyByElement) and asserts the manifest agrees:
 *
 *   - the host attributes are exactly the ones the CSS reads,
 *   - each enum's values are exactly the CSS value set,
 *   - presence-only attributes are typed boolean,
 *   - child attributes (data-layout-principal, data-bleed, …) are listed.
 *
 * Run: node --test tests/unit/layout-manifests.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readLayoutVocabularyByElement } from '../../scripts/quality/layout-vocabulary.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const vocab = readLayoutVocabularyByElement(root);

describe('layout api.json manifests match the CSS vocabulary', () => {
  it('finds the layout elements', () => {
    assert.ok(vocab.size >= 14, `only ${vocab.size} layout elements found`);
  });

  for (const [element, { host, child }] of vocab) {
    const file = `src/custom-elements/${element}/api.json`;

    it(`${element} has a manifest`, () => {
      assert.ok(existsSync(resolve(root, file)), `${file} is missing — every layout element ships one.`);
    });

    it(`${element} manifest lists exactly the host attributes its CSS reads`, () => {
      const manifest = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
      assert.equal(manifest.element, element);
      const declared = new Map(manifest.attributes.map((a) => [a.name, a]));
      assert.deepEqual(
        [...declared.keys()].sort(),
        [...host.keys()].sort(),
        `${file}: attribute set drifted from ${element}/styles.css`,
      );
      for (const [name, { values, bare }] of host) {
        const attr = declared.get(name);
        if (values.size === 0) {
          assert.equal(attr.type, 'boolean', `${file}: ${name} has no values in CSS, so it is a boolean`);
        } else {
          assert.equal(attr.type, 'enum', `${file}: ${name} has values in CSS, so it is an enum`);
          // "" in the manifest enum means the bare (valueless) form is allowed —
          // it must be there exactly when the CSS has a bare [data-x] selector.
          const declaredValues = attr.values.filter((v) => v !== '');
          assert.deepEqual(declaredValues.sort(), [...values].sort(), `${file}: ${name} values drifted`);
          assert.equal(attr.values.includes(''), bare, `${file}: ${name} bare form ${bare ? 'is' : 'is not'} read by the CSS`);
        }
      }
    });

    it(`${element} manifest lists the child attributes its CSS reads`, () => {
      const manifest = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
      const declared = (manifest.childAttributes ?? []).map((c) => c.name).sort();
      assert.deepEqual(declared, [...child.keys()].sort(), `${file}: childAttributes drifted`);
    });
  }
});

describe('layout manifests are not duplicated in the overrides file', () => {
  it('src/htmlvalidate/api-overrides.json carries no layout-* entries', () => {
    const overrides = JSON.parse(readFileSync(resolve(root, 'src/htmlvalidate/api-overrides.json'), 'utf8'));
    const stray = overrides.filter((m) => m.element?.startsWith('layout-')).map((m) => m.element);
    assert.deepEqual(stray, [], 'Layout manifests live in src/custom-elements/layout-*/api.json; the overrides copy drifted before.');
  });
});
