/**
 * K+L review fixes — layouts A (grid, columns, stack, switcher, text, and
 * the private-prop reset shared by center, cluster and cover).
 *
 * Covers: private --_* props no longer inherit into nested layouts; grid
 * tracks clamp to the container; non-stretch stacks keep sectioning
 * children from collapsing; switcher reverse reverses the STACKED order
 * only; columns' prose reset beats theme heading borders, measure works in
 * multi-column, fixed counts collapse on their own width; layout-text bleed
 * works uncentered/centered without horizontal overflow; extra spacing for
 * table/code-block/blockquote.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { theme = '' } = {}) {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__kl-layouts-a-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
      ${theme ? `<link rel="stylesheet" href="/src/tokens/themes/_extreme-${theme}.css">` : ''}
      <link rel="stylesheet" href="/src/main.css">
      <style>
        body { margin: 0; }
        .box { inline-size: var(--w, 800px); }
        .offset { margin-inline-start: 200px; }
      </style>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const css = (page, sel, prop) => page.$eval(sel, (el, p) => getComputedStyle(el).getPropertyValue(p), prop);
const rect = (page, sel) => page.$eval(sel, (el) => el.getBoundingClientRect().toJSON());

test.describe('private props do not leak into nested layouts', () => {
  const cases = [
    // [name, outer markup open, inner tag, property]
    ['grid gap', '<layout-grid data-layout-gap="3xl" data-layout-min="xl">', 'layout-grid', 'column-gap'],
    ['grid min', '<layout-grid data-layout-gap="3xl" data-layout-min="xl">', 'layout-grid', 'grid-template-columns'],
    ['stack gap', '<layout-stack data-layout-gap="3xl">', 'layout-stack', 'row-gap'],
    ['switcher gap', '<layout-switcher data-layout-gap="3xl" data-layout-threshold="l">', 'layout-switcher', 'column-gap'],
    ['cluster gap', '<layout-cluster data-layout-gap="3xl" data-layout-align="end">', 'layout-cluster', 'column-gap'],
    ['cluster align', '<layout-cluster data-layout-gap="3xl" data-layout-align="end">', 'layout-cluster', 'align-items'],
    ['cover padding', '<layout-cover data-layout-padding="xl" data-layout-min="s">', 'layout-cover', 'padding-inline-start'],
    ['cover min', '<layout-cover data-layout-padding="xl" data-layout-min="s">', 'layout-cover', 'min-block-size'],
    ['center max', '<layout-center data-layout-max="narrow">', 'layout-center', 'max-inline-size'],
    ['text measure', '<layout-text data-layout-measure="narrow">', 'layout-text', 'max-inline-size'],
  ];

  for (const [name, outer, inner, prop] of cases) {
    test(`${name}: a bare nested ${inner} gets the default`, async ({ page }) => {
      const close = `</${outer.match(/^<([a-z-]+)/)[1]}>`;
      await load(page, `
        <section class="box">
          <${inner} id="ref"><p>a</p><p>b</p></${inner}>
        </section>
        <section class="box">
          ${outer}<${inner} id="nested"><p>a</p><p>b</p></${inner}><p>sibling</p>${close}
        </section>`);
      // Same width context: compare the nested one to a standalone default.
      await page.$eval('#nested', (el) => { el.style.inlineSize = '600px'; });
      await page.$eval('#ref', (el) => { el.style.inlineSize = '600px'; });
      expect(await css(page, '#nested', prop)).toBe(await css(page, '#ref', prop));
    });
  }

  test('switcher threshold token does not leak (nested switcher switches at 30rem)', async ({ page }) => {
    // 34rem wide: rows for a 30rem threshold, stacked for the outer's 40rem.
    await load(page, `
      <layout-switcher data-layout-threshold="l" data-layout-limit="2">
        <layout-switcher id="nested" style="inline-size: 34rem"><span id="a">A</span><span id="b">B</span></layout-switcher>
        <p>x</p><p>y</p>
      </layout-switcher>`);
    const a = await rect(page, '#a');
    const b = await rect(page, '#b');
    expect(Math.round(a.top)).toBe(Math.round(b.top));
  });

  test('cluster overlap still applies to an item that is itself a cluster', async ({ page }) => {
    await load(page, `
      <layout-cluster data-layout-overlap="l">
        <span>1</span><layout-cluster id="item"><span>2</span></layout-cluster>
      </layout-cluster>`);
    expect(await css(page, '#item', 'margin-inline-start')).toBe('-16px');
  });
});

test.describe('layout-grid', () => {
  for (const form of ['element', 'attribute']) {
    test(`${form} form: min xl in a 300px box does not overflow`, async ({ page }) => {
      const grid = form === 'element'
        ? '<layout-grid id="g" data-layout-min="xl"><p>a</p><p>b</p></layout-grid>'
        : '<section id="g" data-layout="grid" data-layout-min="xl"><p>a</p><p>b</p></section>';
      await load(page, `<section class="box" style="--w: 300px">${grid}</section>`);
      const { scroll, client, cols } = await page.$eval('#g', (el) => ({
        scroll: el.scrollWidth, client: el.clientWidth, cols: getComputedStyle(el).gridTemplateColumns,
      }));
      expect(scroll).toBeLessThanOrEqual(client);
      expect(cols).toBe('300px');
    });
  }

  test('subgrid "3" spans three rows like the bare form', async ({ page }) => {
    await load(page, `
      <layout-grid data-layout-subgrid="3">
        <article id="c"><h3>T</h3><p>B</p><footer>F</footer></article>
      </layout-grid>`);
    expect(await css(page, '#c', 'grid-row-start')).toBe('span 3');
  });
});

test.describe('layout-stack alignment', () => {
  for (const [form, open, close] of [
    ['element', '<layout-stack data-layout-align="center">', '</layout-stack>'],
    ['attribute', '<section data-layout="stack" data-layout-align="center">', '</section>'],
  ]) {
    test(`${form} form: a section child keeps its content width`, async ({ page }) => {
      await load(page, `<section class="box">${open}<section id="kid"><p>Section content here</p></section>${close}</section>`);
      const r = await rect(page, '#kid');
      expect(r.width).toBeGreaterThan(50);
      expect(await css(page, '#kid', 'container-type')).toBe('normal');
    });
  }

  test('data-container opts the child back into container queries', async ({ page }) => {
    await load(page, `<layout-stack data-layout-align="start"><section id="kid" data-container><p>x</p></section></layout-stack>`);
    expect(await css(page, '#kid', 'container-type')).toBe('inline-size');
  });

  test('stretch keeps container-type on section children', async ({ page }) => {
    await load(page, `<layout-stack data-layout-align="stretch"><section id="kid"><p>x</p></section></layout-stack>`);
    expect(await css(page, '#kid', 'container-type')).toBe('inline-size');
  });
});

test.describe('layout-switcher reverse', () => {
  const markup = (w, extra = '') => `
    <layout-switcher data-layout-reverse ${extra} style="inline-size: ${w}px">
      <span id="a">A</span><span id="b">B</span>
    </layout-switcher>`;

  test('stacked (narrow): last item on top, without a threshold attribute', async ({ page }) => {
    await load(page, markup(200));
    const a = await rect(page, '#a');
    const b = await rect(page, '#b');
    expect(b.top).toBeLessThan(a.top);
  });

  test('row (wide): DOM order kept', async ({ page }) => {
    await load(page, markup(700));
    const a = await rect(page, '#a');
    const b = await rect(page, '#b');
    expect(Math.round(a.top)).toBe(Math.round(b.top));
    expect(a.left).toBeLessThan(b.left);
  });

  test('works with a threshold too', async ({ page }) => {
    await load(page, markup(300, 'data-layout-threshold="s"'));
    const a = await rect(page, '#a');
    const b = await rect(page, '#b');
    expect(b.top).toBeLessThan(a.top);
  });
});

const PROSE = Array.from({ length: 6 }, (_, i) => `<p id="p${i}">Paragraph ${i} with enough words to wrap across a few lines of a reading column in the flow.</p>`).join('');

test.describe('layout-columns', () => {
  test('prose reset beats the brutalist h2 border; nested components keep theirs', async ({ page }) => {
    await load(page, `
      <h2 id="outside">Outside</h2>
      <layout-columns data-layout-column-count="2">
        <h2 id="inside">Inside</h2>${PROSE}
        <details><summary>More</summary><h2 id="deep">Deep</h2></details>
      </layout-columns>`, { theme: 'brutalist' });
    expect(await css(page, '#outside', 'border-block-end-width')).toBe('4px');
    expect(await css(page, '#inside', 'border-block-end-width')).toBe('0px');
    expect(await css(page, '#deep', 'border-block-end-width')).toBe('4px');
  });

  test('measure caps each column in count 2; without it the block fills', async ({ page }) => {
    await load(page, `
      <section class="box" style="--w: 1200px">
        <layout-columns id="m" data-layout-column-count="2" data-layout-measure="narrow">${PROSE}</layout-columns>
        <layout-columns id="n" data-layout-column-count="2">${PROSE}</layout-columns>
      </section>`);
    expect(await css(page, '#m', 'max-inline-size')).not.toBe('none');
    expect((await rect(page, '#m')).width).toBeLessThan(1200);
    expect(await css(page, '#n', 'max-inline-size')).toBe('none');
    expect(Math.round((await rect(page, '#n')).width)).toBe(1200);
  });

  test('count 3 collapses to one column in a phone-width container', async ({ page }) => {
    await load(page, `<section class="box" style="--w: 320px"><layout-columns data-layout-column-count="3">${PROSE}</layout-columns></section>`);
    const lefts = await page.$$eval('layout-columns p', (ps) => ps.map((p) => Math.round(p.getBoundingClientRect().left)));
    expect(new Set(lefts).size).toBe(1);
  });

  test('auto answers to the container width, not the viewport', async ({ page }) => {
    await load(page, `
      <section class="box" style="--w: 500px"><layout-columns id="narrow" data-layout-column-count="auto">${PROSE}</layout-columns></section>
      <section class="box" style="--w: 1200px"><layout-columns id="wide" data-layout-column-count="auto">${PROSE}</layout-columns></section>`);
    const lefts = (sel) => page.$$eval(`${sel} p`, (ps) => new Set(ps.map((p) => Math.round(p.getBoundingClientRect().left))).size);
    expect(await lefts('#narrow')).toBe(1);
    expect(await lefts('#wide')).toBeGreaterThan(1);
  });
});

test.describe('layout-text', () => {
  test('bleed in an uncentered layout-text fills the container, no overflow', async ({ page }) => {
    await load(page, `
      <section class="box offset">
        <layout-text><p>Intro</p><figure id="bleed" data-bleed><p>Wide</p></figure><p>After</p></layout-text>
      </section>`);
    const box = await rect(page, 'section.box');
    const b = await rect(page, '#bleed');
    expect(Math.round(b.left)).toBe(Math.round(box.left));
    expect(Math.round(b.width)).toBe(Math.round(box.width));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('bleed in a centered layout-text spans the container symmetrically', async ({ page }) => {
    await load(page, `
      <section class="box offset">
        <layout-text data-layout-centered data-layout-measure="narrow"><p>Intro</p><figure id="bleed" data-bleed><p>Wide</p></figure></layout-text>
      </section>`);
    const box = await rect(page, 'section.box');
    const b = await rect(page, '#bleed');
    expect(Math.round(b.left)).toBe(Math.round(box.left));
    expect(Math.round(b.right)).toBe(Math.round(box.right));
  });

  test('bleed on an article[data-layout="prose"] host (itself a container) still breaks out', async ({ page }) => {
    await load(page, `
      <section class="box offset">
        <article id="host" data-layout="prose" data-layout-centered><p>Intro</p><figure id="bleed" data-bleed><p>Wide</p></figure></article>
      </section>`);
    expect(await css(page, '#host', 'container-type')).toBe('normal');
    const box = await rect(page, 'section.box');
    expect(Math.round((await rect(page, '#bleed')).width)).toBe(Math.round(box.width));
  });

  test('bleed spans all columns in a multi-column flow', async ({ page }) => {
    await load(page, `<layout-columns data-layout-column-count="2">${PROSE}<figure id="bleed" data-bleed><p>Wide</p></figure>${PROSE}</layout-columns>`);
    expect(await css(page, '#bleed', 'column-span')).toBe('all');
  });

  test('table, code-block and blockquote get the larger block spacing', async ({ page }) => {
    await load(page, `
      <layout-text>
        <p>a</p><figure id="fig"><p>f</p></figure>
        <p>b</p><table id="t"><tbody><tr><td>1</td></tr></tbody></table>
        <p>c</p><blockquote id="q"><p>q</p></blockquote>
        <p>d</p><code-block id="cb"></code-block>
      </layout-text>`);
    const fig = await css(page, '#fig', 'margin-block-start');
    for (const id of ['#t', '#q', '#cb']) expect(await css(page, id, 'margin-block-start')).toBe(fig);
  });
});
