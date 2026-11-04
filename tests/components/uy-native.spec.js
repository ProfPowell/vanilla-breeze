/**
 * U–Y native review fixes: u, var, wbr, ul.
 *
 * Covers: <u> as the solid proper-name mark in CJK text (not the red wavy
 * spell-check line), romanised tags keep the wavy line; <var> off the link
 * colour, upright in CJK; <wbr> breaks at the chosen point and leaves copied
 * text untouched; ul.meta separators and data-marker glyphs are silent
 * (empty alt text), new --marker-star / --sep-slash tokens, matched
 * LTR/RTL arrow pair.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', lang = 'en' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__uy-native-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const style = (page, sel, pseudo = null) => page.evaluate(([s, p]) => {
  const cs = getComputedStyle(document.querySelector(s), p);
  return {
    line: cs.textDecorationLine,
    decoStyle: cs.textDecorationStyle,
    decoColor: cs.textDecorationColor,
    color: cs.color,
    fontStyle: cs.fontStyle,
    position: cs.textUnderlinePosition,
    content: cs.content,
  };
}, [sel, pseudo]);

test.describe('u', () => {
  test('Latin <u> stays the wavy spell-check line', async ({ page }) => {
    await load(page, '<p><u id="u">recieve</u></p>');
    const u = await style(page, '#u');
    expect(u.line).toBe('underline');
    expect(u.decoStyle).toBe('wavy');
    expect(u.decoColor).not.toBe(u.color);
  });

  for (const lang of ['zh-Hans', 'ja', 'ko']) {
    test(`${lang} <u> is a solid proper-name mark in the text colour`, async ({ page }) => {
      await load(page, `<p lang="${lang}"><u id="u">李白</u>是唐代著名诗人。</p>`);
      const u = await style(page, '#u');
      expect(u.line).toBe('underline');
      expect(u.decoStyle).toBe('solid');
      expect(u.decoColor).toBe(u.color);
      expect(u.position).toBe('under');
    });
  }

  test('romanised zh-Latn keeps the spell-check line', async ({ page }) => {
    await load(page, '<p lang="zh-Latn"><u id="u">Li Bai</u></p>');
    expect((await style(page, '#u')).decoStyle).toBe('wavy');
  });

  test('CJK <u> and <cite> stay distinguishable', async ({ page }) => {
    await load(page, '<p lang="zh"><u id="u">李白</u>写了<cite id="c">静夜思</cite>。</p>');
    expect((await style(page, '#u')).decoStyle).toBe('solid');
    expect((await style(page, '#c')).decoStyle).toBe('wavy');
  });
});

test.describe('var', () => {
  test('does not use the link colour', async ({ page }) => {
    await load(page, '<p id="p">Set <var id="v">x</var> and <a id="a" href="#x">a link</a>.</p>');
    const { v, a, p } = await page.evaluate(() => ({
      v: getComputedStyle(document.getElementById('v')).color,
      a: getComputedStyle(document.getElementById('a')).color,
      p: getComputedStyle(document.getElementById('p')).color,
    }));
    expect(v).not.toBe(a);
    expect(v).toBe(p);
    expect((await style(page, '#v')).fontStyle).toBe('italic');
  });

  test('--var-color tints variables', async ({ page }) => {
    await load(page, '<p data-t><var id="v">x</var></p><style>[data-t] { --var-color: rgb(1, 2, 3); }</style>');
    expect((await style(page, '#v')).color).toBe('rgb(1, 2, 3)');
  });

  test('CJK <var> drops the synthesised slant for a dashed underline', async ({ page }) => {
    await load(page, '<p lang="zh-Hans">把<var id="v">半径</var>代入公式。</p>');
    const v = await style(page, '#v');
    expect(v.fontStyle).toBe('normal');
    expect(v.line).toBe('underline');
    expect(v.decoStyle).toBe('dashed');
  });

  test('ja-Latn <var> keeps the italic', async ({ page }) => {
    await load(page, '<p lang="ja-Latn"><var id="v">hankei</var></p>');
    expect((await style(page, '#v')).fontStyle).toBe('italic');
  });
});

test.describe('wbr', () => {
  // Returns the character just before each line break inside #p.
  const breaks = (page) => page.evaluate(() => {
    const p = document.getElementById('p');
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    const chars = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (let i = 0; i < n.data.length; i++) {
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + 1);
        const rect = r.getClientRects()[0];
        if (rect && n.data[i].trim()) chars.push({ ch: n.data[i], top: Math.round(rect.top) });
      }
    }
    const out = [];
    for (let i = 1; i < chars.length; i++) {
      if (chars[i].top > chars[i - 1].top + 2) out.push(chars[i - 1].ch);
    }
    return { out, overflow: p.scrollWidth > p.clientWidth };
  });

  const URL_TEXT = 'https://example.com/very/long/path/to/some/deeply/nested/resource/page.html';
  const URL_WBR = URL_TEXT.replaceAll('/', '/<wbr>').replace('https:/<wbr>/<wbr>', 'https://');

  test('without wbr VB overflow-wrap still contains the URL', async ({ page }) => {
    await load(page, `<p id="p" style="inline-size: 12rem">${URL_TEXT}</p>`);
    const { overflow, out } = await breaks(page);
    expect(overflow).toBe(false);
    expect(out.length).toBeGreaterThan(0);
  });

  test('with wbr every line break falls after a slash', async ({ page }) => {
    await load(page, `<p id="p" style="inline-size: 12rem">${URL_WBR}</p>`);
    const { overflow, out } = await breaks(page);
    expect(overflow).toBe(false);
    expect(out.length).toBeGreaterThan(0);
    for (const ch of out) expect(ch).toBe('/');
  });

  test('wbr adds nothing to the copied text', async ({ page }) => {
    await load(page, `<p id="p">${URL_WBR}</p>`);
    const copied = await page.evaluate(() => {
      const sel = getSelection();
      sel.selectAllChildren(document.getElementById('p'));
      return sel.toString();
    });
    expect(copied).toBe(URL_TEXT);
  });

  test('long URL in Japanese text breaks inside the URL at a slash', async ({ page }) => {
    await load(page, '<p id="p" lang="ja" style="inline-size: 14rem">詳しくは https://example.com/<wbr>docs/<wbr>guide/<wbr>getting-started.html をご覧ください。</p>');
    const { overflow, out } = await breaks(page);
    expect(overflow).toBe(false);
    // At least one break lands inside the URL, and it lands on a slash.
    const latin = out.filter((ch) => /[\x21-\x7e]/.test(ch));
    expect(latin.length).toBeGreaterThan(0);
    for (const ch of latin) expect(['/', 'l']).toContain(ch);
  });
});

test.describe('ul', () => {
  const SEPARATORS = [
    ['', '·'],
    ['pipe', '|'],
    ['dash', '–'],
    ['slash', '/'],
  ];

  for (const [sep, glyph] of SEPARATORS) {
    test(`.meta ${sep || 'default'} separator is visible but silent`, async ({ page }) => {
      const attr = sep ? ` data-separator="${sep}"` : '';
      await load(page, `<ul id="l" class="meta" role="list"${attr}><li>Jane Smith</li><li>5 min read</li></ul>`);
      const content = (await style(page, '#l > li + li', '::before')).content;
      expect(content).toContain(glyph);
      expect(content).toMatch(/\/\s*""$/);
      const snap = await page.locator('#l').ariaSnapshot();
      expect(snap).not.toContain(glyph);
      expect(snap).toContain('listitem: 5 min read');
    });
  }

  test('--sep-slash token drives the slash separator', async ({ page }) => {
    await load(page, '<ul id="l" class="meta" role="list" data-separator="slash" data-t><li>a</li><li>b</li></ul><style>[data-t] { --sep-slash: "\\2215"; }</style>');
    expect((await style(page, '#l > li + li', '::before')).content).toContain('∕');
  });

  const MARKERS = [
    ['check', '✔'],
    ['arrow', '▸'],
    ['dash', '⁃'],
    ['star', '★'],
  ];

  for (const [marker, glyph] of MARKERS) {
    test(`data-marker="${marker}" glyph is decorative`, async ({ page }) => {
      await load(page, `<ul id="l" data-marker="${marker}"><li>Free shipping</li></ul>`);
      const content = (await style(page, '#l > li', '::marker')).content;
      expect(content).toContain(glyph);
      expect(content).toMatch(/\/\s*""$/);
      const snap = await page.locator('#l').ariaSnapshot();
      expect(snap).not.toContain(glyph);
      expect(snap).toContain('Free shipping');
    });
  }

  test('--marker-star token drives the star marker', async ({ page }) => {
    await load(page, '<ul id="l" data-marker="star" data-t><li>a</li></ul><style>[data-t] { --marker-star: "\\2606"; }</style>');
    expect((await style(page, '#l > li', '::marker')).content).toContain('☆');
  });

  test('RTL arrow is the mirrored glyph of the same pair', async ({ page }) => {
    await load(page, '<ul id="l" data-marker="arrow"><li>عنصر</li></ul>', { dir: 'rtl', lang: 'ar' });
    expect((await style(page, '#l > li', '::marker')).content).toContain('◂');
  });

  test('nested lists keep their own separators and markers', async ({ page }) => {
    await load(page, '<ul class="meta" role="list" data-separator="slash"><li>a</li><li>b<ul id="n"><li>x</li><li>y</li></ul></li></ul>');
    expect((await style(page, '#n > li + li', '::before')).content).toBe('none');
  });
});
