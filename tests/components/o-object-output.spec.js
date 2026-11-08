/**
 * object + output — O-review fixes.
 *
 * output: the base chip rule used to carry (0,3,1) specificity from its
 * :not() exclusions, so every variant class (.block, .inline, .highlight,
 * .large, .success, .warning, .error) lost display/padding/background to it.
 * It also leaked the mono chip into form-field hints and errors. Covers the
 * variants winning, message outputs staying chip-free, :empty collapse,
 * forced colors, highlight contrast in dark mode, and the demos' labels and
 * scripts.
 *
 * object: block + clamp, data-ratio sizing, fallback content.
 *
 * Tests the working tree: /src and the demos are served from disk.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function routeDisk(page) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/docs/snippets/demos/**', (route) => {
    const rel = decodeURIComponent(new URL(route.request().url()).pathname)
      .replace('/docs/snippets/demos/', '');
    return route.fulfill({ path: join(REPO, 'demos', 'snippets', 'demos', rel) });
  });
}

async function load(page, body, { htmlAttrs = '' } = {}) {
  await routeDisk(page);
  const url = `/__o-object-output-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${htmlAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Computed style snapshot for every output on the page, keyed by id. */
function outputStyles(page) {
  return page.evaluate(() => Object.fromEntries([...document.querySelectorAll('output[id]')].map((el) => {
    const s = getComputedStyle(el);
    return [el.id, {
      display: s.display,
      font: s.fontFamily,
      padding: s.paddingInlineStart,
      bg: s.backgroundColor,
      border: s.borderTopWidth,
    }];
  })));
}

const VARIANTS = `
  <p>
    <output id="base">1</output>
    <output id="block" class="block">2</output>
    <output id="inline" class="inline">3</output>
    <output id="highlight" class="highlight">4</output>
    <output id="large" class="large">5</output>
    <output id="success" class="success">6</output>
    <output id="warning" class="warning">7</output>
    <output id="error" class="error">8</output>
    <output id="empty"></output>
  </p>`;

test('output variant classes win over the base chip', async ({ page }) => {
  await load(page, VARIANTS);
  const s = await outputStyles(page);
  expect(s.base.display).toBe('inline-block');
  expect(s.base.font).toMatch(/mono/i);
  expect(s.block.display).toBe('block');
  expect(s.inline.padding).toBe('0px');
  expect(s.inline.bg).toBe('rgba(0, 0, 0, 0)');
  expect(parseFloat(s.large.padding)).toBeGreaterThan(parseFloat(s.base.padding));
  for (const id of ['highlight', 'success', 'warning', 'error']) {
    expect(s[id].bg, id).not.toBe(s.base.bg);
  }
  expect(new Set([s.success.bg, s.warning.bg, s.error.bg]).size).toBe(3);
});

test('an empty output renders no blank chip', async ({ page }) => {
  await load(page, VARIANTS);
  const s = await outputStyles(page);
  expect(s.empty.padding).toBe('0px');
  expect(s.empty.bg).toBe('rgba(0, 0, 0, 0)');
});

test('message outputs (form-field, summary, groups, feedback) are not chips', async ({ page }) => {
  await load(page, `
    <form>
      <output id="summary" class="error-summary"><p>Fix 1 error</p></output>
      <form-field>
        <label for="n">Name</label>
        <input id="n" required aria-describedby="hint err">
        <output id="hint" class="hint" for="n">3-20 characters.</output>
        <output id="err" class="error" for="n">Enter a name.</output>
      </form-field>
      <fieldset data-min-checked="1">
        <legend>Toppings</legend>
        <label><input type="checkbox"> Cheese</label>
        <output id="group">Pick one</output>
      </fieldset>
      <form-field>
        <label for="t">Total</label>
        <output id="calc" for="n">$5</output>
      </form-field>
    </form>
    <section data-state="error"><output id="feedback" data-error>Failed</output></section>`);
  const s = await outputStyles(page);
  for (const id of ['summary', 'hint', 'err', 'group', 'feedback']) {
    expect(s[id].font, id).not.toMatch(/mono/i);
  }
  for (const id of ['hint', 'err', 'group']) {
    expect(s[id].padding, id).toBe('0px');
    expect(s[id].bg, id).toBe('rgba(0, 0, 0, 0)');
  }
  // A calculated result inside form-field is still a chip.
  expect(s.calc.font).toMatch(/mono/i);
  expect(s.calc.display).toBe('inline-block');
});

test('forced colors draw a chip border (tints are dropped)', async ({ browser }) => {
  const ctx = await browser.newContext({ forcedColors: 'active' });
  const page = await ctx.newPage();
  await load(page, VARIANTS);
  const s = await outputStyles(page);
  for (const id of ['base', 'block', 'highlight', 'success', 'warning', 'error']) {
    expect(s[id].border, id).toBe('1px');
  }
  expect(s.inline.border).toBe('0px');
  expect(s.empty.border).toBe('0px');
  await ctx.close();
});

