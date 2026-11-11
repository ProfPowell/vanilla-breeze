/**
 * site-search / site-index / site-map — S-review fixes.
 *
 * site-search: native modal <dialog>, combobox + listbox + separate status,
 * DOM-built results (titles as text, excerpts mark-only, href scheme/origin
 * check), configurable Pagefind path + baseUrl, anchor-driven clicks,
 * Enter → first result, page-level hotkey, neutral "unavailable" status.
 * site-index: DOM-built src mode, filter/limit sync, live count, letters
 * from section ids, structural hook. site-map: ia-tree reconnect keeps
 * links, Enter on links, .pages, nav-enhance src mode, tree semantics.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

const FAKE_PAGEFIND = `
const DATA = [
  { url: '/docs/a/', meta: { title: '<table>' }, excerpt: 'the <mark>table</mark> &lt;b&gt;x&lt;/b&gt; <img src=x onerror="window.__xss=1">' },
  { url: 'javascript:alert(1)', meta: { title: 'Evil' }, excerpt: 'bad' },
  { url: 'https://evil.example/x', meta: { title: 'Elsewhere' }, excerpt: 'cross' },
  { url: '/docs/b/', meta: { title: 'Second' }, excerpt: 'two' },
];
export async function options(o) { window.__pagefindOptions = o; }
export async function search(q) {
  if (q === 'none') return { results: [] };
  if (q === 'many') return { results: Array.from({ length: 23 }, (_, i) => ({ data: async () => ({ url: '/docs/m' + i + '/', meta: { title: 'M' + i }, excerpt: 'm' }) })) };
  return { results: DATA.map((d) => ({ data: async () => d })) };
}
`;

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ dir?: string, modules?: string[], pagefind?: string|null }} [opts]
 */
async function load(page, body, { dir = 'ltr', modules = [], pagefind = '/pagefind/' } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  await page.route('**/pagefind.js', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (pagefind && path === `${pagefind}pagefind.js`) {
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: FAKE_PAGEFIND });
    }
    return route.fulfill({ status: 404, body: '' });
  });
  await page.route('**/docs/**', (route) => route.fulfill({
    status: 200, contentType: 'text/html', body: '<!doctype html><title>dest</title><p>dest</p>',
  }));
  const url = `/__s-site-${Math.random().toString(36).slice(2)}.html`;
  const imports = modules.map((m) => `import '/src/web-components/${m}/logic.js';`).join('\n');
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">${imports}</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  for (const m of modules) {
    await page.waitForFunction((name) => customElements.get(name), m);
  }
}

const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';

/* ── site-search ──────────────────────────────────────────────────── */

const SEARCH = `<site-search id="s"><button type="button" data-trigger>Search</button></site-search>
  <button id="outside" type="button">Outside</button>`;

async function openAndType(page, q = 'table') {
  await page.click('#s [data-trigger]');
  await expect(page.locator('#s dialog')).toHaveJSProperty('open', true);
  await page.locator('#s input').fill(q);
  await expect(page.locator('#s [role="status"]')).not.toHaveText(/Searching|^$/);
}

