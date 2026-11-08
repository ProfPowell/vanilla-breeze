/**
 * Responsive / infrastructure utilities — U3 review fixes.
 *
 * data-visible and hide-until-ready beat structural !important display rules
 * (reset-layer gates) and print shows the desktop variant; hide-until-ready
 * never hides for good (no-JS, timeout) and VB's CSS-only elements are
 * defined inertly; data-responsive stops its sizes request loop, respects
 * authored sizes/srcset and parses URLs properly; components' internal
 * visibility state moved off data-visible; the `none` view-transition preset
 * is the class vt-none and data-vt-class has logical slides; print-only keeps
 * its display type, article section breaks match real markup, notes keep
 * their box; page-toc shares heading-links' skip list and updates live.
 *
 * Tests the working tree: /src and /demos are served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

async function load(page, body, { head = '', modules = [], dir = 'ltr', htmlAttrs = '' } = {}) {
  await page.route(/\/(src|demos)\//, (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__util-v3-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '${m}';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}" ${htmlAttrs}><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/src/main.css">${head}
      ${imports ? `<script type="module">${imports}</script>` : ''}
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const display = (page, sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).display);

/* ------------------------------------------------------------ data-visible */

test.describe('data-visible', () => {
  const BODY = `
    <style>.author-flex { display: flex; }</style>
    <content-swap id="cs" data-visible="mobile"><section>front</section><section>back</section></content-swap>
    <p id="m" class="author-flex" data-visible="mobile">mobile</p>
    <p id="d" data-visible="desktop">desktop</p>`;

  test('wide: mobile variants hidden even against structural !important and author display', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await load(page, BODY);
    expect(await display(page, '#cs')).toBe('none');
    expect(await display(page, '#m')).toBe('none');
    expect(await display(page, '#d')).toBe('block');
  });

  test('narrow: desktop variant hidden, mobile shown with its own display', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await load(page, BODY);
    expect(await display(page, '#d')).toBe('none');
    expect(await display(page, '#m')).toBe('flex');
  });

  test('print shows the desktop variant even on a narrow page box', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await load(page, BODY);
    await page.emulateMedia({ media: 'print' });
    expect(await display(page, '#d')).toBe('block');
    expect(await display(page, '#m')).toBe('none');
  });

  test('back-to-top keeps an authored data-visible value (internal state is data-state-visible)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await load(page, '<a id="btt" href="#top" data-back-to-top data-visible="mobile">Top</a>',
      { modules: ['/src/utils/back-to-top-init.js'] });
    await page.waitForSelector('#btt[data-back-to-top-init]', { state: 'attached' });
    expect(await page.locator('#btt').getAttribute('data-visible')).toBe('mobile');
    expect(await display(page, '#btt')).toBe('none');
  });
});

/* ---------------------------------------------------------- hide-until-ready */

