/**
 * qr-code — behaviour + Q/R-review fixes.
 *
 * Every rendered code is read back off the canvas and decoded with jsQR in
 * the page, so "renders" means "scans". Covers: black-on-white default with
 * an opaque quiet zone (also in dark mode and forced colours), device-pixel
 * scaling, L/M/Q/H + 0-3 parsing, capacity overflow (event, no garbage
 * code, fallback kept), value set/cleared after upgrade, the author's
 * children kept as the caption, short canvas name + overrides, copy(),
 * colour warnings, and reconnect.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { head = '', htmlAttrs = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__jsqr.js', (route) => route.fulfill({
    path: join(REPO, 'node_modules/jsqr/dist/jsQR.js'),
    contentType: 'text/javascript',
  }));
  const url = `/__qr-code-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${htmlAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script src="/__jsqr.js"></script>
      ${head}
      <script type="module">import '/src/web-components/qr-code/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('qr-code'));
}

/** Decode the canvas of the matching qr-code in the page; null if unreadable. */
function decode(page, selector = 'qr-code') {
  return page.evaluate((sel) => {
    const c = document.querySelector(sel)?.querySelector('canvas');
    if (!c || !c.width) return null;
    const img = c.getContext('2d').getImageData(0, 0, c.width, c.height);
    return /** @type {any} */ (window).jsQR(img.data, c.width, c.height, { inversionAttempts: 'dontInvert' })?.data ?? null;
  }, selector);
}

/** RGBA of a canvas pixel. */
function pixel(page, x, y, selector = 'qr-code') {
  return page.evaluate(([sel, px, py]) => {
    const c = document.querySelector(sel).querySelector('canvas');
    return [...c.getContext('2d').getImageData(px, py, 1, 1).data];
  }, [selector, x, y]);
}

const URL_66 = 'https://vanilla-breeze.com/docs/elements/web-components/qr-code/?ref=x';

test('default: decodes, black on opaque white, 4-module quiet zone', async ({ page }) => {
  await load(page, `<qr-code value="${URL_66}">fallback</qr-code>`);
  await page.waitForSelector('qr-code[data-upgraded]');
  expect(await decode(page)).toBe(URL_66);
  const geo = await page.evaluate(() => {
    const c = document.querySelector('qr-code canvas');
    return { w: c.width, h: c.height, css: c.getBoundingClientRect().width };
  });
  expect(geo).toEqual({ w: 200, h: 200, css: 200 });
  expect(await pixel(page, 0, 0)).toEqual([255, 255, 255, 255]);
  // The first dark module (finder top-left) starts after >= 4 light modules:
  // a 66-byte URL at M is version 5 (37 modules) -> 45 with quiet zone, cell 4.
  const firstDark = await page.evaluate(() => {
    const c = document.querySelector('qr-code canvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const y = Math.floor(c.height / 2);
    for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4] < 128) return x;
    return -1;
  });
  expect(firstDark).toBeGreaterThanOrEqual(4 * 4);
});

test('long multi-block inputs at every level decode', async ({ page }) => {
  const long = 'https://example.com/?' + 'q=Grüße東京&'.repeat(30);
  const levels = ['L', 'M', 'Q', 'H', '0', '3'];
  await load(page, levels.map((l) => `<qr-code id="e${l}" size="400" error-correction="${l}" value="${long}">x</qr-code>`).join(''));
  await page.waitForSelector('qr-code[data-upgraded]');
  for (const l of levels) expect(await decode(page, `#e${l}`), `level ${l}`).toBe(long);
});

test('dark mode and forced colours keep black on white', async ({ page }) => {
  await load(page, `<qr-code value="https://example.com">x</qr-code>`, { htmlAttrs: 'data-mode="dark"' });
  await page.waitForSelector('qr-code[data-upgraded]');
  expect(await pixel(page, 0, 0)).toEqual([255, 255, 255, 255]);
  expect(await decode(page)).toBe('https://example.com');

  await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' });
  await page.evaluate(() => document.querySelector('qr-code').setAttribute('value', 'https://example.org'));
  expect(await decode(page)).toBe('https://example.org');
  const css = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('qr-code canvas'));
    return { adjust: s.forcedColorAdjust, border: s.borderInlineStartWidth };
  });
  expect(css).toEqual({ adjust: 'none', border: '1px' });
});

