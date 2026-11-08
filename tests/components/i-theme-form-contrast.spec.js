/**
 * Form-control edges under every theme (vanilla-breeze-9vrm).
 *
 * WCAG 1.4.11 (non-text contrast): the boundary that identifies a control
 * must reach 3:1 against what it sits on. For each theme in light and dark
 * mode this measures the text input, checkbox, radio, unchecked switch
 * track, range track and data-stepper wrapper and takes the strongest of
 * their boundaries against the page surface behind them: the border (when
 * it is at least 1px wide, composited over the control's fill) or the
 * control's own fill. Every one must reach 3:1.
 *
 * Covers every token theme plus the memphis and kawaii packs (their
 * *.theme.css carries the form-control tokens and rules).
 *
 * Tests the working tree: /src is served from disk, every theme stylesheet
 * is linked after main.css on one page and data-theme / data-mode are
 * switched on <html> in place (transitions off, so each switch is measured
 * at its end state).
 */
import { test, expect } from 'playwright/test';
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const THEME_DIR = join(REPO, 'src', 'tokens', 'themes');

const themeFiles = readdirSync(THEME_DIR)
  .filter((f) => /^_(extreme|brand)-.+\.css$/.test(f) && !f.includes('template'));
// Packs apply with data-theme="<pack>" like a theme; only their theme CSS
// touches form controls.
const PACKS = ['memphis', 'kawaii'];
const sheets = [
  ...themeFiles.map((f) => `/src/tokens/themes/${f}`),
  ...PACKS.map((p) => `/src/packs/${p}/${p}.theme.css`),
];
const themes = ['default', ...themeFiles.map((f) => f.replace(/^_(extreme|brand)-|\.css$/g, '')), ...PACKS];
const MODES = ['light', 'dark'];
const MIN = 3;

async function load(page) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  // Theme webfonts come from Google Fonts: keep the run offline and stable.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  const url = `/__i-theme-form-contrast-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${sheets.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n')}
      <style>*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }</style>
      </head><body><main><article><form>
      <label for="text">Name</label> <input type="text" id="text">
      <label><input type="checkbox" id="checkbox"> Box</label>
      <label><input type="radio" id="radio" name="r"> Radio</label>
      <label><input type="checkbox" data-switch id="switch"> Switch</label>
      <input type="range" id="range" aria-label="Range">
      <div class="number-wrapper" id="stepper"><button type="button" aria-label="Decrease">-</button><input type="number" value="1" aria-label="Count"><button type="button" aria-label="Increase">+</button></div>
      </form></article></main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Switch theme/mode the way ThemeManager does, then measure each control's edge. */
function measure([theme, mode]) {
  const root = document.documentElement;
  if (theme === 'default') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  root.setAttribute('data-mode', mode);
  delete root.dataset.borderStyle;
  const hint = getComputedStyle(root).getPropertyValue('--theme-border-style').trim();
  if (hint) root.dataset.borderStyle = hint;

  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  // Resolve tokens (light-dark(), var(), color-mix()) through a probe so the
  // canvas only ever sees a computed colour.
  const probe = document.createElement('i');
  document.querySelector('form').append(probe);
  const rgba = (css) => {
    probe.style.color = 'transparent';
    probe.style.color = css;
    const c = getComputedStyle(probe).color;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = c;
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
  /** The opaque surface behind an element (backdrop: the theme's page background). */
  const behind = (el) => {
    let acc = null;
    const stack = [];
    for (let n = el.parentElement; n; n = n.parentElement) {
      const v = rgba(getComputedStyle(n).backgroundColor);
      if (v[3] > 0) stack.push(v);
      if (v[3] > 250) break;
    }
    acc = rgba(getComputedStyle(root).getPropertyValue('--color-background').trim() || '#fff');
    if (acc[3] < 250) acc = [255, 255, 255, 255];
    for (const v of stack.reverse()) acc = over(v, acc);
    return acc;
  };

  /** Best boundary of a box against its surface: border (>=1px) over its fill, or the fill itself. */
  const edge = (el, fillCss) => {
    const cs = getComputedStyle(el);
    const page = behind(el);
    const fill = over(rgba(fillCss ?? cs.backgroundColor), page);
    const sides = ['Top', 'Right', 'Bottom', 'Left']
      .filter((s) => parseFloat(cs[`border${s}Width`]) >= 1 && cs[`border${s}Style`] !== 'none')
      .map((s) => cr(over(rgba(cs[`border${s}Color`]), fill), page));
    const border = sides.length ? Math.max(...sides) : 0;
    // Hard-edged (unblurred) box-shadows draw bevels and pixel borders
    // (win9x, NES); blurred ones are soft depth cues, not boundaries.
    const shadows = cs.boxShadow === 'none' ? [] : cs.boxShadow.split(/,(?![^(]*\))/).map((s) => {
      const color = s.match(/(?:rgba?|oklch|oklab|color|lab|lch|hsla?)\([^)]*\)|#[0-9a-f]+|\b[a-z]+\b(?=\s|$)/i)?.[0];
      const [x = 0, y = 0, blur = 0, spread = 0] = (s.replace(color ?? '', '').match(/-?[\d.]+px/g) ?? []).map(parseFloat);
      return { color, hard: blur === 0 && (Math.abs(x) >= 1 || Math.abs(y) >= 1 || spread >= 1) };
    }).filter((s) => s.hard && s.color && s.color !== 'inset')
      .map((s) => cr(over(rgba(s.color), fill), page));
    return Math.round(Math.max(border, cr(fill, page), ...shadows) * 100) / 100;
  };

  const $ = (id) => document.getElementById(id);
  const range = $('range');
  const out = {
    text: edge($('text')),
    checkbox: edge($('checkbox')),
    radio: edge($('radio')),
    switch: edge($('switch')),
    range: Math.round(cr(over(rgba(getComputedStyle(range).getPropertyValue('--range-track-bg').trim()), behind(range)), behind(range)) * 100) / 100,
    stepper: edge($('stepper'), 'transparent'),
  };
  probe.remove();
  return out;
}

test('every theme and pack keeps form-control edges at 3:1 in light and dark', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'colour check is viewport-independent');
  test.setTimeout(120_000);
  await load(page);
  const failures = [];
  const all = {};
  for (const theme of themes) {
    for (const mode of MODES) {
      const r = await page.evaluate(measure, [theme, mode]);
      all[`${theme}/${mode}`] = r;
      for (const [what, v] of Object.entries(r)) {
        if (v < MIN) failures.push(`${theme}/${mode} ${what}: ${v}`);
      }
    }
  }
  if (process.env.FORM_CONTRAST_DUMP) writeFileSync(process.env.FORM_CONTRAST_DUMP, JSON.stringify(all, null, 1));
  expect(failures, failures.join('\n')).toEqual([]);
});

test('data-stepper wrapper keeps a focus outline in forced colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page);
  await page.focus('#stepper input');
  const outline = await page.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('stepper'));
    return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(outline.style).toBe('solid');
  expect(outline.width).toBeGreaterThanOrEqual(2);
});
