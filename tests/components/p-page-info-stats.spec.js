/**
 * page-info + page-stats — P-review fixes.
 *
 * page-info: auto mode is text-only (no HTML injection, http(s)-only links),
 * author link kept out of <summary>, visible trust-tier text, aria-label not
 * accumulated across reconnects, verification aborted on disconnect, a page
 * signed by scripts/sign-pages.js verifies in the browser with a relative or
 * missing canonical link, localized relative time with absolute title,
 * configurable concept base / heading level, reading-time counting rules.
 *
 * page-stats: Intl.Segmenter counting (Japanese), skipped content, live
 * recompute on attribute change with SSR adoption intact, data-label-*
 * templates + plurals, no document.lastModified fallback.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { signPage } from '../../scripts/sign-pages.js';

const REPO = join(import.meta.dirname, '..', '..');
const NOW = new Date('2026-07-06T12:00:00Z');

/**
 * @param {import('playwright/test').Page} page
 * @param {{ head?: string, body: string, lang?: string, html?: string, tag?: string }} opts
 */
async function load(page, { head = '', body = '', lang = 'en', html, tag = 'page-info' }) {
  await page.clock.setFixedTime(NOW);
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__p4-${Math.random().toString(36).slice(2)}.html`;
  const doc = html ?? `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>p4</title>
      <link rel="stylesheet" href="/src/main.css">
      ${head}
      <script type="module">import '/src/web-components/page-info/logic.js'; import '/src/web-components/page-stats/logic.js';</script>
      </head><body><main>${body}</main></body></html>`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200, contentType: 'text/html; charset=utf-8', body: doc,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction((t) => customElements.get(t), tag);
}

/* ───────────────────────────── page-info ── */

const HOSTILE_HEAD = `
  <meta name="author" content="&lt;img src=x onerror=window.__pwned=1&gt;Eve">
  <link rel="author" href="javascript:window.__pwned=2">
  <meta name="last-modified" content="2026-07-03">
  <meta name="keywords" content="&lt;b&gt;bold&lt;/b&gt;">
  <meta name="license" content="&lt;svg onload=window.__pwned=3&gt;">
  <link rel="license" href=" JaVaScRiPt:window.__pwned=4">
  <meta itemprop="version" content="1.0">
  <meta name="vb:version-url" content="data:text/html,hi">
  <meta name="vb:provenance" content="ai-assisted &lt;i&gt;x&lt;/i&gt;">
  <meta name="vb:ai-tools" content="&lt;img src=x onerror=window.__pwned=5&gt;">
  <meta name="vb:status" content='draft"&gt;&lt;img src=x onerror=window.__pwned=6&gt;'>
  <meta name="concept" content='a"&gt;&lt;img src=x onerror=window.__pwned=7&gt;'>`;

test('auto mode renders hostile metadata as text and drops unsafe URLs', async ({ page }) => {
  await load(page, { head: HOSTILE_HEAD, body: '<article data-signable><p>x</p><page-info auto></page-info></article>' });
  await page.waitForSelector('page-info[data-upgraded]');
  const r = await page.evaluate(() => {
    const pi = document.querySelector('page-info');
    return {
      pwned: /** @type {any} */ (window).__pwned ?? null,
      injected: pi.querySelectorAll('img, svg, b, i').length,
      badHrefs: [...pi.querySelectorAll('a')].map((a) => a.getAttribute('href'))
        .filter((h) => !/^(\/|https?:)/i.test(h)),
      text: pi.textContent,
      conceptHref: pi.querySelector('a[rel="tag"]')?.getAttribute('href'),
      status: pi.querySelector('[data-status]')?.getAttribute('data-status'),
    };
  });
  expect(r.pwned).toBeNull();
  expect(r.injected).toBe(0);
  expect(r.badHrefs).toEqual([]);
  expect(r.text).toContain('<img src=x onerror=window.__pwned=5>');
  expect(r.text).toContain('<b>bold</b>');
  expect(r.conceptHref).toBe(`/topics/${encodeURIComponent('a"><img src=x onerror=window.__pwned=7>')}/`);
  expect(r.status).toContain('"><img');
});

const GOOD_HEAD = `
  <meta name="author" content="Jane Doe">
  <link rel="author" href="/team/jane">
  <meta name="last-modified" content="2026-07-03">
  <meta property="article:published_time" content="2026-01-10T00:00:00Z">
  <meta itemprop="version" content="1.4.0">
  <meta name="vb:version-url" content="/changelog#v1-4-0">
  <meta name="vb:provenance" content="ai-assisted">
  <meta name="vb:review" content="editor-reviewed">
  <meta name="vb:ai-tools" content="Claude">
  <meta name="license" content="CC BY 4.0">
  <link rel="license" href="https://creativecommons.org/licenses/by/4.0/">
  <meta name="concept" content="provenance">`;

test('auto mode: plain author in summary, links in panel, visible tier text', async ({ page }) => {
  await load(page, { head: GOOD_HEAD, body: '<page-info auto data-heading-level="3" data-concept-base="/tags/"></page-info>' });
  await page.waitForSelector('page-info[data-upgraded]');
  const r = await page.evaluate(() => {
    const pi = document.querySelector('page-info');
    return {
      summaryLinks: pi.querySelectorAll('summary a').length,
      summaryAuthor: pi.querySelector('summary .page-info-author')?.textContent,
      panelAuthorHref: pi.querySelector('.page-info-panel a[rel="author"]')?.getAttribute('href'),
      licenseHref: pi.querySelector('a[rel="license"]')?.getAttribute('href'),
      versionHref: pi.querySelector('dd a[href^="/changelog"]')?.getAttribute('href'),
      conceptHref: pi.querySelector('a[rel="tag"]')?.getAttribute('href'),
      headings: [...pi.querySelectorAll('.page-info-section-heading')].map((h) => h.tagName),
      badge: pi.querySelector('.page-info-badge')?.firstChild?.textContent,
      tier: pi.querySelector('.page-info-badge .page-info-tier')?.textContent,
      trust: pi.querySelector('.page-info-badge')?.getAttribute('data-trust'),
      badgeLabel: pi.querySelector('.page-info-badge')?.getAttribute('aria-label'),
    };
  });
  expect(r.summaryLinks).toBe(0);
  expect(r.summaryAuthor).toBe('Jane Doe');
  expect(r.panelAuthorHref).toBe('/team/jane');
  expect(r.licenseHref).toBe('https://creativecommons.org/licenses/by/4.0/');
  expect(r.versionHref).toBe('/changelog#v1-4-0');
  expect(r.conceptHref).toBe('/tags/provenance/');
  expect(new Set(r.headings)).toEqual(new Set(['H3']));
  expect(r.trust).toBe('declared');
  expect(r.badge).toBe('Human-written, AI-assisted');
  expect(r.tier).toBe('Self-declared');
  expect(r.badgeLabel).toBeNull();
});

test('unsafe data-concept-base renders concepts as text', async ({ page }) => {
  await load(page, { head: GOOD_HEAD, body: '<page-info auto data-concept-base="javascript:alert(1)//"></page-info>' });
  await page.waitForSelector('page-info[data-upgraded]');
  expect(await page.locator('page-info a[rel="tag"]').count()).toBe(0);
  await expect(page.locator('page-info')).toContainText('provenance');
});

const STATIC = `
  <article data-signable>
    <p>${'word '.repeat(300)}</p>
    <section data-signable><p>${'nested '.repeat(100)}</p></section>
    <aside data-signable="false"><p>${'skip '.repeat(500)}</p></aside>
    <page-info id="pi">
      <details>
        <summary>
          <span class="page-info-author">Jane Doe</span>
          <time id="past" datetime="2026-07-03" data-relative>3 July 2026</time>
          <time id="future" datetime="2026-07-09T12:00:00Z" data-relative>9 July 2026</time>
          <span class="page-info-badge" data-trust="declared" aria-label="Content provenance: human">Human written</span>
        </summary>
        <section class="page-info-panel"><p id="rt" data-reading-time>—</p></section>
      </details>
    </page-info>
  </article>`;

test('static: reconnect rebuilds the badge label instead of appending', async ({ page }) => {
  await load(page, { head: '<meta name="author" content="Jane">', body: STATIC });
  await page.waitForSelector('page-info[data-upgraded]');
  const r = await page.evaluate(() => {
    const pi = document.getElementById('pi');
    const parent = pi.parentElement;
    for (let i = 0; i < 3; i++) { pi.remove(); parent.append(pi); }
    const badge = pi.querySelector('.page-info-badge');
    return { label: badge.getAttribute('aria-label'), tiers: badge.querySelectorAll('.page-info-tier').length };
  });
  expect(r.label).toBe('Content provenance: human — Self-declared');
  expect(r.tiers).toBe(1);
});

test('static: reading time skips data-signable=false and nested roots (238 wpm)', async ({ page }) => {
  await load(page, { head: '<meta name="author" content="Jane">', body: STATIC });
  await page.waitForSelector('page-info[data-upgraded]');
  /* 300 + 100 words = 400 → ceil(400 / 238) = 2; the 500 skipped words would make it 4. */
  await expect(page.locator('#rt')).toHaveText('~2 min');
});

test('relative times are localized, keep an absolute title and handle future dates', async ({ page }) => {
  await load(page, { lang: 'de', head: '<meta name="author" content="Jane">', body: STATIC });
  await page.waitForSelector('page-info[data-upgraded]');
  await expect(page.locator('#past')).toHaveText('vor 3 Tagen');
  await expect(page.locator('#past')).toHaveAttribute('title', '3. Juli 2026');
  await expect(page.locator('#future')).toHaveText('in 3 Tagen');
});

/* Signed fixtures: signed by the real build signer, verified in the browser. */
async function signedFixture(canonicalLink) {
  const priv = JSON.parse(await readFile(join(REPO, 'scripts/demo-keys/vb-release-demo.private.jwk'), 'utf-8'));
  const { kty, crv, x, y, d } = priv;
  const key = await crypto.subtle.importKey('jwk', { kty, crv, x, y, d, key_ops: ['sign'] },
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Signed</title>
    ${canonicalLink}
    <meta name="author" content="Jane Doe">
    <meta name="vb:provenance" content="human">
    <script type="module">import '/src/web-components/page-info/logic.js';</script>
    </head><body><main><article data-signable><h1>Signed</h1><p>Body text that was signed.</p>
    <page-info auto></page-info></article></main></body></html>`;
  const res = await signPage(html, { key, kid: priv.kid, keyUrl: '/__p4-key.jwk' });
  return res.html;
}

