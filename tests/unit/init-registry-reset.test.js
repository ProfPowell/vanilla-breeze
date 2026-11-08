import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Behaviour is covered in the browser by the attribute specs; this guards
// the exported contract the form enhancers build on.
test('_init-registry exports onFormReset(el, fn)', () => {
  const src = readFileSync(new URL('../../src/utils/_init-registry.js', import.meta.url), 'utf8');
  assert.match(src, /export function onFormReset\(el, fn\)/);
  assert.match(src, /setTimeout\(/, 'handlers run after the reset is applied');
  assert.match(src, /defaultPrevented/, 'a cancelled reset runs nothing');
});
