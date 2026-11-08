/**
 * header / hgroup / headings / hr — G/H review fixes (vanilla-breeze-wja7).
 *
 * Covers: scroll-hide reveal after cumulative small scrolls and on focus;
 * sticky-manager picks the banner header (not an article header) and
 * reports 0 when the header is static; anchor targets clear a sticky
 * header; hgroup byline link cue + silent separator; i18n rules no longer
 * beat component rules (Arabic centring, CJK heading leading, Korean
 * keep-all); heading/hr ornaments kept out of the accessibility tree;
 * forced-colors hr visibility (shapes + themes); theme hr rules leave the
 * shape variants alone.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { lang = 'en', dir = 'ltr', theme = '', head = '', htmlAttrs = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__gh-heads-${Math.random().toString(36).slice(2)}.html`;
  const themeLink = theme ? `<link rel="stylesheet" href="/src/tokens/themes/_extreme-${theme}.css">` : '';
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}" ${theme ? `data-theme="${theme}"` : ''} ${htmlAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${themeLink}${head}
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const TALL = '<p style="block-size: 4000px">Tall content</p>';

/* ---------------- header ---------------- */

test('scroll-hide reveals after cumulative small upward scrolls', async ({ page }) => {
  await load(page, `<header data-scroll-hide><a href="#x">Home</a></header><main>${TALL}</main>`);
  await page.evaluate(() => import('/src/utils/scroll-hide-init.js'));
  const header = page.locator('header');

  await page.evaluate(() => { window.scrollTo(0, 600); });
  await expect(header).toHaveAttribute('data-hidden', '');

  // Ten 5px steps up (50px total) — every single delta is below the 40px threshold
  for (let i = 1; i <= 10; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), 600 - i * 5);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await expect(header).not.toHaveAttribute('data-hidden', '');

  // A downward step resets the upward run
  await page.evaluate(() => window.scrollTo(0, 700));
  await expect(header).toHaveAttribute('data-hidden', '');
  await page.evaluate(() => window.scrollTo(0, 680));
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await expect(header).toHaveAttribute('data-hidden', '');
});

test('focus moving into a hidden header reveals it', async ({ page }) => {
  await load(page, `<header data-scroll-hide><a id="home" href="#x">Home</a></header><main>${TALL}</main>`);
  await page.evaluate(() => import('/src/utils/scroll-hide-init.js'));
  await page.evaluate(() => window.scrollTo(0, 600));
  const header = page.locator('header');
  await expect(header).toHaveAttribute('data-hidden', '');
  await page.locator('#home').focus();
  await expect(header).not.toHaveAttribute('data-hidden', '');
  // The reveal transitions transform over 0.3s; a slow runner can sample mid-slide.
  await expect.poll(() => page.locator('#home').evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
});

test('CSS keeps a focused link in a hidden header on screen', async ({ page }) => {
  await load(page, `<header data-scroll-hide data-hidden><a id="home" href="#x">Home</a></header><main>${TALL}</main>`);
  await page.locator('#home').focus();
  // transform transitions over 0.3s — poll for the settled value
  await expect.poll(() => page.locator('header').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
});

test('sticky manager picks the banner header, not an article header', async ({ page }) => {
  await load(page, `
    <main><article><header id="art">Article header</header><p>Body</p></article></main>
    <header id="banner"><a href="#x">Home</a></header>
    ${TALL}`, { htmlAttrs: 'data-sticky' });
  await page.setViewportSize({ width: 1200, height: 800 });
  const r = await page.evaluate(async () => {
    const m = await import('/src/lib/sticky-manager.js');
    m.initStickyManager();
    await new Promise(requestAnimationFrame);
    return {
      banner: document.getElementById('banner').hasAttribute('data-sticky'),
      article: document.getElementById('art').hasAttribute('data-sticky'),
      offset: parseFloat(document.documentElement.style.getPropertyValue('--sticky-offset')),
      height: document.getElementById('banner').getBoundingClientRect().height,
    };
  });
  expect(r.article).toBe(false);
  expect(r.banner).toBe(true);
  expect(r.offset).toBeCloseTo(r.height, 0);
});

test('sticky manager reports 0 offset when the header is static (mobile)', async ({ page }) => {
  await page.setViewportSize({ width: 500, height: 800 });
  await load(page, `<header data-sticky><a href="#x">Home</a></header><main>${TALL}</main>`, { htmlAttrs: 'data-sticky' });
  const offset = await page.evaluate(async () => {
    const m = await import('/src/lib/sticky-manager.js');
    m.initStickyManager();
    await new Promise(requestAnimationFrame);
    return document.documentElement.style.getPropertyValue('--sticky-offset');
  });
  expect(offset).toBe('0px');
});

test('anchor target is not hidden under a plain sticky header', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await load(page, `
    <header data-sticky class="site"><a href="#target">Jump</a></header>
    <main><p style="block-size: 2000px">Spacer</p><h2 id="target">Target</h2>${TALL}</main>`);
  await page.evaluate(() => { document.getElementById('target').scrollIntoView(); });
  const r = await page.evaluate(() => ({
    header: document.querySelector('header').getBoundingClientRect().bottom,
    target: document.getElementById('target').getBoundingClientRect().top,
  }));
  expect(r.target).toBeGreaterThanOrEqual(r.header);
});

/* ---------------- hgroup ---------------- */

test('hgroup byline: author link underlined, separator silent', async ({ page }) => {
  await load(page, `<main><hgroup class="byline"><h2>Title</h2>
    <p><span><a href="#a" rel="author">Thomas Powell</a></span><span><time datetime="2026-01-15">Jan 15</time></span></p></hgroup></main>`);
  const deco = await page.locator('a[rel=author]').evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(deco).toContain('underline');
  const snap = await page.locator('hgroup p').ariaSnapshot();
  expect(snap).not.toContain('·');
  // Still painted
  const sep = await page.locator('hgroup p > span + span').evaluate((el) => getComputedStyle(el, '::before').content);
  expect(sep).toContain('·');
});

test('hgroup has no reversed / small styling left', async ({ page }) => {
  await load(page, '<main><hgroup class="reversed"><h2>T</h2><p>S</p></hgroup></main>');
  const dir = await page.locator('hgroup').evaluate((el) => getComputedStyle(el).flexDirection);
  expect(dir).toBe('column');
});

/* ---------------- i18n vs component rules ---------------- */

test('Arabic header.centered and hgroup.centered stay centred', async ({ page }) => {
  await load(page, `<header class="centered"><h1 id="h">عنوان</h1><p id="p">نص</p></header>
    <main><hgroup class="centered"><h2 id="g">عنوان</h2><p id="gp">نص</p></hgroup></main>`, { lang: 'ar', dir: 'rtl' });
  for (const id of ['h', 'p', 'g', 'gp']) {
    const ta = await page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).textAlign);
    expect(ta, id).toBe('center');
  }
});

