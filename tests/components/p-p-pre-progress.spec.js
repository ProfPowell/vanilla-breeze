/**
 * p / pre / progress — P-element review fixes.
 *
 * progress: 3:1 track edge, darkened warning fill, colour variants via
 * --progress-fill, forced colours, reduced motion (media + attribute),
 * .labeled scoping, ring-init label/max edge cases, retro themes leaving
 * enhanced rings circular. pre: tab-size, LTR code blocks on RTL pages,
 * forced-colours edge. p: CJK lead leading and indent.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', head = '', attrs = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__p7-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}" ${attrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      <script type="module">import '/src/utils/progress-ring-init.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => getComputedStyle(document.body).getPropertyValue('--progress-fill').trim() !== '');
}

/** Resolve any CSS colour to sRGB via a canvas and return its contrast with white. */
async function contrastOnWhite(page, cssVar, scopeSelector) {
  return page.evaluate(([v, sel]) => {
    const host = document.querySelector(sel) ?? document.body;
    const probe = document.createElement('span');
    probe.style.color = `var(${v})`;
    host.after(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return 1.05 / (L + 0.05);
  }, [cssVar, scopeSelector]);
}

/* ---------------- progress ---------------- */

test('progress track has a 1px control-border edge; .xs is a borderless hairline', async ({ page }) => {
  await load(page, `
    <label for="a">A</label><progress id="a" value="40" max="100">40%</progress>
    <label for="b">B</label><progress id="b" class="xs" value="40" max="100">40%</progress>
    <span id="ref" style="color: var(--control-border)">ref</span>`);
  const r = await page.evaluate(() => {
    const a = getComputedStyle(document.getElementById('a'));
    const b = getComputedStyle(document.getElementById('b'));
    return {
      width: a.borderTopWidth,
      color: a.borderTopColor,
      ref: getComputedStyle(document.getElementById('ref')).color,
      boxSizing: a.boxSizing,
      xs: b.borderTopWidth,
    };
  });
  expect(r.width).toBe('1px');
  expect(r.color).toBe(r.ref);
  expect(r.boxSizing).toBe('border-box');
  expect(r.xs).toBe('0px');
});

test('light-mode warning fill reaches 3:1 on white; raw --color-warning does not', async ({ page }) => {
  await load(page, '<p id="host">x</p>');
  const warning = await contrastOnWhite(page, '--progress-fill-warning', '#host');
  const raw = await contrastOnWhite(page, '--color-warning', '#host');
  expect(raw).toBeLessThan(3);
  expect(warning).toBeGreaterThanOrEqual(3);
});

test('colour variants swap --progress-fill (bars and rings share it)', async ({ page }) => {
  await load(page, `
    <progress aria-label="w" id="w" class="warning" value="40" max="100"></progress>
    <progress aria-label="s" id="s" class="success" value="40" max="100"></progress>
    <progress aria-label="r" id="r" data-type="ring" class="error" value="40" max="100"></progress>`);
  await page.waitForSelector('#r[data-enhanced]');
  const r = await page.evaluate(() => {
    const probe = (id) => {
      const el = document.getElementById(id);
      // <progress> renders no children: copy its resolved token onto a probe
      const span = document.createElement('span');
      span.style.color = getComputedStyle(el).getPropertyValue('--progress-fill');
      el.after(span);
      const c = getComputedStyle(span).color;
      span.remove();
      return c;
    };
    const ref = (v) => {
      const span = document.createElement('span');
      span.style.color = `var(${v})`;
      document.body.append(span);
      const c = getComputedStyle(span).color;
      span.remove();
      return c;
    };
    return {
      w: probe('w'), wRef: ref('--progress-fill-warning'),
      s: probe('s'), sRef: ref('--color-success'),
      ring: getComputedStyle(document.getElementById('r')).backgroundImage,
    };
  });
  expect(r.w).toBe(r.wRef);
  expect(r.s).toBe(r.sRef);
  expect(r.ring).toContain('conic-gradient');
});

test('forced colours: Highlight fill on Canvas with a CanvasText edge', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, `
    <progress aria-label="a" id="a" value="40" max="100"></progress>
    <progress aria-label="xs" id="xs" class="xs" value="40" max="100"></progress>
    <progress aria-label="r" id="r" data-type="ring" value="40" max="100"></progress>
    <span id="ct" style="color: CanvasText">x</span>`);
  await page.waitForSelector('#r[data-enhanced]');
  const r = await page.evaluate(() => {
    const a = getComputedStyle(document.getElementById('a'));
    const ring = getComputedStyle(document.getElementById('r'));
    return {
      adjust: a.forcedColorAdjust,
      border: a.borderTopColor,
      ct: getComputedStyle(document.getElementById('ct')).color,
      xs: getComputedStyle(document.getElementById('xs')).borderTopWidth,
      ringColor: ring.getPropertyValue('--_ring-color').trim(),
      ringTrack: ring.getPropertyValue('--_ring-track').trim(),
      ringBorder: ring.borderTopStyle,
    };
  });
  expect(r.adjust).toBe('none');
  expect(r.border).toBe(r.ct);
  expect(r.xs).toBe('1px');
  expect(r.ringColor.toLowerCase()).toBe('highlight');
  expect(r.ringTrack.toLowerCase()).toBe('graytext');
  expect(r.ringBorder).toBe('solid');
});

