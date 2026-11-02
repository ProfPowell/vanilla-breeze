/**
 * Unit tests for src/lib/ai/budget.js
 *
 * Run with: node --test tests/unit/ai/budget.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  estimateTokens, NANO_CONTEXT_BUDGET, trimHistory, fitToQuota,
} from '../../../src/lib/ai/budget.js';

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

describe('trimHistory', () => {
  const turn = (i, len = 10) => [
    { role: 'user', content: `u${i}`.padEnd(len, '.') },
    { role: 'assistant', content: `a${i}`.padEnd(len, '.') },
  ];

  it('returns [] for empty or non-array input', () => {
    assert.deepEqual(trimHistory([]), []);
    assert.deepEqual(trimHistory(/** @type {any} */ (undefined)), []);
  });

  it('keeps everything when under budget', () => {
    const h = [...turn(1), ...turn(2)];
    assert.deepEqual(trimHistory(h), h);
  });

  it('keeps the newest contiguous tail within the char budget', () => {
    const h = [...turn(1), ...turn(2), ...turn(3)];
    const out = trimHistory(h, { maxChars: 45 });
    assert.deepEqual(out.map((m) => m.content.slice(0, 2)), ['u2', 'a2', 'u3', 'a3']);
  });

  it('caps the number of messages', () => {
    const h = [...turn(1), ...turn(2), ...turn(3)];
    assert.equal(trimHistory(h, { maxMessages: 2 }).length, 2);
  });

  it('never opens on an assistant message', () => {
    const h = [...turn(1), ...turn(2)];
    const out = trimHistory(h, { maxMessages: 3 });
    assert.equal(out[0].role, 'user');
    assert.equal(out.length, 2);
  });
});

describe('fitToQuota', () => {
  it('returns the text unchanged when it fits', () => {
    assert.equal(fitToQuota('abcdef', 5, 10), 'abcdef');
  });

  it('cuts proportionally with a safety margin when over quota', () => {
    const text = 'x'.repeat(1000);
    const out = fitToQuota(text, 2000, 1000);
    assert.equal(out.length, 475);
  });

  it('ignores unusable numbers', () => {
    assert.equal(fitToQuota('abc', 0, 10), 'abc');
    assert.equal(fitToQuota('abc', 10, Infinity), 'abc');
    assert.equal(fitToQuota('abc', 10, 0), 'abc');
  });
});
