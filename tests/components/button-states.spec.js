/**
 * Buttons read the theme's interactive state tokens (vanilla-breeze-o4tj).
 *
 * Themes override --color-primary-hover / -active (96 and 14 times), but
 * button derived its states with local oklch() formulas, so those
 * overrides never landed. Now a button without a custom colour uses
 * --color-interactive-hover / -active (which follow the primary tokens);
 * a button with --btn-color still derives its own states from it.
 */
import { test, expect } from 'playwright/test';

async function load(page, extraCss, body) {
  const url = `/__button-states-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" data-mode="light"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/cdn/vanilla-breeze.css"><style>${extraCss}</style></head>
      <body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const bg = (page, sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);

test('a theme override of --color-primary-hover reaches a default button', async ({ page }) => {
  await load(page, ':root { --color-primary-hover: rgb(200, 0, 0); } button { transition: none !important; }',
    '<button type="button" id="b">Save</button>');
  await page.hover('#b');
  expect(await bg(page, '#b')).toBe('rgb(200, 0, 0)');
});

test('a theme override of --color-primary-active reaches a default button', async ({ page }) => {
  await load(page, ':root { --color-primary-active: rgb(0, 0, 200); } button { transition: none !important; }',
    '<button type="button" id="b">Save</button>');
  const box = await page.locator('#b').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect(await bg(page, '#b')).toBe('rgb(0, 0, 200)');
  await page.mouse.up();
});

test('a custom --btn-color still derives its own hover, ignoring the theme token', async ({ page }) => {
  await load(page, ':root { --color-primary-hover: rgb(200, 0, 0); } button { transition: none !important; }',
    '<button type="button" id="b" style="--btn-color: rgb(0, 128, 0)">Go</button>');
  const base = await bg(page, '#b');
  await page.hover('#b');
  const hover = await bg(page, '#b');
  expect(hover).not.toBe('rgb(200, 0, 0)');
  expect(hover).not.toBe(base);
});
