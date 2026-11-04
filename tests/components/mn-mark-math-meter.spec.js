/**
 * mark / math / meter — M+N element review fixes.
 *
 * mark:  text colour follows the theme (AA in light, prefers-color-scheme dark
 *        and data-mode="dark", every category), solid Mark/MarkText in
 *        forced colours.
 * math:  self-hosted Latin Modern Math @font-face in the core CSS, no author
 *        overrides of mathcolor / baseline / operator spacing / script size,
 *        data-math copy is a real <button> with data-label-* text.
 * meter: every demo meter is labelled, track edge >= 3:1 in light and dark,
 *        light warning fill >= 3:1, forced-colours track + distinct states.
 *
 * Tests the working tree: /src and the demo files are served from disk.
 */
import { test, expect } from 'playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { mode, head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__mn-mmm-${Math.random().toString(36).slice(2)}.html`;
  const modeAttr = mode ? ` data-mode="${mode}"` : '';
  const html = body.startsWith('<!doctype')
    ? body
    : `<!doctype html><html lang="en"${modeAttr}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      </head><body><main>${body}</main></body></html>`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: html,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
}

function demo(name) {
  return readFileSync(join(REPO, 'demos', 'snippets', 'demos', `${name}.html`), 'utf8');
}

/**
 * In-page helpers: composite colours through a canvas (handles oklch and
 * alpha), then compute WCAG contrast.
 */
const HELPERS = () => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d', { willReadFrequently: true }));
  /** Paint colours bottom→top on a transparent pixel, return [r,g,b,a] */
  const paint = (...colors) => {
    ctx.clearRect(0, 0, 1, 1);
    for (const c of colors) { ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); }
    return Array.from(ctx.getImageData(0, 0, 1, 1).data);
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  /** Stack of background colours from the root down to el (inclusive) */
  const bgStack = (el) => {
    const stack = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      stack.unshift(bg);
    }
    const rootScheme = getComputedStyle(document.documentElement).colorScheme;
    stack.unshift(rootScheme.includes('dark') && !rootScheme.includes('light') ? 'black' : 'white');
    return stack;
  };
  /** Resolve a CSS colour expression (tokens, light-dark) in el's context */
  const resolve = (el, expr) => {
    const probe = document.createElement('span');
    probe.style.color = expr;
    el.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  };
  return { paint, ratio, bgStack, resolve };
};

/* ------------------------------------------------------------------ mark */

const MARKS = `
  <p>Plain <mark id="m-default">default</mark>
  <mark id="m-success" class="success">success</mark>
  <mark id="m-warning" class="warning">warning</mark>
  <mark id="m-error" class="error">error</mark></p>`;

