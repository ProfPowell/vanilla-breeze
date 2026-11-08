/**
 * Layout CSS fixes (layout-docs review, agent L1).
 *
 * Every assertion measures computed styles / boxes on the working tree:
 * /src is routed to disk, so this tests the edited CSS, not the build.
 *
 * Covers:
 *  - data-layout="holy-grail" / "dashboard" are gone (no grid from them);
 *    data-page-layout holy-grail/dashboard cover what they did, on any element.
 *  - page-layout templates resolve on the host: data-layout-sidebar-width,
 *    data-sidebar="collapsed" and a host-level --_sidebar-width reach the grid.
 *  - nav in a page layout is a size container, so @container region-nav matches
 *    (but not in auto-sized nav columns, where it would collapse the nav).
 *  - bare data-page-layout is a stack.
 *  - the region-main narrow-sidebar rule applies to <layout-sidebar> and
 *    data-layout="sidebar" alike, and respects data-layout-nowrap.
 *  - regions / media place extra children in flow instead of overlapping.
 *  - main[data-layout="sidebar-*"] resets --_gap and honours
 *    data-layout-gap / data-layout-sidebar-width.
 *  - dashboard drawer below 48rem: closed = visibility:hidden (not focusable),
 *    opens with data-nav-open or as a native popover; RTL slides from the right.
 *  - data-layout-density follows rem (root font size), not px.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { width = 1280, height = 800, dir = 'ltr', htmlStyle = '', css = '' } = {}) {
  await page.setViewportSize({ width, height });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__layout-css-fixes-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"${htmlStyle ? ` style="${htmlStyle}"` : ''}><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <style>body { margin: 0; } ${css}</style>
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const box = (page, sel) => page.locator(sel).first().evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
    right: Math.round(r.right), bottom: Math.round(r.bottom) };
});
const style = (page, sel, prop) => page.locator(sel).first()
  .evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

const SHELL = (attrs, { aside = false, nav = true } = {}) => `
  <section id="L" data-page-layout${attrs}>
    <header>Header</header>
    ${nav ? '<nav id="N"><a href="#">Link</a></nav>' : ''}
    <main id="M">Main</main>
    ${aside ? '<aside id="A">Aside</aside>' : ''}
    <footer>Footer</footer>
  </section>`;

test.describe('data-layout holy-grail / dashboard removed', () => {
  test('data-layout="holy-grail" and "dashboard" no longer make a grid', async ({ page }) => {
    await load(page, `
      <section id="hg" data-layout="holy-grail"><header>h</header><nav>n</nav><main>m</main></section>
      <section id="db" data-layout="dashboard"><header>h</header><nav>n</nav><main>m</main></section>`);
    expect(await style(page, '#hg', 'display')).not.toBe('grid');
    expect(await style(page, '#db', 'display')).not.toBe('grid');
  });

  test('data-page-layout="holy-grail" on a <section> gives nav / main / aside columns', async ({ page }) => {
    await load(page, SHELL('="holy-grail"', { aside: true }));
    const n = await box(page, '#N'); const m = await box(page, '#M'); const a = await box(page, '#A');
    expect(n.w).toBe(256);
    expect(a.w).toBe(256);
    expect(m.x).toBeGreaterThan(n.right);
    expect(a.x).toBeGreaterThan(m.right);
    expect(n.y).toBe(m.y);
  });
});

test.describe('page-layout sidebar width resolves on the host', () => {
  for (const [label, attrs, nav, aside] of [
    ['sidebar-left default', '="sidebar-left"', 256, null],
    ['sidebar-left narrow', '="sidebar-left" data-layout-sidebar-width="narrow"', 192, null],
    ['sidebar-left wide', '="sidebar-left" data-layout-sidebar-width="wide"', 320, null],
    ['sidebar-left collapsed', '="sidebar-left" data-sidebar="collapsed"', 64, null],
    ['sidebar-right wide', '="sidebar-right" data-layout-sidebar-width="wide"', null, 320],
    ['holy-grail narrow', '="holy-grail" data-layout-sidebar-width="narrow"', 192, 192],
    ['holy-grail collapsed', '="holy-grail" data-sidebar="collapsed"', 64, 64],
    ['dashboard default (content-sized)', '="dashboard"', 'auto', null],
    ['dashboard narrow', '="dashboard" data-layout-sidebar-width="narrow"', 192, null],
    ['app-shell wide', '="app-shell" data-layout-sidebar-width="wide"', 320, null],
  ]) {
    test(label, async ({ page }) => {
      await load(page, SHELL(attrs, { aside: aside !== null }));
      if (nav === 'auto') {
        const n = await box(page, '#N');
        expect(n.w).toBeGreaterThan(0);
        expect(n.w).toBeLessThan(200);
      } else if (nav !== null) {
        expect((await box(page, '#N')).w).toBe(nav);
      }
      if (aside !== null) expect((await box(page, '#A')).w).toBe(aside);
    });
  }

  for (const [label, attrs, opts] of [
    ['sidebar-left without nav', '="sidebar-left"', { nav: false }],
    ['sidebar-left data-sidebar="hidden"', '="sidebar-left" data-sidebar="hidden"', {}],
    ['holy-grail without nav or aside', '="holy-grail"', { nav: false }],
    ['holy-grail data-sidebar="hidden" without aside', '="holy-grail" data-sidebar="hidden"', {}],
  ]) {
    test(`${label}: main spans the full width`, async ({ page }) => {
      await load(page, SHELL(attrs, opts));
      expect((await box(page, '#M')).w).toBe((await box(page, '#L')).w);
      expect((await box(page, '#M')).x).toBe(0);
    });
  }

  test('a host-level --_sidebar-width / --sidebar-width override reaches the template', async ({ page }) => {
    await load(page, SHELL('="sidebar-left" class="w"'), { css: '.w { --sidebar-width: 18rem; }' });
    expect((await box(page, '#N')).w).toBe(288);
  });
});

test.describe('region containers', () => {
  test('@container region-nav matches in a page layout nav', async ({ page }) => {
    await load(page, SHELL('="sidebar-left"'), {
      css: '@container region-nav (width > 10rem) { #N a { outline: 3px solid rgb(1, 2, 3); } }',
    });
    expect(await style(page, '#N', 'container-type')).toBe('inline-size');
    expect(await style(page, '#N a', 'outline-color')).toBe('rgb(1, 2, 3)');
  });

  test('an auto-sized nav column (app-shell, default dashboard) keeps its width', async ({ page }) => {
    for (const v of ['app-shell', 'dashboard']) {
      await load(page, SHELL(`="${v}"`));
      expect(await style(page, '#N', 'container-type')).toBe('normal');
      expect((await box(page, '#N')).w).toBeGreaterThan(20);
    }
  });

  test('bare data-page-layout is a stack', async ({ page }) => {
    await load(page, SHELL(''));
    const ys = await page.locator('#L > *').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().y)));
    expect(new Set(ys).size).toBe(ys.length);
    expect([...ys]).toEqual([...ys].sort((a, b) => a - b));
    expect((await box(page, '#M')).w).toBe((await box(page, '#L')).w);
  });
});

test.describe('narrow region-main sidebar (both forms)', () => {
  const page2 = (inner) => `
    <section data-page-layout="sidebar-left">
      <nav>n</nav>
      <main>${inner}</main>
    </section>`;
  for (const [label, open, close] of [
    ['<layout-sidebar>', '<layout-sidebar id="S"', '</layout-sidebar>'],
    ['data-layout="sidebar"', '<section data-layout="sidebar" id="S"', '</section>'],
  ]) {
    test(`${label} stacks when region-main < 40rem`, async ({ page }) => {
      // 860 - 256 nav - 16 gap = 588px main = 36.75rem
      await load(page, page2(`${open}><aside id="SA">side</aside><article id="SC">content</article>${close}`), { width: 860 });
      const s = await box(page, '#S'); const a = await box(page, '#SA'); const c = await box(page, '#SC');
      expect(a.w).toBe(s.w);
      expect(c.w).toBe(s.w);
      expect(c.y).toBeGreaterThanOrEqual(a.bottom);
      expect(await style(page, '#S', 'flex-direction')).toBe('row');
    });

    test(`${label} with data-layout-nowrap stays a row in a narrow region-main`, async ({ page }) => {
      await load(page, page2(`${open} data-layout-nowrap><aside id="SA">side</aside><article id="SC">content</article>${close}`), { width: 860 });
      const a = await box(page, '#SA'); const c = await box(page, '#SC');
      expect(a.y).toBe(c.y);
      expect(c.x).toBeGreaterThan(a.x);
    });

    test(`${label} stays a row when region-main is wide`, async ({ page }) => {
      await load(page, page2(`${open}><aside id="SA">side</aside><article id="SC">content</article>${close}`), { width: 1400 });
      const a = await box(page, '#SA'); const c = await box(page, '#SC');
      expect(a.y).toBe(c.y);
      expect(c.x).toBeGreaterThan(a.right);
      expect(a.w).toBeLessThan(300);
    });
  }
});

test.describe('regions / media place extra children in flow', () => {
  test('regions: header, bare h3 + p, footer stack without overlap', async ({ page }) => {
    await load(page, `
      <article id="R" data-layout="regions" data-layout-gap="s">
        <footer id="F">Footer first in DOM</footer>
        <h3 id="H">Title</h3>
        <p id="P">Body text</p>
        <header id="HD">Header</header>
      </article>`);
    const hd = await box(page, '#HD'); const h = await box(page, '#H');
    const p = await box(page, '#P'); const f = await box(page, '#F');
    expect(h.y).toBeGreaterThanOrEqual(hd.bottom);
    expect(p.y).toBeGreaterThanOrEqual(h.bottom);
    expect(f.y).toBeGreaterThanOrEqual(p.bottom);
  });

  test('regions: the section takes the spare height; without one the footer is pinned', async ({ page }) => {
    await load(page, `
      <article id="R1" data-layout="regions" style="block-size: 400px">
        <header>H</header><section id="S1">S</section><footer id="F1">F</footer>
      </article>
      <article id="R2" data-layout="regions" style="block-size: 400px">
        <header>H</header><p>p</p><footer id="F2">F</footer>
      </article>`);
    const r1 = await box(page, '#R1'); const f1 = await box(page, '#F1'); const s1 = await box(page, '#S1');
    expect(f1.bottom).toBe(r1.bottom);
    expect(s1.h).toBeGreaterThan(300);
    const r2 = await box(page, '#R2'); const f2 = await box(page, '#F2');
    expect(f2.bottom).toBe(r2.bottom);
  });

  const IMG = '<img id="I" alt="" width="80" height="200" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%22200%22/%3E">';

  test('media: h3 + p beside a tall figure stack in the content column, packed to the top', async ({ page }) => {
    await load(page, `<article id="M" data-layout="media">${IMG}<h3 id="H" style="margin:0">Title</h3><p id="P" style="margin:0">Body</p></article>`, { width: 800 });
    const i = await box(page, '#I'); const h = await box(page, '#H'); const p = await box(page, '#P');
    expect(h.x).toBeGreaterThan(i.right);
    expect(p.x).toBe(h.x);
    expect(p.y).toBeGreaterThanOrEqual(h.bottom);
    expect(h.y).toBe(i.y);
    // the gap (16px), not the figure's height, separates the two rows
    expect(p.y - h.bottom).toBe(16);
  });

  test('media reverse: content on the start side, figure on the end', async ({ page }) => {
    await load(page, `<article data-layout="media" data-layout-reverse>${IMG}<h3 id="H">Title</h3><p id="P">Body</p></article>`, { width: 800 });
    const i = await box(page, '#I'); const h = await box(page, '#H'); const p = await box(page, '#P');
    expect(i.x).toBeGreaterThan(h.right);
    expect(p.y).toBeGreaterThanOrEqual(h.bottom);
  });

  test('media in a narrow container stacks figure-first, content below in order', async ({ page }) => {
    await load(page, `<section style="inline-size: 300px"><article data-layout="media" data-layout-reverse>${IMG}<h3 id="H">Title</h3><p id="P">Body</p></article></section>`, { width: 800 });
    const i = await box(page, '#I'); const h = await box(page, '#H'); const p = await box(page, '#P');
    expect(h.y).toBeGreaterThanOrEqual(i.bottom);
    expect(p.y).toBeGreaterThanOrEqual(h.bottom);
  });
});

test.describe('main sidebar-* modifiers', () => {
  test('resets an inherited --_gap and honours data-layout-gap / sidebar-width', async ({ page }) => {
    await load(page, `
      <section data-layout="grid" data-layout-gap="3xl">
        <main id="M1" data-layout="sidebar-left"><nav id="N1">n</nav><article>a</article></main>
      </section>
      <main id="M2" data-layout="sidebar-left" data-layout-gap="xl" data-layout-sidebar-width="narrow">
        <nav id="N2">n</nav><article>a</article>
      </main>
      <main id="M3" data-layout="sidebar-right" data-layout-sidebar-width="wide">
        <article>a</article><aside id="A3">s</aside>
      </main>`);
    expect(await style(page, '#M1', 'column-gap')).toBe('16px');
    expect((await box(page, '#N1')).w).toBe(256);
    expect(await style(page, '#M2', 'column-gap')).toBe('32px');
    expect((await box(page, '#N2')).w).toBe(192);
    expect((await box(page, '#A3')).w).toBe(320);
  });

  test('without its nav / aside the article takes the full width', async ({ page }) => {
    await load(page, `
      <main id="M1" data-layout="sidebar-left"><article id="A1">a</article></main>
      <main id="M2" data-layout="sidebar-right"><article id="A2">a</article></main>`);
    expect((await box(page, '#A1')).w).toBe((await box(page, '#M1')).w);
    expect((await box(page, '#A2')).w).toBe((await box(page, '#M2')).w);
  });

  test('a page-layout sidebar width does not leak into a nested main sidebar', async ({ page }) => {
    await load(page, `
      <section data-page-layout="sidebar-left" data-layout-sidebar-width="wide">
        <nav>n</nav>
        <main data-layout="sidebar-left"><nav id="IN">inner</nav><article>a</article></main>
      </section>`);
    expect((await box(page, '#IN')).w).toBe(256);
  });
});

test.describe('dashboard drawer below 48rem', () => {
  const DASH = (attrs = '', navAttrs = '') => `
    <section id="L" data-page-layout="dashboard"${attrs}>
      <header>Header <button type="button" id="T" data-nav-toggle ${navAttrs.includes('popover') ? 'popovertarget="N"' : ''}>Menu</button></header>
      <nav id="N" aria-label="App" ${navAttrs}><a id="NL" href="#">Link</a></nav>
      <main id="M">Main <a id="ML" href="#">after</a></main>
    </section>`;

  test('closed drawer is visibility:hidden and its links are not focusable', async ({ page }) => {
    await load(page, DASH(), { width: 600 });
    expect(await style(page, '#N', 'visibility')).toBe('hidden');
    expect(await style(page, '#N', 'position')).toBe('fixed');
    const focused = await page.evaluate(() => { document.getElementById('NL').focus(); return document.activeElement?.id; });
    expect(focused).not.toBe('NL');
    // main is full width: the nav no longer takes a column
    expect((await box(page, '#M')).w).toBe(600);
  });

  test('data-nav-open shows the drawer at the inline start', async ({ page }) => {
    await load(page, DASH(' data-nav-open'), { width: 600 });
    expect(await style(page, '#N', 'visibility')).toBe('visible');
    await expect.poll(async () => (await box(page, '#N')).x).toBe(0);
    expect((await box(page, '#N')).w).toBe(256);
    const focused = await page.evaluate(() => { document.getElementById('NL').focus(); return document.activeElement?.id; });
    expect(focused).toBe('NL');
  });

  test('RTL: the closed drawer sits off the right edge and opens on the right', async ({ page }) => {
    await load(page, DASH(), { width: 600, dir: 'rtl' });
    expect(await style(page, '#N', 'translate')).toBe('100%');
    await page.evaluate(() => document.getElementById('L').setAttribute('data-nav-open', ''));
    await expect.poll(async () => (await box(page, '#N')).right).toBe(600);
  });

  test('native popover pattern: hidden until the toggle opens it, no script', async ({ page }) => {
    await load(page, DASH('', 'popover'), { width: 600 });
    await expect(page.locator('#N')).toBeHidden();
    await expect(page.locator('#T')).toBeVisible();
    await page.click('#T');
    await expect(page.locator('#N')).toBeVisible();
    expect(await style(page, '#N', 'visibility')).toBe('visible');
    expect((await box(page, '#N')).x).toBe(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#N')).toBeHidden();
  });

  test('popover nav renders in its column at 48rem+, and the toggle hides', async ({ page }) => {
    await load(page, DASH(' data-layout-sidebar-width="narrow"', 'popover'), { width: 1280 });
    await expect(page.locator('#N')).toBeVisible();
    expect(await style(page, '#N', 'position')).toBe('static');
    expect((await box(page, '#N')).w).toBe(192);
    expect((await box(page, '#N')).x).toBe(0);
    await expect(page.locator('#T')).toBeHidden();
  });

  test('data-layout-nowrap keeps the nav column on narrow screens', async ({ page }) => {
    await load(page, DASH(' data-layout-nowrap data-layout-sidebar-width="narrow"'), { width: 600 });
    expect(await style(page, '#N', 'visibility')).toBe('visible');
    expect(await style(page, '#N', 'position')).toBe('static');
    expect((await box(page, '#N')).w).toBe(192);
    await expect(page.locator('#T')).toBeHidden();
  });
});

test.describe('data-layout-density follows rem', () => {
  test('compact / spacious steps scale with the root font size', async ({ page }) => {
    const body = `
      <section data-layout-density="compact"><p id="C" style="padding: var(--size-m)">c</p></section>
      <section data-layout-density="spacious"><p id="S" style="padding: var(--size-m)">s</p></section>`;
    await load(page, body);
    expect(await style(page, '#C', 'padding-top')).toBe('12px');
    expect(await style(page, '#S', 'padding-top')).toBe('24px');
    await load(page, body, { htmlStyle: 'font-size: 20px' });
    expect(await style(page, '#C', 'padding-top')).toBe('15px');
    expect(await style(page, '#S', 'padding-top')).toBe('30px');
  });
});
