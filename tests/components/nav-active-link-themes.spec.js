/**
 * Nav's current-page link stays readable under every theme (vanilla-breeze-s3e3).
 *
 * ~40 themes color `a` / `a:not([class])` with selectors that also reach nav
 * links, and @layer bundle-theme outranks native-elements. Nav keeps its
 * active link readable with a deliberate layered !important on
 * color: var(--_active-color), which resolves from --color-active-text
 * (plain nav) or --color-text-on-primary (nav.pills). This test loads every
 * theme stylesheet on one page and, for each theme in light and dark mode,
 * checks the active link is legible against its effective background and
 * (plain nav) uses the active-text token, plus that sites can override the
 * colour through the documented tokens. Transitions are disabled so a theme
 * switch is measured at its end state, not mid-fade.
 */
import { test, expect } from 'playwright/test';

async function page404(page, manifestThemes) {
  const url = '/__nav-active-themes.html';
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/cdn/vanilla-breeze.css">
      <style>*, *::before, *::after { transition: none !important; animation: none !important; }</style>
      ${manifestThemes.map((t) => `<link rel="stylesheet" href="/cdn/themes/${t.file}">`).join('\n')}
      </head><body>
      <nav id="plain" aria-label="Plain"><ul><li><a href="/a/">Home</a></li><li><a href="/b/" aria-current="page">Docs</a></li></ul></nav>
      <nav id="pills" class="pills" aria-label="Pills"><ul><li><a href="/a/">Home</a></li><li><a href="/b/" aria-current="page">Docs</a></li></ul></nav>
      </body></html>`,
  }));
  await page.goto(url, { waitUntil: 'networkidle' });
}

// Theme palettes whose link colour itself is under 3:1 on their light page
// background (all links, not just nav). Tracked in vanilla-breeze-h887; delete an entry when
// its theme is fixed. Anything new failing here is a regression.
const KNOWN_LOW_CONTRAST = new Set(['win9x/light/plain']);

test('every theme keeps nav active links legible and on the active tokens', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'colour check is viewport-independent');
  const manifest = await (await page.request.get('/cdn/themes/manifest.json')).json();
  const themes = Object.entries(manifest).map(([id, t]) => ({ id, file: t.file }));
  await page404(page, themes);

  const failures = await page.evaluate((ids) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
    const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
      .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const effectiveBg = (el) => {
      for (let n = el; n; n = n.parentElement) {
        const c = getComputedStyle(n).backgroundColor;
        if (rgba(c)[3] > 0 && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return rgba(c);
      }
      return [255, 255, 255, 255];
    };
    const out = [];
    const root = document.documentElement;
    for (const id of ids) {
      for (const mode of ['light', 'dark']) {
        root.setAttribute('data-theme', id);
        root.setAttribute('data-mode', mode);
        for (const navId of ['plain', 'pills']) {
          const a = document.querySelector(`#${navId} a[aria-current="page"]`);
          const cs = getComputedStyle(a);
          const fg = rgba(cs.color);
          const r = ratio(fg, effectiveBg(a));
          if (r < 3) out.push(`${id}/${mode}/${navId}: contrast ${r.toFixed(2)}`);
          if (navId === 'plain') {
            const token = rgba(cs.getPropertyValue('--color-active-text').trim() || cs.color);
            if (token.slice(0, 3).join() !== fg.slice(0, 3).join()) out.push(`${id}/${mode}/plain: not using --color-active-text`);
          }
        }
      }
    }
    return out;
  }, themes.map((t) => t.id));

  const unexpected = failures.filter((f) => !KNOWN_LOW_CONTRAST.has(f.split(':')[0]));
  expect(unexpected, unexpected.join('\n')).toEqual([]);
  // Keep the allowlist honest: an entry that now passes should be removed.
  const fixed = [...KNOWN_LOW_CONTRAST].filter((k) => !failures.some((f) => f.startsWith(`${k}:`)));
  expect(fixed, `now passing, remove from KNOWN_LOW_CONTRAST: ${fixed.join(', ')}`).toEqual([]);
});

test('sites can recolour the active link through --color-active-text / --color-active-bg', async ({ page }) => {
  await page404(page, []);
  await page.addStyleTag({ content: '#plain { --color-active-text: rgb(1, 2, 3); --color-active-bg: rgb(250, 240, 200); }' });
  const style = await page.locator('#plain a[aria-current="page"]').evaluate((a) => {
    const cs = getComputedStyle(a);
    return [cs.color, cs.backgroundColor];
  });
  expect(style).toEqual(['rgb(1, 2, 3)', 'rgb(250, 240, 200)']);
});