test.describe('site-search', () => {
  test('opens a native modal dialog; the page behind is inert; Escape closes', async ({ page }) => {
    await load(page, SEARCH, { modules: ['site-search'] });
    await page.click('#s [data-trigger]');
    const r = await page.evaluate(() => {
      const d = document.querySelector('#s dialog');
      return { tag: d?.localName, modal: d?.matches(':modal'), focused: document.activeElement?.localName };
    });
    expect(r).toEqual({ tag: 'dialog', modal: true, focused: 'input' });
    // Tab stays in the dialog (or leaves to browser chrome), never the page behind
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      const where = await page.evaluate(() => {
        const a = document.activeElement;
        return a?.closest('dialog') ? 'dialog' : a === document.body ? 'body' : a?.id || a?.localName;
      });
      expect(['dialog', 'body']).toContain(where);
    }
    await page.locator('#s input').focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#s')).not.toHaveAttribute('open', '');
    expect(await page.evaluate(() => document.activeElement?.hasAttribute('data-trigger'))).toBe(true);
  });

  test('combobox semantics, separate status region, options-only listbox', async ({ page }) => {
    await load(page, SEARCH, { modules: ['site-search'] });
    await openAndType(page);
    const r = await page.evaluate(() => {
      const input = document.querySelector('#s input');
      const list = document.getElementById(input.getAttribute('aria-controls'));
      return {
        role: input.getAttribute('role'),
        expanded: input.getAttribute('aria-expanded'),
        listRole: list?.getAttribute('role'),
        childRoles: [...list.children].map((c) => c.getAttribute('role')),
        status: document.querySelector('#s [role="status"]')?.textContent,
        statusInList: !!list.querySelector('[role="status"]'),
      };
    });
    expect(r.role).toBe('combobox');
    expect(r.expanded).toBe('true');
    expect(r.listRole).toBe('listbox');
    expect(r.childRoles).toEqual(['option', 'option']);
    expect(r.status).toBe('2 results');
    expect(r.statusInList).toBe(false);

    await page.locator('#s input').fill('none');
    await expect(page.locator('#s [role="status"]')).toHaveText('No results found');
    await expect(page.locator('#s input')).toHaveAttribute('aria-expanded', 'false');
  });

  test('titles are text, excerpts keep only <mark>, unsafe/cross-origin hrefs dropped', async ({ page }) => {
    await load(page, SEARCH, { modules: ['site-search'] });
    await openAndType(page);
    const r = await page.evaluate(() => {
      const opts = [...document.querySelectorAll('#s [role="option"]')];
      const ex = opts[0].querySelector('.result-excerpt');
      return {
        title: opts[0].querySelector('.result-title').textContent,
        titleChildren: opts[0].querySelector('.result-title').children.length,
        exElements: [...ex.querySelectorAll('*')].map((e) => e.localName),
        exText: ex.textContent,
        hrefs: opts.map((o) => new URL(o.getAttribute('href')).pathname),
        xss: /** @type {any} */ (window).__xss,
      };
    });
    expect(r.title).toBe('<table>');
    expect(r.titleChildren).toBe(0);
    expect(r.exElements).toEqual(['mark']);
    expect(r.exText).toContain('<b>x</b>');
    expect(r.hrefs).toEqual(['/docs/a/', '/docs/b/']);
    expect(r.xss).toBeUndefined();
  });

  test('Escape closes even with a query typed', async ({ page }) => {
    await load(page, SEARCH, { modules: ['site-search'] });
    await openAndType(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#s')).not.toHaveAttribute('open', '');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('ids are counter-based and unique per instance', async ({ page }) => {
    await load(page, `${SEARCH}<site-search id="s2"></site-search>`, { modules: ['site-search'] });
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll('site-search dialog')].map((d) => d.id));
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(id).toMatch(/^site-search-\d+-dialog$/);
  });

  test('Enter with no active result goes to the first result', async ({ page }) => {
    await load(page, SEARCH, { modules: ['site-search'] });
    await openAndType(page);
    await Promise.all([
      page.waitForURL('**/docs/a/'),
      page.locator('#s input').press('Enter'),
    ]);
  });

  test('ArrowDown sets aria-activedescendant + aria-selected', async ({ page }) => {
    await load(page, SEARCH, { modules: ['site-search'] });
    await openAndType(page);
    await page.locator('#s input').press('ArrowDown');
    await page.locator('#s input').press('ArrowDown');
    const r = await page.evaluate(() => {
      const input = document.querySelector('#s input');
      const active = document.getElementById(input.getAttribute('aria-activedescendant'));
      return { idx: active?.dataset.resultIndex, sel: active?.getAttribute('aria-selected') };
    });
    expect(r).toEqual({ idx: '1', sel: 'true' });
  });

  test('a modifier click does not navigate the current tab', async ({ page }) => {
    await load(page, SEARCH, { modules: ['site-search'] });
    await openAndType(page);
    const before = page.url();
    // Swallow the new-tab navigation by preventing default at window level
    // AFTER the component's handler ran; the component itself must not navigate.
    await page.evaluate(() => window.addEventListener('click', (e) => e.preventDefault()));
    await page.locator('#s [role="option"]').first().click({ modifiers: [MOD] });
    await page.waitForTimeout(150);
    expect(page.url()).toBe(before);
    await expect(page.locator('#s')).toHaveAttribute('open', '');
  });

  test('a plain click lets the anchor navigate', async ({ page }) => {
    await load(page, SEARCH, { modules: ['site-search'] });
    await openAndType(page);
    await Promise.all([
      page.waitForURL('**/docs/b/'),
      page.locator('#s [role="option"]').nth(1).click(),
    ]);
  });

  test('data-pagefind-path + derived baseUrl; missing index shows a neutral status', async ({ page }) => {
    await load(page, `<site-search id="s" data-pagefind-path="/sub/pagefind/"><button type="button" data-trigger>Search</button></site-search>`,
      { modules: ['site-search'], pagefind: '/sub/pagefind/' });
    await openAndType(page);
    expect(await page.evaluate(() => /** @type {any} */ (window).__pagefindOptions?.baseUrl)).toBe('/sub/');

    await load(page, SEARCH, { modules: ['site-search'], pagefind: null });
    await openAndType(page);
    await expect(page.locator('#s [role="status"]')).toHaveText('Search unavailable');
    await expect(page.locator('#s dialog')).not.toContainText('npm run');
  });

  test('status line: no status-dot bleed, no room when empty, capped lists say so', async ({ page }) => {
    await load(page, SEARCH, { modules: ['site-search'] });
    await page.click('#s [data-trigger]');
    const status = page.locator('#s [role="status"]');
    // Empty dialog: the status takes no room and the input sits on the footer.
    const empty = await page.evaluate(() => {
      const d = document.querySelector('#s dialog');
      const st = d.querySelector('[role="status"]');
      const wrap = d.querySelector('.input-wrapper').getBoundingClientRect();
      const foot = d.querySelector('.footer').getBoundingClientRect();
      return { h: st.getBoundingClientRect().height, gap: foot.top - wrap.bottom, rule: getComputedStyle(d.querySelector('.input-wrapper')).borderBlockEndWidth };
    });
    expect(empty.h).toBe(0);
    expect(empty.gap).toBe(0);
    expect(empty.rule).toBe('0px');

    await page.locator('#s input').fill('table');
    await expect(status).toHaveText('2 results');
    // The global .status pattern puts a ● before its text; not here.
    expect(await status.evaluate((el) => getComputedStyle(el, '::before').content)).toBe('none');
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#s .input-wrapper')).borderBlockEndWidth)).not.toBe('0px');

    await page.locator('#s input').fill('many');
    await expect(status).toHaveText('8 of 23 results');
    await expect(page.locator('#s [role="option"]')).toHaveCount(8);
  });

  test('browse links: hidden in the page, shown in the dialog only while there are no results', async ({ page }) => {
    const BROWSE = `<site-search id="s"><button type="button" data-trigger>Search</button>
      <nav data-browse><a href="/docs/index-of/">Keyword Index</a><a href="/docs/glossary/">Glossary</a></nav></site-search>`;
    await load(page, BROWSE, { modules: ['site-search'] });
    // In the page the nav is never shown (it sits inside the closed dialog)
    await expect(page.locator('#s nav[data-browse]')).toBeHidden();
    await page.click('#s [data-trigger]');
    const nav = page.locator('#s dialog nav[data-browse]');
    // Empty query: offered, under its heading, with an accessible name
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute('aria-label', 'Browse instead');
    await expect(page.locator('#s .browse-title')).toHaveText('Browse instead');
    await expect(nav.locator('a')).toHaveCount(2);
    // The input keeps its divider now that something sits below it
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#s .input-wrapper')).borderBlockEndWidth)).not.toBe('0px');
    // Results: out of the way
    await page.locator('#s input').fill('table');
    await expect(page.locator('#s [role="status"]')).toHaveText('2 results');
    await expect(nav).toBeHidden();
    // Nothing found: offered again
    await page.locator('#s input').fill('none');
    await expect(page.locator('#s [role="status"]')).toHaveText('No results found');
    await expect(nav).toBeVisible();
    // Reconnect: one nav, back in a fresh dialog, not duplicated
    await page.keyboard.press('Escape');
    await page.evaluate(() => { const el = document.getElementById('s'); const host = el.parentElement; el.remove(); host.prepend(el); });
    await expect(page.locator('#s nav[data-browse]')).toHaveCount(1);
    await expect(page.locator('#s dialog')).toHaveCount(1);
    await expect(page.locator('#s dialog nav[data-browse]')).toHaveCount(1);
    // A custom label, and no nav at all, both work
    await load(page, `<site-search id="s"><button type="button" data-trigger>S</button><nav data-browse aria-label="Other ways in"><a href="/a/">A</a></nav></site-search>
      <site-search id="t"><button type="button" data-trigger>T</button></site-search>`, { modules: ['site-search'] });
    await page.click('#s [data-trigger]');
    await expect(page.locator('#s .browse-title')).toHaveText('Other ways in');
    await page.keyboard.press('Escape');
    await expect(page.locator('#t .browse')).toHaveCount(0);
  });

  test('close button beside the input; small screens drop the key hints and fit the window', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 });
    await load(page, SEARCH, { modules: ['site-search'] });
    await page.click('#s [data-trigger]');
    const close = page.getByRole('button', { name: 'Close search' });
    await expect(close).toBeVisible();
    await expect(close).toHaveText('Esc');
    await expect(page.locator('#s .hint')).toBeVisible();
    await close.click();
    await expect(page.locator('#s dialog')).toHaveJSProperty('open', false);
    await expect(page.locator('#s [data-trigger]')).toBeFocused();

    await page.setViewportSize({ width: 300, height: 700 });
    await page.click('#s [data-trigger]');
    await expect(page.locator('#s .hint')).toBeHidden();
    const r = await page.evaluate(() => {
      const d = document.querySelector('#s dialog');
      const box = d.getBoundingClientRect();
      const btn = d.querySelector('.shortcut').getBoundingClientRect();
      const foot = d.querySelector('.footer');
      const input = d.querySelector('input').getBoundingClientRect();
      return {
        width: box.width, left: box.left,
        closeInside: btn.right <= box.right && btn.left >= box.left,
        touch: btn.width >= 40 && btn.height >= 40,
        icon: getComputedStyle(d.querySelector('.shortcut icon-wc')).display !== 'none',
        key: getComputedStyle(d.querySelector('.shortcut kbd')).display,
        footerOneLine: foot.getBoundingClientRect().height < 48,
        inputRoom: input.width > 150,
        overflow: d.scrollWidth > d.clientWidth,
      };
    });
    expect(r).toEqual({ width: 300, left: 0, closeInside: true, touch: true, icon: true, key: 'none', footerOneLine: true, inputRoom: true, overflow: false });
    await page.getByRole('button', { name: 'Close search' }).click();
    await expect(page.locator('#s dialog')).toHaveJSProperty('open', false);
  });

  test('data-label-* overrides UI strings', async ({ page }) => {
    await load(page, `<site-search id="s" data-label-placeholder="Rechercher…" data-label-dialog="Recherche" data-label-count="{count} résultats"><button type="button" data-trigger>R</button></site-search>`,
      { modules: ['site-search'] });
    await openAndType(page);
    await expect(page.locator('#s input')).toHaveAttribute('placeholder', 'Rechercher…');
    await expect(page.locator('#s dialog')).toHaveAttribute('aria-label', 'Recherche');
    await expect(page.locator('#s [role="status"]')).toHaveText('2 résultats');
  });

  test('hotkey is page-level: opens the first visible instance, survives removal', async ({ page }) => {
    await load(page, `<site-search id="hidden" hidden><button type="button" data-trigger>A</button></site-search>${SEARCH}`,
      { modules: ['site-search'] });
    await page.keyboard.press(`${MOD}+k`);
    await expect(page.locator('#s')).toHaveAttribute('open', '');
    await expect(page.locator('#hidden')).not.toHaveAttribute('open', '');
    await page.keyboard.press(`${MOD}+k`);
    await expect(page.locator('#s')).not.toHaveAttribute('open', '');

    // Remove the first-connected instance: the shortcut still works
    await page.evaluate(() => document.getElementById('hidden').remove());
    await page.keyboard.press(`${MOD}+k`);
    await expect(page.locator('#s')).toHaveAttribute('open', '');
  });

  test('reconnect keeps one dialog and one trigger listener', async ({ page }) => {
    await load(page, SEARCH, { modules: ['site-search'] });
    const r = await page.evaluate(() => {
      const el = document.getElementById('s');
      const parent = el.parentElement;
      for (let i = 0; i < 3; i++) { el.remove(); parent.prepend(el); }
      let opens = 0;
      el.addEventListener('site-search:open', () => opens++);
      /** @type {HTMLElement} */ (el.querySelector('[data-trigger]')).click();
      return { dialogs: el.querySelectorAll('dialog').length, opens };
    });
    expect(r).toEqual({ dialogs: 1, opens: 1 });
  });

  test('panel is centred in RTL', async ({ page }) => {
    await load(page, SEARCH, { modules: ['site-search'], dir: 'rtl' });
    await page.click('#s [data-trigger]');
    const r = await page.evaluate(() => {
      const b = document.querySelector('#s dialog').getBoundingClientRect();
      return { left: b.left, right: innerWidth - b.right };
    });
    expect(Math.abs(r.left - r.right)).toBeLessThan(20);
  });
});

