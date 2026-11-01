/**
 * Themed site pages: screenshots + an AA text-contrast check (vanilla-breeze-pl21).
 *
 * The other visual suites cover demos and element fixtures, never the site
 * itself, so theme-only regressions on real doc pages shipped unnoticed:
 * border auto-apply framing every form under ~28 themes, the homepage tab
 * panels stacking, win9x text on the teal desktop. This suite loads five
 * representative pages under deliberately aggressive themes in light and
 * dark mode, screenshots them, and measures every text node in <main>
 * against its painted background.
 *
 * Themes are applied the way ThemeManager.apply() does it: data-theme and
 * data-mode on <html>, the theme stylesheet loaded, and the theme's
 * --theme-border-style hint copied onto data-border-style.
 *
 * Known contrast findings live in site-pages-contrast.known.json (one line
 * per page/theme/mode/element-on-background, with the worst ratio). A new
 * finding fails; a known one that is fixed also fails, so the file shrinks.
 * Refresh it deliberately with VB_CONTRAST_UPDATE=1.
 */
import { test, expect } from './pinned-fonts.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PAGES = [
  ['home', '/'],
  ['quick-start', '/docs/quick-start/'],
  ['component', '/docs/elements/web-components/tabs/'],
  ['form', '/docs/elements/native/form/'],
  ['typography', '/docs/typography/'],
];

// Control, then the themes most likely to break things, then a11y control.
const THEMES = [
  'default', 'brutalist', 'vaporwave', 'kawaii', 'terminal',
  '8bit', 'glassmorphism', 'rough', 'win9x', 'a11y-high-contrast',
];
const MODES = ['light', 'dark'];

const KNOWN_FILE = join(import.meta.dirname, 'site-pages-contrast.known.json');
const UPDATE = !!process.env.VB_CONTRAST_UPDATE;
const known = existsSync(KNOWN_FILE) ? JSON.parse(readFileSync(KNOWN_FILE, 'utf8')) : {};
const found = {};

async function applyTheme(page, theme, mode) {
  await page.evaluate(async ({ theme, mode }) => {
    const root = document.documentElement;
    const isBundled = theme === 'default' || theme.startsWith('a11y-');
    if (!isBundled) {
      const m = await (await fetch('/cdn/themes/manifest.json')).json();
      if (!m[theme]) throw new Error(`unknown theme ${theme}`);
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = `/cdn/themes/${m[theme].file}`;
      document.head.append(l);
      await new Promise((r) => { l.onload = r; l.onerror = r; });
    }
    if (theme === 'default') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', mode);
    const hint = getComputedStyle(root).getPropertyValue('--theme-border-style').trim();
    if (hint) root.dataset.borderStyle = hint;
    else delete root.dataset.borderStyle;
    await document.fonts.ready;
  }, { theme, mode });
}

/** Text nodes in <main> under AA, grouped by "tag on background-owner". */
function measureContrast() {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const x = c.getContext('2d', { willReadFrequently: true });
  const rgba = (s) => { x.clearRect(0, 0, 1, 1); x.fillStyle = '#000'; x.fillStyle = s; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data]; };
  const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [p, q] = [lum(a), lum(b)].sort((m, n) => n - m); return (p + 0.05) / (q + 0.05); };
  const label = (n) => n.tagName.toLowerCase() + (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/)[0] : '');
  const bgOf = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      // Skip elements whose background is an image/gradient: contrast
      // against a single colour would be meaningless there.
      if (cs.backgroundImage !== 'none' && n !== document.body && n !== document.documentElement) return null;
      const v = rgba(cs.backgroundColor);
      if (v[3] > 200) return { v, owner: label(n) };
    }
    return { v: [255, 255, 255, 255], owner: 'canvas' };
  };
  const bad = {};
  const main = document.querySelector('main');
  if (!main) return bad;
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (!t.textContent.trim()) continue;
    const el = t.parentElement;
    if (!el || !el.getClientRects().length) continue;
    // Skip previews of other themes/sites and code with its own palette.
    if (el.closest('browser-window, code-block, [hidden], svg, [data-theme]:not(html), .example, [aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || +cs.opacity < 0.1) continue;
    const bg = bgOf(el);
    if (!bg) continue;
    const r = ratio(rgba(cs.color), bg.v);
    const size = parseFloat(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
    if (r < (large ? 3 : 4.5)) {
      const k = `${label(el)} on ${bg.owner}`;
      bad[k] = Math.min(bad[k] ?? 99, Math.round(r * 100) / 100);
    }
  }
  return bad;
}

test.describe('site pages under aggressive themes', () => {
  // Update mode needs every result in one worker to write the file.
  if (UPDATE) test.describe.configure({ mode: 'serial' });

  // Update mode rewrites the file from this run, so fixed findings drop out.
  test.afterAll(() => {
    if (UPDATE) writeFileSync(KNOWN_FILE, JSON.stringify(Object.fromEntries(Object.entries(found).sort()), null, 2) + '\n');
  });

  for (const [pageId, path] of PAGES) {
    for (const theme of THEMES) {
      for (const mode of MODES) {
        test(`${pageId} · ${theme} · ${mode}`, async ({ page }, info) => {
          test.skip(info.project.name !== 'desktop', 'desktop matrix; phone layout is covered elsewhere');
          await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: mode });
          await page.goto(path, { waitUntil: 'networkidle' });
          await applyTheme(page, theme, mode);
          // Let theme fonts, scroll-triggered tickers and lazy content settle.
          await page.waitForTimeout(700);

          const id = `${pageId}--${theme}--${mode}`;
          await expect(page).toHaveScreenshot(`${id}.png`, { animations: 'disabled', maxDiffPixelRatio: 0.01 });
          if (pageId === 'home') {
            await expect(page.locator('.pe-section')).toHaveScreenshot(`${id}--pe.png`, { animations: 'disabled', maxDiffPixelRatio: 0.01 });
          }

          const bad = await page.evaluate(measureContrast);
          const keys = Object.keys(bad).map((k) => `${id} | ${k}`);
          for (const k of keys) found[k] = bad[k.split(' | ')[1]];
          if (UPDATE) return;
          const expected = Object.keys(known).filter((k) => k.startsWith(`${id} | `));
          const unexpected = keys.filter((k) => !(k in known));
          const fixed = expected.filter((k) => !keys.includes(k));
          expect(unexpected, `new AA contrast failures:\n${unexpected.map((k) => `${k}: ${bad[k.split(' | ')[1]]}`).join('\n')}`).toEqual([]);
          expect(fixed, `fixed — remove from site-pages-contrast.known.json:\n${fixed.join('\n')}`).toEqual([]);
        });
      }
    }
  }
});