async function routeKey(page, delay = 0) {
  const pub = await readFile(join(REPO, 'site/src/pages/.well-known/content-keys/vb-release-demo.jwk'), 'utf-8');
  await page.route('**/__p4-key.jwk', async (route) => {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({ status: 200, contentType: 'application/json', body: pub }).catch(() => {});
  });
}

for (const [name, link] of [
  ['relative canonical', '<link rel="canonical" href="/docs/signed/">'],
  ['no canonical link', ''],
  ['absolute canonical', '<link rel="canonical" href="https://example.com/docs/signed/">'],
]) {
  test(`a page signed by sign-pages.js verifies in the browser (${name})`, async ({ page }) => {
    await routeKey(page);
    await load(page, { html: await signedFixture(link) });
    const badge = page.locator('page-info .page-info-badge');
    await expect(badge).toHaveAttribute('data-trust', 'verified');
    await expect(badge.locator('.page-info-tier')).toHaveText('Verified');
  });
}

test('tampered signed page fails with visible text', async ({ page }) => {
  await routeKey(page);
  const html = (await signedFixture('')).replace('Body text that was signed.', 'Body text that was changed.');
  await load(page, { html });
  const badge = page.locator('page-info .page-info-badge');
  await expect(badge).toHaveAttribute('data-trust', 'failed');
  await expect(badge.locator('.page-info-tier')).toHaveText('Signature failed');
});

