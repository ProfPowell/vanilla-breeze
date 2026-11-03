/**
 * <input> — I-review fixes (vanilla-breeze-9vrm).
 *
 * Covers: checkbox / radio / switch / range states stay distinct in forced
 * colors (appearance:none controls paint state with backgrounds, which
 * forced colors flattens); the switch knob and range fill follow RTL; text
 * fields keep a focus outline in forced colors; control borders reach 3:1
 * (WCAG 1.4.11) in light and dark; native number spinners and the search
 * clear button survive; readonly fields look read-only.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ dir?: string, mode?: string, scripts?: string }} [opts]
 */
async function load(page, body, { dir = 'ltr', mode = '', scripts = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__i-input-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"${mode ? ` data-mode="${mode}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <style>main { inline-size: 320px; padding: 16px; } * { caret-color: transparent !important; transition: none !important; }</style>
      ${scripts}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Screenshot an element as a base64 PNG string (for equality checks). */
async function shot(page, selector) {
  return (await page.locator(selector).screenshot()).toString('base64');
}

/**
 * Read RGB pixels from an element screenshot at fractional positions.
 * @param {import('playwright/test').Page} page
 * @param {string} selector
 * @param {Array<[number, number]>} points  [fx, fy] in 0..1
 */
async function pixels(page, selector, points) {
  const b64 = (await page.locator(selector).screenshot()).toString('base64');
  return page.evaluate(async ({ b64, points }) => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
    const bmp = await createImageBitmap(blob);
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    return points.map(([fx, fy]) => {
      const d = ctx.getImageData(Math.floor(fx * (bmp.width - 1)), Math.floor(fy * (bmp.height - 1)), 1, 1).data;
      return [d[0], d[1], d[2]];
    });
  }, { b64, points });
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/* ---------------------------------------------------------------- */

test.describe('forced colors', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
  });

  test('checkbox unchecked / checked / indeterminate are visually distinct', async ({ page }) => {
    await load(page, `
      <input type="checkbox" id="off" aria-label="off">
      <input type="checkbox" id="on" checked aria-label="on">
      <input type="checkbox" id="mixed" aria-label="mixed">
      <input type="radio" name="r" id="roff" aria-label="r off">
      <input type="radio" name="r" id="ron" checked aria-label="r on">`);
    await page.evaluate(() => { document.getElementById('mixed').indeterminate = true; });

    const adjust = await page.evaluate(() => [
      getComputedStyle(document.getElementById('on')).forcedColorAdjust,
      getComputedStyle(document.getElementById('on'), '::after').backgroundColor,
      getComputedStyle(document.getElementById('on')).backgroundColor,
    ]);
    expect(adjust[0]).toBe('none');
    // Mark and fill are different system colours
    expect(adjust[1]).not.toBe(adjust[2]);

    const [off, on, mixed] = [await shot(page, '#off'), await shot(page, '#on'), await shot(page, '#mixed')];
    expect(on).not.toBe(off);
    expect(mixed).not.toBe(off);
    expect(mixed).not.toBe(on);
    expect(await shot(page, '#ron')).not.toBe(await shot(page, '#roff'));
  });

  test('switch on and off are visually distinct', async ({ page }) => {
    await load(page, `
      <input type="checkbox" data-switch id="s-off" aria-label="off">
      <input type="checkbox" data-switch id="s-on" checked aria-label="on">`);
    const cs = await page.evaluate(() => {
      const s = getComputedStyle(document.getElementById('s-off'));
      return { adjust: s.forcedColorAdjust, border: s.borderInlineStartStyle };
    });
    expect(cs.adjust).toBe('none');
    expect(cs.border).toBe('solid');
    expect(await shot(page, '#s-on')).not.toBe(await shot(page, '#s-off'));
  });

  test('range keeps a visible track and fill', async ({ page }) => {
    await load(page, `<input type="range" id="r" aria-label="r" style="--range-pct: 50%">`);
    const [start, end] = await pixels(page, '#r', [[0.1, 0.5], [0.9, 0.5]]);
    expect(dist(start, end)).toBeGreaterThan(60);
  });

  test('text input shows a focus outline', async ({ page }) => {
    await load(page, `<label for="t">Name</label><input type="text" id="t">`);
    await page.locator('#t').focus();
    const o = await page.evaluate(() => {
      const s = getComputedStyle(document.getElementById('t'));
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(o.style).toBe('solid');
    expect(o.width).toBeGreaterThanOrEqual(2);
  });

  test('invalid text input gets a double border', async ({ page }) => {
    await load(page, `<label for="t">Email</label><input type="email" id="t" aria-invalid="true" value="x">`);
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('t')).borderBlockStartStyle)).toBe('double');
  });
});