test('device pixel ratio 2 draws at 2x with whole-pixel modules', async ({ browser }) => {
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await load(page, `<qr-code size="150" value="dpr">x</qr-code>`);
  await page.waitForSelector('qr-code[data-upgraded]');
  const geo = await page.evaluate(() => {
    const c = document.querySelector('qr-code canvas');
    return { w: c.width, css: c.getBoundingClientRect().width };
  });
  expect(geo).toEqual({ w: 300, css: 150 });
  expect(await decode(page)).toBe('dpr');
  await ctx.close();
});

test('error-correction letters and digits are the same level; bad values warn and use M', async ({ page }) => {
  const warnings = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  await load(page, `
    <qr-code id="h" error-correction="h" value="same">x</qr-code>
    <qr-code id="three" error-correction="3" value="same">x</qr-code>
    <qr-code id="m" value="same">x</qr-code>
    <qr-code id="bad" error-correction="9" value="same">x</qr-code>
    <qr-code id="zero" error-correction="0" value="same">x</qr-code>`);
  await page.waitForSelector('#bad[data-upgraded]');
  const urls = await page.evaluate(() => Object.fromEntries(
    [...document.querySelectorAll('qr-code')].map((q) => [q.id, /** @type {any} */ (q).toDataURL()])));
  expect(urls.h).toBe(urls.three);
  expect(urls.bad).toBe(urls.m);
  expect(urls.zero).not.toBe(urls.m);
  expect(urls.h).not.toBe(urls.m);
  expect(warnings.some((w) => /error-correction="9"/.test(w))).toBe(true);
});

test('overflow: qr-code:error capacity, no code, fallback shown', async ({ page }) => {
  await load(page, `<qr-code error-correction="H"><a href="https://example.com/long">Long link</a></qr-code>`);
  await page.waitForSelector('qr-code[data-upgraded]');
  const r = await page.evaluate(() => {
    const qr = /** @type {any} */ (document.querySelector('qr-code'));
    let detail = null;
    qr.addEventListener('qr-code:error', (e) => { detail = e.detail; });
    qr.value = 'x'.repeat(1274);
    const caption = qr.querySelector('[data-qr-caption]');
    return {
      detail: detail && { reason: detail.reason, ecl: detail.errorCorrection },
      error: qr.getAttribute('data-error'),
      hidden: qr.querySelector('canvas').hidden,
      dataUrl: qr.toDataURL(),
      captionWidth: caption.getBoundingClientRect().width,
      link: caption.querySelector('a')?.href,
    };
  });
  expect(r.detail).toEqual({ reason: 'capacity', ecl: 'H' });
  expect(r.error).toBe('capacity');
  expect(r.hidden).toBe(true);
  expect(r.dataUrl).toBe('');
  expect(r.captionWidth).toBeGreaterThan(10);
  expect(r.link).toBe('https://example.com/long');

  // Back under capacity: the code returns and the error clears.
  await page.evaluate(() => { /** @type {any} */ (document.querySelector('qr-code')).value = 'x'.repeat(1273); });
  expect(await page.evaluate(() => document.querySelector('qr-code').hasAttribute('data-error'))).toBe(false);
  expect(await decode(page)).toBe('x'.repeat(1273));
});

test('value set after upgrade renders; clearing falls back to the text, then to nothing', async ({ page }) => {
  await load(page, `<qr-code id="empty"></qr-code><qr-code id="text">from text</qr-code>`);
  await page.waitForSelector('#empty[data-upgraded]', { state: 'attached' });
  expect(await page.evaluate(() => document.querySelector('#empty canvas').hidden)).toBe(true);

  await page.evaluate(() => document.getElementById('empty').setAttribute('value', 'late'));
  expect(await decode(page, '#empty')).toBe('late');
  expect(await page.evaluate(() => document.querySelector('#empty [data-qr-caption]').textContent)).toBe('late');

  await page.evaluate(() => document.getElementById('empty').removeAttribute('value'));
  expect(await page.evaluate(() => document.querySelector('#empty canvas').hidden)).toBe(true);

  await page.evaluate(() => { /** @type {any} */ (document.getElementById('text')).value = 'override'; });
  expect(await decode(page, '#text')).toBe('override');
  await page.evaluate(() => { /** @type {any} */ (document.getElementById('text')).value = ''; });
  expect(await decode(page, '#text')).toBe('from text');
});