test('disconnect aborts in-flight verification', async ({ page }) => {
  await routeKey(page, 400);
  await load(page, { html: await signedFixture('') });
  const events = await page.evaluate(async () => {
    const seen = [];
    document.addEventListener('page-info:verified', (e) => seen.push(/** @type {CustomEvent} */ (e).detail.status));
    document.querySelector('page-info').remove();
    await new Promise((r) => setTimeout(r, 900));
    return seen;
  });
  expect(events).toEqual([]);
});

/* ───────────────────────────── page-stats ── */

test('page-stats segments Japanese words and times them by characters', async ({ page }) => {
  const ja = '吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。'.repeat(40);
  await load(page, {
    tag: 'page-stats', lang: 'ja',
    body: `<page-stats id="ps" data-show="reading-time,word-count" data-label-words="{n} 語"></page-stats>
      <article id="t"><p>${ja}</p></article>`,
  });
  await page.evaluate(() => document.getElementById('ps').setAttribute('data-for', 't'));
  const words = await page.locator('#ps dl-item').nth(1).locator('dd').textContent();
  const n = Number(words.replace(/[^\d]/g, ''));
  expect(n).toBeGreaterThan(400);
  expect(words).toContain('語');
  /* ~1240 CJK characters at 500/min → 3 min (old whitespace split said 1 word, 1 min). */
  await expect(page.locator('#ps time')).toHaveAttribute('datetime', 'PT3M');
});

