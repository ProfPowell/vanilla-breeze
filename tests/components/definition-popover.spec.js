/**
 * Inline glossary-term popover (site/plugins/generate-definitions-json.js).
 *
 * The script the plugin emits is served as-is, so this tests the working
 * tree and not the last build: a clicked term previews its definition, the
 * preview closes when the page scrolls or resizes (it is placed once in
 * viewport coordinates, so it would otherwise float over unrelated text),
 * and a term whose entry is on the current page is followed, not previewed.
 */
import { test, expect } from 'playwright/test';
import { POPOVER_SCRIPT, POPOVER_CSS } from '../../site/plugins/generate-definitions-json.js';

const DEFS = {
  alpha: { term: 'alpha', definition: 'The first one.', href: '/glossary/#term-alpha' },
  beta: { term: 'beta', definition: 'The second one.', href: '/glossary/#term-beta' },
};

/**
 * @param {import('playwright/test').Page} page
 * @param {string} path
 * @param {string} body
 */
async function load(page, path, body) {
  await page.route('**/definitions.json', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(DEFS),
  }));
  await page.route(`**${path}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title>
      <style>${POPOVER_CSS} body { min-block-size: 300vh; }</style></head>
      <body>${body}<script>${POPOVER_SCRIPT}</script></body></html>`,
  }));
  await page.goto(path);
}

const PROSE = '<p>Read about <a href="/glossary/#term-alpha" data-concept="alpha">alpha</a> first.</p>';

test.describe('definition popover', () => {
  test('a clicked term previews its definition', async ({ page }) => {
    await load(page, '/__dfn-prose.html', PROSE);
    await page.locator('a[data-concept]').click();
    const popover = page.locator('#dfn-popover');
    await expect(popover).toBeVisible();
    await expect(popover.locator('[data-dfn-definition]')).toHaveText('The first one.');
    await expect(popover.locator('[data-dfn-link]')).toHaveAttribute('href', '/glossary/#term-alpha');
  });

  test('scrolling the page closes the preview', async ({ page }) => {
    await load(page, '/__dfn-scroll.html', PROSE);
    await page.locator('a[data-concept]').click();
    const popover = page.locator('#dfn-popover');
    await expect(popover).toBeVisible();
    await page.mouse.wheel(0, 400);
    await expect(popover).toBeHidden();

    // It opens again afterwards, and a resize closes it too.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('a[data-concept]').click();
    await expect(popover).toBeVisible();
    await page.setViewportSize({ width: 700, height: 500 });
    await expect(popover).toBeHidden();
  });

  test('a term whose entry is on this page is followed, not previewed', async ({ page }) => {
    await load(page, '/glossary/', `
      <dl><dt id="term-alpha">alpha</dt>
      <dd>The first one. Related: <a href="/glossary/#term-beta" data-concept="beta">beta</a></dd>
      <dt id="term-beta">beta</dt><dd>The second one.</dd></dl>`);
    await page.locator('a[data-concept]').click();
    await expect(page).toHaveURL(/#term-beta$/);
    await expect(page.locator('#dfn-popover')).toHaveCount(0);
  });
});
