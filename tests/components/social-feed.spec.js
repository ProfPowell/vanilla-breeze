/**
 * <social-feed> — browser refresh, load-more, failures, the scroll region and
 * the no-JS fallback.
 *
 * Tests the WORKING TREE: /src/** is served from disk. The block markup is
 * what Cook writes at build (entries, more line, state JSON), made here from
 * the copied core and the Cook fixtures in tests/unit/fixtures/social-feed.
 * Service APIs are answered by page.route from the same fixtures; nothing
 * reaches the network.
 */
import { test, expect } from 'playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  normalizeBluesky, normalizeMastodon, normalizeGithubEvents, renderFeedParts, mergeItems,
} from '../../src/web-components/social-feed/core.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FX = join(REPO, 'tests', 'unit', 'fixtures', 'social-feed');
const fixture = (name) => JSON.parse(readFileSync(join(FX, name), 'utf8'));

const ALICE = { key: 'bluesky:alice.example.com', service: 'bluesky', handle: 'alice.example.com', did: 'did:plc:alice0000000000000000000', profileUrl: 'https://bsky.app/profile/alice.example.com' };
const BOB = { key: 'mastodon:@bob@social.example', service: 'mastodon', handle: '@bob@social.example', profileUrl: 'https://social.example/@bob' };
const CAROL = { key: 'github:carol-dev', service: 'github', handle: 'carol-dev', profileUrl: 'https://github.com/carol-dev' };
const SERVICES = { bluesky: { name: 'Bluesky' }, mastodon: { name: 'Mastodon' }, github: { name: 'GitHub' } };
const HOST_URI = 'at://did:plc:alice0000000000000000000/app.bsky.feed.post/3lhost1aaaaa2';

const aliceItems = () => normalizeBluesky(fixture('bluesky-page.json'), ALICE).items;
const bobItems = () => normalizeMastodon(fixture('mastodon-statuses.json'), BOB).items;
const carolItems = () => normalizeGithubEvents(fixture('github-events.json'), CAROL);

/**
 * The inner HTML Cook writes for one block (mirrors Cook's renderSocialFeed).
 * @param {{ accounts: object[], lists: object[][], items?: number, cursors?: Record<string, string> }} o
 */
function built({ accounts, lists, items = 12, cursors = {}, done = {} }) {
  const merged = mergeItems(lists);
  const shown = merged.slice(0, items);
  const newest = {};
  for (const i of merged) if (!(i.source in newest)) newest[i.source] = i.date;
  const state = {
    accounts: accounts.map(({ key, service, handle, did }) => ({
      key, service, handle, ...(did ? { did } : {}),
      ...(cursors[key] ? { cursor: cursors[key] } : {}), done: !!done[key],
    })),
    tags: [],
    newest,
    buffer: merged.slice(items),
  };
  const { entries, empty, more } = renderFeedParts({ items: shown, accounts, services: SERVICES });
  return [
    `<activity-feed aria-label="Recent posts"${entries ? ' data-infinite' : ''}>`, entries, '</activity-feed>',
    empty, more,
    `<script type="application/json" class="social-feed-state">${JSON.stringify(state).replace(/</g, '\\u003c')}</script>`,
  ].filter(Boolean).join('\n');
}

const json = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*' },
  body: JSON.stringify(body),
});

/**
 * Serve /src from disk, answer the service APIs with `api(url)`, and load a
 * page holding one <social-feed>. Returns the list of service URLs requested.
 */
