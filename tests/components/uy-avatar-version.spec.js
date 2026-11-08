/**
 * user-avatar + version-switcher — U/Y review fixes.
 *
 * version-switcher: URL safety (javascript: never lands in an href or runs
 * on navigate / banner / changelog), same-origin + sanitized swap, trigger
 * accessible name, no link inside a button, reactive heading, page-info
 * mount styling + teardown, history-mode no-op navigate, banner live region,
 * i18n, scoped view-transition timing, sanitizer strips data-versions.
 * user-avatar: ring survives overlap groups, fallback stacked under the
 * image, xs font floor, dark-mode tokens, forced-colours borders.
 *
 * Tests the working tree: /src and fixture URLs are served from disk/memory.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ lang?: string, head?: string, files?: Record<string, {body: string, type?: string}> }} [opts]
 */
async function load(page, body, { lang = 'en', head = '', files = {} } = {}) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  for (const [path, file] of Object.entries(files)) {
    await page.route(`**${path}`, (route) => route.fulfill({
      status: 200, contentType: file.type || 'text/html; charset=utf-8', body: file.body,
    }));
  }
  const url = `/__uy-av-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
      ${head}
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/version-switcher/logic.js';</script>
      </head><body>${body}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('version-switcher'));
  return url;
}

const EVIL = JSON.stringify([
  { id: 'v2', label: 'v2', url: '/v2/', current: true, versionUrl: 'javascript:window.__hit=1' },
  { id: 'bad', label: 'bad', url: 'javascript:window.__hit=1' },
  { id: 'bad2', label: 'bad2', url: ' JaVa\tscript:window.__hit=1' },
  { id: 'data', label: 'data', url: 'data:text/html,<script>window.__hit=1</script>' },
  { id: 'v1', label: 'v1', url: '/v1/', archived: true },
]);

// ── version-switcher: security ─────────────────────────────────────────

test('javascript: / data: entry URLs are dropped and never land in an href', async ({ page }) => {
  await load(page, `<version-switcher id="vs" data-versions='${EVIL}'></version-switcher>`);
  await page.waitForSelector('version-switcher[data-upgraded]');
  const r = await page.evaluate(() => {
    const vs = /** @type {any} */ (document.getElementById('vs'));
    return {
      ids: vs.versions.map((e) => e.id),
      hrefs: [...document.querySelectorAll('[href]')].map((a) => a.getAttribute('href')),
      links: vs.querySelectorAll('a').length,
    };
  });
  expect(r.ids).toEqual(['v2', 'v1']);
  expect(r.hrefs.some((h) => /script:|^data:/i.test(h.replace(/\s/g, '')))).toBe(false);
  expect(r.links).toBe(0); // the unsafe versionUrl dropped the changelog link
});

test('switchTo / navigate never executes a script URL', async ({ page }) => {
  await load(page, '<version-switcher id="vs" data-versions=\'[{"id":"a","url":"/a/","current":true},{"id":"b","url":"/b/"}]\'></version-switcher>');
  await page.waitForSelector('version-switcher[data-upgraded]');
  const r = await page.evaluate(() => {
    const vs = /** @type {any} */ (document.getElementById('vs'));
    // Inject an unsafe entry after the fact — the action re-checks.
    const errors = [];
    vs.addEventListener('version-switcher:error', (e) => errors.push(e.detail.message));
    vs.setAttribute('data-versions', JSON.stringify([{ id: 'x', url: 'javascript:window.__hit=1' }]));
    vs.switchTo('x');
    return { hit: /** @type {any} */ (window).__hit, errors, count: vs.versions.length };
  });
  expect(r.hit).toBeUndefined();
  expect(r.count).toBe(0);
  expect(r.errors.join(' ')).toMatch(/unsafe url/);
});

test('navigate goes to a safe URL through cancellable before-navigate', async ({ page }) => {
  await load(page, '<version-switcher id="vs" data-versions=\'[{"id":"a","url":"/a/","current":true},{"id":"b","url":"/b/?x=1"}]\'></version-switcher>');
  await page.waitForSelector('version-switcher[data-upgraded]');
  const r = await page.evaluate(() => {
    const vs = /** @type {any} */ (document.getElementById('vs'));
    let url = null;
    vs.addEventListener('version-switcher:before-navigate', (e) => { url = e.detail.entry.url; e.preventDefault(); });
    vs.switchTo('b');
    return url;
  });
  expect(r).toBe('/b/?x=1');
});

test('banner link is dropped for an unsafe latest url', async ({ page }) => {
  const data = JSON.stringify([
    { id: 'v1', label: 'v1', url: '/v1/', current: true, archived: true },
  ]);
  await load(page, `<version-switcher id="vs" data-banner data-versions='${data}'></version-switcher>`);
  await page.waitForSelector('version-switcher[data-upgraded]');
  // add an unsafe "latest" via a manifest-shaped refresh
  await page.evaluate(() => {
    const vs = document.getElementById('vs');
    vs.setAttribute('data-versions', JSON.stringify([
      { id: 'v2', label: 'v2', url: 'javascript:window.__hit=1' },
      { id: 'v1', label: 'v1', url: '/v1/', current: true, archived: true },
    ]));
  });
  // v2 is dropped (unsafe url) → no non-archived latest → no banner at all
  await expect(page.locator('.version-switcher-banner')).toHaveCount(0);
});

test('swap refuses cross-origin URLs', async ({ page }) => {
  const data = JSON.stringify([
    { id: 'v2', url: '/v2.html', current: true },
    { id: 'evil', url: 'https://evil.example/page.html' },
  ]);
  await load(page, `<version-switcher id="vs" data-action="swap" data-versions='${data}'></version-switcher><main data-versioned><p id="orig">original</p></main>`);
  await page.waitForSelector('version-switcher[data-upgraded]');
  const r = await page.evaluate(async () => {
    const vs = /** @type {any} */ (document.getElementById('vs'));
    const errors = [];
    vs.addEventListener('version-switcher:error', (e) => errors.push(e.detail.message));
    vs.switchTo('evil');
    await new Promise((res) => setTimeout(res, 100));
    return { errors, orig: !!document.getElementById('orig') };
  });
  expect(r.orig).toBe(true);
  expect(r.errors.join(' ')).toMatch(/not same-origin/);
});

test('swap inserts the fetched region sanitized (no live on* handlers)', async ({ page }) => {
  const data = JSON.stringify([
    { id: 'v2', url: '/__uy-v2.html', current: true },
    { id: 'v1', url: '/__uy-v1.html' },
  ]);
  await load(page,
    `<version-switcher id="vs" data-action="swap" data-versions='${data}'></version-switcher><main data-versioned><p>v2 body</p></main>`,
    { files: { '/__uy-v1.html': { body: '<!doctype html><main data-versioned><h1 id="t">v1 body</h1><img src="data:," onerror="window.__hit=1" alt="x"><a href="javascript:window.__hit=2">x</a><script>window.__hit=3</script></main>' } } });
  await page.waitForSelector('version-switcher[data-upgraded]');
  const swapped = page.evaluate(() => new Promise((res) => {
    document.getElementById('vs').addEventListener('version-switcher:swap', () => res(true), { once: true });
  }));
  await page.evaluate(() => /** @type {any} */ (document.getElementById('vs')).switchTo('v1'));
  await swapped;
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => ({
    hit: /** @type {any} */ (window).__hit,
    h1: document.querySelector('main h1')?.textContent,
    id: document.querySelector('main h1')?.id,
    onerror: document.querySelector('main img')?.hasAttribute('onerror'),
    href: document.querySelector('main a')?.getAttribute('href') ?? null,
    scripts: document.querySelectorAll('main script').length,
    current: /** @type {any} */ (document.getElementById('vs')).currentId,
    meta: document.querySelector('meta[itemprop="version"]')?.getAttribute('content'),
  }));
  expect(r).toEqual({ hit: undefined, h1: 'v1 body', id: 't', onerror: false, href: null, scripts: 0, current: 'v1', meta: 'v1' });
});

test('untrusted sanitizer output carries no inline versions', async ({ page }) => {
  await load(page, '<article id="out"></article>');
  const r = await page.evaluate(async () => {
    const { sanitizeToFragment } = await import('/src/lib/sanitize-html.js');
    const out = document.getElementById('out');
    out.replaceChildren(sanitizeToFragment('<version-switcher data-versions=\'[{"id":"a","url":"javascript:window.__hit=1"}]\'></version-switcher>'));
    await new Promise((res) => setTimeout(res, 50));
    const vs = /** @type {any} */ (out.querySelector('version-switcher'));
    return { attr: vs.hasAttribute('data-versions'), count: vs.versions.length };
  });
  expect(r).toEqual({ attr: false, count: 0 });
});

// ── version-switcher: a11y / behaviour ─────────────────────────────────

const RELEASES = JSON.stringify([
  { id: 'v2.1', label: 'v2.1', url: '/v2.1/', date: '2026-05-01', author: 'Ada', summary: 'Adds headers', versionUrl: '/changelog#v2-1', current: true },
  { id: 'v2.0', label: 'v2.0', url: '/v2/', date: '2026-01-15' },
  { id: 'v1.4', label: 'v1.4', url: '/v1.4/', archived: true },
]);

test('trigger names what it picks; host gets no injected aria-label', async ({ page }) => {
  await load(page, `<version-switcher id="a" aria-label="API version" data-versions='${RELEASES}'></version-switcher>
    <version-switcher id="b" data-versions='${RELEASES}'></version-switcher>`);
  await page.waitForSelector('#b[data-upgraded]');
  await expect(page.locator('#a .version-switcher-trigger')).toHaveAccessibleName('API version: v2.1');
  await expect(page.locator('#b .version-switcher-trigger')).toHaveAccessibleName('Version: v2.1');
  expect(await page.locator('#b').getAttribute('aria-label')).toBeNull();
});

test('no link nested in a button; author/summary describe the entry', async ({ page }) => {
  await load(page, `<version-switcher id="vs" aria-label="API version" data-versions='${RELEASES}'></version-switcher>`);
  await page.waitForSelector('version-switcher[data-upgraded]');
  expect(await page.locator('#vs button a').count()).toBe(0);
  await page.locator('#vs .version-switcher-trigger').click();
  const first = page.locator('#vs .version-switcher-entry').first();
  await expect(first).toHaveAccessibleName(/^v2\.1 current/);
  await expect(first).toHaveAccessibleDescription('by Ada Adds headers');
  await expect(page.locator('#vs .version-switcher-item').first().locator('> a')).toHaveAccessibleName('v2.1 changelog');
});

test('clicking an entry selects it; keyboard arrows move between entries', async ({ page }) => {
  await load(page, `<version-switcher id="vs" data-versions='${RELEASES}'></version-switcher>`);
  await page.waitForSelector('version-switcher[data-upgraded]');
  await page.evaluate(() => {
    const vs = document.getElementById('vs');
    /** @type {any} */ (window).__sel = [];
    vs.addEventListener('version-switcher:select', (e) => /** @type {any} */ (window).__sel.push(e.detail.entry.id));
    vs.addEventListener('version-switcher:before-navigate', (e) => e.preventDefault());
  });
  await page.locator('#vs .version-switcher-trigger').click();
  await expect(page.locator('#vs .version-switcher-entry').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#vs .version-switcher-entry').nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => /** @type {any} */ (window).__sel)).toEqual(['v2.0']);
});

test('picker heading follows fetched data and data-mode', async ({ page }) => {
  await load(page, '<version-switcher id="vs" data-src="/__uy-manifest.json"></version-switcher>', {
    files: { '/__uy-manifest.json': { body: RELEASES, type: 'application/json' } },
  });
  await expect(page.locator('#vs .version-switcher-heading')).toHaveText('Versions');
  await page.evaluate(() => document.getElementById('vs').setAttribute('data-mode', 'history'));
  await expect(page.locator('#vs .version-switcher-heading')).toHaveText('History');
});

test('history mode: picking an entry on the same URL does not reload', async ({ page }) => {
  const url = await load(page, '<version-switcher id="vs"></version-switcher>');
  const data = JSON.stringify([
    { id: 'r2', url, author: 'Ada', current: true },
    { id: 'r1', url, author: 'Bob' },
  ]);
  const r = await page.evaluate((json) => {
    const vs = /** @type {any} */ (document.getElementById('vs'));
    /** @type {any} */ (window).__alive = true;
    const errors = [];
    let before = 0;
    vs.addEventListener('version-switcher:error', (e) => errors.push(e.detail.message));
    vs.addEventListener('version-switcher:before-navigate', () => before++);
    vs.setAttribute('data-versions', json);
    vs.switchTo('r1');
    return { errors, before };
  }, data);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => /** @type {any} */ (window).__alive)).toBe(true);
  expect(r.before).toBe(0);
  expect(r.errors.join(' ')).toMatch(/current page/);
});

test('banner: status text arrives after the region exists; text-only without url', async ({ page }) => {
  const data = JSON.stringify([
    { id: 'v2', label: 'v2' },
    { id: 'v1', label: 'v1', current: true, archived: true },
  ]);
  await load(page, `<version-switcher id="vs" data-banner data-versions='${data}'></version-switcher>`);
  await page.waitForSelector('version-switcher[data-upgraded]');
  const status = page.locator('#vs .version-switcher-banner [role="status"]');
  await expect(status).toHaveText('You’re viewing v1 (archived).');
  await expect(page.locator('#vs .version-switcher-banner')).toHaveAttribute('aria-label', 'Archived version notice');
  expect(await page.locator('#vs .version-switcher-banner').getAttribute('aria-live')).toBeNull();
  expect(await page.locator('#vs .version-switcher-banner a').count()).toBe(0);
  await expect(page.locator('#vs .version-switcher-banner-latest')).toHaveText('Latest: v2');
});

test('i18n: data-label-* overrides and Intl relative dates from [lang]', async ({ page }) => {
  const data = JSON.stringify([
    { id: 'v2', url: '/v2/', date: '2020-01-01', current: true },
    { id: 'v1', url: '/v1/', archived: true },
  ]);
  await load(page, `<section lang="fr"><version-switcher id="vs" aria-label="Version de l’API" data-label-heading-releases="Versions publiées" data-label-current="actuelle" data-label-archived="archivée" data-versions='${data}'></version-switcher></section>`);
  await page.waitForSelector('version-switcher[data-upgraded]');
  await expect(page.locator('#vs .version-switcher-heading')).toHaveText('Versions publiées');
  await expect(page.locator('#vs .version-switcher-badge-current')).toHaveText('actuelle');
  await expect(page.locator('#vs .version-switcher-badge-archived')).toHaveText('archivée');
  await expect(page.locator('#vs .version-switcher-entry-date')).toHaveText(/^il y a \d+ ans$/);
  await expect(page.locator('#vs .version-switcher-entry-date')).toHaveAttribute('title', '1 janvier 2020');
});

test('view-transition timing is scoped to the swap transition type', async ({ page }) => {
  await load(page, '<p>x</p>');
  const unscoped = await page.evaluate(async () => {
    const css = await (await fetch('/src/web-components/version-switcher/styles.css')).text();
    return css.split('}').filter((rule) => rule.includes('::view-transition-old(root)') && !rule.includes('active-view-transition-type')).length;
  });
  expect(unscoped).toBe(0);
});

test('page-info mount: entries styled, section removed on disconnect, one on reconnect', async ({ page }) => {
  await load(page, `<page-info id="pi"><details open><summary>Info</summary><section class="page-info-panel"><p>Panel</p></section></details></page-info>
    <aside id="home"><version-switcher id="vs" data-page-info-target="pi" data-versions='${RELEASES}'></version-switcher></aside>`);
  await page.waitForSelector('version-switcher[data-upgraded]', { state: 'attached' });
  const section = page.locator('#pi .version-switcher-panel-section');
  await expect(section).toHaveCount(1);
  await expect(section.locator('.version-switcher-panel-heading')).toHaveText('Versions');
  const display = await section.locator('.version-switcher-entry').first().evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe('grid');
  await page.evaluate(() => document.getElementById('vs').remove());
  await expect(section).toHaveCount(0);
  await page.evaluate(() => {
    const vs = document.createElement('version-switcher');
    vs.id = 'vs2';
    vs.dataset.pageInfoTarget = 'pi';
    vs.dataset.versions = JSON.stringify([{ id: 'a', url: '/a/' }]);
    document.getElementById('home').append(vs);
    vs.remove();
    document.getElementById('home').append(vs);
  });
  await expect(page.locator('#pi .version-switcher-panel-section')).toHaveCount(1);
});

test('reconnect keeps one trigger and a working picker', async ({ page }) => {
  await load(page, `<aside id="home"><version-switcher id="vs" data-versions='${RELEASES}'></version-switcher></aside>`);
  await page.waitForSelector('version-switcher[data-upgraded]');
  await page.evaluate(() => {
    const vs = document.getElementById('vs');
    for (let i = 0; i < 2; i++) { vs.remove(); document.getElementById('home').append(vs); }
    vs.addEventListener('version-switcher:before-navigate', (e) => e.preventDefault());
    /** @type {any} */ (window).__sel = [];
    vs.addEventListener('version-switcher:select', (e) => /** @type {any} */ (window).__sel.push(e.detail.entry.id));
  });
  expect(await page.locator('#vs .version-switcher-trigger').count()).toBe(1);
  await page.locator('#vs .version-switcher-trigger').click();
  await page.locator('#vs .version-switcher-entry').nth(2).click();
  expect(await page.evaluate(() => /** @type {any} */ (window).__sel)).toEqual(['v1.4']);
});

// ── user-avatar ────────────────────────────────────────────────────────

const PH = '/src/assets/placeholders/photo-reel-team-members-1-100x100.svg';

test('user-avatar: data-ring survives an overlap group', async ({ page }) => {
  await load(page, `<layout-cluster data-layout-overlap>
      <user-avatar id="ringed" data-ring><img src="${PH}" alt=""></user-avatar>
      <user-avatar id="plain"><span data-fallback>AB</span></user-avatar>
    </layout-cluster>`);
  const shadows = await page.evaluate(() => ({
    ringed: getComputedStyle(document.getElementById('ringed')).boxShadow,
    plain: getComputedStyle(document.getElementById('plain')).boxShadow,
  }));
  // ring = surface gap (2px) + border ring (4px); plain keeps the 2px separator
  expect(shadows.ringed).toMatch(/0px 0px 0px 4px/);
  expect(shadows.plain).toMatch(/0px 0px 0px 2px/);
  expect(shadows.plain).not.toMatch(/4px/);
});

test('user-avatar: fallback stacks under the image; broken image shows initials', async ({ page }) => {
  await load(page, `<user-avatar id="ok" data-size="lg"><img src="${PH}" alt="Jane Doe"><span data-fallback aria-hidden="true">JD</span></user-avatar>
    <user-avatar id="broken" data-size="lg"><img src="/__uy-missing.png" alt="Jane Doe"><span data-fallback aria-hidden="true">JD</span></user-avatar>`,
    { files: { '/__uy-missing.png': { body: 'nope', type: 'text/plain' } } });
  const r = await page.evaluate(() => {
    const host = document.getElementById('ok');
    const a = host.querySelector('img').getBoundingClientRect();
    const b = host.querySelector('[data-fallback]').getBoundingClientRect();
    const hb = host.getBoundingClientRect();
    const broken = document.getElementById('broken').getBoundingClientRect();
    return {
      same: a.x === b.x && a.y === b.y && a.width === b.width,
      fills: a.width === hb.width && a.height === hb.height,
      brokenSize: [broken.width, broken.height],
      imgColor: getComputedStyle(host.querySelector('img')).color,
    };
  });
  expect(r.same).toBe(true);
  expect(r.fills).toBe(true);
  expect(r.brokenSize).toEqual([64, 64]);
  expect(r.imgColor).toBe('rgba(0, 0, 0, 0)');
});

test('user-avatar: xs initials keep a 10px floor; disc follows dark mode', async ({ page }) => {
  await load(page, '<user-avatar id="xs" data-size="xs"><span data-fallback>XS</span></user-avatar>');
  const light = await page.evaluate(() => ({
    size: getComputedStyle(document.getElementById('xs')).fontSize,
    bg: getComputedStyle(document.getElementById('xs')).backgroundColor,
  }));
  expect(parseFloat(light.size)).toBeGreaterThanOrEqual(10);
  await page.evaluate(() => { document.documentElement.style.colorScheme = 'dark'; });
  const darkBg = await page.evaluate(() => getComputedStyle(document.getElementById('xs')).backgroundColor);
  expect(darkBg).not.toBe(light.bg);
});

test('user-avatar: status text is announced, never painted', async ({ page }) => {
  await load(page, '<user-avatar id="s"><span data-fallback aria-hidden="true">JD</span><span data-status="busy">Busy</span></user-avatar>');
  const r = await page.evaluate(() => {
    const st = document.querySelector('#s [data-status]');
    const cs = getComputedStyle(st);
    return { color: cs.color, overflow: cs.overflow, w: st.getBoundingClientRect().width };
  });
  expect(r.color).toBe('rgba(0, 0, 0, 0)');
  expect(r.overflow).toBe('hidden');
  expect(r.w).toBeLessThan(20);
  await expect(page.locator('#s [data-status]')).toHaveText('Busy');
});

test('user-avatar: forced colours draw a border and ring outline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await load(page, '<user-avatar id="r" data-ring><span data-fallback>JD</span></user-avatar>');
  const r = await page.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('r'));
    return { border: cs.borderTopStyle, outline: cs.outlineStyle };
  });
  expect(r).toEqual({ border: 'solid', outline: 'solid' });
});