test.describe('hide-until-ready', () => {
  test('hidden until defined, then shown', async ({ page }) => {
    await load(page, '<x-late id="x" hide-until-ready>Late</x-late>');
    expect(await display(page, '#x')).toBe('none');
    await page.evaluate(() => customElements.define('x-late', class extends HTMLElement {}));
    expect(await display(page, '#x')).toBe('inline');
  });

  test('beats a structural display:grid !important (content-swap)', async ({ page }) => {
    await load(page, '<content-swap id="cs" hide-until-ready><section>a</section><section>b</section></content-swap>');
    expect(await display(page, '#cs')).toBe('none');
  });

  test('timeout reveals an element whose definition never arrives', async ({ page }) => {
    await load(page, '<x-never id="x" hide-until-ready>Never defined</x-never>',
      { head: '<style>:root { --vb-until-ready-timeout: 300ms; }</style>' });
    expect(await display(page, '#x')).toBe('none');
    await expect.poll(() => display(page, '#x'), { timeout: 3000 }).toBe('inline');
  });

  test('the timeout timer only runs while something waits', async ({ page }) => {
    await load(page, '<p>No hide-until-ready here</p><x-late id="x">plain</x-late>');
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test('never hidden when scripting is off', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await load(page, '<x-late id="x" hide-until-ready>Late</x-late>');
    expect(await display(page, '#x')).toBe('inline');
    await context.close();
  });

  test('VB CSS-only elements are defined inertly, so they are never hidden', async ({ page }) => {
    await load(page, `
      <layout-stack id="s" hide-until-ready><p>a</p></layout-stack>
      <layout-card id="c" hide-until-ready><p>b</p></layout-card>`,
    { modules: ['/src/custom-elements/register.js'] });
    await page.waitForFunction(() => customElements.get('layout-card'));
    expect(await display(page, '#s')).not.toBe('none');
    expect(await display(page, '#c')).not.toBe('none');
    const missing = await page.evaluate(async () => {
      const { INERT_ELEMENTS } = await import('/src/custom-elements/register.js');
      return INERT_ELEMENTS.filter((n) => !customElements.get(n));
    });
    expect(missing).toEqual([]);
  });

  test('show-until-ready placeholder steps aside once defined, even against !important', async ({ page }) => {
    await load(page, '<content-swap id="ph" show-until-ready>Loading…</content-swap>');
    expect(await display(page, '#ph')).toBe('grid');
    await page.evaluate(() => customElements.define('content-swap', class extends HTMLElement {}));
    expect(await display(page, '#ph')).toBe('none');
  });
});

/* ---------------------------------------------------------- data-responsive */

const PH = '/src/assets/placeholders';

test.describe('data-responsive', () => {
  test('shorthand generates candidates that exist and measures sizes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await load(page, `<img id="i" data-responsive="400,800,1200" src="${PH}/responsive.svg" width="1200" height="600" alt="x">`,
      { modules: ['/src/utils/responsive-init.js'] });
    await page.waitForFunction(() => document.getElementById('i').srcset !== '');
    const srcset = await page.locator('#i').getAttribute('srcset');
    expect(srcset).toMatch(/\/responsive-400\.svg 400w, .*\/responsive-800\.svg 800w, .*\/responsive-1200\.svg 1200w$/);
    await expect.poll(() => page.locator('#i').getAttribute('sizes')).toMatch(/^\d+px$/);
    await expect.poll(() => page.locator('#i').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  });

  test('extension-less and dotted-host URLs are handled, query kept', async ({ page }) => {
    await load(page, '', { modules: ['/src/utils/responsive-init.js'] });
    const r = await page.evaluate(async () => {
      const { buildSrcset } = await import('/src/utils/responsive-init.js');
      return {
        noExt: buildSrcset('https://images.example.com/photos/abc', [400]),
        query: buildSrcset('https://cdn.example.com/a.b/photo.jpg?v=2#x', [400, 800]),
        relative: buildSrcset('img/hero.webp', [640], 'https://site.test/blog/post/'),
      };
    });
    expect(r.noExt).toBe('');
    expect(r.query).toBe('https://cdn.example.com/a.b/photo-400.jpg?v=2#x 400w, https://cdn.example.com/a.b/photo-800.jpg?v=2#x 800w');
    expect(r.relative).toBe('https://site.test/blog/post/img/hero-640.webp 640w');
  });

  test('a missing candidate does not start a request loop', async ({ page }) => {
    let requests = 0;
    page.on('request', (req) => { if (req.url().includes('/nowhere-')) requests++; });
    await page.route('**/nowhere*', (route) => route.fulfill({ status: 404, body: '' }));
    await load(page, '<img id="i" data-responsive="400,800,1200" src="/nowhere.svg" alt="Broken on purpose">',
      { modules: ['/src/utils/responsive-init.js'] });
    await page.waitForTimeout(1500);
    expect(requests).toBeLessThan(6);
  });

  test('authored sizes and srcset are respected; x-descriptor srcset not measured', async ({ page }) => {
    await load(page, `
      <img id="a" data-responsive src="${PH}/responsive-400.svg" srcset="${PH}/responsive-400.svg 400w, ${PH}/responsive-800.svg 800w" sizes="50vw" alt="a">
      <img id="b" data-responsive="300" src="${PH}/responsive.svg" srcset="${PH}/responsive-800.svg 800w" alt="b">
      <img id="c" data-responsive src="${PH}/responsive.svg" srcset="/www/a.svg 2x" alt="c">`,
    { modules: ['/src/utils/responsive-init.js'] });
    await page.waitForFunction(() => document.getElementById('a').decoding === 'async');
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => ({
      a: document.getElementById('a').getAttribute('sizes'),
      b: document.getElementById('b').getAttribute('srcset'),
      c: document.getElementById('c').getAttribute('sizes'),
      lazy: document.getElementById('a').getAttribute('loading'),
    }));
    expect(r.a).toBe('50vw');
    expect(r.b).toBe(`${'/src/assets/placeholders'}/responsive-800.svg 800w`);
    expect(r.c).toBeNull();
    expect(r.lazy).toBeNull(); // no JS loading default: it would have no effect
  });

  test('sizes only grows', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await load(page, `<figure id="f" style="inline-size: 600px"><img id="i" data-responsive src="${PH}/responsive-400.svg" srcset="${PH}/responsive-400.svg 400w, ${PH}/responsive-800.svg 800w" width="800" height="400" alt="x"></figure>`,
      { modules: ['/src/utils/responsive-init.js'] });
    await expect.poll(() => page.locator('#i').getAttribute('sizes')).toBe('600px');
    await page.locator('#f').evaluate((f) => { f.style.inlineSize = '300px'; });
    await page.waitForTimeout(200);
    expect(await page.locator('#i').getAttribute('sizes')).toBe('600px');
    await page.locator('#f').evaluate((f) => { f.style.inlineSize = '700px'; });
    await expect.poll(() => page.locator('#i').getAttribute('sizes')).toBe('700px');
  });

  test('debug badge sits beside a <picture>, never inside it', async ({ page }) => {
    await load(page, `<figure id="f"><picture id="p"><img data-responsive data-responsive-debug src="${PH}/responsive-400.svg" srcset="${PH}/responsive-400.svg 400w" alt="x"></picture></figure>`,
      { modules: ['/src/utils/responsive-init.js'] });
    await page.waitForSelector('[data-responsive-badge]', { state: 'attached' });
    const r = await page.evaluate(() => {
      const badge = document.querySelector('[data-responsive-badge]');
      return {
        parent: badge.parentElement.id,
        next: badge.nextElementSibling.id,
        inPicture: !!document.querySelector('picture [data-responsive-badge]'),
        style: badge.getAttribute('style'),
        position: getComputedStyle(badge).position,
        parentPosition: getComputedStyle(badge.parentElement).position,
      };
    });
    expect(r).toEqual({ parent: 'f', next: 'p', inPicture: false, style: null, position: 'absolute', parentPosition: 'relative' });
  });

  test('demo images all load (no missing srcset candidates)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const failed = [];
    page.on('response', (res) => { if (res.status() >= 400) failed.push(res.url()); });
    await page.route(/\/(src|demos)\//, (route) => route.fulfill({
      path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
    }));
    await page.goto('/demos/examples/demos/responsive-basic.html', { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const broken = await page.evaluate(() => Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src));
    expect(broken).toEqual([]);
    expect(failed.filter((u) => u.includes('placeholders'))).toEqual([]);
  });
});

