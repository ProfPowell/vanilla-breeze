/**
 * watch-wc + page-watch-init + notification-wc ingest — U–Y review fixes.
 *
 * Covers: correct label/pressed state on load when already watched; the
 * accessible name (aria-label only on the icon variant, visible text is the
 * name elsewhere); the no-JS fallback is hidden after upgrade (one button);
 * notification-wc ingests page-watch's notification-wc:new; unwatching from
 * the bell resyncs plain [data-watch-page] buttons and calls the server
 * unsubscribe; two copies of page-watch-init stay inert; URL normalisation
 * and legacy-key migration; data-label-* overrides; reconnect.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ path?: string, seed?: Record<string, unknown>, head?: string, extraImports?: string[] }} [opts]
 */
async function load(page, body, { path, seed = {}, head = '', extraImports = [] } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = path ?? `/__watch-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Watch fixture</title>
      ${head}
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/notification-wc/logic.js';
        import '/src/web-components/watch-wc/logic.js';
        import '/src/utils/page-watch-init.js';
        ${extraImports.map((u) => `import '${u}';`).join('\n')}
      </script>
      </head><body><main><h1>Fixture</h1><p>Body text</p>${body}</main></body></html>`,
  }));
  await page.addInitScript((entries) => {
    for (const [key, data] of Object.entries(entries)) {
      localStorage.setItem(`vb:watches:${key}`, JSON.stringify({ data, timestamp: Date.now() }));
    }
  }, seed);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('watch-wc'));
  return url;
}

const entry = (url, extra = {}) => ({
  url, title: 'Fixture', contentHash: 'stale-hash', watchedAt: '2026-01-01T00:00:00Z',
  lastChecked: '2026-01-01T00:00:00Z', lastChanged: null, subscriptionId: null, ...extra,
});

test('already-watched page: text variants show the watching label on load', async ({ page }) => {
  const path = '/__watch-onload.html';
  await load(page, `<watch-wc id="c" variant="compact"></watch-wc><watch-wc id="i"></watch-wc>`, {
    path, seed: { [path]: entry(path) },
  });
  const c = page.locator('#c > button');
  await expect(c).toHaveAttribute('aria-pressed', 'true');
  await expect(c).toHaveText('Watching');
  await expect(c.locator('icon-wc')).toHaveAttribute('name', 'bookmark-check');
  await expect(page.locator('#i > button')).toHaveAttribute('title', 'Stop watching this page');
});

test('accessible name: aria-label only on the icon variant', async ({ page }) => {
  await load(page, `<watch-wc id="i"></watch-wc>
    <watch-wc id="b" variant="button" label="Save for later"></watch-wc>`);
  const icon = page.locator('#i > button');
  await expect(icon).toHaveAttribute('aria-label', 'Watch this page for updates');
  const btn = page.locator('#b > button');
  await expect(btn).not.toHaveAttribute('aria-label', /.*/);
  await expect(page.getByRole('button', { name: 'Save for later' })).toHaveCount(1);
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  // label= is constant across states; icon and pressed state carry the change
  await expect(btn).toHaveText('Save for later');
  await expect(icon).toHaveAttribute('aria-pressed', 'true'); // sibling sync
});

test('no-JS fallback is hidden after upgrade and only one button renders', async ({ page }) => {
  await load(page, `<watch-wc id="w" variant="button"><a href="/feed.xml">Follow by feed</a></watch-wc>`);
  await expect(page.locator('#w a')).toBeHidden();
  await expect(page.locator('#w button')).toHaveCount(1);
  await expect(page.locator('#w button')).toBeVisible();
});

test('data-label-* overrides localise the text and the icon name', async ({ page }) => {
  const path = '/__watch-i18n.html';
  await load(page, `<watch-wc id="c" variant="compact" data-label-watch="Beobachten" data-label-watching="Beobachtet"></watch-wc>
    <watch-wc id="i" data-label-action="Seite beobachten"></watch-wc>`, { path });
  await expect(page.locator('#c > button')).toHaveText('Beobachten');
  await expect(page.locator('#i > button')).toHaveAttribute('aria-label', 'Seite beobachten');
  await page.locator('#c > button').click();
  await expect(page.locator('#c > button')).toHaveText('Beobachtet');
  // attribute change after upgrade re-renders
  await page.evaluate(() => document.getElementById('c').setAttribute('data-label-watching', 'Gemerkt'));
  await expect(page.locator('#c > button')).toHaveText('Gemerkt');
});