/* ---------------------------------------------------------------- */

test.describe('RTL', () => {
  /** Knob box (relative to the track) computed from inset + translate. */
  async function knob(page, id) {
    return page.evaluate((id) => {
      const el = document.getElementById(id);
      const track = el.getBoundingClientRect();
      const k = getComputedStyle(el, '::before');
      const w = parseFloat(k.width);
      const tx = parseFloat(k.translate.split(' ')[0]) || 0;
      const rtl = getComputedStyle(el).direction === 'rtl';
      const left = rtl ? track.width - parseFloat(k.right) - w + tx : parseFloat(k.left) + tx;
      return { left, right: left + w, width: track.width };
    }, id);
  }

  for (const size of ['', 'sm', 'lg']) {
    test(`switch${size ? ` ${size}` : ''} knob stays inside the track and moves toward the inline end`, async ({ page }) => {
      await load(page, `
        <input type="checkbox" data-switch="${size}" id="off" aria-label="off">
        <input type="checkbox" data-switch="${size}" id="on" checked aria-label="on">`, { dir: 'rtl' });
      const off = await knob(page, 'off');
      const on = await knob(page, 'on');
      for (const k of [off, on]) {
        expect(k.left).toBeGreaterThanOrEqual(0);
        expect(k.right).toBeLessThanOrEqual(k.width + 0.5);
      }
      // Off sits at the inline start (right in RTL); on at the inline end (left).
      expect(off.left).toBeGreaterThan(on.left);
      expect(on.left).toBeLessThan(4);
    });
  }

  test('plain range fill starts at the inline start (right) in RTL', async ({ page }) => {
    await load(page, `<input type="range" id="r" aria-label="r" style="--range-pct: 25%">
      <input type="range" id="ltr" dir="ltr" aria-label="ltr" style="--range-pct: 25%">`, { dir: 'rtl' });
    // Sample away from the thumb (native thumb sits at the value position)
    const [left, right] = await pixels(page, '#r', [[0.03, 0.5], [0.97, 0.5]]);
    const [lLeft, lRight] = await pixels(page, '#ltr', [[0.03, 0.5], [0.97, 0.5]]);
    // Mirror images: the RTL right edge is the fill colour the LTR left edge has.
    expect(dist(right, lLeft)).toBeLessThan(20);
    expect(dist(left, lRight)).toBeLessThan(20);
    expect(dist(left, right)).toBeGreaterThan(40);
  });

  test('data-range fill starts at the inline start (right) in RTL', async ({ page }) => {
    await load(page, `<label>Volume <input type="range" id="r" min="0" max="100" value="25" data-range></label>`,
      { dir: 'rtl', scripts: `<script type="module">import '/src/utils/range-init.js';</script>` });
    await page.waitForSelector('#r[data-range-init]', { state: 'attached' });
    const fill = await page.evaluate(() => getComputedStyle(document.getElementById('r')).getPropertyValue('--_range-fill').trim());
    expect(fill).not.toBe('');
    const [left, right] = await pixels(page, '#r', [[0.03, 0.5], [0.97, 0.5]]);
    const accent = await page.evaluate(() => {
      const c = document.createElement('canvas').getContext('2d');
      c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-interactive').trim();
      c.fillRect(0, 0, 1, 1);
      return [...c.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    });
    expect(dist(right, accent)).toBeLessThan(dist(left, accent));
  });
});

/* ---------------------------------------------------------------- */

test.describe('control border contrast', () => {
  /** Contrast of each control's border against the page surface. */
  async function ratios(page) {
    return page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      // Resolve tokens (light-dark(), var()) through a probe so the canvas
      // only ever sees a computed colour.
      const probe = document.createElement('i');
      document.querySelector('main').append(probe);
      const rgb = (css) => {
        probe.style.color = css;
        css = getComputedStyle(probe).color;
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = '#000';
        ctx.fillStyle = css;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
      };
      const lum = ([r, g, b]) => {
        const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
      const bg = rgb(getComputedStyle(document.querySelector('main')).getPropertyValue('--color-surface').trim());
      const out = {};
      out.text = cr(rgb(getComputedStyle(document.getElementById('t')).borderTopColor), bg);
      out.checkbox = cr(rgb(getComputedStyle(document.getElementById('c')).borderTopColor), bg);
      out.switch = cr(rgb(getComputedStyle(document.getElementById('s')).backgroundColor), bg);
      out.rangeTrack = cr(rgb(getComputedStyle(document.getElementById('r')).getPropertyValue('--range-track-bg').trim()), bg);
      return out;
    });
  }

  const BODY = `
    <label for="t">Name</label><input type="text" id="t">
    <label><input type="checkbox" id="c"> Box</label>
    <label><input type="checkbox" data-switch id="s"> Switch</label>
    <input type="range" id="r" aria-label="r">`;

  test('>= 3:1 in light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await load(page, BODY);
    for (const [k, v] of Object.entries(await ratios(page))) expect(v, k).toBeGreaterThanOrEqual(3);
  });

  test('>= 3:1 in dark mode (system preference)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await load(page, BODY);
    for (const [k, v] of Object.entries(await ratios(page))) expect(v, k).toBeGreaterThanOrEqual(3);
  });

  test('>= 3:1 in data-mode="dark"', async ({ page }) => {
    await load(page, BODY, { mode: 'dark' });
    for (const [k, v] of Object.entries(await ratios(page))) expect(v, k).toBeGreaterThanOrEqual(3);
  });
});

