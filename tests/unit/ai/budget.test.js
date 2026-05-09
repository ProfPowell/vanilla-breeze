/**
 * Unit tests for src/lib/ai/budget.js
 *
 * Run with: node --test tests/unit/ai/budget.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { estimateTokens, NANO_CONTEXT_BUDGET } from '../../../src/lib/ai/budget.js';

describe('estimateTokens', () => {
  it('returns 0 for empty/nullish input', () => {
    assert.equal(estimateTokens(''), 0);
    assert.equal(estimateTokens(null), 0);
    assert.equal(estimateTokens(undefined), 0);
  });

  it('returns chars/4 ceiling', () => {
    assert.equal(estimateTokens('abcd'), 1);
    assert.equal(estimateTokens('abcde'), 2);
    assert.equal(estimateTokens('a'.repeat(100)), 25);
  });
});

describe('NANO_CONTEXT_BUDGET', () => {
  it('is the documented soft cap', () => {
    assert.equal(NANO_CONTEXT_BUDGET, 6000);
  });
});