/* --------------------------------------------------------- view transitions */

test.describe('view-transition presets', () => {
  test('data-vt-class="none" sets vt-none; logical slides follow dir', async ({ page }) => {
    const body = `
      <section id="n" data-vt="hero" data-vt-class="none">n</section>
      <section id="f" data-vt-name="f" data-vt-class="slide-forward">f</section>
      <section id="b" data-vt-name="b" data-vt-class="slide-back">b</section>
      <section id="r" dir="rtl" data-vt-name="r" data-vt-class="slide-forward">r</section>`;
    await load(page, body, { head: '<link rel="stylesheet" href="/src/utils/view-transitions.css">' });
    const cls = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).getPropertyValue('view-transition-class'));
    expect(await cls('#n')).toBe('vt-none');
    expect(await cls('#f')).toBe('slide-left');
    expect(await cls('#b')).toBe('slide-right');
    expect(await cls('#r')).toBe('slide-right');
  });

  test('vt-none rules ship in the main bundle; no *.none rule remains', async ({ page }) => {
    await load(page, '');
    const text = await page.evaluate(() => {
      const out = [];
      const walk = (rules) => {
        for (const r of rules) {
          if (r.styleSheet) { walk(r.styleSheet.cssRules); continue; }
          out.push(r.cssText);
          if (r.cssRules) walk(r.cssRules);
        }
      };
      for (const s of document.styleSheets) { try { walk(s.cssRules); } catch { /* cross-origin */ } }
      return out.join('\n');
    });
    expect(text).toContain('::view-transition-group(*.vt-none)');
    expect(text).not.toMatch(/\(\*\.none\)/);
  });
});

