/**
 * loading-spinner, layout-badge, layout-card — K+L review fixes.
 *
 * Spinner: no fake `role: status` CSS, overlay centres a --_size spinner over
 * a positioned container, forced-colors keeps the arc distinct, warning reads
 * --color-warning.
 * Badge: every colour x variant meets 4.5:1 in light and dark mode, forced-
 * colors border, data-size s/l (sm/lg gone, 11px floor), no leaked privates.
 * Card: content children stack (no overlap) between a pinned header/footer,
 * data-max centres in block flow, forced-colors edge, slot-only structured
 * mode, container-type only in structured mode, nested padding not inherited,
 * subgrid rows still align.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { mode = 'light', head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__kl-b-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" data-mode="${mode}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/* ---------------------------------------------------------------- spinner */

test.describe('loading-spinner', () => {
  test('styles carry no invalid role declaration', () => {
    const css = readFileSync(join(REPO, 'src/custom-elements/loading-spinner/styles.css'), 'utf8');
    expect(css).not.toMatch(/^\s*role\s*:/m);
  });

  test('overlay covers the positioned container and centres a --_size spinner', async ({ page }) => {
    await load(page, `
      <section id="box" style="position: relative; inline-size: 400px; block-size: 200px; padding: 0">
        <p>Behind</p>
        <loading-spinner id="s" data-overlay data-size="l" role="status" aria-label="Loading"></loading-spinner>
      </section>`);
    const r = await page.evaluate(() => {
      const box = /** @type {HTMLElement} */ (document.getElementById('box')).getBoundingClientRect();
      const el = /** @type {HTMLElement} */ (document.getElementById('s'));
      const host = el.getBoundingClientRect();
      const after = getComputedStyle(el, '::after');
      return {
        box: [box.x, box.y, box.width, box.height],
        host: [host.x, host.y, host.width, host.height],
        afterW: parseFloat(after.width), afterH: parseFloat(after.height),
        fontSize: parseFloat(getComputedStyle(el).fontSize),
        align: getComputedStyle(el).alignItems, justify: getComputedStyle(el).justifyContent,
      };
    });
    expect(r.host).toEqual(r.box);
    expect(r.afterW).toBeCloseTo(2.5 * r.fontSize, 0);
    expect(r.afterH).toBeCloseTo(2.5 * r.fontSize, 0);
    expect(r.align).toBe('center');
    expect(r.justify).toBe('center');
  });

  test('forced colors: transparent track, system-colour arc', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<loading-spinner id="s" role="status" aria-label="Loading"></loading-spinner>`);
    const c = await page.evaluate(() => {
      const a = getComputedStyle(/** @type {HTMLElement} */ (document.getElementById('s')), '::after');
      return { top: a.borderTopColor, end: a.borderRightColor, bottom: a.borderBottomColor };
    });
    expect(c.end).toBe('rgba(0, 0, 0, 0)');
    expect(c.bottom).toBe('rgba(0, 0, 0, 0)');
    expect(c.top).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('warning variant reads --color-warning', async ({ page }) => {
    await load(page, `<loading-spinner id="s" data-variant="warning" style="--color-warning: rgb(1, 2, 3)" role="status" aria-label="Loading"></loading-spinner>`);
    const top = await page.evaluate(() => getComputedStyle(/** @type {HTMLElement} */ (document.getElementById('s')), '::after').borderTopColor);
    expect(top).toBe('rgb(1, 2, 3)');
  });
});

/* ------------------------------------------------------------------ badge */

const COLORS = ['', 'primary', 'success', 'warning', 'error', 'info', 'brand', 'secondary', 'accent'];
const VARIANTS = ['', 'subtle', 'outlined'];

const BADGES = VARIANTS.flatMap((v) => COLORS.map((c) =>
  `<layout-badge${c ? ` data-color="${c}"` : ''}${v ? ` data-variant="${v}"` : ''} data-k="${v || 'solid'}/${c || 'default'}">Label</layout-badge>`)).join('\n');

/** In-page: resolve any CSS colour to sRGB through a canvas, composite the
 *  badge text over its effective background, return the WCAG ratio. */
async function contrasts(page) {
  return page.evaluate(() => {
    const ctx = /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d', { willReadFrequently: true }));
    const rgba = (css) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000'; ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: a / 255 };
    };
    const over = (top, under) => ({
      r: top.r * top.a + under.r * (1 - top.a),
      g: top.g * top.a + under.g * (1 - top.a),
      b: top.b * top.a + under.b * (1 - top.a),
      a: 1,
    });
    const lum = ({ r, g, b }) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const groundOf = (el) => {
      const chain = [];
      for (let n = el; n; n = n.parentElement) chain.push(getComputedStyle(n).backgroundColor);
      let c = { r: 255, g: 255, b: 255, a: 1 };
      for (const css of chain.reverse()) { const x = rgba(css); if (x.a > 0) c = over(x, c); }
      return c;
    };
    /** @type {Record<string, number>} */
    const out = {};
    for (const el of document.querySelectorAll('layout-badge[data-k]')) {
      const bg = groundOf(el);
      const fg = over(rgba(getComputedStyle(el).color), bg);
      const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
      out[/** @type {HTMLElement} */ (el).dataset.k] = Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
    }
    return out;
  });
}

test.describe('layout-badge', () => {
  for (const mode of ['light', 'dark']) {
    test(`every colour and variant meets 4.5:1 in ${mode} mode`, async ({ page }) => {
      await load(page, BADGES, { mode });
      const ratios = await contrasts(page);
      expect(Object.keys(ratios)).toHaveLength(COLORS.length * VARIANTS.length);
      const failing = Object.entries(ratios).filter(([, r]) => r < 4.5);
      expect(failing, JSON.stringify(ratios)).toEqual([]);
    });
  }

  test('forced colors: every badge gets a border', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<layout-badge id="b" data-color="success">Paid</layout-badge>`);
    const b = await page.evaluate(() => {
      const s = getComputedStyle(/** @type {HTMLElement} */ (document.getElementById('b')));
      return { w: s.borderTopWidth, style: s.borderTopStyle };
    });
    expect(b.style).toBe('solid');
    expect(parseFloat(b.w)).toBeGreaterThan(0);
  });

  test('data-size s/l apply; sm/lg are gone; small has an 11px floor', async ({ page }) => {
    await load(page, `
      <layout-badge id="d">D</layout-badge>
      <layout-badge id="s" data-size="s">S</layout-badge>
      <layout-badge id="l" data-size="l">L</layout-badge>
      <layout-badge id="sm" data-size="sm">SM</layout-badge>`);
    const fs = await page.evaluate(() => Object.fromEntries(['d', 's', 'l', 'sm'].map((id) =>
      [id, parseFloat(getComputedStyle(/** @type {HTMLElement} */ (document.getElementById(id))).fontSize)])));
    expect(fs.s).toBeGreaterThanOrEqual(11);
    expect(fs.s).toBeLessThan(fs.d);
    expect(fs.l).toBeGreaterThan(fs.d);
    expect(fs.sm).toBe(fs.d);
  });

  test('ancestor private properties do not leak into the badge', async ({ page }) => {
    await load(page, `
      <p style="--_badge-bg: rgb(255, 0, 0); --_bg: rgb(255, 0, 0); --_color: rgb(0, 255, 0)"><layout-badge id="a">A</layout-badge></p>
      <layout-badge id="b">B</layout-badge>`);
    const [a, b] = await page.evaluate(() => ['a', 'b'].map((id) => {
      const s = getComputedStyle(/** @type {HTMLElement} */ (document.getElementById(id)));
      return `${s.backgroundColor}|${s.color}`;
    }));
    expect(a).toBe(b);
  });
});

