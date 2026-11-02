/**
 * change-set — review fixes (vanilla-breeze-5ac4 / -i89g / -ra3u).
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__change-set-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/change-set/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('change-set'));
  await page.waitForSelector('change-set[data-upgraded]', { state: 'attached' });
}

const pressed = (page, sel) => page.locator(`${sel} [data-controls] button[aria-pressed="true"]`);
const BODY = '<p>Send to <del>/v1</del> <ins>/v2</ins>.</p>';

test('aria-pressed starts from the view attribute and follows attribute changes', async ({ page }) => {
  await load(page, `<change-set id="a" view="final">${BODY}</change-set>`);
  await expect(pressed(page, '#a')).toHaveText('Final');
  await page.evaluate(() => document.getElementById('a').setAttribute('view', 'original'));
  await expect(pressed(page, '#a')).toHaveText('Original');
  await page.evaluate(() => document.getElementById('a').removeAttribute('view'));
  await expect(pressed(page, '#a')).toHaveText('Tracking');
});

test('controls are a named group (not a landmark) that includes author and date', async ({ page }) => {
  await load(page, `<change-set id="a" author="tpowell" datetime="2026-02-20">${BODY}</change-set>
    <change-set id="b">${BODY}</change-set>`);
  expect(await page.locator('change-set nav').count()).toBe(0);
  const group = page.locator('#a [data-controls]');
  await expect(group).toHaveAttribute('role', 'group');
  await expect(group).toHaveAccessibleName('Change view, Changes by tpowell, Feb 20, 2026');
  await expect(page.locator('#a [data-change-caption]')).toHaveText('Changes by tpowell, Feb 20, 2026');
  await expect(page.locator('#a [data-change-caption] time')).toHaveAttribute('datetime', '2026-02-20');
  await expect(page.locator('#b [data-controls]')).toHaveAccessibleName('Change view');
  expect(await page.locator('#b [data-change-caption]').count()).toBe(0);
});

test('controls="none" renders no toggles; the view still applies', async ({ page }) => {
  await load(page, `<change-set id="a" view="final" controls="none">${BODY}</change-set>`);
  expect(await page.locator('#a [data-controls]').count()).toBe(0);
  await expect(page.locator('#a del')).toBeHidden();
});

test('clicks and the view property update state and emit change-set:view', async ({ page }) => {
  await load(page, `<change-set id="a">${BODY}</change-set>`);
  const events = await page.evaluate(() => {
    const cs = document.getElementById('a');
    const seen = [];
    cs.addEventListener('change-set:view', (e) => seen.push(e.detail));
    cs.querySelector('[data-action="original"]').click();
    cs.view = 'final';
    cs.view = 'final'; // no-op
    cs.view = 'bogus'; // ignored
    return { seen, attr: cs.getAttribute('view') };
  });
  expect(events).toEqual({ seen: [{ view: 'original' }, { view: 'final', source: 'api' }], attr: 'final' });
  await expect(pressed(page, '#a')).toHaveText('Final');
});

test('no duplicate controls and toggles still work after a reconnect', async ({ page }) => {
  await load(page, `<change-set id="a" author="x">${BODY}</change-set>`);
  await page.evaluate(() => {
    const cs = document.getElementById('a');
    cs.remove();
    document.querySelector('main').append(cs);
  });
  await page.waitForSelector('#a[data-upgraded]', { state: 'attached' });
  expect(await page.locator('#a [data-controls]').count()).toBe(1);
  expect(await page.locator('#a [data-change-caption]').count()).toBe(1);
  await page.locator('#a [data-action="final"]').click();
  await expect(page.locator('#a')).toHaveAttribute('view', 'final');
});

test('tracking view announces insertions and deletions with hidden markers', async ({ page }) => {
  await load(page, `<change-set id="a">${BODY}</change-set><change-set id="b" view="final">${BODY}</change-set>`);
  const r = await page.evaluate(() => {
    const c = (sel, pseudo) => getComputedStyle(document.querySelector(sel), pseudo).content;
    return {
      insBefore: c('#a ins', '::before'),
      delAfter: c('#a del', '::after'),
      finalIns: c('#b ins', '::before'),
      clipped: getComputedStyle(document.querySelector('#a ins'), '::before').clipPath,
    };
  });
  expect(r.insBefore).toBe('" [insertion start] "');
  expect(r.delAfter).toBe('" [deletion end] "');
  expect(r.finalIns).toBe('none');
  expect(r.clipped).toBe('inset(50%)');
  // Exposed to the accessibility tree as text.
  expect(await page.locator('#a p').ariaSnapshot()).toContain('[insertion start]');
});
