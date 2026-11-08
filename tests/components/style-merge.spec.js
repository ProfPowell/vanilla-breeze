/**
 * Styling/shapes pass follow-ups (merge agent):
 *   - themes restyle only plain rules: hr:not([data-ornament], [class]), so
 *     ornament, .decorative, shape and author-classed hrs keep their look;
 *   - kawaii outgoing bubble text stays AA on both gradient stops;
 *   - counters inside container-query containers: equation numbers span the
 *     sections of an article; ol / footnote list numbering is unaffected.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const THEME_DIR = join(REPO, 'src/tokens/themes');

async function load(page, body, { head = '', theme = '', mode = 'light' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__style-merge-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" data-mode="${mode}"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
}

/* ── hr: one shared theme hook ── */

const HR_THEMES = readdirSync(THEME_DIR)
  .filter((f) => f.startsWith('_extreme-') && readFileSync(join(THEME_DIR, f), 'utf8').includes('hr:not('))
  .map((f) => f.slice('_extreme-'.length, -'.css'.length));

const HR_PACKS = [['memphis', '/src/packs/memphis/memphis.theme.css'], ['kawaii', '/src/packs/kawaii/kawaii.effects.css']];

const HRS = `
  <article>
    <hr id="plain">
    <hr id="decorative" class="decorative">
    <hr id="ornament" data-ornament="✦">
    <hr id="ornament-bare" data-ornament>
    <hr id="wave" class="wave">
    <hr id="zigzag" class="zigzag">
    <hr id="scallop" class="scallop">
    <hr id="diamonds" class="diamonds">
    <hr id="dots" class="dots">
    <hr id="custom" class="my-rule">
  </article>`;

/** Structural look of every hr (colours left out: tokens differ per theme; themes may recolour shape dividers but not reshape them). */
function hrLooks(page) {
  return page.locator('hr').evaluateAll((hrs) => Object.fromEntries(hrs.map((hr) => {
    const cs = getComputedStyle(hr);
    const before = getComputedStyle(hr, '::before');
    const glyph = before.content !== 'none';
    return [hr.id, {
      // Border widths follow --border-width-* tokens (super2026 thickens
      // them); a theme hr rule shows up as a style change instead.
      borderTop: cs.borderTopStyle,
      borderBottom: cs.borderBottomStyle,
      // Glyph rules are as tall as the theme's font, bordered rules as their
      // border; only the shape dividers' own height is fixed.
      height: glyph || cs.borderTopStyle !== 'none' ? '-' : cs.height,
      // Shape dividers may be recoloured (cyber, kawaii gradients).
      backgroundImage: ['plain', 'custom'].includes(hr.id) ? cs.backgroundImage : '-',
      boxShadow: cs.boxShadow === 'none' ? 'none' : 'shadow',
      clipPath: cs.clipPath,
      before: before.content,
    }];
  })));
}

test('themes restyle only plain hr rules (ornament, decorative, shape, classed hrs untouched)', async ({ page }) => {
  expect(HR_THEMES.length).toBeGreaterThan(30);
  const head = [
    ...HR_THEMES.map((t) => `<link rel="stylesheet" href="/src/tokens/themes/_extreme-${t}.css">`),
    ...HR_PACKS.map(([, href]) => `<link rel="stylesheet" href="${href}">`),
  ].join('');
  await load(page, HRS, { head });
  const base = await hrLooks(page);
  let plainChanged = 0;
  for (const theme of [...HR_THEMES, ...HR_PACKS.map(([t]) => t)]) {
    for (const mode of ['light', 'dark']) {
      await page.evaluate(([t, m]) => {
        document.documentElement.dataset.theme = t;
        document.documentElement.dataset.mode = m;
      }, [theme, mode]);
      const looks = await hrLooks(page);
      for (const [id, look] of Object.entries(looks)) {
        if (id === 'plain') continue;
        expect(look, `${theme}/${mode} restyled hr#${id}`).toEqual(base[id]);
      }
      if (JSON.stringify(looks.plain) !== JSON.stringify(base.plain)) plainChanged++;
    }
  }
  // The probe sees theme hr rules: most themes do restyle the plain rule.
  expect(plainChanged).toBeGreaterThan(HR_THEMES.length);
});

test('no theme or pack keeps a hard-coded hr exclusion list', () => {
  const files = [
    ...readdirSync(THEME_DIR).map((f) => join(THEME_DIR, f)),
    ...HR_PACKS.map(([, href]) => join(REPO, href)),
  ].filter((f) => f.endsWith('.css'));
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/hr:not\(([^)]*)\)/g)) {
      expect(m[1], f).toBe('[data-ornament], [class]');
    }
  }
});

