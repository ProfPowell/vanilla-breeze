/**
 * iframe / img / picture — review fixes (vanilla-breeze-9vrm).
 *
 * Covers: iframe.full keeps the height attribute; iframe.fixed is full
 * width; data-ratio iframe sizing; no lingering background on lazy images
 * (transparent logos); img.ratio-landscape is 4:3; picture > img is not
 * upscaled past its intrinsic width (.full opts in); ratio classes combine
 * with .contain.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

// Transparent 100x100 SVG (no background of its own)
const TRANSPARENT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>',
)}`;
// Opaque 300x200 (3:2) SVG
const WIDE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="teal"/></svg>',
)}`;

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__i-media-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body><main id="box">${body}</main></body></html>`,
  }));
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => {
    const box = document.getElementById('box');
    box.style.inlineSize = '600px';
    box.style.padding = '0';
  });
}

const rect = (page, sel) => page.locator(sel).evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height) };
});

test.describe('iframe', () => {
  test('.full honours the height attribute and fills the width', async ({ page }) => {
    await load(page, '<iframe id="f" class="full" height="240" title="t" srcdoc="<p>x</p>"></iframe>');
    expect(await rect(page, '#f')).toEqual({ w: 600, h: 240 });
  });

  test('.fixed is full width and 400px tall', async ({ page }) => {
    await load(page, '<iframe id="f" class="fixed" width="300" height="150" title="t" srcdoc="<p>x</p>"></iframe>');
    expect(await rect(page, '#f')).toEqual({ w: 600, h: 400 });
  });

  test('default iframe keeps width/height attributes', async ({ page }) => {
    await load(page, '<iframe id="f" width="320" height="180" title="t" srcdoc="<p>x</p>"></iframe>');
    expect(await rect(page, '#f')).toEqual({ w: 320, h: 180 });
  });

  test('data-ratio sizing: fills without width, width is the maximum', async ({ page }) => {
    await load(page, `
      <iframe id="a" data-ratio="16:9" title="a" srcdoc="<p>x</p>"></iframe>
      <iframe id="b" data-ratio="4:3" width="400" height="300" title="b" srcdoc="<p>x</p>"></iframe>
      <iframe id="c" data-ratio="4:3" width="900" height="675" title="c" srcdoc="<p>x</p>"></iframe>
      <iframe id="d" data-ratio="page" title="d" srcdoc="<p>x</p>"></iframe>`);
    expect(await rect(page, '#a')).toEqual({ w: 600, h: 338 });
    expect(await rect(page, '#b')).toEqual({ w: 400, h: 300 });
    expect(await rect(page, '#c')).toEqual({ w: 600, h: 450 });
    expect(await rect(page, '#d')).toEqual({ w: 600, h: 848 });
  });
});

test.describe('img', () => {
  test('lazy image has no background after load (transparent logo)', async ({ page }) => {
    await load(page, `<img id="i" src="${TRANSPARENT}" alt="Logo" width="100" height="100" loading="lazy">`);
    await page.locator('#i').evaluate((img) => img.decode());
    const bg = await page.locator('#i').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgba(0, 0, 0, 0)');
  });

  test('missing src still gets a placeholder surface', async ({ page }) => {
    await load(page, '<img id="i" alt="Pending upload">');
    const s = await page.locator('#i').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, min: cs.minBlockSize };
    });
    expect(s.bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(s.min).toBe('100px');
  });

  test('.ratio-landscape renders 4:3 and crops', async ({ page }) => {
    await load(page, `<img id="i" class="ratio-landscape" src="${WIDE}" alt="x" width="300" height="200">`);
    const r = await rect(page, '#i');
    expect(r).toEqual({ w: 300, h: 225 });
    expect(await page.locator('#i').evaluate((el) => getComputedStyle(el).objectFit)).toBe('cover');
  });

  test('ratio classes combine with .contain', async ({ page }) => {
    await load(page, `<img id="i" class="ratio-square contain" src="${WIDE}" alt="x" width="300" height="200">`);
    expect(await rect(page, '#i')).toEqual({ w: 300, h: 300 });
    expect(await page.locator('#i').evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
  });
});

test.describe('picture', () => {
  test('picture > img is not upscaled past its intrinsic width', async ({ page }) => {
    await load(page, `<picture id="p"><img id="i" src="${TRANSPARENT}" alt="x" width="100" height="100"></picture>`);
    expect(await rect(page, '#i')).toEqual({ w: 100, h: 100 });
  });

  test('picture.full stretches its img', async ({ page }) => {
    await load(page, `<picture class="full"><img id="i" src="${TRANSPARENT}" alt="x" width="100" height="100"></picture>`);
    expect(await rect(page, '#i')).toEqual({ w: 600, h: 600 });
  });

  test('a large picture > img still shrinks to fit', async ({ page }) => {
    await load(page, `<picture><img id="i" src="${WIDE}" alt="x" width="900" height="600"></picture>`);
    expect(await rect(page, '#i')).toEqual({ w: 600, h: 400 });
  });

  test('[data-media] > picture > img fills the ratio box', async ({ page }) => {
    await load(page, `<figure data-media data-ratio="1:1"><picture><img id="i" src="${WIDE}" alt="x" width="300" height="200"></picture></figure>`);
    expect(await rect(page, '#i')).toEqual({ w: 600, h: 600 });
  });
});
