/**
 * fab-stack / data-float / back-to-top — F-review fixes (vanilla-breeze-4rtb).
 *
 * Covers: *-center floats on the viewport midpoint in RTL; the inline-end
 * edge picks up the left safe-area inset in RTL (float, bare fab-stack,
 * bare back-to-top); top-layer dialog children of fab-stack still centre;
 * child order (first child nearest the anchored edge); the hidden
 * back-to-top is out of the tab order and the visible one is in it.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', head = '', init = true } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__fab-stack-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/src/main.css">
      <style>:root { --float-offset: 20px; }</style>
      ${head}
      ${init ? `<script type="module">import '/src/utils/back-to-top-init.js';</script>` : ''}
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const rect = (page, sel) => page.locator(sel).evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, mid: r.left + r.width / 2, vw: document.documentElement.clientWidth, vh: innerHeight };
});

for (const dir of ['ltr', 'rtl']) {
  test(`${dir}: *-center floats sit on the viewport midpoint`, async ({ page }) => {
    await load(page, `
      <button id="bc" data-float="bottom-center">bottom centre pill</button>
      <button id="tc" data-float="top-center">top</button>
      <button id="cc" data-float="center-center">centre centre</button>
      <fab-stack id="fs" data-float="top-center"><button>a</button><button>b</button></fab-stack>`, { dir });
    for (const sel of ['#bc', '#tc', '#cc', '#fs']) {
      const r = await rect(page, sel);
      expect(Math.abs(r.mid - r.vw / 2), `${sel} midpoint`).toBeLessThan(1.5);
    }
  });
}

test('rtl: inline-end edge uses the left safe-area inset', async ({ page }) => {
  const head = '<style>:root { --safe-left: 40px; --safe-right: 0px; }</style>';
  await load(page, `
    <button id="f" data-float="bottom-right">float end</button>
    <button id="s" data-float="bottom-left">float start</button>`, { dir: 'rtl', head });
  const end = await rect(page, '#f');
  expect(end.left).toBeCloseTo(60, 0); // physical left edge: offset + --safe-left
  const start = await rect(page, '#s');
  expect(start.vw - start.right).toBeCloseTo(20, 0); // physical right edge: offset + --safe-right (0)
});

test('rtl: bare fab-stack and bare back-to-top use the left safe-area inset', async ({ page }) => {
  const head = '<style>:root { --safe-left: 40px; --safe-right: 0px; }</style>';
  await load(page, `
    <fab-stack id="fs"><button>a</button></fab-stack>
    <a id="btt" href="#" data-back-to-top aria-label="Back to top">&uarr;</a>`, { dir: 'rtl', head });
  expect((await rect(page, '#fs')).left).toBeCloseTo(60, 0);
  expect((await rect(page, '#btt')).left).toBeCloseTo(60, 0);
});

test('ltr: inline-end edge still uses the right safe-area inset', async ({ page }) => {
  const head = '<style>:root { --safe-left: 0px; --safe-right: 40px; }</style>';
  await load(page, `
    <button id="f" data-float="bottom-right">float end</button>
    <fab-stack id="fs"><button>a</button></fab-stack>`, { head });
  const f = await rect(page, '#f');
  expect(f.vw - f.right).toBeCloseTo(60, 0);
  const fs = await rect(page, '#fs');
  expect(fs.vw - fs.right).toBeCloseTo(60, 0);
});

test('modal dialog child of fab-stack is centred in the top layer', async ({ page }) => {
  await load(page, `
    <fab-stack data-float="bottom-right">
      <button id="open">Open</button>
      <dialog id="dlg"><p>Dialog body text for centring.</p><button>Close</button></dialog>
    </fab-stack>`);
  await page.evaluate(() => /** @type {HTMLDialogElement} */ (document.getElementById('dlg')).showModal());
  const r = await rect(page, '#dlg');
  const pos = await page.locator('#dlg').evaluate((el) => getComputedStyle(el).position);
  expect(pos).toBe('fixed');
  expect(Math.abs(r.mid - r.vw / 2)).toBeLessThan(2);
  expect(Math.abs((r.top + r.bottom) / 2 - r.vh / 2)).toBeLessThan(2);
});

test('popover child of fab-stack keeps its own positioning', async ({ page }) => {
  await load(page, `
    <fab-stack data-float="bottom-right">
      <button popovertarget="pop">Open</button>
      <aside id="pop" popover>Popover body</aside>
    </fab-stack>`);
  await page.evaluate(() => document.getElementById('pop').showPopover());
  const pos = await page.locator('#pop').evaluate((el) => getComputedStyle(el).position);
  expect(pos).toBe('fixed');
});

