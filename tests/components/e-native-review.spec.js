/**
 * E-element review — native em / embed / object (vanilla-breeze-t7hm).
 *
 * Covers: the em toggle inside italic contexts (blockquote, cite, nested em),
 * CJK emphasis marks for ja and zh, the a11y-dyslexia theme override still
 * winning, data-ratio / data-media sizing for embed and object (block size
 * follows the used width), and print break-inside for embed/object.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#ccc"/></svg>';

async function load(page, body, { theme = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/__e-native.svg', (route) => route.fulfill({
    status: 200, contentType: 'image/svg+xml', body: SVG,
  }));
  const url = `/__e-native-${Math.random().toString(36).slice(2)}.html`;
  const themeAttr = theme ? ` data-theme="${theme}"` : '';
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"${themeAttr}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const style = (page, sel, prop) => page.locator(sel).evaluate(
  (el, p) => getComputedStyle(el).getPropertyValue(p), prop);

test.describe('em', () => {
  const TOGGLE = `
    <p><em id="plain">plain</em></p>
    <blockquote><p>quote <em id="bq">em</em> <i id="bqi">i</i></p></blockquote>
    <p><cite>Title <em id="cite">em</em></cite></p>
    <p><dfn>term <em id="dfn">em</em></dfn></p>
    <p><em>outer <em id="nested">inner</em></em></p>
    <address>Contact <em id="addr">em</em></address>
    <p><strong><em id="strong">bold italic</em></strong></p>`;

  test('emphasis toggles to upright inside italic contexts', async ({ page }) => {
    await load(page, TOGGLE);
    expect(await style(page, 'blockquote', 'font-style')).toBe('italic');
    expect(await style(page, '#plain', 'font-style')).toBe('italic');
    for (const id of ['bq', 'bqi', 'cite', 'dfn', 'nested']) {
      expect(await style(page, `#${id}`, 'font-style'), id).toBe('normal');
    }
    // address is upright in VB, so emphasis inside it stays italic
    expect(await style(page, '#addr', 'font-style')).toBe('italic');
    // strong+em keeps the combined bold italic
    expect(await style(page, '#strong', 'font-style')).toBe('italic');
    // the old blockquote rule's medium weight is gone
    expect(await style(page, '#bq', 'font-weight'))
      .toBe(await style(page, 'blockquote p', 'font-weight'));
  });

  test('CJK em uses emphasis marks: sesame over (ja), dot under (zh)', async ({ page }) => {
    await load(page, `
      <p lang="ja">これは<em id="ja">とても</em>大切です。</p>
      <p lang="ko">이것은 <em id="ko">매우</em> 중요합니다.</p>
      <p lang="zh-Hans">这是<em id="zh">非常</em>重要的。</p>
      <blockquote lang="ja"><p><em id="jabq">強調</em></p></blockquote>`);
    for (const id of ['ja', 'ko', 'zh', 'jabq']) {
      expect(await style(page, `#${id}`, 'font-style'), id).toBe('normal');
    }
    for (const id of ['ja', 'ko', 'jabq']) {
      // computed value drops the default `filled` keyword
      expect(await style(page, `#${id}`, 'text-emphasis-style'), id).toMatch(/^(filled )?sesame$/);
      expect(await style(page, `#${id}`, 'text-emphasis-position'), id).toMatch(/^over( right)?$/);
    }
    expect(await style(page, '#zh', 'text-emphasis-style')).toMatch(/^(filled )?dot$|^filled$/);
    expect(await style(page, '#zh', 'text-emphasis-position')).toMatch(/^under( right)?$/);
  });

  test('a11y-dyslexia theme still renders em upright and semibold', async ({ page }) => {
    await load(page, TOGGLE, { theme: 'a11y-dyslexia' });
    for (const id of ['plain', 'bq', 'nested']) {
      expect(await style(page, `#${id}`, 'font-style'), id).toBe('normal');
      expect(Number(await style(page, `#${id}`, 'font-weight')), id).toBeGreaterThanOrEqual(600);
    }
  });
});

test.describe('embed / object sizing', () => {
  const SIZING = `
    <section id="narrow" style="inline-size: 240px">
      <embed id="e43" src="/__e-native.svg" type="image/svg+xml" width="400" height="300" data-ratio="4:3" title="Grey box">
      <object id="opage" data="/__e-native.svg" type="image/svg+xml" width="800" height="1131" data-ratio="page" aria-label="Page"></object>
      <embed id="ebare" src="/__e-native.svg" type="image/svg+xml" width="400" height="300" title="Grey box">
    </section>
    <section id="wide" style="inline-size: 900px">
      <embed id="ewide" src="/__e-native.svg" type="image/svg+xml" width="400" height="300" data-ratio="4:3" title="Grey box">
      <embed id="efill" src="/__e-native.svg" type="image/svg+xml" data-ratio="16:9" title="Grey box">
      <figure data-media data-ratio="1:1" id="box">
        <object id="omedia" data="/__e-native.svg" type="image/svg+xml" aria-label="Grey box"></object>
      </figure>
      <p class="embed-responsive"><embed id="eresp" src="/__e-native.svg" type="image/svg+xml" title="Grey box"></p>
    </section>`;

  const box = (page, sel) => page.locator(sel).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });

  test('data-ratio: block size follows the clamped width', async ({ page }) => {
    await load(page, SIZING);
    expect(await box(page, '#e43')).toEqual({ w: 240, h: 180 });
    const pg = await box(page, '#opage');
    expect(pg.w).toBe(240);
    expect(Math.abs(pg.h - 240 * 1.414)).toBeLessThanOrEqual(1);
    // without data-ratio the height stays fixed (the letterbox the primitive fixes)
    expect(await box(page, '#ebare')).toEqual({ w: 240, h: 300 });
  });

  test('data-ratio: width attribute stays the preferred width; none fills', async ({ page }) => {
    await load(page, SIZING);
    expect(await box(page, '#ewide')).toEqual({ w: 400, h: 300 });
    const fill = await box(page, '#efill');
    expect(fill.w).toBe(900);
    expect(Math.abs(fill.h - 900 * 9 / 16)).toBeLessThanOrEqual(1);
  });

  test('data-media and .embed-responsive wrappers size embed/object', async ({ page }) => {
    await load(page, SIZING);
    const outer = await box(page, '#box');
    expect(await box(page, '#omedia')).toEqual(outer);
    expect(outer.w).toBe(outer.h);
    const resp = await box(page, '#eresp');
    expect(resp.w).toBe(900);
    expect(Math.abs(resp.h - 900 * 9 / 16)).toBeLessThanOrEqual(1);
  });

  test('print: embed and object avoid page breaks', async ({ page }) => {
    await load(page, SIZING);
    await page.emulateMedia({ media: 'print' });
    for (const sel of ['#e43', '#opage', '#omedia']) {
      expect(await style(page, sel, 'break-inside'), sel).toBe('avoid');
    }
  });
});
