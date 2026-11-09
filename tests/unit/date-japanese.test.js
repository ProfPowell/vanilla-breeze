/**
 * Unit tests for src/lib/date-japanese.js
 *
 * Pure functions — no DOM needed. The round-trip test formats every day
 * since the start of 明治 with Intl's Japanese calendar and parses it back,
 * so the era table is checked against ICU rather than against itself.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseWareki, parseCJKNumeric } from '../../src/lib/date-japanese.js';

/**
 * Local-time ISO string, or null — matches date-picker's toISO.
 * @param {Date|null} date
 * @returns {string|null}
 */
function iso(date) {
  if (!date) return null;
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

describe('date-japanese — parseWareki', () => {
  /** @type {Array<[string, string|null, string]>} */
  const cases = [
    ['令和8年10月21日', '2026-10-21', 'kanji era'],
    ['令和元年5月1日', '2019-05-01', '元年 is year 1'],
    ['R8/10/21', '2026-10-21', 'form abbreviation'],
    ['R1.5.1', '2019-05-01', 'dot separator'],
    ['令和8/10/21', '2026-10-21', 'kanji era with slashes'],
    ['平成31年4月30日', '2019-04-30', 'last day of 平成'],
    ['昭和43年5月3日', '1968-05-03', 'historic era'],
    ['令和８年１０月２１日', '2026-10-21', 'full-width digits'],
    ['明治元年10月23日', '1868-10-23', 'oldest supported era'],
    ['r8/10/21', '2026-10-21', 'lower-case abbreviation'],
    [' 令和 8年 10月 21日 ', '2026-10-21', 'surrounding and inner whitespace'],
    ['令和元年4月30日', null, '令和 began May 1'],
    ['平成32年1月1日', null, '平成 ended at 31'],
    ['昭和64年1月8日', null, '昭和64 ran Jan 1–7 only'],
    ['令和8年2月30日', null, 'date overflow'],
    ['令和0年1月1日', null, 'year 0 is not an era year'],
    ['2026年10月21日', null, 'not an era date'],
    ['', null, 'empty'],
  ];

  for (const [input, expected, why] of cases) {
    it(`${input || '(empty)'} → ${expected} (${why})`, () => {
      assert.equal(iso(parseWareki(input)), expected);
    });
  }
});

describe('date-japanese — parseCJKNumeric', () => {
  /** @type {Array<[string, string|null]>} */
  const cases = [
    ['2026年10月21日', '2026-10-21'],
    ['2026年1月5日', '2026-01-05'],
    ['2026年10月21', '2026-10-21'],
    ['２０２６年１０月２１日', '2026-10-21'],
    ['2026 年 10 月 21 日', '2026-10-21'],
    ['0050年1月1日', '0050-01-01'],
    ['2026年2月29日', null],
    ['2026年13月1日', null],
    ['令和8年10月21日', null],
    ['2026-10-21', null],
  ];

  for (const [input, expected] of cases) {
    it(`${input} → ${expected}`, () => {
      assert.equal(iso(parseCJKNumeric(input)), expected);
    });
  }
});

describe('date-japanese — Intl round-trip', () => {
  for (const dateStyle of /** @type {const} */ (['medium', 'short'])) {
    it(`parses every day 1868-10-23..2030-12-31 formatted at dateStyle ${dateStyle}`, () => {
      const fmt = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', { dateStyle });
      const mismatches = [];
      // Build each day by index: stepping with setDate(+1) drifts across
      // historic local-mean-time offsets (Asia/Tokyo before 1888).
      let d = new Date(1868, 9, 23);
      for (let i = 0; i < 59239; i++) {
        d = new Date(1868, 9, 23 + i);
        const text = fmt.format(d);
        const got = iso(parseWareki(text));
        if (got !== iso(d)) mismatches.push(`${text} → ${got}, expected ${iso(d)}`);
      }
      assert.equal(iso(d), '2030-12-31');
      assert.deepEqual(mismatches.slice(0, 10), []);
    });
  }
});
