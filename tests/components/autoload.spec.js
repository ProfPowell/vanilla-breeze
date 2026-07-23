/**
 * Autoload upgrade path.
 *
 * The autoload bundle ships no component code — it fetches
 * /cdn/components/manifest.json, maps tag → chunk, and imports the chunk when
 * it sees a matching undefined element. A tag missing from that manifest fails
 * silently: the element never upgrades and nothing is logged.
 *
 * These tests exercise the two gaps that shipped: icon-wc (registered via
 * registerComponent, which the manifest builder did not match) and image-map
 * (registers its map-area child first, so the manifest was keyed on the child
 * and the parent was absent). image-map is checked WITHOUT a map-area child,
 * which is the case that used to leave nothing on the page to trigger a load.
 */

import { test, expect } from 'playwright/test';

/**
 * Load `markup` as a standalone page driven only by the autoload bundle.
 *
 * The fixture is served from a real (intercepted) URL rather than via
 * page.setContent, which rewrites the *current* document — the autoload module
 * would already have been evaluated for that document and ES modules evaluate
 * once per URL per document, so it would never re-run and nothing would load.
 */
async function autoloadPage(page, markup) {
  const url = '/__autoload-fixture.html';
  await page.route(`**${url}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body:
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>autoload fixture</title>` +
        `<link rel="stylesheet" href="/cdn/vanilla-breeze.css"></head><body>` +
        markup +
        `<script src="/cdn/vanilla-breeze-autoload.js" type="module"></script>` +
        `</body></html>`,
    }),
  );
  await page.goto(url, { waitUntil: 'load' });
}

test.describe('autoload manifest coverage', () => {
  test('<image-map> with no children upgrades', async ({ page }) => {
    const chunks = [];
    page.on('response', (r) => {
      const u = r.url();
      if (u.includes('/cdn/components/') && !u.endsWith('manifest.json')) {
        chunks.push(u.split('/').pop());
      }
    });

    await autoloadPage(
      page,
      '<image-map><img src="/favicon.svg" alt="test map" width="200" height="200"></image-map>',
    );

    await expect
      .poll(() => page.evaluate(() => !!customElements.get('image-map')), { timeout: 10_000 })
      .toBe(true);

    // Guard against a false pass from eager bundling: it must have autoloaded.
    expect(chunks).toContain('image-map.js');
  });

  test('<icon-wc> is registered', async ({ page }) => {
    // icon-wc ships eagerly inside the autoload bundle, so this asserts it is
    // available rather than that a chunk was fetched. Its manifest entry — the
    // thing the registerComponent regex used to miss — is covered by
    // tests/unit/autoload-manifest.test.js.
    await autoloadPage(page, '<icon-wc name="star"></icon-wc>');

    await expect
      .poll(() => page.evaluate(() => !!customElements.get('icon-wc')), { timeout: 10_000 })
      .toBe(true);
  });

  test('an unknown tag is ignored rather than fetched', async ({ page }) => {
    const requested = [];
    page.on('request', (r) => {
      if (r.url().includes('/cdn/components/')) requested.push(r.url());
    });

    await autoloadPage(page, '<definitely-not-a-component></definitely-not-a-component>');
    await page.waitForTimeout(1000);

    expect(requested.filter((u) => !u.endsWith('manifest.json'))).toEqual([]);
  });
});
