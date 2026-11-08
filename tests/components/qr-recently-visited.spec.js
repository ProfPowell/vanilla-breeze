/**
 * recently-visited — Q+R review fixes.
 *
 * Covers: opt-in tracking (meta or element), site-wide and per-page
 * opt-outs, query stripping + allowlist, 30-day TTL and the 100 cap; the
 * renderer's URL sanitising (`//host`, off-origin, javascript:), hostile
 * titles, current-page exclusion, static toggle labels + aria-pressed,
 * focus staying on controls, same-tab sync between instances, reconnect
 * without stacking storage listeners, heading level + labels, and Intl times.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const KEY = 'vb:recently-visited';
const DAY = 86_400_000;

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ head?: string, html?: string, path?: string, seed?: any[] | null, component?: boolean, lang?: string }} [opts]
 */
async function load(page, body, { head = '', html = '', path = '/__rv-fixture/page.html', seed = null, component = true, lang = 'en' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__rv-fixture/**', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" ${html}><head><meta charset="utf-8"><title>Fixture page</title>${head}
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/utils/recently-visited-init.js';
        ${component ? "import '/src/web-components/recently-visited/logic.js';" : ''}
        window.__rvReady = true;
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  if (seed) {
    await page.addInitScript(([key, entries, day]) => {
      if (sessionStorage.getItem('rv-seeded')) return;
      sessionStorage.setItem('rv-seeded', '1');
      const now = Date.now();
      localStorage.setItem(key, JSON.stringify(entries.map((e) => ({
        ...e,
        ts: typeof e.ago === 'number' ? now - e.ago * day : e.ts,
      }))));
    }, [KEY, seed, DAY]);
  }
  await page.goto(path, { waitUntil: 'load' });
  await page.waitForFunction(() => /** @type {any} */ (window).__rvReady);
  if (component) await page.waitForFunction(() => customElements.get('recently-visited'));
}

const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), KEY);

const SEED = [
  { url: '/docs/a/', hash: '', title: 'Page <img src=x onerror="window.__xss=1">', hashTitle: '', ago: 0.01 },
  { url: '//evil.example/x', hash: '', title: 'Page not found', hashTitle: '', ago: 0.02 },
  { url: 'https://evil.example/y', hash: '', title: 'Off origin', hashTitle: '', ago: 0.03 },
  { url: 'javascript:alert(1)', hash: '', title: 'Script', hashTitle: '', ago: 0.04 },
  { url: '/docs/b/', hash: '#intro', title: 'Page B', hashTitle: 'Intro', ago: 1 },
  { url: '/docs/b/', hash: '', title: 'Page B', hashTitle: '', ago: 2 },
  { url: '/docs/nan/', hash: '', title: 'Bad ts', hashTitle: '', ts: 'soon' },
  { url: '/docs/old/', hash: '', title: 'Expired', hashTitle: '', ago: 31 },
];

