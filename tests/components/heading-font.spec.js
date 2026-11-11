/**
 * Headings read --font-heading (src/native-elements/headings/styles.css).
 * Unset, a heading keeps the font of the text around it; set, every level
 * uses it; an element with its own data-theme does not keep the heading
 * face of the page around it.
 */
import { test, expect } from 'playwright/test';

const PAGE = '/__heading-font.html';

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {string} [css]
 */
async function load(page, body, css = '') {
  await page.route(`**${PAGE}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title>
<link rel="stylesheet" href="/src/main.css"><style>${css}</style></head><body>${body}</body></html>`,
  }));
  await page.goto(PAGE);
}

const family = (/** @type {import('playwright/test').Page} */ page, /** @type {string} */ sel) =>
  page.locator(sel).evaluate((el) => getComputedStyle(el).fontFamily);

test('a heading inherits the surrounding font when --font-heading is unset', async ({ page }) => {
  await load(page, '<h2 id="a">Plain</h2><section style="font-family: Georgia, serif"><h3 id="b">Serif</h3></section>');
  expect(await family(page, '#a')).toBe(await family(page, 'body'));
  expect(await family(page, '#b')).toMatch(/^Georgia/);
});

test('every heading level uses --font-heading when it is set', async ({ page }) => {
  await load(page, [1, 2, 3, 4, 5, 6].map((n) => `<h${n}>Level ${n}</h${n}>`).join('') + '<p>Text</p>',
    ':root { --font-heading: "Heading Face", fantasy; }');
  for (const n of [1, 2, 3, 4, 5, 6]) expect(await family(page, `h${n}`)).toMatch(/^"?Heading Face/);
  expect(await family(page, 'p')).not.toMatch(/Heading Face/);
});

test('a scoped theme does not keep the page heading face', async ({ page }) => {
  await load(page, '<h2 id="outer">Outer</h2><article data-theme="nord"><h2 id="inner">Inner</h2><p id="text">Text</p></article>',
    ':root { --font-heading: "Heading Face", fantasy; }');
  expect(await family(page, '#outer')).toMatch(/^"?Heading Face/);
  expect(await family(page, '#inner')).toBe(await family(page, '#text'));
});
