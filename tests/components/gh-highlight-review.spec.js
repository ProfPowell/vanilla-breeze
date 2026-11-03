/**
 * highlight-wc + highlights engine — review fixes (vanilla-breeze-wja7).
 *
 * Covers: one highlighter button inside selection-menu across reparent and
 * moves; a destroyed controller is never reused (re-init after a move
 * paints); every selection-menu target gets its own controller; AA
 * contrast of highlighted text in light and dark; palette disclosure
 * (aria-expanded, Escape, outside click, menu dismiss); forced-colors
 * swatches and ::highlight; import validation; margin annotations on the
 * inline-end side in RTL.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', mode = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__gh-highlight-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"${mode ? ` data-mode="${mode}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import '/src/web-components/selection-menu/logic.js';
        import '/src/web-components/highlight-wc/logic.js';
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('highlight-wc') && customElements.get('selection-menu'));
  await page.waitForSelector('highlight-wc[data-upgraded]', { state: 'attached' });
}

const MENU = `
  <article id="a1" data-selection-menu="m"><p id="p1">Alpha bravo charlie delta echo foxtrot.</p></article>
  <article id="a2" data-selection-menu="m"><p id="p2">Golf hotel india juliet kilo lima.</p></article>
  <selection-menu id="m"><highlight-wc storage-key="gh-test-${Date.now()}"></highlight-wc></selection-menu>
  <p id="outside">Outside</p>`;

/** Select [start,end) of #id's text and let selection-menu show its toolbar. */
async function selectText(page, id, start, end) {
  await page.evaluate(([id, start, end]) => {
    const node = document.getElementById(id).firstChild;
    const r = document.createRange();
    r.setStart(node, start);
    r.setEnd(node, end);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  }, [id, start, end]);
  await expect(page.locator('pop-over[data-selection-menu-host]')).toBeVisible();
}

async function highlightVia(page, color) {
  await page.locator('highlight-wc > button').click();
  await page.locator(`.highlight-color-swatch[data-color="${color}"]`).click();
}

test('one highlighter button after load in selection-menu and after moves', async ({ page }) => {
  await load(page, MENU);
  const counts = await page.evaluate(() => {
    const hw = document.querySelector('highlight-wc');
    const count = () => ({
      buttons: hw.querySelectorAll(':scope > button').length,
      palettes: hw.querySelectorAll('.highlight-color-dropdown').length,
    });
    const atLoad = count();
    const host = hw.parentElement;
    for (let i = 0; i < 3; i++) { hw.remove(); host.append(hw); }
    return { atLoad, afterMoves: count() };
  });
  expect(counts.atLoad).toEqual({ buttons: 1, palettes: 1 });
  expect(counts.afterMoves).toEqual({ buttons: 1, palettes: 1 });
});

test('standalone re-init after a move builds a live controller that paints', async ({ page }) => {
  await load(page, `<section id="host"><highlight-wc id="hw" storage-key="gh-move-${Date.now()}">
    <article><p id="t">The quick brown fox jumps over the lazy dog.</p></article></highlight-wc></section>`);
  const r = await page.evaluate(async () => {
    const hw = /** @type {any} */ (document.getElementById('hw'));
    hw.importHighlights({ version: 1, highlights: [{ id: 'hn-1', startOffset: 4, endOffset: 9, text: 'quick', color: 'yellow' }] });
    hw.remove();
    document.getElementById('host').append(hw);
    // Wait out the async storage load of the fresh controller.
    for (let i = 0; i < 50 && !CSS.highlights.has('hn-yellow'); i++) await new Promise(r => setTimeout(r, 20));
    await new Promise(r => setTimeout(r, 100));
    const p = document.getElementById('t');
    return {
      registered: CSS.highlights.has('hn-yellow') ? CSS.highlights.get('hn-yellow').size : 0,
      count: hw.getHighlights().length,
      bg: getComputedStyle(p, '::highlight(hn-yellow)').backgroundColor,
      init: hw.querySelector('article').hasAttribute('data-highlights-init'),
    };
  });
  expect(r.registered).toBe(1);
  expect(r.count).toBe(1);
  expect(r.init).toBe(true);
  expect(r.bg).not.toMatch(/^(rgba\(0, 0, 0, 0\)|transparent)$/);
});

