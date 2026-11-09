/**
 * prefers-reduced-transparency keeps the strong overlay a dark scrim
 * (css-followups).
 *
 * --color-overlay-strong is the scrim behind light text over hero / CTA
 * background images and dialog backdrops: dark in both modes. Under reduced
 * transparency _access-system.css used to swap it for an opaque light grey
 * in light mode, which hid the image and left white text on grey (~1.6:1).
 * It is now a denser but still translucent black in both modes.
 *
 * Playwright's emulateMedia has no reducedTransparency option, so the
 * feature is emulated over CDP (Chromium only, like the rest of the suite).
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, mode, { reduce = true } = {}) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: reduce ? 'reduce' : 'no-preference' }],
  });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__reduced-transparency-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" data-mode="${mode}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <style>
        #hero { position: relative; background: white; color: white; padding: 4rem; }
        #hero::before { content: ""; position: absolute; inset: 0; background: var(--color-overlay-strong); }
        #hero > * { position: relative; }
      </style></head><body><main>
      <section id="hero"><h1 id="t">Over an image</h1></section>
      </main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** The overlay composited over a pure-white image, as sRGB + relative luminance. */
const scrim = (page) => page.locator('#hero').evaluate((el) => {
  const css = getComputedStyle(el, '::before').backgroundColor;
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const alpha = /\/\s*([\d.]+)\)$/.exec(css)?.[1] ?? /rgba\([^)]*,\s*([\d.]+)\)$/.exec(css)?.[1] ?? '1';
  return { css, alpha: Number(alpha), rgb: [r, g, b], lum: 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) };
});

for (const mode of ['light', 'dark']) {
  test(`reduced transparency: the strong overlay stays a translucent dark scrim (${mode})`, async ({ page }) => {
    await load(page, mode);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches)).toBe(true);
    const s = await scrim(page);
    // White text over the scrim on the brightest possible image keeps AAA.
    expect((1.05) / (s.lum + 0.05), s.css).toBeGreaterThan(7);
    // Still translucent: the image behind is not hidden outright.
    expect(s.alpha, s.css).toBeLessThan(1);
    expect(s.alpha, s.css).toBeGreaterThan(0.6);
  });

  test(`reduced transparency makes the scrim no lighter than the default (${mode})`, async ({ page }) => {
    await load(page, mode, { reduce: false });
    const normal = await scrim(page);
    await load(page, mode);
    const reduced = await scrim(page);
    expect(reduced.lum).toBeLessThanOrEqual(normal.lum);
  });
}
