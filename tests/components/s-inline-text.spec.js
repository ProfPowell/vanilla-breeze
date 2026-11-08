/**
 * Inline text review fixes (S review): sub, sup, strong, s, samp, small, span.
 *
 * Covers: sub/sup always shrink and shift (no @supports reset), opt-in
 * OpenType glyphs, footnote refs sized once with an underlined link;
 * strong/em synthesise bold/italic when the font has a single face;
 * small is relative to its context; samp wraps and keeps its own direction
 * on RTL pages; .status glyphs are decorative; forced-colour cues for s and
 * bold in inline code.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', head = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__s-inline-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
}

const px = (v) => parseFloat(v);

test('sub and sup shrink and shift in a font without OpenType sups/subs', async ({ page }) => {
  await load(page, `<p id="p" style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px">
    H<sub id="sub">2</sub>O and mc<sup id="sup">2</sup> <span id="ref">x</span></p>`);
  const m = await page.evaluate(() => {
    const cs = (id) => getComputedStyle(document.getElementById(id));
    const r = (id) => document.getElementById(id).getBoundingClientRect();
    return {
      subSize: cs('sub').fontSize, supSize: cs('sup').fontSize,
      subPos: cs('sub').position, supPos: cs('sup').position,
      subFvp: cs('sub').fontVariantPosition, supFvp: cs('sup').fontVariantPosition,
      subBottom: r('sub').bottom, supTop: r('sup').top,
      refBottom: r('ref').bottom, refTop: r('ref').top,
    };
  });
  expect(px(m.subSize)).toBeCloseTo(15, 1);
  expect(px(m.supSize)).toBeCloseTo(15, 1);
  expect(m.subPos).toBe('relative');
  expect(m.supPos).toBe('relative');
  // No font-variant-position by default: it would ask the font for glyphs it lacks
  expect(m.subFvp).toBe('normal');
  expect(m.supFvp).toBe('normal');
  expect(m.supTop).toBeLessThan(m.refTop);
  expect(m.subBottom).toBeGreaterThan(m.refBottom - 4);
});

test('sub/sup do not make the line taller', async ({ page }) => {
  await load(page, `<p id="a" style="font-size: 20px">Plain line of text</p>
    <p id="b" style="font-size: 20px">Line with mc<sup>2</sup> and H<sub>2</sub>O</p>`);
  const [a, b] = await page.evaluate(() => ['a', 'b'].map((id) => document.getElementById(id).getBoundingClientRect().height));
  expect(b).toBeCloseTo(a, 0);
});

test('data-variant="opentype" opts in to font-variant-position at full size', async ({ page }) => {
  await load(page, `<p style="font-size: 20px">H<sub id="sub" data-variant="opentype">2</sub>O
    mc<sup id="sup" data-variant="opentype">2</sup></p>`);
  const m = await page.evaluate(() => ['sub', 'sup'].map((id) => {
    const cs = getComputedStyle(document.getElementById(id));
    return { size: cs.fontSize, fvp: cs.fontVariantPosition, pos: cs.position };
  }));
  expect(m[0]).toEqual({ size: '20px', fvp: 'sub', pos: 'static' });
  expect(m[1]).toEqual({ size: '20px', fvp: 'super', pos: 'static' });
});

test('footnote ref is sized once and its link is underlined', async ({ page }) => {
  await load(page, `<p style="font-size: 20px">Claim<sup class="footnote-ref" id="fr"><a href="#fn1" id="fnref1">[1]</a></sup>.</p>
    <ol class="footnotes"><li id="fn1">Source. <a href="#fnref1" aria-label="Back to reference 1">&#8617;</a></li></ol>`);
  const m = await page.evaluate(() => {
    const sup = getComputedStyle(document.getElementById('fr'));
    const a = getComputedStyle(document.getElementById('fnref1'));
    return { size: sup.fontSize, deco: a.textDecorationLine, padTop: a.paddingTop, padStart: a.paddingInlineStart };
  });
  expect(px(m.size)).toBeCloseTo(15, 1);
  expect(m.deco).toContain('underline');
  expect(px(m.padTop)).toBeGreaterThan(0);
  expect(px(m.padStart)).toBeGreaterThan(0);
  await expect(page.getByRole('link', { name: 'Back to reference 1' })).toBeVisible();
});

test('strong and em synthesise bold/italic when the font has a single face', async ({ page }) => {
  // A family that declares only a regular face: bold needs synthesis.
  const head = `<style>@font-face { font-family: "OneFace"; font-weight: 400; font-style: normal;
    src: local("Georgia"), local("DejaVu Serif"), local("Liberation Serif"), local("Times New Roman"); }
    .f { font-family: "OneFace"; font-size: 32px; }</style>`;
  await load(page, `<p class="f"><span id="plain">Bold</span></p>
    <p class="f"><strong id="strong">Bold</strong></p>
    <p class="f"><strong id="nosynth" style="font-synthesis: none">Bold</strong></p>`, { head });
  const synth = await page.evaluate(() => ['strong', 'em', 'b', 'i'].map((tag) => {
    const el = document.createElement(tag);
    document.body.append(el);
    const cs = getComputedStyle(el);
    const out = [cs.fontSynthesisWeight, cs.fontSynthesisStyle, cs.fontSynthesisSmallCaps];
    el.remove();
    return out;
  }));
  for (const s of synth) expect(s).toEqual(['auto', 'auto', 'none']);

  const plain = await page.locator('#plain').screenshot();
  const strong = await page.locator('#strong').screenshot();
  const nosynth = await page.locator('#nosynth').screenshot();
  // Control: with synthesis off the single face renders exactly like plain text
  expect(nosynth.equals(plain)).toBe(true);
  expect(strong.equals(plain)).toBe(false);
});

test('small is relative to its context with an xs floor', async ({ page }) => {
  await load(page, `<h2 id="h" style="font-size: 40px">Title <small id="hs">tagline</small></h2>
    <p style="font-size: 16px"><small id="s1">a <small id="s2">b <small id="s3">c</small></small></small></p>`);
  const m = await page.evaluate(() => {
    const fs = (id) => parseFloat(getComputedStyle(document.getElementById(id)).fontSize);
    const probe = document.createElement('span');
    probe.style.fontSize = 'var(--font-size-xs)';
    document.body.append(probe);
    const xs = parseFloat(getComputedStyle(probe).fontSize);
    probe.remove();
    return { hs: fs('hs'), s1: fs('s1'), s2: fs('s2'), s3: fs('s3'), xs };
  });
  expect(m.hs).toBeCloseTo(35, 1);
  expect(m.s1).toBeCloseTo(14, 1);
  expect(m.s2).toBeLessThan(m.s1);
  expect(m.s3).toBeGreaterThanOrEqual(m.xs - 0.01);
});

// A list item, not a <p>: the reset already gives p/headings break-word.
test('inline samp wraps long output; block samp does not', async ({ page }) => {
  await load(page, `<ul><li style="inline-size: 12rem">Digest <samp id="s">sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</samp> matched.</li></ul>
    <pre><samp id="b">output</samp></pre>`);
  const m = await page.evaluate(() => ({
    wrap: getComputedStyle(document.getElementById('s')).overflowWrap,
    block: getComputedStyle(document.getElementById('b')).overflowWrap,
    overflow: document.getElementById('s').getBoundingClientRect().right
      - document.getElementById('s').parentElement.getBoundingClientRect().right,
  }));
  expect(m.wrap).toBe('break-word');
  expect(m.block).toBe('normal');
  expect(m.overflow).toBeLessThanOrEqual(1);
});

test('inline samp/code keep their own direction on an RTL page', async ({ page }) => {
  await load(page, `<p lang="ar">ظهرت الرسالة <samp id="s">File not found: config.json.</samp> عند التشغيل.</p>
    <p lang="ar">شغّل <code id="c">npm test.</code> الآن.</p>
    <pre><code id="pc">block</code></pre>`, { dir: 'rtl' });
  const m = await page.evaluate(() => {
    // x of the first and last characters of each run
    const ends = (id) => {
      const node = document.getElementById(id).firstChild;
      const rect = (i) => {
        const r = document.createRange();
        r.setStart(node, i); r.setEnd(node, i + 1);
        return r.getBoundingClientRect();
      };
      return { first: rect(0).left, last: rect(node.length - 1).left };
    };
    return {
      samp: ends('s'), code: ends('c'),
      bidi: getComputedStyle(document.getElementById('s')).unicodeBidi,
      pre: getComputedStyle(document.getElementById('pc')).unicodeBidi,
    };
  });
  expect(m.bidi).toBe('plaintext');
  expect(m.pre).toBe('normal');
  // LTR order: the trailing "." sits to the right of the first letter
  expect(m.samp.last).toBeGreaterThan(m.samp.first);
  expect(m.code.last).toBeGreaterThan(m.code.first);
});

test('inline code/samp isolation leaves LTR text unchanged', async ({ page }) => {
  await load(page, `<p>Run <code id="c">npm test</code>, then read <samp id="s">ok.</samp> in the log.</p>`);
  const ordered = await page.evaluate(() => {
    const c = document.getElementById('c').getBoundingClientRect();
    const s = document.getElementById('s').getBoundingClientRect();
    return c.right < s.left;
  });
  expect(ordered).toBe(true);
});

test('.status glyph is decorative (not in the accessible name)', async ({ page }) => {
  await load(page, `<p id="st"><span class="status" data-status="success">Deployed</span>
    <span class="status" data-status="check">Passed</span>
    <span class="status" data-status="inactive">Offline</span></p>`);
  const content = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.status'), '::before').content);
  expect(content).toContain('/ ""');
  const snap = await page.locator('#st').ariaSnapshot();
  expect(snap).toContain('Deployed');
  expect(snap).not.toMatch(/[●○✔✘]/);
});

test('forced colours: s is dashed, del is double; bold in inline code is highlighted', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, `<p><s id="s">old</s> <del id="d">removed</del></p>
    <p><code>call <strong id="cs">fn</strong>()</code></p>`);
  const m = await page.evaluate(() => ({
    s: getComputedStyle(document.getElementById('s')).textDecorationStyle,
    d: getComputedStyle(document.getElementById('d')).textDecorationStyle,
    bg: getComputedStyle(document.getElementById('cs')).backgroundColor,
  }));
  expect(m.s).toBe('dashed');
  expect(m.d).toBe('double');
  expect(m.bg).not.toBe('rgba(0, 0, 0, 0)');
});