test('Japanese headings do not inherit the 1.8 body line-height', async ({ page }) => {
  await load(page, '<main><h1 id="h">見出し</h1><p id="p">本文です。</p></main>', { lang: 'ja' });
  const r = await page.evaluate(() => {
    const lh = (el) => parseFloat(getComputedStyle(el).lineHeight) / parseFloat(getComputedStyle(el).fontSize);
    return { h: lh(document.getElementById('h')), p: lh(document.getElementById('p')) };
  });
  expect(r.h).toBeLessThan(1.5);
  expect(r.p).toBeCloseTo(1.8, 1);
});

test('Korean uses keep-all; Japanese breaks normally (no mid-word Latin splits) with strict kinsoku', async ({ page }) => {
  await load(page, '<main><p id="ko" lang="ko">한국어 문장</p><p id="ja" lang="ja">日本語 Vanilla Breeze</p></main>');
  const ko = await page.locator('#ko').evaluate((el) => getComputedStyle(el).wordBreak);
  const ja = await page.locator('#ja').evaluate((el) => {
    const cs = getComputedStyle(el); return { wb: cs.wordBreak, lb: cs.lineBreak };
  });
  expect(ko).toBe('keep-all');
  expect(ja).toEqual({ wb: 'normal', lb: 'strict' });
});

test('code keeps its monospace font inside a CJK page', async ({ page }) => {
  await load(page, '<main><p>本文 <code id="c">x()</code></p></main>', { lang: 'ja' });
  const ff = await page.locator('#c').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(ff).not.toContain('CJK');
});

/* ---------------- heading ornaments ---------------- */

test('token heading ornaments render but stay out of the accessible name', async ({ page }) => {
  await load(page, `<main style="--heading-ornament-before: '§ '; --h2-ornament-after: ' ✦'">
    <h1>Chapter</h1><h2>Section</h2><h4>Minor</h4></main>`);
  const r = await page.evaluate(() => ({
    h1: getComputedStyle(document.querySelector('h1'), '::before').content,
    h2a: getComputedStyle(document.querySelector('h2'), '::after').content,
    h4: getComputedStyle(document.querySelector('h4'), '::before').content,
  }));
  expect(r.h1).toContain('§');
  expect(r.h2a).toContain('✦');
  expect(r.h4).toContain('§');
  const snap = await page.locator('main').ariaSnapshot();
  expect(snap).toContain('heading "Chapter" [level=1]');
  expect(snap).toContain('heading "Section" [level=2]');
  expect(snap).not.toMatch(/[§✦]/);
});

