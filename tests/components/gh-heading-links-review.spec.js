/**
 * heading-links — review fixes (vanilla-breeze-wja7).
 *
 * Unicode ids + page-toc listing, copy announcement + icon state, heading
 * accessible name, modified clicks, goToFragment under <base href>, reduced
 * motion, levels validation/observation, skipped contexts, touch visibility.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__heading-links-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">${head}
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/heading-links/logic.js';
        import '/src/web-components/page-toc/logic.js';
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('heading-links[data-upgraded]');
  return url;
}

const UNICODE = `
  <heading-links>
    <h2>日本語の見出し</h2>
    <p>x</p>
    <h2>Café crème</h2>
    <h2>🎉🚀</h2>
    <h2>✨</h2>
    <h2>Usage</h2>
    <h2>Usage</h2>
  </heading-links>`;

test('non-Latin, accented and emoji headings get non-empty unique ids', async ({ page }) => {
  await load(page, UNICODE);
  const r = await page.evaluate(() => [...document.querySelectorAll('heading-links h2')].map((h) => ({
    id: h.id, href: h.querySelector('.heading-anchor')?.getAttribute('href'),
  })));
  expect(r.map((x) => x.id)).toEqual(['日本語の見出し', 'café-crème', 'section', 'section-1', 'usage', 'usage-1']);
  for (const x of r) expect(x.href).toBe(`#${x.id}`);
});

test('page-toc lists the generated Unicode ids', async ({ page }) => {
  await load(page, `${UNICODE}<page-toc scope="main" levels="h2"></page-toc>`);
  await page.waitForSelector('page-toc a[href]');
  const hrefs = await page.$$eval('page-toc a[href^="#"]', (as) => as.map((a) => decodeURIComponent(a.getAttribute('href') ?? '')));
  expect(hrefs).toEqual(expect.arrayContaining(['#日本語の見出し', '#café-crème', '#section', '#section-1']));
});

test('heading accessible name equals its text; anchor named prefix + heading', async ({ page }) => {
  await load(page, `<heading-links data-label-anchor="Lien vers"><h2 id="usage">Usage <code>x</code></h2></heading-links>`);
  await expect(page.getByRole('heading', { level: 2 })).toHaveAccessibleName('Usage x');
  await expect(page.locator('.heading-anchor')).toHaveAccessibleName('Lien vers Usage x');
  // Live: label change and text change are reflected
  await page.evaluate(() => {
    document.querySelector('heading-links').setAttribute('data-label-anchor', 'Copy link to');
    document.querySelector('.heading-text').firstChild.textContent = 'Renamed ';
  });
  await expect(page.getByRole('heading', { level: 2 })).toHaveAccessibleName('Renamed x');
  await expect(page.locator('.heading-anchor')).toHaveAccessibleName('Copy link to Renamed x');
  expect(await page.locator('main').ariaSnapshot()).toContain('heading "Renamed x" [level=2]');
});

test('click: announcement in a live region outside the link, icon toggles and repeated clicks keep the link icon', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await load(page, `<heading-links><h2 id="usage">Usage</h2></heading-links>`);
  const anchor = page.locator('.heading-anchor');
  await anchor.focus();
  await anchor.click();
  await expect(anchor).toHaveAttribute('data-state', 'copied');
  await expect(anchor.locator('icon-wc')).toHaveAttribute('name', 'check');
  const live = await page.evaluate(() => [...document.querySelectorAll('[role="status"]')]
    .map((el) => ({ text: el.textContent, inLink: !!el.closest('a') })));
  expect(live).toContainEqual({ text: 'Link copied to clipboard', inLink: false });
  await anchor.click(); // within the 1.5s window
  await expect(anchor).not.toHaveAttribute('data-state', 'copied', { timeout: 3000 });
  await expect(anchor.locator('icon-wc')).toHaveAttribute('name', 'link');
  expect(await anchor.locator('icon-wc').count()).toBe(1);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toBe(new URL('#usage', page.url()).href);
});

test('modified and middle clicks are not prevented', async ({ page }) => {
  await load(page, `<heading-links><h2 id="usage">Usage</h2></heading-links>`);
  const prevented = await page.evaluate(() => {
    const a = document.querySelector('.heading-anchor');
    const out = [];
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }]) {
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
      // stop the real navigation if not prevented
      document.addEventListener('click', (e) => { out.push(e.defaultPrevented); e.preventDefault(); }, { once: true });
      a.dispatchEvent(ev);
    }
    return out;
  });
  expect(prevented).toEqual([false, false, false, false]);
});

test(':target applies and URL stays on the document under <base href>; event detail', async ({ page }) => {
  const url = await load(page, `<heading-links><h2>Café crème</h2></heading-links>`,
    { head: '<base href="https://cdn.example.invalid/assets/">' });
  await page.evaluate(() => {
    document.addEventListener('heading-links:navigate', (e) => {
      const d = /** @type {CustomEvent} */ (e).detail;
      /** @type {any} */ (window).__nav = { id: d.id, url: d.url, heading: d.heading?.localName };
    });
  });
  await page.locator('.heading-anchor').click();
  const r = await page.evaluate(() => ({
    target: document.querySelector('h2').matches(':target'),
    focused: document.activeElement === document.querySelector('h2'),
    path: location.pathname,
    nav: /** @type {any} */ (window).__nav,
  }));
  expect(r.target).toBe(true);
  expect(r.focused).toBe(true);
  expect(r.path).toBe(url);
  expect(r.nav.id).toBe('café-crème');
  expect(r.nav.heading).toBe('h2');
  expect(new URL(r.nav.url).pathname).toBe(url);
  expect(decodeURIComponent(new URL(r.nav.url).hash)).toBe('#café-crème');
});