/* ── kawaii outgoing bubble contrast ── */

test('kawaii outgoing bubble text is AA on both gradient stops, light and dark', async ({ page }) => {
  await load(page, `
    <p data-bubble="outgoing" id="msg">Sounds good</p>
    <p id="pri" style="background: var(--color-primary)">x</p>
    <p id="lav" style="background: var(--_kawaii-color-lavender)">x</p>`,
  { head: '<link rel="stylesheet" href="/src/tokens/themes/_extreme-kawaii.css">', theme: 'kawaii' });
  for (const mode of ['light', 'dark']) {
    await page.evaluate((m) => { document.documentElement.dataset.mode = m; }, mode);
    const r = await page.evaluate(() => {
      const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d');
      const px = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
      const lum = (rgb) => {
        const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
      const text = px(getComputedStyle(document.getElementById('msg')).color);
      const fill = getComputedStyle(document.getElementById('msg')).getPropertyValue('--bubble-bg');
      return {
        gradient: fill.includes('gradient'),
        primary: ratio(text, px(getComputedStyle(document.getElementById('pri')).backgroundColor)),
        lavender: ratio(text, px(getComputedStyle(document.getElementById('lav')).backgroundColor)),
      };
    });
    expect(r.gradient, mode).toBe(true);
    expect(r.primary, `${mode} primary stop`).toBeGreaterThanOrEqual(4.5);
    expect(r.lavender, `${mode} lavender stop`).toBeGreaterThanOrEqual(4.5);
  }
});

/* ── counters inside container-query containers ── */

/*
 * Counter values are not readable from script, so the probe paints them with
 * an additive counter style (N = N "x"s) and divides the painted width by the
 * width of one "x".
 */
const PROBE = `<style>
  @counter-style merge-probe { system: additive; additive-symbols: 1 "x"; }
  .equation { display: inline-block !important; padding: 0 !important; margin: 0 !important; }
  .equation::after { position: static !important; transform: none !important;
    content: counter(vb-equation, merge-probe) !important; font: 16px/1 monospace !important; letter-spacing: 0 !important; }
  ol.probe { list-style: none; padding: 0; }
  ol.probe > li { inline-size: max-content; padding: 0; margin: 0; }
  ol.probe > li::before { content: counter(list-item, merge-probe); font: 16px/1 monospace; }
  #x { font: 16px/1 monospace; letter-spacing: 0; }
</style><span id="x">x</span>`;

async function counts(page, selector) {
  return page.evaluate((sel) => {
    const x = document.getElementById('x').getBoundingClientRect().width;
    return [...document.querySelectorAll(sel)].map((el) => Math.round(el.getBoundingClientRect().width / x));
  }, selector);
}

test('equation numbers run across the sections and asides of an article', async ({ page }) => {
  await load(page, `${PROBE}
    <article>
      <p class="equation"></p>
      <section><p class="equation"></p><p class="equation"></p></section>
      <aside><p class="equation"></p></aside>
      <section><section><p class="equation"></p></section></section>
    </article>
    <article><section><p class="equation"></p></section></article>`);
  expect(await counts(page, '.equation')).toEqual([1, 2, 3, 4, 5, 1]);
  // The sections stay plain boxes only inside an article with equations.
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('article section')).containerType)).toBe('normal');
});

test('data-container keeps a container (and its own equation numbering)', async ({ page }) => {
  await load(page, `${PROBE}
    <article>
      <p class="equation"></p>
      <section data-container><p class="equation"></p></section>
    </article>
    <article><section><p>No equations here.</p></section></article>`);
  expect(await page.evaluate(() => [...document.querySelectorAll('section')].map((s) => getComputedStyle(s).containerType)))
    .toEqual(['inline-size', 'inline-size']);
});

test('ol and footnote lists number correctly inside section / aside / article containers', async ({ page }) => {
  await load(page, `${PROBE}
    <article>
      <section><ol class="probe"><li></li><li></li><li></li></ol></section>
      <aside><ol class="probe footnotes"><li></li><li></li></ol></aside>
      <section><ol class="probe" start="4"><li></li><li></li></ol></section>
    </article>`);
  expect(await counts(page, 'ol.probe > li')).toEqual([1, 2, 3, 1, 2, 4, 5]);
});
