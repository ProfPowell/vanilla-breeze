/**
 * include-file + sanitize-html — review fixes (vanilla-breeze-9vrm).
 *
 * Covers the XSS chain (sanitized content -> <include-file src=blob:>),
 * the same-origin default, sanitizing by default, trusted / allow-scripts,
 * fetch-capable VB elements neutralised by sanitizeHTML, sanitizeSVG,
 * nesting cycles + depth, append/script isolation, single fetch on upgrade,
 * reconnect with a changed src, unknown mode, aria-busy and the error element.
 *
 * Tests the working tree: /src is served from disk, not the build.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const EVIL = 'https://evil.example';

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ files?: Record<string, string | { body: string, delay?: number, status?: number, headers?: Record<string,string> }>, head?: string }} [opts]
 */
async function load(page, body, { files = {}, head = '' } = {}) {
  const hits = /** @type {Record<string, number>} */ ({});
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const serve = async (route) => {
    const u = new URL(route.request().url());
    const key = u.origin === EVIL ? `${EVIL}${u.pathname}` : u.pathname;
    hits[key] = (hits[key] || 0) + 1;
    const f = files[key];
    if (f == null) return route.fulfill({ status: 404, body: 'nope' });
    const spec = typeof f === 'string' ? { body: f } : f;
    if (spec.delay) await new Promise((r) => setTimeout(r, spec.delay));
    return route.fulfill({
      status: spec.status ?? 200,
      contentType: 'text/html; charset=utf-8',
      headers: { 'access-control-allow-origin': '*', ...(spec.headers || {}) },
      body: spec.body,
    });
  };
  await page.route('**/__if/**', serve);
  await page.route(`${EVIL}/**`, serve);
  const url = `/__include-file-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">${head}
      <script type="module">
        import '/src/web-components/include-file/logic.js';
        import '/src/web-components/markdown-viewer/logic.js';
        import * as s from '/src/lib/sanitize-html.js';
        window.__s = s;
        window.__ready = true;
      </script>
      </head><body><main>${body}</main></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => /** @type {any} */ (window).__ready);
  return hits;
}

/** Create an include-file, wait for loaded/error, return its state. */
async function include(page, attrs, { parent = 'main', timeout = 4000 } = {}) {
  return page.evaluate(({ attrs, parent, timeout }) => new Promise((resolve) => {
    const el = document.createElement('include-file');
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    const done = (type, e) => resolve({
      type,
      detail: e?.detail ?? null,
      html: el.innerHTML,
      error: el.hasAttribute('data-error'),
      alert: el.querySelector('[role="alert"]')?.textContent ?? null,
    });
    el.addEventListener('include-file:loaded', (e) => done('loaded', e), { once: true });
    el.addEventListener('include-file:error', (e) => done('error', e), { once: true });
    document.querySelector(parent).append(el);
    setTimeout(() => done('timeout'), timeout);
  }), { attrs, parent, timeout });
}

// ── 1. The reported XSS chain ─────────────────────────────────────

test('markdown-viewer (default sanitize) neutralises <include-file>: no fetch, no execution', async ({ page }) => {
  const hits = await load(page, '<p id="host"></p>', {
    files: { '/__if/evil.html': '<img src="x" onerror="window.__pwned=1">' },
  });
  const r = await page.evaluate(async () => {
    const blobUrl = URL.createObjectURL(new Blob(['<img src="x" onerror="window.__pwned=2">'], { type: 'text/html' }));
    const mv = document.createElement('markdown-viewer');
    // The markdown source is text (attacker-controlled), never live markup
    const script = document.createElement('script');
    script.type = 'text/markdown';
    script.textContent = `Hello\n\n<include-file src="${blobUrl}"></include-file>\n\n<include-file src="/__if/evil.html" trusted allow-scripts></include-file>\n\n<markdown-viewer sanitize="off" src="/__if/evil.html"><pre>&lt;img src=x onerror="window.__pwned=3"&gt;</pre></markdown-viewer>\n`;
    mv.append(script);
    const rendered = new Promise((res) => mv.addEventListener('markdown-viewer:rendered', res, { once: true }));
    document.getElementById('host').append(mv);
    await rendered;
    await new Promise((res) => setTimeout(res, 600));
    const incs = [...mv.querySelectorAll('.md-content include-file')];
    const inner = mv.querySelector('.md-content markdown-viewer');
    return {
      pwned: /** @type {any} */ (window).__pwned ?? 0,
      includes: incs.length,
      includeAttrs: incs.map((e) => e.getAttributeNames().filter((n) => !n.startsWith('data-') && n !== 'aria-busy')),
      innerAttrs: inner ? inner.getAttributeNames().filter((n) => !n.startsWith('data-')) : null,
    };
  });
  expect(r.pwned).toBe(0);
  expect(r.includes).toBe(2);
  expect(r.includeAttrs).toEqual([[], []]);
  expect(r.innerAttrs).toEqual([]);
  expect(hits['/__if/evil.html'] ?? 0).toBe(0);
});

// ── 2. Origin policy ──────────────────────────────────────────────

test('cross-origin, blob:, data: and javascript: URLs are refused by default', async ({ page }) => {
  const hits = await load(page, '', { files: { [`${EVIL}/x.html`]: '<p>remote</p>' } });
  const blob = await page.evaluate(() => URL.createObjectURL(new Blob(['<p>b</p>'], { type: 'text/html' })));
  for (const src of [`${EVIL}/x.html`, blob, 'data:text/html,<p>d</p>', 'javascript:alert(1)']) {
    const r = await include(page, { src });
    expect(r.type, src).toBe('error');
    expect(r.error).toBe(true);
    expect(r.detail.error).toMatch(/Refused/);
  }
  expect(hits[`${EVIL}/x.html`] ?? 0).toBe(0);
});

test('allow-cross-origin permits another origin but still sanitizes', async ({ page }) => {
  const hits = await load(page, '', {
    files: { [`${EVIL}/x.html`]: '<p id="remote" onclick="window.__pwned=1">remote</p><script>window.__pwned=2</script>' },
  });
  const r = await include(page, { src: `${EVIL}/x.html`, 'allow-cross-origin': '' });
  expect(r.type).toBe('loaded');
  expect(r.html).toContain('id="remote"');
  expect(r.html).not.toContain('onclick');
  expect(r.html).not.toContain('<script');
  expect(hits[`${EVIL}/x.html`]).toBe(1);
});

test('a same-origin URL that redirects off-origin is refused', async ({ page }) => {
  await load(page, '');
  // Simulate the post-redirect Response (fetch exposes the final URL as .url)
  await page.evaluate(() => {
    window.fetch = async () => /** @type {any} */ ({
      ok: true, status: 200, statusText: 'OK', url: 'https://evil.example/x.html',
      text: async () => '<p>remote</p>',
    });
  });
  const r = await include(page, { src: '/__if/redirect.html' });
  expect(r.type).toBe('error');
  expect(r.detail.error).toMatch(/cross-origin/);
  expect(r.html).not.toContain('remote');
});

// ── 3. Sanitizing by default; trusted; allow-scripts ──────────────

const NASTY = `<p id="ok">Hello <a id="js" href="javascript:window.__pwned=1">x</a></p>
<img id="img" src="x" onerror="window.__pwned=2">
<script>window.__pwned=3</script>
<svg><foreignObject><p>fo</p></foreignObject><a id="svga" xlink:href="javascript:window.__pwned=4"><text>t</text></a></svg>
<iframe srcdoc="<script>parent.__pwned=5</script>"></iframe>
<form id="frm"><button formaction="javascript:window.__pwned=6">b</button></form>`;

test('fetched HTML is sanitized by default (handlers, scripts, javascript: URLs)', async ({ page }) => {
  await load(page, '', { files: { '/__if/nasty.html': NASTY } });
  const r = await include(page, { src: '/__if/nasty.html' });
  expect(r.type).toBe('loaded');
  await page.waitForTimeout(300);
  const s = await page.evaluate(() => ({
    pwned: /** @type {any} */ (window).__pwned ?? 0,
    ok: !!document.getElementById('ok'),
    jsHref: document.getElementById('js')?.getAttribute('href') ?? null,
    imgOnerror: document.getElementById('img')?.getAttribute('onerror') ?? null,
    scripts: document.querySelectorAll('main include-file script').length,
    fo: document.querySelectorAll('main include-file foreignObject').length,
    iframes: document.querySelectorAll('main include-file iframe').length,
    form: !!document.getElementById('frm'),
    svgHref: document.getElementById('svga')?.getAttribute('xlink:href') ?? null,
  }));
  expect(s).toEqual({ pwned: 0, ok: true, jsHref: null, imgOnerror: null, scripts: 0, fo: 0, iframes: 0, form: false, svgHref: null });
  expect(r.detail.html).not.toContain('onerror');
});

test('trusted keeps the markup; scripts still need allow-scripts', async ({ page }) => {
  await load(page, '', {
    files: { '/__if/t.html': '<form id="tf"><button onclick="void 0">b</button></form><script>window.__ran=(window.__ran||0)+1</script>' },
  });
  const r = await include(page, { src: '/__if/t.html', trusted: '' });
  expect(r.type).toBe('loaded');
  expect(r.html).toContain('<form id="tf">');
  expect(r.html).toContain('onclick');
  expect(r.html).not.toContain('<script');
  expect(await page.evaluate(() => /** @type {any} */ (window).__ran ?? 0)).toBe(0);
});

test('allow-scripts is ignored without trusted; trusted + allow-scripts runs once', async ({ page }) => {
  await load(page, '', { files: { '/__if/s.html': '<p>s</p><script>window.__ran=(window.__ran||0)+1</script>' } });
  const warnings = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  await include(page, { src: '/__if/s.html', 'allow-scripts': '' });
  expect(await page.evaluate(() => /** @type {any} */ (window).__ran ?? 0)).toBe(0);
  expect(warnings.some((w) => /allow-scripts is ignored without trusted/.test(w))).toBe(true);
  await include(page, { src: '/__if/s.html', 'allow-scripts': '', trusted: '' });
  expect(await page.evaluate(() => /** @type {any} */ (window).__ran ?? 0)).toBe(1);
});

test('nested include-file in a sanitized fragment keeps src but loses trust attributes', async ({ page }) => {
  await load(page, '', {
    files: {
      '/__if/outer.html': '<include-file id="inner" src="/__if/inner.html" trusted allow-scripts allow-cross-origin></include-file>',
      '/__if/inner.html': '<p id="innerp" onclick="x()">inner</p><script>window.__ran=1</script>',
    },
  });
  await include(page, { src: '/__if/outer.html' });
  await page.waitForSelector('#innerp');
  const r = await page.evaluate(() => ({
    attrs: document.getElementById('inner').getAttributeNames().filter((n) => !n.startsWith('data-')),
    onclick: document.getElementById('innerp').hasAttribute('onclick'),
    ran: /** @type {any} */ (window).__ran ?? 0,
  }));
  expect(r.attrs).toEqual(['id', 'src']);
  expect(r.onclick).toBe(false);
  expect(r.ran).toBe(0);
});

// ── 4. Nesting: cycles and depth ──────────────────────────────────

test('include cycles (A→B→A and self) stop with the error state', async ({ page }) => {
  const hits = await load(page, '', {
    files: {
      '/__if/a.html': '<section id="a"><include-file src="/__if/b.html"></include-file></section>',
      '/__if/b.html': '<section id="b"><include-file id="back" src="/__if/a.html"></include-file></section>',
      '/__if/self.html': '<p id="selfp">self</p><include-file id="again" src="/__if/self.html"><p>fb</p></include-file>',
    },
  });
  const errs = [];
  await page.exposeFunction('__err', (m) => errs.push(m));
  await page.evaluate(() => document.addEventListener('include-file:error', (e) => /** @type {any} */ (window).__err(e.detail.error)));
  await include(page, { src: '/__if/a.html' });
  await page.waitForSelector('#back[data-error]');
  await include(page, { src: '/__if/self.html' });
  await page.waitForSelector('#again[data-error]');
  await page.waitForTimeout(300);
  expect(await page.locator('#a').count()).toBe(1);
  expect(await page.locator('#selfp').count()).toBe(1);
  expect(hits['/__if/a.html']).toBe(1);
  expect(hits['/__if/self.html']).toBe(1);
  expect(await page.locator('#again').textContent()).toContain('fb');
  expect(errs.length).toBe(2);
  expect(errs.every((m) => /cycle/.test(m))).toBe(true);
});

test('nesting deeper than 10 is refused', async ({ page }) => {
  const files = {};
  for (let i = 0; i < 14; i++) files[`/__if/d${i}.html`] = `<p class="lvl">${i}</p><include-file id="inc${i + 1}" src="/__if/d${i + 1}.html"></include-file>`;
  const hits = await load(page, '', { files });
  await include(page, { src: '/__if/d0.html' });
  await page.waitForSelector('include-file[data-error]');
  await page.waitForTimeout(300);
  expect(await page.locator('.lvl').count()).toBe(10);
  expect(hits['/__if/d10.html'] ?? 0).toBe(0);
});

// ── 5. Append / prepend isolation ─────────────────────────────────

test('append + allow-scripts runs each load once and never re-runs earlier scripts', async ({ page }) => {
  await load(page, `<include-file id="ap" mode="append" trusted allow-scripts>
      <script id="author">window.__author=(window.__author||0)+1</script><p>Existing</p>
    </include-file>`, {
    files: { '/__if/s.html': '<p class="chunk">c</p><script>window.__ran=(window.__ran||0)+1</script>' },
  });
  const loadOnce = () => page.evaluate(() => new Promise((res) => {
    const el = /** @type {any} */ (document.getElementById('ap'));
    el.addEventListener('include-file:loaded', res, { once: true });
    if (el.getAttribute('src')) el.reload(); else el.setAttribute('src', '/__if/s.html');
  }));
  await loadOnce();
  await loadOnce();
  const r = await page.evaluate(() => ({
    ran: /** @type {any} */ (window).__ran,
    author: /** @type {any} */ (window).__author,
    chunks: document.querySelectorAll('#ap .chunk').length,
    authorScript: !!document.getElementById('author'),
  }));
  expect(r).toEqual({ ran: 2, author: 1, chunks: 2, authorScript: true });
});

test('append without allow-scripts keeps the author\'s own scripts', async ({ page }) => {
  await load(page, `<include-file id="ap" mode="append"><script id="author">window.__a=1</script><p>Existing</p></include-file>`, {
    files: { '/__if/s.html': '<p class="chunk">c</p>' },
  });
  await page.evaluate(() => new Promise((res) => {
    const el = document.getElementById('ap');
    el.addEventListener('include-file:loaded', res, { once: true });
    el.setAttribute('src', '/__if/s.html');
  }));
  expect(await page.locator('#author').count()).toBe(1);
});

// ── 6. Lifecycle: single fetch, reconnect ─────────────────────────

test('a parsed include-file fetches exactly once on upgrade', async ({ page }) => {
  const failed = [];
  page.on('requestfailed', (r) => failed.push(r.url()));
  const hits = await load(page, '<include-file id="up" src="/__if/one.html"><p>fb</p></include-file>', {
    files: { '/__if/one.html': '<p id="one">one</p>' },
  });
  await page.waitForSelector('#one');
  await page.waitForTimeout(200);
  expect(hits['/__if/one.html']).toBe(1);
  expect(failed.filter((u) => u.includes('one.html'))).toEqual([]);
});

test('reconnect: same src does not re-fetch; a src changed while detached reloads', async ({ page }) => {
  const hits = await load(page, '<include-file id="rc" src="/__if/one.html"></include-file><p id="park"></p>', {
    files: { '/__if/one.html': '<p id="one">one</p>', '/__if/two.html': '<p id="two">two</p>' },
  });
  await page.waitForSelector('#one');
  await page.evaluate(() => { const el = document.getElementById('rc'); el.remove(); document.getElementById('park').after(el); });
  await page.waitForTimeout(200);
  expect(hits['/__if/one.html']).toBe(1);
  await page.evaluate(() => {
    const el = document.getElementById('rc');
    el.remove();
    el.setAttribute('src', '/__if/two.html');
    document.querySelector('main').append(el);
  });
  await page.waitForSelector('#rc #two');
  expect(hits['/__if/two.html']).toBe(1);
});

test('setting src on a connected element without src loads it once', async ({ page }) => {
  const hits = await load(page, '<include-file id="late"><p>fb</p></include-file>', {
    files: { '/__if/one.html': '<p id="one">one</p>' },
  });
  await page.evaluate(() => { /** @type {any} */ (document.getElementById('late')).src = '/__if/one.html'; });
  await page.waitForSelector('#late #one');
  await page.waitForTimeout(200);
  expect(hits['/__if/one.html']).toBe(1);
});

test('unknown mode behaves as replace and warns', async ({ page }) => {
  await load(page, '', { files: { '/__if/one.html': '<p id="one">one</p>' } });
  const warnings = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  const r = await page.evaluate(() => new Promise((res) => {
    const el = document.createElement('include-file');
    el.setAttribute('mode', 'bogus');
    el.innerHTML = '<p id="old">old</p>';
    el.addEventListener('include-file:loaded', () => res(el.innerHTML), { once: true });
    el.setAttribute('src', '/__if/one.html');
    document.querySelector('main').append(el);
  }));
  expect(r).toBe('<p id="one">one</p>');
  expect(warnings.some((w) => /unknown mode "bogus"/.test(w))).toBe(true);
});

// ── 7. Accessibility ──────────────────────────────────────────────

test('aria-busy is set while loading and cleared after', async ({ page }) => {
  await load(page, '', { files: { '/__if/slow.html': { body: '<p id="slow">s</p>', delay: 600 } } });
  await page.evaluate(() => {
    const el = document.createElement('include-file');
    el.id = 'busy';
    el.setAttribute('src', '/__if/slow.html');
    document.querySelector('main').append(el);
  });
  await expect(page.locator('#busy')).toHaveAttribute('aria-busy', 'true');
  await page.waitForSelector('#slow');
  await expect(page.locator('#busy')).not.toHaveAttribute('aria-busy', /.*/);
});

test('error renders a role=alert element (data-label-error override), not with fallback', async ({ page }) => {
  await load(page, '');
  const plain = await include(page, { src: '/__if/missing.html' });
  expect(plain.type).toBe('error');
  expect(plain.alert).toBe('Failed to load content');
  const labelled = await include(page, { src: '/__if/missing.html', 'data-label-error': 'Could not load the partial' });
  expect(labelled.alert).toBe('Could not load the partial');
  const withFallback = await page.evaluate(() => new Promise((res) => {
    const el = document.createElement('include-file');
    el.innerHTML = '<p>Fallback</p>';
    el.addEventListener('include-file:error', () => res({ alert: !!el.querySelector('[role="alert"]'), text: el.textContent.trim() }), { once: true });
    el.setAttribute('src', '/__if/missing.html');
    document.querySelector('main').append(el);
  }));
  expect(withFallback).toEqual({ alert: false, text: 'Fallback' });
});

test('the error element is removed when a later load succeeds', async ({ page }) => {
  await load(page, '', { files: { '/__if/one.html': '<p id="one">one</p>' } });
  await include(page, { src: '/__if/missing.html', id: 'retry' });
  await page.evaluate(() => new Promise((res) => {
    const el = document.getElementById('retry');
    el.addEventListener('include-file:loaded', res, { once: true });
    el.setAttribute('src', '/__if/one.html');
  }));
  expect(await page.locator('#retry [role="alert"]').count()).toBe(0);
  expect(await page.locator('#retry').getAttribute('data-error')).toBeNull();
});

// ── 8. sanitizeHTML / sanitizeSVG in a real DOM ──────────────────

test('sanitizeHTML denylist (real DOM)', async ({ page }) => {
  await load(page, '');
  const out = await page.evaluate(() => {
    const { sanitizeHTML } = /** @type {any} */ (window).__s;
    const t = (h) => sanitizeHTML(h);
    return {
      tabJs: t('<a href="java\tscript:alert(1)">x</a>'),
      entJs: t('<a href="&#106;avascript:alert(1)">x</a>'),
      upperJs: t('<a href=" JAVASCRIPT:alert(1)">x</a>'),
      vb: t('<a href="vbscript:msgbox">x</a>'),
      dataHref: t('<a href="data:text/html,<script>alert(1)</script>">x</a>'),
      dataImg: t('<img src="data:image/png;base64,AAAA">'),
      dataSvgHref: t('<svg><use href="data:image/svg+xml,<svg/>"></use></svg>'),
      action: t('<button formaction="javascript:alert(1)">b</button>'),
      srcdoc: t('<p srcdoc="x">p</p>'),
      styleAttr: t('<p style="background:url(javascript:alert(1))">p</p><p style="color: red">q</p>'),
      styleExpr: t('<p style="width: expr/**/ession(alert(1))">p</p>'),
      styleEl: t('<style>@import url(https://evil.example/x.css)</style><style>p{color:red}</style>'),
      meta: t('<meta http-equiv="refresh" content="0;url=javascript:alert(1)"><base href="https://evil.example/">'),
      embeds: t('<object data="x"></object><embed src="x"><frame><portal src="x"></portal>'),
      template: t('<template><img src=x onerror="alert(1)"><script>alert(2)</script></template>'),
      animate: t('<svg><a><animate attributeName="href" values="javascript:alert(1)"/><set attributeName="xlink:href" to="javascript:alert(1)"/><text>x</text></a></svg>'),
      md: t('<markdown-viewer src="/x.md" sanitize="off" ping="/p" theme="a"></markdown-viewer>'),
      inc: t('<include-file src="/x.html" trusted allow-scripts allow-cross-origin mode="append"><p>fb</p></include-file>'),
      incAllowed: sanitizeHTML('<include-file src="/x.html" trusted></include-file>', { allowIncludeFile: true }),
      safe: t('<p class="c"><a href="/ok" title="t">ok</a> <img src="/i.png" alt="i"></p>'),
    };
  });
  expect(out.tabJs).toBe('<a>x</a>');
  expect(out.entJs).toBe('<a>x</a>');
  expect(out.upperJs).toBe('<a>x</a>');
  expect(out.vb).toBe('<a>x</a>');
  expect(out.dataHref).toBe('<a>x</a>');
  expect(out.dataImg).toBe('<img src="data:image/png;base64,AAAA">');
  expect(out.dataSvgHref).toBe('<svg><use></use></svg>');
  expect(out.action).toBe('<button>b</button>');
  expect(out.srcdoc).toBe('<p>p</p>');
  expect(out.styleAttr).toBe('<p>p</p><p style="color: red">q</p>');
  expect(out.styleExpr).toBe('<p>p</p>');
  expect(out.styleEl).toBe('<style>p{color:red}</style>');
  expect(out.meta).toBe('');
  expect(out.embeds).toBe('');
  expect(out.template).toBe('<template><img src="x"></template>');
  expect(out.animate).toBe('<svg><a><text>x</text></a></svg>');
  expect(out.md).toBe('<markdown-viewer theme="a"></markdown-viewer>');
  expect(out.inc).toBe('<include-file mode="append"><p>fb</p></include-file>');
  expect(out.incAllowed).toBe('<include-file src="/x.html"></include-file>');
  expect(out.safe).toBe('<p class="c"><a href="/ok" title="t">ok</a> <img src="/i.png" alt="i"></p>');
});

test('sanitizeSVG mutates an SVG element in place (real DOM)', async ({ page }) => {
  await load(page, '');
  const r = await page.evaluate(() => {
    const { sanitizeSVG } = /** @type {any} */ (window).__s;
    const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" onload="alert(0)" viewBox="0 0 24 24">
      <script>alert(1)</script>
      <foreignObject><iframe src="https://evil.example"></iframe></foreignObject>
      <a href="javascript:alert(2)"><path d="M0 0h24" onclick="alert(3)" fill="currentColor"/></a>
      <a xlink:href="javascript:alert(4)"><circle r="2"/></a>
      <set attributeName="href" to="javascript:alert(5)"/>
      <style>@import url(https://evil.example/x.css)</style>
      <use href="#ok"/>
    </svg>`, 'image/svg+xml');
    const svg = doc.documentElement;
    const ret = sanitizeSVG(svg);
    return {
      same: ret === svg,
      rootAttrs: svg.getAttributeNames().sort(),
      scripts: svg.getElementsByTagName('script').length,
      fo: svg.getElementsByTagName('foreignObject').length,
      iframes: svg.getElementsByTagName('iframe').length,
      sets: svg.getElementsByTagName('set').length,
      styles: svg.getElementsByTagName('style').length,
      anchors: [...svg.getElementsByTagName('a')].map((a) => a.getAttributeNames()),
      pathAttrs: svg.querySelector('path').getAttributeNames().sort(),
      use: svg.querySelector('use').getAttribute('href'),
    };
  });
  expect(r).toEqual({
    same: true,
    rootAttrs: ['viewBox', 'xmlns', 'xmlns:xlink'],
    scripts: 0, fo: 0, iframes: 0, sets: 0, styles: 0,
    anchors: [[], []],
    pathAttrs: ['d', 'fill'],
    use: '#ok',
  });
});
