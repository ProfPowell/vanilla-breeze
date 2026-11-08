/**
 * poll-wc + popularity-index — P-review fixes.
 *
 * poll-wc: reconnect keeps voting live, group naming, pending guard, APG
 * keyboard (single = arrows move+check, RTL flip; multi = Tab only),
 * hide-counts hides from AT and bars, Intl labels, closed text in DOM,
 * disabled observed, native-form enhancement, forced-colors bar.
 *
 * popularity-index: generic unavailable message + data-state, list built
 * with DOM APIs and unsafe schemes dropped, attribute reactivity with
 * cancelled stale fetches, heading level, labels + Intl, limit clamp.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ dir?: string, lang?: string, component: string }} opts
 */
async function load(page, body, { dir = 'ltr', lang = 'en', component }) {
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__p6-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      <script type="module">import '/src/web-components/${component}/logic.js';</script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction((c) => customElements.get(c), component);
}

// ── poll-wc ────────────────────────────────────────────────────────────

const SINGLE = `
  <poll-wc id="p">
    <span slot="question">When should we ship?</span>
    <button data-option="friday" data-count="12">Friday</button>
    <button data-option="next-mon" data-count="33" data-mine><strong>Next</strong> Monday</button>
    <button data-option="next-fri" data-count="8">Next Friday</button>
    <button data-option="never" data-count="2">Never</button>
  </poll-wc>
  <p id="outside">Outside</p>`;

const loadPoll = async (page, body = SINGLE, opts = {}) => {
  await load(page, body, { component: 'poll-wc', ...opts });
  await page.waitForSelector('poll-wc[data-upgraded]');
};

/** Record vote events on window.__votes. */
const recordVotes = (page) => page.evaluate(() => {
  const w = /** @type {any} */ (window);
  w.__votes = [];
  document.addEventListener('poll-wc:vote', (e) => w.__votes.push(/** @type {CustomEvent} */ (e).detail));
});
const votes = (page) => page.evaluate(() => /** @type {any} */ (window).__votes);

test('poll: reconnect keeps one structure and options still vote', async ({ page }) => {
  await loadPoll(page);
  await recordVotes(page);
  const shape = await page.evaluate(() => {
    const p = /** @type {HTMLElement} */ (document.getElementById('p'));
    const main = /** @type {HTMLElement} */ (p.parentElement);
    for (let i = 0; i < 3; i++) { p.remove(); main.prepend(p); }
    return {
      groups: p.querySelectorAll('.poll-options').length,
      totals: p.querySelectorAll('.poll-total').length,
      labels: p.querySelectorAll('.poll-option-label').length,
      bars: p.querySelectorAll('.poll-option-bar').length,
    };
  });
  expect(shape).toEqual({ groups: 1, totals: 1, labels: 4, bars: 4 });
  await page.getByRole('radio', { name: /^Friday/ }).click();
  expect(await votes(page)).toEqual([
    { option: 'next-mon', action: 'remove', count: 33, mine: true },
    { option: 'friday', action: 'add', count: 12, mine: false },
  ]);
});

test('poll: group is named by the question; aria-label moves to the group; fallback name', async ({ page }) => {
  await loadPoll(page, `${SINGLE}
    <poll-wc id="labelled" aria-label="Lunch vote"><button data-option="a" data-count="1">A</button></poll-wc>
    <poll-wc id="bare" data-label-poll="Umfrage"><button data-option="a" data-count="1">A</button></poll-wc>`);
  await expect(page.getByRole('radiogroup', { name: 'When should we ship?' })).toHaveCount(1);
  await expect(page.getByRole('radiogroup', { name: 'Lunch vote' })).toHaveCount(1);
  await expect(page.locator('#labelled')).not.toHaveAttribute('aria-label', /.*/);
  await expect(page.getByRole('radiogroup', { name: 'Umfrage' })).toHaveCount(1);
});

test('poll: author label markup kept, visible percent, Intl aria-label', async ({ page }) => {
  await loadPoll(page);
  const opt = page.locator('button[data-option="next-mon"]');
  await expect(opt.locator('.poll-option-label strong')).toHaveText('Next');
  await expect(opt.locator('.poll-option-count')).toHaveText('33 · 60%');
  await expect(opt).toHaveAttribute('aria-label', 'Next Monday, 33 votes, 60%, your choice');
  await expect(page.locator('button[data-option="never"]')).toHaveAttribute('aria-label', 'Never, 2 votes, 4%');
  await expect(page.locator('#p .poll-total')).toHaveText('55 votes');
});

