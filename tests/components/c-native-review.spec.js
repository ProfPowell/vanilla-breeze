/**
 * C-element review fixes (pohq / 25vi / ra3u): code/pre/i18n, cite,
 * table col alignment, cluster overlap, cover centered edges, center gap,
 * token-preview variant.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { head = '', htmlAttrs = 'lang="en"' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__c-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html ${htmlAttrs}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const css = (page, sel, prop, pseudo = null) =>
  page.locator(sel).evaluate((el, [p, ps]) => getComputedStyle(el, ps)[p], [prop, pseudo]);

test.describe('code / pre / i18n', () => {
  test('no invalid `translate: no` declaration in the i18n layer', () => {
    const src = readFileSync(join(REPO, 'src/native-elements/i18n/styles.css'), 'utf8');
    expect(src).not.toMatch(/^\s*translate\s*:\s*no\s*;/m);
  });

  test('bare <pre> keeps white-space: pre (ASCII art never reflows)', async ({ page }) => {
    await load(page, '<pre id="p">  *\n ***</pre>');
    expect(await css(page, '#p', 'whiteSpace')).toBe('pre');
    expect(await css(page, '#p', 'overflowX')).toBe('auto');
  });

  test('<pre><samp> gets the code-block treatment', async ({ page }) => {
    await load(page, '<pre id="p"><samp id="s">$ npm test</samp></pre><pre id="bare">x</pre>');
    const bg = await css(page, '#p', 'backgroundColor');
    const bareBg = await css(page, '#bare', 'backgroundColor');
    expect(bg).not.toBe(bareBg);
    expect(await css(page, '#s', 'fontSize')).toBe(await css(page, '#p', 'fontSize'));
  });

  test('inline code breaks anywhere; code in pre does not', async ({ page }) => {
    await load(page, '<p><code id="i">averyveryverylongidentifier</code></p><pre><code id="b">x</code></pre>');
    expect(await css(page, '#i', 'overflowWrap')).toBe('anywhere');
    expect(await css(page, '#b', 'overflowWrap')).toBe('normal');
  });
});

test.describe('cite', () => {
  test('editorial theme: inline cite in a blockquote stays inline', async ({ page }) => {
    await load(page, `<blockquote><p>As in <cite id="inline">Walden</cite> we read.</p>
      <cite id="attr">Thoreau</cite></blockquote>`, {
      head: '<link rel="stylesheet" href="/src/tokens/themes/_extreme-editorial.css">',
      htmlAttrs: 'lang="en" data-theme="editorial"',
    });
    expect(await css(page, '#inline', 'display')).toBe('inline');
    expect(await css(page, '#inline', 'textTransform')).toBe('none');
    expect(await css(page, '#attr', 'display')).toBe('block');
    expect(await css(page, '#attr', 'textTransform')).toBe('uppercase');
  });

  test('cite.quoted: quotes instead of italics, locale-aware marks', async ({ page }) => {
    await load(page, '<p><cite id="q" class="quoted">Song</cite></p><p lang="de"><cite id="de" class="quoted">Lied</cite></p>');
    expect(await css(page, '#q', 'fontStyle')).toBe('normal');
    expect(await css(page, '#q', 'content', '::before')).toBe('open-quote');
    expect(await css(page, '#de', 'quotes')).toContain('„');
  });
});

test.describe('table', () => {
  test('data-align only aligns table cells', async ({ page }) => {
    await load(page, `<p id="p" data-align="center">text</p>
      <table><tr><td id="td" data-align="center">x</td></tr></table>`);
    expect(await css(page, '#p', 'textAlign')).not.toBe('center');
    expect(await css(page, '#td', 'textAlign')).toBe('center');
  });
});

test.describe('layout-cluster overlap', () => {
  test('visual order matches DOM order, gap 0, ring kept', async ({ page }) => {
    await load(page, `<layout-cluster id="c" data-layout-overlap data-layout-gap="xl">
      <span id="a">A</span><span>B</span><span id="z">+3</span></layout-cluster>`);
    expect(await css(page, '#c', 'flexDirection')).toBe('row');
    expect(await css(page, '#c', 'columnGap')).toBe('0px');
    const ax = (await page.locator('#a').boundingBox()).x;
    const zx = (await page.locator('#z').boundingBox()).x;
    expect(ax).toBeLessThan(zx);
    expect(await css(page, '#a', 'marginInlineStart')).toBe('0px');
    expect(await css(page, '#z', 'boxShadow')).toContain('2px');
  });

  test('works the same in attribute form', async ({ page }) => {
    await load(page, `<ul id="c" data-layout="cluster" data-layout-overlap="m">
      <li id="a">Alpha one</li><li id="z">Beta two</li></ul>`);
    expect(await css(page, '#c', 'flexDirection')).toBe('row');
    expect((await page.locator('#a').boundingBox()).x).toBeLessThan((await page.locator('#z').boundingBox()).x);
  });
});

test.describe('layout-cover centered', () => {
  test('header spans the full width so justify=between spreads', async ({ page }) => {
    await load(page, `<layout-cover id="c" data-layout-min="auto" data-layout-padding="none" data-layout-centered>
      <header id="h" data-layout="cluster" data-layout-justify="between"><strong id="brand">Brand</strong><nav aria-label="Main" id="nav">Nav</nav></header>
      <section data-layout-principal id="p"><h1>Hi</h1></section>
      <footer id="f">foot</footer></layout-cover>`);
    const cw = (await page.locator('#c').boundingBox()).width;
    expect((await page.locator('#h').boundingBox()).width).toBeCloseTo(cw, 0);
    expect((await page.locator('#f').boundingBox()).width).toBeCloseTo(cw, 0);
    expect((await page.locator('#p').boundingBox()).width).toBeLessThan(cw);
    const brand = await page.locator('#brand').boundingBox();
    const nav = await page.locator('#nav').boundingBox();
    expect(nav.x - (brand.x + brand.width)).toBeGreaterThan(cw / 2);
  });
});

test.describe('layout-center', () => {
  test('bare data-layout-gap gives the default m gap', async ({ page }) => {
    await load(page, '<layout-center id="c" data-layout-gap><p>a</p><p>b</p></layout-center>');
    const m = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.inlineSize = 'var(--size-m)';
      probe.style.display = 'block';
      document.body.append(probe);
      return `${probe.getBoundingClientRect().width}px`;
    });
    expect(await css(page, '#c', 'rowGap')).toBe(m);
  });

  test('narrow is 40rem', async ({ page }) => {
    await load(page, '<layout-center id="c" data-layout-max="narrow">x</layout-center>');
    expect(await css(page, '#c', 'maxInlineSize')).toBe('640px');
  });

  test('token-preview centre variant no longer uses data-layout', async ({ page }) => {
    await load(page, `<token-preview id="v" data-variant="center"><span data-sample>A</span></token-preview>
      <token-preview id="l" data-layout="center"><span data-sample>A</span></token-preview>`);
    expect(await css(page, '#v', 'textAlign')).toBe('center');
    // data-layout="center" is now only the layout: no text centring from token-preview
    expect(await css(page, '#l', 'textAlign')).not.toBe('center');
  });
});
