/**
 * <html>/<head> review fixes (vanilla-breeze-wja7).
 *
 * Covers: authored root attributes (data-fluid, data-accent,
 * data-border-style) survive ThemeManager boot with no stored prefs, a stored
 * pref overrides them and reset() restores them; no third-party font request
 * by default while the a11y-dyslexia theme still renders self-hosted
 * Atkinson Hyperlegible; scoped data-mode regions paint readable text on
 * their own background; data-motion-reduced zeroes the duration scale and
 * smooth scrolling; <meta name="theme-color"> follows mode changes.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ htmlAttrs?: string, head?: string, stored?: object|null, script?: string }} [opts]
 */
async function load(page, body, { htmlAttrs = '', head = '', stored = null, script = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  if (stored) {
    await page.addInitScript((data) => {
      localStorage.setItem('vb:theme:current', JSON.stringify({ data, timestamp: Date.now() }));
    }, stored);
  }
  const url = `/__gh-root-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" ${htmlAttrs}><head><meta charset="utf-8">
      ${head}
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">
        import { ThemeManager } from '/src/lib/theme-manager.js';
        window.TM = ThemeManager;
        await ThemeManager.init();
        ${script}
        window.__ready = true;
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => /** @type {any} */ (window).__ready === true);
}

const rootAttrs = (page) => page.evaluate(() => {
  const r = document.documentElement;
  return {
    fluid: r.getAttribute('data-fluid'),
    accent: r.getAttribute('data-accent'),
    border: r.getAttribute('data-border-style'),
  };
});

/* ── 1. Authored root attributes are page defaults ─────────────────────── */

test('authored data-fluid / data-accent / data-border-style survive boot with no stored prefs', async ({ page }) => {
  await load(page, '<p>Hi</p>', { htmlAttrs: 'data-fluid data-accent="ocean" data-border-style="sketch"' });
  expect(await rootAttrs(page)).toEqual({ fluid: '', accent: 'ocean', border: 'sketch' });
  const state = await page.evaluate(() => /** @type {any} */ (window).TM.getState());
  expect(state.accent).toBe('ocean');
  expect(state.borderStyle).toBe('sketch');
  expect(state.fluid).toBe('default'); // bare data-fluid = default preset, shown as on
});

test('a mode toggle does not strip authored attributes', async ({ page }) => {
  await load(page, '<p>Hi</p>', { htmlAttrs: 'data-fluid="compact" data-accent="forest"' });
  await page.evaluate(() => /** @type {any} */ (window).TM.setMode('dark'));
  const a = await rootAttrs(page);
  expect(a.fluid).toBe('compact');
  expect(a.accent).toBe('forest');
});

test('v1 stored blob (every key saved as "") keeps authored attributes', async ({ page }) => {
  await load(page, '<p>Hi</p>', {
    htmlAttrs: 'data-fluid data-accent="ocean"',
    stored: { mode: 'light', brand: 'default', accent: 'default', fluid: '', backdrop: '', backdropChrome: '', borderStyle: '', iconSet: '' },
  });
  const a = await rootAttrs(page);
  expect(a.fluid).toBe('');
  expect(a.accent).toBe('ocean');
});

test('stored prefs override authored attributes; reset() restores them', async ({ page }) => {
  await load(page, '<p>Hi</p>', {
    htmlAttrs: 'data-fluid data-accent="ocean" data-border-style="sketch"',
    stored: { v: 2, mode: 'light', brand: 'default', accent: 'forest', fluid: 'spacious', borderStyle: 'rough' },
  });
  expect(await rootAttrs(page)).toEqual({ fluid: 'spacious', accent: 'forest', border: 'rough' });

  // An explicit "off" also beats the authored value
  await page.evaluate(() => /** @type {any} */ (window).TM.setFluid(''));
  expect((await rootAttrs(page)).fluid).toBeNull();

  await page.evaluate(() => /** @type {any} */ (window).TM.reset());
  expect(await rootAttrs(page)).toEqual({ fluid: '', accent: 'ocean', border: 'sketch' });
});

test('ThemeManager is public on window.VB.themeManager', async ({ page }) => {
  await load(page, '<p>Hi</p>');
  expect(await page.evaluate(() => /** @type {any} */ (window).VB?.themeManager === /** @type {any} */ (window).TM)).toBe(true);
});

/* ── 2. Fonts: no third-party request; dyslexia theme self-hosts ────────── */

test('a default page makes no request to Google Fonts', async ({ page }) => {
  const thirdParty = [];
  page.on('request', (req) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) thirdParty.push(req.url());
  });
  await load(page, '<p>Hello</p>');
  await page.waitForLoadState('networkidle');
  expect(thirdParty).toEqual([]);
});

test('a11y-dyslexia renders self-hosted Atkinson Hyperlegible', async ({ page }) => {
  const thirdParty = [];
  const atkinson = [];
  page.on('request', (req) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) thirdParty.push(req.url());
    if (/atkinson-hyperlegible-latin-400-normal\.woff2/.test(req.url())) atkinson.push(req.url());
  });
  await load(page, '<p id="p">Readable text</p>', { htmlAttrs: 'data-theme="a11y-dyslexia"' });
  const r = await page.evaluate(async () => {
    await document.fonts.ready;
    const p = /** @type {HTMLElement} */ (document.getElementById('p'));
    return {
      family: getComputedStyle(p).fontFamily,
      loaded: document.fonts.check('16px "Atkinson Hyperlegible"', 'Readable'),
      faces: [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'Atkinson Hyperlegible' && f.status === 'loaded').length,
    };
  });
  expect(r.family).toMatch(/^"?Atkinson Hyperlegible"?/);
  expect(r.faces).toBeGreaterThan(0);
  expect(r.loaded).toBe(true);
  expect(atkinson.length).toBeGreaterThan(0);
  expect(thirdParty).toEqual([]);
});

/* ── 3. Scoped data-mode paints its own surface ─────────────────────────── */

const CONTRAST = () => {
  /** @param {string} c */
  const rgb = (c) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const ctx = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d', { willReadFrequently: true }));
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  };
  /** @param {number[]} c */
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  /** @param {string} id */
  return (id) => {
    const el = /** @type {HTMLElement} */ (document.getElementById(id));
    const cs = getComputedStyle(el);
    const bg = rgb(cs.backgroundColor);
    const fg = rgb(cs.color);
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return { ratio: (a + 0.05) / (b + 0.05), bgAlpha: bg[3], bgLum: lum(bg) };
  };
};

test('scoped data-mode="dark" on a light page: own dark background, readable text', async ({ page }) => {
  await load(page, '<aside id="s" data-mode="dark"><p>Dark aside</p></aside>', {
    htmlAttrs: 'data-mode="light"', stored: { v: 2, mode: 'light' },
  });
  const r = await page.evaluate(`(${CONTRAST})()('s')`);
  expect(r.bgAlpha).toBe(255);
  expect(r.bgLum).toBeLessThan(0.05);
  expect(r.ratio).toBeGreaterThanOrEqual(4.5);
});

test('scoped data-mode="light" inside a dark page: light tokens, readable text', async ({ page }) => {
  await load(page, '<aside id="s" data-mode="light"><p>Light aside</p></aside>', {
    stored: { v: 2, mode: 'dark' },
  });
  const r = await page.evaluate(`(${CONTRAST})()('s')`);
  expect(r.bgAlpha).toBe(255);
  expect(r.bgLum).toBeGreaterThan(0.8);
  expect(r.ratio).toBeGreaterThanOrEqual(4.5);
  // Derived tokens re-derive from the light seeds, not the dark root's.
  // The root's seeds are @property-registered and transition when the stored
  // dark mode is applied at load, so poll until they settle (slow CI runners
  // otherwise read a mid-transition value).
  const seeds = () => page.evaluate(() => {
    const s = getComputedStyle(/** @type {HTMLElement} */ (document.getElementById('s')));
    const root = getComputedStyle(document.documentElement);
    return { aside: s.getPropertyValue('--lightness-primary').trim(), root: root.getPropertyValue('--lightness-primary').trim() };
  });
  await expect.poll(seeds, { timeout: 5000 }).toEqual({ aside: '50%', root: '65%' });
});

/* ── 4. data-motion-reduced ─────────────────────────────────────────────── */

test('data-motion-reduced zeroes --duration-* and smooth scrolling', async ({ page }) => {
  await load(page, '<p><a href="#x">x</a></p><p id="x">x</p>', { htmlAttrs: 'data-motion-reduced' });
  const r = await page.evaluate(() => {
    document.querySelector('a')?.focus();
    const cs = getComputedStyle(document.documentElement);
    return {
      durations: ['instant', 'fast', 'normal', 'slow', 'slower'].map((n) => cs.getPropertyValue(`--duration-${n}`).trim()),
      scroll: cs.scrollBehavior,
    };
  });
  for (const d of r.durations) expect(['0ms', '0s']).toContain(d);
  expect(r.scroll).toBe('auto');
});

test('without data-motion-reduced the duration scale is intact', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await load(page, '<p>x</p>');
  const d = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--duration-normal').trim());
  expect(['200ms', '0.2s']).toContain(d);
});

/* ── 5. theme-color meta follows mode ───────────────────────────────────── */

test('theme-color meta updates on mode change', async ({ page }) => {
  await load(page, '<p>x</p>', {
    head: `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1a1a1a">`,
    stored: { v: 2, mode: 'light' },
  });
  const read = () => page.evaluate(() => [...document.querySelectorAll('meta[name="theme-color"]')]
    .map((m) => ({ content: m.getAttribute('content'), media: m.getAttribute('media') })));
  const light = await read();
  expect(light.every((m) => m.media === null && m.content === '#ffffff')).toBe(true);

  await page.evaluate(() => /** @type {any} */ (window).TM.setMode('dark'));
  const dark = await read();
  expect(dark[0].content).toMatch(/^#[0-9a-f]{6}$/);
  expect(dark[0].content).not.toBe('#ffffff');
  // Matches the page's painted (html) background
  const bg = await page.evaluate(() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const ctx = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d', { willReadFrequently: true }));
    ctx.fillStyle = getComputedStyle(document.documentElement).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    return '#' + [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map((n) => n.toString(16).padStart(2, '0')).join('');
  });
  expect(dark[0].content).toBe(bg);
});