test('notification-wc ingests the page-watch change notification', async ({ page }) => {
  const path = '/__watch-changed.html';
  await load(page, `<notification-wc id="n"></notification-wc><button type="button" data-watch-page>Watch for updates</button>`, {
    path, seed: { [path]: entry(path) },
  });
  await expect(page.locator('#n .notification-list li')).toHaveCount(1);
  await expect(page.locator('#n .notification-list li')).toContainText('Updated: Fixture');
  await expect(page.locator('#n .notification-badge')).toHaveText('1');
});

test('two copies of page-watch-init fire one change notification and one toggle', async ({ page }) => {
  const path = '/__watch-dupe.html';
  await page.addInitScript(() => {
    /** @type {any} */ (window).__news = 0;
    document.addEventListener('notification-wc:new', () => { /** @type {any} */ (window).__news++; });
  });
  await load(page, `<button type="button" id="p" data-watch-page>Watch for updates</button>`, {
    path, seed: { [path]: entry(path) }, extraImports: ['/src/utils/page-watch-init.js?copy=2'],
  });
  await page.waitForFunction(() => /** @type {any} */ (window).__news > 0);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => /** @type {any} */ (window).__news)).toBe(1);
  const p = page.locator('#p');
  await expect(p).toHaveAttribute('aria-pressed', 'true');
  await p.click();
  await expect(p).toHaveAttribute('aria-pressed', 'false');
  await expect(p).toHaveText('Watch for updates');
});

test('unwatch from the bell resyncs plain buttons and unsubscribes on the server', async ({ page }) => {
  const path = '/__watch-bell.html';
  const deletes = [];
  await page.route('**/go/notify/subscribe/**', (route) => {
    deletes.push([route.request().method(), new URL(route.request().url()).pathname]);
    return route.fulfill({ status: 204, body: '' });
  });
  await load(page, `<notification-wc id="n"></notification-wc>
    <button type="button" id="p" data-watch-page>Watch for updates</button>`, {
    path,
    head: '<meta name="vb-page-watch-server" content="true">',
    seed: { [path]: entry(path, { subscriptionId: 'sub-42', contentHash: '' }) },
  });
  const p = page.locator('#p');
  await expect(p).toHaveAttribute('aria-pressed', 'true');
  await expect(p).toHaveText('Watching');
  await page.locator('#n > [data-trigger]').click();
  // The panel may sit partly off-screen in this bare fixture; dispatch clicks.
  await page.locator('#n [role="tab"][data-tab="watching"]').dispatchEvent('click');
  await page.locator('#n [data-watch-unwatch]').dispatchEvent('click');
  await expect(p).toHaveAttribute('aria-pressed', 'false');
  await expect(p).toHaveText('Watch for updates');
  await expect.poll(() => deletes).toEqual([['DELETE', '/go/notify/subscribe/sub-42']]);
});

test('URL normalisation: /x, /x/ and /x/index.html share one key; legacy keys migrate', async ({ page }) => {
  const path = '/__watch-norm/index.html';
  await load(page, `<watch-wc id="c" variant="compact"></watch-wc>`, {
    path, seed: { [path]: entry(path) },
  });
  await expect(page.locator('#c > button')).toHaveAttribute('aria-pressed', 'true');
  const r = await page.evaluate(async () => {
    const m = await import('/src/utils/page-watch-init.js');
    return {
      keys: ['/x', '/x/', '/x/index.html', '/', '/index.html'].map(m.normalisePath),
      stored: Object.keys(localStorage).filter((k) => k.startsWith('vb:watches:')),
    };
  });
  expect(r.keys).toEqual(['/x', '/x', '/x', '/', '/']);
  expect(r.stored).toEqual(['vb:watches:/__watch-norm']);
});

test('reconnect keeps one button and its state', async ({ page }) => {
  const path = '/__watch-reconnect.html';
  await load(page, `<section id="host"><watch-wc id="c" variant="button"></watch-wc></section>`, {
    path, seed: { [path]: entry(path) },
  });
  await expect(page.locator('#c > button')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => {
    const w = document.getElementById('c');
    const host = document.getElementById('host');
    for (let i = 0; i < 3; i++) { w.remove(); host.append(w); }
  });
  await expect(page.locator('#c > button')).toHaveCount(1);
  await expect(page.locator('#c > button')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#c > button')).toHaveText('Watching');
  await page.locator('#c > button').click();
  await expect(page.locator('#c > button')).toHaveAttribute('aria-pressed', 'false');
});
