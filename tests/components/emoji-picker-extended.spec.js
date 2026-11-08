/**
 * Extended emoji set reaches every consumer (vanilla-breeze-t7hm).
 *
 * emoji-data.js is bundled separately into the autoload bundle (data-emoji)
 * and components/emoji-picker.js; the extended file hands its batch over via
 * one shared Symbol.for() registry. Both consumers must see it in either
 * load order.
 *
 * Runs against dist/cdn (served from disk), so `npm run build:cdn` first.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const BODY = `
  <p id="text" data-emoji>Core :rocket: and extended :melting_face:</p>
  <emoji-picker id="ep"></emoji-picker>`;

/**
 * @param {import('playwright/test').Page} page
 * @param {'before' | 'after'} order where the extended script sits relative to VB
 */
async function load(page, order) {
  await page.route('**/cdn/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^.*?\/cdn\//, 'dist/cdn/');
    return route.fulfill({ path: join(REPO, path) });
  });
  const ext = '<script type="module" src="/cdn/emoji-extended.js"></script>';
  const vb = '<script type="module" src="/cdn/vanilla-breeze-autoload.js"></script>';
  const url = `/__emoji-ext-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      ${order === 'before' ? ext : ''}${vb}
      </head><body><main>${BODY}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('emoji-picker[data-upgraded]', { state: 'attached' });
  if (order === 'after') {
    await expect(page.locator('#text')).toHaveText('Core 🚀 and extended :melting_face:');
    await page.addScriptTag({ type: 'module', url: '/cdn/emoji-extended.js' });
  }
}

for (const order of /** @type {const} */ (['before', 'after'])) {
  test(`autoload: extended loaded ${order} VB reaches data-emoji and emoji-picker`, async ({ page }) => {
    await load(page, order);
    await expect(page.locator('#text')).toHaveText('Core 🚀 and extended 🫠');

    // The picker is a separate chunk with its own copy of emoji-data.js
    const fetchedChunk = await page.evaluate(() =>
      performance.getEntriesByType('resource').some((e) => e.name.includes('/cdn/components/emoji-picker.js')));
    expect(fetchedChunk).toBe(true);

    await page.evaluate(() => /** @type {any} */ (document.getElementById('ep')).open());
    await page.fill('#ep input[type="search"]', 'melting');
    await expect(page.locator('#ep [role="option"]:not([hidden])')).toHaveCount(1);
    await expect(page.locator('#ep [role="option"]:not([hidden])')).toHaveText('🫠');
  });
}
