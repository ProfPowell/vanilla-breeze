/**
 * content-lens — review fixes (vanilla-breeze-1fvo / i89g / pohq / 25vi / ra3u batch).
 *
 * Covers: visible chip focus, order-independent data-lens-src forwarding,
 * popularity-index keeping its analytics endpoint, no change event on
 * setup/reconnect, no <nav> landmark, and CSS.escape for lens names.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const PAGES = { pages: [{ url: '/a/', title: 'Alpha', provenance: 'human', review: 'reviewed', status: 'published' }] };

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {string} script  module body run in <head>
 */
async function load(page, body, script = "import '/src/web-components/content-lens/logic.js';") {
  /** @type {string[]} */
  const requests = [];
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__lens-pages.json', (route) => {
    requests.push(new URL(route.request().url()).pathname);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PAGES) });
  });
  await page.route('**/api/analytics/popular**', (route) => {
    requests.push(new URL(route.request().url()).pathname);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ pages: [{ url: '/a/', views: 42 }] }) });
  });
  const url = `/__content-lens-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">${script}</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  return requests;
}

const BASIC = `<content-lens data-lens-storage="t-${Math.random()}">
  <section data-lens-name="one"><p>One</p></section>
  <section data-lens-name="two"><p>Two</p></section>
</content-lens>`;

test('keyboard focus on a chip shows a visible outline on the label', async ({ page }) => {
  await load(page, `<button type="button">before</button>${BASIC}`);
  await page.waitForSelector('content-lens[data-upgraded]');
  await page.locator('button').focus();
  await page.keyboard.press('Tab');
  const style = await page.evaluate(() => {
    const label = document.activeElement?.closest('label');
    const cs = label && getComputedStyle(label);
    return cs && { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(style?.style).not.toBe('none');
  expect(style?.width).toBeGreaterThan(0);
});

test('controls are a named fieldset, not a nav landmark', async ({ page }) => {
  await load(page, BASIC);
  await page.waitForSelector('content-lens[data-upgraded]');
  expect(await page.locator('content-lens nav').count()).toBe(0);
  await expect(page.getByRole('group', { name: 'View' })).toHaveCount(1);
  await expect(page.getByRole('radio')).toHaveCount(2);
});

test('data-lens-src reaches a child that upgraded before the host', async ({ page }) => {
  const requests = await load(page, `
    <content-lens data-lens-src="/__lens-pages.json" data-lens-storage="t-${Math.random()}">
      <trust-filter data-lens-name="trust"></trust-filter>
    </content-lens>`, `
    await import('/src/web-components/trust-filter/logic.js');
    await customElements.whenDefined('trust-filter');
    await new Promise((r) => setTimeout(r, 50));
    await import('/src/web-components/content-lens/logic.js');`);
  await page.waitForSelector('content-lens[data-upgraded]');
  await expect(page.locator('trust-filter [data-trust-filter-controls]')).toHaveCount(1);
  expect(requests).toContain('/__lens-pages.json');
});

test('data-lens-src reaches a child that upgrades after the host', async ({ page }) => {
  const requests = await load(page, `
    <content-lens data-lens-src="/__lens-pages.json" data-lens-storage="t-${Math.random()}">
      <trust-filter data-lens-name="trust"></trust-filter>
    </content-lens>`, `
    await import('/src/web-components/content-lens/logic.js');
    await customElements.whenDefined('content-lens');
    await new Promise((r) => setTimeout(r, 50));
    await import('/src/web-components/trust-filter/logic.js');`);
  await expect(page.locator('trust-filter [data-trust-filter-controls]')).toHaveCount(1);
  expect(requests).toContain('/__lens-pages.json');
});

test('forwarded data-lens-src does not replace popularity-index analytics endpoint', async ({ page }) => {
  const requests = await load(page, `
    <content-lens data-lens-src="/__lens-pages.json" data-lens-storage="t-${Math.random()}">
      <popularity-index data-lens-name="popular"></popularity-index>
    </content-lens>`, `
    import '/src/web-components/content-lens/logic.js';
    import '/src/web-components/popularity-index/logic.js';`);
  await expect(page.locator('popularity-index li')).toHaveCount(1);
  expect(requests[0]).toBe('/api/analytics/popular');
  // The shared pages.json is still used — as metadata enrichment.
  expect(requests).toContain('/__lens-pages.json');
  await expect(page.locator('popularity-index')).toContainText('Alpha');
});

test('content-lens:change fires on switches only, not on setup or reconnect', async ({ page }) => {
  await page.addInitScript(() => {
    /** @type {any} */ (window).__changes = [];
    document.addEventListener('content-lens:change', (e) => /** @type {any} */ (window).__changes.push(/** @type {CustomEvent} */ (e).detail.lens));
  });
  await load(page, BASIC);
  await page.waitForSelector('content-lens[data-upgraded]');
  const r = await page.evaluate(async () => {
    const w = /** @type {any} */ (window);
    const host = /** @type {any} */ (document.querySelector('content-lens'));
    const afterSetup = [...w.__changes];
    const parent = /** @type {HTMLElement} */ (host.parentElement);
    host.remove();
    parent.append(host);
    await new Promise((res) => setTimeout(res, 20));
    const afterReconnect = [...w.__changes];
    host.setLens('two');
    host.setLens('two');
    /** @type {HTMLInputElement} */ (host.querySelector('input[value="one"]')).click();
    return { afterSetup, afterReconnect, final: [...w.__changes], active: host.activeLens };
  });
  expect(r.afterSetup).toEqual([]);
  expect(r.afterReconnect).toEqual([]);
  expect(r.final).toEqual(['two', 'one']);
  expect(r.active).toBe('one');
});

test('lens names needing CSS escaping still check their chip', async ({ page }) => {
  await load(page, `<content-lens data-lens-storage="t-${Math.random()}">
    <section data-lens-name='a"b'><p>Quoted</p></section>
    <section data-lens-name="c d"><p>Spaced</p></section>
  </content-lens>`);
  await page.waitForSelector('content-lens[data-upgraded]');
  const r = await page.evaluate(() => {
    const host = /** @type {any} */ (document.querySelector('content-lens'));
    host.setLens('c d');
    const checked = /** @type {HTMLInputElement} */ (host.querySelector('input:checked'));
    return { checked: checked?.value };
  });
  expect(r.checked).toBe('c d');
});