test('page-stats skips script/style/hidden text, recomputes on attribute change, adopts SSR markup', async ({ page }) => {
  await load(page, {
    tag: 'page-stats',
    body: `<page-stats id="ps" data-for="t" data-show="word-count"></page-stats>
      <page-stats id="ssr"><dl class="page-stats-list"><dl-item><dt class="visually-hidden">Reading time</dt><dd>9 min read</dd></dl-item></dl></page-stats>
      <article id="t"><p>one two three</p><script>var a = "x y z";</script><style>p{}</style>
        <p hidden>four five</p><p aria-hidden="true">six</p><p data-stats-ignore>seven</p></article>`,
  });
  await page.waitForSelector('#ps[data-upgraded]');
  await expect(page.locator('#ps dd')).toHaveText('3 words');
  await page.evaluate(() => {
    const ps = document.getElementById('ps');
    ps.setAttribute('data-label-words-one', '{n} word');
    ps.setAttribute('data-show', 'reading-time,word-count');
    document.querySelector('#t p').textContent = 'one';
    ps.setAttribute('data-wpm', '100');
  });
  await expect(page.locator('#ps dl')).toHaveCount(1);
  await expect(page.locator('#ps dl')).toHaveAttribute('data-generated', '');
  await expect(page.locator('#ps dd').nth(1)).toHaveText('1 word');
  await expect(page.locator('#ps time')).toHaveText('1 min read');
  await expect(page.locator('#ssr dd')).toHaveText('9 min read');
  const sep = await page.evaluate(() => getComputedStyle(document.querySelector('#ps dl-item + dl-item'), '::before').content);
  expect(sep).toContain('/');
});

test('page-stats last-modified: declared date only, localized, absolute title', async ({ page }) => {
  await load(page, {
    tag: 'page-stats', lang: 'fr',
    body: '<page-stats id="ps" data-for="t" data-show="last-modified,reading-time"></page-stats><article id="t"><p>a b c</p></article>',
  });
  await page.waitForSelector('#ps[data-upgraded]');
  /* No meta → no last-modified item (document.lastModified is not used). */
  await expect(page.locator('#ps dl-item')).toHaveCount(1);
  await expect(page.locator('#ps time')).toHaveText('1 min');

  await page.evaluate(() => {
    const m = document.createElement('meta');
    m.name = 'last-modified'; m.content = '2026-07-03';
    document.head.append(m);
    document.getElementById('ps').setAttribute('data-label-last-modified', 'Mis à jour');
  });
  const t = page.locator('#ps time[datetime="2026-07-03"]');
  await expect(t).toHaveText('il y a 3 jours');
  await expect(t).toHaveAttribute('title', '3 juillet 2026');
  await expect(page.locator('#ps dt').nth(1)).toHaveText('Mis à jour');
});
