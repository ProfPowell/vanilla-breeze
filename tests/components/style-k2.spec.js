/**
 * Style review fixes (K2): badge shapes moved onto <layout-badge data-shape>,
 * time[data-badge] freed from the shape rules, and one shared row stripe for
 * table[data-striped] and dl[data-striped] (vanilla-breeze-aqmv).
 *
 * Measures painted results (geometry, computed colours of the shape layer),
 * not custom-property values. Tests the working tree: /src is served from
 * disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const SHAPES = ['ribbon', 'notch', 'flag', 'double-arrow', 'stamp'];

async function load(page, body, { dir = 'ltr', html = 'data-mode="light"', head = '' } = {}) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__style-k2-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}" ${html}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}</head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** sRGB luminance of a computed colour, composited over a ground colour. */
const lumOf = (page, colour, ground = 'white') => page.evaluate(([c, g]) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
  const [r, gg, b] = ctx.getImageData(0, 0, 1, 1).data;
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
}, [colour, ground]);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Geometry of a badge: its box, the label's text box, the notch length. */
const geometry = (page, sel) => page.locator(sel).evaluate((el) => {
  const box = el.getBoundingClientRect();
  const range = document.createRange(); range.selectNodeContents(el);
  const text = range.getBoundingClientRect();
  const fs = parseFloat(getComputedStyle(el).fontSize);
  return { left: box.left, right: box.right, textLeft: text.left, textRight: text.right, notch: 0.75 * fs };
});

