/**
 * browser-window chrome contrast under the themes that restyle it
 * (vanilla-breeze-5kag, m8vd, qvhc, 3yhd, hm8h, yciu, aw6w).
 *
 * browser-window is an external component themed through the
 * --browser-window-* properties mapped in src/utils/external-components.css
 * and the per-theme `:is(main, article) browser-window` blocks. For each
 * theme in light mode, dark mode and with no data-mode (prefers light and
 * prefers dark) this renders a real <browser-window src> inside <main> and
 * measures, in its shadow DOM:
 *   - URL text on the URL bar ............................. 4.5:1
 *   - toolbar icons (same colour, same bar) ............... 3:1
 *   - icon on hover (text colour on hover-bg) ............. 3:1
 *   - close / minimize / maximize dots on the header ...... 3:1
 *   - control focus ring (accent colour) on the header .... 3:1
 * Gradient headers are measured against every stop (worst stop wins).
 *
 * It also checks that each theme with no data-mode declares a color-scheme
 * matching its surfaces, so scrollbars and form controls follow the theme.
 *
 * Tests the working tree: /src and the component are served from disk.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');

/** Themes whose browser-window blocks this spec guards. */
const THEMES = ['nes', 'super2026', '8bit', 'win9x', 'alpha1999', 'cyber', 'terminal', 'journal'];
/** Dark-first / fixed-palette themes: base block must declare one scheme. */
const SCHEME_THEMES = ['nes', 'super2026', '8bit', 'alpha1999', 'cyber', 'terminal', 'dracula', 'journal', 'win9x'];
const MODES = [
  { mode: 'light', scheme: 'light' },
  { mode: 'dark', scheme: 'light' },
  { mode: null, scheme: 'light' },
  { mode: null, scheme: 'dark' },
];
const label = ({ mode, scheme }) => mode ?? `none(prefers-${scheme})`;

