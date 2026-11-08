/**
 * stats-core (shared by <page-stats> and <page-info>): word counting,
 * reading time and date formatting.
 *
 * Run: node --test tests/unit/page-stats-core.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';

import {
  READING_WPM, READING_CPM, collectReadableText, countWords, readingMinutes,
  parseDateValue, relativeTime, absoluteDate
} from '../../src/web-components/page-stats/stats-core.js';

describe('countWords', () => {
  it('counts space-separated words, ignoring punctuation', () => {
    assert.equal(countWords('Hello, world — this is five words.', 'en').words, 6);
  });

  it('segments Japanese (no spaces) into many words and tallies CJK chars', () => {
    const ja = '吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。';
    const { words, cjkChars, cjkWords } = countWords(ja, 'ja');
    assert.ok(words > 5, `expected >5 words, got ${words}`);
    assert.equal(words, cjkWords);
    assert.ok(cjkChars >= 25);
  });
});

describe('readingMinutes', () => {
  it('uses the shared 238 wpm', () => {
    assert.equal(READING_WPM, 238);
    assert.equal(readingMinutes({ words: 238 * 3, cjkChars: 0, cjkWords: 0 }), 3);
  });

  it('times CJK by characters per minute, minimum 1', () => {
    assert.equal(readingMinutes({ words: 400, cjkChars: READING_CPM * 4, cjkWords: 400 }), 4);
    assert.equal(readingMinutes({ words: 0, cjkChars: 0, cjkWords: 0 }), 1);
  });
});

describe('collectReadableText', () => {
  it('skips script/style/hidden/aria-hidden/signable=false/derived components; counts nested roots once', () => {
    const { document } = parseHTML(`<html><body>
      <article data-signable id="a">
        <p>one two</p>
        <script>var x = 1;</script><style>p{}</style>
        <p hidden>hidden words</p><p aria-hidden="true">aria words</p>
        <section data-signable="false">excluded</section>
        <page-info>meta words</page-info>
        <section data-signable>three</section>
        <details><summary>four</summary>five</details>
        <pre><code>six</code></pre>
      </article></body></html>`);
    const text = collectReadableText(document.querySelectorAll('[data-signable]'));
    assert.equal(countWords(text, 'en').words, 6);
  });
});

describe('dates', () => {
  /** parseDateValue returns null for invalid input; these fixtures are valid. */
  const pd = (/** @type {string} */ v) => { const d = parseDateValue(v); assert.ok(d); return d; };
  const now = Date.UTC(2026, 6, 6, 12); // 2026-07-06T12:00Z

  it('formats past and future relative times with Intl', () => {
    assert.equal(relativeTime(pd('2026-07-03T12:00:00Z'), 'en', now), '3 days ago');
    assert.equal(relativeTime(pd('2026-07-09T12:00:00Z'), 'en', now), 'in 3 days');
    assert.equal(relativeTime(pd('2026-07-06T11:59:50Z'), 'en', now), 'now');
  });

  it('localizes to the given language', () => {
    assert.equal(relativeTime(pd('2026-07-03T12:00:00Z'), 'de', now), 'vor 3 Tagen');
  });

  it('formats date-only values in UTC (no off-by-one day)', () => {
    assert.equal(absoluteDate(pd('2026-03-15'), 'en'), 'March 15, 2026');
  });

  it('rejects invalid input', () => {
    assert.equal(parseDateValue('not a date'), null);
    assert.equal(parseDateValue(''), null);
  });
});
