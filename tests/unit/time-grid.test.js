/**
 * src/lib/time-grid.js — shared time/duration parsing for day-view and
 * week-view (vanilla-breeze-8kf7 ISO times, -8s1z durations, -rb3n overlap).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTime, parseDuration, layoutColumns } from '../../src/lib/time-grid.js';

test('parseTime: HH:MM and full ISO datetimes give the wall-clock time', () => {
  assert.deepEqual(parseTime('09:00'), { hour: 9, minute: 0 });
  assert.deepEqual(parseTime('9:30'), { hour: 9, minute: 30 });
  assert.deepEqual(parseTime('14:05:30'), { hour: 14, minute: 5 });
  assert.deepEqual(parseTime('2026-04-10T09:30'), { hour: 9, minute: 30 });
  assert.deepEqual(parseTime('2026-04-10T09:30:00Z'), { hour: 9, minute: 30 });
  assert.deepEqual(parseTime('2026-04-10T23:15:00+02:00'), { hour: 23, minute: 15 });
});

test('parseTime: clamps out-of-range parts and rejects date-only / garbage', () => {
  assert.deepEqual(parseTime('24:00'), { hour: 23, minute: 0 });
  assert.equal(parseTime('2026-04-10'), null);
  assert.equal(parseTime('noon'), null);
  assert.equal(parseTime(''), null);
  assert.equal(parseTime(null), null);
});

test('parseDuration: hours, minutes, mixed, decimals', () => {
  assert.equal(parseDuration('2h'), 120);
  assert.equal(parseDuration('1.5h'), 90);
  assert.equal(parseDuration('45m'), 45);
  assert.equal(parseDuration('90m'), 90);
  assert.equal(parseDuration('1h30m'), 90);
  assert.equal(parseDuration('1h 30m'), 90);
  assert.equal(parseDuration('90min'), 90);
  assert.equal(parseDuration('2 hours'), 120);
});

test('parseDuration: bare numbers are minutes', () => {
  assert.equal(parseDuration('60'), 60);
  assert.equal(parseDuration(45), 45);
});

test('parseDuration: ISO-8601 durations', () => {
  assert.equal(parseDuration('PT1H30M'), 90);
  assert.equal(parseDuration('PT45M'), 45);
  assert.equal(parseDuration('PT2H'), 120);
  assert.equal(parseDuration('PT1.5H'), 90);
  assert.equal(parseDuration('pt30m'), 30);
});

test('parseDuration: garbage, empty and non-positive values are rejected', () => {
  for (const v of ['', 'soon', 'h', 'PT', '1x', '0', '0h', '-1h', 'abc1h', null, undefined]) {
    assert.equal(parseDuration(v), null, `expected null for ${String(v)}`);
  }
});

test('layoutColumns: overlapping intervals get columns, separate clusters do not', () => {
  const out = layoutColumns([
    { id: 'a', start: 600, end: 720 },  // 10–12
    { id: 'b', start: 630, end: 690 },  // 10:30–11:30 overlaps a
    { id: 'c', start: 700, end: 760 },  // 11:40–12:40 overlaps a, not b → reuses b's column
    { id: 'd', start: 900, end: 960 },  // 15–16 alone
  ]);
  const by = Object.fromEntries(out.map((o) => [o.id, o]));
  assert.deepEqual([by.a.column, by.a.columns], [0, 2]);
  assert.deepEqual([by.b.column, by.b.columns], [1, 2]);
  assert.deepEqual([by.c.column, by.c.columns], [1, 2]);
  assert.deepEqual([by.d.column, by.d.columns], [0, 1]);
});
