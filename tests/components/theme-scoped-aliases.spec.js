/**
 * Nested data-theme re-derives the colour aliases (css-followups).
 *
 * A custom property's var() references resolve on the element that
 * declares it, so --color-interactive: var(--color-primary) declared only
 * on :root froze at the page theme's primary. A nested
 * <section data-theme="swiss"> set its own --color-primary, yet its
 * buttons, links and focus rings stayed the default blue. The alias rules
 * in colors.css / color-mix.css / forms.css now also match [data-theme].
 *
 * Every colour assertion reads a PAINTED colour (button background, link
 * text, focus outline) or a substituted custom property, not the token
 * declaration.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const THEMES = ['swiss', 'cyber', 'journal']
  .map((t) => `<link rel="stylesheet" href="/src/tokens/themes/_extreme-${t}.css">`).join('');

async function load(page, htmlAttrs, body) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__theme-scoped-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${htmlAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${THEMES}</head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** OKLCH hue (degrees) and chroma of a painted colour, read back from a canvas. */
const paint = (page, sel, prop) => page.locator(sel).first().evaluate((el, p) => {
  const css = getComputedStyle(el)[p];
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const Bk = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return { css, rgb: [r, g, b], hue: Math.round((Math.atan2(Bk, A) * 180 / Math.PI + 360) % 360), chroma: Math.hypot(A, Bk) };
}, prop);

const hueGap = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

// Swiss red is oklch(50% 0.25 25), cyber cyan oklch(75% 0.25 180) (light
// seeds: --color-primary), the default primary hue is 260. sRGB read-back
// shifts the measured hue by a few degrees.
const SECTIONS = `
  <p><button id="out-btn">Out</button> <a id="out-link" href="#x">out</a></p>
  <section data-theme="swiss">
    <p><button id="swiss-btn">Swiss</button> <a id="swiss-link" href="#x">swiss</a></p>
    <p><input id="swiss-input" aria-label="Swiss input"></p>
  </section>
  <section data-theme="cyber">
    <p><button id="cyber-btn">Cyber</button> <a id="cyber-link" href="#x">cyber</a></p>
  </section>`;

test('a nested data-theme paints its own buttons and links', async ({ page }) => {
  await load(page, 'data-mode="light"', SECTIONS);
  expect(hueGap((await paint(page, '#out-btn', 'backgroundColor')).hue, 262)).toBeLessThan(15);
  expect(hueGap((await paint(page, '#swiss-btn', 'backgroundColor')).hue, 27)).toBeLessThan(15);
  expect(hueGap((await paint(page, '#cyber-btn', 'backgroundColor')).hue, 180)).toBeLessThan(15);
  expect(hueGap((await paint(page, '#swiss-link', 'color')).hue, 27)).toBeLessThan(15);
});

test('a nested data-theme re-derives focus, form and color-mix aliases', async ({ page }) => {
  await load(page, 'data-mode="light"', SECTIONS);
  const props = await page.locator('#swiss-input').evaluate((el) => {
    const cs = getComputedStyle(el);
    return ['--color-interactive', '--focus-ring-color', '--input-border-focus', '--control-checked-bg', '--surface-hover', '--tint-primary-10']
      .map((p) => [p, cs.getPropertyValue(p).trim()]);
  });
  for (const [prop, value] of props) expect(value, prop).toContain('0.25 25');

  await page.locator('#swiss-btn').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  expect(hueGap((await paint(page, '#swiss-btn', 'outlineColor')).hue, 27)).toBeLessThan(15);
});

test('a page-level theme still paints (html data-theme)', async ({ page }) => {
  await load(page, 'data-mode="light" data-theme="swiss"', '<button id="b">Go</button> <a id="a" href="#x">link</a>');
  expect(hueGap((await paint(page, '#b', 'backgroundColor')).hue, 27)).toBeLessThan(15);
  expect(hueGap((await paint(page, '#a', 'color')).hue, 27)).toBeLessThan(15);
});

test('a theme that sets --color-interactive itself keeps it when nested', async ({ page }) => {
  // journal sets its own --color-interactive (bundle-theme layer), which
  // must still beat the token-layer alias on the nested element.
  await load(page, 'data-mode="light" data-theme="journal"', '<button id="root-b">Root</button>');
  const rootJournal = await paint(page, '#root-b', 'backgroundColor');
  await load(page, 'data-mode="light"', '<section data-theme="journal"><button id="b">Nested</button></section>');
  expect((await paint(page, '#b', 'backgroundColor')).rgb).toEqual(rootJournal.rgb);
});

test('a nested theme inside a page theme that sets --color-interactive gets its own', async ({ page }) => {
  await load(page, 'data-mode="light" data-theme="journal"', '<section data-theme="swiss"><button id="b">Swiss</button></section>');
  expect(hueGap((await paint(page, '#b', 'backgroundColor')).hue, 27)).toBeLessThan(15);
});

test('dark mode keeps the dark primary, unthemed and nested', async ({ page }) => {
  await load(page, 'data-mode="dark"', SECTIONS);
  const out = await page.locator('#out-btn').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(out).toBe('oklch(0.65 0.18 260)');
  expect(hueGap((await paint(page, '#swiss-btn', 'backgroundColor')).hue, 27)).toBeLessThan(15);
  // A scoped data-mode="dark" region on a light page still re-derives too.
  await load(page, 'data-mode="light"', '<section data-mode="dark"><button id="b">Dark</button></section>');
  expect(await page.locator('#b').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('oklch(0.65 0.18 260)');
});

test('forced colors: a nested theme does not repaint its buttons with its own palette', async ({ page }) => {
  await load(page, 'data-mode="light"', SECTIONS);
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  // a, button opt out with forced-color-adjust: none (_access-system.css),
  // so the tokens must hold system colours on the nested theme too.
  const value = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).getPropertyValue('--color-interactive').trim());
  expect(await value('#out-btn')).toBe('LinkText');
  expect(await value('#swiss-btn')).toBe('LinkText');
  expect(await value('#cyber-btn')).toBe('LinkText');
});