/* -------------------------------------------------------------------- print */

test.describe('print utilities', () => {
  test('data-print-only keeps its own display type in print and is hidden on screen', async ({ page }) => {
    await load(page, `
      <p>Text <span id="s" data-print-only>printed</span> more.</p>
      <table id="t" data-print-only><tr><td>x</td></tr></table>
      <ul><li id="l" data-print-only>item</li></ul>`);
    expect(await display(page, '#s')).toBe('none');
    await page.emulateMedia({ media: 'print' });
    expect(await display(page, '#s')).toBe('inline');
    expect(await display(page, '#t')).toBe('table');
    expect(await display(page, '#l')).toBe('list-item');
  });

  const ARTICLE = `
    <main><article>
      <section id="s1"><h2>One</h2></section>
      <section id="s2"><h2>Two</h2></section>
    </article></main>`;

  test('article mode breaks between sections in body > main > article', async ({ page }) => {
    await load(page, ARTICLE.replace('<main>', '<main data-print="article">'));
    await page.emulateMedia({ media: 'print' });
    const r = await page.evaluate(() => ['s1', 's2'].map((id) => getComputedStyle(document.getElementById(id)).breakBefore));
    expect(r).toEqual(['auto', 'page']);
  });

  test('article mode on <html> works, and data-print-raw switches page modes off', async ({ page }) => {
    await load(page, ARTICLE, { htmlAttrs: 'data-print="article"' });
    await page.emulateMedia({ media: 'print' });
    expect(await page.locator('#s2').evaluate((el) => getComputedStyle(el).breakBefore)).toBe('page');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).page)).toBe('vb-article');
    await page.evaluate(() => document.documentElement.setAttribute('data-print-raw', ''));
    expect(await page.locator('#s2').evaluate((el) => getComputedStyle(el).breakBefore)).toBe('auto');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).page)).toBe('auto');
  });

  test('aside.note keeps its box; aria-hidden prints only with data-print-keep', async ({ page }) => {
    await load(page, `
      <aside id="n" class="note"><p>Note</p></aside>
      <aside id="a"><p>Sidebar</p></aside>
      <span id="h" aria-hidden="true">decor</span>
      <span id="k" aria-hidden="true" data-print-keep>chart</span>`);
    await page.emulateMedia({ media: 'print' });
    const pad = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).paddingInlineStart);
    expect(await pad('#n')).not.toBe('0px');
    expect(await pad('#a')).toBe('0px');
    expect(await display(page, '#h')).toBe('none');
    expect(await display(page, '#k')).toBe('inline');
  });
});

/* ---------------------------------------------------------- data-toc-ignore */

test.describe('page-toc skip list', () => {
  const TOC = `
    <page-toc id="toc" scope="#doc" levels="h2,h3"></page-toc>
    <article id="doc">
      <h2 id="a">A</h2>
      <section data-toc-ignore><h2 id="ign">Ignored</h2></section>
      <dialog><h2 id="dlg">In dialog</h2></dialog>
      <browser-window><h2 id="bw">In demo frame</h2></browser-window>
      <h2 id="hid" hidden>Hidden</h2>
      <details><summary>More</summary><h3 id="det">In closed details</h3></details>
      <h2 id="b">B</h2>
    </article>`;

  const ids = (page) => page.locator('#toc a.link').evaluateAll((as) => as.map((a) => a.getAttribute('href')));

  test('skips ignored, dialog, browser-window and unrendered headings; keeps closed details', async ({ page }) => {
    await load(page, TOC, { modules: ['/src/web-components/page-toc/logic.js'] });
    await expect.poll(() => ids(page)).toEqual(['#a', '#det', '#b']);
  });

  test('updates live when data-toc-ignore changes or headings are added', async ({ page }) => {
    await load(page, TOC, { modules: ['/src/web-components/page-toc/logic.js'] });
    await expect.poll(() => ids(page)).toEqual(['#a', '#det', '#b']);
    await page.evaluate(() => document.getElementById('a').setAttribute('data-toc-ignore', ''));
    await expect.poll(() => ids(page)).toEqual(['#det', '#b']);
    await page.evaluate(() => {
      const h = Object.assign(document.createElement('h2'), { id: 'c', textContent: 'C' });
      document.getElementById('doc').append(h);
    });
    await expect.poll(() => ids(page)).toEqual(['#det', '#b', '#c']);
  });
});