test('poll: data-label-* and lang drive plural + number formatting', async ({ page }) => {
  await loadPoll(page, `<poll-wc id="p" data-closed data-label-vote="Stimme" data-label-votes="Stimmen" data-label-closed="beendet">
      <button data-option="a" data-count="1">A</button>
      <button data-option="b" data-count="1233">B</button>
    </poll-wc>`, { lang: 'de' });
  await expect(page.locator('[data-option="a"]')).toHaveAttribute('aria-label', /^A, 1 Stimme, 0\s%$/);
  await expect(page.locator('[data-option="b"] .poll-option-count')).toHaveText(/^1\.233 · 100\s%$/);
  // "closed" is real DOM text (inside the live <output>), not CSS content.
  await expect(page.locator('.poll-total')).toHaveText('1.234 Stimmen · beendet');
});

test('poll: pending guard drops repeat clicks until setCount', async ({ page }) => {
  await loadPoll(page);
  await recordVotes(page);
  const friday = page.locator('[data-option="friday"]');
  await friday.click();
  await friday.click();
  await page.locator('[data-option="never"]').click();
  expect((await votes(page)).length).toBe(2);
  await expect(friday).toHaveAttribute('data-pending', '');
  await expect(page.locator('.poll-options')).toHaveAttribute('aria-busy', 'true');
  await page.evaluate(() => {
    const p = /** @type {any} */ (document.getElementById('p'));
    p.setCount('next-mon', 32, { mine: false });
    p.setCount('friday', 13, { mine: true });
  });
  await expect(friday).not.toHaveAttribute('data-pending', /.*/);
  await expect(page.locator('.poll-options')).not.toHaveAttribute('aria-busy', /.*/);
  await friday.click();
  expect((await votes(page)).at(-1)).toEqual({ option: 'friday', action: 'remove', count: 13, mine: true });
});

test('poll multi: pending is per option', async ({ page }) => {
  await loadPoll(page, `<poll-wc id="p" data-multi>
      <button data-option="a" data-count="1">A</button>
      <button data-option="b" data-count="1">B</button>
    </poll-wc>`);
  await recordVotes(page);
  await page.locator('[data-option="a"]').click();
  await page.locator('[data-option="a"]').click();
  await page.locator('[data-option="b"]').click();
  expect((await votes(page)).map((v) => v.option)).toEqual(['a', 'b']);
});

test('poll single: arrows move focus and vote (APG), RTL flips Left/Right', async ({ page }) => {
  await loadPoll(page, SINGLE, { dir: 'rtl' });
  await recordVotes(page);
  await page.locator('[data-option="next-mon"]').focus();
  await page.keyboard.press('ArrowLeft'); // RTL: Left = next
  await expect(page.locator('[data-option="next-fri"]')).toBeFocused();
  await expect(page.locator('[data-option="next-fri"]')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('[data-option="next-mon"]')).toHaveAttribute('tabindex', '-1');
  expect(await votes(page)).toEqual([
    { option: 'next-mon', action: 'remove', count: 33, mine: true },
    { option: 'next-fri', action: 'add', count: 8, mine: false },
  ]);
  // While pending, further arrows only move focus.
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-option="next-mon"]')).toBeFocused();
  expect((await votes(page)).length).toBe(2);
});

test('poll multi: no arrow handling, every option tabbable', async ({ page }) => {
  await loadPoll(page, `<poll-wc id="p" data-multi>
      <button data-option="a" data-count="1">A</button>
      <button data-option="b" data-count="1">B</button>
    </poll-wc>`);
  await recordVotes(page);
  await page.locator('[data-option="a"]').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-option="a"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-option="b"]')).toBeFocused();
  await page.keyboard.press('Space');
  expect(await votes(page)).toEqual([{ option: 'b', action: 'add', count: 1, mine: false }]);
  await expect(page.getByRole('group')).toHaveCount(1);
  await expect(page.getByRole('checkbox')).toHaveCount(2);
});

