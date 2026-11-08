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

/** Variants whose label is measured against the button's own effective background (4vhi). */
const VARIANTS = ['primary', 'secondary', 'ghost', 'link'];
const variantButton = (v) => (v === 'link'
  ? '<a data-probe="link" class="button" href="#z">Save</a>'
  : `<button type="button" data-probe="${v}"${v === 'primary' ? '' : ` class="${v}"`}>Save</button>`);

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
      <p data-surface="page">${VARIANTS.map(variantButton).join('\n')}</p>
      <article class="card"><p data-surface="card">${VARIANTS.map(variantButton).join('\n')}</p></article>
      <layout-card><p data-surface="layout-card">${VARIANTS.map(variantButton).join('\n')}</p></layout-card>
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

/**
 * Label contrast on the button's own effective background (vanilla-breeze-4vhi).
 * The background is composited from the button down through every ancestor
 * until an opaque layer: translucent fills (glass) blend over what is behind
 * them, and a gradient contributes each of its stops, so the worst stop is
 * what is measured. Gradient text (background-clip: text with a transparent
 * fill) is measured stop-by-stop against what is behind the button.
 */
function measureLabels([theme, mode]) {
  const root = document.documentElement;
  if (theme === 'default') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  root.removeAttribute('data-accent');
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
  const over = (top, base) => { const a = top[3] / 255; return [0, 1, 2].map((i) => top[i] * a + base[i] * (1 - a)).concat(255); };
  const COLOR = /(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*\)|#[0-9a-f]{3,8}\b|\btransparent\b/gi;
  const stops = (image) => (image && image !== 'none' && /gradient\(/.test(image)
    ? [...image.matchAll(COLOR)].map((m) => rgba(m[0])) : []);
  /** Paint layers of a node, bottom first: its colour, then its gradient's stops (as alternatives). */
  const layersOf = (n) => {
    const cs = getComputedStyle(n);
    if (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text') return [];
    const out = [];
    const c = rgba(cs.backgroundColor);
    if (c[3] > 0) out.push([c]);
    const g = stops(cs.backgroundImage);
    if (g.length) out.push(g);
    return out;
  };
  /** Possible background colours behind (and including) `from`. */
  const backgrounds = (from) => {
    const chain = [];
    for (let n = from; n; n = n.parentElement) {
      const ls = layersOf(n);
      chain.push(ls);
      if (ls.some((alts) => alts.every((x) => x[3] === 255))) break;
    }
    let set = [[255, 255, 255, 255]];
    for (const ls of chain.reverse()) {
      for (const alts of ls) {
        const next = [];
        for (const base of set) for (const a of alts) next.push(over(a, base));
        set = next.slice(0, 64);
      }
    }
    return set;
  };

  const out = [];
  for (const el of document.querySelectorAll('[data-surface] > [data-probe]')) {
    const cs = getComputedStyle(el);
    const gradientText = (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text')
      && rgba(cs.webkitTextFillColor)[3] === 0;
    const bgs = backgrounds(gradientText ? el.parentElement : el);
    const fg = gradientText ? stops(cs.backgroundImage) : [rgba(cs.webkitTextFillColor || cs.color)];
    let worst = Infinity;
    for (const b of bgs) for (const f of fg) worst = Math.min(worst, ratio(over(f, b), b));
    out.push({
      surface: el.parentElement.dataset.surface,
      variant: el.dataset.probe,
      ratio: Math.round(worst * 100) / 100,
      gradient: bgs.length > 1 || fg.length > 1,
    });
  }
  return out;
}

test('every theme keeps button labels at AA on their own background', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'colour check is viewport-independent');
  await load(page);
  const failures = [];
  const table = [];
  for (const theme of themes) {
    for (const mode of MODES) {
      for (const r of await page.evaluate(measureLabels, [theme, mode])) {
        table.push(`${theme}/${mode} ${r.surface} ${r.variant}: ${r.ratio}${r.gradient ? ' (gradient)' : ''}`);
        if (r.ratio < 4.5) failures.push(table.at(-1));
      }
    }
  }
  if (process.env.BUTTON_LABEL_TABLE) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(process.env.BUTTON_LABEL_TABLE, table.join('\n'));
  }
  expect(failures, failures.join('\n')).toEqual([]);
});
