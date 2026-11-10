/**
 * glossary-wc + glossary-index — G/H-review fixes (vanilla-breeze-wja7).
 *
 * glossary-wc: moving the element keeps its terms; src mode (with/without a
 * fallback <dl>) fetches once, fires ready once, and has an error state;
 * JSON definitions render as text (definitionHtml is sanitized opt-in);
 * one jump target per letter, letters derived from the terms with
 * Intl.Collator (non-Latin, accents, "#"); counts are not live regions;
 * searching reveals matches in collapsed categories, disables empty
 * letters and announces when cleared; data-title heading.
 *
 * glossary-index: reconnect injects one search; permalinks copy the term
 * URL and stay on the page under <base href>; aria-current is styled;
 * filtering walks dt/dd groups with a status and empty state.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join, extname } from 'node:path';
import { readFile } from 'node:fs/promises';

const REPO = join(import.meta.dirname, '..', '..');
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ base?: string, modules?: string[], ready?: string | null, lang?: string }} [opts]
 */
async function load(page, body, { base = '', modules = ['glossary-wc'], ready = 'glossary-wc[data-upgraded]', lang = 'en' } = {}) {
  await page.route('https://cdn.example/**', (route) => route.fulfill({
    status: 200, contentType: 'text/html', body: '<!doctype html><title>escaped</title><p>escaped</p>',
  }));
  await page.route('**/src/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(REPO, decodeURIComponent(pathname));
    try {
      await route.fulfill({
        status: 200,
        body: await readFile(file),
        contentType: TYPES[extname(file)] ?? 'application/octet-stream',
        headers: { 'access-control-allow-origin': '*' },
      });
    } catch {
      await route.fulfill({ status: 404, body: '' });
    }
  });
  const url = `/__gh-glossary-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '/src/web-components/${m}/logic.js';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      ${base ? `<base href="${base}">` : ''}
      <link rel="stylesheet" href="/src/main.css">
      <script>
        window.__events = [];
        for (const t of ['glossary-wc:ready', 'glossary-wc:error', 'glossary-wc:search', 'glossary-index:filter']) {
          document.addEventListener(t, (e) => window.__events.push({ type: t, detail: { ...e.detail, error: undefined } }));
        }
      </script>
      <script type="module">${imports}</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  if (ready) await page.waitForSelector(ready, { state: 'attached' });
  return url;
}

/**
 * Serve a JSON fixture and count requests.
 * @param {import('playwright/test').Page} page
 * @param {string} path
 * @param {{ status?: number, body?: any, delay?: number }} opts
 */
async function serveJson(page, path, { status = 200, body = {}, delay = 0 }) {
  const hits = { count: 0 };
  await page.route(`**${path}`, async (route) => {
    hits.count++;
    if (delay) await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({ status, contentType: 'application/json', body: typeof body === 'string' ? body : JSON.stringify(body) });
  });
  return hits;
}

/** @param {import('playwright/test').Page} page @param {string} type */
const events = (page, type) => page.evaluate((t) => window.__events.filter((e) => e.type === t), type);

const BASIC = `
  <glossary-wc data-title="Project Glossary" searchable>
    <dl>
      <div data-category="Domain" data-term-id="velocity"><dt>Velocity</dt><dd>Work per sprint.</dd></div>
      <div data-category="Domain" data-term-id="epic"><dt>Epic</dt><dd>Large work. See also <a href="#velocity">velocity</a>.</dd></div>
      <div data-category="Domain" data-term-id="acceptance"><dt>Acceptance</dt><dd>Criteria.</dd></div>
      <div data-category="Technical" data-term-id="api"><dt>API</dt><dd>Interface.</dd></div>
      <div data-category="Technical" data-term-id="microservice"><dt>Microservice</dt><dd>Small service.</dd></div>
    </dl>
  </glossary-wc>`;

const TERMS_JSON = {
  title: 'Loaded Glossary',
  terms: [
    { id: 'alpha', term: 'Alpha', definition: 'First <img src=x onerror="window.__xss=1"> letter.', category: 'Greek', seeAlso: ['omega-term'] },
    { id: 'omega-term', term: 'Omega', definition: 'Last.', category: 'Greek' },
    { id: 'rich', term: 'Rich', definitionHtml: 'Has <em>emphasis</em><script>window.__xss=2</script><a href="javascript:alert(1)">x</a>', category: 'Other' },
  ],
};

test.describe('glossary-wc', () => {
  test('moving the element twice keeps its terms and re-renders identically', async ({ page }) => {
    await load(page, BASIC);
    const snapshot = () => page.evaluate(() => {
      const el = /** @type {any} */ (document.querySelector('glossary-wc'));
      return {
        terms: [...el.querySelectorAll('.gloss-term dt')].map((dt) => dt.textContent),
        categories: el.querySelectorAll('.gloss-category').length,
        letters: [...el.querySelectorAll('.gloss-jump-letter')].map((a) => a.textContent),
        heading: el.querySelectorAll('.gloss-title').length,
        searches: el.querySelectorAll('search').length,
        sourceDls: el.querySelectorAll(':scope > dl').length,
        api: el.terms.length,
      };
    });
    const before = await snapshot();
    expect(before.terms).toHaveLength(5);
    expect(before.sourceDls).toBe(1);
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => {
        const el = /** @type {HTMLElement} */ (document.querySelector('glossary-wc'));
        const host = document.createElement('section');
        document.body.append(host);
        host.append(el);
      });
      await page.waitForSelector('glossary-wc[data-upgraded]', { state: 'attached' });
      expect(await snapshot()).toEqual(before);
    }
    // Detached: the authored markup is fully restored (no generated chrome)
    const detached = await page.evaluate(() => {
      const el = /** @type {HTMLElement} */ (document.querySelector('glossary-wc'));
      el.remove();
      return {
        html: el.querySelectorAll(':scope > dl > div[data-term-id]').length,
        generated: el.querySelectorAll('.gloss-categories, .gloss-title, search, nav').length,
        classes: [...el.querySelectorAll('div[data-term-id]')].filter((d) => d.className).length,
      };
    });
    expect(detached).toEqual({ html: 5, generated: 0, classes: 0 });
  });

  test('src without fallback: fetches once, renders, fires ready once', async ({ page }) => {
    const hits = await serveJson(page, '/__gloss/terms.json', { body: TERMS_JSON, delay: 100 });
    await load(page, `<glossary-wc src="/__gloss/terms.json"></glossary-wc>`, { ready: 'glossary-wc[data-state="ready"]' });
    await expect(page.locator('.gloss-term')).toHaveCount(3);
    await expect(page.locator('.gloss-title')).toContainText('Loaded Glossary');
    // Move it: no refetch, still rendered.
    await page.evaluate(() => {
      const el = /** @type {HTMLElement} */ (document.querySelector('glossary-wc'));
      document.body.append(el);
    });
    await expect(page.locator('.gloss-term')).toHaveCount(3);
    await page.waitForTimeout(200);
    expect(hits.count).toBe(1);
    // ready: once for the load, once for the reconnect render — never while loading
    const ready = await events(page, 'glossary-wc:ready');
    expect(ready.length).toBe(2);
    expect(ready[0].detail.termCount).toBe(3);
  });

  test('src with a fallback dl: fallback while loading, replaced once, ready once', async ({ page }) => {
    const hits = await serveJson(page, '/__gloss/fb.json', { body: TERMS_JSON, delay: 300 });
    await load(page, `<glossary-wc src="/__gloss/fb.json"><dl>
      <div data-term-id="fallback"><dt>Fallback</dt><dd>Shown while loading.</dd></div></dl></glossary-wc>`, { ready: 'glossary-wc[data-state="loading"]' });
    await expect(page.locator('.gloss-term dt')).toHaveText(['Fallback']);
    expect(await events(page, 'glossary-wc:ready')).toHaveLength(0);
    await page.waitForSelector('glossary-wc[data-state="ready"]', { state: 'attached' });
    await expect(page.locator('.gloss-term')).toHaveCount(3);
    await expect(page.locator('#fallback')).toHaveCount(0);
    await page.waitForTimeout(400);
    expect(hits.count).toBe(1);
    expect(await events(page, 'glossary-wc:ready')).toHaveLength(1);
  });

  test('src error: data-state=error, message shown, fallback kept, one fetch', async ({ page }) => {
    const hits = await serveJson(page, '/__gloss/missing.json', { status: 500, body: 'nope' });
    await load(page, `<glossary-wc src="/__gloss/missing.json"><dl>
      <div data-term-id="fallback"><dt>Fallback</dt><dd>Kept on error.</dd></div></dl></glossary-wc>`, { ready: 'glossary-wc[data-state="error"]' });
    await expect(page.locator('.gloss-error')).toBeVisible();
    await expect(page.locator('.gloss-error')).toHaveAttribute('role', 'alert');
    await expect(page.locator('.gloss-term dt')).toHaveText(['Fallback']);
    expect(await events(page, 'glossary-wc:error')).toHaveLength(1);
    await page.waitForTimeout(200);
    expect(hits.count).toBe(1);
  });

  test('JSON definitions are text; definitionHtml is sanitized; seeAlso uses the term text', async ({ page }) => {
    await serveJson(page, '/__gloss/xss.json', { body: TERMS_JSON });
    await load(page, `<glossary-wc src="/__gloss/xss.json"></glossary-wc>`, { ready: 'glossary-wc[data-state="ready"]' });
    const r = await page.evaluate(() => {
      const alpha = /** @type {HTMLElement} */ (document.querySelector('#alpha dd'));
      const rich = /** @type {HTMLElement} */ (document.querySelector('#rich dd'));
      return {
        alphaText: alpha.textContent,
        imgs: document.querySelectorAll('glossary-wc img').length,
        seeAlso: [...alpha.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.textContent]),
        em: rich.querySelectorAll('em').length,
        scripts: rich.querySelectorAll('script').length,
        jsHref: rich.querySelector('a')?.getAttribute('href') ?? null,
        xss: /** @type {any} */ (window).__xss ?? null,
      };
    });
    expect(r.alphaText).toContain('<img src=x');
    expect(r.imgs).toBe(0);
    expect(r.seeAlso).toEqual([['#omega-term', 'Omega']]);
    expect(r.em).toBe(1);
    expect(r.scripts).toBe(0);
    expect(r.jsHref).toBeNull();
    expect(r.xss).toBeNull();
  });

  test('one jump target per letter, unique ids, no non-dt/dd children in lists', async ({ page }) => {
    await load(page, BASIC);
    const r = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      return {
        letters: [...document.querySelectorAll('.gloss-jump-letter')].map((a) => [a.textContent, a.getAttribute('href')]),
        dupes: ids.filter((id, i) => ids.indexOf(id) !== i),
        stray: document.querySelectorAll('.gloss-term-list > :not(div)').length,
      };
    });
    // A appears in two categories (Acceptance, API) but has one link
    expect(r.letters).toEqual([['A', '#acceptance'], ['E', '#epic'], ['M', '#microservice'], ['V', '#velocity']]);
    expect(r.dupes).toEqual([]);
    expect(r.stray).toBe(0);
  });

  test('counts are not live regions; heading and toggles keep plain names', async ({ page }) => {
    await load(page, BASIC);
    expect(await page.locator('glossary-wc output').count()).toBe(0);
    expect(await page.locator('glossary-wc [aria-live], glossary-wc [role="status"]').count()).toBe(1);
    await expect(page.locator('.gloss-title')).toHaveAccessibleName('Project Glossary');
    await expect(page.locator('.gloss-title')).toHaveJSProperty('tagName', 'H2');
    await expect(page.locator('.gloss-category-toggle').first()).toHaveAccessibleName('Domain');
    await expect(page.locator('glossary-wc search input[type="search"]')).toHaveAccessibleName('Search glossary terms');
    expect(await page.locator('glossary-wc').getAttribute('title')).toBeNull();
  });

  test('data-heading-level and data-label-* are honoured', async ({ page }) => {
    await load(page, `<glossary-wc data-title="Termes" data-heading-level="3" searchable data-label-search="Rechercher" data-label-uncategorized="Divers">
      <dl><div data-term-id="x"><dt>Xylophone</dt><dd>Instrument.</dd></div></dl></glossary-wc>`);
    await expect(page.locator('h3.gloss-title')).toHaveCount(1);
    await expect(page.locator('glossary-wc input')).toHaveAccessibleName('Rechercher');
    await expect(page.locator('.gloss-category-label')).toHaveText('Divers');
  });

  test('letters are derived per language: Cyrillic, kana, accents grouped, # bucket', async ({ page }) => {
    await load(page, `<glossary-wc lang="ru">
      <dl>
        <div data-term-id="t1"><dt>Яблоко</dt><dd>1</dd></div>
        <div data-term-id="t2"><dt>арбуз</dt><dd>2</dd></div>
        <div data-term-id="t3"><dt>Ёлка</dt><dd>3</dd></div>
        <div data-term-id="t4"><dt>3D</dt><dd>4</dd></div>
      </dl>
    </glossary-wc>
    <glossary-wc lang="ja" id="ja">
      <dl>
        <div data-term-id="j1"><dt>さくら</dt><dd>1</dd></div>
        <div data-term-id="j2"><dt>あさ</dt><dd>2</dd></div>
      </dl>
    </glossary-wc>
    <glossary-wc lang="en" id="en">
      <dl>
        <div data-term-id="e1"><dt>Éclair</dt><dd>1</dd></div>
        <div data-term-id="e2"><dt>eagle</dt><dd>2</dd></div>
        <div data-term-id="e3"><dt>Zebra</dt><dd>3</dd></div>
      </dl>
    </glossary-wc>`);
    await page.waitForFunction(() => document.querySelectorAll('glossary-wc[data-upgraded]').length === 3);
    const letters = (sel) => page.locator(`${sel} .gloss-jump-letter`).allTextContents();
    const ru = await letters('glossary-wc[lang="ru"]');
    expect(ru[0]).toBe('#');
    expect(ru).toContain('А');
    expect(ru).toContain('Я');
    expect(ru).toHaveLength(4); // #, А, Ё (Е), Я
    expect(await letters('#ja')).toEqual(['あ', 'さ']);
    expect(await letters('#en')).toEqual(['E', 'Z']);
    // Every letter link points at a real term
    const hrefs = await page.locator('.gloss-jump-letter').evaluateAll((as) => as.map((a) => !!document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)))));
    expect(hrefs.every(Boolean)).toBe(true);
  });

  test('search reveals matches in collapsed categories, disables empty letters, announces clear', async ({ page }) => {
    await load(page, BASIC);
    const tech = page.locator('.gloss-category[data-category="Technical"]');
    await tech.locator('.gloss-category-toggle').click();
    await expect(tech.locator('.gloss-term-list')).toBeHidden();
    await expect(tech.locator('.gloss-category-toggle')).toHaveAttribute('aria-expanded', 'false');

    await page.locator('glossary-wc input').fill('micro');
    await expect(tech.locator('#microservice')).toBeVisible();
    await expect(tech.locator('.gloss-category-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.gloss-live-region')).toHaveText('1 term found');
    // Only M has a visible term now
    await expect(page.locator('.gloss-jump-letter[aria-disabled="true"]')).toHaveCount(3);
    await expect(page.locator('.gloss-jump-letter:not([aria-disabled])')).toHaveText(['M']);

    await page.locator('glossary-wc input').fill('');
    await expect(page.locator('.gloss-live-region')).toHaveText('Showing all 5 terms');
    await expect(tech.locator('.gloss-term-list')).toBeHidden();
    await expect(page.locator('.gloss-jump-letter[aria-disabled]')).toHaveCount(0);
  });

  test('a link into a collapsed category expands it; jump letters are >= 24px', async ({ page }) => {
    const url = await load(page, BASIC, { base: 'https://cdn.example/' });
    const domain = page.locator('.gloss-category[data-category="Domain"]');
    await domain.locator('.gloss-category-toggle').click();
    await expect(domain.locator('.gloss-term-list')).toBeHidden();
    await page.locator('.gloss-jump-letter', { hasText: 'V' }).click();
    await expect(page.locator('#velocity')).toBeVisible();
    expect(page.url()).toContain(url);
    expect(new URL(page.url()).hash).toBe('#velocity');
    const sizes = await page.locator('.gloss-jump-letter').evaluateAll((as) => as.map((a) => {
      const r = a.getBoundingClientRect();
      return Math.min(r.width, r.height);
    }));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(24);
  });

  test('category clips with overflow: clip (keeps the sticky header) and RTL chevron mirrors', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); // no chevron transition
    await load(page, `<section dir="rtl">${BASIC}</section>`);
    const r = await page.evaluate(() => {
      const cat = /** @type {HTMLElement} */ (document.querySelector('.gloss-category'));
      const toggle = /** @type {HTMLElement} */ (cat.querySelector('.gloss-category-toggle'));
      toggle.click();
      return {
        overflow: getComputedStyle(cat).overflow,
        chevron: getComputedStyle(/** @type {Element} */ (cat.querySelector('.gloss-chevron'))).transform,
      };
    });
    expect(r.overflow).toBe('clip');
    // rotate(135deg) → matrix(-0.707…, 0.707…, -0.707…, -0.707…, 0, 0)
    expect(r.chevron).toMatch(/^matrix\(-0\.70/);
  });
});

const INDEX = `
  <glossary-index placeholder="Filter terms…" permalinks>
    <h1>Glossary</h1>
    <p class="lead">Lead.</p>
    <nav class="glossary-jump" aria-label="Jump to letter">
      <ol class="inline">
        <li><a href="#glossary-a">A</a></li>
        <li><a href="#glossary-p">P</a></li>
      </ol>
    </nav>
    <section class="glossary-section" id="glossary-a">
      <h2>A</h2>
      <dl>
        <dt id="term-accessibility"><dfn>accessibility</dfn></dt>
        <dt id="term-a11y"><dfn>a11y</dfn></dt>
        <dd id="dd-shared">Usable by everyone.</dd>
        <dt id="term-attribute"><dfn>attribute</dfn></dt>
        <dd id="dd-attr-1">Name–value pair.</dd>
        <dd id="dd-attr-2">Configures elements.</dd>
      </dl>
    </section>
    <section class="glossary-section" id="glossary-p" style="margin-block-end: 150vh">
      <h2>P</h2>
      <dl>
        <div><dt id="term-provenance"><dfn>provenance</dfn></dt><dd>Origin.</dd></div>
      </dl>
    </section>
  </glossary-index>`;

test.describe('glossary-index', () => {
  test('reconnect keeps exactly one search, status and permalink set', async ({ page }) => {
    await load(page, INDEX, { modules: ['glossary-index'], ready: 'glossary-index[data-upgraded]' });
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => {
        const el = /** @type {HTMLElement} */ (document.querySelector('glossary-index'));
        document.body.append(el);
      });
      await page.waitForSelector('glossary-index[data-upgraded]', { state: 'attached' });
    }
    expect(await page.locator('glossary-index input[type="search"]').count()).toBe(1);
    expect(await page.locator('glossary-index search').count()).toBe(1);
    expect(await page.locator('.glossary-status').count()).toBe(1);
    expect(await page.locator('.glossary-permalink').count()).toBe(4);
    // Placement: after the heading + lead, before the jump nav; labelled
    const order = await page.evaluate(() => [...document.querySelector('glossary-index').children].map((c) => c.localName).slice(0, 4));
    expect(order).toEqual(['h1', 'p', 'search', 'p']);
    await expect(page.locator('glossary-index input')).toHaveAccessibleName('Filter glossary terms');
    // One input still filters (a single listener)
    await page.locator('glossary-index input').fill('prov');
    expect((await events(page, 'glossary-index:filter')).length).toBe(1);
  });

  test('filter walks dt/dd groups, announces, empty state, disables jump links', async ({ page }) => {
    await load(page, INDEX, { modules: ['glossary-index'], ready: 'glossary-index[data-upgraded]' });
    const input = page.locator('glossary-index input');

    await input.fill('a11y');
    await expect(page.locator('#term-a11y')).toBeVisible();
    await expect(page.locator('#term-accessibility')).toBeVisible();
    await expect(page.locator('#dd-shared')).toBeVisible();
    await expect(page.locator('#term-attribute')).toBeHidden();
    await expect(page.locator('#dd-attr-1')).toBeHidden();
    await expect(page.locator('#glossary-p')).toBeHidden();
    await expect(page.locator('.glossary-jump a[href="#glossary-p"]')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('.glossary-status')).toHaveText('2 terms match');

    await input.fill('attribute');
    await expect(page.locator('#dd-attr-1')).toBeVisible();
    await expect(page.locator('#dd-attr-2')).toBeVisible();
    await expect(page.locator('#dd-shared')).toBeHidden();

    await input.fill('zzz');
    await expect(page.locator('.glossary-empty')).toBeVisible();
    await expect(page.locator('.glossary-status')).toHaveText('0 terms match');

    await input.fill('');
    await expect(page.locator('.glossary-empty')).toBeHidden();
    await expect(page.locator('.glossary-status')).toHaveText('Showing all 4 terms');
    await expect(page.locator('.glossary-jump a[aria-disabled]')).toHaveCount(0);
  });

  test('permalink follows the fragment under <base href> and copies the term URL', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const url = await load(page, INDEX, { base: 'https://cdn.example/', modules: ['glossary-index'], ready: 'glossary-index[data-upgraded]' });
    const link = page.locator('#term-attribute .glossary-permalink');
    await expect(link).toHaveAccessibleName('Copy link to attribute');
    await link.click();
    expect(page.url()).toContain(url);
    expect(new URL(page.url()).hash).toBe('#term-attribute');
    await expect(page.locator('#term-attribute')).toBeFocused();
    await expect(link).toHaveAttribute('data-state', 'copied');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(url);
    expect(copied.endsWith('#term-attribute')).toBe(true);
    // Jump link also stays on the page
    await page.locator('.glossary-jump a[href="#glossary-p"]').click();
    expect(page.url()).toContain(url);
    expect(new URL(page.url()).hash).toBe('#glossary-p');
  });

  test('scroll-spy aria-current="true" is styled', async ({ page }) => {
    await load(page, INDEX, { modules: ['glossary-index'], ready: 'glossary-index[data-upgraded]' });
    await page.locator('#glossary-p').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.getElementById('glossary-p').scrollIntoView({ block: 'start' }));
    const current = page.locator('.glossary-jump a[aria-current="true"]');
    await expect(current).toHaveCount(1);
    const style = await page.evaluate(() => {
      const on = /** @type {Element} */ (document.querySelector('.glossary-jump a[aria-current="true"]'));
      const off = /** @type {Element} */ (document.querySelector('.glossary-jump a:not([aria-current="true"])'));
      return { on: getComputedStyle(on).fontWeight, off: getComputedStyle(off).fontWeight, onColor: getComputedStyle(on).color, offColor: getComputedStyle(off).color };
    });
    expect(style.on).toBe('600');
    expect(style.on).not.toBe(style.off);
  });

  test('scroll-spy: the first letter is current at the top, even when its section is short', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 700 });
    await load(page, INDEX, { modules: ['glossary-index'], ready: 'glossary-index[data-upgraded]' });
    const current = () => page.locator('.glossary-jump a[aria-current="true"]').allTextContents();
    await expect.poll(current).toEqual(['A']);
    await page.evaluate(() => document.getElementById('glossary-p').scrollIntoView({ block: 'start' }));
    await expect.poll(current).toEqual(['P']);
    await page.evaluate(() => scrollTo(0, 0));
    await expect.poll(current).toEqual(['A']);
  });

  test('no "#" permalinks unless asked for', async ({ page }) => {
    await load(page, INDEX.replace(' permalinks>', '>'), { modules: ['glossary-index'], ready: 'glossary-index[data-upgraded]' });
    await expect(page.locator('.glossary-permalink')).toHaveCount(0);
    await expect(page.locator('glossary-index input[type="search"]')).toHaveCount(1);
    await load(page, INDEX, { modules: ['glossary-index'], ready: 'glossary-index[data-upgraded]' });
    await expect(page.locator('.glossary-permalink')).toHaveCount(4);
  });

  test('a targeted term is one highlighted block: no outlines, term and definition share edges', async ({ page }) => {
    const url = await load(page, INDEX, { modules: ['glossary-index'], ready: 'glossary-index[data-upgraded]' });
    await page.goto(`${url}#term-attribute`);
    await page.waitForSelector('glossary-index[data-upgraded]');
    const r = await page.evaluate(() => {
      const dt = document.getElementById('term-attribute');
      const dd = document.getElementById('dd-attr-1');
      const [a, b] = [dt.getBoundingClientRect(), dd.getBoundingClientRect()];
      const cs = (el) => getComputedStyle(el);
      const plain = document.getElementById('term-accessibility');
      return {
        outlines: [cs(dt).outlineStyle, cs(dd).outlineStyle],
        tinted: cs(dt).backgroundColor !== 'rgba(0, 0, 0, 0)' && cs(dt).backgroundColor === cs(dd).backgroundColor,
        bar: cs(dt).boxShadow !== 'none' && cs(dt).boxShadow === cs(dd).boxShadow,
        sameEdges: a.left === b.left && a.right === b.right,
        contiguous: Math.abs(a.bottom - b.top) < 1,
        others: cs(plain).backgroundColor,
      };
    });
    expect(r).toEqual({ outlines: ['none', 'none'], tinted: true, bar: true, sameEdges: true, contiguous: true, others: 'rgba(0, 0, 0, 0)' });
  });
});
