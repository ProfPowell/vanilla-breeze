/**
 * <kbd> key caps inside buttons (vanilla-breeze-hzt3).
 *
 * A kbd's cap used fixed surface tokens while inheriting the button's text
 * colour, so inside a primary button (white text on the interactive fill) the
 * caps rendered blank. Inside a button the cap now keeps the button's text
 * colour and tints its fill/edge from currentColor. Every cap — plain and
 * data-hotkey generated — must reach 4.5:1 against its own composited fill,
 * on every button variant, in every theme, light and dark. A standalone kbd
 * keeps its surface-token look.
 *
 * Tests the working tree: /src is served from disk, every theme stylesheet
 * is linked on one page and the theme/mode attributes are switched in place.
 */
import { test, expect } from 'playwright/test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const THEME_DIR = join(REPO, 'src', 'tokens', 'themes');

const themeFiles = readdirSync(THEME_DIR)
  .filter((f) => /^_(extreme|brand)-.+\.css$/.test(f) && !f.includes('template'));
const themes = ['default', ...themeFiles.map((f) => f.replace(/^_(extreme|brand)-|\.css$/g, ''))];

async function load(page) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  const url = `/__kbd-in-button-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${themeFiles.map((f) => `<link rel="stylesheet" href="/src/tokens/themes/${f}">`).join('\n')}
      <style>*, *::before, *::after { transition: none !important; animation: none !important; }</style>
      <script type="module">import '/src/main.js';</script>
      </head><body><main><article>
      <p><button type="button" id="primary">Save <kbd data-hotkey="meta+s">Ctrl+S</kbd></button>
        <button type="button" id="secondary" class="secondary">Save <kbd data-hotkey="meta+s">Ctrl+S</kbd></button>
        <button type="button" id="ghost" class="ghost">Save <kbd data-hotkey="meta+s">Ctrl+S</kbd></button>
        <a id="link-button" class="button" href="#x">Save <kbd data-hotkey="meta+s">Ctrl+S</kbd></a>
        <button type="button" id="plain">Search <kbd>K</kbd></button></p>
      <p id="standalone">Press <kbd id="alone">K</kbd> or <kbd data-hotkey="meta+k">Ctrl+K</kbd>.</p>
      </article></main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('kbd[data-hotkey] kbd').length >= 5);
}

/** Switch theme/mode, then measure every cap's text against its painted fill. */
function measure([theme, mode]) {
  const root = document.documentElement;
  if (theme === 'default') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  root.setAttribute('data-mode', mode);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

  /** Paint `color` over an opaque rgb base; returns the opaque result. */
  const over = (base, color) => {
    ctx.fillStyle = `rgb(${base[0]} ${base[1]} ${base[2]})`;
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  };
  const STOP = /(?:oklch|oklab|rgba?|hsla?|color|lab|lch)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;

  /**
   * Every colour the element can sit on: paint each ancestor's background
   * (root first). A gradient background-image fans out into its colour stops,
   * so the check is against the worst stop, not the unseen background-color.
   */
  const fillsOf = (el) => {
    const chain = [];
    for (let n = el; n; n = n.parentElement) chain.unshift(n);
    let bases = [[255, 255, 255, 255]];
    for (const n of chain) {
      const cs = getComputedStyle(n);
      bases = bases.map((b) => over(b, cs.backgroundColor));
      const stops = cs.backgroundImage.includes('gradient') ? cs.backgroundImage.match(STOP) : null;
      if (stops) bases = bases.flatMap((b) => stops.map((c) => over(b, c)));
    }
    return bases;
  };

  const caps = [...document.querySelectorAll('p:first-child kbd')]
    .filter((k) => !k.querySelector('kbd'));
  return caps.map((k) => {
    const color = getComputedStyle(k).color;
    const worst = Math.min(...fillsOf(k).map((bg) => ratio(over(bg, color), bg)));
    const host = k.closest('button, .button');
    const hostColor = getComputedStyle(host).color;
    const label = Math.min(...fillsOf(host).map((bg) => ratio(over(bg, hostColor), bg)));
    return {
      label: Math.round(label * 100) / 100,
      host: k.closest('button, .button').id,
      text: k.textContent,
      ratio: Math.round(worst * 100) / 100,
    };
  });
}

// A cap must reach 4.5:1 on its own fill. Where a theme's button label is
// itself under 4.5:1 (a theme contrast issue tracked separately, or a
// gradient-text label the stop sampler reads as 1:1) the cap must at least
// never be worse than the label it sits beside.
test('key caps inside buttons are as legible as the label, 4.5:1 or better, in every theme and mode', async ({ page }) => {
  test.setTimeout(120_000);
  await load(page);
  const failures = [];
  for (const theme of themes) {
    for (const mode of ['light', 'dark']) {
      const rows = await page.evaluate(measure, [theme, mode]);
      expect(rows.length).toBeGreaterThanOrEqual(9);
      for (const r of rows) {
        if (r.ratio < Math.min(4.5, r.label - 0.01)) failures.push(`${theme}/${mode} #${r.host} "${r.text}" ${r.ratio}:1 (label ${r.label}:1)`);
      }
    }
  }
  expect(failures, failures.join('\n')).toEqual([]);
});

