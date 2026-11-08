/**
 * S review — native forms/disclosure: select, selectedcontent, search, summary.
 *
 * Covers:
 * - rich <select> trigger button: no global button min size, so a rich
 *   select is as tall as a plain one; theme button skins (nes, win9x,
 *   brutalist, neumorphism, kawaii) do not reach the trigger.
 * - <search> variants style controls inside a direct <form> child, the
 *   functional markup (inline, compact, rounded, expanded, with-icon).
 * - summary under nes/win9x: one indicator (core ::after removed), label
 *   at inline start, glyph kept out of the accessible name, NES triangle
 *   mirrored in RTL; nav.tree +/- glyph kept out of the name.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const THEMES = ['nes', 'win9x', 'brutalist', 'neumorphism', 'kawaii'];

async function load(page, body, { dir = 'ltr', theme = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  // Theme webfonts come from Google Fonts: keep the run offline and stable.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
  const url = `/__s9-forms-disclosure-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${THEMES.map((t) => `<link rel="stylesheet" href="/src/tokens/themes/_extreme-${t}.css">`).join('\n')}
      <style>*, *::before, *::after { transition: none !important; animation: none !important; }</style>
      </head><body><main><article>${body}</article></main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const SELECTS = `
  <label for="plain">Country</label>
  <select id="plain" name="plain">
    <option value="us">United States</option>
    <option value="ca">Canada</option>
  </select>
  <label for="rich">Language</label>
  <select id="rich" name="rich">
    <button type="button"><selectedcontent></selectedcontent></button>
    <option value="en"><span aria-hidden="true">E</span> English <span class="detail"> - American</span></option>
    <option value="fr"><span aria-hidden="true">F</span> Fran&ccedil;ais <span class="detail"> - French</span></option>
  </select>`;

/** @param {import('playwright/test').Page} page */
const measureSelects = (page) => page.evaluate(() => {
  const plain = /** @type {HTMLElement} */ (document.getElementById('plain'));
  const rich = /** @type {HTMLElement} */ (document.getElementById('rich'));
  const btn = /** @type {HTMLElement} */ (rich.querySelector('button'));
  const cs = getComputedStyle(btn);
  return {
    supported: CSS.supports('appearance', 'base-select'),
    plainH: plain.getBoundingClientRect().height,
    richH: rich.getBoundingClientRect().height,
    btn: {
      minBlock: cs.minBlockSize,
      minInline: cs.minInlineSize,
      radius: cs.borderTopLeftRadius,
      justify: cs.justifyContent,
      bg: cs.backgroundColor,
      bgImage: cs.backgroundImage,
      shadow: cs.boxShadow,
      borderWidth: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth],
      padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft],
    },
  };
});

for (const theme of ['', ...THEMES]) {
  test(`select: rich trigger is a plain content slot (${theme || 'default'} theme)`, async ({ page }) => {
    await load(page, SELECTS, { theme });
    const m = await measureSelects(page);
    test.skip(!m.supported, 'appearance: base-select not supported');
    expect(m.btn.minBlock).toBe('0px');
    expect(m.btn.minInline).toBe('0px');
    expect(m.btn.radius).toBe('0px');
    expect(['start', 'flex-start', 'normal']).toContain(m.btn.justify);
    expect(m.btn.bg).toBe('rgba(0, 0, 0, 0)');
    expect(m.btn.bgImage).toBe('none');
    expect(m.btn.shadow).toBe('none');
    expect(m.btn.borderWidth).toEqual(['0px', '0px', '0px', '0px']);
    expect(m.btn.padding).toEqual(['0px', '0px', '0px', '0px']);
    // Same box as a plain select (allow sub-pixel font/emoji rounding).
    expect(Math.abs(m.richH - m.plainH)).toBeLessThanOrEqual(2);
  });
}

test('select: required placeholder makes the select invalid until a value is chosen', async ({ page }) => {
  await load(page, `<form><label for="req">Plan</label>
    <select id="req" name="plan" required>
      <option value="">Choose a plan...</option>
      <option value="free">Free</option>
    </select></form>`);
  const r = await page.evaluate(() => {
    const s = /** @type {HTMLSelectElement} */ (document.getElementById('req'));
    const before = s.validity.valueMissing;
    s.value = 'free';
    return { before, after: s.validity.valueMissing };
  });
  expect(r).toEqual({ before: true, after: false });
});

const SEARCHES = `
  <search id="inline" class="inline"><form method="get">
    <input type="search" name="q" aria-label="Search"><button type="submit">Search</button>
  </form></search>
  <search id="compact" class="compact inline"><form method="get">
    <input type="search" name="q" aria-label="Quick search"><button type="submit">Find</button>
  </form></search>
  <search id="rounded" class="inline rounded"><form method="get">
    <input type="search" name="q" aria-label="Search rounded"><button type="submit">Go</button>
  </form></search>
  <search id="expanded" class="expanded"><form method="get">
    <input type="search" name="q" aria-label="Search all">
  </form></search>
  <search id="icon" class="with-icon rounded"><form method="get">
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="7" cy="7" r="5"/></svg>
    <input type="search" name="q" aria-label="Search with icon">
  </form></search>
  <search id="bare" class="inline">
    <input type="search" aria-label="Filter"><button type="button">Clear</button>
  </search>`;

