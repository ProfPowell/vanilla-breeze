/**
 * social-embed — S-review security + behaviour fixes.
 *
 * Covers: parsed markup upgrades with providers registered (define after
 * registry); validated, sandboxed provider iframes rebuilt from the URL;
 * URL injection / host spoofing rejected; real <button> facade with focus
 * moved to the embed; frame resize protocols (origin + source checked);
 * Bluesky handle resolution; YouTube via youtube-player; error + retry;
 * reconnect after load; theme re-render only for themeable providers; late
 * provider registration; data-label-* overrides; retryable loadScript.
 *
 * Tests the working tree (/src from disk). Every third-party host is routed
 * to tests/fixtures/social-embed/frame.html or a JSON stub — no live network.
 */
import { test, expect } from 'playwright/test';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', '..');
const FRAME = join(REPO, 'tests/fixtures/social-embed/frame.html');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

const BSKY_DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';

/**
 * @param {import('playwright/test').Page} page
 * @param {string} body
 * @param {{ entry?: string, resolve?: number }} [opts]
 */
async function load(page, body, { entry = '/src/web-components/social-embed/logic.js', resolve = 200 } = {}) {
  const hits = /** @type {string[]} */ ([]);
  // Catch-all first: later routes win, so stubs below take precedence.
  await page.route(/^https:\/\//, (route) => { hits.push(route.request().url()); return route.abort(); });
  for (const host of ['platform.twitter.com', 'www.instagram.com', 'embed.bsky.app', 'mastodon.social', 'fosstodon.org']) {
    await page.route(`https://${host}/**`, (route) => {
      hits.push(route.request().url());
      return route.fulfill({ path: FRAME, contentType: 'text/html; charset=utf-8' });
    });
  }
  await page.route('https://public.api.bsky.app/**', (route) => {
    hits.push(route.request().url());
    return resolve === 200
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ did: BSKY_DID }) })
      : route.fulfill({ status: resolve, body: 'nope' });
  });
  await page.route('https://i.ytimg.com/**', (route) => { hits.push(route.request().url()); return route.fulfill({ body: PNG, contentType: 'image/png' }); });
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  const url = `/__s-social-embed-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css">
      </head><body><main>${body}</main>
      <script type="module" src="${entry}"></script></body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => customElements.get('social-embed'));
  return hits;
}

const embed = (url, attrs = '', text = 'View post') =>
  `<social-embed url="${url}" ${attrs}><a href="${url.replace(/"/g, '&quot;')}">${text}</a></social-embed>`;

const X_URL = 'https://x.com/jack/status/20';
const IG_URL = 'https://www.instagram.com/p/CwLZ9SYrUpG/';
const BSKY_DID_URL = `https://bsky.app/profile/${BSKY_DID}/post/3l6oveex3ii2l`;
const BSKY_HANDLE_URL = 'https://bsky.app/profile/bsky.app/post/3l6oveex3ii2l';
const MASTO_URL = 'https://mastodon.social/@Mastodon/116765910384325070';
const YT_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s';

test('parsed markup upgrades with providers registered (raw /src/main.js graph)', async ({ page }) => {
  // The full dev graph is a few hundred modules served from disk by route().
  test.setTimeout(180_000);
  await load(page, embed(X_URL) + embed(BSKY_DID_URL) + embed(MASTO_URL) + embed(IG_URL), { entry: '/src/main.js' });
  const states = await page.$$eval('social-embed', (els) => els.map((e) => e.getAttribute('state')));
  expect(states).toEqual(['idle', 'idle', 'idle', 'idle']);
});

test('idle facade is a real button beside the fallback link (no host role)', async ({ page }) => {
  const hits = await load(page, embed(BSKY_DID_URL, 'id="e"', 'View post on Bluesky'));
  const el = page.locator('#e');
  await expect(el).toHaveAttribute('state', 'idle');
  for (const a of ['role', 'tabindex', 'aria-label']) await expect(el).not.toHaveAttribute(a, /.*/);
  await expect(el.getByRole('link', { name: 'View post on Bluesky' })).toBeVisible();
  const btn = el.getByRole('button', { name: 'Load Bluesky post' });
  await expect(btn).toBeVisible();
  await expect(el.locator('[data-embed-note]')).toHaveText('Loads content from embed.bsky.app');
  // Link and button are siblings, not nested
  expect(await el.locator('button a, a button').count()).toBe(0);
  expect(hits).toEqual([]);
});

