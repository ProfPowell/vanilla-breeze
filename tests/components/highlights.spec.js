/**
 * Article highlights engine (src/utils/highlights-init.js): every article's
 * data-highlights-colors palette must paint, both with the CSS Custom
 * Highlight API and in the <mark> fallback.
 *
 * Tests the WORKING TREE: /src/** is served from disk so the spec does not
 * depend on the state of the built site snapshot.
 */
import { test, expect } from 'playwright/test';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const TEXT_A = 'Alpha article text that carries a red highlight and a yellow one.';
const TEXT_B = 'Beta article text that carries a teal highlight and a yellow one.';

/** Stored highlight records, keyed by the article's data-highlights value. */
const SEED = {
  a: [
    { id: 'hn-a1', startOffset: 0, endOffset: 5, text: 'Alpha', color: 'red', note: '', created: 1 },
    { id: 'hn-a2', startOffset: 6, endOffset: 13, text: 'article', color: 'yellow', note: '', created: 2 },
  ],
  b: [
    { id: 'hn-b1', startOffset: 0, endOffset: 4, text: 'Beta', color: 'teal', note: '', created: 3 },
    { id: 'hn-b2', startOffset: 5, endOffset: 12, text: 'article', color: 'yellow', note: '', created: 4 },
  ],
};

/**
 * @param {import('playwright/test').Page} page
 * @param {{ fallback?: boolean }} [opts]
 */
async function load(page, { fallback = false } = {}) {
  await page.addInitScript(({ seed, fallback: noApi }) => {
    for (const [key, highlights] of Object.entries(seed)) {
      localStorage.setItem(`vb:highlights:${key}`,
        JSON.stringify({ data: { version: 1, highlights }, timestamp: Date.now() }));
    }
    if (noApi) {
      delete CSS.highlights;
      delete window.Highlight;
    }
  }, { seed: SEED, fallback });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__highlights-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <style>
        #a { --highlight-red: rgb(250, 200, 200); }
        #b { --highlight-teal: rgb(150, 240, 225); }
      </style></head><body><main>
      <article id="a" data-highlights="a" data-highlights-colors="red,yellow"><p>${TEXT_A}</p></article>
      <article id="b" data-highlights="b" data-highlights-colors="teal,yellow"><p>${TEXT_B}</p></article>
      </main>
      <script type="module">
        await import('/src/utils/highlights-init.js');
        window.__ready = true;
      </script></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true);
}

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear()).catch(() => {});
});

test('Highlight API: two articles with different palettes both get rules and ranges', async ({ page }) => {
  await load(page);
  await page.waitForFunction(() => CSS.highlights.size > 0);

  const css = await page.evaluate(() => document.adoptedStyleSheets
    .flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join('\n'));
  for (const color of ['red', 'yellow', 'teal']) {
    expect(css, `::highlight rule for ${color}`).toMatch(new RegExp(`::highlight\\(hn-${color}\\)`));
  }

  // Every highlight from both articles is in the registry: the shared
  // "yellow" name carries both articles' ranges, not just the last one's.
  await expect.poll(() => page.evaluate(() => {
    const out = {};
    for (const [name, hl] of CSS.highlights) {
      out[name] = [...hl].map((r) => r.toString()).sort();
    }
    return out;
  })).toEqual({
    'hn-red': ['Alpha'],
    'hn-teal': ['Beta'],
    'hn-yellow': ['article', 'article'],
  });

  // Destroying one article keeps the other's highlights and rules.
  await page.evaluate(async () => {
    const { initHighlights } = await import('/src/utils/highlights-init.js');
    initHighlights(document.getElementById('a')).destroy();
  });
  const after = await page.evaluate(() => ({
    names: [...CSS.highlights.keys()].sort(),
    yellow: CSS.highlights.has('hn-yellow') ? CSS.highlights.get('hn-yellow').size : 0,
    css: document.adoptedStyleSheets.flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join('\n'),
  }));
  expect(after.names).toEqual(['hn-teal', 'hn-yellow']);
  expect(after.yellow).toBe(1);
  expect(after.css).toMatch(/::highlight\(hn-teal\)/);
});

test('Highlight API: unsafe colour names are not written into the stylesheet', async ({ page }) => {
  await load(page);
  await page.evaluate(() => {
    const el = document.createElement('article');
    el.setAttribute('data-highlights', 'evil');
    el.setAttribute('data-highlights-colors', 'ok-name,x){}body{display:none}');
    el.innerHTML = '<p>Untrusted palette.</p>';
    document.querySelector('main').append(el);
  });
  await expect(page.locator('[data-highlights="evil"]')).toHaveAttribute('data-highlights-init', '');
  const css = await page.evaluate(() => document.adoptedStyleSheets
    .flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join('\n'));
  expect(css).toMatch(/::highlight\(hn-ok-name\)/);
  expect(css).not.toContain('display');
  await expect(page.locator('body')).toBeVisible();
});

test('<mark> fallback: custom palette colours paint with each article\'s own value', async ({ page }) => {
  await load(page, { fallback: true });
  expect(await page.evaluate(() => 'highlights' in CSS)).toBe(false);

  const red = page.locator('#a mark[data-hn-color="red"]');
  const teal = page.locator('#b mark[data-hn-color="teal"]');
  await expect(red).toHaveText('Alpha');
  await expect(teal).toHaveText('Beta');
  await expect(red).toHaveCSS('background-color', 'rgb(250, 200, 200)');
  await expect(teal).toHaveCSS('background-color', 'rgb(150, 240, 225)');

  // Colours follow the custom property live (theme or mode changes), rather
  // than a value snapshotted when the mark was created.
  await page.evaluate(() => document.getElementById('b').style.setProperty('--highlight-teal', 'rgb(0, 128, 128)'));
  await expect(teal).toHaveCSS('background-color', 'rgb(0, 128, 128)');

  // No inline background is written onto the mark.
  expect(await teal.evaluate((m) => m.style.backgroundColor)).toBe('');
});
