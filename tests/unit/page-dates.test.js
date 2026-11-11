/**
 * scripts/generate-page-dates.mjs: a page's date is its newest commit that
 * is not a sweep; working-tree edits count as today; a page only sweeps have
 * touched keeps the day it was added; generated and deleted pages are left out.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { datesFromLog, urlOf } from '../../scripts/generate-page-dates.mjs';

const P = 'site/src/pages/';
const sweep = Array.from({ length: 30 }, (_, i) => `${P}docs/s${i}.html`);

test('urlOf maps source files to served URLs', () => {
  assert.equal(urlOf(`${P}index.html`), '/');
  assert.equal(urlOf(`${P}docs/index.html`), '/docs/');
  assert.equal(urlOf(`${P}docs/grid.html`), '/docs/grid/');
});

const M = (/** @type {string[]} */ ...files) => files.map((file) => `M\t${file}`);

test('newest non-sweep commit wins; sweeps, generated and deleted pages are skipped', () => {
  const log = [
    '@2026-11-09', ...M(...sweep, `${P}docs/grid.html`),  // sweep: ignored for grid
    '@2026-11-05', ...M(`${P}docs/grid.html`, `${P}docs/gone.html`, `${P}sitemap/index.html`, 'src/other.js'),
    '@2026-10-01', ...M(`${P}docs/grid.html`),
    '@2026-03-01', ...sweep.map((file) => `A\t${file}`),  // the sweep that added s0…s29
  ].join('\n');
  const dates = datesFromLog(log, [`${P}docs/new.html`], '2026-11-10', (file) => !file.endsWith('gone.html'));
  assert.equal(dates['/docs/grid/'], '2026-11-05');
  assert.equal(dates['/docs/new/'], '2026-11-10');
  assert.equal(dates['/docs/s0/'], '2026-03-01');
  assert.equal('/docs/gone/' in dates, false);
  assert.equal('/sitemap/' in dates, false);
});

test('a moved page keeps its history; a path reused later does not inherit the old page', () => {
  const feel = `${P}docs/interaction/feel.html`;
  const log = [
    '@2026-11-11', ...M(...sweep), `R092\t${P}docs/concepts/feel.html\t${feel}`,  // the move, a sweep
    '@2026-08-02', ...M(`${P}docs/concepts/feel.html`),
    '@2026-07-01', `A\t${P}docs/concepts/feel.html`, `A\t${P}docs/grid.html`,
    '@2026-01-01', ...M(`${P}docs/grid.html`),           // an earlier page at the same path
  ].join('\n');
  const dates = datesFromLog(log, [], '2026-11-12', () => true);
  assert.equal(dates[urlOf(feel)], '2026-08-02');
  assert.equal('/docs/concepts/feel/' in dates, false);
  assert.equal(dates['/docs/grid/'], '2026-07-01');

  const staged = datesFromLog(['@2026-08-02', ...M(`${P}docs/a.html`)].join('\n'), [], '2026-11-12', () => true,
    { [`${P}docs/a.html`]: `${P}docs/b.html` });
  assert.equal(staged['/docs/b/'], '2026-08-02');
});
