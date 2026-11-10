/**
 * mobile-menu + nav-bar — M+N review fixes.
 *
 * mobile-menu: CSS-driven sibling hiding (restored on removal), the 52rem
 * media default before upgrade, observed `breakpoint`, panel closes on the
 * desktop switch, native Esc + focus return, token-driven current link and
 * forced-colors cue.
 * nav-bar: explicit .current survives .items, no host role around a <nav>,
 * URL matching by origin + normalised pathname, scheme-checked item hrefs,
 * data-label-new-tab, nested-mode .items, Navigation API sync, reconnect,
 * forced-colors cue.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ modules?: string[], path?: string }} [opts]
 */
async function load(page, body, { modules = [], path } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = path ?? `/__mn-n2-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      ${modules.map((m) => `<script type="module">import '${m}';</script>`).join('\n')}
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
}

const MM = '/src/custom-elements/mobile-menu/logic.js';
const NB = '/src/web-components/nav-bar/logic.js';

const HEADER = (attrs = '') => `
  <header class="site">
    <a href="/">Brand</a>
    <nav id="desk" aria-label="Main"><ul><li><a href="/a/">A</a></li></ul></nav>
    <site-tools id="tools"><button type="button">Search</button></site-tools>
    <mobile-menu ${attrs}>
      <button type="button" id="trig" data-trigger popovertarget="mm" aria-label="Menu">Menu</button>
      <nav popover id="mm" class="mobile-menu-panel" aria-label="Site menu">
        <ul>
          <li><a href="/a/" id="cur" aria-current="page">A</a></li>
          <li><a href="/b/">B</a></li>
        </ul>
      </nav>
    </mobile-menu>
  </header>
  <main><p>Content</p></main>`;

const display = (page, sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).display);

test.describe('mobile-menu', () => {
  test('mobile mode hides header siblings via CSS; removal restores them', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await load(page, HEADER(), { modules: [MM] });
    await page.waitForFunction(() => customElements.get('mobile-menu'));
    await expect(page.locator('mobile-menu')).toHaveAttribute('data-mobile', '');
    expect(await display(page, '#desk')).toBe('none');
    expect(await display(page, '#tools')).toBe('none');
    // No inline display left behind.
    expect(await page.locator('#desk').getAttribute('style')).toBeNull();

    await page.evaluate(() => document.querySelector('mobile-menu').remove());
    expect(await display(page, '#desk')).not.toBe('none');
    expect(await display(page, '#tools')).not.toBe('none');
  });

  test('default 52rem breakpoint applies in CSS before upgrade (no layout shift)', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await load(page, HEADER()); // CSS only, element never defined
    expect(await display(page, 'mobile-menu')).toBe('contents');
    expect(await display(page, '#desk')).toBe('none');
    // Native popover still works without JS.
    await page.click('#trig');
    await expect(page.locator('#mm')).toBeVisible();

    await page.setViewportSize({ width: 1200, height: 800 });
    expect(await display(page, 'mobile-menu')).toBe('none');
    expect(await display(page, '#desk')).not.toBe('none');
  });

  test('a custom breakpoint is not applied by the CSS default', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await load(page, HEADER('breakpoint="30rem"'));
    expect(await display(page, 'mobile-menu')).toBe('none');
    expect(await display(page, '#desk')).not.toBe('none');
  });

  test('breakpoint attribute is observed', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await load(page, HEADER('breakpoint="80rem"'), { modules: [MM] });
    const mm = page.locator('mobile-menu');
    await expect(mm).toHaveAttribute('data-mobile', '');
    await mm.evaluate((el) => el.setAttribute('breakpoint', '40rem'));
    await expect(mm).not.toHaveAttribute('data-mobile');
    expect(await display(page, '#desk')).not.toBe('none');
    await mm.evaluate((el) => el.setAttribute('breakpoint', '90rem'));
    await expect(mm).toHaveAttribute('data-mobile', '');
  });

  test('Esc closes the panel and returns focus to the trigger; desktop switch closes it', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await load(page, HEADER(), { modules: [MM] });
    await expect(page.locator('mobile-menu')).toHaveAttribute('data-mobile', '');
    await page.focus('#trig');
    await page.keyboard.press('Enter');
    await expect(page.locator('#mm')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mm')).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('trig');

    await page.click('#trig');
    await expect(page.locator('#mm')).toBeVisible();
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('mobile-menu')).not.toHaveAttribute('data-mobile');
    expect(await page.locator('#mm').evaluate((el) => el.matches(':popover-open'))).toBe(false);
  });

  test('current link uses the on-interactive token; forced colors add an outline', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await load(page, HEADER(), { modules: [MM] });
    await page.click('#trig');
    // Text must not take the fill colour (the native nav !important rule did).
    const pair = await page.locator('#cur').evaluate((el) => {
      const cs = getComputedStyle(el);
      return [cs.color, cs.backgroundColor];
    });
    expect(pair[0]).not.toBe(pair[1]);
    await page.evaluate(() => document.querySelector('mobile-menu').style.setProperty('--color-text-on-interactive-auto', 'rgb(1, 2, 3)'));
    // (poll: nav links transition colour)
    await expect.poll(() => page.locator('#cur').evaluate((el) => getComputedStyle(el).color)).toBe('rgb(1, 2, 3)');

    await page.emulateMedia({ forcedColors: 'active' });
    const fc = await page.locator('#cur').evaluate((el) => {
      const cs = getComputedStyle(el);
      return { outline: cs.outlineStyle, deco: cs.textDecorationLine };
    });
    expect(fc.outline).toBe('solid');
    expect(fc.deco).toContain('underline');
  });

  test('a [data-mobile-menu] sibling moves into the panel slot and back', async ({ page }) => {
    const body = `
      <header class="site">
        <a href="/">Brand</a>
        <nav id="desk" aria-label="Main"><ul><li><a href="/a/">A</a></li></ul></nav>
        <mobile-menu>
          <button type="button" id="trig" data-trigger popovertarget="mm" aria-label="Menu">Menu</button>
          <nav popover id="mm" class="mobile-menu-panel" aria-label="Site menu">
            <section id="slot" data-mobile-menu-slot><button type="button" id="search">Search</button></section>
            <ul><li><a href="/a/">A</a></li></ul>
          </nav>
        </mobile-menu>
        <button type="button" id="bell" data-mobile-menu>Bell</button>
        <button type="button" id="stay">Stays</button>
      </header>`;
    await page.setViewportSize({ width: 600, height: 800 });
    await load(page, body, { modules: [MM] });
    await page.waitForFunction(() => customElements.get('mobile-menu'));
    const where = () => page.evaluate(() => {
      const bell = document.getElementById('bell');
      return { parent: bell.parentElement.id || bell.parentElement.localName, prev: bell.previousElementSibling?.id || bell.previousElementSibling?.localName, next: bell.nextElementSibling?.id ?? null };
    });
    expect(await where()).toEqual({ parent: 'slot', prev: 'search', next: null });
    // The unmarked sibling stays in the header, visible
    expect(await display(page, '#stay')).not.toBe('none');
    // Reachable: open the menu and the moved control is in it
    await page.locator('#trig').click();
    await expect(page.locator('#mm #bell')).toBeVisible();
    await page.keyboard.press('Escape');

    // Desktop: back where it was, exactly once
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('mobile-menu')).not.toHaveAttribute('data-mobile', '');
    expect(await where()).toEqual({ parent: 'header', prev: 'mobile-menu', next: 'stay' });
    await expect(page.locator('#bell')).toBeVisible();
    expect(await page.locator('#bell').count()).toBe(1);

    // Back and forth leaves no placeholders behind
    await page.setViewportSize({ width: 600, height: 800 });
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('mobile-menu')).not.toHaveAttribute('data-mobile', '');
    const comments = await page.evaluate(() => [...document.querySelector('header').childNodes].filter((n) => n.nodeType === 8).length);
    expect(comments).toBe(0);

    // Removing the menu while mobile hands the control back
    await page.setViewportSize({ width: 600, height: 800 });
    await expect.poll(async () => (await where()).parent).toBe('slot');
    await page.evaluate(() => document.querySelector('mobile-menu').remove());
    expect((await where()).parent).toBe('header');
  });

  test('before upgrade a [data-mobile-menu] sibling is hidden at the default breakpoint; unread marks the trigger', async ({ page }) => {
    const body = `
      <header class="site">
        <a href="/">Brand</a>
        <mobile-menu>
          <button type="button" id="trig" data-trigger popovertarget="mm" aria-label="Menu">Menu</button>
          <nav popover id="mm" class="mobile-menu-panel" aria-label="Site menu"><ul><li><a href="/a/">A</a></li></ul></nav>
        </mobile-menu>
        <button type="button" id="bell" data-mobile-menu>Bell</button>
      </header>`;
    await page.setViewportSize({ width: 600, height: 800 });
    await load(page, body);
    expect(await display(page, '#bell')).toBe('none');

    await load(page, body, { modules: [MM] });
    await page.waitForFunction(() => customElements.get('mobile-menu'));
    const dot = () => page.locator('#trig').evaluate((el) => getComputedStyle(el, '::after').content);
    expect(await dot()).toBe('none');
    await page.evaluate(() => { document.getElementById('bell').dataset.unread = '2'; });
    expect(await dot()).not.toBe('none');
  });
});

test.describe('nav-bar', () => {
  const FLAT = `<nav-bar id="nb" aria-label="Main">
    <a href="/">Home</a><a href="/docs/">Docs</a><a href="/blog/">Blog</a>
  </nav-bar>`;

  test('.items keeps an explicit .current and fires no false current-changed', async ({ page }) => {
    await load(page, FLAT, { modules: [NB] });
    await page.waitForSelector('nav-bar[data-upgraded]');
    const r = await page.evaluate(() => {
      const nb = /** @type {any} */ (document.getElementById('nb'));
      nb.current = '/blog/';
      const events = [];
      nb.addEventListener('nav-bar:current-changed', (e) => events.push(e.detail));
      nb.items = [{ href: '/docs/', label: 'Docs' }, { href: '/blog/', label: 'Blog' }];
      return {
        events,
        current: nb.current,
        active: nb.querySelector('[aria-current="page"]')?.getAttribute('href') ?? null,
      };
    });
    expect(r.events).toEqual([]);
    expect(r.current).toBe('/blog/');
    expect(r.active).toBe('/blog/');
  });

  test('no host role when wrapping a <nav>; role=navigation otherwise', async ({ page }) => {
    await load(page, `${FLAT}
      <nav-bar id="wrap"><nav aria-label="Wrapped"><ul><li><a href="/docs/" data-nav-link>Docs</a></li></ul></nav></nav-bar>`,
    { modules: [NB] });
    await page.waitForSelector('#wrap[data-upgraded]');
    expect(await page.locator('#nb').getAttribute('role')).toBe('navigation');
    expect(await page.locator('#wrap').getAttribute('role')).toBeNull();
    await expect(page.getByRole('navigation')).toHaveCount(2);
  });

  test('matches by origin + normalised pathname (relative, absolute, no trailing slash)', async ({ page }) => {
    const base = `/__mn-n2-${Math.random().toString(36).slice(2)}`;
    await load(page, `
      <nav-bar id="rel" aria-label="Relative"><a href="./">Here</a><a href="../">Up</a></nav-bar>
      <nav-bar id="abs" aria-label="Absolute"><a href="http://127.0.0.1:8123${base}/guide/page">Abs</a></nav-bar>
      <nav-bar id="slash" aria-label="Slash"><a href="${base}/guide">Guide</a><a href="${base}">Root</a></nav-bar>
      <nav-bar id="ext" aria-label="External"><a href="https://example.com${base}/guide/page/">Ext</a><a href="#top">Hash</a></nav-bar>`,
    { modules: [NB], path: `${base}/guide/page/` });
    await page.waitForSelector('#ext[data-upgraded]');
    const active = (id) => page.locator(`#${id} [aria-current="page"]`).evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(await active('rel')).toEqual(['./']);
    expect(await active('abs')).toEqual([`http://127.0.0.1:8123${base}/guide/page`]);
    expect(await active('slash')).toEqual([`${base}/guide`]);
    expect(await active('ext')).toEqual([]);
  });

  test('.items renders only http(s)/relative hrefs; new-tab label is overridable', async ({ page }) => {
    await load(page, `<nav-bar id="nb" aria-label="Main" data-label-new-tab="(nouvel onglet)"></nav-bar>`, { modules: [NB] });
    await page.waitForSelector('nav-bar[data-upgraded]', { state: 'attached' });
    const r = await page.evaluate(() => {
      const nb = /** @type {any} */ (document.getElementById('nb'));
      nb.items = [
        { href: 'javascript:alert(1)', label: 'x1' },
        { href: ' JaVa\tScRipt:alert(1)', label: 'x2' },
        { href: 'data:text/html,<b>x</b>', label: 'x3' },
        { href: 'docs/', label: 'rel' },
        { href: 'https://example.com/', label: 'ext', external: true },
      ];
      return Array.from(nb.querySelectorAll(':scope > a')).map((a) => ({
        href: a.getAttribute('href'), sr: a.querySelector('.sr-only')?.textContent ?? null,
      }));
    });
    expect(r.map((x) => x.href)).toEqual([null, null, null, 'docs/', 'https://example.com/']);
    expect(r[4].sr).toBe(' (nouvel onglet)');
  });

  test('.items in nested mode keeps the nested shells and tags rendered links', async ({ page }) => {
    await load(page, `<nav-bar id="nb" aria-label="Main"><ul>
        <li><a href="/docs/" data-nav-link>Docs</a></li>
        <li><a href="/blog/" data-nav-link>Blog</a></li>
      </ul></nav-bar>`, { modules: [NB] });
    await page.waitForSelector('nav-bar[data-upgraded]');
    const r = await page.evaluate(() => {
      const nb = /** @type {any} */ (document.getElementById('nb'));
      nb.items = [{ href: '/extra/', label: 'Extra' }];
      return {
        nestedLinks: nb.querySelectorAll('li > a').length,
        rendered: Array.from(nb.querySelectorAll(':scope > a')).map((a) => a.hasAttribute('data-nav-link')),
      };
    });
    expect(r.nestedLinks).toBe(2);
    expect(r.rendered).toEqual([true]);
  });

  test('pushState re-syncs via the Navigation API (source: navigation)', async ({ page }) => {
    await load(page, FLAT, { modules: [NB] });
    await page.waitForSelector('nav-bar[data-upgraded]');
    const hasNav = await page.evaluate(() => 'navigation' in window);
    test.skip(!hasNav, 'Navigation API unavailable');
    const r = await page.evaluate(() => new Promise((resolve) => {
      const nb = document.getElementById('nb');
      nb.addEventListener('nav-bar:current-changed', (e) => resolve({
        detail: /** @type {CustomEvent} */ (e).detail,
        active: nb.querySelector('[aria-current="page"]')?.getAttribute('href'),
      }), { once: true });
      history.pushState({}, '', '/blog/post/');
    }));
    expect(r.detail.source).toBe('navigation');
    expect(r.active).toBe('/blog/');
  });

  test('pushState + popstate in one task still reports source popstate last', async ({ page }) => {
    await load(page, FLAT, { modules: [NB] });
    await page.waitForSelector('nav-bar[data-upgraded]');
    const r = await page.evaluate(() => new Promise((resolve) => {
      const nb = document.getElementById('nb');
      const events = [];
      nb.addEventListener('nav-bar:current-changed', (e) => events.push(/** @type {CustomEvent} */ (e).detail.source));
      history.pushState({}, '', '/docs/x/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      setTimeout(() => resolve(events), 0);
    }));
    expect(r).toEqual(['popstate']);
  });

  test('reconnect re-fires upgraded and keeps a single role', async ({ page }) => {
    await load(page, `<section id="host">${FLAT}</section>`, { modules: [NB] });
    await page.waitForSelector('nav-bar[data-upgraded]');
    const count = await page.evaluate(async () => {
      const nb = document.getElementById('nb');
      let n = 0;
      document.addEventListener('nav-bar:upgraded', () => { n++; });
      for (let i = 0; i < 2; i++) { nb.remove(); document.getElementById('host').append(nb); }
      await new Promise((r) => setTimeout(r, 0));
      return n;
    });
    expect(count).toBe(2);
    expect(await page.locator('#nb').getAttribute('role')).toBe('navigation');
  });

  test('forced colors: current link gets an outline', async ({ page }) => {
    await load(page, `${FLAT}`, { modules: [NB] });
    await page.waitForSelector('nav-bar[data-upgraded]');
    await page.evaluate(() => { /** @type {any} */ (document.getElementById('nb')).current = '/docs/'; });
    await page.emulateMedia({ forcedColors: 'active' });
    const outline = await page.locator('#nb [aria-current="page"]').evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).toBe('solid');
  });
});

