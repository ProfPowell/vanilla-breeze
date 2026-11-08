/**
 * Colour accents (data-accent) — a separate axis from data-theme
 * (vanilla-breeze-5z8i). Accents tint the seed-based themes; fixed-palette
 * themes keep their own colours.
 *
 * Every assertion measures a PAINTED colour (a button's background, a
 * link's text, a focus outline), not a custom-property value: the scoped
 * accent once recoloured --color-primary while buttons and links inside it
 * kept the page hue, because --color-interactive and the *-auto text tokens
 * were resolved on :root and never re-declared at the accent's scope.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const ACCENTS = ['ocean', 'forest', 'sunset', 'rose', 'lavender', 'coral', 'slate', 'emerald', 'amber', 'indigo'];

async function load(page, htmlAttrs, body, extraHead = '') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__accent-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${htmlAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${extraHead}</head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Paint a computed colour on a canvas and read back sRGB, OKLCH hue and luminance. */
const paint = (page, sel, prop) => page.locator(sel).first().evaluate((el, p) => {
  const css = getComputedStyle(el)[p];
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  // Composite over the nearest opaque ancestor background (the real ground).
  let ground = 'white';
  for (let n = el.parentElement; n; n = n.parentElement) {
    const bg = getComputedStyle(n).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') { ground = bg; break; }
  }
  ctx.fillStyle = ground; ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const Bk = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  const hue = (Math.atan2(Bk, A) * 180 / Math.PI + 360) % 360;
  return { css, rgb: [r, g, b], hue: Math.round(hue), lum: 0.2126 * R + 0.7152 * G + 0.0722 * B };
}, prop);

const contrast = (a, b) => (Math.max(a.lum, b.lum) + 0.05) / (Math.min(a.lum, b.lum) + 0.05);
/** OKLCH hue distance on the circle */
const hueGap = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

test('scoped data-accent repaints buttons, links and focus rings inside it only', async ({ page }) => {
  await load(page, 'data-mode="light"', `
    <p><button id="out-btn">Out</button> <a id="out-link" href="#x">out</a></p>
    <section id="scoped" data-accent="forest">
      <p><button id="in-btn">In</button> <a id="in-link" href="#x">in</a></p>
    </section>`);
  const outBg = await paint(page, '#out-btn', 'backgroundColor');
  const inBg = await paint(page, '#in-btn', 'backgroundColor');
  const outLink = await paint(page, '#out-link', 'color');
  const inLink = await paint(page, '#in-link', 'color');
  // Page default hue ~260 (blue); forest seeds hue 145 (green).
  expect(hueGap(outBg.hue, 262)).toBeLessThan(15);
  expect(hueGap(outLink.hue, 262)).toBeLessThan(15);
  expect(hueGap(inBg.hue, 145)).toBeLessThan(15);
  expect(hueGap(inLink.hue, 145)).toBeLessThan(15);

  await page.locator('#in-btn').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const ring = await paint(page, '#in-btn', 'outlineColor');
  expect(hueGap(ring.hue, 145)).toBeLessThan(15);
});

test('data-accent on <html> tints the default theme (painted button)', async ({ page }) => {
  await load(page, 'data-mode="light" data-accent="sunset"', '<button id="b">Go</button>');
  expect(hueGap((await paint(page, '#b', 'backgroundColor')).hue, 25)).toBeLessThan(15);
});

test('data-accent tints a seed-based brand theme (modern)', async ({ page }) => {
  await load(page, 'data-mode="light" data-theme="modern" data-accent="forest"', '<button id="b">Go</button>');
  expect(hueGap((await paint(page, '#b', 'backgroundColor')).hue, 145)).toBeLessThan(15);
});

test('a fixed-palette theme keeps its own painted primary under a root accent', async ({ page }) => {
  const swiss = '<link rel="stylesheet" href="/src/tokens/themes/_extreme-swiss.css">';
  await load(page, 'data-mode="light" data-theme="swiss"', '<button id="b">Go</button>', swiss);
  const own = await paint(page, '#b', 'backgroundColor');
  await load(page, 'data-mode="light" data-theme="swiss" data-accent="forest"', '<button id="b">Go</button>', swiss);
  expect((await paint(page, '#b', 'backgroundColor')).rgb).toEqual(own.rgb);
});

for (const mode of ['light', 'dark']) {
  test(`all 10 scoped accents keep button text and links at AA (${mode})`, async ({ page }) => {
    const body = ACCENTS.map((a) => `<section data-accent="${a}"><p><button id="b-${a}">${a}</button> <a id="a-${a}" href="#x">${a} link</a></p></section>`).join('');
    await load(page, `data-mode="${mode}"`, body);
    const failures = [];
    for (const a of ACCENTS) {
      const bg = await paint(page, `#b-${a}`, 'backgroundColor');
      const fg = await paint(page, `#b-${a}`, 'color');
      const link = await paint(page, `#a-${a}`, 'color');
      const ground = await paint(page, `#a-${a}`, 'backgroundColor');
      if (contrast(bg, fg) < 4.5) failures.push(`${a} button ${contrast(bg, fg).toFixed(2)}`);
      if (contrast(link, ground) < 4.5) failures.push(`${a} link ${contrast(link, ground).toFixed(2)}`);
    }
    expect(failures).toEqual([]);
  });
}
