/**
 * bread-crumb + nav.breadcrumb (vanilla-breeze-si2n).
 *
 * Review findings covered: separators/ellipsis read aloud (CSS alt text),
 * no landmark without JS / duplicate landmark inside <nav>, aria-current on
 * the last crumb, data-truncated never ellipsizing (text-overflow on the
 * flex <li>), unreachable collapsed crumbs (now a real toggle button),
 * JSON-LD resolving against location.origin, undecoded pathname segments,
 * data-current-label losing to labels[seg], and move/reconnect idempotence.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {string} [path] fixture path below the random prefix
 */
async function load(page, body, path = 'index.html') {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const prefix = `/__bread-crumb-${Math.random().toString(36).slice(2)}`;
  await page.route(`**${prefix}/**`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/bread-crumb/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(`${prefix}/${path}`, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('bread-crumb'));
}

const TRAIL = `<ol>
  <li><a href="/">Home</a></li>
  <li><a href="/a/">A</a></li>
  <li><a href="/a/b/">B</a></li>
  <li><a href="/a/b/c/">C</a></li>
  <li><a href="/a/b/c/d/">D</a></li>
  <li><span>Page</span></li>
</ol>`;

test('separators and the no-JS collapse ellipsis carry empty alt text', async ({ page }) => {
  await load(page, `
    <nav aria-label="Component"><bread-crumb data-separator="arrow">${TRAIL}</bread-crumb></nav>
    <nav class="breadcrumb" aria-label="Native">${TRAIL}</nav>
    <nav class="breadcrumb" data-collapsed aria-label="Native collapsed">${TRAIL}</nav>`);
  await page.waitForSelector('bread-crumb[data-upgraded]');
  const r = await page.evaluate(() => {
    const after = (/** @type {string} */ sel) => getComputedStyle(/** @type {Element} */ (document.querySelector(sel)), '::after').content;
    const before = (/** @type {string} */ sel) => getComputedStyle(/** @type {Element} */ (document.querySelector(sel)), '::before').content;
    return {
      component: after('bread-crumb li'),
      native: after('nav[aria-label="Native"] li'),
      nativeEllipsis: before('nav[aria-label="Native collapsed"] li:nth-last-child(2)'),
    };
  });
  expect(r.component).toContain('/ ""');
  expect(r.component).toContain('→');
  expect(r.native).toContain('/ ""');
  expect(r.nativeEllipsis).toContain('/ ""');
});

test('inside a <nav> no duplicate landmark; outside, the fallback role applies', async ({ page }) => {
  await load(page, `
    <nav aria-label="Breadcrumb" id="wrap"><bread-crumb id="wrapped">${TRAIL}</bread-crumb></nav>
    <bread-crumb id="bare">${TRAIL}</bread-crumb>`);
  await page.waitForSelector('#bare[data-upgraded]');
  const r = await page.evaluate(async () => {
    const wrapped = /** @type {HTMLElement} */ (document.getElementById('wrapped'));
    const bare = /** @type {HTMLElement} */ (document.getElementById('bare'));
    const before = {
      wrappedRole: wrapped.getAttribute('role'),
      wrappedLabel: wrapped.getAttribute('aria-label'),
      bareRole: bare.getAttribute('role'),
      bareLabel: bare.getAttribute('aria-label'),
    };
    /* Moving the bare one into a nav drops the role it added */
    document.getElementById('wrap')?.append(bare);
    await new Promise((res) => setTimeout(res, 0));
    return { ...before, movedRole: bare.getAttribute('role'), movedLabel: bare.getAttribute('aria-label') };
  });
  expect(r).toEqual({
    wrappedRole: null,
    wrappedLabel: null,
    bareRole: 'navigation',
    bareLabel: 'Breadcrumb',
    movedRole: null,
    movedLabel: null,
  });
  await expect(page.getByRole('navigation')).toHaveCount(1);
});

test('the last crumb gets aria-current="page", earlier ones do not', async ({ page }) => {
  await load(page, `<nav aria-label="Breadcrumb"><bread-crumb>
    <ol><li><a href="/" aria-current="page">Home</a></li><li><a href="/x/">X</a></li><li><span>Here</span></li></ol>
  </bread-crumb></nav>`);
  await page.waitForSelector('bread-crumb[data-upgraded]');
  const current = await page.$$eval('bread-crumb [aria-current]', (els) => els.map((e) => [e.textContent, e.getAttribute('aria-current')]));
  expect(current).toEqual([['Here', 'page']]);
});

test('data-truncated ellipsizes the link, in both component and native nav', async ({ page }) => {
  const long = 'An exceptionally long breadcrumb label that must not fit in ten rem';
  await load(page, `
    <nav aria-label="Component"><bread-crumb><ol>
      <li><a href="/">Home</a></li><li data-truncated><a href="/long/">${long}</a></li><li><span>Page</span></li>
    </ol></bread-crumb></nav>
    <nav class="breadcrumb" aria-label="Native"><ol>
      <li><a href="/">Home</a></li><li data-truncated><a href="/long/">${long}</a></li><li><span>Page</span></li>
    </ol></nav>`);
  await page.waitForSelector('bread-crumb[data-upgraded]');
  const r = await page.$$eval('[data-truncated] > a', (links) => links.map((a) => ({
    overflowing: a.scrollWidth > a.clientWidth,
    textOverflow: getComputedStyle(a).textOverflow,
    whiteSpace: getComputedStyle(a).whiteSpace,
  })));
  expect(r).toHaveLength(2);
  for (const link of r) {
    expect(link).toEqual({ overflowing: true, textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
  }
});

test('data-collapsed exposes a toggle button that reveals hidden crumbs', async ({ page }) => {
  await load(page, `<nav aria-label="Breadcrumb"><bread-crumb data-collapsed>${TRAIL}</bread-crumb></nav>`);
  await page.waitForSelector('bread-crumb[data-upgraded]');

  const toggle = page.getByRole('button', { name: 'Show full path' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  /* first, parent and current are visible; A, B, C are hidden */
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'D' })).toBeVisible();
  for (const name of ['A', 'B', 'C']) {
    await expect(page.getByRole('link', { name, exact: true })).toBeHidden();
  }

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  for (const name of ['A', 'B', 'C']) {
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
  }

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('link', { name: 'B', exact: true })).toBeHidden();

  /* The toggle is not a crumb: aria-current and JSON-LD ignore it */
  const ld = await page.evaluate(() => JSON.parse(document.querySelector('bread-crumb script[type="application/ld+json"]')?.textContent || '{}'));
  expect(ld.itemListElement.map((/** @type {{name: string}} */ i) => i.name)).toEqual(['Home', 'A', 'B', 'C', 'D', 'Page']);
  await expect(page.locator('bread-crumb [aria-current="page"]')).toHaveText('Page');
});

test('a short collapsed trail gets no toggle and hides nothing', async ({ page }) => {
  await load(page, `<nav aria-label="Breadcrumb"><bread-crumb data-collapsed><ol>
    <li><a href="/">Home</a></li><li><a href="/a/">A</a></li><li><span>Page</span></li>
  </ol></bread-crumb></nav>`);
  await page.waitForSelector('bread-crumb[data-upgraded]');
  await expect(page.getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'A', exact: true })).toBeVisible();
});