test('poll: data-hide-counts hides counts from AT and hides bars', async ({ page }) => {
  await loadPoll(page, SINGLE.replace('<poll-wc id="p">', '<poll-wc id="p" data-hide-counts>'));
  const opt = page.locator('[data-option="next-mon"]');
  await expect(opt).toHaveAttribute('aria-label', 'Next Monday, your choice');
  await expect(opt.locator('.poll-option-count')).toHaveText('');
  await expect(opt.locator('.poll-option-bar')).toBeHidden();
});

test('poll: disabled is observed', async ({ page }) => {
  await loadPoll(page);
  await recordVotes(page);
  await page.evaluate(() => document.getElementById('p')?.setAttribute('disabled', ''));
  await expect(page.locator('[data-option="friday"]')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('[data-option="friday"]').dispatchEvent('click');
  expect(await votes(page)).toEqual([]);
  await page.evaluate(() => document.getElementById('p')?.removeAttribute('disabled'));
  await expect(page.locator('[data-option="friday"]')).not.toHaveAttribute('aria-disabled', /.*/);
});

test('poll: closed-change fires on toggle, not during setup', async ({ page }) => {
  await page.addInitScript(() => {
    /** @type {any} */ (window).__closed = [];
    document.addEventListener('poll-wc:closed-change', (e) => /** @type {any} */ (window).__closed.push(/** @type {CustomEvent} */ (e).detail.closed));
  });
  await loadPoll(page, `<poll-wc id="p"><form><fieldset disabled><legend>Q</legend>
      <label><input type="radio" name="v" value="a" data-count="1"> A</label></fieldset></form></poll-wc>`);
  await page.evaluate(() => /** @type {any} */ (document.getElementById('p')).open());
  expect(await page.evaluate(() => /** @type {any} */ (window).__closed)).toEqual([false]);
});

test('poll: enhances a native radio/checkbox form', async ({ page }) => {
  await loadPoll(page, `
    <poll-wc id="radio">
      <form action="/vote" method="post">
        <fieldset>
          <legend>Default <em>theme</em>?</legend>
          <label><input type="radio" name="v" value="light" data-count="18"> Light</label>
          <input type="radio" name="v" id="d" value="dark" data-count="27"> <label for="d">Dark</label>
          <label><input type="radio" name="v" value="system" data-count="41" checked> Follow the system</label>
          <output>86 votes so far</output>
          <button type="submit">Vote</button>
        </fieldset>
      </form>
    </poll-wc>
    <poll-wc id="multi"><form><fieldset><legend>Pick any</legend>
      <label><input type="checkbox" name="f" value="x" data-count="2" checked> X</label>
      <label><input type="checkbox" name="f" value="y" data-count="3"> Y</label>
    </fieldset></form></poll-wc>`);
  const r = page.locator('#radio');
  await expect(r.locator('form')).toHaveCount(0);
  await expect(page.getByRole('radiogroup', { name: 'Default theme?' })).toHaveCount(1);
  await expect(r.getByRole('radio')).toHaveCount(3);
  await expect(r.locator('[data-option="system"]')).toHaveAttribute('data-mine', '');
  await expect(r.locator('[data-option="dark"] .poll-option-label')).toHaveText('Dark');
  await expect(r.locator('.poll-total')).toHaveText('86 votes');
  await expect(r.locator('button[type="submit"]')).toHaveCount(0);
  await expect(page.locator('#multi')).toHaveAttribute('data-multi', '');
  await expect(page.locator('#multi').getByRole('checkbox', { name: /^X, 2 votes/ })).toHaveAttribute('aria-checked', 'true');
});

test('poll: forced colors draws the bar in Highlight', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await loadPoll(page);
  const bar = await page.locator('[data-option="next-mon"] .poll-option-bar').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { fca: cs.forcedColorAdjust, h: parseFloat(cs.blockSize), w: parseFloat(cs.inlineSize) };
  });
  expect(bar.fca).toBe('none');
  expect(bar.h).toBeGreaterThan(0);
  expect(bar.w).toBeGreaterThan(0);
  const bw = await page.locator('[data-option="next-mon"]').evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
  expect(bw).toBeGreaterThanOrEqual(3);
});