async function load(page, { attrs = '', height = '32rem', inner, api, js = true }) {
  const requests = [];
  await page.route('**/src/**', (route) => route.fulfill({
    path: join(REPO, decodeURIComponent(new URL(route.request().url()).pathname)),
  }));
  for (const host of ['https://public.api.bsky.app/**', 'https://social.example/**', 'https://api.github.com/**']) {
    await page.route(host, (route) => {
      const url = route.request().url();
      requests.push(url);
      return route.fulfill(api(url));
    });
  }
  const url = `/__social-feed-${Math.random().toString(36).slice(2)}.html`;
  await page.route(`**${url}`, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8">
      <link rel="stylesheet" href="/src/main.css"></head><body>
      <main><h1>Elsewhere</h1>
      <social-feed ${attrs} style="--social-feed-height: ${height}">
      ${inner}
      </social-feed>
      <p id="below">Below the feed</p></main>
      ${js ? `<script type="module">
        await import('/src/web-components/social-feed/logic.js');
        window.__ready = true;
      </script>` : ''}</body></html>`,
  }));
  await page.goto(url, { waitUntil: 'load' });
  if (js) {
    await page.waitForFunction(() => window.__ready === true);
    await expect(page.locator('social-feed')).toHaveAttribute('data-upgraded', '');
  }
  return requests;
}

/** The ids Cook shows first, in order. */
const shownIds = (lists, n = 12) => mergeItems(lists).slice(0, n).map((i) => i.id);
const ids = (page) => page.locator('social-feed article[data-activity]').evaluateAll(
  (els) => els.map((e) => e.getAttribute('data-id')));
const refreshed = (page) => page.evaluate(() => document.querySelector('social-feed').refreshed);

/** A Bluesky feed entry derived from the fixture's first (original) post. */
function bskyPost(rkey, createdAt, text) {
  const base = structuredClone(fixture('bluesky-page.json').feed[0]);
  base.post.uri = `at://did:plc:alice0000000000000000000/app.bsky.feed.post/${rkey}`;
  base.post.record.createdAt = createdAt;
  base.post.record.text = text;
  return base;
}

test.describe('social-feed', () => {
  test('refresh prepends a newer post and updates counts; nothing duplicated', async ({ page }) => {
    const inner = built({ accounts: [ALICE], lists: [aliceItems()], cursors: { [ALICE.key]: 'C1' } });
    const firstPage = fixture('bluesky-page.json');
    firstPage.feed[0].post.likeCount = 99;
    firstPage.feed.unshift(bskyPost('3lnew1zzzz2', '2026-11-16T07:00:00.000Z', 'Fresh post'));
    const requests = await load(page, { inner, api: (u) => json(u.includes('cursor=') ? { feed: [] } : firstPage) });

    const before = shownIds([aliceItems()]);
    expect(before).toHaveLength(5);
    await refreshed(page);

    const after = await ids(page);
    expect(after).toHaveLength(6);
    expect(new Set(after).size).toBe(6);
    expect(after[0]).toBe('bluesky:at://did:plc:alice0000000000000000000/app.bsky.feed.post/3lnew1zzzz2');
    expect(after.slice(1)).toEqual(before);
    const host = page.locator(`article[data-id="bluesky:${HOST_URI}"] .social-feed-counts li`).nth(2);
    await expect(host).toContainText('99');
    await expect(page.locator('article[data-id$="3lnew1zzzz2"] .social-feed-text')).toHaveText('Fresh post');
    // One first-page read per page view (the list is short, so load-more may
    // also page on from the build cursor).
    expect(requests.filter((u) => u.includes('getAuthorFeed') && !u.includes('cursor='))).toHaveLength(1);
    expect(requests[0]).not.toContain('cursor=');
  });

  test('refresh with a repost of a shown post adds no duplicate', async ({ page }) => {
    const inner = built({ accounts: [ALICE, BOB], lists: [aliceItems(), bobItems()], cursors: { [ALICE.key]: 'C1', [BOB.key]: '113500000000000003' } });
    const firstPage = fixture('bluesky-page.json');
    const repost = structuredClone(firstPage.feed[1]); // the fixture's repost entry
    repost.post = structuredClone(firstPage.feed[0].post); // ...now of alice's own shown post
    repost.reason.indexedAt = '2026-11-16T08:00:00.000Z';
    firstPage.feed.unshift(repost);
    const statuses = fixture('mastodon-statuses.json');
    const boost = structuredClone(statuses[2]); // a boost...
    boost.id = '113600000000000001';
    boost.created_at = '2026-11-16T09:00:00.000Z';
    boost.reblog = structuredClone(statuses[0]); // ...of bob's own shown toot
    statuses.unshift(boost);
    await load(page, {
      inner,
      api: (u) => {
        if (u.includes('/accounts/lookup')) return json(fixture('mastodon-lookup.json'));
        if (u.includes('cursor=') || u.includes('max_id=')) return json(u.includes('bsky') ? { feed: [] } : []);
        return json(u.includes('bsky') ? firstPage : statuses);
      },
    });
    const before = shownIds([aliceItems(), bobItems()]);
    await refreshed(page);
    const after = await ids(page);
    expect(after).toEqual(before);
    expect(new Set(after).size).toBe(after.length);
  });

  test('load-more drains buffer before the network, then pages with cursor; removes data-infinite when done', async ({ page }) => {
    const inner = built({ accounts: [ALICE], lists: [aliceItems()], items: 2, cursors: { [ALICE.key]: 'C1' } });
    const older = { feed: [bskyPost('3lold1yyyy2', '2026-11-01T10:00:00.000Z', 'An older post')] };
    const requests = await load(page, {
      attrs: 'items="2"',
      height: '5rem',
      inner,
      api: (u) => json(u.includes('cursor=C1') ? older : fixture('bluesky-page.json')),
    });
    await refreshed(page);
    const feed = page.locator('social-feed activity-feed');
    await expect(feed).toHaveAttribute('data-infinite', '');
    expect(await ids(page)).toHaveLength(2);

    const scrollDown = () => feed.evaluate((f) => { f.scrollTop = f.scrollHeight; });
    await scrollDown();
    await expect(page.locator('social-feed article[data-activity]')).toHaveCount(4);
    await expect(feed).toHaveAttribute('aria-busy', 'false');
    expect(requests.some((u) => u.includes('cursor='))).toBe(false);
    await expect(feed).toHaveAttribute('data-infinite', '');

    await scrollDown();
    await expect(page.locator('social-feed article[data-activity]')).toHaveCount(6);
    expect(requests.filter((u) => u.includes('cursor=C1'))).toHaveLength(1);
    await expect(feed).not.toHaveAttribute('data-infinite');

    const list = await ids(page);
    expect(new Set(list).size).toBe(6);
    expect(list.at(-1)).toMatch(/3lold1yyyy2$/);
    const dates = await page.locator('social-feed article time').evaluateAll((ts) => ts.map((t) => t.getAttribute('datetime')));
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  test('a service returning 403/500 shows no error and the shown items stay', async ({ page }) => {
    const inner = built({
      accounts: [ALICE, BOB, CAROL], lists: [aliceItems(), bobItems(), carolItems()],
      cursors: { [ALICE.key]: 'C1', [BOB.key]: '113500000000000003' },
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await load(page, {
      inner,
      api: (u) => (u.includes('bsky') ? json({ error: 'Internal' }, 500)
        : u.includes('github') ? json({ message: 'rate limited' }, 403)
          : { status: 500, contentType: 'text/plain', headers: { 'access-control-allow-origin': '*' }, body: 'not json' }),
    });
    const before = shownIds([aliceItems(), bobItems(), carolItems()]);
    expect(before).toHaveLength(8);
    await refreshed(page);
    expect(await ids(page)).toEqual(before);
    await expect(page.locator('social-feed .social-feed-empty')).toHaveCount(0);
    await expect(page.locator('social-feed')).not.toContainText(/HTTP \d|Request failed|Bad JSON|Unexpected response|Timed out/);
    // Every account failed, so it is done and the buffer is empty: no more loading.
    await expect(page.locator('social-feed activity-feed')).not.toHaveAttribute('data-infinite');
    expect(errors).toEqual([]);
  });

  test('the list scrolls inside the block at the set height; the region is focusable and labelled "Recent posts"', async ({ page }) => {
    const inner = built({ accounts: [ALICE, BOB, CAROL], lists: [aliceItems(), bobItems(), carolItems()], done: { [ALICE.key]: true, [BOB.key]: true, [CAROL.key]: true } });
    await load(page, { attrs: 'height="12rem"', height: '12rem', inner, api: () => json({}, 404) });
    const feed = page.locator('social-feed activity-feed');
    const box = await feed.evaluate((f) => {
      const cs = getComputedStyle(f);
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      return { max: parseFloat(cs.maxHeight) / rem, overflowY: cs.overflowY, overscroll: cs.overscrollBehaviorY, client: f.clientHeight, scroll: f.scrollHeight };
    });
    expect(box.max).toBe(12);
    expect(box.overflowY).toBe('auto');
    expect(box.overscroll).toBe('contain');
    expect(box.scroll).toBeGreaterThan(box.client);
    // Cards keep their height and scroll; they never shrink into each other.
    const overlaps = await feed.evaluate((f) => [...f.querySelectorAll(':scope > article')]
      .filter((a) => a.scrollHeight > a.clientHeight + 1).length);
    expect(overlaps).toBe(0);

    const pageY = await page.evaluate(() => window.scrollY);
    await feed.evaluate((f) => { f.scrollTop = 200; });
    expect(await feed.evaluate((f) => f.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(pageY);

    await expect(feed).toHaveAttribute('aria-label', 'Recent posts');
    await expect(feed).toHaveAttribute('tabindex', '0');
    await feed.focus();
    await expect(feed).toBeFocused();
    await expect(page.getByRole('feed', { name: 'Recent posts' })).toBeVisible();
  });

  test('no JavaScript (javaScriptEnabled: false): built entries and more line visible', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const inner = built({ accounts: [ALICE, BOB, CAROL], lists: [aliceItems(), bobItems(), carolItems()] });
    const requests = await load(page, { inner, api: () => json({}), js: false });
    await expect(page.locator('social-feed article[data-activity]')).toHaveCount(8);
    await expect(page.locator('social-feed article[data-activity]').first()).toBeVisible();
    await expect(page.locator('social-feed .social-feed-more')).toBeVisible();
    await expect(page.locator('social-feed .social-feed-more a')).toHaveText(['Bluesky', 'Mastodon', 'GitHub']);
    await expect(page.locator('social-feed .social-feed-state')).toBeHidden();
    expect(requests).toEqual([]);
    await context.close();
  });
});
