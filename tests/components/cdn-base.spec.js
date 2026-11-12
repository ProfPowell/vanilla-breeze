// A page that loads Vanilla Breeze from another origin (a CDN) must ask that
// origin for the files that sit beside the bundle, not its own "/cdn/...".
// Both origins are intercepted: the "CDN" serves dist/cdn from disk, the
// "app" serves one page and 404s everything else.
import { test, expect } from 'playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CDN_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist', 'cdn');
const CDN = 'https://cdn.test/pkg/dist/cdn';
const TYPES = { js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', json: 'application/json', woff2: 'font/woff2' };

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>CDN install</title>
<link rel="stylesheet" href="${CDN}/vanilla-breeze.css">
<script type="module" src="${CDN}/vanilla-breeze.js"></script></head>
<body><theme-picker></theme-picker><icon-wc name="star"></icon-wc><button type="button" data-icon="check">Save</button></body></html>`;

test('a CDN install loads icons from the CDN, with no request for /cdn on the page origin', async ({ page }) => {
  await page.route('https://cdn.test/**', (route) => {
    const file = join(CDN_DIR, new URL(route.request().url()).pathname.replace('/pkg/dist/cdn/', ''));
    if (!existsSync(file)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({
      body: readFileSync(file),
      contentType: TYPES[file.split('.').pop() ?? ''] ?? 'text/plain',
      headers: { 'access-control-allow-origin': '*' },
    });
  });
  const appRequests = [];
  await page.route('https://app.test/**', (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: PAGE });
    appRequests.push(pathname);
    return route.fulfill({ status: 404, body: '' });
  });
  const icons = [];
  page.on('response', (r) => { if (r.url().includes('/icons/')) icons.push(`${r.status()} ${r.url()}`); });

  await page.goto('https://app.test/');
  await expect(page.locator('icon-wc[name="star"] svg')).toBeAttached();

  expect(icons).toContain(`200 ${CDN}/icons/lucide/star.svg`);
  expect(icons.filter((line) => !line.startsWith(`200 ${CDN}/icons/`))).toEqual([]);
  expect(appRequests.filter((path) => path.startsWith('/cdn'))).toEqual([]);

  // The [data-icon] enhancer hands its URL to CSS, so it must be absolute.
  const mask = await page.evaluate(() => getComputedStyle(document.querySelector('[data-icon]')).getPropertyValue('--vb-icon'));
  expect(mask).toContain(`${CDN}/icons/lucide/check.svg`);
  expect(await page.locator('icon-wc[name="star"]').evaluate((el) => el.basePath)).toBe(`${CDN}/icons`);
});
