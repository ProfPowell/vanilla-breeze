/**
 * Colour accents (data-accent) — a separate axis from data-theme
 * (vanilla-breeze-5z8i). Before, accents existed only as inline seeds on
 * :root and the themes page's scoped data-theme="forest" examples did
 * nothing. Accents tint the seed-based themes; fixed-palette themes keep
 * their own colours.
 */
import { test, expect } from 'playwright/test';

async function load(page, htmlAttrs, body, extraHead = '') {
  const url = `/__accent-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${htmlAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/cdn/vanilla-breeze.css">${extraHead}</head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const hueOf = (page, sel) => page.locator(sel).evaluate((el) => {
  const c = getComputedStyle(el).getPropertyValue('--color-primary').trim();
  const probe = document.createElement('i'); probe.style.color = c; el.append(probe);
  const v = getComputedStyle(probe).color; probe.remove();
  const m = /oklch\(([\d.]+) ([\d.]+) ([\d.]+)/.exec(v);
  return m ? Math.round(Number(m[3])) : v;
});

test('data-accent="forest" on an element recolours primary there only', async ({ page }) => {
  await load(page, 'data-mode="light"', '<p id="outside">x</p><section id="scoped" data-accent="forest"><button id="btn">Go</button></section>');
  expect(await hueOf(page, '#outside')).toBe(260);
  expect(await hueOf(page, '#scoped')).toBe(145);
  expect(await hueOf(page, '#btn')).toBe(145);
});

test('data-accent on <html> tints the default theme', async ({ page }) => {
  await load(page, 'data-mode="light" data-accent="sunset"', '<p id="p">x</p>');
  expect(await hueOf(page, '#p')).toBe(25);
});

test('data-accent tints a seed-based brand theme (modern)', async ({ page }) => {
  await load(page, 'data-mode="light" data-theme="modern" data-accent="forest"', '<p id="p">x</p>');
  expect(await hueOf(page, '#p')).toBe(145);
});

test('a fixed-palette theme keeps its own primary under an accent', async ({ page }) => {
  const swiss = '<link rel="stylesheet" href="/cdn/themes/swiss.css">';
  await load(page, 'data-mode="light" data-theme="swiss"', '<p id="p">x</p>', swiss);
  const own = await hueOf(page, '#p');
  await load(page, 'data-mode="light" data-theme="swiss" data-accent="forest"', '<p id="p">x</p>', swiss);
  expect(await hueOf(page, '#p')).toBe(own);
});
