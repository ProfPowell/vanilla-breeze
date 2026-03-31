/**
 * Unit tests for vb-forms module
 *
 * Tests the minimal module API contract.
 *
 * Run with: node --test tests/unit/vb-forms.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Cache-busting for fresh module imports
let importCounter = 0;
async function freshImport() {
  return import(`../../src/lib/vb-forms.js?t=${Date.now()}_${importCounter++}`);
}

describe('initMobileForms', () => {
  it('exports a function', async () => {
    const mod = await freshImport();
    assert.equal(typeof mod.initMobileForms, 'function');
  });

  it('returns a cleanup function', async () => {
    const mod = await freshImport();
    const root = {
      querySelectorAll: () => [],
      querySelector: () => null,
    };
    const cleanup = mod.initMobileForms(root);
    assert.equal(typeof cleanup, 'function');
    cleanup();
  });

  it('cleanup is safe to call multiple times', async () => {
    const mod = await freshImport();
    const root = {
      querySelectorAll: () => [],
      querySelector: () => null,
    };
    const cleanup = mod.initMobileForms(root);
    cleanup();
    cleanup(); // should not throw
  });
});
