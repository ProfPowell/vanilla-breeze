/**
 * data-effect="stamp" stays visible on dark surfaces (vanilla-breeze-suf1).
 *
 * The stamp used mix-blend-mode: multiply with dark ink colours, so on a
 * dark background it nearly vanished (multiply can only darken). It now
 * blends with --vb-stamp-blend: multiply on light surfaces, screen on dark
 * ones, with lighter ink via light-dark(). The nearest data-mode wins
 * (@scope proximity); the system preference applies only otherwise.
 */
import { test, expect } from 'playwright/test';

async function stamps(page, body, htmlAttrs = '') {
  const url = `/__stamp-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${htmlAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/cdn/vanilla-breeze.css"></head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  return page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-effect~="stamp"]')].map((el) => {
    const cs = getComputedStyle(el);
    // oklch(L C H) → L; color() output varies, so read lightness via a canvas-free probe
    return [el.id, { blend: cs.mixBlendMode, color: cs.color }];
  })));
}

const lightness = (color) => {
  const m = /oklch\(([\d.]+)%?/.exec(color);
  if (m) return parseFloat(m[1]) > 1 ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number);
  return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
};

test('light page: multiply with dark ink', async ({ page }) => {
  const s = await stamps(page, '<span id="a" data-effect="stamp">Paid</span>', 'data-mode="light"');
  expect(s.a.blend).toBe('multiply');
  expect(lightness(s.a.color)).toBeLessThan(0.55);
});

test('dark page: screen with lifted ink', async ({ page }) => {
  const s = await stamps(page, '<span id="a" data-effect="stamp">Paid</span>', 'data-mode="dark"');
  expect(s.a.blend).toBe('screen');
  expect(lightness(s.a.color)).toBeGreaterThan(0.6);
});

test('the nearest data-mode wins in both directions', async ({ page }) => {
  const s = await stamps(page,
    '<section data-mode="light"><span id="lightIsland" data-effect="stamp">A</span></section>' +
    '<section data-mode="dark"><span id="darkIsland" data-effect="stamp">B</span></section>',
    'data-mode="dark"');
  expect(s.lightIsland.blend).toBe('multiply');
  expect(s.darkIsland.blend).toBe('screen');
  const t = await stamps(page,
    '<section data-mode="dark"><span id="darkIsland" data-effect="stamp">B</span></section>',
    'data-mode="light"');
  expect(t.darkIsland.blend).toBe('screen');
});

test('system dark preference applies unless data-mode="light" overrides it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  const s = await stamps(page, '<span id="a" data-effect="stamp">Paid</span>');
  expect(s.a.blend).toBe('screen');
  const t = await stamps(page, '<span id="a" data-effect="stamp">Paid</span>', 'data-mode="light"');
  expect(t.a.blend).toBe('multiply');
});