async function load(page, scheme) {
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/node_modules/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__bw-demo.html', (route) => route.fulfill({
    status: 200, contentType: 'text/html', body: '<!doctype html><title>demo</title><p>demo</p>',
  }));
  // Theme webfonts come from Google Fonts: keep the run offline and stable.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  const themes = [...new Set([...THEMES, ...SCHEME_THEMES])];
  const url = `/__c-browser-window-contrast-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${themes.map((t) => `<link rel="stylesheet" href="/src/tokens/themes/_extreme-${t}.css">`).join('\n')}
      <style>*, *::before, *::after { transition: none !important; animation: none !important; }</style>
      <script type="module">import '/node_modules/@profpowell/browser-window/dist/browser-window.js';</script>
      </head><body><main>
      <browser-window id="bw" src="/__bw-demo.html" url="https://example.com/demo" title="Demo"></browser-window>
      </main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('bw')?.shadowRoot?.querySelector('.url-text'));
}

/** Apply theme/mode on <html>, then measure the window chrome. */
function measure([theme, mode]) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (mode) root.setAttribute('data-mode', mode);
  else root.removeAttribute('data-mode');

  const sr = document.getElementById('bw').shadowRoot;
  const header = sr.querySelector('.browser-header');
  const bar = sr.querySelector('.url-bar');
  // The shadow styles transition colours (`transition: all 150ms`): flush
  // style, then jump every running transition to its end state.
  getComputedStyle(sr.querySelector('.view-source-button')).color;
  sr.getAnimations().forEach((a) => a.finish());
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (css) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  };
  const over = ([r, g, b, a], [R, G, B]) => {
    const k = a / 255;
    return [r * k + R * (1 - k), g * k + G * (1 - k), b * k + B * (1 - k), 255];
  };
  const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const r2 = (n) => Math.round(n * 100) / 100;
  // Resolve a token in the header's context (var(), light-dark(), color-mix()).
  const probe = document.createElement('i');
  header.append(probe);
  const tok = (css) => {
    probe.style.color = 'transparent';
    probe.style.color = css;
    return rgba(getComputedStyle(probe).color);
  };
  const COLOR = /(?:rgba?|oklch|oklab|color|lab|lch|hsla?)\([^)]*\)|#[0-9a-f]{3,8}\b/gi;

  // Backdrop: frame bg over the page background.
  const page = over(rgba(getComputedStyle(document.body).backgroundColor), [255, 255, 255, 255]);
  const frame = over(tok('var(--browser-window-bg, var(--_bw-bg))'), page);
  const hcs = getComputedStyle(header);
  const stops = (hcs.backgroundImage.match(COLOR) ?? []).map((c) => over(rgba(c), frame));
  const headerColors = stops.length ? stops : [over(rgba(hcs.backgroundColor), frame)];
  const onHeader = (c) => r2(Math.min(...headerColors.map((h) => cr(over(c, h), h))));

  const barBg = headerColors.map((h) => over(rgba(getComputedStyle(bar).backgroundColor), h));
  const urlColor = rgba(getComputedStyle(sr.querySelector('.url-text')).color);
  const onBar = (c, bg = barBg) => r2(Math.min(...bg.map((b) => cr(over(c, b), b))));
  const icon = rgba(getComputedStyle(sr.querySelector('.view-source-button')).color);
  const hoverBg = barBg.map((b) => over(tok('var(--browser-window-hover-bg, var(--_bw-hover-bg))'), b));
  const hoverText = tok('var(--browser-window-text-color, var(--_bw-text-color))');
  const dot = (cls) => rgba(getComputedStyle(sr.querySelector(`.control-button.${cls}`), '::after').backgroundColor);
  const out = {
    url: onBar(urlColor),
    icon: onBar(icon),
    hover: onBar(hoverText, hoverBg),
    close: onHeader(dot('close')),
    minimize: onHeader(dot('minimize')),
    maximize: onHeader(dot('maximize')),
    focus: onHeader(tok('var(--browser-window-accent-color)')),
  };
  probe.remove();
  return out;
}

const MIN = { url: 4.5, icon: 3, hover: 3, close: 3, minimize: 3, maximize: 3, focus: 3 };

test('browser-window chrome meets contrast minimums per theme and mode', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'colour check is viewport-independent');
  test.setTimeout(120_000);
  const failures = [];
  const all = {};
  for (const scheme of ['light', 'dark']) {
    await load(page, scheme);
    for (const theme of THEMES) {
      for (const m of MODES.filter((x) => x.scheme === scheme)) {
        const r = await page.evaluate(measure, [theme, m.mode]);
        all[`${theme}/${label(m)}`] = r;
        for (const [k, v] of Object.entries(r)) if (v < MIN[k]) failures.push(`${theme}/${label(m)} ${k}: ${v} < ${MIN[k]}`);
      }
    }
  }
  if (process.env.BW_CONTRAST_DUMP) writeFileSync(process.env.BW_CONTRAST_DUMP, JSON.stringify(all, null, 1));
  expect(failures, failures.join('\n')).toEqual([]);
});

test('themes with no data-mode declare a color-scheme matching their surfaces', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'colour check is viewport-independent');
  const failures = [];
  for (const scheme of ['light', 'dark']) {
    await load(page, scheme);
    for (const theme of SCHEME_THEMES) {
      const r = await page.evaluate((t) => {
        const root = document.documentElement;
        root.setAttribute('data-theme', t);
        root.removeAttribute('data-mode');
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        // The theme's own surface (body may carry a desktop/backdrop colour).
        const probe = document.createElement('i');
        document.body.append(probe);
        probe.style.color = 'var(--color-surface)';
        ctx.fillStyle = getComputedStyle(probe).color;
        probe.remove();
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const L = [r, g, b].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
          .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
        return { scheme: getComputedStyle(root).colorScheme, dark: L < 0.18 };
      }, theme);
      const want = r.dark ? 'dark' : 'light';
      if (r.scheme !== want) failures.push(`${theme} (prefers ${scheme}): color-scheme "${r.scheme}" but surfaces are ${want}`);
    }
  }
  expect(failures, failures.join('\n')).toEqual([]);
});
