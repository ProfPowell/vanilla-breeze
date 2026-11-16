/**
 * Unit tests for the social-feed element files: parity of the copied Cook
 * core (normalizers and entry markup) against Cook's fixtures, and the
 * element's file contract.
 *
 * Run with: node --test tests/unit/social-feed.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  normalizeBluesky, normalizeMastodon, normalizeGithubReleases, renderEntry,
} from '../../src/web-components/social-feed/core.js';
import { fetchAccountPage } from '../../src/web-components/social-feed/fetch.js';

const dir = new URL('../../src/web-components/social-feed/', import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), 'utf8');
const fx = (name) => new URL(`./fixtures/social-feed/${name}`, import.meta.url);
const json = (name) => JSON.parse(readFileSync(fx(name), 'utf8'));

const ALICE = { key: 'bluesky:alice.example.com', service: 'bluesky', handle: 'alice.example.com', did: 'did:plc:alice0000000000000000000' };
const BOB = { key: 'mastodon:@bob@social.example', service: 'mastodon', handle: '@bob@social.example' };
const CAROL = { key: 'github:carol-dev', service: 'github', handle: 'carol-dev' };
const REPO = { name: 'widget', html_url: 'https://github.com/carol-dev/widget', description: 'A <small> widget & friends', language: 'JavaScript' };
const NAMES = { bluesky: 'Bluesky', mastodon: 'Mastodon', github: 'GitHub' };

describe('social-feed core.js and fetch.js (copied from Cook)', () => {
  it('core.js and fetch.js match the fixtures: normalized == expected-items.json, rendered == expected-entry.html', () => {
    const actual = {
      bluesky: normalizeBluesky(json('bluesky-page.json'), ALICE).items,
      mastodon: normalizeMastodon(json('mastodon-statuses.json'), BOB).items,
      github: normalizeGithubReleases(json('github-releases.json'), REPO, CAROL),
    };
    assert.deepEqual(actual, json('expected-items.json'));
    const html = [...actual.bluesky, ...actual.mastodon, ...actual.github]
      .map((item) => renderEntry(item, { serviceName: NAMES[item.service] }))
      .join('\n') + '\n';
    assert.equal(html, readFileSync(fx('expected-entry.html'), 'utf8'));
  });

  it('each copy starts with the provenance line and fetch.js imports only ./core.js', () => {
    for (const f of ['core', 'fetch']) {
      assert.equal(read(`${f}.js`).split('\n')[0],
        `// Copied from cook-ssg 2.12.0 scripts/social/feeds/${f}.js. Do not edit here; parity-tested.`);
    }
    assert.doesNotMatch(read('core.js'), /^import /m);
    const imports = [...read('fetch.js').matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    assert.deepEqual(imports, ['./core.js']);
  });

  it('browser mode never sends a token and reads GitHub public events once', async () => {
    const calls = [];
    const fetch = async (url, opts) => {
      calls.push({ url, opts });
      return { ok: true, status: 200, json: async () => json('github-events.json') };
    };
    const page = await fetchAccountPage(CAROL, { fetch, mode: 'browser', token: 'secret' });
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /^https:\/\/api\.github\.com\/users\/carol-dev\/events\/public/);
    assert.ok(!JSON.stringify(calls[0].opts.headers || {}).includes('secret'));
    assert.equal(page.done, true);
    assert.equal(page.items.length, 1);
  });

  it('hostile URLs and text come out inert in browser-rendered entries', () => {
    const html = renderEntry({
      id: 'bluesky:x"><script>', service: 'bluesky', source: ALICE.key,
      url: 'https://bsky.app/profile/a/post/x', date: '2026-11-14T08:00:00.000Z',
      text: '<img src=x onerror=alert(1)>', tags: [], reposted: false,
      author: { name: '<b>', handle: '@a', avatar: 'javascript:alert(1)' },
      image: { url: 'http://insecure.example/x.png', alt: '"' },
    }, { serviceName: 'Bluesky' });
    assert.doesNotMatch(html, /javascript:|http:\/\/insecure|<script>|<img src=x/);
    assert.equal(renderEntry({ id: 'x', url: 'javascript:alert(1)', date: '2026-11-14T08:00:00.000Z' }), '');
  });
});

describe('social-feed api.json', () => {
  const api = JSON.parse(read('api.json'));
  it('api.json lists accounts, tags, items, height, hide-counts', () => {
    assert.equal(api.element, 'social-feed');
    assert.deepEqual(api.attributes.map((a) => a.name), ['accounts', 'tags', 'items', 'height', 'hide-counts']);
    for (const a of api.attributes) assert.ok(a.kind && a.purpose && a.description, a.name);
    assert.equal(api.attributes.find((a) => a.name === 'items').default, '12');
    assert.equal(api.attributes.find((a) => a.name === 'height').default, '32rem');
    assert.equal(api.attributes.find((a) => a.name === 'hide-counts').type, 'boolean');
  });
});

describe('social-feed styles.css', () => {
  const css = read('styles.css').replace(/\/\*[\s\S]*?\*\//g, '');
  it('scrolls the list inside the block at the set height', () => {
    assert.match(css, /social-feed activity-feed\s*\{[^}]*max-height:\s*var\(--social-feed-height,\s*32rem\)/);
    assert.match(css, /social-feed activity-feed\s*\{[^}]*overflow-y:\s*auto/);
    assert.match(css, /social-feed activity-feed\s*\{[^}]*overscroll-behavior:\s*contain/);
  });
  it('keeps line breaks in post text', () => {
    assert.match(css, /\.social-feed-text\s*\{[^}]*white-space:\s*pre-line/);
  });
  it('uses var(--…) tokens for colour and space', () => {
    const decls = css.match(/(?:color|gap|padding|margin|border|background)[a-z-]*\s*:[^;]+;/g) ?? [];
    for (const d of decls.filter((x) => !/:\s*0;$/.test(x.trim()))) {
      assert.doesNotMatch(d, /#[0-9a-f]{3,8}\b|\b\d+(\.\d+)?(px|rem|em)\b(?![^()]*\))/i, d);
    }
  });
});

describe('social-feed logic.js and static.html', () => {
  const js = read('logic.js');
  it('registers the element, uses activity-feed and the copied core, never a token', () => {
    assert.match(js, /registerComponent\('social-feed'/);
    assert.match(js, /from '\.\/core\.js'/);
    assert.match(js, /from '\.\/fetch\.js'/);
    assert.match(js, /import '\.\.\/activity-feed\/logic\.js'/);
    assert.match(js, /mode: 'browser'/);
    assert.doesNotMatch(js, /token|Authorization/i);
  });
  it('static.html is a built example: entries, more line and state JSON', () => {
    const html = read('static.html');
    assert.match(html, /<social-feed[^>]*style="--social-feed-height: [^"]+"/);
    assert.match(html, /<activity-feed aria-label="Recent posts" data-infinite/);
    assert.match(html, /<article data-activity data-id="bluesky:/);
    assert.match(html, /<p class="social-feed-more">More on /);
    const state = JSON.parse(html.match(/<script type="application\/json" class="social-feed-state">([\s\S]*?)<\/script>/)?.[1] ?? '');
    assert.deepEqual(Object.keys(state).sort(), ['accounts', 'buffer', 'newest', 'tags']);
  });
});
