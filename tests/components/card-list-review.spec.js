/**
 * card-list — review fixes (vanilla-breeze-1fvo, 5ac4, i89g, pohq).
 *
 * - data-field-attr refuses on* attributes and unsafe URLs
 * - src is fetched once on upgrade, not again on reconnect; stale fetches
 *   are aborted; data-error clears on a later success
 * - data-field-if/unless and null attribute values survive re-binding
 * - keyless / duplicate-keyed items all render
 * - global data-layout rules (gap/min) apply to card-list
 * - loading/error are exposed via aria-busy and a role="status" element
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__card-list-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/card-list/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('card-list'));
}

/** Count requests to a mocked JSON endpoint; optional delay / status. */
async function mockJson(page, path, items, { status = 200, delay = 0 } = {}) {
  const hits = { n: 0 };
  await page.route(`**${path}`, async (route) => {
    hits.n++;
    if (delay) await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(items) }).catch(() => {});
  });
  return hits;
}

const LINK_TEMPLATE = '<template><article><a data-field="name" data-field-attr="href: url, onclick: js, title: tip"></a></article></template>';

test.describe('card-list — data-field-attr safety', () => {
  test('refuses javascript:/data: URLs and on* attributes', async ({ page }) => {
    await load(page, `<card-list data-key="id">${LINK_TEMPLATE}</card-list>`);
    await page.waitForSelector('card-list[data-upgraded]', { state: 'attached' });
    const attrs = await page.evaluate(() => {
      const cl = document.querySelector('card-list');
      cl.items = [
        { id: 1, name: 'a', url: 'javascript:alert(1)', js: 'alert(1)', tip: 'ok' },
        { id: 2, name: 'b', url: ' JaVa\tScRiPt:alert(1)' },
        { id: 3, name: 'c', url: 'data:text/html,<script>alert(1)</script>' },
        { id: 4, name: 'd', url: 'https://example.com/x' },
        { id: 5, name: 'e', url: '/relative?q=1#frag' },
        { id: 6, name: 'f', url: 'mailto:a@example.com' },
      ];
      return [...cl.querySelectorAll('a')].map((a) => ({
        href: a.getAttribute('href'), onclick: a.getAttribute('onclick'), title: a.getAttribute('title'),
      }));
    });
    expect(attrs.map((a) => a.href)).toEqual([
      null, null, null, 'https://example.com/x', '/relative?q=1#frag', 'mailto:a@example.com',
    ]);
    expect(attrs.every((a) => a.onclick === null)).toBe(true);
    expect(attrs[0].title).toBe('ok');
  });

  test('null values remove a previously bound attribute', async ({ page }) => {
    await load(page, `<card-list data-key="id">${LINK_TEMPLATE}</card-list>`);
    await page.waitForSelector('card-list[data-upgraded]', { state: 'attached' });
    const r = await page.evaluate(() => {
      const cl = document.querySelector('card-list');
      cl.items = [{ id: 1, name: 'a', url: '/a', tip: 'Tip' }];
      const a = cl.querySelector('a');
      const before = [a.getAttribute('href'), a.getAttribute('title')];
      cl.items = [{ id: 1, name: 'a', url: null }];
      return { before, after: [a.getAttribute('href'), a.getAttribute('title')], same: a === cl.querySelector('a') };
    });
    expect(r).toEqual({ before: ['/a', 'Tip'], after: [null, null], same: true });
  });
});

test.describe('card-list — conditional re-binding', () => {
  test('data-field-if / unless elements come back when the value flips', async ({ page }) => {
    await load(page, `<card-list data-key="id"><template><article>
      <span data-field-if="on">ON</span><span data-field-unless="on">OFF</span>
    </article></template></card-list>`);
    await page.waitForSelector('card-list[data-upgraded]', { state: 'attached' });
    const r = await page.evaluate(() => {
      const cl = document.querySelector('card-list');
      const state = () => [...cl.querySelectorAll('article span')].filter((s) => !s.hidden).map((s) => s.textContent);
      cl.items = [{ id: 1, on: false }];
      const a = state();
      cl.items = [{ id: 1, on: true }];
      const b = state();
      cl.items = [{ id: 1, on: false }];
      return [a, b, state()];
    });
    expect(r).toEqual([['OFF'], ['ON'], ['OFF']]);
  });
});

test.describe('card-list — keys', () => {
  test('keyless and duplicate-keyed items all render', async ({ page }) => {
    await load(page, '<card-list><template><p data-field="name"></p></template></card-list>');
    await page.waitForSelector('card-list[data-upgraded]', { state: 'attached' });
    const r = await page.evaluate(() => {
      const cl = document.querySelector('card-list');
      const names = () => [...cl.querySelectorAll(':scope > p')].map((p) => p.textContent);
      cl.items = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
      const keyless = names();
      cl.items = [{ id: 1, name: 'x' }, { id: 1, name: 'y' }, { id: 2, name: 'z' }];
      return { keyless, dupes: names() };
    });
    expect(r.keyless).toEqual(['a', 'b', 'c']);
    expect(r.dupes).toEqual(['x', 'y', 'z']);
  });
});