/* ------------------------------------------------------------------- card */

test.describe('layout-card', () => {
  test('multiple content children stack between header and footer without overlap', async ({ page }) => {
    await load(page, `
      <layout-card id="c" style="inline-size: 360px">
        <header><h3>Title</h3></header>
        <p>First paragraph.</p>
        <p>Second paragraph.</p>
        <section><p>A section.</p></section>
        <footer><button type="button">OK</button></footer>
      </layout-card>`);
    const rects = await page.evaluate(() => [...document.querySelectorAll('#c > *')].map((n) => {
      const r = n.getBoundingClientRect();
      return { tag: n.tagName, top: Math.round(r.top), bottom: Math.round(r.bottom) };
    }));
    for (let i = 1; i < rects.length; i++) {
      expect(rects[i].top, JSON.stringify(rects)).toBeGreaterThanOrEqual(rects[i - 1].bottom);
    }
  });

  test('header stays on top and footer pinned to the bottom of a stretched card', async ({ page }) => {
    await load(page, `
      <layout-card id="c" style="inline-size: 360px; block-size: 600px">
        <p>Content first in source.</p>
        <footer><button type="button">OK</button></footer>
        <h3 slot="header">Slotted header</h3>
      </layout-card>`);
    const r = await page.evaluate(() => {
      const c = /** @type {HTMLElement} */ (document.getElementById('c'));
      const rect = (sel) => /** @type {HTMLElement} */ (c.querySelector(sel)).getBoundingClientRect();
      return { card: c.getBoundingClientRect(), header: rect('[slot="header"]'), p: rect('p'), footer: rect('footer') };
    });
    expect(Math.round(r.header.top)).toBe(Math.round(r.card.top));
    expect(r.p.top).toBeGreaterThanOrEqual(r.header.bottom - 0.5);
    expect(Math.round(r.footer.bottom)).toBe(Math.round(r.card.bottom));
  });

  test('slot-only markup enters structured mode', async ({ page }) => {
    await load(page, `<layout-card id="c"><h3 slot="header">T</h3><p slot="content">Body</p></layout-card>`);
    const s = await page.evaluate(() => {
      const cs = getComputedStyle(/** @type {HTMLElement} */ (document.getElementById('c')));
      return { display: cs.display, padding: cs.paddingTop };
    });
    expect(s.display).toBe('flex');
    expect(s.padding).toBe('0px');
  });

  test('container-type only in structured mode', async ({ page }) => {
    await load(page, `
      <layout-card id="block"><p>Block</p></layout-card>
      <layout-card id="structured"><section><p>S</p></section></layout-card>
      <layout-cluster><layout-card id="item">Shrink-to-fit</layout-card></layout-cluster>`);
    const r = await page.evaluate(() => ({
      block: getComputedStyle(/** @type {HTMLElement} */ (document.getElementById('block'))).containerType,
      structured: getComputedStyle(/** @type {HTMLElement} */ (document.getElementById('structured'))).containerType,
      itemWidth: /** @type {HTMLElement} */ (document.getElementById('item')).getBoundingClientRect().width,
    }));
    expect(r.block).toBe('normal');
    expect(r.structured).toBe('inline-size');
    expect(r.itemWidth).toBeGreaterThan(50);
  });

  test('data-max centres the card in normal block flow', async ({ page }) => {
    await load(page, `<section id="p" style="inline-size: 1000px; padding: 0; margin: 0"><layout-card id="c" data-max="narrow">Narrow</layout-card></section>`);
    const r = await page.evaluate(() => {
      const p = /** @type {HTMLElement} */ (document.getElementById('p')).getBoundingClientRect();
      const c = /** @type {HTMLElement} */ (document.getElementById('c')).getBoundingClientRect();
      return { left: c.left - p.left, right: p.right - c.right, width: c.width };
    });
    expect(r.width).toBeLessThan(1000);
    expect(Math.abs(r.left - r.right)).toBeLessThan(1);
  });

  test('forced colors: non-ghost cards get an edge, ghost does not', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `
      <layout-card id="d">Default</layout-card>
      <layout-card id="e" data-variant="elevated">Elevated</layout-card>
      <layout-card id="g" data-variant="ghost">Ghost</layout-card>`);
    const w = await page.evaluate(() => Object.fromEntries(['d', 'e', 'g'].map((id) =>
      [id, getComputedStyle(/** @type {HTMLElement} */ (document.getElementById(id))).borderTopStyle])));
    expect(w).toEqual({ d: 'solid', e: 'solid', g: 'none' });
  });

  test('a nested card does not inherit its parent data-padding', async ({ page }) => {
    await load(page, `
      <layout-card data-padding="xl"><layout-card id="inner">Inner</layout-card></layout-card>
      <layout-card id="solo">Solo</layout-card>
      <layout-card data-padding="none"><header>H</header><section><layout-card id="inner2"><header>h</header><section id="s2">s</section></layout-card></section></layout-card>
      <layout-card><header>h</header><section id="s3">s</section></layout-card>`);
    const r = await page.evaluate(() => {
      const pad = (id) => getComputedStyle(/** @type {HTMLElement} */ (document.getElementById(id))).paddingTop;
      return { inner: pad('inner'), solo: pad('solo'), s2: pad('s2'), s3: pad('s3') };
    });
    expect(r.inner).toBe(r.solo);
    expect(r.s2).toBe(r.s3);
  });

  test('data-padding none drops structured padding and dividers', async ({ page }) => {
    await load(page, `<layout-card data-padding="none"><header id="h">H</header><p id="p">P</p></layout-card>`);
    const s = await page.evaluate(() => {
      const h = getComputedStyle(/** @type {HTMLElement} */ (document.getElementById('h')));
      const p = getComputedStyle(/** @type {HTMLElement} */ (document.getElementById('p')));
      return { hPad: h.paddingTop, hBorder: h.borderBottomStyle, pPad: p.paddingTop };
    });
    expect(s).toEqual({ hPad: '0px', hBorder: 'none', pPad: '0px' });
  });

  test('subgrid parent still aligns header, content and footer rows', async ({ page }) => {
    await load(page, `
      <layout-grid data-layout-subgrid data-layout-min="xs" style="inline-size: 640px">
        <layout-card id="a"><header><h3>Short</h3></header><section><p>One line.</p></section><footer><button type="button">Go</button></footer></layout-card>
        <layout-card id="b"><header><h3>A much longer header that wraps onto several lines here</h3></header><section><p>Body text that is a little longer than the first card's body.</p></section><footer><button type="button">Go</button></footer></layout-card>
      </layout-grid>`);
    const r = await page.evaluate(() => ['a', 'b'].map((id) => {
      const c = /** @type {HTMLElement} */ (document.getElementById(id));
      const top = (sel) => Math.round(/** @type {HTMLElement} */ (c.querySelector(sel)).getBoundingClientRect().top);
      const headerBottom = Math.round(/** @type {HTMLElement} */ (c.querySelector('header')).getBoundingClientRect().bottom);
      return { display: getComputedStyle(c).display, headerBottom, section: top('section'), footer: top('footer') };
    }));
    expect(r[0].display).toBe('grid');
    expect(r[0].section).toBe(r[0].headerBottom); // rows abut: no inherited row gap
    expect(r[0].section).toBe(r[1].section);
    expect(r[0].footer).toBe(r[1].footer);
  });
});