test.describe('tracker opt-in', () => {
  test('records nothing without the meta or the element', async ({ page }) => {
    await load(page, '<p>Plain page</p>', { component: false });
    expect(await stored(page)).toEqual([]);
  });

  test('vb:track-history meta records the page and strips the query', async ({ page }) => {
    await load(page, '<p>x</p>', {
      component: false,
      head: '<meta name="vb:track-history" content="on">',
      path: '/__rv-fixture/page.html?token=secret&q=shoes',
    });
    const s = await stored(page);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ url: '/__rv-fixture/page.html', hash: '', title: 'Fixture page' });
  });

  test('vb:track-history-params keeps allowlisted parameters only', async ({ page }) => {
    await load(page, '<p>x</p>', {
      component: false,
      head: '<meta name="vb:track-history" content="on"><meta name="vb:track-history-params" content="q, page">',
      path: '/__rv-fixture/page.html?token=secret&q=shoes&page=2',
    });
    expect((await stored(page))[0].url).toBe('/__rv-fixture/page.html?q=shoes&page=2');
  });

  test('a <recently-visited> element opts the page in', async ({ page }) => {
    await load(page, '<recently-visited></recently-visited>');
    expect((await stored(page)).map((e) => e.url)).toEqual(['/__rv-fixture/page.html']);
  });

  test('html[data-vb-no-track] blocks recording even with meta and element', async ({ page }) => {
    await load(page, '<recently-visited></recently-visited>', {
      html: 'data-vb-no-track',
      head: '<meta name="vb:track-history" content="on">',
    });
    expect(await stored(page)).toEqual([]);
  });

  test('vb:no-track-history blocks recording on that page', async ({ page }) => {
    await load(page, '<recently-visited></recently-visited>', {
      head: '<meta name="vb:track-history" content="on"><meta name="vb:no-track-history">',
    });
    expect(await stored(page)).toEqual([]);
  });

  test('URL normaliser collapses // and rejects off-origin and non-http', async ({ page }) => {
    await load(page, '<p>x</p>', { component: false });
    const r = await page.evaluate(async () => {
      const m = await import('/src/utils/recently-visited-init.js');
      return [
        '//evil.example/x', '/\\evil.example/y', 'https://evil.example/z', 'javascript:alert(1)',
        `${location.origin}/same/?a=1`, '/ok/?token=1&q=2',
      ].map((u) => m.toEntryUrl(u, u.startsWith('/ok') ? new Set(['q']) : null));
    });
    expect(r).toEqual(['/evil.example/x', '/evil.example/y', null, null, '/same/?a=1', '/ok/?q=2']);
  });

  test('writes prune expired and malformed records and cap at 100', async ({ page }) => {
    const many = Array.from({ length: 120 }, (_, i) => ({ url: `/p/${i}/`, hash: '', title: `P${i}`, hashTitle: '', ago: 0.001 * (i + 1) }));
    await load(page, '<p>x</p>', {
      component: false,
      head: '<meta name="vb:track-history" content="on">',
      seed: [...SEED, ...many],
    });
    const s = await stored(page);
    expect(s).toHaveLength(100);
    expect(s[0].url).toBe('/__rv-fixture/page.html');
    const urls = s.map((e) => e.url);
    expect(urls).not.toContain('/docs/old/');
    expect(urls).not.toContain('/docs/nan/');
    expect(urls.filter((u) => u.startsWith('//') || /javascript|evil\.example\/y/.test(u))).toEqual([]);
  });
});

