/**
 * <author-index> — fallback enhancement on fetch failure, slug uniqueness,
 * live result status, href allowlist, heading level, and no refetch on move.
 *
 * Tests the WORKING TREE: /src/** is served from disk so the spec does not
 * depend on the state of the built site snapshot.
 */
import { test, expect } from 'playwright/test';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PAGES = [
  { url: '/a/', title: 'Alpha', author: 'Zoë Ng' },
  { url: '/b/', title: 'Bravo', author: 'Zo Ng' },
  { url: '/c/', title: 'Charlie', author: '李' },
  { url: '/d/', title: 'Delta', author: 'Zoe Ng' },
  { url: '/e/', title: 'Echo', author: 'Ada Lovelace', authorUrl: '/team/ada/' },
  { url: '/f/', title: 'Foxtrot', author: 'Ada Lovelace' },
];

/**
 * @param {import('playwright/test').Page} page
 * @param {string} host  author-index markup
 * @param {{ json?: unknown, status?: number, delay?: number }} [opts]
 * @returns {Promise<{ requests: () => number }>}
 */
async function load(page, host, opts = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  let requests = 0;
  await page.route('**/__author-index-data.json', async (route) => {
    requests++;
    if (opts.delay) await new Promise((r) => setTimeout(r, opts.delay));
    await route.fulfill({
      status: opts.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(opts.json ?? { pages: PAGES }),
    }).catch(() => {}); // request may have been aborted by teardown
  });
  const url = `/__author-index-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css"></head><body>
      ${host}
      <section id="other"></section>
      <script type="module">
        await import('/src/web-components/author-index/logic.js');
        window.__ready = true;
      </script></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true);
  return { requests: () => requests };
}

const FALLBACK = `
  <details data-author-group id="author-ada"><summary>Ada (1)</summary>
    <ul><li><a href="/x/">Engines</a></li></ul></details>
  <details data-author-group id="author-bob"><summary>Bob (1)</summary>
    <ul><li><a href="/y/">Looms</a></li></ul></details>`;

test.describe('author-index', () => {
  test('failed fetch keeps authored fallback and still filters', async ({ page }) => {
    await load(page, `<author-index id="ix" src="/__author-index-data.json">${FALLBACK}</author-index>`, { status: 500 });
    const input = page.locator('#ix [data-author-index-search]');
    await expect(input).toHaveCount(1);
    await expect(page.locator('#ix [data-author-index-error]')).toHaveCount(0);
    const groups = page.locator('#ix [data-author-group]');
    await expect(groups).toHaveCount(2);

    await input.fill('bob');
    await expect(groups.nth(0)).toBeHidden();
    await expect(groups.nth(1)).toBeVisible();

    // Visible "no matches" state.
    await input.fill('zzz');
    const status = page.locator('#ix [data-author-index-status]');
    await expect(status).toHaveText(/No authors match/);
    await expect(status).not.toHaveClass(/visually-hidden/);
  });

  test('failed fetch with an empty host shows an error', async ({ page }) => {
    await load(page, '<author-index id="ix" src="/__author-index-data.json"></author-index>', { status: 404 });
    await expect(page.locator('#ix [data-author-index-error]')).toHaveText(/Could not load/);
  });

  test('slugs are unique, non-empty and diacritic-folded', async ({ page }) => {
    await load(page, '<author-index id="ix" src="/__author-index-data.json"></author-index>');
    const groups = page.locator('#ix [data-author-group]');
    await expect(groups).toHaveCount(5);
    const ids = await groups.evaluateAll((els) => els.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^author-[\p{L}\p{N}]/u);
    expect(ids).toContain('author-zo-ng');
    expect(ids).toContain('author-李');
    // "Zoë Ng" and "Zoe Ng" fold to the same base → one gets a suffix.
    expect(ids.filter((id) => /^author-zoe-ng(-\d+)?$/.test(id))).toHaveLength(2);
    expect(ids).toContain('author-zoe-ng-2');
  });

  test('two instances on a page do not share ids', async ({ page }) => {
    await load(page, `<author-index id="ix" src="/__author-index-data.json"></author-index>
      <author-index id="iy" src="/__author-index-data.json" sort="count"></author-index>`);
    await expect(page.locator('#iy [data-author-group]')).toHaveCount(5);
    await expect(page.locator('#ix [data-author-group]')).toHaveCount(5);
    const ids = await page.locator('[data-author-group]').evaluateAll((els) => els.map((e) => e.id));
    expect(new Set(ids).size).toBe(10);
  });

  test('polite live status announces result counts; count text is real text', async ({ page }) => {
    await load(page, '<author-index id="ix" src="/__author-index-data.json"></author-index>');
    const status = page.locator('#ix [data-author-index-status]');
    await expect(status).toHaveAttribute('role', 'status');
    const input = page.locator('#ix [data-author-index-search]');
    await input.fill('zo');
    await expect(status).toHaveText('3 of 5 authors match “zo”');
    // Diacritic-insensitive: "zoe" matches Zoë Ng and Zoe Ng.
    await input.fill('zoe');
    await expect(status).toHaveText('2 of 5 authors match “zoe”');
    await expect(status).toHaveClass(/visually-hidden/);
    await input.fill('');
    await expect(status).toHaveText('Showing all 5 authors');

    // Count is announced via visually-hidden text, not aria-label on a span.
    const ada = page.locator('#ix [data-author-group]', { hasText: 'Ada Lovelace' });
    await expect(ada.locator('.author-count')).not.toHaveAttribute('aria-label', /.*/);
    await expect(ada.locator('summary .visually-hidden')).toHaveText(/2 pages/);
    // The hidden text does not make every group match "pages".
    await input.fill('pages');
    await expect(status).toHaveText(/No authors match/);
  });

  test('javascript: and other non-http hrefs are dropped', async ({ page }) => {
    await load(page, '<author-index id="ix" src="/__author-index-data.json"></author-index>', {
      json: [
        { url: 'javascript:alert(1)', title: 'Evil', author: 'Mallory', authorUrl: ' JaVaScRiPt:alert(2)' },
        { url: 'data:text/html,hi', title: 'Data', author: 'Mallory' },
        { url: 'https://example.com/ok', title: 'Abs', author: 'Mallory' },
        { url: '/rel/', title: 'Rel', author: 'Mallory' },
      ],
    });
    await expect(page.locator('#ix [data-author-group]')).toHaveCount(1);
    const hrefs = await page.locator('#ix a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(['https://example.com/ok', '/rel/']);
    await expect(page.locator('#ix .author-link')).toHaveCount(0);
    // Unsafe entries keep their title as plain text.
    await expect(page.locator('#ix li', { hasText: 'Evil' })).toHaveCount(1);
  });

  test('heading-level sets the generated heading level (default 2)', async ({ page }) => {
    await load(page, `<author-index id="ix" src="/__author-index-data.json"></author-index>
      <author-index id="iy" src="/__author-index-data.json" heading-level="4"></author-index>`);
    await expect(page.locator('#ix > h2.author-index-heading')).toHaveCount(1);
    await expect(page.locator('#iy > h4.author-index-heading')).toHaveCount(1);
  });

  test('moving the element does not refetch or rebuild; filter still works', async ({ page }) => {
    const { requests } = await load(page, '<author-index id="ix" src="/__author-index-data.json"></author-index>');
    await expect(page.locator('#ix [data-author-group]')).toHaveCount(5);
    expect(requests()).toBe(1);
    await page.locator('#ix [data-author-group]').first().evaluate((d) => { d.setAttribute('data-marker', ''); });

    await page.evaluate(() => {
      const ix = document.getElementById('ix');
      document.getElementById('other').append(ix);
      document.body.append(ix);
    });
    await page.waitForTimeout(200);
    expect(requests()).toBe(1);
    await expect(page.locator('#ix [data-author-index-search]')).toHaveCount(1);
    await expect(page.locator('#ix [data-author-index-status]')).toHaveCount(1);
    await expect(page.locator('#ix [data-marker]')).toHaveCount(1); // not rebuilt

    await page.locator('#ix [data-author-index-search]').fill('ada');
    await expect(page.locator('#ix [data-author-group]:not([hidden])')).toHaveCount(1);
  });

  test('removing the element mid-fetch aborts without rendering', async ({ page }) => {
    await load(page, '<author-index id="ix" src="/__author-index-data.json"></author-index>', { delay: 300 });
    const html = await page.evaluate(async () => {
      const ix = /** @type {HTMLElement} */ (document.getElementById('ix'));
      ix.remove();
      await new Promise((r) => setTimeout(r, 600));
      return ix.innerHTML;
    });
    expect(html).toBe('');
  });
});
