/**
 * q + ruby/rt/rp — Q+R element review fixes.
 *
 * q: locale marks follow lang on the <q> itself (not only an ancestor),
 *    zh Simplified vs Traditional, pt-BR vs pt-PT, de-CH, quotes:auto base.
 * ruby: annotations visible by default on a non-CJK page; data-ruby on any
 *    ancestor (nearest wins); hide keeps the reading in the accessibility
 *    tree; auto keys on the annotation's own language; rp never shows.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { lang = 'en', ruby = null } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__qr-q-ruby-${Math.random().toString(36).slice(2)}.html`;
  const rubyAttr = ruby ? ` data-ruby="${ruby}"` : '';
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"${rubyAttr}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

/** Rendered open/close marks of a q (::before / ::after). */
const marks = (page, sel) => page.locator(sel).evaluate((el) => [
  getComputedStyle(el, '::before').content,
  getComputedStyle(el, '::after').content,
  getComputedStyle(el).quotes,
]);

/** Whether an rt is visually shown (has real size). */
const rtShown = (page, sel) => page.locator(sel).evaluate((el) => {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return r.height > 0 && parseFloat(cs.fontSize) > 0 && cs.clipPath === 'none';
});

test.describe('q locale marks', () => {
  test('lang on the <q> itself switches marks', async ({ page }) => {
    await load(page, `
      <p>Er sagte <q id="de" lang="de">Hallo</q>.</p>
      <p>Elle a dit <q id="fr" lang="fr">Bonjour</q>.</p>
      <p lang="ja">彼は<q id="en-in-ja" lang="en">hello</q>と言った。</p>`);
    expect((await marks(page, '#de')).at(2)).toBe('"„" "“" "‚" "‘"');
    expect((await marks(page, '#fr')).at(2)).toContain('«');
    expect((await marks(page, '#en-in-ja')).at(2)).toBe('"“" "”" "‘" "’"');
  });

  test('ancestor lang still works and nested q alternates', async ({ page }) => {
    await load(page, `<p lang="de"><q id="outer">Er fragte <q id="inner">wirklich</q>?</q></p>`);
    const outer = await marks(page, '#outer');
    expect(outer[0]).toBe('open-quote');
    // the inner q uses the second pair of its own quotes value
    expect(await page.locator('#inner').evaluate((el) => getComputedStyle(el).quotes))
      .toBe('"„" "“" "‚" "‘"');
  });

  test('Chinese: Simplified gets curly quotes, Traditional corner brackets', async ({ page }) => {
    await load(page, `
      <p lang="zh"><q id="zh">你好</q></p>
      <p lang="zh-Hans"><q id="hans">你好</q></p>
      <p lang="zh-Hant"><q id="hant">你好</q></p>
      <p lang="zh-TW"><q id="tw">你好</q></p>
      <p lang="zh-HK"><q id="hk">你好</q></p>`);
    for (const id of ['zh', 'hans']) expect((await marks(page, `#${id}`))[2]).toBe('"“" "”" "‘" "’"');
    for (const id of ['hant', 'tw', 'hk']) expect((await marks(page, `#${id}`))[2]).toBe('"「" "」" "『" "』"');
  });

  test('Portuguese: Brazil curly, Portugal guillemets; Swiss German guillemets', async ({ page }) => {
    await load(page, `
      <q id="pt" lang="pt">Olá</q> <q id="br" lang="pt-BR">Olá</q> <q id="ptpt" lang="pt-PT">Olá</q>
      <q id="ch" lang="de-CH">Grüezi</q>`);
    expect((await marks(page, '#pt'))[2]).toBe('"“" "”" "‘" "’"');
    expect((await marks(page, '#br'))[2]).toBe('"“" "”" "‘" "’"');
    expect((await marks(page, '#ptpt'))[2]).toBe('"«" "»" "“" "”"');
    expect((await marks(page, '#ch'))[2]).toBe('"«" "»" "‹" "›"');
  });

  test('languages outside the table fall back to quotes: auto', async ({ page }) => {
    await load(page, `<q id="nl" lang="nl">Hallo</q>`);
    expect((await marks(page, '#nl'))[2]).toBe('auto');
  });

  test('cite[data-variant=quoted] shares the table', async ({ page }) => {
    await load(page, `<cite id="c" data-variant="quoted" lang="de">Faust</cite>`);
    expect(await page.locator('#c').evaluate((el) => getComputedStyle(el).quotes))
      .toBe('"„" "“" "‚" "‘"');
  });
});

const RUBY_JA = (id) => `<ruby>東京<rp>(</rp><rt id="${id}">とうきょう</rt><rp>)</rp></ruby>`;