/* ── site-index ───────────────────────────────────────────────────── */

const term = (t, n = 1) => `<li><span class="index-term">${t}</span><ul class="index-refs">${
  Array.from({ length: n }, (_, i) => `<li><a href="/p/${t}-${i}">${t} page ${i}</a></li>`).join('')}</ul></li>`;

const INDEX = `<site-index id="ix" letters="all" limit="2">
  <h1>Index</h1>
  <nav aria-label="Index du site">
    <section id="index-a"><h2>A</h2><ul>${term('alpha')}${term('apple', 2)}${term('azure')}${term('axis')}</ul></section>
    <section id="index-b"><h2>B</h2><ul>${term('beta')}</ul></section>
    <section id="index-é"><h2>É</h2><ul>${term('été')}</ul></section>
  </nav>
</site-index>`;

test.describe('site-index', () => {
  test('works with a localised aria-label (structural hook) and builds É into the strip', async ({ page }) => {
    await load(page, INDEX, { modules: ['site-index'] });
    await page.waitForSelector('site-index[data-upgraded]');
    const r = await page.evaluate(() => {
      const ix = document.getElementById('ix');
      const letters = [...ix.querySelectorAll('.index-jump li')].map((li) => li.textContent);
      return {
        controlsTag: ix.querySelector('[data-index-controls]')?.localName,
        letters,
        eHref: ix.querySelector('.index-jump a[href="#index-é"]')?.textContent,
        counts: ix.querySelectorAll('.index-count').length,
        expand: ix.querySelectorAll('[data-index-expand]').length,
      };
    });
    expect(r.controlsTag).toBe('search');
    expect(r.letters).toContain('É');
    expect(r.letters.indexOf('É')).toBe(r.letters.indexOf('E') + 1);
    expect(r.eHref).toBe('É');
    expect(r.counts).toBeGreaterThan(0);
    expect(r.expand).toBe(1);
  });

  test('one filter box, term counts on headings, and a hint on each letter', async ({ page }) => {
    await load(page, INDEX, { modules: ['site-index'] });
    await page.waitForSelector('site-index[data-upgraded]');
    const r = await page.evaluate(() => {
      const ix = document.getElementById('ix');
      const box = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height), Math.round(b.top)]; };
      return {
        controls: [...ix.querySelectorAll('[data-index-controls] :is(input, select, button)')].map((el) => el.localName),
        headingA: ix.querySelector('#index-a h2 .index-count')?.textContent,
        headingB: ix.querySelector('#index-b h2 .index-count')?.textContent,
        termBadges: ix.querySelectorAll('.index-term + .index-count').length,
        hintA: ix.querySelector('.index-jump a[href="#index-a"]')?.title,
        // A linked letter and an empty one share a box and a row
        linked: box(ix.querySelector('.index-jump a[href="#index-a"]')),
        empty: box(ix.querySelector('.index-jump span[aria-disabled]')),
        refPadding: getComputedStyle(ix.querySelector('.index-refs a')).paddingBlockStart,
      };
    });
    expect(r.controls).toEqual(['input']);
    expect(r.headingA).toBe('4 terms');
    expect(r.headingB).toBe('1 term');
    expect(r.termBadges).toBe(0);
    expect(r.hintA).toBe('4 terms');
    expect(r.linked).toEqual(r.empty);
    expect(r.refPadding).toBe('0px');
  });

  test('the filter matches page titles too, unless filter="topic"', async ({ page }) => {
    await load(page, INDEX, { modules: ['site-index'] });
    await page.waitForSelector('site-index[data-upgraded]');
    const status = page.locator('#ix [role="status"]');
    await page.locator('#ix [data-index-search]').fill('page 1');
    await expect(status).toHaveText('1 term matches'); // only apple has a second page
    // The heading and the letter's hint count the matches while filtering
    await expect(page.locator('#index-a h2 .index-count')).toHaveText('1 term');
    await expect(page.locator('#ix .index-jump a[href="#index-a"]')).toHaveAttribute('title', '1 term');
    await page.locator('#ix [data-index-search]').fill('');
    await expect(page.locator('#index-a h2 .index-count')).toHaveText('4 terms');

    await load(page, INDEX.replace('<site-index id="ix"', '<site-index id="ix" filter="topic"'), { modules: ['site-index'] });
    await page.waitForSelector('site-index[data-upgraded]');
    await page.locator('#ix [data-index-search]').fill('page 1');
    await expect(page.locator('#ix [role="status"]')).toHaveText('No matches');
  });

  test('filter keeps the display limit in sync and announces counts', async ({ page }) => {
    await load(page, INDEX, { modules: ['site-index'] });
    await page.waitForSelector('site-index[data-upgraded]');
    const input = page.locator('#ix [data-index-search]');
    const status = page.locator('#ix [role="status"]');
    const visibleA = () => page.evaluate(() =>
      [...document.querySelectorAll('#index-a > ul > li')].filter((li) => !li.hidden).length);
    const btn = page.locator('#index-a [data-index-expand]');

    expect(await visibleA()).toBe(2);
    await input.fill('a');
    await expect(status).toHaveText(/terms match/);
    expect(await visibleA()).toBe(4);
    await expect(btn).toBeHidden();

    await input.fill('');
    expect(await visibleA()).toBe(2);
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(status).toHaveText('');

    await input.fill('zzz');
    await expect(status).toHaveText('No matches');
    const dis = await page.evaluate(() => {
      const a = document.querySelector('#ix .index-jump a[href="#index-b"]');
      return { aria: a.getAttribute('aria-disabled'), style: a.getAttribute('style'), tab: a.getAttribute('tabindex') };
    });
    expect(dis).toEqual({ aria: 'true', style: null, tab: '-1' });

    await input.fill('');
    await btn.click();
    expect(await visibleA()).toBe(4);
    await input.fill('ap');
    await input.fill('');
    expect(await visibleA()).toBe(4); // expanded section stays expanded
  });

  test('data-label-* overrides UI strings', async ({ page }) => {
    await load(page, INDEX.replace('<site-index id="ix"',
      '<site-index id="ix" data-label-more="Encore {count}" data-label-jump="Aller à la lettre" data-label-no-matches="Aucun résultat"'),
      { modules: ['site-index'] });
    await page.waitForSelector('site-index[data-upgraded]');
    await expect(page.locator('#index-a [data-index-expand]')).toHaveText('Encore 2');
    await expect(page.locator('#ix .index-jump')).toHaveAttribute('aria-label', 'Aller à la lettre');
    await page.locator('#ix [data-index-search]').fill('zzz');
    await expect(page.locator('#ix [role="status"]')).toHaveText('Aucun résultat');
  });

  test('src JSON is rendered as text with unsafe hrefs dropped', async ({ page }) => {
    await page.route('**/index-data.json', (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([
        { term: '<img src=x onerror="window.__xss=1">', refs: [{ href: 'javascript:window.__xss=2', label: 'bad <b>x</b>', type: '<i>t</i>' }] },
        { term: 'Éclair', refs: [{ href: '/ok/', label: 'Good' }] },
      ]),
    }));
    await load(page, `<site-index id="ix" src="/index-data.json"></site-index>`, { modules: ['site-index'] });
    await page.waitForSelector('#ix nav[data-index] section');
    await page.waitForSelector('#ix [data-index-controls]');
    const r = await page.evaluate(() => {
      const ix = document.getElementById('ix');
      return {
        imgs: ix.querySelectorAll('img, b, i').length,
        terms: [...ix.querySelectorAll('.index-term')].map((t) => t.textContent),
        hrefs: [...ix.querySelectorAll('.index-refs a')].map((a) => a.getAttribute('href')),
        jump: [...ix.querySelectorAll('.index-jump a')].map((a) => a.textContent),
        xss: /** @type {any} */ (window).__xss,
      };
    });
    expect(r.imgs).toBe(0);
    expect(r.terms).toContain('<img src=x onerror="window.__xss=1">');
    expect(r.hrefs).toEqual(['/ok/']);
    expect(r.jump).toContain('É');
    expect(r.xss).toBeUndefined();
  });

  test('reconnect keeps one controls bar and a working filter', async ({ page }) => {
    await load(page, INDEX, { modules: ['site-index'] });
    await page.waitForSelector('site-index[data-upgraded]');
    const r = await page.evaluate(() => {
      const ix = document.getElementById('ix');
      const parent = ix.parentElement;
      for (let i = 0; i < 2; i++) { ix.remove(); parent.append(ix); }
      return {
        controls: ix.querySelectorAll('[data-index-controls]').length,
        jump: ix.querySelectorAll('.index-jump').length,
        expand: ix.querySelectorAll('[data-index-expand]').length,
        badges: ix.querySelectorAll('#index-b .index-count').length,
      };
    });
    expect(r).toEqual({ controls: 1, jump: 1, expand: 1, badges: 1 });
    await page.locator('#ix [data-index-search]').fill('beta');
    await expect(page.locator('#ix [role="status"]')).toHaveText('1 term matches');
  });
});

