/**
 * <ai-summary> — endpoint output sanitising and reconnect idempotency.
 *
 * The shared server serves a build snapshot, so `/src/**` is routed to the
 * working tree and the fixture page is served from a fake URL. The Chrome
 * Summarizer global is removed so the `endpoint` provider always wins.
 */
import { test, expect } from 'playwright/test';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENDPOINT = '/__ai-summary-endpoint';

async function load(page, body) {
  await page.addInitScript(() => { delete globalThis.Summarizer; });
  await page.route('**/src/**', (r) => r.fulfill({
    path: join(REPO, decodeURIComponent(new URL(r.request().url()).pathname)),
  }));
  const url = `/__ai-summary-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/markdown-viewer/logic.js';
        import '/src/web-components/ai-summary/logic.js';
      </script></head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const FIXTURE = `<main><section id="a"><ai-summary endpoint="${ENDPOINT}">
  <article><h2>Headline</h2><p>Body copy for the summary.</p></article>
</ai-summary></section><section id="b"></section></main>`;

test('endpoint output is sanitised while normal markdown still renders', async ({ page }) => {
  const md = [
    '## Key points',
    '',
    '- First point',
    '- Second with a [link](https://example.com/)',
    '',
    '<img src="x" onerror="window.__xss=1">',
    '',
    '<script>window.__xss=2</script>',
    '',
    '[bad](javascript:window.__xss=3)',
  ].join('\n');
  await page.route(`**${ENDPOINT}`, (r) => r.fulfill({
    status: 200, contentType: 'text/plain; charset=utf-8', body: md,
  }));
  await load(page, FIXTURE);

  const host = page.locator('ai-summary');
  await expect(host).toHaveAttribute('data-state', 'ready');
  await page.locator('.ais-trigger').click();
  await expect(host).toHaveAttribute('data-state', 'complete');

  const out = page.locator('.ais-output markdown-viewer');
  await expect(out).toHaveAttribute('data-rendered', '');
  await expect(out.locator('h2')).toHaveText('Key points');
  await expect(out.locator('li')).toHaveCount(2);
  await expect(out.locator('a[href="https://example.com/"]')).toHaveText('link');

  // Give any onerror a chance to fire before asserting.
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  await expect(out.locator('[onerror]')).toHaveCount(0);
  await expect(out.locator('script')).toHaveCount(0);
  await expect(out.locator('a[href^="javascript:"]')).toHaveCount(0);
  await expect(page.locator('.ais-output')).not.toHaveAttribute('aria-busy', /.*/);
});

test('moving the element twice keeps exactly one UI and one click handler', async ({ page }) => {
  let requests = 0;
  await page.route(`**${ENDPOINT}`, (r) => {
    requests++;
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: 'Done.' }) });
  });
  await load(page, FIXTURE);
  const host = page.locator('ai-summary');
  await expect(host).toHaveAttribute('data-state', 'ready');

  await page.evaluate(() => {
    const el = document.querySelector('ai-summary');
    document.getElementById('b').append(el);
    document.getElementById('a').append(el);
  });
  await expect(host).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('ai-summary > .ais-ui')).toHaveCount(1);
  await expect(page.locator('.ais-trigger')).toHaveCount(1);

  await page.locator('.ais-trigger').click();
  await expect(host).toHaveAttribute('data-state', 'complete');
  expect(requests).toBe(1);
});

test('aria-busy is set on the output while streaming', async ({ page }) => {
  let release;
  const gate = new Promise((res) => { release = res; });
  await page.route(`**${ENDPOINT}`, async (r) => {
    await gate;
    await r.fulfill({ status: 200, contentType: 'text/plain', body: 'Short summary.' });
  });
  await load(page, FIXTURE);
  await expect(page.locator('ai-summary')).toHaveAttribute('data-state', 'ready');
  await page.locator('.ais-trigger').click();
  await expect(page.locator('.ais-output')).toHaveAttribute('aria-busy', 'true');
  release();
  await expect(page.locator('ai-summary')).toHaveAttribute('data-state', 'complete');
  await expect(page.locator('.ais-output')).not.toHaveAttribute('aria-busy', /.*/);
});
