// @ts-nocheck -- unit test fakes intentionally diverge from DOM types
/**
 * Unit tests for src/lib/data-paged.js — pure pagination math.
 *
 * No DOM. Covers page clamping, slice computation, and the "windowed"
 * page-number strip with ellipses (the kind that renders as
 * 1 … 5 6 7 … 12).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  clampPage,
  pageSlice,
  pageNumbers,
  paginationState,
} from '../../src/lib/data-paged.js';

describe('clampPage', () => {
  it('clamps below 1 to 1', () => {
    assert.equal(clampPage(0, 5), 1);
    assert.equal(clampPage(-3, 5), 1);
  });
  it('clamps above totalPages to totalPages', () => {
    assert.equal(clampPage(10, 5), 5);
  });
  it('returns 1 when totalPages is 0 (empty)', () => {
    assert.equal(clampPage(1, 0), 1);
  });
  it('passes through valid pages', () => {
    assert.equal(clampPage(3, 5), 3);
  });
  it('coerces non-numeric input to 1', () => {
    assert.equal(clampPage(NaN, 5), 1);
    assert.equal(clampPage(undefined, 5), 1);
  });
});

describe('pageSlice', () => {
  it('returns the [start, end) range for a 1-based page', () => {
    assert.deepEqual(pageSlice({ page: 1, size: 10 }), { start: 0, end: 10 });
    assert.deepEqual(pageSlice({ page: 2, size: 10 }), { start: 10, end: 20 });
    assert.deepEqual(pageSlice({ page: 3, size: 7  }), { start: 14, end: 21 });
  });
});

describe('pageNumbers — windowed strip', () => {
  it('returns all pages when totalPages fits in the window without ellipsis', () => {
    assert.deepEqual(pageNumbers(1, 5, 3), [1, 2, 3, 4, 5]);
  });

  it('inserts ellipsis on the right when current is near start', () => {
    // current=2, total=10, window=1 → 1 2 3 … 10
    assert.deepEqual(pageNumbers(2, 10, 1), [1, 2, 3, '…', 10]);
  });

  it('inserts ellipsis on the left when current is near end', () => {
    assert.deepEqual(pageNumbers(9, 10, 1), [1, '…', 8, 9, 10]);
  });

  it('inserts ellipses on both sides when current is in the middle', () => {
    assert.deepEqual(pageNumbers(6, 12, 1), [1, '…', 5, 6, 7, '…', 12]);
  });

  it('respects window size', () => {
    assert.deepEqual(pageNumbers(6, 12, 2), [1, '…', 4, 5, 6, 7, 8, '…', 12]);
  });

  it('does not duplicate page 1 / last page when window edges abut', () => {
    // current=3, total=10, window=2 → 1 2 3 4 5 … 10  (no extra "1")
    assert.deepEqual(pageNumbers(3, 10, 2), [1, 2, 3, 4, 5, '…', 10]);
  });

  it('returns [1] when totalPages is 1', () => {
    assert.deepEqual(pageNumbers(1, 1, 3), [1]);
  });

  it('returns [] when totalPages is 0', () => {
    assert.deepEqual(pageNumbers(1, 0, 3), []);
  });
});

describe('paginationState — public composite', () => {
  it('combines clamped page + totalPages + slice + numbers', () => {
    const s = paginationState({ total: 47, size: 10, page: 3, window: 1 });
    assert.equal(s.page, 3);
    assert.equal(s.totalPages, 5);
    assert.equal(s.start, 20);
    assert.equal(s.end, 30);
    assert.deepEqual(s.pageNumbers, [1, 2, 3, 4, 5]);
  });

  it('handles total=0 gracefully', () => {
    const s = paginationState({ total: 0, size: 10, page: 1, window: 3 });
    assert.equal(s.totalPages, 0);
    assert.equal(s.start, 0);
    assert.equal(s.end, 0);
    assert.deepEqual(s.pageNumbers, []);
  });

  it('clamps an out-of-range page', () => {
    const s = paginationState({ total: 30, size: 10, page: 99, window: 1 });
    assert.equal(s.page, 3);
    assert.equal(s.start, 20);
    assert.equal(s.end, 30);
  });

  it('honors a partial last page', () => {
    const s = paginationState({ total: 23, size: 10, page: 3, window: 1 });
    assert.equal(s.totalPages, 3);
    assert.equal(s.start, 20);
    assert.equal(s.end, 23);
  });

  it('size=0 is treated as no pagination (single page covering all)', () => {
    const s = paginationState({ total: 10, size: 0, page: 1, window: 1 });
    assert.equal(s.totalPages, 1);
    assert.equal(s.start, 0);
    assert.equal(s.end, 10);
  });
});