test('reduced motion slows the ring spin (media query and data-motion-reduced)', async ({ page }) => {
  const RING = '<progress id="r" data-type="ring" aria-label="Loading">Loading…</progress>';
  await load(page, RING);
  await page.waitForSelector('#r[data-enhanced]');
  const normal = await page.$eval('#r', (el) => getComputedStyle(el).animationDuration);
  expect(normal).toBe('1s');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.$eval('#r', (el) => getComputedStyle(el).animationDuration)).toBe('3s');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await load(page, RING, { attrs: 'data-motion-reduced' });
  await page.waitForSelector('#r[data-enhanced]');
  expect(await page.$eval('#r', (el) => getComputedStyle(el).animationDuration)).toBe('3s');
});

test('reduced motion slows the linear shimmer; host has no no-op animation', async ({ page }) => {
  await load(page, '<progress id="p" aria-label="Loading">Loading…</progress>', { attrs: 'data-motion-reduced' });
  expect(await page.$eval('#p', (el) => getComputedStyle(el).animationName)).toBe('none');
  // The shimmer lives on the pseudo-element, which getComputedStyle cannot
  // report animation timing for: check the matched rules via CSSOM instead.
  const rules = await page.evaluate(() => {
    const out = [];
    const walk = (list) => {
      for (const r of list) {
        if (r.styleSheet) walk(r.styleSheet.cssRules); // @import
        if (r.cssRules) walk(r.cssRules);
        if (r.selectorText) out.push(`${r.selectorText} { ${r.style.cssText} }`);
      }
    };
    for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch { /* cross-origin */ } }
    return out.filter((t) => t.includes('progress') && t.includes('indeterminate'));
  });
  expect(rules.some((t) => t.startsWith(':root[data-motion-reduced] progress:indeterminate::-webkit-progress-bar') && t.includes('animation-duration: 4s'))).toBe(true);
  // Chromium drops ::-moz- rules from the CSSOM: check the Firefox shimmer in the source.
  const css = readFileSync(join(REPO, 'src/native-elements/progress/styles.css'), 'utf8');
  expect(css).toMatch(/&:indeterminate::-moz-progress-bar \{\s*inline-size: 100%;\s*background: linear-gradient/);
  expect(css).toMatch(/:root\[data-motion-reduced\] progress:indeterminate::-moz-progress-bar \{\s*animation-duration: 4s/);
});

test('.labeled styles only wrappers that hold a progress', async ({ page }) => {
  await load(page, `
    <section class="labeled" id="yes"><header><label for="u">Up</label><output id="u-v" for="u">45%</output></header>
      <progress id="u" aria-describedby="u-v" value="45" max="100">45%</progress></section>
    <section class="labeled" id="no"><p>Unrelated</p></section>`);
  const r = await page.evaluate(() => ({
    yes: getComputedStyle(document.getElementById('yes')).display,
    header: getComputedStyle(document.querySelector('#yes > header')).display,
    no: getComputedStyle(document.getElementById('no')).display,
  }));
  expect(r.yes).toBe('flex');
  expect(r.header).toBe('flex');
  expect(r.no).toBe('block');
});

test('ring-init: an indeterminate ring that gets a value labels itself, not its sibling', async ({ page }) => {
  await load(page, `
    <section id="box">
      <progress id="a" data-type="ring" aria-label="A" max="100">Loading</progress>
      <progress id="b" data-type="ring" aria-label="B" value="30" max="100">30%</progress>
    </section>`);
  await page.waitForSelector('#b[data-enhanced]');
  expect(await page.$eval('#a', (el) => el.parentElement.classList.contains('progress-ring-wrap'))).toBe(false);

  await page.$eval('#a', (el) => { /** @type {HTMLProgressElement} */ (el).value = 70; });
  await expect(page.locator('#a + .progress-ring-label')).toHaveText('70%');
  await expect(page.locator('#b + .progress-ring-label')).toHaveText('30%');
  expect(await page.$eval('#a', (el) => el.style.getPropertyValue('--progress'))).toBe('70');

  // Back to indeterminate: the label hides
  await page.$eval('#a', (el) => el.removeAttribute('value'));
  await expect(page.locator('#a + .progress-ring-label')).toBeHidden();
});

test('ring-init: max changes re-sync --progress and the label', async ({ page }) => {
  await load(page, '<progress id="r" data-type="ring" aria-label="R" value="50" max="100">50%</progress>');
  await page.waitForSelector('#r[data-enhanced]');
  await expect(page.locator('#r + .progress-ring-label')).toHaveText('50%');
  await page.$eval('#r', (el) => el.setAttribute('max', '200'));
  await expect(page.locator('#r + .progress-ring-label')).toHaveText('25%');
  expect(await page.$eval('#r', (el) => el.style.getPropertyValue('--progress'))).toBe('25');
});

test('ring-init: data-label="none" never creates a label; custom text is kept', async ({ page }) => {
  await load(page, `
    <progress id="n" data-type="ring" data-label="none" aria-label="N" value="10" max="100">10%</progress>
    <progress id="c" data-type="ring" data-label="3/4" aria-label="C" value="75" max="100">3 of 4</progress>`);
  await page.waitForSelector('#c[data-enhanced]');
  expect(await page.locator('#n ~ .progress-ring-label').count()).toBe(0);
  await expect(page.locator('#c + .progress-ring-label')).toHaveText('3/4');
  await page.$eval('#c', (el) => { /** @type {HTMLProgressElement} */ (el).value = 50; });
  await expect(page.locator('#c + .progress-ring-label')).toHaveText('3/4');
});

const THEME_BAR_H = { '8bit': '16px', nes: '24px', win9x: '16px' };

for (const theme of ['8bit', 'nes', 'win9x']) {
  test(`${theme} theme: enhanced ring stays circular; bars keep the theme height`, async ({ page }) => {
    await load(page, `
      <progress id="bar" aria-label="bar" class="success" value="40" max="100"></progress>
      <progress id="r" data-type="ring" data-size="l" aria-label="ring" value="40" max="100"></progress>`, {
      attrs: `data-theme="${theme}"`,
      head: `<link rel="stylesheet" href="/src/tokens/themes/_extreme-${theme}.css">`,
    });
    await page.waitForSelector('#r[data-enhanced]');
    await page.waitForFunction(() => document.querySelectorAll('link[rel=stylesheet]').length === [...document.styleSheets].length);
    const r = await page.evaluate(() => {
      const ring = document.getElementById('r').getBoundingClientRect();
      const bar = getComputedStyle(document.getElementById('bar'));
      return { w: ring.width, h: ring.height, bg: getComputedStyle(document.getElementById('r')).backgroundImage, barH: bar.height };
    });
    expect(Math.abs(r.w - r.h)).toBeLessThan(1);
    expect(r.w).toBeGreaterThan(40);
    expect(r.bg).toContain('conic-gradient');
    expect(r.barH).toBe(THEME_BAR_H[theme]);
  });
}

/* ---------------- pre ---------------- */

test('pre: tab-size 4; code blocks stay LTR on RTL pages unless dir is set', async ({ page }) => {
  await load(page, `
    <pre id="bare">a\tb</pre>
    <pre id="code"><code>greet('World');</code></pre>
    <pre id="optout" dir="rtl"><code>x</code></pre>`, { dir: 'rtl' });
  const r = await page.evaluate(() => ({
    tab: getComputedStyle(document.getElementById('bare')).tabSize,
    bare: getComputedStyle(document.getElementById('bare')).direction,
    code: getComputedStyle(document.getElementById('code')).direction,
    inner: getComputedStyle(document.querySelector('#code code')).direction,
    optout: getComputedStyle(document.getElementById('optout')).direction,
  }));
  expect(r.tab).toBe('4');
  expect(r.bare).toBe('rtl');
  expect(r.code).toBe('ltr');
  expect(r.inner).toBe('ltr');
  expect(r.optout).toBe('rtl');
});

test('pre: forced colours draw a CanvasText edge and keep bold highlights', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, `
    <pre id="code"><code>let <b id="hl">x</b> = 1;</code></pre>
    <pre id="bare">art</pre>
    <span id="ct" style="color: CanvasText">x</span>`);
  const r = await page.evaluate(() => {
    const code = getComputedStyle(document.getElementById('code'));
    const hl = getComputedStyle(document.getElementById('hl'));
    return {
      width: code.borderTopWidth,
      color: code.borderTopColor,
      ct: getComputedStyle(document.getElementById('ct')).color,
      bare: getComputedStyle(document.getElementById('bare')).borderTopWidth,
      hlAdjust: hl.forcedColorAdjust,
      hlBg: hl.backgroundColor,
    };
  });
  expect(r.width).toBe('1px');
  expect(r.color).toBe(r.ct);
  expect(r.bare).toBe('0px');
  expect(r.hlAdjust).toBe('none');
  expect(r.hlBg).not.toBe('rgba(0, 0, 0, 0)');
});

/* ---------------- p ---------------- */

test('p: CJK lead keeps 1.8 leading and indent is one character', async ({ page }) => {
  await load(page, `
    <section lang="ja"><p class="lead" id="lead">リード段落</p><p class="indent" id="ind">字下げ</p></section>
    <p class="lead" id="latin">Lead</p><p class="indent" id="lind">Indent</p>`);
  const r = await page.evaluate(() => {
    const cs = (id) => getComputedStyle(document.getElementById(id));
    return {
      lead: parseFloat(cs('lead').lineHeight) / parseFloat(cs('lead').fontSize),
      latin: parseFloat(cs('latin').lineHeight) / parseFloat(cs('latin').fontSize),
      ind: parseFloat(cs('ind').textIndent) / parseFloat(cs('ind').fontSize),
      lind: parseFloat(cs('lind').textIndent) / parseFloat(cs('lind').fontSize),
    };
  });
  expect(r.lead).toBeCloseTo(1.8, 2);
  expect(r.latin).toBeLessThan(1.8);
  expect(r.ind).toBeCloseTo(1, 2);
  expect(r.lind).toBeCloseTo(1.5, 2);
});