// ── popularity-index ─────────────────────────────────────────────────────

const PAGES = {
  pages: [
    { url: '/a/', views: 1834 },
    { url: 'javascript:alert(1)', title: 'XSS', views: 900 },
    { url: '//evil.example/', title: 'Off-site', views: 800 },
    { url: '/b/', title: '<img src=x onerror=alert(1)>', views: 1 },
    { url: 'https://example.org/c', title: 'Cee', views: 12000 },
  ],
};
const META = { pages: [{ url: '/a/', title: 'Alpha', provenance: 'human' }] };

/**
 * @param {import('playwright/test').Page} page
 * @param {Record<string, { status?: number, json?: any, body?: string, delay?: number }>} routes
 */
async function mockApi(page, routes) {
  const seen = [];
  await page.route('**/__api/**', async (route) => {
    const u = new URL(route.request().url());
    seen.push(u.pathname + u.search);
    const r = routes[u.pathname];
    if (!r) return route.fulfill({ status: 404, contentType: 'text/html', body: 'nope' });
    if (r.delay) await new Promise((res) => setTimeout(res, r.delay));
    return route.fulfill({
      status: r.status ?? 200,
      contentType: 'application/json',
      body: r.body ?? JSON.stringify(r.json),
    }).catch(() => {});
  });
  return seen;
}

const loadPop = (page, body, opts = {}) => load(page, body, { component: 'popularity-index', ...opts });

test('popularity: unavailable shows a generic message, state and no error text', async ({ page }) => {
  await mockApi(page, {});
  await loadPop(page, '<popularity-index analytics-src="/__api/missing"></popularity-index>');
  const el = page.locator('popularity-index');
  await expect(el).toHaveAttribute('data-state', 'unavailable');
  await expect(el).toContainText('Popularity data is unavailable right now.');
  await expect(el).not.toContainText('404');
  await expect(el).toHaveAttribute('data-error', 'status 404');
  await expect(el).not.toHaveAttribute('aria-busy', /.*/);
});

test('popularity: invalid JSON → unavailable; custom label', async ({ page }) => {
  await mockApi(page, { '/__api/bad': { body: '{not json' } });
  await loadPop(page, '<popularity-index analytics-src="/__api/bad" data-label-unavailable="Keine Daten."></popularity-index>');
  await expect(page.locator('popularity-index .popularity-empty')).toHaveText('Keine Daten.');
});

test('popularity: empty state', async ({ page }) => {
  await mockApi(page, { '/__api/empty': { json: { ok: true, pages: [] } } });
  await loadPop(page, '<popularity-index analytics-src="/__api/empty"></popularity-index>');
  await expect(page.locator('popularity-index')).toHaveAttribute('data-state', 'empty');
  await expect(page.locator('popularity-index')).toContainText('Not enough data yet');
});

test('popularity: list drops unsafe URLs, renders titles as text, compact counts, provenance', async ({ page }) => {
  await mockApi(page, { '/__api/pop': { json: PAGES }, '/__api/meta.json': { json: META } });
  await loadPop(page, '<popularity-index analytics-src="/__api/pop" data-meta-src="/__api/meta.json"></popularity-index>');
  const el = page.locator('popularity-index');
  await expect(el).toHaveAttribute('data-state', 'ready');
  const links = el.locator('a');
  await expect(links).toHaveCount(3);
  expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual(['/a/', '/b/', 'https://example.org/c']);
  await expect(links.nth(0)).toHaveText('Alpha');
  await expect(links.nth(1)).toHaveText('<img src=x onerror=alert(1)>');
  await expect(el.locator('img')).toHaveCount(0);
  await expect(el.locator('li').nth(0).locator('small')).toHaveText('1.8K views · human');
  await expect(el.locator('li').nth(1).locator('small')).toHaveText('1 view');
  await expect(el.locator('li').nth(2).locator('small')).toHaveText('12K views');
  await expect(el.locator('.popularity-prov')).toHaveAttribute('data-provenance', 'human');
  await expect(el.locator('h2.popularity-heading')).toHaveText('Most visited');
});

