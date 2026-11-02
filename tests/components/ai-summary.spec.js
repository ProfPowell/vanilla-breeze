/**
 * <ai-summary> — endpoint output sanitising, reconnect idempotency, the Stop
 * affordance, format="plain-text", the {content} deep-link token and the
 * input quota / budget notice.
 *
 * The shared server serves a build snapshot, so `/src/**` is routed to the
 * working tree and the fixture page is served from a fake URL. The Chrome
 * Summarizer global is removed so the `endpoint` provider always wins,
 * unless a test installs a fake via `opts.init`.
 */
import { test, expect } from 'playwright/test';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENDPOINT = '/__ai-summary-endpoint';

async function load(page, body, { init } = {}) {
  await page.addInitScript(() => {
    delete globalThis.Summarizer;
    window.__opened = [];
    window.open = (url) => { window.__opened.push(String(url)); return null; };
  });
  if (init) await page.addInitScript(init);
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

test('a Stop button appears while streaming and aborts the summary', async ({ page }) => {
  await page.route(`**${ENDPOINT}`, async () => { /* never answers */ });
  await load(page, FIXTURE);
  const host = page.locator('ai-summary');
  const stop = page.locator('.ais-stop');
  await expect(host).toHaveAttribute('data-state', 'ready');
  await expect(stop).toBeHidden();

  await page.locator('.ais-trigger').click();
  await expect(host).toHaveAttribute('data-state', 'streaming');
  await expect(stop).toBeVisible();
  // The disabled trigger handed focus to Stop rather than dropping it.
  await expect(stop).toBeFocused();

  await stop.click();
  await expect(host).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.ais-output')).toHaveText('(stopped)');
  await expect(page.locator('.ais-output')).not.toHaveAttribute('aria-busy', /.*/);
  await expect(stop).toBeHidden();
  await expect(page.locator('.ais-trigger')).toBeEnabled();
  await expect(page.locator('.ais-trigger')).toBeFocused();
});

test('Escape inside the element also stops the summary', async ({ page }) => {
  await page.route(`**${ENDPOINT}`, async () => { /* never answers */ });
  await load(page, FIXTURE);
  await expect(page.locator('ai-summary')).toHaveAttribute('data-state', 'ready');
  await page.locator('.ais-trigger').click();
  await expect(page.locator('ai-summary')).toHaveAttribute('data-state', 'streaming');
  await page.keyboard.press('Escape');
  await expect(page.locator('ai-summary')).toHaveAttribute('data-state', 'ready');
});

test('format="plain-text" renders the result as text, not markdown', async ({ page }) => {
  const raw = '## Not a heading\n- not a list\n<b>not bold</b>';
  await page.route(`**${ENDPOINT}`, (r) => r.fulfill({ status: 200, contentType: 'text/plain', body: raw }));
  await load(page, `<main><ai-summary format="plain-text" endpoint="${ENDPOINT}">
    <article><p>Body.</p></article></ai-summary></main>`);
  await expect(page.locator('ai-summary')).toHaveAttribute('data-state', 'ready');
  await page.locator('.ais-trigger').click();
  await expect(page.locator('ai-summary')).toHaveAttribute('data-state', 'complete');

  const out = page.locator('.ais-output');
  await expect(out.locator('markdown-viewer')).toHaveCount(0);
  await expect(out.locator('*')).toHaveCount(0);
  expect(await out.evaluate((el) => el.textContent)).toBe(raw);
  expect(await out.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('pre-wrap');
});

test('deep-link: {content} is the capped, encoded wrapped text and the trigger says it opens a new tab', async ({ page }) => {
  const words = Array.from({ length: 800 }, (_, i) => `w${i}`).join(' ');
  await load(page, `<main><ai-summary fallback-url="https://x.example/?c={content}&amp;q={prompt}">
    <article><h2>Head &amp; line</h2>
    <p>${words}</p></article></ai-summary></main>`);
  const host = page.locator('ai-summary');
  await expect(host).toHaveAttribute('data-state', 'deep-link');
  const trigger = page.locator('.ais-trigger');
  await expect(trigger).toHaveAccessibleName('Read elsewhere (opens in new tab)');
  await expect(trigger.locator('.visually-hidden')).toHaveText('(opens in new tab)');

  await trigger.click();
  await expect.poll(() => page.evaluate(() => window.__opened.length)).toBe(1);
  const opened = new URL(await page.evaluate(() => window.__opened[0]));
  const c = opened.searchParams.get('c');
  expect(c.startsWith('Head & line w0 w1')).toBe(true);
  expect(c.length).toBeLessThanOrEqual(1500);
  expect(c.endsWith('…')).toBe(true);
  expect(c).not.toContain('Read elsewhere');
});

test('local: input over the measured quota is trimmed with a notice; create() gets the abort signal', async ({ page }) => {
  await load(page, FIXTURE, {
    init: () => {
      window.__summ = { inputs: [], createSignal: null };
      globalThis.Summarizer = {
        availability: async () => 'available',
        create: async (opts) => {
          window.__summ.createSignal = opts.signal instanceof AbortSignal;
          return {
            inputQuota: 10,
            measureInputUsage: async (text) => text.length,
            summarizeStreaming: (text) => {
              window.__summ.inputs.push(text);
              return (async function* () { yield 'Fake summary.'; })();
            },
            destroy() {},
          };
        },
      };
    },
  });
  await expect(page.locator('ai-summary')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.ais-notice')).toBeHidden();
  await page.locator('.ais-trigger').click();
  await expect(page.locator('ai-summary')).toHaveAttribute('data-state', 'complete');

  const summ = await page.evaluate(() => window.__summ);
  expect(summ.createSignal).toBe(true);
  expect(summ.inputs).toHaveLength(1);
  expect(summ.inputs[0].length).toBeLessThanOrEqual(10);
  await expect(page.locator('.ais-notice')).toBeVisible();
  await expect(page.locator('.ais-notice')).toContainText('longer than the on-device model accepts');
});

test('local without quota APIs: long input gets a character-budget warning', async ({ page }) => {
  await load(page, `<main><ai-summary><article><p>${'lorem '.repeat(3000)}</p></article></ai-summary></main>`, {
    init: () => {
      globalThis.Summarizer = {
        availability: async () => 'available',
        create: async () => ({
          summarize: async () => 'Short.',
          destroy() {},
        }),
      };
    },
  });
  await expect(page.locator('ai-summary')).toHaveAttribute('data-state', 'ready');
  await page.locator('.ais-trigger').click();
  await expect(page.locator('ai-summary')).toHaveAttribute('data-state', 'complete');
  await expect(page.locator('.ais-notice')).toContainText('may exceed');
});