const CASES = [
  {
    name: 'X', url: X_URL, height: '222',
    src: 'https://platform.twitter.com/embed/Tweet.html?id=20&theme=light&dnt=true',
    sandbox: 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox',
  },
  {
    name: 'Instagram', url: IG_URL, height: '333',
    src: 'https://www.instagram.com/p/CwLZ9SYrUpG/embed/',
    sandbox: 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox',
  },
  {
    name: 'Bluesky', url: BSKY_DID_URL, height: '444',
    src: new RegExp(`^https://embed\\.bsky\\.app/embed/${BSKY_DID}/app\\.bsky\\.feed\\.post/3l6oveex3ii2l\\?id=\\d+&colorMode=light$`),
    sandbox: 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox',
  },
  {
    name: 'Mastodon', url: MASTO_URL, height: '555',
    src: 'https://mastodon.social/@Mastodon/116765910384325070/embed',
    sandbox: 'allow-scripts allow-same-origin allow-popups',
  },
];

for (const c of CASES) {
  test(`${c.name}: click builds a validated sandboxed iframe, resizes, focuses it`, async ({ page }) => {
    await load(page, embed(c.url, 'id="e" theme="light"'));
    const el = page.locator('#e');
    await el.getByRole('button', { name: `Load ${c.name} post` }).click();
    await expect(el).toHaveAttribute('state', 'loaded');
    const frame = el.locator('iframe');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('src', c.src);
    await expect(frame).toHaveAttribute('sandbox', c.sandbox);
    await expect(frame).toHaveAttribute('referrerpolicy', 'strict-origin');
    await expect(frame).toHaveAttribute('loading', 'lazy');
    await expect(frame).toHaveAttribute('title', `${c.name} post`);
    await expect(frame).toHaveAttribute('height', c.height);
    expect(await frame.evaluate((f) => document.activeElement === f)).toBe(true);
    // Fallback + facade are gone; no host-level button semantics remain
    await expect(el.locator('[data-embed-facade], a')).toHaveCount(0);
  });
}

test('Bluesky handle URLs resolve to a DID via the public API; DID URLs make no lookup', async ({ page }) => {
  const hits = await load(page, embed(BSKY_HANDLE_URL, 'id="h"') + embed(BSKY_DID_URL, 'id="d"'));
  await page.locator('#d button').click();
  await expect(page.locator('#d')).toHaveAttribute('state', 'loaded');
  expect(hits.filter((h) => h.includes('public.api.bsky.app'))).toEqual([]);
  await page.locator('#h button').click();
  await expect(page.locator('#h')).toHaveAttribute('state', 'loaded');
  expect(hits.filter((h) => h.includes('public.api.bsky.app'))).toEqual([
    'https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=bsky.app',
  ]);
  await expect(page.locator('#h iframe')).toHaveAttribute('src', new RegExp(`^https://embed\\.bsky\\.app/embed/${BSKY_DID}/`));
});

test('crafted and spoofed URLs are unsupported and never reach the DOM as markup', async ({ page }) => {
  const bad = [
    'https://x.com/a/status/1"><img src=x onerror="window.__pwned=1">',
    'javascript:alert(1)//x.com/a/status/1',
    'http://x.com/a/status/1',
    'https://x.com.evil.example/a/status/1',
    'https://evil.example/x.com/a/status/1',
    'https://user:pw@x.com/a/status/1',
    'https://www.instagram.com/p/abc"><svg onload=alert(1)>/',
    'https://instagram.com.evil.example/p/CwLZ9SYrUpG/',
    'http://mastodon.social/@Mastodon/1',
    'https://mastodon.social/@Mastodon/1/../../evil',
    'https://bsky.app/profile/bad handle/post/3l6oveex3ii2l',
    'https://www.youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=short',
  ];
  await page.addInitScript(() => { window.__pwned = 0; });
  await load(page, bad.map((u, i) => `<social-embed id="b${i}" url="${u.replace(/"/g, '&quot;')}"><a href="https://example.com/">fallback</a></social-embed>`).join(''));
  for (let i = 0; i < bad.length; i++) {
    await expect(page.locator(`#b${i}`), bad[i]).toHaveAttribute('state', 'unsupported');
  }
  expect(await page.locator('main img, main svg, main iframe').count()).toBe(0);
  expect(await page.evaluate(() => window.__pwned)).toBe(0);
});

