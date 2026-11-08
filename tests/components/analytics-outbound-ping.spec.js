/**
 * Analytics outbound links: the hyperlink-audit ping follows opt-out at
 * click time. It used to be written when the link was wired, so a visitor
 * who opted out (vb_optout, GPC, DNT, consent) still sent pings in Chrome
 * and Safari. An authored ping attribute is never touched.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, { consent }) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  // Outbound navigations are cancelled; the test only reads the attribute.
  await page.route('https://example.org/**', (route) => route.abort());
  const url = `/__analytics-ping-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <script type="module">
        import { Analytics } from '/src/lib/analytics.js';
        window.__consent = ${consent};
        Analytics.init({ endpoint: '/api/analytics', siteId: 't', transport: 'console',
          autoPageView: false, autoOutboundLinks: true, consent: () => window.__consent });
        window.__ready = true;
      </script></head><body>
      <a id="out" href="https://example.org/a">Out</a>
      <a id="own" href="https://example.org/b" ping="/my-ping">Own</a>
      </body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => /** @type {any} */ (window).__ready);
}

/** Click without navigating away: cancel the default after the capture sync. */
async function clickAndReadPing(page, id) {
  return page.evaluate((linkId) => {
    const a = document.getElementById(linkId);
    a.addEventListener('click', (e) => e.preventDefault(), { once: true });
    a.click();
    return a.getAttribute('ping');
  }, id);
}

test('no ping attribute before activation; added on click when not opted out', async ({ page }) => {
  await load(page, { consent: true });
  expect(await page.getAttribute('#out', 'ping')).toBeNull();
  expect(await clickAndReadPing(page, 'out')).toMatch(/\/api\/analytics.*site=t/);
});

test('opted out (consent withdrawn after load): no ping is sent', async ({ page }) => {
  await load(page, { consent: true });
  expect(await clickAndReadPing(page, 'out')).not.toBeNull();
  await page.evaluate(() => { /** @type {any} */ (window).__consent = false; });
  expect(await clickAndReadPing(page, 'out')).toBeNull();
});

test('vb_optout session flag removes the ping', async ({ page }) => {
  await load(page, { consent: true });
  await page.evaluate(() => sessionStorage.setItem('vb_optout', '1'));
  expect(await clickAndReadPing(page, 'out')).toBeNull();
});

test('an authored ping attribute is left alone', async ({ page }) => {
  await load(page, { consent: false });
  expect(await clickAndReadPing(page, 'own')).toBe('/my-ping');
});