/** WCAG contrast of an element's text against its background over the page. */
function contrast(page, selector) {
  return page.evaluate((sel) => {
    const ctx = /** @type {CanvasRenderingContext2D} */ (
      document.createElement('canvas').getContext('2d', { willReadFrequently: true }));
    const rgb = (/** @type {string} */ col, under = '#000') => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = under; ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = col; ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const lum = (/** @type {number[]} */ c) => {
      const f = (/** @type {number} */ v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
    };
    const el = /** @type {HTMLElement} */ (document.querySelector(sel));
    const s = getComputedStyle(el);
    const page = rgb(getComputedStyle(document.body).backgroundColor, '#fff');
    const bg = rgb(s.backgroundColor, `rgb(${page.join(',')})`);
    const a = lum(bg); const b = lum(rgb(s.color));
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, selector);
}

for (const mode of [
  { name: 'light', scheme: 'light', attrs: '' },
  { name: 'system dark', scheme: 'dark', attrs: '' },
  { name: 'data-mode dark', scheme: 'light', attrs: 'data-mode="dark"' },
]) {
  test(`highlight and state chips meet AA contrast (${mode.name})`, async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: /** @type {'light'|'dark'} */ (mode.scheme) });
    const page = await ctx.newPage();
    await load(page, VARIANTS, { htmlAttrs: mode.attrs });
    for (const id of ['base', 'highlight', 'success', 'warning', 'error']) {
      expect(await contrast(page, `#${id}`), id).toBeGreaterThanOrEqual(4.5);
    }
    await ctx.close();
  });
}

test('output is a labelled polite status region', async ({ page }) => {
  await load(page, `
    <label for="total">Total</label><output id="total">$5</output>
    <label for="vol">Volume</label><input type="range" id="vol">
    <output id="vol-out" for="vol" aria-live="off">50</output>`);
  await expect(page.getByRole('status', { name: 'Total' })).toHaveText('$5');
  await expect(page.getByRole('slider', { name: 'Volume' })).toBeVisible();
  expect(await page.locator('#vol-out').evaluate((o) => String(/** @type {HTMLOutputElement} */ (o).htmlFor))).toBe('vol');
});

test('output-variants demo: labels resolve, slider updates its output', async ({ page }) => {
  await routeDisk(page);
  await page.goto('/docs/snippets/demos/output-variants.html', { waitUntil: 'load' });
  const orphans = await page.evaluate(() => [...document.querySelectorAll('label')]
    .filter((l) => !l.control && !l.htmlFor.length || (l.htmlFor && !document.getElementById(l.htmlFor)))
    .map((l) => l.textContent));
  expect(orphans).toEqual([]);
  await expect(page.getByRole('slider', { name: 'Volume' })).toBeVisible();
  await page.locator('#range-slider').fill('73');
  await expect(page.locator('#volume-val')).toHaveText('73');
  expect(await page.locator('[style]').count()).toBe(0);
  expect(await page.locator('[oninput]').count()).toBe(0);
});

test('output-calculated demo: total recomputes and error chip is visible', async ({ page }) => {
  await routeDisk(page);
  await page.goto('/docs/snippets/demos/output-calculated.html', { waitUntil: 'load' });
  await expect(page.getByRole('status', { name: 'Total' })).toHaveText('$59.98');
  await page.locator('#calc-qty').fill('3');
  await expect(page.locator('#calc-total')).toHaveText('$89.97');
  const err = page.locator('output.block.error');
  await expect(err).toBeVisible();
  expect((await err.boundingBox())?.height ?? 0).toBeGreaterThan(20);
  expect(await page.locator('[style]').count()).toBe(0);
});

test('object is block-level, clamped, and data-ratio scales the height', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await load(page, `
    <object id="fixed" data="/__o-missing.svg" type="image/svg+xml" width="400" height="300"><p>x</p></object>
    <object id="ratio" data="/__o-missing.svg" type="image/svg+xml" width="400" height="300" data-ratio="4:3"><p>x</p></object>
    <object id="page" data="/__o-missing.pdf" type="application/pdf" data-ratio="page" title="Report"><p>x</p></object>`);
  const box = await page.evaluate(() => Object.fromEntries(['fixed', 'ratio', 'page'].map((id) => {
    const el = /** @type {HTMLElement} */ (document.getElementById(id));
    const r = el.getBoundingClientRect();
    return [id, { w: r.width, h: r.height, display: getComputedStyle(el).display, parent: el.parentElement?.getBoundingClientRect().width }];
  })));
  expect(box.fixed.display).toBe('block');
  expect(box.fixed.w).toBeLessThanOrEqual(box.fixed.parent ?? 0);
  expect(box.fixed.h).toBe(300);
  expect(box.ratio.w).toBeLessThan(400);
  expect(box.ratio.h).toBeCloseTo(box.ratio.w * 3 / 4, 0);
  expect(box.page.w).toBeCloseTo(box.page.parent ?? 0, 0);
  expect(box.page.h).toBeCloseTo(box.page.w * 1.414, 0);
});

test('object-embed demo: unsupported type shows its fallback link', async ({ page }) => {
  await routeDisk(page);
  await page.goto('/docs/snippets/demos/object-embed.html', { waitUntil: 'load' });
  const fallback = page.locator('object[type="application/x-vb-unsupported"] a');
  await expect(fallback).toBeVisible();
  // role="img" objects keep a text-only fallback (presentational children).
  expect(await page.locator('object[role="img"] a').count()).toBe(0);
});
