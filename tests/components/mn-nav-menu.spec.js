/**
 * menu + nav — M+N element review fixes.
 *
 * menu: toolbar keeps button fills and aria-pressed state, no focus-ring
 * clipping, separators visible in row and column menus, .context sizes to
 * content, win9x/nes dropdown chrome scoped to pop-up menus.
 * nav: logical step connectors (RTL + vertical), pagination wraps at
 * 320px, compact pagination and tree radii follow direction, breadcrumb
 * separators flip in RTL (nav.breadcrumb and <bread-crumb>), the current
 * page has a non-colour cue, .horizontal keeps a gap under data-layout.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { dir = 'ltr', head = '', theme = '' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__mn-nav-menu-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/src/main.css">${head}
      <style>*, *::before, *::after { transition: none !important; }</style>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const style = (page, sel, prop, pseudo = null) => page.$eval(sel,
  (el, [p, ps]) => getComputedStyle(el, ps).getPropertyValue(p), [prop, pseudo]);

test.describe('menu', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'desktop', 'style checks are viewport-independent');
  });

  test('toolbar keeps non-ghost fills and the pressed state', async ({ page }) => {
    await load(page, `
      <menu class="toolbar" role="toolbar" aria-label="Tools">
        <li role="none"><button type="button" id="plain">Plain</button></li>
        <li role="none"><button type="button" class="ghost" id="ghost">Ghost</button></li>
        <li role="none"><button type="button" class="ghost" aria-pressed="true" id="pressed">On</button></li>
        <li role="none"><button type="button" class="secondary" aria-pressed="true" id="sec">Sec</button></li>
      </menu>
      <button type="button" id="ref">Ref</button>`);
    const ref = await style(page, '#ref', 'background-color');
    expect(await style(page, '#plain', 'background-color')).toBe(ref);
    expect(await style(page, '#ghost', 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(await style(page, '#pressed', 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
    expect(await style(page, '#pressed', 'background-color'))
      .not.toBe(await style(page, '#ghost', 'background-color'));
    expect(await style(page, '#sec', 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('toolbar and context do not clip focus rings', async ({ page }) => {
    await load(page, `
      <menu class="toolbar" id="tb"><li><button type="button" class="ghost">A</button></li></menu>
      <menu class="context" id="cx"><li><button type="button">B</button></li></menu>`);
    expect(await style(page, '#tb', 'overflow')).toBe('visible');
    expect(await style(page, '#cx', 'overflow')).toBe('visible');
  });

  test('separators render in row and column menus', async ({ page }) => {
    await load(page, `
      <menu class="toolbar" id="tb"><li><button type="button" class="ghost">A</button></li><li role="separator" id="s1"></li><li><button type="button" class="ghost">B</button></li></menu>
      <menu id="plain"><li><button type="button">A</button></li><li role="separator" id="s2"></li><li><button type="button">B</button></li></menu>
      <menu class="context" id="cx"><li><button type="button">A</button></li><li role="separator" id="s3"></li><li><button type="button">B</button></li></menu>`);
    for (const id of ['s1', 's2']) {
      const box = await page.locator(`#${id}`).boundingBox();
      expect(box.height, id).toBeGreaterThan(10);
      expect(box.width, id).toBeGreaterThanOrEqual(1);
      expect(await style(page, `#${id}`, 'border-inline-start-style')).toBe('solid');
    }
    const cx = await page.locator('#s3').boundingBox();
    const menu = await page.locator('#cx').boundingBox();
    expect(cx.height).toBeGreaterThanOrEqual(1);
    expect(cx.width).toBeGreaterThan(menu.width / 2);
  });

  test('.context sizes to its content and uses a shadow token', async ({ page }) => {
    await load(page, `<menu class="context" id="cx"><li><button type="button">Cut</button></li><li><button type="button">Copy</button></li></menu>`);
    const box = await page.locator('#cx').boundingBox();
    const main = await page.locator('main').boundingBox();
    expect(box.width).toBeLessThan(main.width / 2);
    expect(await style(page, '#cx', 'display')).toBe('flex');
    expect(await style(page, '#cx', 'box-shadow')).not.toBe('none');
  });

  for (const theme of ['win9x', 'nes']) {
    test(`${theme}: dropdown chrome only on pop-up menus`, async ({ page }) => {
      await load(page, `
        <menu class="toolbar" id="tb"><li><button type="button" class="ghost" id="tbb">A</button></li></menu>
        <menu id="plain"><li><button type="button" id="pb">A</button></li></menu>
        <menu class="context" id="cx"><li><button type="button" id="cxb">A</button></li></menu>`,
      { theme, head: `<link rel="stylesheet" href="/src/tokens/themes/_extreme-${theme}.css">` });
      expect(await style(page, '#cx', 'box-shadow')).not.toBe('none');
      expect(await style(page, '#plain', 'box-shadow')).toBe('none');
      expect(await style(page, '#cxb', 'text-align')).toBe('start');
      const pb = await page.locator('#pb').boundingBox();
      const main = await page.locator('main').boundingBox();
      expect(pb.width).toBeLessThan(main.width / 2);
    });
  }
});

test.describe('nav', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'desktop', 'style checks are viewport-independent');
  });

  const STEPS = `
    <nav class="steps" data-labels="below" aria-label="Below" id="below"><ol>
      <li data-completed id="b1">One</li><li aria-current="step">Two</li><li>Three</li></ol></nav>
    <nav class="steps" data-direction="vertical" aria-label="Vertical" id="vert"><ol>
      <li data-completed id="v1">One</li><li aria-current="step">Two</li><li>Three</li></ol></nav>`;

  for (const dir of ['ltr', 'rtl']) {
    test(`steps connectors follow ${dir}`, async ({ page }) => {
      await load(page, STEPS, { dir });
      const geo = await page.evaluate(() => {
        const out = {};
        for (const id of ['b1', 'v1']) {
          const li = document.getElementById(id);
          const r = li.getBoundingClientRect();
          const cs = getComputedStyle(li, '::after');
          // Used insets resolve to physical px relative to the li box.
          out[id] = { li: r, left: parseFloat(cs.left), right: parseFloat(cs.right), width: parseFloat(cs.width) };
        }
        return out;
      });
      // labels-below: connector sits toward the next step (inline-end side).
      const b = geo.b1;
      if (dir === 'ltr') expect(b.left).toBeGreaterThan(b.right);
      else expect(b.right).toBeGreaterThan(b.left);
      // vertical: the line sits at the circle centre on the inline-start side.
      const v = geo.v1;
      if (dir === 'ltr') expect(v.left).toBeLessThan(v.li.width / 2);
      else expect(v.right).toBeLessThan(v.li.width / 2);
    });
  }

  test('breadcrumb separators flip in RTL (nav.breadcrumb and bread-crumb)', async ({ page }) => {
    const trail = (attrs, id) => `<nav class="breadcrumb" ${attrs} aria-label="${id}" id="${id}"><ol><li><a href="#">A</a></li><li><span aria-current="page">B</span></li></ol></nav>`;
    const comp = (attrs, id) => `<bread-crumb ${attrs} id="${id}"><ol><li><a href="#">A</a></li><li><span aria-current="page">B</span></li></ol></bread-crumb>`;
    const body = `
      <section dir="ltr">${trail('', 'l-def')}${trail('data-separator="arrow"', 'l-arrow')}${comp('', 'lc-def')}</section>
      <section dir="rtl">${trail('', 'r-def')}${trail('data-separator="chevron"', 'r-chev')}${trail('data-separator="arrow"', 'r-arrow')}${trail('data-separator="pipe"', 'r-pipe')}
        ${comp('', 'rc-def')}${comp('data-separator="arrow"', 'rc-arrow')}</section>`;
    await load(page, body);
    const sep = (id) => page.$eval(`#${id} li:first-child`, (li) => getComputedStyle(li, '::after').content);
    expect(await sep('l-def')).toContain('›');
    expect(await sep('l-arrow')).toContain('→');
    expect(await sep('lc-def')).toContain('›');
    expect(await sep('r-def')).toContain('‹');
    expect(await sep('r-chev')).toContain('‹');
    expect(await sep('r-arrow')).toContain('←');
    expect(await sep('r-pipe')).toContain('|');
    expect(await sep('rc-def')).toContain('‹');
    expect(await sep('rc-arrow')).toContain('←');
  });

  test('compact pagination and tree links round the logical ends', async ({ page }) => {
    const body = `
      <nav class="pagination" data-variant="compact" aria-label="P" id="pg"><ul>
        <li><a href="#" data-prev id="first">Prev</a></li><li><a href="#" aria-current="page">1</a></li><li><a href="#" data-next id="last">Next</a></li></ul></nav>
      <nav class="tree" aria-label="T"><details open><summary>S</summary><ul><li><a href="#" id="leaf" aria-current="page">Leaf</a></li></ul></details></nav>`;
    await load(page, body, { dir: 'rtl' });
    // In RTL the first item is on the right: its right corners are rounded.
    expect(parseFloat(await style(page, '#first', 'border-top-right-radius'))).toBeGreaterThan(0);
    expect(parseFloat(await style(page, '#first', 'border-top-left-radius'))).toBe(0);
    expect(parseFloat(await style(page, '#last', 'border-top-left-radius'))).toBeGreaterThan(0);
    // Tree accent bar on the right (inline-start), rounded corners on the left.
    expect(await style(page, '#leaf', 'border-right-style')).toBe('solid');
    expect(parseFloat(await style(page, '#leaf', 'border-top-left-radius'))).toBeGreaterThan(0);
    expect(parseFloat(await style(page, '#leaf', 'border-top-right-radius'))).toBe(0);
  });

  test('current page has an underline cue only where no other cue exists', async ({ page }) => {
    const nav = (cls, id) => `<nav class="${cls}" aria-label="${id}"><ul><li><a href="#">A</a></li><li><a href="#" aria-current="page" id="${id}">B</a></li></ul></nav>`;
    await load(page, nav('', 'plain') + nav('horizontal', 'horiz') + nav('vertical', 'vert')
      + nav('horizontal pills', 'pills') + nav('horizontal tabs', 'tabs') + nav('pagination', 'pag')
      + `<nav aria-label="opt" style="--nav-active-decoration: none"><ul><li><a href="#" aria-current="page" id="opt">B</a></li></ul></nav>`
      + `<bread-crumb><ol><li><a href="#">A</a></li><li><a href="#" aria-current="page" id="bc">B</a></li></ol></bread-crumb>`);
    for (const id of ['plain', 'horiz', 'vert']) {
      expect(await style(page, `#${id}`, 'text-decoration-line'), id).toBe('underline');
    }
    for (const id of ['pills', 'tabs', 'pag', 'opt', 'bc']) {
      expect(await style(page, `#${id}`, 'text-decoration-line'), id).toBe('none');
    }
  });

  test('current-page underline survives a theme that strips link underlines', async ({ page }) => {
    await load(page, `<nav aria-label="x"><ul><li><a href="#" aria-current="page" id="cur">B</a></li></ul></nav>`,
      { theme: 'kawaii', head: '<link rel="stylesheet" href="/src/tokens/themes/_extreme-kawaii.css">' });
    expect(await style(page, '#cur', 'text-decoration-line')).toBe('underline');
  });

  test('.horizontal keeps a gap when a data-layout resets --_gap', async ({ page }) => {
    await load(page, `<nav class="horizontal" data-layout="cluster" aria-label="x" id="n"><ul><li><a href="#">A</a></li><li><a href="#">B</a></li></ul></nav>`);
    expect(await style(page, '#n > ul', 'column-gap')).not.toBe('normal');
    expect(parseFloat(await style(page, '#n > ul', 'column-gap'))).toBeGreaterThan(0);
  });

  test('pagination current item: no dead colour, white-on-fill via token', async ({ page }) => {
    await load(page, `<nav class="pagination" aria-label="x"><ul><li><a href="#" aria-current="page" id="cur">3</a></li></ul></nav>`);
    expect(await style(page, '#cur', 'transition-property')).not.toContain('all');
  });
});

test('pagination wraps instead of overflowing at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await load(page, `
    <nav class="pagination" aria-label="Pages" id="pg"><ul>
      <li><a href="#" data-prev>Previous</a></li><li><a href="#">1</a></li><li><span data-ellipsis>…</span></li>
      <li><a href="#">4</a></li><li><a href="#" aria-current="page">5</a></li><li><a href="#">6</a></li>
      <li><span data-ellipsis>…</span></li><li><a href="#">20</a></li><li><a href="#" data-next>Next</a></li></ul></nav>`);
  const { list, nav } = await page.evaluate(() => {
    const n = document.getElementById('pg');
    return { list: n.querySelector('ul').scrollWidth, nav: n.clientWidth };
  });
  expect(list).toBeLessThanOrEqual(nav);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test.describe('demos pass axe', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'desktop', 'axe check is viewport-independent');
  });
  for (const demo of ['menu-toolbar', 'menu-pills', 'menu-context', 'menu-vertical', 'nav-steps', 'nav-rtl', 'nav-pagination-bar']) {
    test(demo, async ({ page }) => {
      await page.route('**/src/**', (route) => route.fulfill({
        path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
      }));
      const url = `/__mn-demo-${demo}.html`;
      await page.route(`**${url}`, (route) => route.fulfill({
        path: join(REPO, 'demos/snippets/demos', `${demo}.html`),
        contentType: 'text/html; charset=utf-8',
      }));
      await page.goto(url, { waitUntil: 'load' });
      await page.addScriptTag({ path: join(REPO, 'node_modules/axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => {
        const r = await window.axe.run(document, { resultTypes: ['violations'], runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] });
        return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
      });
      expect(violations).toEqual([]);
    });
  }
});
