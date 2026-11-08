/**
 * Interest timing on VB's interestfor polyfill path (vanilla-breeze-q6vs).
 *
 * The polyfill (src/utils/interest-polyfill.js) reads --interest-delay*
 * from the INVOKER. VB's 200ms/100ms tooltip timing used to sit on
 * [popover="hint"], where nothing reads it. Native interest invokers are
 * switched off in this file so the polyfill is what opens the hint.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

test.use({ launchOptions: { args: ['--disable-blink-features=HTMLInterestForAttribute'] } });

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__interest-timing-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" data-mode="light"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module" src="/src/main.js"></script>
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-interest-polyfill'));
}

const isOpen = (page) => page.evaluate(() => document.getElementById('hint').matches(':popover-open'));

test('native interest invokers are off, the polyfill is on', async ({ page }) => {
  await load(page, '<main><button id="inv" interestfor="hint">Hover</button><p id="hint" popover="hint">Hint</p></main>');
  expect(await page.evaluate(() => 'interestForElement' in HTMLButtonElement.prototype)).toBe(false);
});

test('polyfill opens a hint with VB timing read from the invoker', async ({ page }) => {
  await load(page, `<main><p style="padding-block-start:6rem">
    <button id="inv" interestfor="hint">Hover</button></p>
    <p id="hint" popover="hint">Hint text</p></main>`);
  await page.hover('#inv');
  // The polyfill's own default is 500ms; VB's 200ms opens it well before.
  await page.waitForTimeout(380);
  expect(await isOpen(page)).toBe(true);
});

test('an author shorthand on the invoker overrides VB timing', async ({ page }) => {
  await load(page, `<style>#inv { --interest-delay: 900ms 100ms; }</style><main><p style="padding-block-start:6rem">
    <button id="inv" interestfor="hint">Hover</button></p>
    <p id="hint" popover="hint">Hint text</p></main>`);
  await page.hover('#inv');
  await page.waitForTimeout(500);
  expect(await isOpen(page)).toBe(false);
  await expect.poll(() => isOpen(page)).toBe(true);
});

test('an author longhand on the invoker overrides VB timing', async ({ page }) => {
  await load(page, `<style>#inv { --interest-delay-start: 900ms; }</style><main><p style="padding-block-start:6rem">
    <button id="inv" interestfor="hint">Hover</button></p>
    <p id="hint" popover="hint">Hint text</p></main>`);
  await page.hover('#inv');
  await page.waitForTimeout(500);
  expect(await isOpen(page)).toBe(false);
  await expect.poll(() => isOpen(page)).toBe(true);
});

test('a plain <section> hint is placed above its invoker by the polyfill path', async ({ page }) => {
  await load(page, `<main><p style="padding-block-start:8rem;padding-inline-start:6rem">
    <button id="inv" interestfor="hint">Hover</button></p>
    <section id="hint" popover="hint"><p>Section hint with some text</p></section></main>`);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('hint')).display)).toBe('none');
  await page.hover('#inv');
  await expect.poll(() => isOpen(page)).toBe(true);
  const r = await page.evaluate(() => {
    const i = document.getElementById('inv').getBoundingClientRect();
    const s = document.getElementById('hint').getBoundingClientRect();
    return { top: i.top, icx: i.left + i.width / 2, bottom: s.bottom, scx: s.left + s.width / 2, w: s.width };
  });
  expect(r.w).toBeGreaterThan(100);
  expect(r.bottom).toBeLessThanOrEqual(r.top + 1);
  expect(r.top - r.bottom).toBeLessThan(24);
  expect(Math.abs(r.scx - r.icx)).toBeLessThan(4);
});

test('<tool-tip delay> sets the start delay on its interestfor trigger and removes it on teardown', async ({ page }) => {
  // Inserted after the polyfill has marked the page, so tool-tip takes the
  // interestfor path (an earlier upgrade uses its JS timers, which already
  // honour delay).
  await load(page, '<main><p id="host" style="padding-block-start:6rem"></p></main>');
  await page.evaluate(() => {
    document.getElementById('host').innerHTML =
      '<tool-tip id="tt" delay="900" content="Saved to drafts"><button id="trig">Save</button></tool-tip>';
  });
  const trig = page.locator('#trig');
  await expect(trig).toHaveAttribute('interestfor', /.+/);
  expect(await trig.evaluate((el) => el.style.getPropertyValue('--interest-delay-start'))).toBe('900ms');
  const tipOpen = () => page.evaluate(() => {
    const id = document.getElementById('trig').getAttribute('interestfor');
    return !!id && document.getElementById(id)?.matches(':popover-open');
  });
  await page.hover('#trig');
  await page.waitForTimeout(500);
  expect(await tipOpen()).toBe(false);
  await expect.poll(tipOpen).toBe(true);
  const after = await page.evaluate(() => {
    const t = document.getElementById('trig');
    document.getElementById('tt').remove();
    return [t.style.getPropertyValue('--interest-delay-start'), t.style.getPropertyValue('interest-delay-start')];
  });
  expect(after).toEqual(['', '']);
});
