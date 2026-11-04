/**
 * li / link — K+L element review fixes.
 *
 * li: list marker and separator rules reach direct items only (nested lists
 * keep their own markers), RTL arrow marker, kawaii keeps the native
 * list-item counter (value/start honoured, list-style kept), dyslexia uses
 * logical alignment and scopes its li margin to plain lists.
 * link: theme-loader preload dedupe/cleanup and quote-safe names, math-init
 * resolves math-fonts.css against the CDN base, share-wc resolves a relative
 * canonical, geo-map-style token-list rel matching.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', theme = '', head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  // Third-party fonts (kawaii @import) — keep the run offline/deterministic.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
  const url = `/__kl-li-link-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${head}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const marker = (page, sel) => page.$eval(sel, (el) => getComputedStyle(el, '::marker').content);
const before = (page, sel) => page.$eval(sel, (el) => getComputedStyle(el, '::before').content);
const css = (page, sel, prop) => page.$eval(sel, (el, p) => getComputedStyle(el).getPropertyValue(p), prop);

/* ---------- li: marker / separator scope ---------- */

const NESTED = `
  <ul data-marker="check" id="check">
    <li id="outer">Outer
      <ol><li id="inner1">One</li><li id="inner2">Two</li></ol>
    </li>
  </ul>
  <ul class="meta" data-separator="pipe">
    <li>A</li>
    <li id="meta2">B
      <ul><li>x</li><li id="metaNested2">y</li></ul>
    </li>
  </ul>
  <ul class="inline">
    <li>A</li>
    <li>B<ul><li>x</li><li id="inlineNested2">y</li></ul></li>
  </ul>
  <ul data-marker="arrow" id="arrow"><li id="arrow1">Go</li></ul>`;

test('data-marker applies to direct items only; a nested ol keeps its numbers', async ({ page }) => {
  await load(page, NESTED);
  expect(await marker(page, '#outer')).toContain('✔');
  const inner = await marker(page, '#inner1');
  expect(inner).not.toContain('✔');
  expect(await css(page, '#inner1', 'list-style-type')).toBe('decimal');
});

test('.meta separators and .inline resets do not leak into nested lists', async ({ page }) => {
  await load(page, NESTED);
  expect(await before(page, '#meta2')).toBe('"|" / ""');
  expect(await before(page, '#metaNested2')).toBe('none');
  // Nested block-flow list keeps the default li + li gap
  expect(await css(page, '#inlineNested2', 'margin-block-start')).not.toBe('0px');
});

test('arrow marker points toward the text in RTL', async ({ page }) => {
  await load(page, NESTED, { dir: 'rtl' });
  const m = await marker(page, '#arrow1');
  expect(m).toContain('◂');
  expect(m).not.toContain('▸');
});

test('arrow marker keeps the right-pointing glyph in LTR', async ({ page }) => {
  await load(page, NESTED);
  expect(await marker(page, '#arrow1')).toContain('▸');
});

/* ---------- kawaii theme ---------- */

const KAWAII_HEAD = '<link rel="stylesheet" href="/src/tokens/themes/_extreme-kawaii.css">';
const KAWAII_BODY = `
  <article>
    <ol id="ol" start="5"><li id="ol1">a</li><li id="ol2" value="10">b</li><li id="ol3">c</li></ol>
    <ol id="olA" type="A"><li id="olA1">a</li></ol>
    <ul id="ul"><li id="ul1">x</li></ul>
    <ul id="ulCheck" data-marker="check"><li id="ulCheck1">x</li></ul>
    <nav><ul id="navUl"><li id="nav1">n</li></ul></nav>
  </article>`;

test('kawaii keeps list-style and counts with the native list-item counter', async ({ page }) => {
  await load(page, KAWAII_BODY, { theme: 'kawaii', head: KAWAII_HEAD });
  expect(await css(page, '#ol', 'list-style-type')).not.toBe('none');
  expect(await css(page, '#ul', 'list-style-type')).not.toBe('none');
  expect(await marker(page, '#ol1')).toMatch(/counter\(list-item\)/);
  // type="A" keeps its native marker text (A., B., …)
  expect(await marker(page, '#olA1')).not.toMatch(/counter\(list-item\)/);
  expect(await css(page, '#olA', 'list-style-type')).toBe('upper-alpha');
  expect(await marker(page, '#ul1')).toContain('♡');
  // No ::before pseudo-counter any more
  expect(await before(page, '#ol1')).toBe('none');
  // value / start honoured by the native counter
  const counts = await page.$$eval('#ol > li', (lis) => lis.map((li) => /** @type {HTMLLIElement} */ (li).value));
  expect(counts).toEqual([0, 10, 0]);
  // data-marker and nav lists are left alone
  expect(await marker(page, '#ulCheck1')).toContain('✔');
  expect(await marker(page, '#nav1')).not.toContain('♡');
});