test('JSON-LD resolves relative hrefs against the document URL', async ({ page }) => {
  await load(page, `<nav aria-label="Breadcrumb"><bread-crumb><ol>
    <li><a href="../../">Root</a></li><li><a href="../">Section</a></li><li><span>Page</span></li>
  </ol></bread-crumb></nav>`, 'section/sub/page.html');
  await page.waitForSelector('bread-crumb[data-upgraded]');
  const r = await page.evaluate(() => ({
    ld: JSON.parse(document.querySelector('bread-crumb script[type="application/ld+json"]')?.textContent || '{}'),
    expected: [new URL('../../', location.href).href, new URL('../', location.href).href],
  }));
  expect(r.ld.itemListElement.slice(0, 2).map((/** @type {{item: string}} */ i) => i.item)).toEqual(r.expected);
  expect(r.ld.itemListElement[2].item).toBeUndefined();
});

test('auto mode decodes segments, survives malformed escapes, and data-current-label wins', async ({ page }) => {
  await load(page, '', 'caf%C3%A9-menu/100%ZZ-off/page-name/');
  const names = await page.evaluate(async () => {
    const bc = /** @type {HTMLElement & { labels: Record<string, string> }} */ (document.createElement('bread-crumb'));
    bc.setAttribute('data-from-pathname', '');
    bc.setAttribute('data-current-label', 'Current Label');
    bc.labels = { 'page-name': 'From Labels' };
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Breadcrumb');
    nav.append(bc);
    document.querySelector('main')?.append(nav);
    await new Promise((res) => setTimeout(res, 0));
    return Array.from(bc.querySelectorAll(':scope > ol > li')).map((li) => li.textContent?.trim());
  });
  expect(names[0]).toBe('Home');
  expect(names).toContain('Café Menu');
  expect(names).toContain('100%ZZ Off');
  expect(names.at(-1)).toBe('Current Label');
});

test('move and reconnect keep a single <ol>, JSON-LD script and toggle', async ({ page }) => {
  await load(page, `<nav aria-label="Breadcrumb"><bread-crumb data-collapsed>${TRAIL}</bread-crumb></nav><section aria-label="Elsewhere"></section>`);
  await page.waitForSelector('bread-crumb[data-upgraded]');
  const r = await page.evaluate(async () => {
    const bc = /** @type {HTMLElement} */ (document.querySelector('bread-crumb'));
    const section = /** @type {HTMLElement} */ (document.querySelector('section'));
    section.append(bc);
    await new Promise((res) => setTimeout(res, 0));
    bc.remove();
    document.querySelector('nav')?.append(bc);
    await new Promise((res) => setTimeout(res, 0));
    return {
      ols: bc.querySelectorAll(':scope > ol').length,
      scripts: bc.querySelectorAll(':scope > script[type="application/ld+json"]').length,
      toggles: bc.querySelectorAll('[data-crumb-toggle]').length,
      upgraded: bc.hasAttribute('data-upgraded'),
    };
  });
  expect(r).toEqual({ ols: 1, scripts: 1, toggles: 1, upgraded: true });

  /* one click → one toggle after reconnect (no doubled listener) */
  const toggle = page.getByRole('button', { name: 'Show full path' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
});
