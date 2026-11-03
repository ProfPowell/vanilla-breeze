/**
 * i / ins — review fixes (vanilla-breeze-9vrm).
 *
 * Covers: CJK <i> drops the slant for a non-emphasis cue; romanised
 * (-Latn) tags keep italic for i/em/dfn/cite; the italic toggle only fires
 * in contexts that are actually italic (upright theme blockquotes, quoted
 * cite, blockquote attribution) and does fire in editorial italic headings;
 * dyslexia keeps <i> italic inside its upright <em>; ins/del wrapping
 * details/form/etc. get block styling.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { theme = '', themeFile = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__i-ins-${Math.random().toString(36).slice(2)}.html`;
  const themeAttr = theme ? ` data-theme="${theme}"` : '';
  const themeLink = themeFile ? `<link rel="stylesheet" href="/src/tokens/themes/${themeFile}">` : '';
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"${themeAttr}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${themeLink}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const style = (page, id) => page.evaluate((id) => {
  const cs = getComputedStyle(document.getElementById(id));
  return {
    fontStyle: cs.fontStyle,
    fontFamily: cs.fontFamily,
    deco: cs.textDecorationLine,
    decoStyle: cs.textDecorationStyle,
    emphasis: cs.getPropertyValue('text-emphasis-style'),
    display: cs.display,
    borderStart: cs.borderInlineStartWidth,
  };
}, id);

test('CJK <i> is upright with a dotted underline and calligraphic face, not emphasis marks', async ({ page }) => {
  await load(page, `
    <p lang="ja">船の名前は<i id="ja">日本丸</i>です。</p>
    <p lang="zh-Hans">他心想：<i id="zh">这不可能</i>。</p>
    <p lang="ko">배 이름은 <i id="ko">한국호</i>입니다.</p>`);
  for (const id of ['ja', 'zh', 'ko']) {
    const s = await style(page, id);
    expect(s.fontStyle, id).toBe('normal');
    expect(s.deco, id).toBe('underline');
    expect(s.decoStyle, id).toBe('dotted');
    expect(s.fontFamily, id).toMatch(/Kaiti/);
    expect(s.emphasis, id).toBe('none');
  }
});

test('romanised -Latn tags keep italic for i, em, dfn and cite', async ({ page }) => {
  await load(page, `
    <p lang="ja-Latn"><i id="i">Nihon Maru</i> <em id="em">totemo</em>
      <dfn id="dfn">sushi</dfn> <cite id="cite">Kokoro</cite></p>
    <p><i lang="zh-Latn" id="zh">Zhongguo</i> <em lang="ko-Latn" id="ko">jeongmal</em></p>
    <p lang="ja"><em id="ja-em">とても</em> <cite id="ja-cite">こころ</cite></p>`);
  for (const id of ['i', 'em', 'dfn', 'cite', 'zh', 'ko']) {
    const s = await style(page, id);
    expect(s.fontStyle, id).toBe('italic');
    expect(s.emphasis, id).toBe('none');
    expect(s.decoStyle, id).not.toBe('dotted');
  }
  // Native CJK still gets the script cues (the exclusion did not break them).
  expect((await style(page, 'ja-em')).fontStyle).toBe('normal');
  expect((await style(page, 'ja-em')).emphasis).not.toBe('none');
  expect((await style(page, 'ja-cite')).decoStyle).toBe('wavy');
});

test('toggle: nested em in an italic blockquote is upright; quoted cite and attribution are not contexts', async ({ page }) => {
  await load(page, `
    <blockquote>
      <p>Quote with <em id="bq">emphasis</em> and <i id="bq-i">Endurance</i>.</p>
      <footer>Logbook of the <i id="foot">Nimrod</i>, <cite id="fc">Diary of <em id="fc-em">Wild</em></cite></footer>
    </blockquote>
    <blockquote><p>Text</p><cite id="bqc">Shackleton, <em id="bqc-em">South</em></cite></blockquote>
    <p><cite data-variant="quoted">Notes on <em id="quoted">daisies</em></cite></p>
    <p><cite>The Guide to the <em id="cite">Galaxy</em></cite></p>
    <p><em>Never <em id="nested">never</em></em></p>`);
  expect((await style(page, 'bq')).fontStyle).toBe('normal');
  expect((await style(page, 'bq-i')).fontStyle).toBe('normal');
  expect((await style(page, 'foot')).fontStyle).toBe('italic');
  expect((await style(page, 'bqc-em')).fontStyle).toBe('italic');
  // An italic cite inside the attribution footer is a context again.
  expect((await style(page, 'fc-em')).fontStyle).toBe('normal');
  expect((await style(page, 'quoted')).fontStyle).toBe('italic');
  expect((await style(page, 'cite')).fontStyle).toBe('normal');
  expect((await style(page, 'nested')).fontStyle).toBe('normal');
});

for (const [theme, file] of [
  ['brutalist', '_extreme-brutalist.css'],
  ['cyber', '_extreme-cyber.css'],
  ['super2026', '_extreme-super2026.css'],
  ['swiss', '_extreme-swiss.css'],
]) {
  test(`toggle: em in an upright ${theme} blockquote stays italic`, async ({ page }) => {
    await load(page, `
      <blockquote id="bq"><p>Quote with <em id="em">emphasis</em>, <em>a <em id="nested">nested</em> one</em>,
        and <cite>A <i id="in-cite">Title</i></cite>.</p></blockquote>`, { theme, themeFile: file });
    expect((await style(page, 'bq')).fontStyle).toBe('normal');
    expect((await style(page, 'em')).fontStyle).toBe('italic');
    expect((await style(page, 'nested')).fontStyle).toBe('normal');
    expect((await style(page, 'in-cite')).fontStyle).toBe('normal');
  });
}

test('editorial italic headings toggle em upright', async ({ page }) => {
  await load(page, `<h1 id="h1">An <em id="h1-em">elegant</em> title</h1><h3>A <i id="h3-i">subhead</i></h3>`,
    { theme: 'editorial', themeFile: '_extreme-editorial.css' });
  expect((await style(page, 'h1')).fontStyle).toBe('italic');
  expect((await style(page, 'h1-em')).fontStyle).toBe('normal');
  expect((await style(page, 'h3-i')).fontStyle).toBe('normal');
});

test('dyslexia: em is upright, so an <i> inside it stays italic', async ({ page }) => {
  await load(page, `<p><em id="em">Read <i id="i">Moby-Dick</i> now</em></p>`, { theme: 'a11y-dyslexia' });
  expect((await style(page, 'em')).fontStyle).toBe('normal');
  expect((await style(page, 'i')).fontStyle).toBe('italic');
});

test('ins/del wrapping details, form and other blocks get block styling', async ({ page }) => {
  const blocks = ['details', 'nav', 'header', 'footer', 'form', 'fieldset', 'hgroup', 'menu', 'address', 'search'];
  const body = blocks.map((t) => `<ins id="ins-${t}"><${t}>${t === 'details' ? '<summary>More</summary>' : ''}Changed ${t}</${t}></ins>`).join('')
    + '<del id="del-details"><details><summary>Old</summary>Removed</details></del>'
    + '<ins id="ins-hr"><hr></ins>'
    + '<p>Inline <ins id="inline">word</ins></p>';
  await load(page, body);
  for (const t of [...blocks, 'hr']) {
    const s = await style(page, `ins-${t}`);
    expect(s.display, t).toBe('block');
    expect(parseFloat(s.borderStart), t).toBeGreaterThan(0);
  }
  expect((await style(page, 'del-details')).display).toBe('block');
  expect((await style(page, 'inline')).display).toBe('inline');
});