/* ── site-map ─────────────────────────────────────────────────────── */

const IA = `<site-map id="sm" mode="ia-tree" title="Architecture">
  <nav>
    <ul>
      <li data-page-type="layout" data-status="live"><a href="/docs/home/">Home</a>
        <ul>
          <li data-page-type="page" data-status="draft"><a href="/docs/about/">About</a></li>
          <li data-page-type="section"><a href="/docs/blog/">Blog</a>
            <ul><li><a href="/docs/post/">Post</a></li></ul>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</site-map>`;

test.describe('site-map ia-tree', () => {
  test('remove + reinsert keeps every link and rebuilds one wrapper per node', async ({ page }) => {
    await load(page, IA, { modules: ['site-map'] });
    await page.waitForSelector('site-map[data-upgraded]');
    const r = await page.evaluate(() => {
      const sm = document.getElementById('sm');
      const parent = sm.parentElement;
      for (let i = 0; i < 3; i++) { sm.remove(); parent.append(sm); }
      return {
        links: [...sm.querySelectorAll('a')].map((a) => a.getAttribute('href')),
        wrappers: sm.querySelectorAll('.sm-node-content').length,
        headers: sm.querySelectorAll('.sm-header').length,
        emptyItems: [...sm.querySelectorAll('li[role="treeitem"]')].filter((li) => !li.querySelector(':scope > .sm-node-content > a')).length,
      };
    });
    expect(r.links).toEqual(['/docs/home/', '/docs/about/', '/docs/blog/', '/docs/post/']);
    expect(r.wrappers).toBe(4);
    expect(r.headers).toBe(1);
    expect(r.emptyItems).toBe(0);
  });

  test('roving tabindex: one tab stop, inner links out of the Tab order, status as text', async ({ page }) => {
    await load(page, IA, { modules: ['site-map'] });
    await page.waitForSelector('site-map[data-upgraded]');
    const r = await page.evaluate(() => {
      const sm = document.getElementById('sm');
      return {
        zero: [...sm.querySelectorAll('[tabindex="0"]')].map((e) => e.getAttribute('role')),
        linkTab: [...sm.querySelectorAll('.sm-tree a')].every((a) => a.getAttribute('tabindex') === '-1'),
        dotHidden: [...sm.querySelectorAll('.sm-status-dot')].every((d) => d.getAttribute('aria-hidden') === 'true' && !d.hasAttribute('aria-label')),
        statusText: [...sm.querySelectorAll('.sm-node-content .visually-hidden')].map((e) => e.textContent),
      };
    });
    expect(r.zero).toEqual(['treeitem']);
    expect(r.linkTab).toBe(true);
    expect(r.dotHidden).toBe(true);
    expect(r.statusText).toEqual(['Live: ', 'Draft: ']);
  });

  test('Enter on a treeitem follows its link', async ({ page }) => {
    await load(page, IA, { modules: ['site-map'] });
    await page.waitForSelector('site-map[data-upgraded]');
    await page.locator('#sm li[role="treeitem"]').first().focus();
    await page.keyboard.press('ArrowDown');
    await Promise.all([page.waitForURL('**/docs/about/'), page.keyboard.press('Enter')]);
  });

  test('arrow keys swap in RTL', async ({ page }) => {
    await load(page, IA, { modules: ['site-map'], dir: 'rtl' });
    await page.waitForSelector('site-map[data-upgraded]');
    const home = page.locator('#sm li[role="treeitem"]').first();
    await home.focus();
    await page.keyboard.press('ArrowRight'); // RTL: collapse
    await expect(home).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('ArrowLeft'); // RTL: expand
    await expect(home).toHaveAttribute('aria-expanded', 'true');
  });

  test('.pages reads the moved anchors', async ({ page }) => {
    await load(page, IA, { modules: ['site-map'] });
    await page.waitForSelector('site-map[data-upgraded]');
    const pages = await page.evaluate(() => /** @type {any} */ (document.getElementById('sm')).pages);
    expect(pages[0].label).toBe('Home');
    expect(pages[0].href).toBe('/docs/home/');
    expect(pages[0].children[1].children[0]).toMatchObject({ label: 'Post', href: '/docs/post/' });
  });

  test('pages setter drops unsafe hrefs', async ({ page }) => {
    await load(page, IA, { modules: ['site-map'] });
    await page.waitForSelector('site-map[data-upgraded]');
    const hrefs = await page.evaluate(() => {
      const sm = /** @type {any} */ (document.getElementById('sm'));
      sm.pages = [{ label: 'Bad', href: 'javascript:alert(1)' }, { label: 'Ok', href: '/ok/' }];
      return [...sm.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    });
    expect(hrefs).toEqual([null, '/ok/']);
  });

  test('visual mode: treeitems + aria-activedescendant; slider keeps focus across re-renders', async ({ page }) => {
    await load(page, IA.replace('mode="ia-tree"', 'mode="ia-tree" data-view="visual"'), { modules: ['site-map'] });
    await page.waitForSelector('#sm svg[role="tree"]');
    const svg = page.locator('#sm svg[role="tree"]');
    await svg.focus();
    await page.keyboard.press('ArrowDown');
    const r = await page.evaluate(() => {
      const s = document.querySelector('#sm svg[role="tree"]');
      const active = document.getElementById(s.getAttribute('aria-activedescendant'));
      return {
        items: s.querySelectorAll('[role="treeitem"]').length,
        activeRole: active?.getAttribute('role'),
        activeLabel: active?.getAttribute('aria-label'),
        noHex: !s.outerHTML.match(/#[0-9a-f]{6}/i),
      };
    });
    expect(r.items).toBe(4);
    expect(r.activeRole).toBe('treeitem');
    expect(r.activeLabel).toMatch(/^About, Page, Draft/);
    expect(r.noHex).toBe(true);

    const slider = page.locator('#sm .sm-vtoolbar-slider');
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.activeElement?.classList.contains('sm-vtoolbar-slider'))).toBe(true);
    expect(await page.evaluate(() => document.getElementById('sm').dataset.detail)).toBe('4');
    expect(await page.locator('#sm .sm-vtoolbar').count()).toBe(1);
  });
});

