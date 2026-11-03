/**
 * select chevron — vanilla-breeze-c7lt.
 *
 * The chevron used to be an SVG data URI, which cannot see currentColor:
 * it rendered black under data-mode="dark" and in forced-colors, and it
 * never mirrored for right-to-left text. It is now a currentColor
 * gradient (--select-chevron) on the inline-end side.
 *
 * Chromium supports appearance: base-select, where input/select.css swaps
 * the background chevron for ::picker-icon. The fallback path (every
 * browser without base-select) is tested by serving that file empty;
 * one test keeps the base-select behaviour honest.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', mode = 'light', baseSelect = false, head = '' } = {}) {
  await page.route('**/src/**', (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname);
    if (!baseSelect && path.endsWith('/native-elements/input/select.css')) {
      return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    }
    return route.fulfill({ path: join(REPO, path) });
  });
  const url = `/__select-chevron-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}" data-mode="${mode}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
}

const SELECT = `<label for="s">Fruit</label>
  <select id="s"><option>Apple</option><option>Banana</option></select>`;

/**
 * Screenshot the select and return, for its left and right 3rem strips,
 * the darkest/lightest pixel distance from the background plus the
 * colour of the pixel that differs most from the background.
 */
async function arrowPixels(page, sel = '#s') {
  const png = await page.locator(sel).screenshot({ animations: 'disabled', caret: 'hide' });
  return page.evaluate(async ({ b64 }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    const at = (x, y) => { const i = (y * c.width + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
    // Stay clear of the border and its rounded corners
    const inset = Math.round(10 * devicePixelRatio);
    const bg = at(Math.floor(c.width / 2), inset);
    const strip = Math.round(48 * devicePixelRatio);
    const scan = (x0, x1) => {
      let best = { d: 0, rgb: bg, x: -1 };
      for (let y = inset; y < c.height - inset; y++) {
        for (let x = x0; x < x1; x++) {
          const p = at(x, y);
          const d = Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]);
          if (d > best.d) best = { d, rgb: p, x };
        }
      }
      return best;
    };
    return {
      bg,
      width: c.width,
      left: scan(inset, strip),
      right: scan(c.width - strip, c.width - inset),
    };
  }, { b64: png.toString('base64') });
}

const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