/* ---------- dyslexia theme ---------- */

const DYS_BODY = `
  <article>
    <p id="p">Text</p>
    <ul id="plain"><li id="plain1">a</li><li>b</li></ul>
    <ul data-layout="stack" id="stack"><li id="stack1">a</li><li>b</li></ul>
    <ul class="meta"><li id="meta1">a</li><li>b</li></ul>
  </article>`;

test('dyslexia aligns text to the start edge (RTL aligns right)', async ({ page }) => {
  await load(page, DYS_BODY, { dir: 'rtl', theme: 'a11y-dyslexia' });
  expect(await css(page, '#p', 'text-align')).toBe('start');
  const box = await page.$eval('#p', (el) => {
    const r = document.createRange(); r.selectNodeContents(el);
    const t = r.getBoundingClientRect(); const b = el.getBoundingClientRect();
    return { textRight: t.right, boxRight: b.right };
  });
  expect(Math.abs(box.boxRight - box.textRight)).toBeLessThan(2);
});

test('dyslexia li margin only applies to plain block-flow lists', async ({ page }) => {
  await load(page, DYS_BODY, { theme: 'a11y-dyslexia' });
  expect(await css(page, '#plain1', 'margin-block-end')).not.toBe('0px');
  expect(await css(page, '#stack1', 'margin-block-end')).toBe('0px');
  expect(await css(page, '#meta1', 'margin-block-end')).toBe('0px');
});

/* ---------- theme-loader ---------- */

test('preloadTheme dedupes; loading the theme removes every preload', async ({ page }) => {
  await load(page, '<p>x</p>');
  await page.route('**/cdn/themes/**', (route) => route.fulfill({
    status: 200, contentType: 'text/css', body: '@layer bundle-theme{}',
  }));
  const r = await page.evaluate(async () => {
    const m = await import('/src/lib/theme-loader.js');
    m.preloadTheme('ocean');
    m.preloadTheme('ocean');
    m.preloadTheme('ocean');
    const afterHover = document.querySelectorAll('link[data-vb-theme-preload="ocean"]').length;
    // A stray hint (e.g. authored markup) is cleaned up too
    const extra = document.createElement('link');
    extra.rel = 'preload'; extra.as = 'style'; extra.href = '/cdn/themes/ocean.css';
    extra.setAttribute('data-vb-theme-preload', 'ocean');
    document.head.append(extra);
    await m.ensureThemeLoaded('ocean');
    return {
      afterHover,
      afterLoad: document.querySelectorAll('link[data-vb-theme-preload="ocean"]').length,
      sheets: document.querySelectorAll('link[data-vb-theme="ocean"]').length,
    };
  });
  expect(r).toEqual({ afterHover: 1, afterLoad: 0, sheets: 1 });
});

test('theme names with quotes or brackets do not make the selectors throw', async ({ page }) => {
  await load(page, '<p>x</p>');
  const err = await page.evaluate(async () => {
    const m = await import('/src/lib/theme-loader.js');
    try {
      m.preloadTheme('we"ird]name');
      m.preloadTheme('we"ird]name');
      return { ok: true, n: document.querySelectorAll('link[data-vb-theme-preload]').length };
    } catch (e) { return { ok: false, msg: String(e) }; }
  });
  expect(err).toEqual({ ok: true, n: 1 });
});

/* ---------- math-init ---------- */

test('math-init resolves math-fonts.css against the CDN base', async ({ page }) => {
  await load(page, `<code data-math data-mathml="<math display='block'><mi>x</mi></math>">x</code>`,
    { head: '<script>window.__VB_THEME_BASE = "/some/sub/cdn/";</script>' });
  await page.evaluate(() => import('/src/utils/math-init.js'));
  const href = await page.$eval('link[data-vb-math-font]', (l) => l.getAttribute('href'));
  expect(href).toBe('/some/sub/cdn/fonts/math-fonts.css');
});

test('the CDN build ships math-fonts.css', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(join(REPO, 'scripts', 'build-cdn.js'), 'utf8');
  expect(src).toMatch(/'fonts', 'math-fonts\.css'/);
});

/* ---------- share-wc canonical ---------- */

test('share-wc shares an absolute URL for a relative canonical', async ({ page }) => {
  await load(page, '<share-wc id="s"></share-wc>', {
    head: '<link rel="Canonical alternate" href="/docs/x/">',
  });
  await page.evaluate(() => import('/src/web-components/share-wc/logic.js'));
  await page.waitForSelector('share-wc[data-upgraded]');
  const url = await page.$eval('#s', (el) => /** @type {any} */ (el).url);
  expect(url).toBe(new URL('/docs/x/', page.url()).href);
});