test.describe('site-map nav-enhance', () => {
  test('src mode replaces the sitemap nav (not the controls) and adds controls', async ({ page }) => {
    await page.route('**/sitemap-data.json', (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ children: [
        { title: 'Docs', children: [{ title: 'A', href: '/docs/a/' }, { title: 'Bad', href: 'javascript:alert(1)' }] },
      ] }),
    }));
    await load(page, `<site-map id="nm" src="/sitemap-data.json"><nav aria-label="Plan du site"><ul><li><a href="/x/">X</a></li></ul></nav></site-map>`,
      { modules: ['site-map'] });
    await page.waitForSelector('#nm details');
    await page.waitForSelector('#nm [data-sitemap-controls] button');
    const r = await page.evaluate(() => {
      const nm = document.getElementById('nm');
      return {
        navs: [...nm.querySelectorAll(':scope > nav')].map((n) => n.hasAttribute('data-sitemap-controls') ? 'controls' : n.getAttribute('aria-label')),
        hrefs: [...nm.querySelectorAll('nav:not([data-sitemap-controls]) a')].map((a) => a.getAttribute('href')),
      };
    });
    expect(r.navs).toEqual(['controls', 'Plan du site']);
    expect(r.hrefs).toEqual(['/docs/a/', null]);
    await page.locator('#nm [data-sitemap-controls] button').first().click();
    await expect(page.locator('#nm details')).toHaveJSProperty('open', true);
  });

  test('controls sit above the tree, below the heading, with overridable labels', async ({ page }) => {
    await load(page, `<site-map id="nm" data-label-expand="Tout ouvrir" data-label-collapse="Tout fermer">
      <h1>Plan</h1><p>Intro</p>
      <nav aria-label="Plan du site"><ul><li><details><summary>Docs</summary><ul><li><a href="/a/">A</a></li></ul></details></li></ul></nav>
    </site-map>`, { modules: ['site-map'] });
    await page.waitForSelector('#nm [data-sitemap-controls] button');
    const r = await page.evaluate(() => {
      const nm = document.getElementById('nm');
      return {
        order: [...nm.children].map((el) => el.hasAttribute('data-sitemap-controls') ? 'controls' : el.localName),
        labels: [...nm.querySelectorAll('[data-sitemap-controls] button')].map((b) => b.textContent),
      };
    });
    expect(r.order).toEqual(['h1', 'p', 'controls', 'nav']);
    expect(r.labels).toEqual(['Tout ouvrir', 'Tout fermer']);
  });

  test('the tree is an outline: inline links, one leading arrow, no accordion chrome', async ({ page }) => {
    await load(page, `<site-map id="nm">
      <nav aria-label="Plan du site"><ul>
        <li data-sitemap-section><h2><a href="/docs/">Docs</a> <small>3 pages</small></h2><ul>
          <li><a href="/a/">A</a></li>
          <li><details open><summary>Many <small>2</small></summary><ul data-sitemap-leaves><li><a href="/m/1/">One</a></li><li><a href="/m/2/">Two</a></li></ul></details></li>
        </ul></li>
      </ul></nav>
    </site-map>`, { modules: ['site-map'] });
    await page.waitForSelector('#nm [data-sitemap-controls] button');
    const r = await page.evaluate(() => {
      const nm = document.getElementById('nm');
      const cs = (sel, pseudo) => getComputedStyle(nm.querySelector(sel), pseudo);
      const summary = nm.querySelector('summary').getBoundingClientRect();
      const nav = nm.querySelector('nav:not([data-sitemap-controls])').getBoundingClientRect();
      return {
        linkPadding: cs('ul[data-sitemap-leaves] a').paddingInlineStart,
        detailsBorder: cs('details').borderTopWidth,
        trailingArrow: cs('summary', '::after').content,
        leadingArrow: cs('summary', '::before').content,
        summaryHugsLabel: summary.width < nav.width / 2,
        groups: cs('li[data-sitemap-section] > ul').display,
        fullRow: cs('li[data-sitemap-section] > ul > li:has(details)').gridColumnStart,
      };
    });
    expect(r.linkPadding).toBe('0px');
    expect(r.detailsBorder).toBe('0px');
    expect(r.trailingArrow).toBe('none');
    expect(r.leadingArrow).not.toBe('none');
    expect(r.summaryHugsLabel).toBe(true);
    expect(r.groups).toBe('grid');
    expect(r.fullRow).toBe('1');
  });
});