test('selection-menu highlights every target with its own controller', async ({ page }) => {
  await load(page, MENU);
  await selectText(page, 'p2', 0, 4); // "Golf"
  await highlightVia(page, 'yellow');
  await selectText(page, 'p1', 6, 11); // "bravo"
  await highlightVia(page, 'pink');
  const r = await page.evaluate(() => ({
    a1: /** @type {any} */ (document.getElementById('a1')).hasAttribute('data-highlights-init'),
    yellow: CSS.highlights.get('hn-yellow')?.size ?? 0,
    pink: CSS.highlights.get('hn-pink')?.size ?? 0,
    yellowText: [...(CSS.highlights.get('hn-yellow') ?? [])].map(r => r.toString()),
    pinkText: [...(CSS.highlights.get('hn-pink') ?? [])].map(r => r.toString()),
  }));
  expect(r.a1).toBe(true);
  expect(r.yellowText).toEqual(['Golf']);
  expect(r.pinkText).toEqual(['bravo']);
});

/** Contrast ratio of a computed colour pair (element or ::highlight), via canvas sRGB. */
async function contrast(page, id, pseudo = null) {
  return page.evaluate(([id, pseudo]) => {
    const cs = getComputedStyle(document.getElementById(id), pseudo);
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const rgb = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
    const lum = ([r, g, b]) => {
      const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const fg = lum(rgb(cs.color)), bg = lum(rgb(cs.backgroundColor));
    return { ratio: (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05), bgLum: bg, fg: cs.color, bg: cs.backgroundColor };
  }, [id, pseudo]);
}

for (const mode of ['light', 'dark']) {
  test(`highlighted text meets AA contrast in ${mode} mode`, async ({ page }) => {
    await load(page, `<highlight-wc><article><p id="t">Contrast sample text.</p></article></highlight-wc>
      <p><mark data-hn-id="x" id="m">mark fallback</mark></p>`, { mode });
    for (const color of ['yellow', 'green', 'blue', 'pink']) {
      const r = await contrast(page, 't', `::highlight(hn-${color})`);
      expect(r.ratio, `${color} ${r.fg} on ${r.bg}`).toBeGreaterThanOrEqual(4.5);
      // The wash follows the scheme: pale in light, deep in dark.
      if (mode === 'dark') expect(r.bgLum).toBeLessThan(0.3);
      else expect(r.bgLum).toBeGreaterThan(0.5);
    }
    const mark = await contrast(page, 'm');
    expect(mark.ratio, `mark ${mark.fg} on ${mark.bg}`).toBeGreaterThanOrEqual(4.5);
  });
}

test('palette toggle: aria-expanded, Escape, outside click and menu dismiss close it', async ({ page }) => {
  await load(page, MENU);
  await selectText(page, 'p1', 0, 5);
  const btn = page.locator('highlight-wc > button');
  const palette = page.locator('.highlight-color-dropdown');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(btn).toHaveAttribute('aria-label', 'Highlight selection');
  expect(await btn.getAttribute('aria-controls')).toBe(await palette.getAttribute('id'));

  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(palette).toBeVisible();
  await expect(page.locator('.highlight-color-swatch[aria-pressed="true"]')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(palette).toBeHidden();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(btn).toBeFocused();
  // Escape closed only the palette; the toolbar stays.
  await expect(page.locator('pop-over[data-selection-menu-host]')).toBeVisible();

  await btn.click();
  await expect(palette).toBeVisible();
  await page.evaluate(() => /** @type {any} */ (document.querySelector('selection-menu')).dismiss());
  await expect(palette).toBeHidden();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');

  await selectText(page, 'p1', 0, 5);
  await btn.click();
  await expect(palette).toBeVisible();
  await page.evaluate(() => document.getElementById('outside').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await expect(palette).toBeHidden();
});

test('labels come from data-label-* attributes', async ({ page }) => {
  await load(page, `<article id="a"><p id="t">Etiquetas de prueba aqui.</p></article>
    <selection-menu for="a"><highlight-wc data-label-button="Resaltar" data-label-palette="Color" data-label-annotation="Resaltaste"></highlight-wc></selection-menu>`);
  await expect(page.locator('highlight-wc > button')).toHaveAttribute('aria-label', 'Resaltar');
  await expect(page.locator('.highlight-color-dropdown')).toHaveAttribute('aria-label', 'Color');
  await expect(page.locator('#a')).toHaveAttribute('data-highlights-label-annotation', 'Resaltaste');
});

test('readonly in selection-menu renders no highlighter and a readonly target', async ({ page }) => {
  await load(page, `<article id="a"><p>Read only text.</p></article>
    <selection-menu for="a"><highlight-wc readonly></highlight-wc></selection-menu>`);
  const r = await page.evaluate(() => ({
    buttons: document.querySelectorAll('highlight-wc button').length,
    readonly: document.getElementById('a').hasAttribute('data-highlights-readonly'),
    init: document.getElementById('a').hasAttribute('data-highlights-init'),
  }));
  expect(r).toEqual({ buttons: 0, readonly: true, init: true });
});

test('forced colors: swatches keep distinct fills; ::highlight uses Mark with distinct underlines', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, `<article id="a"><p id="t">Forced colours sample.</p></article>
    <selection-menu for="a"><highlight-wc></highlight-wc></selection-menu>`);
  const r = await page.evaluate(() => {
    const swatches = [...document.querySelectorAll('.highlight-color-swatch')];
    const p = document.getElementById('t');
    return {
      fills: swatches.map(s => getComputedStyle(s).backgroundColor),
      adjust: swatches.map(s => getComputedStyle(s).forcedColorAdjust),
      titles: swatches.map(s => s.getAttribute('title')),
      styles: ['yellow', 'green', 'blue', 'pink'].map(c => getComputedStyle(p, `::highlight(hn-${c})`).textDecorationStyle),
      lines: ['yellow', 'green'].map(c => getComputedStyle(p, `::highlight(hn-${c})`).textDecorationLine),
    };
  });
  expect(new Set(r.fills).size).toBe(4);
  expect(r.adjust).toEqual(['none', 'none', 'none', 'none']);
  expect(r.titles).toEqual(['yellow', 'green', 'blue', 'pink']);
  expect(new Set(r.styles).size).toBe(4);
  expect(r.lines).toEqual(['underline', 'underline']);
});

test('importHighlights drops malformed records', async ({ page }) => {
  await load(page, `<highlight-wc id="hw" storage-key="gh-import-${Date.now()}"><article><p>0123456789</p></article></highlight-wc>`);
  const r = await page.evaluate(() => {
    const hw = /** @type {any} */ (document.getElementById('hw'));
    const result = hw.importHighlights({ version: 1, highlights: [
      { id: 'ok', startOffset: 0, endOffset: 3, text: '012', color: 'yellow' },
      { id: 'range', startOffset: 5, endOffset: 99, color: 'yellow' },
      { id: 'neg', startOffset: -1, endOffset: 2, color: 'yellow' },
      { id: 'order', startOffset: 4, endOffset: 4, color: 'yellow' },
      { id: 'float', startOffset: 1.5, endOffset: 3, color: 'yellow' },
      { id: 'colour', startOffset: 1, endOffset: 3, color: 'red;}body{display:none' },
      { id: 'palette', startOffset: 1, endOffset: 3, color: 'purple' },
      { id: 'note', startOffset: 1, endOffset: 3, color: 'blue', note: { evil: true } },
      { id: 'ok', startOffset: 2, endOffset: 4, color: 'blue' },
      null, 'string',
      { startOffset: 6, endOffset: 8, color: 'green' },
    ] });
    return { result, list: hw.getHighlights().map(h => [h.startOffset, h.endOffset, h.color, typeof h.id]) };
  });
  expect(r.result).toEqual({ imported: 2, rejected: 10 });
  expect(r.list).toEqual([[0, 3, 'yellow', 'string'], [6, 8, 'green', 'string']]);
});

for (const dir of ['ltr', 'rtl']) {
  test(`margin annotation sits on the inline-end side (${dir})`, async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    await load(page, `<highlight-wc id="hw" storage-key="gh-rtl-${dir}-${Date.now()}"><article id="art"><p>Margin annotation sample paragraph.</p></article></highlight-wc>`, { dir });
    const r = await page.evaluate(() => {
      const hw = /** @type {any} */ (document.getElementById('hw'));
      const art = document.getElementById('art');
      art.style.maxInlineSize = '30rem';
      art.style.marginInline = 'auto';
      hw.importHighlights({ version: 1, highlights: [{ id: 'hn-a', startOffset: 0, endOffset: 6, color: 'yellow' }] });
      const a = art.querySelector('.hn-margin-annotation').getBoundingClientRect();
      const box = art.getBoundingClientRect();
      return { aLeft: a.left, aRight: a.right, boxLeft: box.left, boxRight: box.right };
    });
    if (dir === 'ltr') expect(r.aLeft).toBeGreaterThanOrEqual(r.boxRight);
    else expect(r.aRight).toBeLessThanOrEqual(r.boxLeft);
  });
}