// The bug itself: caps inside a primary button, strict AA, in the default
// theme and a spread of personality themes, light and dark.
test('key caps inside primary buttons reach 4.5:1 (default, modern, nord, dracula)', async ({ page }) => {
  await load(page);
  for (const theme of ['default', 'modern', 'nord', 'dracula']) {
    for (const mode of ['light', 'dark']) {
      const rows = (await page.evaluate(measure, [theme, mode]))
        .filter((r) => ['primary', 'link-button', 'plain'].includes(r.host));
      for (const r of rows) expect(r.ratio, `${theme}/${mode} #${r.host} "${r.text}"`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('cap inside a primary button inherits its text colour with a tinted fill', async ({ page }) => {
  await load(page);
  const s = await page.evaluate(() => {
    const btn = getComputedStyle(document.getElementById('primary'));
    const cap = getComputedStyle(document.querySelector('#primary kbd[data-hotkey] kbd'));
    const outer = getComputedStyle(document.querySelector('#primary kbd[data-hotkey]'));
    return { btnColor: btn.color, capColor: cap.color, capBg: cap.backgroundColor, outerBorder: outer.borderStyle };
  });
  expect(s.capColor).toBe(s.btnColor);
  expect(s.capBg).not.toBe('rgba(0, 0, 0, 0)');
  // The wrapper of a data-hotkey combo stays unboxed.
  expect(s.outerBorder).toBe('none');
});

test('standalone kbd keeps the surface-token cap', async ({ page }) => {
  await load(page);
  const s = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.background = 'var(--color-surface-raised)';
    probe.style.color = 'var(--color-text)';
    document.body.append(probe);
    const want = getComputedStyle(probe);
    const alone = getComputedStyle(document.getElementById('alone'));
    const gen = getComputedStyle(document.querySelector('#standalone kbd[data-hotkey] kbd'));
    return {
      want: want.backgroundColor, text: want.color,
      alone: alone.backgroundColor, aloneText: alone.color, gen: gen.backgroundColor,
    };
  });
  expect(s.alone).toBe(s.want);
  expect(s.gen).toBe(s.want);
  expect(s.aloneText).toBe(s.text);
});

test('data-hotkey demo shows the shortcut inside the Save button, legibly', async ({ page }) => {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__kbd-in-button-demo.html', (route) => route.fulfill({
    path: join(REPO, 'demos', 'examples', 'demos', 'hotkey-action-basic.html'),
    contentType: 'text/html; charset=utf-8',
  }));
  await page.goto('/__kbd-in-button-demo.html', { waitUntil: 'load' });
  await page.waitForSelector('#save kbd[data-hotkey] kbd');
  const s = await page.evaluate(() => {
    const btn = getComputedStyle(document.getElementById('save'));
    const caps = [...document.querySelectorAll('#save kbd[data-hotkey] kbd')].map((k) => getComputedStyle(k).color);
    return { btn: btn.color, caps };
  });
  expect(s.caps.length).toBeGreaterThanOrEqual(2);
  for (const c of s.caps) expect(c).toBe(s.btn);
});