test('popularity: heading level, no heading, limit clamp', async ({ page }) => {
  await mockApi(page, { '/__api/pop': { json: PAGES } });
  await loadPop(page, `
    <popularity-index id="h3" analytics-src="/__api/pop" data-heading-level="3" data-label-heading="Popular"></popularity-index>
    <popularity-index id="none" analytics-src="/__api/pop" data-heading-level="0" limit="-3"></popularity-index>`);
  await expect(page.locator('#h3 h3')).toHaveText('Popular');
  await expect(page.locator('#none')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#none :is(h1,h2,h3,h4,h5,h6)')).toHaveCount(0);
  await expect(page.locator('#none li')).toHaveCount(1);
});

test('popularity: loading state then attribute changes re-fetch; stale response ignored', async ({ page }) => {
  const seen = await mockApi(page, {
    '/__api/slow': { json: { pages: [{ url: '/slow/', title: 'Slow', views: 5 }] }, delay: 800 },
    '/__api/fast': { json: { pages: [{ url: '/fast/', title: 'Fast', views: 5 }] } },
  });
  await loadPop(page, '<popularity-index analytics-src="/__api/slow" window="7d"></popularity-index>');
  const el = page.locator('popularity-index');
  await expect(el).toHaveAttribute('data-state', 'loading');
  await expect(el).toHaveAttribute('aria-busy', 'true');
  await page.evaluate(() => document.querySelector('popularity-index')?.setAttribute('analytics-src', '/__api/fast'));
  await expect(el).toHaveAttribute('data-state', 'ready');
  await expect(el.locator('a')).toHaveText('Fast');
  await page.waitForTimeout(1000);
  await expect(el.locator('a')).toHaveText('Fast');
  expect(seen).toContain('/__api/slow?window=7d');
  expect(seen).toContain('/__api/fast?window=7d');

  await page.evaluate(() => document.querySelector('popularity-index')?.setAttribute('window', '30d'));
  await expect.poll(() => seen.includes('/__api/fast?window=30d')).toBe(true);
});

test('popularity: one fetch for a burst of attribute changes; nothing renders after removal', async ({ page }) => {
  const seen = await mockApi(page, {
    '/__api/pop': { json: PAGES },
    '/__api/slow': { json: PAGES, delay: 500 },
  });
  await loadPop(page, '<popularity-index analytics-src="/__api/pop"></popularity-index>');
  await expect(page.locator('popularity-index')).toHaveAttribute('data-state', 'ready');
  const before = seen.length;
  await page.evaluate(() => {
    const el = /** @type {HTMLElement} */ (document.querySelector('popularity-index'));
    el.setAttribute('limit', '2');
    el.setAttribute('window', '24h');
    el.setAttribute('data-heading-level', '4');
  });
  await expect(page.locator('popularity-index li')).toHaveCount(2);
  await expect(page.locator('popularity-index h4')).toHaveCount(1);
  expect(seen.length - before).toBe(1);

  const r = await page.evaluate(async () => {
    const el = /** @type {HTMLElement} */ (document.querySelector('popularity-index'));
    el.setAttribute('analytics-src', '/__api/slow');
    await new Promise((res) => setTimeout(res, 50));
    el.remove();
    await new Promise((res) => setTimeout(res, 800));
    return { state: el.dataset.state, items: el.querySelectorAll('li').length };
  });
  expect(r).toEqual({ state: 'loading', items: 0 });
});

test('popularity: German locale compact format', async ({ page }) => {
  await mockApi(page, { '/__api/pop': { json: { pages: [{ url: '/a/', title: 'A', views: 1234567 }] } } });
  await loadPop(page, '<popularity-index analytics-src="/__api/pop" data-label-view="Aufruf" data-label-views="Aufrufe"></popularity-index>', { lang: 'de' });
  await expect(page.locator('popularity-index small')).toHaveText(/^1,2\sMio\. Aufrufe$/);
});

test('popularity: data: URL endpoint (compendium fixture form) renders', async ({ page }) => {
  const du = `data:application/json,${encodeURIComponent(JSON.stringify({ pages: [{ url: '/x/', title: 'X', views: 3 }] }))}`;
  await loadPop(page, `<popularity-index analytics-src="${du}"></popularity-index>`);
  await expect(page.locator('popularity-index')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('popularity-index a')).toHaveText('X');
});