test('unset ornament tokens render nothing', async ({ page }) => {
  await load(page, '<main><h1>Plain</h1><h6>Small</h6></main>');
  const r = await page.evaluate(() => ['h1', 'h6'].flatMap((s) => {
    const el = document.querySelector(s);
    return [getComputedStyle(el, '::before').content, getComputedStyle(el, '::after').content];
  }));
  for (const c of r) expect(['none', 'normal']).toContain(c);
  const box = await page.locator('h1').evaluate((el) => el.getBoundingClientRect().height);
  expect(box).toBeGreaterThan(0);
});

test('theme heading glyphs (kawaii, terminal) are excluded from the name', async ({ page }) => {
  await load(page, '<main><h1>Hello</h1><h2>World</h2></main>', { theme: 'kawaii' });
  let snap = await page.locator('main').ariaSnapshot();
  expect(snap).toContain('heading "Hello" [level=1]');
  expect(snap).toContain('heading "World" [level=2]');
  const before = await page.locator('h1').evaluate((el) => getComputedStyle(el, '::before').content);
  expect(before).toContain('✿');

  await load(page, '<main><h1>Hello</h1><h2>World</h2></main>', { theme: 'terminal' });
  snap = await page.locator('main').ariaSnapshot();
  expect(snap).toContain('heading "Hello" [level=1]');
  expect(snap).toContain('heading "World" [level=2]');
});

/* ---------------- hr ---------------- */

test('hr ornament glyphs are not in the accessibility tree', async ({ page }) => {
  await load(page, `<main><p>A</p><hr class="decorative"><p>B</p><hr data-ornament="❦"><p>C</p></main>`);
  const r = await page.evaluate(() => ({
    deco: getComputedStyle(document.querySelector('hr.decorative'), '::before').content,
    orn: getComputedStyle(document.querySelector('hr[data-ornament]'), '::before').content,
  }));
  expect(r.deco).toContain('•');
  expect(r.orn).toContain('❦');
  const snap = await page.locator('main').ariaSnapshot();
  expect(snap).not.toMatch(/[•❦]/);
  expect(snap.match(/separator/g)?.length).toBe(2);
});

test('editorial § hr overlay is silent', async ({ page }) => {
  await load(page, '<main><p>A</p><hr><p>B</p></main>', { theme: 'editorial' });
  const c = await page.locator('hr').evaluate((el) => getComputedStyle(el, '::before').content);
  expect(c).toContain('§');
  const snap = await page.locator('main').ariaSnapshot();
  expect(snap).not.toContain('§');
});

test('cyber theme leaves hr.wave its shape; editorial leaves .decorative alone', async ({ page }) => {
  await load(page, '<main><hr id="plain"><hr id="wave" class="wave"></main>', { theme: 'cyber' });
  const cyber = await page.evaluate(() => {
    const cs = (id) => getComputedStyle(document.getElementById(id));
    return { plain: cs('plain').height, wave: cs('wave').height, clip: cs('wave').clipPath };
  });
  expect(cyber.plain).toBe('1px');
  expect(cyber.wave).toBe('20px');
  expect(cyber.clip).toContain('shape');

  await load(page, '<main><hr id="d" class="decorative"></main>', { theme: 'editorial' });
  const before = await page.locator('#d').evaluate((el) => getComputedStyle(el, '::before').content);
  expect(before).toContain('•');
  expect(before).not.toContain('§');
});

for (const theme of ['', 'cyber', 'editorial']) {
  test(`forced colors: plain and shape hrs show a CanvasText rule${theme ? ` (${theme})` : ''}`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await load(page, `<main><hr id="plain"><hr id="wave" class="wave"><hr id="dots" class="dots"><hr id="zig" class="zigzag"></main>`, { theme });
    const r = await page.evaluate(() => ['plain', 'wave', 'dots', 'zig'].map((id) => {
      const cs = getComputedStyle(document.getElementById(id));
      return { id, w: cs.borderTopWidth, s: cs.borderTopStyle, clip: cs.clipPath, bg: cs.backgroundImage };
    }));
    for (const x of r) {
      expect(parseFloat(x.w), x.id).toBeGreaterThan(0);
      expect(x.s, x.id).toBe('solid');
      expect(x.clip, x.id).toBe('none');
      expect(x.bg, x.id).toBe('none');
    }
  });
}