test('author children stay as the caption; canvas has a short name, value read once', async ({ page }) => {
  await load(page, `
    <qr-code id="a" value="https://example.com"><a href="https://example.com">example.com</a></qr-code>
    <qr-code id="v" value="hi" data-caption="visible" data-label-prefix="Código QR">hi</qr-code>`);
  await page.waitForSelector('#v[data-upgraded]');
  const r = await page.evaluate(() => {
    const a = document.getElementById('a');
    const v = document.getElementById('v');
    return {
      label: a.querySelector('canvas').getAttribute('aria-label'),
      role: a.querySelector('canvas').getAttribute('role'),
      hostRole: a.getAttribute('role'),
      link: a.querySelector('[data-qr-caption] > a')?.getAttribute('href'),
      hiddenWidth: a.querySelector('[data-qr-caption]').getBoundingClientRect().width,
      vLabel: v.querySelector('canvas').getAttribute('aria-label'),
      vWidth: v.querySelector('[data-qr-caption]').getBoundingClientRect().width,
    };
  });
  expect(r).toMatchObject({ label: 'QR code', role: 'img', hostRole: null, link: 'https://example.com', vLabel: 'Código QR' });
  expect(r.hiddenWidth).toBeLessThanOrEqual(1);
  expect(r.vWidth).toBeGreaterThan(1);

  // The hidden link becomes visible while focused.
  await page.focus('#a a');
  expect(await page.evaluate(() => document.querySelector('#a [data-qr-caption]').getBoundingClientRect().width)).toBeGreaterThan(1);

  const snap = await page.locator('#a').ariaSnapshot();
  expect(snap.match(/example\.com/g)?.length).toBe(2); // link name + its url, not a third copy in the img name
  expect(snap).toContain('img "QR code"');
});

test('reconnect keeps one canvas, one caption and the link', async ({ page }) => {
  await load(page, `<section id="s"><qr-code value="https://example.com"><a href="https://example.com">example.com</a></qr-code></section>`);
  await page.waitForSelector('qr-code[data-upgraded]');
  const r = await page.evaluate(() => {
    const qr = document.querySelector('qr-code');
    const s = document.getElementById('s');
    for (let i = 0; i < 3; i++) { qr.remove(); s.append(qr); }
    return {
      canvases: qr.querySelectorAll('canvas').length,
      captions: qr.querySelectorAll('[data-qr-caption]').length,
      links: qr.querySelectorAll('a').length,
      upgraded: qr.hasAttribute('data-upgraded'),
    };
  });
  expect(r).toEqual({ canvases: 1, captions: 1, links: 1, upgraded: true });
  expect(await decode(page)).toBe('https://example.com');
});

test('custom colours: decodes, warns only for risky pairs', async ({ page }) => {
  const warnings = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  await load(page, `
    <qr-code id="ok" value="brand" color="#0066cc" background="#f0f8ff">x</qr-code>
    <qr-code id="inv" value="inv" color="white" background="black">x</qr-code>
    <qr-code id="low" value="low" color="#888" background="#aaa">x</qr-code>
    <qr-code id="def" value="def">x</qr-code>`);
  await page.waitForSelector('#def[data-upgraded]');
  expect(await decode(page, '#ok')).toBe('brand');
  expect(await pixel(page, 0, 0, '#ok')).toEqual([240, 248, 255, 255]);
  expect(warnings.filter((w) => w.startsWith('<qr-code>: color=')).length).toBe(2);
  expect(warnings.some((w) => /lighter than the background/.test(w))).toBe(true);
  expect(warnings.some((w) => /contrast is/.test(w))).toBe(true);
});

test('copy() writes text + PNG and announces data-label-copied', async ({ page }) => {
  await load(page, `<qr-code value="copy me" data-label-copied="Código copiado">x</qr-code>`);
  await page.waitForSelector('qr-code[data-upgraded]');
  const r = await page.evaluate(async () => {
    const written = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { write: async (items) => { written.push(...items.flatMap((i) => i.types)); }, writeText: async () => {} },
    });
    const ok = await /** @type {any} */ (document.querySelector('qr-code')).copy();
    return { ok, written };
  });
  expect(r.ok).toBe(true);
  expect(r.written.sort()).toEqual(['image/png', 'text/plain']);
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Código copiado'))).toBe(true);
});

test('toDataURL returns an opaque PNG', async ({ page }) => {
  await load(page, `<qr-code value="png">x</qr-code>`);
  await page.waitForSelector('qr-code[data-upgraded]');
  const url = await page.evaluate(() => /** @type {any} */ (document.querySelector('qr-code')).toDataURL());
  expect(url).toMatch(/^data:image\/png;base64,/);
});