test.describe('layout-badge data-shape', () => {
  for (const dir of ['ltr', 'rtl']) {
    test(`long labels stay clear of the notch and point (${dir})`, async ({ page }) => {
      const label = dir === 'rtl' ? 'תווית ארוכה במיוחד עבור הסרט הזה כאן' : 'A considerably longer ribbon label text here';
      await load(page, SHAPES.map((s) => `<p><layout-badge id="${s}" data-shape="${s}" data-color="brand">${label}</layout-badge></p>`).join(''), { dir });
      for (const s of SHAPES) {
        const g = await geometry(page, `#${s}`);
        // Inline-end notch/point (ribbon, flag, double-arrow): text ends before it.
        if (['ribbon', 'flag', 'double-arrow'].includes(s)) {
          if (dir === 'ltr') expect(g.textRight, `${s} end`).toBeLessThanOrEqual(g.right - g.notch);
          else expect(g.textLeft, `${s} end`).toBeGreaterThanOrEqual(g.left + g.notch);
        }
        // Inline-start notch/point (notch, double-arrow): text starts after it.
        if (['notch', 'double-arrow'].includes(s)) {
          if (dir === 'ltr') expect(g.textLeft, `${s} start`).toBeGreaterThanOrEqual(g.left + g.notch);
          else expect(g.textRight, `${s} start`).toBeLessThanOrEqual(g.right - g.notch);
        }
      }
    });
  }

  test('the shape is painted on ::before, never clips the badge, and mirrors in RTL', async ({ page }) => {
    await load(page, `
      <p><a href="#x"><layout-badge id="ltr" data-shape="ribbon" data-color="brand">Sale</layout-badge></a></p>
      <p dir="rtl"><layout-badge id="rtl" data-shape="ribbon" data-color="brand">מבצע</layout-badge></p>`);
    const r = await page.evaluate(() => {
      const ltr = document.getElementById('ltr');
      const rtl = document.getElementById('rtl');
      const before = (el) => getComputedStyle(el, '::before');
      return {
        hostClip: getComputedStyle(ltr).clipPath,
        hostBg: getComputedStyle(ltr).backgroundColor,
        beforeClip: before(ltr).clipPath,
        beforeBg: before(ltr).backgroundColor,
        ltrScale: before(ltr).scale,
        rtlScale: before(rtl).scale,
      };
    });
    expect(r.hostClip).toBe('none');
    expect(r.hostBg).toBe('rgba(0, 0, 0, 0)');
    expect(r.beforeClip).toContain('polygon');
    expect(r.beforeBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(r.ltrScale).toBe('none');
    expect(r.rtlScale).toBe('-1 1');

    // Focus ring on the wrapping link survives (nothing clips it).
    await page.locator('a').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const outline = await page.locator('a').evaluate((a) => getComputedStyle(a).outlineStyle);
    expect(outline).not.toBe('none');
  });

  for (const mode of ['light', 'dark']) {
    test(`shape badge text meets AA on its painted fill (${mode})`, async ({ page }) => {
      const colours = ['brand', 'secondary', 'accent', 'primary', 'success', 'warning', 'error', 'info'];
      await load(page, colours.map((c) => SHAPES.map((s) => `<layout-badge data-shape="${s}" data-color="${c}">${c}</layout-badge>`).join(' ')).join('<br>'), { html: `data-mode="${mode}"` });
      const pairs = await page.locator('layout-badge').evaluateAll((els) => els.map((el) => ({
        id: `${el.dataset.shape}/${el.dataset.color}`,
        fg: getComputedStyle(el).color,
        bg: getComputedStyle(el, '::before').backgroundColor,
      })));
      const ground = mode === 'dark' ? 'black' : 'white';
      const fails = [];
      for (const p of pairs) {
        const c = ratio(await lumOf(page, p.fg, ground), await lumOf(page, p.bg, ground));
        if (c < 4.5) fails.push(`${p.id} ${c.toFixed(2)}`);
      }
      expect(fails).toEqual([]);
    });
  }

  for (const [theme, mode] of [['kawaii', 'light'], ['kawaii', 'dark'], ['cyber', 'light'], ['cyber', 'dark']]) {
    test(`${theme} (${mode}) restyles shaped badges only, with readable text and a shape-following shadow`, async ({ page }) => {
      await load(page, `
        <p><layout-badge id="b" data-shape="flag" data-color="brand">Theme</layout-badge>
        <time id="t" data-badge datetime="2026-03-01">March 1, 2026</time>
        <layout-badge id="plain" data-color="brand">Plain</layout-badge></p>`, {
        html: `data-mode="${mode}" data-theme="${theme}"`,
        head: `<link rel="stylesheet" href="/src/tokens/themes/_extreme-${theme}.css">`,
      });
      const r = await page.evaluate(() => {
        const b = document.getElementById('b');
        const t = document.getElementById('t');
        const plain = document.getElementById('plain');
        return {
          filter: getComputedStyle(b).filter,
          boxShadow: getComputedStyle(b).boxShadow,
          fg: getComputedStyle(b).color,
          fill: getComputedStyle(b, '::before').backgroundImage !== 'none'
            ? getComputedStyle(b, '::before').backgroundImage
            : getComputedStyle(b, '::before').backgroundColor,
          timeBgImage: getComputedStyle(t).backgroundImage,
          timeTransform: getComputedStyle(t).textTransform,
          timeShadow: getComputedStyle(t).boxShadow,
          plainFilter: getComputedStyle(plain).filter,
        };
      });
      expect(r.filter).toContain('drop-shadow');
      expect(r.boxShadow).toBe('none');
      expect(r.plainFilter).toBe('none');
      expect(r.timeBgImage).toBe('none');
      expect(r.timeTransform).toBe('none');
      expect(r.timeShadow).toBe('none');
      // Text against every colour stop of the fill.
      const stops = [...r.fill.matchAll(/(oklch|rgba?|color)\([^()]*(\([^()]*\)[^()]*)*\)/g)].map((m) => m[0]);
      expect(stops.length).toBeGreaterThan(0);
      for (const stop of stops) {
        const ground = mode === 'dark' ? 'black' : 'white';
        const c = ratio(await lumOf(page, r.fg, ground), await lumOf(page, stop, ground));
        expect(c, `${theme} ${stop}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  test('forced colours drop the shape layer and keep a CanvasText edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, '<layout-badge id="b" data-shape="ribbon" data-color="brand">Sale</layout-badge>');
    await page.emulateMedia({ forcedColors: 'active' });
    const r = await page.locator('#b').evaluate((el) => ({
      before: getComputedStyle(el, '::before').display,
      border: getComputedStyle(el).borderTopWidth,
    }));
    expect(r.before).toBe('none');
    expect(r.border).toBe('1px');
  });

  test('print keeps the shape fill', async ({ page }) => {
    await load(page, '<layout-badge id="b" data-shape="stamp" data-color="brand">Paid</layout-badge>');
    await page.emulateMedia({ media: 'print' });
    const adjust = await page.locator('#b').evaluate((el) => getComputedStyle(el, '::before').printColorAdjust);
    expect(adjust).toBe('exact');
  });
});

test.describe('data-badge is the time chip only', () => {
  test('time[data-badge] keeps the bordered chip; the old shape attribute does nothing', async ({ page }) => {
    await load(page, `
      <p><time id="t" data-badge datetime="2026-03-01">March 1, 2026</time>
      <span id="old" data-badge="ribbon">Old</span></p>`);
    const r = await page.evaluate(() => {
      const t = getComputedStyle(document.getElementById('t'));
      const surface = getComputedStyle(document.body).getPropertyValue('--color-surface-raised');
      const probe = document.createElement('i'); probe.style.color = surface; document.body.append(probe);
      const surfaceColour = getComputedStyle(probe).color; probe.remove();
      const old = getComputedStyle(document.getElementById('old'));
      return {
        bg: t.backgroundColor, surfaceColour, border: t.borderTopWidth, weight: t.fontWeight,
        whiteSpace: t.whiteSpace, clip: t.clipPath,
        oldDisplay: old.display, oldBg: old.backgroundColor, oldClip: old.clipPath,
      };
    });
    expect(r.bg).toBe(r.surfaceColour);
    expect(r.border).toBe('1px');
    expect(r.weight).toBe('400');
    expect(r.whiteSpace).toBe('normal');
    expect(r.clip).toBe('none');
    expect(r.oldDisplay).toBe('inline');
    expect(r.oldBg).toBe('rgba(0, 0, 0, 0)');
    expect(r.oldClip).toBe('none');
  });
});

test.describe('data-striped (table + dl) on --color-row-stripe', () => {
  const TABLE = (attrs) => `<table ${attrs}><caption>T</caption><thead><tr><th scope="col">N</th></tr></thead>
    <tbody><tr><td>1</td></tr><tr><td>2</td></tr><tr><td>3</td></tr></tbody></table>`;

  test('table and dl paint the same stripe; the old classes are gone', async ({ page }) => {
    await load(page, `
      <section id="tbl">${TABLE('data-striped')}</section>
      <section id="old">${TABLE('class="striped bordered"')}</section>
      <dl data-striped><dt>A</dt><dd>a</dd><dt>B</dt><dd>b</dd></dl>`);
    const r = await page.evaluate(() => ({
      row: getComputedStyle(document.querySelector('#tbl tbody tr')).backgroundColor,
      row2: getComputedStyle(document.querySelector('#tbl tbody tr:nth-child(2)')).backgroundColor,
      dt: getComputedStyle(document.querySelector('dl dt')).backgroundColor,
      dd: getComputedStyle(document.querySelector('dl dd')).backgroundColor,
      oldRow: getComputedStyle(document.querySelector('#old tbody tr')).backgroundColor,
      oldBorder: getComputedStyle(document.querySelector('#old td')).borderInlineStartWidth,
    }));
    expect(r.row).not.toBe('rgba(0, 0, 0, 0)');
    expect(r.row2).toBe('rgba(0, 0, 0, 0)');
    expect(r.dt).toBe(r.row);
    expect(r.dd).toBe(r.row);
    expect(r.oldRow).toBe('rgba(0, 0, 0, 0)');
    expect(r.oldBorder).toBe('0px');
  });

  test('the stripe is visible on a white surface in light mode', async ({ page }) => {
    await load(page, '<dl data-striped><dt>A</dt><dd>a</dd><dt>B</dt><dd>b</dd></dl>');
    const bg = await page.locator('dl dt').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    const c = ratio(await lumOf(page, bg, 'white'), await lumOf(page, 'white'));
    // Decorative, not a WCAG requirement, but clearly distinguishable from white.
    expect(c).toBeGreaterThan(1.08);
  });

  test('table data-bordered borders every cell; data-density="compact" tightens padding', async ({ page }) => {
    await load(page, `<section id="a">${TABLE('data-bordered')}</section><section id="b">${TABLE('data-density="compact"')}</section><section id="c">${TABLE('')}</section>`);
    const r = await page.evaluate(() => ({
      border: getComputedStyle(document.querySelector('#a td')).borderInlineStartWidth,
      compact: parseFloat(getComputedStyle(document.querySelector('#b td')).paddingBlockStart),
      normal: parseFloat(getComputedStyle(document.querySelector('#c td')).paddingBlockStart),
    }));
    expect(r.border).toBe('1px');
    expect(r.compact).toBeLessThan(r.normal);
  });

  test('dl stripes skip hidden entries (flat and wrapped)', async ({ page }) => {
    await load(page, `
      <dl id="flat" data-striped><dt>A</dt><dd>a</dd><dt hidden>H</dt><dd hidden>h</dd><dt>B</dt><dd>b</dd><dt>C</dt><dd>c</dd></dl>
      <dl id="wrapped" data-striped><div>
        <dt>A</dt><dd>a</dd></div><div hidden><dt>H</dt><dd>h</dd></div><div><dt>B</dt><dd>b</dd></div><div><dt>C</dt><dd>c</dd></div></dl>`);
    const r = await page.evaluate(() => {
      const bg = (el) => getComputedStyle(el).backgroundColor;
      const flat = [...document.querySelectorAll('#flat > dt:not([hidden])')].map(bg);
      const wrapped = [...document.querySelectorAll('#wrapped > div:not([hidden])')].map(bg);
      return { flat, wrapped };
    });
    const none = 'rgba(0, 0, 0, 0)';
    expect(r.flat[0]).not.toBe(none);
    expect(r.flat[1]).toBe(none);
    expect(r.flat[2]).not.toBe(none);
    expect(r.wrapped[0]).not.toBe(none);
    expect(r.wrapped[1]).toBe(none);
    expect(r.wrapped[2]).not.toBe(none);
  });
});
