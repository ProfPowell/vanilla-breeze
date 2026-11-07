/**
 * Layout attribute docs (L5) — the demos and claims on the data-container,
 * data-page-layout (dashboard drawer), data-layout-density and data-sticky
 * pages match the CSS.
 *
 * Tests the working tree: /src and the demo files are served from disk, not
 * the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function routeSrc(page) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
}

/** Serve a demo file from disk under a fake URL. */
async function loadDemo(page, repoPath) {
  await routeSrc(page);
  const url = `/__l5-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({ path: join(REPO, repoPath) }));
  await page.goto(url, { waitUntil: 'load' });
}

async function loadHtml(page, html) {
  await routeSrc(page);
  const url = `/__l5-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: html,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const columns = (locator) => locator.evaluate(
  (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
);

test('data-container demo: the named card container switches by its own width', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await loadDemo(page, 'demos/snippets/demos/data-container-basic.html');
  const cards = page.locator('[data-container="card"]');
  await expect(cards).toHaveCount(2);
  expect(await cards.nth(0).evaluate((el) => getComputedStyle(el).containerName)).toBe('card');
  expect(await columns(cards.nth(0).locator('ul'))).toBe(1);
  expect(await columns(cards.nth(1).locator('ul'))).toBe(3);

  // The escape hatch keeps the cluster child a container (and it has a width).
  const kept = page.locator('[data-layout="cluster"] > article[data-container]');
  const reset = page.locator('[data-layout="cluster"] > article:not([data-container])');
  expect(await kept.evaluate((el) => getComputedStyle(el).containerType)).toBe('inline-size');
  expect(await reset.evaluate((el) => getComputedStyle(el).containerType)).toBe('normal');
  expect((await kept.boundingBox()).width).toBeGreaterThan(200);
});

test('dashboard drawer demo: closed drawer is hidden, popover opens it, Escape closes it', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await loadDemo(page, 'demos/snippets/demos/page-layout-dashboard-drawer.html');
  const nav = page.locator('#dash-nav');
  const toggle = page.locator('[data-nav-toggle]');

  await expect(toggle).toBeVisible();
  await expect(nav).toBeHidden();
  // Closed links are not reachable by keyboard.
  await page.locator('body').focus();
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.closest('#dash-nav') === null)).toBe(true);
  }

  await toggle.click();
  await expect(nav).toBeVisible();
  expect(await nav.evaluate((el) => el.matches(':popover-open'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
});

test('dashboard drawer demo: from 48rem the nav is a narrow column and the toggle is hidden', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await loadDemo(page, 'demos/snippets/demos/page-layout-dashboard-drawer.html');
  await expect(page.locator('[data-nav-toggle]')).toBeHidden();
  const nav = page.locator('#dash-nav');
  await expect(nav).toBeVisible();
  expect(Math.round((await nav.boundingBox()).width)).toBe(192); // narrow = 12rem
});

test('density demo: compact, default and spacious stacks use different gaps (rem based)', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await loadDemo(page, 'demos/examples/demos/density-basic.html');
  const gaps = await page.locator('layout-card > [data-layout="stack"]').evaluateAll(
    (els) => els.map((el) => getComputedStyle(el).rowGap),
  );
  expect(gaps).toEqual(['12px', '16px', '24px']);

  // Steps follow the root font size (not px constants).
  await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
  const scaled = await page.locator('layout-card > [data-layout="stack"]').first().evaluate(
    (el) => getComputedStyle(el).rowGap,
  );
  expect(scaled).toBe('15px');
});

test('data-sticky: header and footer stick without <html data-sticky>', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await loadHtml(page, `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <link rel="stylesheet" href="/src/main.css"></head>
    <body><header data-sticky>Header</header><main><p>Body</p></main><footer data-sticky>Footer</footer></body></html>`);
  for (const sel of ['header', 'footer']) {
    expect(await page.locator(sel).evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
  }
  // data-layout-sticky on a sidebar needs the coordinated system.
  await loadHtml(page, `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <link rel="stylesheet" href="/src/main.css"></head>
    <body><layout-sidebar><nav aria-label="Side" data-layout-sticky>Nav</nav><article>Main</article></layout-sidebar></body></html>`);
  expect(await page.locator('nav').evaluate((el) => getComputedStyle(el).position)).not.toBe('sticky');
});