test.describe('docs layouts: skip link', () => {
  test('every shared layout starts body with a skip link to a single main#main', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const dir = join(REPO, 'site', 'src', 'layouts');
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.html'))) {
      const html = readFileSync(join(dir, f), 'utf8');
      expect(html, f).toMatch(/<body[^>]*>\s*<a href="#main" class="skip-link">Skip to main content<\/a>/);
      expect(html.match(/id="main"/g)?.length, f).toBe(1);
      expect(html, f).toMatch(/<main id="main"/);
    }
  });

  test('skip link is off-screen until focused, then visible', async ({ page }) => {
    const { readFileSync } = await import('node:fs');
    const head = readFileSync(join(REPO, 'site', 'src', 'includes', 'head.html'), 'utf8');
    const css = head.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
    expect(css).toContain('.skip-link');
    await load(page, `<style>${css}</style><a href="#main" class="skip-link">Skip to main content</a>
      <header><a href="/">Brand</a></header><main id="main"><p>Content</p></main>`);
    const box = () => page.locator('.skip-link').boundingBox();
    expect((await box()).y + (await box()).height).toBeLessThanOrEqual(0);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.className)).toBe('skip-link');
    await expect.poll(async () => (await box()).y).toBeGreaterThanOrEqual(0);
  });
});