test.describe('ruby visibility', () => {
  test('visible by default on a lang=en page (CJK with and without lang, Latin)', async ({ page }) => {
    await load(page, `
      <p>${RUBY_JA('nolang')}</p>
      <p lang="ja">${RUBY_JA('ja')}</p>
      <p>How to pronounce <ruby>Versailles<rp>(</rp><rt id="en">vair-SIGH</rt><rp>)</rp></ruby>.</p>`);
    for (const id of ['nolang', 'ja', 'en']) expect(await rtShown(page, `#${id}`)).toBe(true);
    expect(await page.locator('rp').first().evaluate((el) => getComputedStyle(el).display)).toBe('none');
  });

  test('data-ruby="hide" on <html> visually hides but keeps the reading accessible', async ({ page }) => {
    await load(page, `<p lang="ja">${RUBY_JA('rt')}</p>`, { ruby: 'hide' });
    expect(await rtShown(page, '#rt')).toBe(false);
    const cs = await page.locator('#rt').evaluate((el) => {
      const s = getComputedStyle(el);
      return { visibility: s.visibility, display: s.display };
    });
    expect(cs.visibility).toBe('visible');
    expect(cs.display).not.toBe('none');
    // reading still exposed to assistive tech
    const snap = await page.locator('main').ariaSnapshot();
    expect(snap).toContain('とうきょう');
    // rp stays hidden (reading is still exposed; no orphan parentheses)
    expect(await page.locator('rp').first().evaluate((el) => getComputedStyle(el).display)).toBe('none');
  });

  test('data-ruby on any ancestor or the ruby itself; nearest wins', async ({ page }) => {
    await load(page, `
      <section data-ruby="hide">
        <p lang="ja">${RUBY_JA('hidden')}</p>
        <p data-ruby="show" lang="ja">${RUBY_JA('island')}</p>
        <p lang="ja"><ruby data-ruby="show">東京<rt id="on-ruby">とうきょう</rt></ruby></p>
      </section>
      <p lang="ja"><ruby data-ruby="hide">東京<rt id="ruby-hide">とうきょう</rt></ruby></p>
      <p lang="ja">${RUBY_JA('outside')}</p>`);
    expect(await rtShown(page, '#hidden')).toBe(false);
    expect(await rtShown(page, '#island')).toBe(true);
    expect(await rtShown(page, '#on-ruby')).toBe(true);
    expect(await rtShown(page, '#ruby-hide')).toBe(false);
    expect(await rtShown(page, '#outside')).toBe(true);
  });

  test('show on <html> undone by a nested hide, and re-shown when removed', async ({ page }) => {
    await load(page, `<section id="s" data-ruby="hide"><p lang="ja">${RUBY_JA('rt')}</p></section>`, { ruby: 'show' });
    expect(await rtShown(page, '#rt')).toBe(false);
    await page.locator('#s').evaluate((el) => el.removeAttribute('data-ruby'));
    expect(await rtShown(page, '#rt')).toBe(true);
  });

  test('auto keys on the annotation language, not the root', async ({ page }) => {
    await load(page, `
      <p>${RUBY_JA('ja-on-ja')}</p>
      <section lang="en"><p><ruby>ruby<rt id="en-in-ja">annotation</rt></ruby></p></section>
      <p lang="yue"><ruby>香港<rt id="yue">hoeng1 gong2</rt></ruby></p>
      <p lang="zh"><ruby>北京<rt id="pinyin" lang="zh-Latn">Běijīng</rt></ruby></p>`, { lang: 'ja', ruby: 'auto' });
    expect(await rtShown(page, '#ja-on-ja')).toBe(true);
    expect(await rtShown(page, '#en-in-ja')).toBe(false);
    expect(await rtShown(page, '#yue')).toBe(true);
    expect(await rtShown(page, '#pinyin')).toBe(true);
  });

  test('auto on an English page: CJK paragraph shows, English annotation hides', async ({ page }) => {
    await load(page, `
      <p lang="ja">${RUBY_JA('ja')}</p>
      <p><ruby>Versailles<rt id="en">vair-SIGH</rt></ruby></p>`, { ruby: 'auto' });
    expect(await rtShown(page, '#ja')).toBe(true);
    expect(await rtShown(page, '#en')).toBe(false);
  });

  test('rt font: CJK face for kana, Latin face for pinyin (zh-Latn)', async ({ page }) => {
    await load(page, `
      <p lang="zh"><ruby>北京<rt id="pinyin" lang="zh-Latn">Běijīng</rt></ruby>
        <ruby>北京<rt id="bopo" lang="zh-Bopo">ㄅㄟˇ</rt></ruby></p>
      <p lang="yue"><ruby>香港<rt id="yue">hoeng</rt></ruby></p>`);
    const fam = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).fontFamily);
    const cjk = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-cjk').trim());
    expect(cjk.length).toBeGreaterThan(0);
    expect(await fam('#pinyin')).not.toBe(await fam('#bopo'));
    expect(await fam('#yue')).toBe(await fam('#bopo'));
  });
});

test.describe('ruby demo smoke (working-tree demo files)', () => {
  async function loadDemo(page, file) {
    await page.route('**/src/**', (route) => route.fulfill({
      path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
    }));
    const url = `/__qr-demo-${Math.random().toString(36).slice(2)}.html`;
    await page.route(`**${url}`, (route) => route.fulfill({
      path: join(REPO, 'demos/snippets/demos', file),
      contentType: 'text/html; charset=utf-8',
    }));
    await page.goto(url, { waitUntil: 'load' });
  }

  test('ruby-annotations.html shows every annotation', async ({ page }) => {
    await loadDemo(page, 'ruby-annotations.html');
    const shown = await page.locator('rt').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height > 0));
    expect(shown.length).toBeGreaterThan(5);
    expect(shown.every(Boolean)).toBe(true);
  });

  test('ruby-visibility.html demonstrates default, hide (+ show island) and auto', async ({ page }) => {
    await loadDemo(page, 'ruby-visibility.html');
    const heights = await page.locator('rt').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height > 0));
    // default ×2 visible, hide ×2 hidden, show island visible, auto ja visible, auto en hidden
    expect(heights).toEqual([true, true, false, false, true, true, false]);
  });
});