test.describe('card-list — fetch lifecycle', () => {
  test('src is fetched once on upgrade and not again on reconnect', async ({ page }) => {
    const hits = await mockJson(page, '/__api/once.json', [{ id: 1, name: 'one' }]);
    await load(page, '<card-list src="/__api/once.json"><template><p data-field="name"></p></template></card-list>');
    await expect(page.locator('card-list > p:not([role=status])')).toHaveText(['one']);
    await page.evaluate(() => {
      const cl = document.querySelector('card-list');
      const host = document.createElement('section');
      document.querySelector('main').append(host);
      host.append(cl); // move = disconnect + reconnect
    });
    await page.waitForTimeout(200);
    expect(hits.n).toBe(1);
    await expect(page.locator('card-list > p:not([role=status])')).toHaveText(['one']);
  });

  test('a newer src aborts the older fetch (latest wins)', async ({ page }) => {
    await mockJson(page, '/__api/slow.json', [{ id: 1, name: 'slow' }], { delay: 400 });
    await mockJson(page, '/__api/fast.json', [{ id: 2, name: 'fast' }]);
    await load(page, '<card-list src="/__api/slow.json"><template><p data-field="name"></p></template></card-list>');
    await page.waitForSelector('card-list[data-upgraded]', { state: 'attached' });
    await page.evaluate(() => document.querySelector('card-list').setAttribute('src', '/__api/fast.json'));
    await page.waitForTimeout(700);
    await expect(page.locator('card-list > p:not([role=status])')).toHaveText(['fast']);
  });

  test('data-error clears when a later fetch succeeds; error is a live status', async ({ page }) => {
    await mockJson(page, '/__api/bad.json', {}, { status: 500 });
    await mockJson(page, '/__api/good.json', [{ id: 1, name: 'ok' }]);
    await load(page, '<card-list src="/__api/bad.json"><template><p data-field="name"></p></template></card-list>');
    const cl = page.locator('card-list');
    await expect(cl).toHaveAttribute('data-error', 'HTTP 500');
    const status = page.getByRole('status');
    await expect(status).toHaveText(/HTTP 500/);
    await expect(cl).not.toHaveAttribute('aria-busy', /.*/);

    await page.evaluate(() => document.querySelector('card-list').setAttribute('src', '/__api/good.json'));
    await expect(page.locator('card-list > p:not([role=status])')).toHaveText(['ok']);
    await expect(cl).not.toHaveAttribute('data-error', /.*/);
    await expect(status).toHaveText('');
  });

  test('aria-busy is set while fetching', async ({ page }) => {
    await mockJson(page, '/__api/wait.json', [{ id: 1, name: 'w' }], { delay: 500 });
    await load(page, '<card-list src="/__api/wait.json"><template><p data-field="name"></p></template></card-list>');
    const cl = page.locator('card-list');
    await expect(cl).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('status')).toHaveText(/Loading/);
    await expect(page.locator('card-list > p:not([role=status])')).toHaveText(['w']);
    await expect(cl).not.toHaveAttribute('aria-busy', /.*/);
  });

  test('[data-fallback] content is removed on first render', async ({ page }) => {
    await load(page, `<card-list data-items='[{"id":1,"name":"rendered"}]'>
      <ul data-fallback><li>static</li></ul>
      <template><p data-field="name"></p></template></card-list>`);
    await expect(page.locator('card-list > p:not([role=status])')).toHaveText(['rendered']);
    await expect(page.locator('card-list [data-fallback]')).toHaveCount(0);
  });
});

test.describe('card-list — events', () => {
  test('items-changed reports attribute vs api sources', async ({ page }) => {
    await load(page, `<card-list data-items='[{"id":1,"name":"a"}]'><template><p data-field="name"></p></template></card-list>`);
    await page.waitForSelector('card-list[data-upgraded]', { state: 'attached' });
    const sources = await page.evaluate(() => {
      const cl = document.querySelector('card-list');
      const out = [];
      cl.addEventListener('card-list:items-changed', (e) => out.push(e.detail.source));
      cl.setAttribute('data-items', '[{"id":2,"name":"b"}]');
      cl.items = [{ id: 3, name: 'c' }];
      return out;
    });
    expect(sources).toEqual(['attribute', 'api']);
  });
});

test.describe('card-list — layout', () => {
  test('global data-layout grid applies, including data-layout-gap', async ({ page }) => {
    await load(page, `<card-list data-layout="grid" data-layout-gap="xs" data-items='[{"id":1,"name":"a"},{"id":2,"name":"b"}]'>
      <template><p data-field="name"></p></template></card-list>`);
    await page.waitForSelector('card-list[data-upgraded]', { state: 'attached' });
    const r = await page.evaluate(() => {
      const cl = document.querySelector('card-list');
      const probe = document.createElement('section');
      probe.setAttribute('data-layout', 'grid');
      probe.setAttribute('data-layout-gap', 'xs');
      document.body.append(probe);
      const a = getComputedStyle(cl);
      const b = getComputedStyle(probe);
      return { display: a.display, gap: a.rowGap, expectedGap: b.rowGap, cols: a.gridTemplateColumns !== 'none' };
    });
    expect(r.display).toBe('grid');
    expect(r.gap).toBe(r.expectedGap);
    expect(r.cols).toBe(true);
  });

  test('no data-layout falls back to block', async ({ page }) => {
    await load(page, '<card-list data-items="[]"><template><p></p></template></card-list>');
    const display = await page.locator('card-list').evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe('block');
  });
});