test('reduced motion: scroll is instant', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page, `<heading-links><h2 id="top-h">Top</h2><p style="block-size:300vh">x</p><h2 id="far">Far</h2></heading-links>`);
  // jump once so the second click (same hash) takes the scrollIntoView path
  await page.locator('#far .heading-anchor').click();
  await page.evaluate(() => window.scrollTo(0, 0));
  const y = await page.evaluate(() => {
    /** @type {HTMLElement} */ (document.querySelector('#far .heading-anchor')).click();
    return window.scrollY; // synchronous: instant scroll has already happened
  });
  expect(y).toBeGreaterThan(100);
});

test('invalid levels do not throw; levels changes are observed', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page, `<heading-links levels="h2 > a, div, 7"><h2>Two</h2><h3>Three</h3><h4>Four</h4></heading-links>`);
  expect(errors).toEqual([]);
  // falls back to h2,h3
  expect(await page.locator('.heading-anchor').count()).toBe(2);
  await page.evaluate(() => document.querySelector('heading-links').setAttribute('levels', 'H4'));
  await expect(page.locator('h4 .heading-anchor')).toHaveCount(1);
  await expect(page.locator('h2 .heading-anchor, h3 .heading-anchor')).toHaveCount(0);
  // unenhanced headings get their plain content back
  expect(await page.locator('h2 .heading-text').count()).toBe(0);
  expect(await page.locator('h2').getAttribute('aria-labelledby')).toBeNull();
});

test('skips dialog, data-toc-ignore, browser-window and nested heading-links headings', async ({ page }) => {
  await load(page, `<heading-links>
    <h2>Kept</h2>
    <section data-toc-ignore><h2>Ignored</h2></section>
    <browser-window><h2>Demo</h2></browser-window>
    <heading-links levels="h3"><h2>Inner two</h2><h3>Inner three</h3></heading-links>
  </heading-links>`);
  const r = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('h2, h3')]
    .map((h) => [h.textContent.trim(), !!h.querySelector('.heading-anchor')])));
  expect(r).toEqual({ Kept: true, Ignored: false, Demo: false, 'Inner two': false, 'Inner three': true });
});

test('reconnect does not duplicate anchors or wrappers', async ({ page }) => {
  await load(page, `<heading-links><h2>One</h2></heading-links>`);
  const r = await page.evaluate(() => {
    const host = document.querySelector('heading-links');
    const main = document.querySelector('main');
    for (let i = 0; i < 3; i++) { host.remove(); main.append(host); }
    return { a: host.querySelectorAll('.heading-anchor').length, t: host.querySelectorAll('.heading-text').length };
  });
  expect(r).toEqual({ a: 1, t: 1 });
  await page.locator('.heading-anchor').click();
  expect(new URL(page.url()).hash).toBe('#one');
});

test.describe('touch devices', () => {
  test.use({ hasTouch: true, isMobile: true });
  test('anchors are visible without hover', async ({ page }) => {
    await load(page, `<heading-links><h2 id="usage">Usage</h2></heading-links>`);
    expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
    await expect(page.locator('.heading-anchor')).toHaveCSS('opacity', '1');
  });
});

test('anchor visible on keyboard focus', async ({ page }) => {
  await load(page, `<heading-links><h2 id="usage">Usage</h2></heading-links>`);
  const a = page.locator('.heading-anchor');
  await expect(a).toHaveCSS('opacity', '0');
  await page.keyboard.press('Tab');
  await expect(a).toBeFocused();
  await expect(a).toHaveCSS('opacity', '1');
});
