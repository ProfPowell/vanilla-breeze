/**
 * Buttons and links under every theme (vanilla-breeze-cck8, -ky97).
 *
 * Size parity (cck8): button padding subtracts the border width (--_bw), so
 * primary, secondary and ghost end up the same height. Themes that want a
 * button border set the public --btn-border-width hook; a theme that sets a
 * `border` shorthand instead changes the width behind the padding's back and
 * the bordered variants drift a pixel or two from the rest. Every theme, in
 * light and dark mode, must keep all variants (and the small/large pairs)
 * within 0.5px of each other.
 *
 * Interactive contrast (ky97): the theme's --color-interactive is the text
 * colour of outline buttons and body links. Both, and the primary button's
 * label on its fill, must reach 4.5:1 against what they are painted on, in
 * every theme and mode and under every colour accent.
 *
 * Tests the working tree: /src is served from disk, every theme stylesheet
 * is linked on one page and the theme/mode attributes are switched in place
 * (transitions off, so each switch is measured at its end state).
 */
import { test, expect } from 'playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const THEME_DIR = join(REPO, 'src', 'tokens', 'themes');

const themeFiles = readdirSync(THEME_DIR)
  .filter((f) => /^_(extreme|brand)-.+\.css$/.test(f) && !f.includes('template'));
const themes = ['default', ...themeFiles.map((f) => f.replace(/^_(extreme|brand)-|\.css$/g, ''))];
const accents = [...new Set([...readFileSync(join(THEME_DIR, '_accents.css'), 'utf8')
  .matchAll(/data-accent~="([a-z-]+)"/g)].map((m) => m[1]))];

async function load(page) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  // Theme webfonts come from Google Fonts: keep the run offline and stable.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  const url = `/__button-theme-parity-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${themeFiles.map((f) => `<link rel="stylesheet" href="/src/tokens/themes/${f}">`).join('\n')}
      <style>*, *::before, *::after { transition: none !important; animation: none !important; }</style>
      </head><body><main><article>
      <p><button type="button" id="primary">Save</button>
        <button type="button" id="secondary" class="secondary">Save</button>
        <button type="button" id="ghost" class="ghost">Save</button>
        <a id="link-button" class="button" href="#x">Save</a></p>
      <p><button type="button" id="primary-small" class="small">Save</button>
        <button type="button" id="secondary-small" class="secondary small">Save</button>
        <button type="button" id="primary-large" class="large">Save</button>
        <button type="button" id="secondary-large" class="secondary large">Save</button></p>
      <p>Body text with <a id="link" href="#y">a link</a> inside.</p>
      </article></main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Switch theme/accent/mode the way ThemeManager does, then measure. */
function measure([theme, accent, mode]) {
  const root = document.documentElement;
  if (theme === 'default') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  if (accent) root.setAttribute('data-accent', accent);
  else root.removeAttribute('data-accent');
  root.setAttribute('data-mode', mode);
  delete root.dataset.borderStyle;
  const hint = getComputedStyle(root).getPropertyValue('--theme-border-style').trim();
  if (hint) root.dataset.borderStyle = hint;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
  const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const behind = (el) => {
    for (let n = el.parentElement; n; n = n.parentElement) {
      const v = rgba(getComputedStyle(n).backgroundColor);
      if (v[3] > 200) return v;
    }
    return [255, 255, 255, 255];
  };
  /** Text contrast on the element's own fill, else what is behind it; null over a gradient. */
  const contrast = (id) => {
    const el = document.getElementById(id);
    const cs = getComputedStyle(el);
    if (cs.backgroundImage !== 'none') return null;
    const own = rgba(cs.backgroundColor);
    return Math.round(ratio(rgba(cs.color), own[3] > 200 ? own : behind(el)) * 100) / 100;
  };
  const h = (id) => document.getElementById(id).getBoundingClientRect().height;
  return {
    heights: {
      default: ['primary', 'secondary', 'ghost', 'link-button'].map(h),
      small: ['primary-small', 'secondary-small'].map(h),
      large: ['primary-large', 'secondary-large'].map(h),
    },
    contrast: { primary: contrast('primary'), secondary: contrast('secondary'), link: contrast('link') },
  };
}

const MODES = ['light', 'dark'];

test('every theme keeps button variants the same height', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'size parity is viewport-independent');
  await load(page);
  const failures = [];
  for (const theme of themes) {
    for (const mode of MODES) {
      const { heights } = await page.evaluate(measure, [theme, null, mode]);
      for (const [set, hs] of Object.entries(heights)) {
        const spread = Math.max(...hs) - Math.min(...hs);
        if (spread > 0.5) failures.push(`${theme}/${mode} ${set}: ${hs.map((v) => v.toFixed(2)).join(' / ')}`);
      }
    }
  }
  expect(failures, failures.join('\n')).toEqual([]);
});

test('every theme and accent keeps interactive text at AA', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'colour check is viewport-independent');
  await load(page);
  const cases = [
    ...themes.map((t) => [t, null]),
    ...accents.map((a) => ['default', a]),
  ];
  const failures = [];
  for (const [theme, accent] of cases) {
    for (const mode of MODES) {
      const { contrast } = await page.evaluate(measure, [theme, accent, mode]);
      for (const [what, r] of Object.entries(contrast)) {
        if (r !== null && r < 4.5) failures.push(`${accent ? `accent ${accent}` : theme}/${mode} ${what}: ${r}`);
      }
    }
  }
  expect(failures, failures.join('\n')).toEqual([]);
});