test.describe('fallback chevron (no base-select)', () => {
  test('LTR: arrow and end padding on the right', async ({ page }) => {
    await load(page, `<label for="s">Fruit</label><select id="s"><option></option></select>`);
    const cs = await page.evaluate(() => {
      const s = getComputedStyle(document.getElementById('s'));
      return { image: s.backgroundImage, pr: parseFloat(s.paddingRight), pl: parseFloat(s.paddingLeft) };
    });
    expect(cs.image).toContain('conic-gradient');
    expect(cs.pr).toBeGreaterThan(cs.pl);
    const px = await arrowPixels(page);
    expect(px.right.d).toBeGreaterThan(150);
    expect(px.left.d).toBeLessThan(px.right.d);
  });

  test('RTL: arrow and end padding mirror to the left', async ({ page }) => {
    // Empty option text, so the only ink in either strip is the arrow
    await load(page, `<label for="s">Fruit</label>
      <select id="s"><option>&#x200F;</option></select>`, { dir: 'rtl' });
    const cs = await page.evaluate(() => {
      const s = getComputedStyle(document.getElementById('s'));
      return { pr: parseFloat(s.paddingRight), pl: parseFloat(s.paddingLeft) };
    });
    expect(cs.pl).toBeGreaterThan(cs.pr);
    const px = await arrowPixels(page);
    expect(px.left.d).toBeGreaterThan(150);
    expect(px.right.d).toBeLessThan(20);
  });

  test('arrow colour follows currentColor under data-mode="dark"', async ({ page }) => {
    await load(page, `<label for="s">Fruit</label><select id="s"><option></option></select>`, { mode: 'dark' });
    // Resolve the computed text colour (often oklch) to sRGB bytes
    const [r, g, b] = await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.fillStyle = getComputedStyle(document.getElementById('s')).color;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    });
    const px = await arrowPixels(page);
    // Dark surface, light arrow
    expect(lum(px.bg)).toBeLessThan(100);
    expect(lum(px.right.rgb)).toBeGreaterThan(150);
    // Arrow core pixel matches the text colour (allow antialiasing slack)
    expect(Math.abs(px.right.rgb[0] - r) + Math.abs(px.right.rgb[1] - g) + Math.abs(px.right.rgb[2] - b))
      .toBeLessThan(40);
  });

  test('arrow colour follows an author colour', async ({ page }) => {
    await load(page, `<label for="s">Fruit</label><select id="s"><option></option></select>`,
      { head: '<style>#s { color: rgb(220, 0, 0); }</style>' });
    const px = await arrowPixels(page);
    expect(px.right.rgb[0]).toBeGreaterThan(180);
    expect(px.right.rgb[1]).toBeLessThan(60);
  });

  test('forced colors keeps a visible arrow', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' });
    await load(page, `<label for="s">Fruit</label><select id="s"><option></option></select>`);
    const px = await arrowPixels(page);
    expect(px.right.d).toBeGreaterThan(150);
  });

  test('multiple and size > 1 have no arrow; size="1" keeps it', async ({ page }) => {
    await load(page, `
      <select id="m" multiple><option>A</option><option>B</option></select>
      <select id="z" size="3"><option>A</option><option>B</option></select>
      <select id="one" size="1"><option>A</option></select>`);
    const imgs = await page.evaluate(() => ['m', 'z', 'one'].map((id) => {
      const s = getComputedStyle(document.getElementById(id));
      return { image: s.backgroundImage, pe: s.paddingInlineEnd, ps: s.paddingInlineStart };
    }));
    expect(imgs[0].image).toBe('none');
    expect(imgs[1].image).toBe('none');
    expect(imgs[0].pe).toBe(imgs[0].ps);
    expect(imgs[1].pe).toBe(imgs[1].ps);
    expect(imgs[2].image).toContain('conic-gradient');
  });

  test('--select-chevron stays an override hook', async ({ page }) => {
    const svg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='16' height='16' fill='rgb(0,160,0)'/%3E%3C/svg%3E\")";
    await load(page, SELECT, {
      head: `<style>#s { --select-chevron: ${svg}; --select-chevron-size: 1rem; }</style>`,
    });
    const image = await page.evaluate(() => getComputedStyle(document.getElementById('s')).backgroundImage);
    expect(image).toContain('data:image/svg+xml');
    const px = await arrowPixels(page);
    expect(px.right.rgb[1]).toBeGreaterThan(120);
    expect(px.right.rgb[0]).toBeLessThan(60);
  });

  test('a theme that draws its own select arrow still wins (win9x)', async ({ page }) => {
    await load(page, `<section data-theme="win9x">${SELECT}</section>`,
      { head: '<link rel="stylesheet" href="/src/tokens/themes/_extreme-win9x.css">' });
    const cs = await page.evaluate(() => {
      const s = getComputedStyle(document.getElementById('s'));
      return { image: s.backgroundImage, pos: s.backgroundPositionX };
    });
    expect(cs.image).toContain('data:image/svg+xml');
    expect(cs.image).toContain("c0c0c0");
  });
});

test('base-select: background chevron is replaced by ::picker-icon', async ({ page }) => {
  await load(page, SELECT, { baseSelect: true });
  const r = await page.evaluate(() => {
    const s = document.getElementById('s');
    return {
      supported: CSS.supports('appearance', 'base-select'),
      image: getComputedStyle(s).backgroundImage,
    };
  });
  test.skip(!r.supported, 'browser lacks appearance: base-select');
  expect(r.image).toBe('none');
});