/* ---------------------------------------------------------------- */

test.describe('native affordances', () => {
  test('number inputs keep native spinners unless data-stepper has upgraded', async ({ page }) => {
    await load(page, `
      <input type="number" id="n" value="5" aria-label="n">
      <input type="text" id="t" value="5" aria-label="t">`);
    // Spinners appear on hover in Chromium: a hovered number field differs
    // from an identical text field only by the spinner.
    await page.locator('#n').hover();
    const n = await shot(page, '#n');
    await page.locator('#t').hover();
    expect(n).not.toBe(await shot(page, '#t'));
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('n')).appearance)).not.toBe('textfield');
  });

  test('data-stepper hides the spinners once upgraded', async ({ page }) => {
    await load(page, `<label for="n">Qty</label><input type="number" id="n" value="5" data-stepper>`,
      { scripts: `<script type="module">import '/src/utils/number-init.js';</script>` });
    await page.waitForSelector('#n[data-stepper-init]', { state: 'attached' });
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('n')).appearance)).toBe('textfield');
  });

  test('search keeps the native clear button', async ({ page }) => {
    await load(page, `
      <input type="search" id="s" value="query" aria-label="s">
      <input type="text" id="t" value="query" aria-label="t">`);
    await page.locator('#s').focus();
    const s = await shot(page, '#s');
    await page.locator('#t').focus();
    expect(s).not.toBe(await shot(page, '#t'));
    // And no stylesheet strips the cancel button's appearance.
    const stripped = await page.evaluate(() => {
      const walk = (rules) => [...rules].some((r) => (r.selectorText?.includes('search-cancel-button') && r.style?.appearance === 'none')
        || (r.cssRules && walk(r.cssRules)));
      return [...document.styleSheets].some((sh) => { try { return walk(sh.cssRules); } catch { return false; } });
    });
    expect(stripped).toBe(false);
  });
});

/* ---------------------------------------------------------------- */

test.describe('readonly', () => {
  test('readonly text fields look read-only; checkbox/select do not', async ({ page }) => {
    await load(page, `
      <label for="a">A</label><input type="text" id="a" value="x">
      <label for="b">B</label><input type="text" id="b" value="x" readonly>
      <label for="ta">C</label><textarea id="ta" readonly>x</textarea>
      <label for="sel">D</label><select id="sel"><option>One</option></select>
      <label><input type="checkbox" id="cb" readonly> E</label>`);
    const cs = await page.evaluate(() => Object.fromEntries(['a', 'b', 'ta', 'sel', 'cb'].map((id) => {
      const s = getComputedStyle(document.getElementById(id));
      return [id, { style: s.borderTopStyle, bg: s.backgroundColor }];
    })));
    expect(cs.a.style).toBe('solid');
    expect(cs.b.style).toBe('dashed');
    expect(cs.ta.style).toBe('dashed');
    expect(cs.b.bg).not.toBe(cs.a.bg);
    expect(cs.sel.style).toBe('solid');
    expect(cs.cb.style).toBe('solid');
  });

  test('checkbox label is at least a 24px target', async ({ page }) => {
    await load(page, `<label id="l"><input type="checkbox"> Box</label>`);
    const h = await page.locator('#l').evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThanOrEqual(24);
  });
});
