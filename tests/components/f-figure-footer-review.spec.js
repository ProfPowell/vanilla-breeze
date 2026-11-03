/**
 * figure / figcaption / footer — F-element review fixes (vanilla-breeze-4rtb).
 *
 * Covers: data-media figures keep their caption visible (ratio moves to the
 * media child) while captionless ones are unchanged; figure.code caption
 * gap; caption-first spacing; article[data-numbered] quote dash + no
 * skipped figure numbers; figcaption.hidden == .visually-hidden;
 * footer.site inline links underlined + focus-visible; print resets for
 * sticky chrome and floating actions.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const IMG = '/src/assets/placeholders/photo-figure-1-600x400.svg';

async function load(page, body) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__f-figure-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

test.describe('figure[data-media]', () => {
  test('caption is visible below the ratio-boxed media', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await load(page, `
      <figure id="f" data-media data-ratio="16:9" data-radius="m">
        <img id="i" src="${IMG}" alt="x">
        <figcaption id="c">Caption text</figcaption>
      </figure>`);
    const r = await page.evaluate(() => {
      const f = document.getElementById('f');
      const i = document.getElementById('i').getBoundingClientRect();
      const c = document.getElementById('c').getBoundingClientRect();
      const hit = document.elementFromPoint(c.left + 5, c.top + c.height / 2);
      return {
        hit: hit?.closest('figcaption')?.id,
        imgRatio: i.width / i.height,
        captionBelow: c.top >= i.bottom - 0.5,
        figureHeight: f.getBoundingClientRect().height,
        imgBottom: i.bottom - f.getBoundingClientRect().top,
        imgRadius: getComputedStyle(document.getElementById('i')).borderTopLeftRadius,
        figRadius: getComputedStyle(f).borderTopLeftRadius,
      };
    });
    expect(r.hit).toBe('c');
    expect(r.captionBelow).toBe(true);
    expect(r.imgRatio).toBeCloseTo(16 / 9, 1);
    expect(r.figureHeight).toBeGreaterThan(r.imgBottom);
    expect(r.imgRadius).not.toBe('0px');
    expect(r.figRadius).toBe('0px');
  });

  test('caption-first data-media puts the caption above the media', async ({ page }) => {
    await load(page, `
      <figure data-media data-ratio="1:1">
        <figcaption id="c">Above</figcaption>
        <img id="i" src="${IMG}" alt="x">
      </figure>`);
    const r = await page.evaluate(() => {
      const i = document.getElementById('i').getBoundingClientRect();
      const c = document.getElementById('c').getBoundingClientRect();
      return { above: c.bottom <= i.top + 0.5, ratio: i.width / i.height };
    });
    expect(r.above).toBe(true);
    expect(r.ratio).toBeCloseTo(1, 1);
  });

  test('captionless data-media is unchanged (container is the ratio box)', async ({ page }) => {
    await load(page, `
      <figure id="f" data-media data-ratio="16:9" data-radius="m">
        <img id="i" src="${IMG}" alt="x">
      </figure>`);
    const r = await page.evaluate(() => {
      const f = document.getElementById('f');
      const cs = getComputedStyle(f);
      const ics = getComputedStyle(document.getElementById('i'));
      const b = f.getBoundingClientRect();
      return {
        ratio: b.width / b.height, overflow: cs.overflow, display: cs.display,
        radius: cs.borderTopLeftRadius, imgPos: ics.position,
      };
    });
    expect(r.ratio).toBeCloseTo(16 / 9, 1);
    expect(r.overflow).toBe('hidden');
    expect(r.display).toBe('block');
    expect(r.radius).not.toBe('0px');
    expect(r.imgPos).toBe('absolute');
  });
});

test.describe('figure spacing', () => {
  test('figure.code caption sits flush against the code', async ({ page }) => {
    await load(page, `
      <figure class="code" id="a"><pre><code>x</code></pre><figcaption>a.js</figcaption></figure>
      <figure class="code" id="b"><figcaption>b.js</figcaption><pre><code>x</code></pre></figure>`);
    const r = await page.evaluate(() => {
      const gap = (id) => {
        const f = document.getElementById(id);
        const pre = f.querySelector('pre').getBoundingClientRect();
        const cap = f.querySelector('figcaption').getBoundingClientRect();
        return id === 'a' ? cap.top - pre.bottom : pre.top - cap.bottom;
      };
      const radius = (sel) => {
        const cs = getComputedStyle(document.querySelector(sel));
        return [cs.borderStartStartRadius, cs.borderEndStartRadius];
      };
      return { a: gap('a'), b: gap('b'), bCap: radius('#b figcaption'), bPre: radius('#b pre') };
    });
    expect(r.a).toBeCloseTo(0, 0);
    expect(r.b).toBeCloseTo(0, 0);
    // caption first: caption rounded on top, pre rounded on the bottom
    expect(r.bCap[0]).not.toBe('0px');
    expect(r.bCap[1]).toBe('0px');
    expect(r.bPre[0]).toBe('0px');
    expect(r.bPre[1]).not.toBe('0px');
  });

  test('caption-first spacing goes below the caption', async ({ page }) => {
    await load(page, `
      <figure id="p"><figcaption>Lead</figcaption><img src="${IMG}" alt="x"></figure>
      <figure id="b" class="bordered"><figcaption>Lead</figcaption><img src="${IMG}" alt="x"></figure>
      <figure id="t"><img src="${IMG}" alt="x"><figcaption>Trail</figcaption></figure>`);
    const r = await page.evaluate(() => {
      const cs = (sel) => getComputedStyle(document.querySelector(sel));
      return {
        p: [cs('#p figcaption').marginBlockStart, cs('#p figcaption').marginBlockEnd],
        b: [cs('#b figcaption').borderBlockStartWidth, cs('#b figcaption').borderBlockEndWidth,
          cs('#b figcaption').marginBlockStart],
        t: cs('#t figcaption').marginBlockStart,
      };
    });
    expect(r.p[0]).toBe('0px');
    expect(r.p[1]).not.toBe('0px');
    expect(r.b[0]).toBe('0px');
    expect(r.b[1]).not.toBe('0px');
    expect(r.b[2]).toBe('0px');
    expect(r.t).not.toBe('0px');
  });

  test('embed and object children are full width like img; inline svg keeps its own width', async ({ page }) => {
    await load(page, `
      <figure id="f">
        <object aria-label="x"></object>
        <embed src="${IMG}" type="image/svg+xml" title="x">
        <svg width="120" height="60" viewBox="0 0 10 5" role="img" aria-label="x"></svg>
      </figure>`);
    const r = await page.evaluate(() => {
      const f = document.getElementById('f').getBoundingClientRect().width;
      const els = [...document.querySelectorAll('#f > *')];
      return { fills: els.slice(0, 2).map((el) => Math.round(el.getBoundingClientRect().width - f)),
               svg: Math.round(els[2].getBoundingClientRect().width) };
    });
    expect(r.fills).toEqual([0, 0]);
    expect(r.svg).toBe(120);
  });
});

test('article[data-numbered]: quotes keep the dash, figure numbers do not skip', async ({ page }) => {
  await load(page, `
    <article data-numbered>
      <figure id="f1"><img src="${IMG}" alt="x"><figcaption>One</figcaption></figure>
      <figure id="l1" class="code"><pre><code>x</code></pre><figcaption>Code</figcaption></figure>
      <figure id="q" class="quote"><blockquote><p>Q</p></blockquote><figcaption>Who</figcaption></figure>
      <figure id="f2"><img src="${IMG}" alt="x"><figcaption>Two</figcaption></figure>
      <figure id="f3"><figure><img src="${IMG}" alt="x"><figcaption>Sub</figcaption></figure><figcaption>Three</figcaption></figure>
    </article>`);
  const r = await page.evaluate(() => {
    const before = (sel) => getComputedStyle(document.querySelector(sel), '::before').content;
    const inc = (sel) => getComputedStyle(document.querySelector(sel)).counterIncrement;
    return {
      quote: before('#q > figcaption'),
      code: before('#l1 > figcaption'),
      fig: before('#f2 > figcaption'),
      codeInc: inc('#l1'), quoteInc: inc('#q'), f2Inc: inc('#f2'),
      subInc: inc('#f3 > figure'),
      sub: before('#f3 > figure > figcaption'),
    };
  });
  expect(r.quote).toContain('—');
  expect(r.code).toContain('Listing');
  expect(r.fig).toContain('Figure');
  expect(r.codeInc).toContain('vb-lst');
  expect(r.codeInc).not.toContain('vb-fig');
  expect(r.quoteInc).not.toContain('vb-fig');
  expect(r.f2Inc).toContain('vb-fig');
  expect(r.subInc).toContain('vb-subfig');
  expect(r.subInc).not.toContain('vb-fig');
  expect(r.sub).toContain('lower-alpha');

});

test('figcaption.hidden matches .visually-hidden, even in variant figures', async ({ page }) => {
  await load(page, `
    <span class="visually-hidden" id="vh">ref</span>
    <figure class="bordered"><figcaption class="hidden" id="h1">Hidden</figcaption><img src="${IMG}" alt="x"></figure>
    <figure class="code"><pre><code>x</code></pre><figcaption class="hidden" id="h2">Hidden</figcaption></figure>`);
  const props = ['position', 'width', 'height', 'paddingTop', 'paddingLeft', 'marginTop', 'marginLeft',
    'overflow', 'clip', 'whiteSpace', 'borderTopWidth', 'borderBottomWidth'];
  const r = await page.evaluate((props) => {
    const pick = (id) => { const cs = getComputedStyle(document.getElementById(id)); return props.map((p) => cs[p]); };
    return { vh: pick('vh'), h1: pick('h1'), h2: pick('h2') };
  }, props);
  expect(r.h1).toEqual(r.vh);
  expect(r.h2).toEqual(r.vh);
});

test.describe('footer', () => {
  test('footer.site: nav links muted, inline links underlined, focus-visible matches hover', async ({ page }) => {
    await load(page, `
      <footer class="site">
        <nav aria-label="Footer"><ul class="inline"><li><a id="nav" href="/a">About</a></li></ul></nav>
        <p><small>&copy; 2026 Acme. <a id="inline" href="/terms">Terms</a></small></p>
      </footer>`);
    const r = await page.evaluate(() => ({
      nav: getComputedStyle(document.getElementById('nav')).textDecorationLine,
      inline: getComputedStyle(document.getElementById('inline')).textDecorationLine,
    }));
    expect(r.nav).toBe('none');
    expect(r.inline).toContain('underline');

    const navColor = () => page.locator('#nav').evaluate((el) => getComputedStyle(el).color);
    const resting = await navColor();
    await page.locator('#nav').hover();
    await page.waitForTimeout(300);
    const hovered = await navColor();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    await page.keyboard.press('Tab');
    await expect(page.locator('#nav')).toBeFocused();
    await page.waitForTimeout(300);
    const focused = await navColor();
    expect(hovered).not.toBe(resting);
    expect(focused).toBe(hovered);
  });

  test('print: sticky header/footer static; floating actions hidden', async ({ page }) => {
    await load(page, `
      <header id="h" data-sticky><p>Head</p></header>
      <p>Body</p>
      <footer id="f" data-sticky><button type="submit">Save</button></footer>
      <fab-stack id="fab" data-float="bottom-right"><a href="#top">Top</a></fab-stack>
      <a id="float" href="/x" data-float="bottom-left">Chat</a>
      <a id="btt" href="#top" data-back-to-top>Top</a>`);
    await page.evaluate(() => document.documentElement.setAttribute('data-sticky', ''));
    const screen = await page.evaluate(() => getComputedStyle(document.getElementById('f')).position);
    expect(screen).toBe('sticky');
    await page.emulateMedia({ media: 'print' });
    const r = await page.evaluate(() => {
      const cs = (id) => getComputedStyle(document.getElementById(id));
      return {
        h: cs('h').position, f: cs('f').position,
        fab: cs('fab').display, float: cs('float').display, btt: cs('btt').display,
      };
    });
    expect(r).toEqual({ h: 'static', f: 'static', fab: 'none', float: 'none', btt: 'none' });
  });
});
