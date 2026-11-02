/**
 * Breadcrumb current crumb is plain current text, never the nav pill
 * (vanilla-breeze-dvod).
 *
 * nav.breadcrumb sits inside the base nav rules, whose current-page rule
 * paints a filled background on `nav a[aria-current="page"]`. A linked last
 * crumb used to pick that pill up; bread-crumb neutralised it via the nav
 * link tokens. Both now render the same way: no background, no box-shadow,
 * current text colour — also under themes that style breadcrumbs or nav
 * current links (swiss, neumorphism) or fill --color-active-bg (starbucks).
 * In the default theme the leak showed as the crumb taking the nav
 * active-link colour instead of the text colour.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const THEMES = {
  swiss: '/src/tokens/themes/_extreme-swiss.css',
  neumorphism: '/src/tokens/themes/_extreme-neumorphism.css',
  /* the one theme whose --color-active-bg is filled: a real pill */
  starbucks: '/src/tokens/themes/_brand-starbucks.css',
};

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {string} [theme]
 */
async function load(page, body, theme) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__breadcrumb-current-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${theme ? `<link rel="stylesheet" href="${THEMES[theme]}">` : ''}
      <style>*, *::before, *::after { transition: none !important; }</style>
      <script type="module">import '/src/web-components/bread-crumb/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('bread-crumb'));
  await page.waitForSelector('bread-crumb[data-upgraded]');
}

/* The compendium 'breadcrumb' markup: a linked current crumb */
const TRAIL = `<ol><li><a href="#">Home</a></li><li><a href="#">Products</a></li><li><a href="#" aria-current="page">Shoes</a></li></ol>`;

const BODY = `
  <nav class="breadcrumb" aria-label="Native">${TRAIL}</nav>
  <nav aria-label="Component"><bread-crumb>${TRAIL}</bread-crumb></nav>
  <p id="text">Body text</p>`;

/** @param {import('playwright/test').Page} page */
function measure(page) {
  return page.evaluate(() => {
    const read = (/** @type {string} */ sel) => {
      const el = /** @type {Element} */ (document.querySelector(sel));
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        background: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
        boxShadow: cs.boxShadow,
        color: cs.color,
        padding: cs.padding,
      };
    };
    return {
      native: read('nav.breadcrumb [aria-current="page"]'),
      component: read('bread-crumb [aria-current="page"]'),
      text: getComputedStyle(/** @type {Element} */ (document.getElementById('text'))).color,
    };
  });
}

/** @param {{background: string, backgroundImage: string, boxShadow: string}} crumb */
function expectNoPill(crumb) {
  expect(crumb.background).toBe('rgba(0, 0, 0, 0)');
  expect(crumb.backgroundImage).toBe('none');
  expect(crumb.boxShadow).toBe('none');
}

test('linked current crumb has no pill in nav.breadcrumb and bread-crumb', async ({ page }) => {
  await load(page, BODY);
  const r = await measure(page);
  expect(r.native.tag).toBe('a');
  expect(r.component.tag).toBe('a');
  expectNoPill(r.native);
  expectNoPill(r.component);
  /* plain current text: body text colour, same padding, both renderings */
  expect(r.native.color).toBe(r.text);
  expect(r.component.color).toBe(r.text);
  expect(r.native.padding).toBe(r.component.padding);
});

for (const theme of Object.keys(THEMES)) {
  test(`linked current crumb has no pill under the ${theme} theme`, async ({ page }) => {
    await load(page, BODY, theme);
    const r = await measure(page);
    expectNoPill(r.native);
    expectNoPill(r.component);
    expect(r.native.color).toBe(r.component.color);
  });
}
