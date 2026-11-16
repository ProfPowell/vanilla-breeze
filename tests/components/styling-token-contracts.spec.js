/**
 * Styling tokens, measured in the browser (the static half is
 * tests/unit/styling-token-contracts.test.js):
 *   - --radius-inner follows the parent's --_radius / --_inset
 *   - --page-bg-image paints on <body>, under --page-bg-gradient
 *   - paper surfaces (body text, muted text, links) and --color-text-on-primary reach AA in both modes
 *   - data-surface="frosted" blurs with no theme
 *   - data-shadow material / flicker stop for data-motion-reduced
 *
 * Tests the working tree: /src is served from disk.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const AA = 4.5;

async function load(page, body, { scheme = 'light', attrs = '' } = {}) {
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'no-preference' });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__styling-tokens-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${attrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <style>.card { --_radius: 24px; --_inset: 8px; border-radius: var(--_radius); padding: var(--_inset); }
        .card > p, .inner { border-radius: var(--radius-inner); }</style>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** WCAG contrast between an element's text colour and a background colour. */
function contrastOf({ fg, bg }) {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const px = (css) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  const lum = (c) => c.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const read = (sel, prop) => getComputedStyle(document.querySelector(sel))[prop];
  const [hi, lo] = [lum(px(read(fg, 'color'))), lum(px(read(bg, 'backgroundColor')))].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

test('--radius-inner is the parent radius minus its inset, from a rule or a style attribute', async ({ page }) => {
  await load(page, `
    <article class="card"><p id="rule">In a rule</p></article>
    <article style="--_radius: 20px; --_inset: 30px"><p id="clamped" class="inner">Inset larger than radius</p></article>
    <p id="plain" class="inner">No parent</p>`);
  const radius = (id) => page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  expect(await radius('rule')).toBe('16px');
  expect(await radius('clamped')).toBe('0px');
  expect(await radius('plain')).toBe(await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement('i'));
    probe.style.borderRadius = 'var(--radius-m)';
    return getComputedStyle(probe).borderTopLeftRadius;
  }));
});

test('--page-bg-image paints on body, under a gradient when both are set', async ({ page }) => {
  await load(page, '<p>Page</p>');
  const image = () => page.evaluate(() => getComputedStyle(document.body).backgroundImage);
  expect(await image()).toBe('none, none');
  await page.evaluate(() => document.documentElement.style.setProperty('--page-bg-image', 'radial-gradient(red, blue)'));
  expect(await image()).toMatch(/^none, radial-gradient\(/);
  await page.evaluate(() => document.documentElement.style.setProperty('--page-bg-gradient', 'linear-gradient(red, blue)'));
  expect(await image()).toMatch(/^linear-gradient\(.*, radial-gradient\(/);
});

for (const scheme of ['light', 'dark']) {
  test(`paper surfaces and text on primary reach AA in ${scheme} mode`, async ({ page }) => {
    await load(page, `
      ${['paper', 'dots', 'grid', 'lines', 'kraft'].map((s) => `<aside id="${s}" data-surface="${s}"><p>Note</p><small style="color: var(--color-text-muted)">Muted</small> <a href="#x">Link</a></aside>`).join('')}
      <p id="fill" style="background-color: var(--color-primary); color: var(--color-text-on-primary)">On primary</p>
      <p id="subtle" style="background-color: var(--color-primary-subtle)">On subtle</p>`, { scheme });
    for (const s of ['paper', 'dots', 'grid', 'lines', 'kraft']) {
      // paper and kraft paint their colour in the background shorthand's final layer
      for (const el of ['p', 'small', 'a']) {
        expect(await page.evaluate(contrastOf, { fg: `#${s} ${el}`, bg: `#${s}` }), `${s} ${el}`).toBeGreaterThanOrEqual(AA);
      }
    }
    expect(await page.evaluate(contrastOf, { fg: '#fill', bg: '#fill' }), 'text on primary').toBeGreaterThanOrEqual(AA);
    expect(await page.evaluate(contrastOf, { fg: '#subtle', bg: '#subtle' }), 'text on primary-subtle').toBeGreaterThanOrEqual(AA);
  });
}

test('data-surface="frosted" blurs with no theme', async ({ page }) => {
  // The host's Reduce Transparency setting reaches headless Chromium and removes the blur.
  await load(page, '<header id="glass" data-surface="frosted">Glass</header>');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'no-preference' }] });
  const filter = await page.locator('#glass').evaluate((el) => getComputedStyle(el).backdropFilter);
  const px = Number(/blur\(([\d.]+)px\)/.exec(filter)?.[1] ?? 0);
  expect(px, filter).toBeGreaterThan(0);
});

test('data-motion-reduced stops the material lift and the glow flicker', async ({ page }) => {
  const body = '<article id="lift" data-shadow="material">Lift</article><aside id="glow" data-shadow="glow flicker">Glow</aside>';
  await load(page, body);
  const state = () => page.evaluate(() => ({
    transition: getComputedStyle(document.getElementById('lift')).transitionDuration,
    animation: getComputedStyle(document.getElementById('glow')).animationName,
  }));
  expect(await state()).toEqual({ transition: '0.25s, 0.25s', animation: 'vb-shadow-glow-pulse' });
  await page.evaluate(() => document.documentElement.setAttribute('data-motion-reduced', ''));
  const reduced = await state();
  expect(reduced.animation).toBe('none');
  expect(reduced.transition).toBe('0s');
  await page.hover('#lift');
  expect(await page.locator('#lift').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
});