test('child order: first child nearest the anchored edge', async ({ page }) => {
  await load(page, `
    <fab-stack data-float="bottom-right"><button id="b1">1</button><button id="b2">2</button></fab-stack>
    <fab-stack data-float="top-left"><button id="t1">1</button><button id="t2">2</button></fab-stack>
    <fab-stack><button id="d1">1</button><button id="d2">2</button></fab-stack>`);
  expect((await rect(page, '#b1')).top).toBeGreaterThan((await rect(page, '#b2')).top);
  expect((await rect(page, '#d1')).top).toBeGreaterThan((await rect(page, '#d2')).top);
  expect((await rect(page, '#t1')).top).toBeLessThan((await rect(page, '#t2')).top);
});

test('data-float child inside fab-stack does not keep its own translate', async ({ page }) => {
  await load(page, `
    <fab-stack data-float="bottom-right"><button id="c" data-float="bottom-center">c</button></fab-stack>`);
  const t = await page.locator('#c').evaluate((el) => getComputedStyle(el).translate);
  expect(t).toBe('none');
});

const BTT_PAGE = `
  <button id="before">Before</button>
  <fab-stack data-float="bottom-right">
    <a id="btt" href="#" data-back-to-top aria-label="Back to top">&uarr;</a>
  </fab-stack>
  <button id="after">After</button>
  <p id="spacer">Tall content</p>`;

test('a hidden back-to-top takes no room in the stack; a visible one does', async ({ page }) => {
  await load(page, `
    <main><p id="spacer">Text</p></main>
    <fab-stack id="stack">
      <button type="button" id="gear" style="inline-size:44px;block-size:44px">G</button>
      <a href="#" id="top" data-back-to-top aria-label="Back to top">&uarr;</a>
      <button type="button" id="tools" style="inline-size:44px;block-size:44px">T</button>
    </fab-stack>`, { head: '<style>#spacer { min-block-size: 400vh; } fab-stack { --fab-stack-gap: 10px; }</style>' });
  await page.waitForSelector('#top[data-back-to-top-init]:not([data-state-visible])', { state: 'attached' });
  const gap = async () => (await rect(page, '#gear')).top - (await rect(page, '#tools')).bottom;
  // Hidden: the two buttons sit one gap apart
  await expect.poll(gap).toBe(10);
  expect(await page.locator('#top').evaluate((el) => getComputedStyle(el).display)).toBe('none');
  await page.evaluate(() => {
    const y = innerHeight * 2;
    document.body.scrollTop = y;
    document.documentElement.scrollTop = y;
    window.scrollTo(0, y);
  });
  await page.waitForSelector('#top[data-state-visible]');
  // Visible: it sits between them, a gap either side
  await expect.poll(gap).toBe(10 + 44 + 10);
  const t = await rect(page, '#top');
  expect(t.top).toBe((await rect(page, '#tools')).bottom + 10);
});

test('hidden back-to-top is skipped by Tab', async ({ page }) => {
  await load(page, BTT_PAGE);
  await page.waitForSelector('#btt[data-back-to-top-init]:not([data-state-visible])', { state: 'attached' });
  await expect.poll(() => page.locator('#btt').evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');
  await page.focus('#before');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('after');
});

test('visible back-to-top is reachable by Tab', async ({ page }) => {
  await load(page, BTT_PAGE, { head: '<style>#spacer { min-block-size: 400vh; }</style>' });
  await page.waitForSelector('#btt[data-back-to-top-init]', { state: 'attached' });
  await page.evaluate(() => {
    const y = innerHeight * 2;
    document.body.scrollTop = y;
    document.documentElement.scrollTop = y;
    window.scrollTo(0, y);
  });
  await page.waitForSelector('#btt[data-state-visible]');
  await expect.poll(() => page.locator('#btt').evaluate((el) => getComputedStyle(el).visibility)).toBe('visible');
  await page.focus('#before');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('btt');
});

test('back-to-top without JS init stays visible and focusable', async ({ page }) => {
  await load(page, BTT_PAGE, { init: false });
  expect(await page.locator('#btt').evaluate((el) => getComputedStyle(el).visibility)).toBe('visible');
  await page.focus('#before');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('btt');
});
