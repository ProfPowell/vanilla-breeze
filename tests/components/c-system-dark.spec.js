/**
 * CSS-only system dark mode + layout-badge solid contrast
 * (vanilla-breeze-3650, vanilla-breeze-nkfy).
 *
 * Without JS nothing writes data-mode, so a dark OS must get the same dark
 * seeds and hue-tinted surfaces as [data-mode="dark"] from CSS alone, while
 * [data-mode="light"] keeps forcing light under a dark OS. Solid badges must
 * reach 4.5:1 both with contrast-color() and with its fallback (simulated by
 * making the --color-text-on-*-auto tokens guaranteed-invalid).
 *
 * Tests the working tree: /src is served from disk, transitions are off so
 * each state is measured at its end value.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const AA = 4.5;

async function load(page, scheme) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__c-system-dark-${Math.random().toString(36).slice(2)}.html`;
  const colors = ['primary', 'brand', 'secondary', 'accent', 'success', 'warning', 'error', 'info'];
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <style>*, *::before, *::after, :root { transition: none !important; animation: none !important; }</style>
      </head><body><main>
      <p><a href="#x" id="link">Link</a></p>
      <p id="badges">${colors.map((c) => `<layout-badge data-color="${c}">${c}</layout-badge>`).join(' ')}</p>
      <section data-mode="light" id="scoped-light"><a href="#y" id="scoped-link">Scoped</a></section>
      </main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Resolve tokens + contrast numbers on the page in its current state. */
function snapshot({ mode, fallback }) {
  const root = document.documentElement;
  if (mode) root.setAttribute('data-mode', mode); else root.removeAttribute('data-mode');
  const autos = ['primary', 'secondary', 'accent', 'interactive', 'success', 'warning', 'error', 'info'];
  for (const a of autos) {
    if (fallback) root.style.setProperty(`--color-text-on-${a}-auto`, 'initial');
    else root.style.removeProperty(`--color-text-on-${a}-auto`);
  }
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const probe = document.createElement('i');
  document.querySelector('main').append(probe);
  const rgb = (css, host = probe) => {
    if (host === probe) { probe.style.color = 'transparent'; probe.style.color = css; }
    const c = getComputedStyle(host).color;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  };
  const paint = (css) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return Math.round((x + 0.05) / (y + 0.05) * 100) / 100; };
  const tok = (name) => rgb(`var(${name})`).join(',');

  const tokens = {};
  for (const t of ['--color-primary', '--color-interactive', '--color-background', '--color-surface',
    '--color-surface-raised', '--color-surface-sunken', '--color-text', '--color-text-muted',
    '--color-border', '--color-border-strong']) tokens[t] = tok(t);
  for (const t of ['--shadow-xs', '--shadow-s', '--shadow-m', '--shadow-l', '--shadow-xl',
    '--lightness-primary', '--chroma-primary', '--chroma-surface-tint']) {
    tokens[t] = getComputedStyle(root).getPropertyValue(t).trim();
  }

  const link = rgb(null, document.getElementById('link'));
  const surfaces = ['--color-background', '--color-surface', '--color-surface-raised'];
  const linkOn = Object.fromEntries(surfaces.map((s) => [s, cr(link, rgb(`var(${s})`))]));

  const badges = {};
  for (const b of document.querySelectorAll('#badges layout-badge')) {
    const cs = getComputedStyle(b);
    badges[b.dataset.color] = cr(paint(cs.color), paint(cs.backgroundColor));
  }

  const scoped = document.getElementById('scoped-light');
  const scopedOut = {
    scheme: getComputedStyle(scoped).colorScheme,
    bg: rgb('var(--color-background)', (() => { scoped.append(probe); probe.style.color = 'var(--color-background)'; return probe; })()).join(','),
    link: cr(rgb(null, document.getElementById('scoped-link')), [255, 255, 255]),
  };
  probe.remove();
  return { tokens, linkOn, badges, scoped: scopedOut, contrastColor: CSS.supports('color', 'contrast-color(red)') };
}

test.describe('system dark mode without data-mode (3650)', () => {
  test('dark OS + no data-mode matches [data-mode=dark] and links reach AA', async ({ page }) => {
    await load(page, 'dark');
    const system = await page.evaluate(snapshot, { mode: null });
    const forced = await page.evaluate(snapshot, { mode: 'dark' });
    console.log('system-dark', JSON.stringify(system));
    expect(system.tokens).toEqual(forced.tokens);
    for (const [s, ratio] of Object.entries(system.linkOn)) {
      expect(ratio, `link on ${s}`).toBeGreaterThanOrEqual(AA);
    }
  });

  test('scoped data-mode=light inside a system-dark page stays light', async ({ page }) => {
    await load(page, 'dark');
    const system = await page.evaluate(snapshot, { mode: null });
    expect(system.scoped.scheme).toBe('light');
    expect(system.scoped.bg).toBe('255,255,255');
    expect(system.scoped.link).toBeGreaterThanOrEqual(AA);
  });

  test('[data-mode=light] under a dark OS equals light mode under a light OS', async ({ page, browser }) => {
    await load(page, 'dark');
    const forcedLight = await page.evaluate(snapshot, { mode: 'light' });
    const lightPage = await browser.newPage();
    await load(lightPage, 'light');
    const osLight = await lightPage.evaluate(snapshot, { mode: null });
    const osLightForced = await lightPage.evaluate(snapshot, { mode: 'light' });
    await lightPage.close();
    expect(forcedLight.tokens).toEqual(osLight.tokens);
    expect(osLight.tokens).toEqual(osLightForced.tokens);
    expect(osLight.tokens['--color-background']).toBe('255,255,255');
    for (const [s, ratio] of Object.entries(osLight.linkOn)) {
      expect(ratio, `light link on ${s}`).toBeGreaterThanOrEqual(AA);
    }
  });
});

test.describe('layout-badge solid colours (nkfy)', () => {
  for (const [scheme, mode] of [['light', null], ['light', 'light'], ['dark', 'dark'], ['dark', null], ['dark', 'light']]) {
    for (const fallback of [false, true]) {
      test(`${scheme} OS, data-mode=${mode ?? 'none'}, ${fallback ? 'fallback' : 'contrast-color()'}`, async ({ page }) => {
        await load(page, scheme);
        const out = await page.evaluate(snapshot, { mode, fallback });
        console.log(scheme, mode, fallback, JSON.stringify(out.badges));
        for (const [color, ratio] of Object.entries(out.badges)) {
          expect(ratio, `${color} badge`).toBeGreaterThanOrEqual(AA);
        }
      });
    }
  }
});