for (const scheme of ['light', 'dark-media', 'dark-attr']) {
  test(`mark text is AA in ${scheme} for every category`, async ({ page }) => {
    if (scheme === 'dark-media') await page.emulateMedia({ colorScheme: 'dark' });
    await load(page, MARKS, { mode: scheme === 'dark-attr' ? 'dark' : undefined });
    const ratios = await page.evaluate((helpers) => {
      const { paint, ratio, bgStack } = new Function(`return (${helpers})()`)();
      const out = {};
      for (const id of ['m-default', 'm-success', 'm-warning', 'm-error']) {
        const el = /** @type {HTMLElement} */ (document.getElementById(id));
        const bg = paint(...bgStack(el));
        const fg = paint(...bgStack(el), getComputedStyle(el).color);
        out[id] = Math.round(ratio(fg, bg) * 100) / 100;
      }
      return out;
    }, HELPERS.toString());
    for (const [id, r] of Object.entries(ratios)) {
      expect(r, `${id} contrast in ${scheme}`).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test('mark uses a solid Mark/MarkText pair in forced colours', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, MARKS);
  const r = await page.evaluate((helpers) => {
    const { paint } = new Function(`return (${helpers})()`)();
    return ['m-default', 'm-success', 'm-error'].map((id) => {
      const el = /** @type {HTMLElement} */ (document.getElementById(id));
      const cs = getComputedStyle(el);
      return { bg: paint(cs.backgroundColor), mark: paint('Mark'), fg: paint(cs.color), markText: paint('MarkText') };
    });
  }, HELPERS.toString());
  for (const m of r) {
    expect(m.bg[3]).toBe(255);
    expect(m.bg).toEqual(m.mark);
    expect(m.fg).toEqual(m.markText);
  }
});

/* ------------------------------------------------------------------ math */

test('core CSS declares a self-hosted Latin Modern Math face that loads', async ({ page }) => {
  const fontRequests = [];
  page.on('request', (req) => { if (/latinmodern-math\.woff2$/.test(req.url())) fontRequests.push(req.url()); });
  await load(page, `<p>Area <math><mi>A</mi><mo>=</mo><mi>&pi;</mi><msup><mi>r</mi><mn>2</mn></msup></math>.</p>`);
  const faces = await page.evaluate(async () => {
    await document.fonts.load('16px "Latin Modern Math"', '∑');
    return [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'Latin Modern Math')
      .map((f) => ({ status: f.status, display: f.display }));
  });
  expect(faces.length).toBeGreaterThan(0);
  expect(faces.some((f) => f.status === 'loaded')).toBe(true);
  expect(faces[0].display).toBe('swap');
  // Either a local copy satisfied it or the self-hosted file was fetched —
  // never a third-party origin.
  for (const u of fontRequests) expect(new URL(u).pathname).toBe('/src/fonts/latinmodern-math.woff2');
});

test('the self-hosted math font file is a real woff2 with the licence beside it', async () => {
  const buf = readFileSync(join(REPO, 'src', 'fonts', 'latinmodern-math.woff2'));
  expect(buf.subarray(0, 4).toString('latin1')).toBe('wOF2');
  const css = readFileSync(join(REPO, 'src', 'fonts', 'math-fonts.css'), 'utf8');
  expect(css).not.toMatch(/jsdelivr|https?:/);
  expect(css).toMatch(/latinmodern-math\.woff2/);
  readFileSync(join(REPO, 'src', 'fonts', 'latinmodern-math-GUST-LICENSE.txt'), 'utf8');
});

test('math leaves mathcolor, baseline, operator spacing and script size to MathML Core', async ({ page }) => {
  await load(page, `<p id="ctx">x <math id="inl"><mi id="red" mathcolor="red">a</mi><mo id="op">(</mo><msup><mi>r</mi><mn id="sup">2</mn></msup></math></p>
    <p id="green"><math><mi id="inh">b</mi><mo id="op2">+</mo></math></p>`);
  await page.addStyleTag({ content: '#green { color: rgb(0, 128, 0); }' });
  const r = await page.evaluate(() => {
    const cs = (id) => getComputedStyle(/** @type {Element} */ (document.getElementById(id)));
    return {
      red: cs('red').color,
      inherited: cs('inh').color,
      op2: cs('op2').color,
      verticalAlign: cs('inl').verticalAlign,
      lineHeight: cs('inl').lineHeight,
      opMargin: [cs('op').marginInlineStart, cs('op').marginInlineEnd],
      supFont: parseFloat(cs('sup').fontSize),
      baseFont: parseFloat(cs('inl').fontSize),
    };
  });
  expect(r.red).toBe('rgb(255, 0, 0)');
  expect(r.inherited).toBe('rgb(0, 128, 0)');
  expect(r.op2).toBe('rgb(0, 128, 0)');
  expect(r.verticalAlign).toBe('baseline');
  expect(r.lineHeight).not.toBe('0px');
  expect(r.opMargin).toEqual(['0px', '0px']);
  // Script size comes from math-depth + the font's MATH table
  // (ScriptPercentScaleDown), so no author font-size rule may remain.
  expect(r.supFont).toBeLessThan(r.baseFont);
  const css = readFileSync(join(REPO, 'src', 'native-elements', 'math', 'styles.css'), 'utf8');
  expect(css).not.toMatch(/font-size:\s*0\.7em|vertical-align|line-height:\s*0|^\s*mo\s*\{/m);
});

test('data-math copy is a keyboard-operable button with overridable labels', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (t) => { /** @type {any} */ (window).__copied = t; } },
    });
  });
  await load(page, `<pre><code data-math="copyable numbered" data-label-copy="Copier" data-label-copied="Copié"
    data-mathml="&lt;math display='block'&gt;&lt;mi&gt;x&lt;/mi&gt;&lt;/math&gt;">x^2</code></pre>`,
  { head: `<script type="module">import '/src/utils/math-init.js';</script>` });
  const button = page.locator('[data-math-rendered] button[data-math-copy]');
  await expect(button).toHaveText('Copier');
  // Rendered after the hidden <pre>, not inside it
  await expect(button).toBeVisible();
  await expect(page.locator('pre [data-math-rendered]')).toHaveCount(0);
  await expect(button).toHaveAttribute('type', 'button');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__copied)).toBe('x^2');
  await expect(page.locator('[data-math-rendered] [role="status"]')).toHaveText('Copié');
  const outline = await button.evaluate((b) => getComputedStyle(b).outlineStyle);
  expect(outline).not.toBe('none');
});