test('search: variants style controls inside a direct form child', async ({ page }) => {
  await load(page, SEARCHES);
  const r = await page.evaluate(() => {
    const q = (/** @type {string} */ sel) => /** @type {HTMLElement} */ (document.querySelector(sel));
    const cs = (/** @type {string} */ sel) => getComputedStyle(q(sel));
    const plainInputFont = parseFloat(getComputedStyle(document.body).fontSize);
    return {
      inlineForm: cs('#inline > form').display,
      inlineGrow: cs('#inline input').flexGrow,
      inlineSameRow: Math.abs(q('#inline input').getBoundingClientRect().top - q('#inline button').getBoundingClientRect().top) < 12,
      submitHasForm: /** @type {HTMLButtonElement} */ (q('#inline button')).form !== null,
      compactForm: cs('#compact > form').display,
      compactFont: parseFloat(cs('#compact input').fontSize) < plainInputFont,
      roundedRadius: parseFloat(cs('#rounded input').borderTopLeftRadius),
      expandedWidth: Math.round(q('#expanded input').getBoundingClientRect().width) === Math.round(q('#expanded').getBoundingClientRect().width),
      iconPos: cs('#icon svg').position,
      iconPad: parseFloat(cs('#icon input').paddingInlineStart),
      roundedPad: parseFloat(cs('#rounded input').paddingInlineStart),
      bareDisplay: cs('#bare').display,
      bareGrow: cs('#bare input').flexGrow,
    };
  });
  expect(r.inlineForm).toBe('flex');
  expect(r.inlineGrow).toBe('1');
  expect(r.inlineSameRow).toBe(true);
  expect(r.submitHasForm).toBe(true);
  expect(r.compactForm).toBe('flex');
  expect(r.compactFont).toBe(true);
  expect(r.roundedRadius).toBeGreaterThan(100);
  expect(r.expandedWidth).toBe(true);
  expect(r.iconPos).toBe('absolute');
  expect(r.iconPad).toBeGreaterThan(r.roundedPad);
  // Form-less markup still works.
  expect(r.bareDisplay).toBe('flex');
  expect(r.bareGrow).toBe('1');
});

const DETAILS = `
  <details id="d1"><summary id="s1">Hello</summary><p>Body</p></details>
  <details id="d2" open><summary id="s2">World</summary><p>Body</p></details>`;

for (const theme of ['nes', 'win9x']) {
  test(`summary: ${theme} shows one indicator at the inline start, not in the name`, async ({ page }) => {
    await load(page, DETAILS, { theme });
    const r = await page.evaluate(() => {
      const s = /** @type {HTMLElement} */ (document.getElementById('s1'));
      const s2 = /** @type {HTMLElement} */ (document.getElementById('s2'));
      return {
        after: getComputedStyle(s, '::after').content,
        before: getComputedStyle(s, '::before').content,
        beforeOpen: getComputedStyle(s2, '::before').content,
        justify: getComputedStyle(s).justifyContent,
      };
    });
    expect(r.after).toBe('none');
    expect(r.before).toContain('/ ""');
    expect(r.beforeOpen).toContain('/ ""');
    expect(r.justify).toBe('flex-start');
    await expect(page.locator('#s1')).toHaveAccessibleName('Hello');
    await expect(page.locator('#s2')).toHaveAccessibleName('World');
  });
}

test('summary: nes triangle mirrors under dir=rtl', async ({ page }) => {
  await load(page, DETAILS, { theme: 'nes', dir: 'rtl' });
  const scale = await page.evaluate(() => getComputedStyle(
    /** @type {HTMLElement} */ (document.getElementById('s1')), '::before').scale);
  expect(scale).toBe('-1 1');
});

test('summary: nes triangle is not mirrored in ltr', async ({ page }) => {
  await load(page, DETAILS, { theme: 'nes' });
  const scale = await page.evaluate(() => getComputedStyle(
    /** @type {HTMLElement} */ (document.getElementById('s1')), '::before').scale);
  expect(scale).toBe('none');
});

test('summary: default theme keeps the core chevron', async ({ page }) => {
  await load(page, DETAILS);
  const after = await page.evaluate(() => getComputedStyle(
    /** @type {HTMLElement} */ (document.getElementById('s1')), '::after').content);
  expect(after).not.toBe('none');
  await expect(page.locator('#s1')).toHaveAccessibleName('Hello');
});

test('summary: nav.tree +/- glyph is not part of the accessible name', async ({ page }) => {
  await load(page, `<nav class="tree" aria-label="Docs"><details id="t1"><summary id="ts1">Guides</summary>
    <ul><li><a href="#a">A</a></li></ul></details>
    <details open><summary id="ts2">Reference</summary><ul><li><a href="#b">B</a></li></ul></details></nav>`);
  await expect(page.locator('#ts1')).toHaveAccessibleName('Guides');
  await expect(page.locator('#ts2')).toHaveAccessibleName('Reference');
  const before = await page.evaluate(() => getComputedStyle(
    /** @type {HTMLElement} */ (document.getElementById('ts1')), '::before').content);
  expect(before).toContain('/ ""');
});
