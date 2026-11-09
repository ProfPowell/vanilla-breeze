/**
 * dl variants combined with data-layout and narrow containers (css-followups).
 *
 * - A stacked dl that is also data-layout (cluster, grid) spaces groups with
 *   the layout gap: the stacked group margin used to push every group after
 *   the first 24px down, off the row (demos had to cancel it by hand).
 * - A horizontal dl stays two-column down to 16rem (it stacked below 24rem,
 *   so it stacked in every sidebar, whose widest basis is 20rem), and a
 *   content-sized horizontal dl (a flex item) no longer collapses to a few
 *   pixels under its own size containment.
 *
 * Tests the working tree: /src (and the demo files) are served from disk.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');

async function routeSrc(page) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
}

async function serve(page, html) {
  await routeSrc(page);
  const url = `/__dl-layout-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200, contentType: 'text/html; charset=utf-8', body: html,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const load = (page, body) => serve(page, `<!doctype html><html lang="en" data-mode="light"><head><meta charset="utf-8">
  <link rel="stylesheet" href="/src/main.css"></head><body><main>${body}</main></body></html>`);

const tops = (page, sel) => page.$$eval(`${sel} > *`, (els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));

const GROUPS = '<dl-item><dt>Posts</dt><dd>128</dd></dl-item><dl-item><dt>Followers</dt><dd>2.4k</dd></dl-item><dl-item><dt>Following</dt><dd>312</dd></dl-item>';

for (const layout of ['cluster', 'grid']) {
  test(`stacked dl with data-layout="${layout}" keeps its groups on one row`, async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 600 });
    await load(page, `<dl id="d" data-variant="stacked" data-layout="${layout}">${GROUPS}</dl>`);
    const t = await tops(page, '#d');
    expect(new Set(t).size, t.join(',')).toBe(1);
  });
}

test('stacked dl in normal flow keeps its group spacing; bordered still resets it', async ({ page }) => {
  await load(page, `<dl id="flow" data-variant="stacked">${GROUPS}</dl>
    <dl id="bordered" data-variant="stacked" data-bordered>${GROUPS}</dl>`);
  const m = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).marginBlockStart);
  expect(await m('#flow > dl-item:nth-child(2)')).not.toBe('0px');
  expect(await m('#bordered > dl-item:nth-child(2)')).toBe('0px');
});

test('profile demos lay the stat row out on one line without local CSS', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const f of ['profile-header', 'profile-full']) {
    const html = readFileSync(join(REPO, 'demos/patterns/demos', `${f}.html`), 'utf8');
    expect(html, f).not.toContain('margin-block-start: 0');
    await serve(page, html);
    const t = await tops(page, 'dl[data-variant="stacked"][data-layout]');
    expect(new Set(t).size, `${f}: ${t.join(',')}`).toBe(1);
  }
});

const PAIRS = '<dt>Status</dt><dd>Active and well</dd><dt>Owner</dt><dd>Jane Doe</dd>';
const sideBySide = (page, sel) => page.locator(sel).evaluate((dl) => {
  const [dt, dd] = [dl.querySelector('dt'), dl.querySelector('dd')].map((e) => e.getBoundingClientRect());
  return Math.abs(dt.top - dd.top) < 4 && dd.left > dt.right;
});

test('a content-sized horizontal dl (flex item) does not collapse', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 600 });
  await load(page, `<nav style="display: flex; gap: 1rem"><dl id="d" data-variant="horizontal">${PAIRS}</dl><p>Beside it</p></nav>`);
  const w = await page.locator('#d').evaluate((el) => el.getBoundingClientRect().width);
  expect(w).toBeGreaterThan(150);
  expect(await sideBySide(page, '#d')).toBe(true);
});

test('a horizontal dl stacks below 16rem and stays two-column in a sidebar and wider', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 600 });
  await load(page, `
    <aside id="narrow" style="inline-size: 15rem"><dl id="n" data-variant="horizontal">${PAIRS}</dl></aside>
    <aside id="sidebar" style="inline-size: 18rem"><dl id="s" data-variant="horizontal">${PAIRS}</dl></aside>
    <aside id="wide" style="inline-size: 30rem"><dl id="w" data-variant="horizontal">${PAIRS}</dl></aside>
    <section><dl id="full" data-variant="horizontal"><div><dt>Status</dt><dd>Active</dd></div><div><dt>Owner</dt><dd>Jane</dd></div></dl></section>`);
  expect(await sideBySide(page, '#n')).toBe(false);
  expect(await sideBySide(page, '#s')).toBe(true);
  expect(await sideBySide(page, '#w')).toBe(true);
  expect(await sideBySide(page, '#full')).toBe(true);
});