/* ----------------------------------------------------------------- meter */

for (const name of ['meter-basic', 'meter-labeled', 'meter-optimum-ranges', 'meter-sizes']) {
  test(`${name} demo labels every meter and has no inline styles`, async ({ page }) => {
    const html = demo(name);
    expect(html).not.toMatch(/\sstyle="/);
    await load(page, html);
    const r = await page.evaluate(() => [...document.querySelectorAll('meter')].map((m) => ({
      id: m.id,
      labelled: m.labels.length > 0 || m.hasAttribute('aria-labelledby') || m.hasAttribute('aria-label'),
    })));
    expect(r.length).toBeGreaterThan(0);
    for (const m of r) expect(m.labelled, `${name} #${m.id}`).toBe(true);
  });
}

const METERS = `
  <p><label for="opt">Good</label><meter id="opt" min="0" max="100" low="40" high="75" optimum="20" value="22">22%</meter></p>
  <p><label for="sub">Fair</label><meter id="sub" min="0" max="100" low="40" high="75" optimum="20" value="61">61%</meter></p>
  <p><label for="bad">Poor</label><meter id="bad" min="0" max="100" low="40" high="75" optimum="20" value="88">88%</meter></p>`;

for (const scheme of ['light', 'dark']) {
  test(`meter track edge >= 3:1 and fills >= 3:1 in ${scheme}`, async ({ page }) => {
    await load(page, METERS, { mode: scheme === 'dark' ? 'dark' : undefined });
    const r = await page.evaluate((helpers) => {
      const { paint, ratio, bgStack, resolve } = new Function(`return (${helpers})()`)();
      const m = /** @type {HTMLElement} */ (document.getElementById('opt'));
      const page = paint(...bgStack(/** @type {HTMLElement} */ (m.parentElement)));
      const cs = getComputedStyle(m);
      const border = paint(...bgStack(/** @type {HTMLElement} */ (m.parentElement)), cs.borderTopColor);
      const fills = {};
      for (const t of ['optimum', 'suboptimum', 'even-less-good']) {
        // probe beside the meter: <meter> children get no usable computed style
        fills[t] = Math.round(ratio(paint(resolve(/** @type {HTMLElement} */ (m.parentElement), `var(--meter-fill-${t})`)), page) * 100) / 100;
      }
      return { borderWidth: cs.borderTopWidth, edge: Math.round(ratio(border, page) * 100) / 100, fills };
    }, HELPERS.toString());
    expect(r.borderWidth).toBe('1px');
    expect(r.edge).toBeGreaterThanOrEqual(3);
    for (const [k, v] of Object.entries(r.fills)) expect(v, `${k} fill in ${scheme}`).toBeGreaterThanOrEqual(3);
  });
}

test('meter forced colours: CanvasText track edge, opted out of auto-adjust', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, METERS);
  const r = await page.evaluate((helpers) => {
    const { paint } = new Function(`return (${helpers})()`)();
    const cs = getComputedStyle(/** @type {Element} */ (document.getElementById('bad')));
    return { adjust: cs.forcedColorAdjust, border: paint(cs.borderTopColor), canvasText: paint('CanvasText'), width: cs.borderTopWidth };
  }, HELPERS.toString());
  expect(r.adjust).toBe('none');
  expect(r.width).toBe('1px');
  expect(r.border).toEqual(r.canvasText);
});

test('meter CSS themes Firefox fills and scopes .labeled', async () => {
  const css = readFileSync(join(REPO, 'src', 'native-elements', 'meter', 'styles.css'), 'utf8');
  for (const p of ['-moz-meter-optimum', '-moz-meter-sub-optimum', '-moz-meter-sub-sub-optimum']) {
    expect(css).toMatch(new RegExp(`:${p}::-moz-meter-bar\\s*\\{\\s*background: var\\(--meter-fill`));
  }
  expect(css).toMatch(/\.labeled:has\(> meter\)/);
  expect(css).not.toMatch(/^\.labeled\s*\{/m);
});