test.describe('renderer', () => {
  test('sanitises URLs, escapes titles, drops expired and NaN entries', async ({ page }) => {
    await load(page, '<recently-visited></recently-visited>', { seed: SEED });
    const rv = page.locator('recently-visited');
    await expect(rv.locator('.recently-visited-list')).toBeVisible();

    const hrefs = await rv.locator('.recently-visited-list a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(['/docs/a/', '/evil.example/x', '/docs/b/']);
    for (const a of await rv.locator('.recently-visited-list a').all()) {
      const resolved = await a.evaluate((el) => /** @type {HTMLAnchorElement} */ (el).origin === location.origin);
      expect(resolved).toBe(true);
    }
    await expect(rv.locator('img')).toHaveCount(0);
    await expect(rv.locator('.recently-visited-list a').first()).toHaveText('Page <img src=x onerror="window.__xss=1">');
    expect(await page.evaluate(() => /** @type {any} */ (window).__xss)).toBeUndefined();
    await expect(rv).not.toContainText('NaN');
    await expect(rv).not.toContainText('Expired');

    const entries = await page.evaluate(() => /** @type {any} */ (document.querySelector('recently-visited')).entries);
    expect(entries.every((e) => Number.isFinite(e.ts) && e.url.startsWith('/') && !e.url.startsWith('//'))).toBe(true);
  });

  test('times are <time datetime> formatted with Intl for the nearest lang', async ({ page }) => {
    await load(page, '<recently-visited lang="fr"></recently-visited>', { seed: SEED });
    const t = page.locator('recently-visited time').nth(2);
    await expect(t).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/);
    await expect(t).toHaveText(/hier|il y a/);
  });

  test('current page is excluded unless include-current', async ({ page }) => {
    await load(page, '<recently-visited id="a"></recently-visited><recently-visited id="b" include-current></recently-visited>', { seed: SEED });
    await expect(page.locator('#a a[href="/__rv-fixture/page.html"]')).toHaveCount(0);
    await expect(page.locator('#b a[href="/__rv-fixture/page.html"]')).toHaveCount(1);
  });

  test('toggles keep a static label, carry state in aria-pressed, and keep focus', async ({ page }) => {
    await load(page, '<recently-visited></recently-visited>', { seed: SEED });
    const pause = page.locator('[data-recently-visited-pause]');
    await expect(pause).toHaveAttribute('aria-pressed', 'false');
    await pause.focus();
    // Arm the listener before pressing (an un-awaited evaluate raced the keypress on CI).
    await page.evaluate(() => {
      /** @type {any} */ (window).__pauseDetail = new Promise((r) => document.addEventListener('recently-visited:pause-toggle', (e) => r(/** @type {CustomEvent} */ (e).detail), { once: true }));
    });
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => /** @type {any} */ (window).__pauseDetail)).toEqual({ paused: true });
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await expect(pause).toHaveAttribute('aria-label', 'Pause tracking');
    await expect(pause).toBeFocused();

    const anchors = page.locator('[data-recently-visited-anchors]');
    await anchors.focus();
    await page.keyboard.press('Enter');
    await expect(anchors).toHaveAttribute('aria-pressed', 'true');
    await expect(anchors).toHaveAttribute('aria-label', 'Show anchor visits');
    await expect(anchors).toBeFocused();
    await expect(page.locator('details[data-url="/docs/b/"] .recently-visited-anchors a')).toHaveAttribute('href', '/docs/b/#intro');
    await expect(page.locator('details[data-url="/docs/b/"] summary small')).toContainText('1 anchor');
  });

  test('clear keeps focus, uses aria-disabled, and syncs a second instance', async ({ page }) => {
    await load(page, '<recently-visited id="a"></recently-visited><recently-visited id="b"></recently-visited>', { seed: SEED });
    const clear = page.locator('#a [data-recently-visited-clear]');
    await clear.focus();
    await page.keyboard.press('Enter');
    await expect(clear).toBeFocused();
    await expect(clear).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#b .recently-visited-empty')).toBeVisible();
    await expect(page.locator('#b [data-recently-visited-clear]')).toHaveAttribute('aria-disabled', 'true');
    expect(await stored(page)).toEqual([]);

    await page.locator('#b [data-recently-visited-pause]').click();
    await expect(page.locator('#a [data-recently-visited-pause]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('same-tab hash changes re-render the list', async ({ page }) => {
    await load(page, '<recently-visited include-current></recently-visited><h2 id="part">Part two</h2>', { seed: SEED });
    await page.locator('[data-recently-visited-anchors]').click();
    await page.evaluate(() => { location.hash = '#part'; });
    await expect(page.locator('recently-visited .recently-visited-anchors a', { hasText: 'Part two' })).toHaveAttribute('href', '/__rv-fixture/page.html#part');
  });

  test('heading level, no heading, and label overrides', async ({ page }) => {
    await load(page, `
      <recently-visited id="h3" data-heading-level="3" data-label-heading="Your pages" data-label-pause="Stop" data-label-empty="Nothing yet"></recently-visited>
      <recently-visited id="h0" data-heading-level="0"></recently-visited>`);
    await expect(page.locator('#h3 h3')).toHaveText('Your pages');
    await expect(page.locator('#h3 [data-recently-visited-pause]')).toHaveAttribute('aria-label', 'Stop');
    await expect(page.locator('#h3 .recently-visited-empty')).toHaveText('Nothing yet');
    await expect(page.locator('#h0 :is(h1,h2,h3,h4,h5,h6)')).toHaveCount(0);
  });

  test('reconnect keeps one structure and one storage listener, controls still work', async ({ page }) => {
    await page.addInitScript(() => {
      const w = /** @type {any} */ (window);
      w.__storageListeners = new Set();
      const add = window.addEventListener.bind(window);
      const remove = window.removeEventListener.bind(window);
      window.addEventListener = (type, fn, ...rest) => { if (type === 'storage') w.__storageListeners.add(fn); return add(type, fn, ...rest); };
      window.removeEventListener = (type, fn, ...rest) => { if (type === 'storage') w.__storageListeners.delete(fn); return remove(type, fn, ...rest); };
    });
    await load(page, '<section id="host"><recently-visited></recently-visited></section>', { seed: SEED });
    const result = await page.evaluate(() => {
      const rv = document.querySelector('recently-visited');
      const host = document.getElementById('host');
      for (let i = 0; i < 3; i++) { rv.remove(); host.append(rv); }
      return {
        listeners: /** @type {any} */ (window).__storageListeners.size,
        headers: rv.querySelectorAll('.recently-visited-header').length,
        lists: rv.querySelectorAll('.recently-visited-list').length,
      };
    });
    expect(result).toEqual({ listeners: 1, headers: 1, lists: 1 });

    const detached = await page.evaluate(() => {
      const rv = document.querySelector('recently-visited');
      rv.remove();
      return /** @type {any} */ (window).__storageListeners.size;
    });
    expect(detached).toBe(0);
    await page.evaluate(() => document.getElementById('host').append(document.createElement('recently-visited')));
    const pause = page.locator('[data-recently-visited-pause]');
    await pause.click();
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
  });
});