test('explicit provider must still accept the URL', async ({ page }) => {
  await load(page, embed('https://evil.example/@a/1', 'id="e" provider="x"'));
  await expect(page.locator('#e')).toHaveAttribute('state', 'unsupported');
});

test('YouTube renders youtube-player with video-id, title and start (thumbnail stubbed)', async ({ page }) => {
  const hits = await load(page, embed(YT_URL, 'id="y" data-title="Never &quot;Gonna&quot; Give You Up"'));
  const el = page.locator('#y');
  await expect(el).toHaveAttribute('state', 'loaded');
  const yt = el.locator('youtube-player');
  await expect(yt).toHaveAttribute('video-id', 'dQw4w9WgXcQ');
  await expect(yt).toHaveAttribute('title', 'Never Gonna Give You Up');
  await expect(yt).toHaveAttribute('start', '90');
  await expect(yt).toHaveAttribute('data-upgraded', '');
  await expect(el.locator('[data-embed-facade]')).toHaveCount(0);
  expect(hits.some((h) => h.startsWith('https://i.ytimg.com/vi/dQw4w9WgXcQ/'))).toBe(true);
});

test('error restores the fallback, keeps a retry button with focus, and retry succeeds', async ({ page }) => {
  await load(page, embed(BSKY_HANDLE_URL, 'id="e"', 'View post on Bluesky'), { resolve: 500 });
  const el = page.locator('#e');
  await el.getByRole('button', { name: 'Load Bluesky post' }).click();
  await expect(el).toHaveAttribute('state', 'error');
  await expect(el.getByRole('link', { name: 'View post on Bluesky' })).toBeVisible();
  await expect(el.locator('[data-embed-note]')).toHaveText('Bluesky post failed to load.');
  await expect(el.locator('[data-embed-live]')).toHaveText('Bluesky post failed to load.');
  const btn = el.getByRole('button', { name: 'Load Bluesky post' });
  expect(await btn.evaluate((b) => document.activeElement === b)).toBe(true);
  await expect(el.locator('[data-embed-facade]')).toHaveCount(1);

  await page.unroute('https://public.api.bsky.app/**');
  await page.route('https://public.api.bsky.app/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ did: BSKY_DID }) }));
  await btn.click();
  await expect(el).toHaveAttribute('state', 'loaded');
  await expect(el.locator('iframe')).toHaveCount(1);
});

test('frame resize messages are checked for source and origin', async ({ page }) => {
  await load(page, embed(X_URL, 'id="e"'));
  await page.locator('#e button').click();
  const frame = page.locator('#e iframe');
  await expect(frame).toHaveAttribute('height', '222');
  // Same payload from the page itself (wrong source + origin) is ignored
  await page.evaluate(() => window.postMessage(JSON.stringify({ 'twttr.embed': { method: 'twttr.private.resize', params: [{ height: 9 }] } }), '*'));
  await page.waitForTimeout(100);
  await expect(frame).toHaveAttribute('height', '222');
});

test('reconnect after load keeps the embed (no facade, no refetch)', async ({ page }) => {
  await load(page, embed(MASTO_URL, 'id="e"'));
  await page.locator('#e button').click();
  await expect(page.locator('#e')).toHaveAttribute('state', 'loaded');
  const result = await page.evaluate(() => {
    const el = document.getElementById('e');
    const frame = el.querySelector('iframe');
    const parent = el.parentElement;
    el.remove();
    parent.append(el);
    return {
      state: el.getAttribute('state'),
      sameFrame: el.querySelector('iframe') === frame,
      facades: el.querySelectorAll('[data-embed-facade]').length,
      upgraded: el.hasAttribute('data-upgraded'),
    };
  });
  expect(result).toEqual({ state: 'loaded', sameFrame: true, facades: 0, upgraded: true });
  // Resize listener re-wired after reconnect (the frame reloads and re-measures)
  await expect(page.locator('#e iframe')).toHaveAttribute('height', '555');
});

test('reconnect while idle keeps exactly one facade', async ({ page }) => {
  await load(page, embed(X_URL, 'id="e"'));
  const counts = await page.evaluate(() => {
    const el = document.getElementById('e');
    for (let i = 0; i < 3; i++) { el.remove(); document.querySelector('main').append(el); }
    return { facades: el.querySelectorAll('[data-embed-facade]').length, links: el.querySelectorAll('a').length };
  });
  expect(counts).toEqual({ facades: 1, links: 1 });
  await expect(page.locator('#e')).toHaveAttribute('state', 'idle');
});

test('theme change re-renders themeable providers only', async ({ page }) => {
  await load(page, embed(X_URL, 'id="x"') + embed(IG_URL, 'id="i"'));
  await page.locator('#x button').click();
  await page.locator('#i button').click();
  await expect(page.locator('#x')).toHaveAttribute('state', 'loaded');
  await expect(page.locator('#i')).toHaveAttribute('state', 'loaded');
  await page.evaluate(() => {
    window.__frames = [...document.querySelectorAll('iframe')];
    document.documentElement.style.colorScheme = 'dark';
    window.dispatchEvent(new CustomEvent('vb:theme-change'));
  });
  await expect(page.locator('#x iframe')).toHaveAttribute('src', /theme=dark/);
  const same = await page.evaluate(() => ({
    x: document.querySelector('#x iframe') === window.__frames[0],
    i: document.querySelector('#i iframe') === window.__frames[1],
  }));
  expect(same).toEqual({ x: false, i: true });
});

test('activate="eager" loads without a click; data-label-* override strings', async ({ page }) => {
  await load(page,
    embed(X_URL, 'id="eager" activate="eager"')
    + embed(BSKY_DID_URL, 'id="l" data-label-load="Beitrag von {provider} laden" data-label-note="Lädt Inhalte von {host}"'));
  await expect(page.locator('#eager')).toHaveAttribute('state', 'loaded');
  // Eager load must not steal focus
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  await expect(page.locator('#l button')).toHaveText('Beitrag von Bluesky laden');
  await expect(page.locator('#l [data-embed-note]')).toHaveText('Lädt Inhalte von embed.bsky.app');
});

test('a provider registered late re-initialises unsupported instances', async ({ page }) => {
  await load(page, embed('https://video.example/v/42', 'id="e"'));
  await expect(page.locator('#e')).toHaveAttribute('state', 'unsupported');
  await page.evaluate(async () => {
    const { SocialEmbed } = await import('/src/web-components/social-embed/logic.js');
    SocialEmbed.register('example', {
      label: 'Example',
      canHandle: (u) => u.startsWith('https://video.example/'),
      render: async () => { const p = document.createElement('p'); p.textContent = 'rendered'; return p; },
    });
  });
  await expect(page.locator('#e')).toHaveAttribute('state', 'idle');
  await page.getByRole('button', { name: 'Load Example post' }).click();
  await expect(page.locator('#e')).toHaveAttribute('state', 'loaded');
  await expect(page.locator('#e p')).toHaveText('rendered');
});

test('loadScript evicts a failed load so it can be retried', async ({ page }) => {
  await load(page, '');
  let calls = 0;
  await page.route('**/__s1-sdk.js', (route) => (++calls === 1
    ? route.fulfill({ status: 404, body: '' })
    : route.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.__sdk = true;' })));
  const result = await page.evaluate(async () => {
    const { loadScript } = await import('/src/web-components/social-embed/logic.js');
    const first = await loadScript('/__s1-sdk.js').then(() => 'ok', () => 'failed');
    const second = await loadScript('/__s1-sdk.js').then(() => 'ok', () => 'failed');
    return { first, second, sdk: window.__sdk === true };
  });
  expect(result).toEqual({ first: 'failed', second: 'ok', sdk: true });
});
