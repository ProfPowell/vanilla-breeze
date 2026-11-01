/**
 * Quick Start step demos share one running example ("Trailhead").
 *
 * docs/quick-start/ walks one page through five files, each adding a layer
 * (plain HTML → stylesheet → data-layout → data-page-layout → components).
 * The page's point is that the content never changes, only the layers on
 * top of it. The previous Quick Start drifted: its snippets and demos showed
 * different markup. This test locks the shared content: the three trip
 * <article>s, the departures table rows and the route <details> must read
 * the same in every step file. Attributes and wrappers may differ by step
 * (that is the lesson); the normalized text may not.
 *
 * Run: node --test tests/unit/quick-start-steps.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseHTML } from 'linkedom';

const DIR = resolve(import.meta.dirname, '../../demos/examples/demos/quick-start');
const STEPS = [
  'step-1-plain.html',
  'step-2-styled.html',
  'step-3-layout.html',
  'step-4-page.html',
  'step-5-components.html',
];

const norm = (el) => el.textContent.replace(/\s+/g, ' ').trim();

function shared(file) {
  const { document } = parseHTML(readFileSync(resolve(DIR, file), 'utf8'));
  return {
    trips: [...document.querySelectorAll('#trips > article')].map(norm),
    departures: [...document.querySelectorAll('#departures tbody tr')].map(norm),
    routes: [...document.querySelectorAll('#routes details')].map(norm),
  };
}

describe('Quick Start step demos', () => {
  const baseline = shared(STEPS[0]);

  it('step 1 has the expected shape', () => {
    assert.equal(baseline.trips.length, 3, 'three trip articles');
    assert.equal(baseline.departures.length, 3, 'three departure rows');
    assert.equal(baseline.routes.length, 3, 'three route details');
  });

  for (const file of STEPS.slice(1)) {
    it(`${file} keeps the shared content identical to step 1`, () => {
      assert.deepEqual(shared(file), baseline);
    });
  }

  it('steps 1-4 load no script and step 1 loads no stylesheet (deliberate)', () => {
    for (const file of STEPS.slice(0, 4)) {
      const html = readFileSync(resolve(DIR, file), 'utf8');
      assert.doesNotMatch(html, /<script\b/, `${file} must stay CSS-only`);
    }
    const plain = readFileSync(resolve(DIR, STEPS[0]), 'utf8');
    assert.doesNotMatch(plain, /<link[^>]+stylesheet/, 'step 1 is the unstyled baseline');
  });
});
