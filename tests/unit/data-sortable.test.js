/**
 * Unit tests for src/lib/data-sortable.js — pure sorting logic.
 *
 * No DOM. Covers: comparator selection by type, null/empty handling,
 * direction flipping, key-string parsing (leading "-" → desc).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseKey,
  compareBy,
  sortIndices,
  parseSortNumber,
  cycleDirection,
} from '../../src/lib/data-sortable.js';

describe('parseKey', () => {
  it('strips leading "-" and returns desc', () => {
    assert.deepEqual(parseKey('-date'), { key: 'date', direction: 'desc' });
  });
  it('returns asc by default', () => {
    assert.deepEqual(parseKey('name'), { key: 'name', direction: 'asc' });
  });
  it('handles "+" prefix as explicit asc', () => {
    assert.deepEqual(parseKey('+score'), { key: 'score', direction: 'asc' });
  });
  it('returns null for empty / falsy input', () => {
    assert.equal(parseKey(''), null);
    assert.equal(parseKey(null), null);
    assert.equal(parseKey(undefined), null);
  });
});

describe('compareBy — text', () => {
  const cmp = compareBy('text', 'asc');
  it('sorts case-insensitively', () => {
    assert.equal(Math.sign(cmp('apple', 'Banana')), -1);
    assert.equal(Math.sign(cmp('Banana', 'apple')), 1);
  });
  it('returns 0 for equal strings', () => {
    assert.equal(cmp('foo', 'foo'), 0);
  });
});

describe('compareBy — number', () => {
  const cmp = compareBy('number', 'asc');
  it('treats values as numbers', () => {
    assert.equal(Math.sign(cmp('10', '2')), 1);   // 10 > 2 numerically
    assert.equal(Math.sign(cmp('-5', '0')), -1);
  });
  it('handles non-numeric as NaN → tie-break stable', () => {
    assert.equal(cmp('abc', 'def'), 0);
  });
});

describe('compareBy — date', () => {
  const cmp = compareBy('date', 'asc');
  it('parses ISO dates', () => {
    assert.equal(Math.sign(cmp('2026-01-01', '2026-12-31')), -1);
  });
  it('asc puts earlier dates first', () => {
    const dates = ['2026-05-15', '2026-01-01', '2026-12-31'];
    dates.sort(cmp);
    assert.deepEqual(dates, ['2026-01-01', '2026-05-15', '2026-12-31']);
  });
});

describe('compareBy — direction', () => {
  it('desc inverts asc result', () => {
    const asc  = compareBy('text', 'asc');
    const desc = compareBy('text', 'desc');
    assert.equal(asc('a', 'b'), -1 * desc('a', 'b'));
  });
});

describe('compareBy — null / empty handling', () => {
  const cmp = compareBy('text', 'asc');
  it('treats null/undefined/"" as "after" non-empty (always sort to end)', () => {
    assert.equal(Math.sign(cmp('', 'a')), 1);    // "" → end (after a)
    assert.equal(Math.sign(cmp('a', '')), -1);
    assert.equal(Math.sign(cmp(null, 'a')), 1);
    assert.equal(Math.sign(cmp(undefined, 'a')), 1);
  });
  it('two empties tie', () => {
    assert.equal(cmp('', ''), 0);
    assert.equal(cmp(null, undefined), 0);
  });
});

describe('sortIndices', () => {
  it('returns an array of original indices in the new order', () => {
    const items = [
      { id: 'a', name: 'Charlie' },
      { id: 'b', name: 'Alice' },
      { id: 'c', name: 'Bob' },
    ];
    const order = sortIndices(items, (it) => it.name, 'text', 'asc');
    assert.deepEqual(order, [1, 2, 0]);  // Alice, Bob, Charlie
  });

  it('is stable across ties (preserves original order)', () => {
    const items = [
      { id: 'a', score: 1 },
      { id: 'b', score: 1 },
      { id: 'c', score: 1 },
    ];
    const order = sortIndices(items, (it) => it.score, 'number', 'asc');
    assert.deepEqual(order, [0, 1, 2]);
  });

  it('descending reverses the comparison', () => {
    const items = [{ v: 1 }, { v: 3 }, { v: 2 }];
    const order = sortIndices(items, (it) => it.v, 'number', 'desc');
    assert.deepEqual(order, [1, 2, 0]);  // 3, 2, 1
  });
});

describe('cycleDirection', () => {
  it('cycles asc → desc → none → asc', () => {
    assert.equal(cycleDirection('asc'),  'desc');
    assert.equal(cycleDirection('desc'), 'none');
    assert.equal(cycleDirection('none'), 'asc');
  });
  it('treats unknown / undefined as starting fresh at asc', () => {
    assert.equal(cycleDirection(undefined), 'asc');
    assert.equal(cycleDirection(''), 'asc');
    assert.equal(cycleDirection('weird'), 'asc');
  });
});

describe('parseSortNumber — formatted text', () => {
  it('ignores grouping, currency, units and spaces', () => {
    assert.equal(parseSortNumber('1,234'), 1234);
    assert.equal(parseSortNumber('$5'), 5);
    assert.equal(parseSortNumber('12 %'), 12);
    assert.equal(parseSortNumber('1.234.567'), 1234567);
  });
  it('treats the last of , and . as the decimal separator', () => {
    assert.equal(parseSortNumber('1.234,5'), 1234.5);
    assert.equal(parseSortNumber('1,234.5'), 1234.5);
    assert.equal(parseSortNumber('1,5'), 1.5);
  });
  it('reads negatives (minus sign, hyphen, accounting parentheses)', () => {
    assert.equal(parseSortNumber('−3'), -3);
    assert.equal(parseSortNumber('-3'), -3);
    assert.equal(parseSortNumber('(4)'), -4);
  });
  it('NaN for text without digits', () => {
    assert.ok(Number.isNaN(parseSortNumber('n/a')));
  });
  it('number comparator sorts formatted values', () => {
    const order = sortIndices(['1,234', '$5', '12 %'], (v) => v, 'number', 'asc');
    assert.deepEqual(order, [1, 2, 0]);
  });
});

describe('compareBy — locale', () => {
  it('collates text in the given locale', () => {
    // Swedish: ö sorts after z; German: ö sorts with o.
    assert.ok(compareBy('text', 'asc', 'sv')('ö', 'z') > 0);
    assert.ok(compareBy('text', 'asc', 'de')('ö', 'z') < 0);
  });
});
