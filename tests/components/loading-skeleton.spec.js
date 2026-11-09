/**
 * data-loading variants under their own specificity (css-followups).
 *
 * The base overlay rules were [data-loading]:not(output, button, .button),
 * whose :not() counts as a class, so they outranked every later variant:
 * skeleton children stayed at the dim 0.3 opacity, data-loading="minimal"
 * kept the sweep, and reduced motion kept animating. The nested
 * `img, svg { opacity: 0 }` also hid the grey box a DIRECT img child of a
 * skeleton is meant to be.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const IMG = '/src/assets/placeholders/photo-figure-1-600x400.svg';

async function load(page, body, { reducedMotion = 'no-preference', mode = 'light' } = {}) {
  await page.emulateMedia({ reducedMotion });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__loading-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" data-mode="${mode}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css"></head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
}

const style = (page, sel, props, pseudo = null) => page.locator(sel).first().evaluate(
  (el, [p, ps]) => Object.fromEntries(p.map((k) => [k, getComputedStyle(el, ps)[k]])),
  [props, pseudo],
);

test('skeleton children render at full opacity, plain data-loading still dims', async ({ page }) => {
  await load(page, `
    <article id="sk" data-loading="skeleton"><h3>Title</h3><p id="sk-p">Line</p></article>
    <article id="dim" data-loading><p id="dim-p">Refreshing</p></article>`);
  expect((await style(page, '#sk-p', ['opacity'])).opacity).toBe('1');
  expect((await style(page, '#sk', ['overflow'])).overflow).toBe('visible');
  expect((await style(page, '#dim-p', ['opacity'])).opacity).toBe('0.3');
  expect((await style(page, '#dim', ['overflow'])).overflow).toBe('hidden');
});

test('data-loading="minimal" pulses instead of sweeping', async ({ page }) => {
  await load(page, '<article id="m" data-loading="minimal"><p>Refreshing</p></article>');
  const after = await style(page, '#m', ['animationName', 'backgroundImage'], '::after');
  expect(after.animationName).toBe('loading-pulse');
  expect(after.backgroundImage).toBe('none');
});

test('reduced motion stops the overlay shimmer', async ({ page }) => {
  await load(page, '<article id="d" data-loading><p>Refreshing</p></article>', { reducedMotion: 'reduce' });
  expect((await style(page, '#d', ['animationName'], '::after')).animationName).toBe('none');
});

test('outputs and buttons keep their own data-loading treatment', async ({ page }) => {
  await load(page, '<button id="b" data-loading>Save</button><output id="o" data-loading>Loading</output>');
  // The :where() exclusion still keeps the overlay shimmer off them.
  for (const sel of ['#b', '#o']) {
    expect((await style(page, sel, ['animationName'], '::after')).animationName, sel).not.toBe('loading-shimmer');
  }
});

for (const mode of ['light', 'dark']) {
  test(`a direct img child of a skeleton is a visible grey box (${mode})`, async ({ page }) => {
    await load(page, `
      <article data-loading="skeleton" style="inline-size: 300px">
        <img id="direct" src="${IMG}" alt="" width="600" height="400">
        <figure id="fig"><img id="nested" src="${IMG}" alt="" width="600" height="400"></figure>
        <p>Line</p>
      </article>`, { mode });
    const direct = await style(page, '#direct', ['opacity', 'backgroundColor']);
    expect(direct.opacity).toBe('1');
    expect(direct.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    const box = await page.locator('#direct').boundingBox();
    expect(Math.round(box.height)).toBe(200);
    // The image pixels are hidden: the centre of the box paints the flat
    // border colour, not the placeholder art.
    const shot = await page.locator('#direct').screenshot();
    const pixels = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const cv = Object.assign(document.createElement('canvas'), { width: img.width, height: img.height });
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, img.width, img.height).data;
      const colours = new Set();
      for (let i = 0; i < d.length; i += 4 * 97) colours.add(`${d[i]},${d[i + 1]},${d[i + 2]}`);
      return colours.size;
    }, shot.toString('base64'));
    expect(pixels).toBeLessThanOrEqual(2);
    // A nested img still hides inside its grey figure.
    expect((await style(page, '#nested', ['opacity'])).opacity).toBe('0');
  });
}
