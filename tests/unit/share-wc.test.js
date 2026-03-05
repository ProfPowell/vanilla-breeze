/**
 * Unit tests for share-wc platforms utility
 *
 * Run with: node --test tests/unit/share-wc.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PLATFORMS, DEFAULT_PLATFORMS } from '../../src/web-components/share-wc/platforms.js';

const testOpts = {
  url: 'https://example.com/article',
  title: 'Test Article',
  text: 'A test description',
};

describe('PLATFORMS map', () => {
  it('contains all expected platforms', () => {
    const expected = ['x', 'twitter', 'facebook', 'linkedin', 'whatsapp', 'telegram', 'bluesky', 'mastodon', 'email', 'copy'];
    for (const id of expected) {
      assert.ok(PLATFORMS.has(id), `Missing platform: ${id}`);
    }
  });

  it('each platform has required fields', () => {
    for (const [id, platform] of PLATFORMS) {
      assert.ok(platform.label, `${id} missing label`);
      assert.ok(platform.iconName, `${id} missing iconName`);
      assert.equal(typeof platform.buildUrl, 'function', `${id} missing buildUrl`);
    }
  });
});

describe('URL builders', () => {
  it('x builds correct URL', () => {
    const url = PLATFORMS.get('x').buildUrl(testOpts);
    assert.ok(url.startsWith('https://x.com/intent/post?'));
    assert.ok(url.includes('url=https%3A%2F%2Fexample.com%2Farticle'));
    assert.ok(url.includes('text=Test%20Article'));
  });

  it('twitter is an alias for x', () => {
    const xUrl = PLATFORMS.get('x').buildUrl(testOpts);
    const twitterUrl = PLATFORMS.get('twitter').buildUrl(testOpts);
    assert.equal(xUrl, twitterUrl);
  });

  it('facebook builds correct URL', () => {
    const url = PLATFORMS.get('facebook').buildUrl(testOpts);
    assert.ok(url.startsWith('https://www.facebook.com/sharer/sharer.php?u='));
    assert.ok(url.includes('u=https%3A%2F%2Fexample.com%2Farticle'));
  });

  it('linkedin builds correct URL', () => {
    const url = PLATFORMS.get('linkedin').buildUrl(testOpts);
    assert.ok(url.startsWith('https://www.linkedin.com/sharing/share-offsite/?url='));
    assert.ok(url.includes('url=https%3A%2F%2Fexample.com%2Farticle'));
  });

  it('whatsapp combines title and URL', () => {
    const url = PLATFORMS.get('whatsapp').buildUrl(testOpts);
    assert.ok(url.startsWith('https://wa.me/?text='));
    assert.ok(url.includes('Test%20Article'));
    assert.ok(url.includes('example.com'));
  });

  it('telegram builds correct URL', () => {
    const url = PLATFORMS.get('telegram').buildUrl(testOpts);
    assert.ok(url.startsWith('https://t.me/share/url?'));
    assert.ok(url.includes('url=https%3A%2F%2Fexample.com%2Farticle'));
    assert.ok(url.includes('text=Test%20Article'));
  });

  it('bluesky builds correct URL', () => {
    const url = PLATFORMS.get('bluesky').buildUrl(testOpts);
    assert.ok(url.startsWith('https://bsky.app/intent/compose?text='));
    assert.ok(url.includes('Test%20Article'));
    assert.ok(url.includes('example.com'));
  });

  it('mastodon uses default instance', () => {
    const url = PLATFORMS.get('mastodon').buildUrl(testOpts);
    assert.ok(url.startsWith('https://mastodon.social/share?text='));
  });

  it('mastodon accepts custom instance', () => {
    const url = PLATFORMS.get('mastodon').buildUrl(testOpts, 'fosstodon.org');
    assert.ok(url.startsWith('https://fosstodon.org/share?text='));
  });

  it('email builds mailto URL', () => {
    const url = PLATFORMS.get('email').buildUrl(testOpts);
    assert.ok(url.startsWith('mailto:?'));
    assert.ok(url.includes('subject=Test%20Article'));
    assert.ok(url.includes('body='));
  });

  it('copy returns empty string', () => {
    const url = PLATFORMS.get('copy').buildUrl(testOpts);
    assert.equal(url, '');
  });
});

describe('icon sets', () => {
  it('brand icons use custom set', () => {
    const brandPlatforms = ['whatsapp', 'telegram', 'bluesky', 'mastodon'];
    for (const id of brandPlatforms) {
      assert.equal(PLATFORMS.get(id).iconSet, 'custom', `${id} should use custom icon set`);
    }
  });

  it('standard icons have no iconSet', () => {
    const standardPlatforms = ['x', 'twitter', 'facebook', 'linkedin', 'email', 'copy'];
    for (const id of standardPlatforms) {
      assert.equal(PLATFORMS.get(id).iconSet, undefined, `${id} should use default (Lucide) icons`);
    }
  });
});

describe('DEFAULT_PLATFORMS', () => {
  it('is a comma-separated string', () => {
    assert.ok(typeof DEFAULT_PLATFORMS === 'string');
    const platforms = DEFAULT_PLATFORMS.split(',');
    assert.ok(platforms.length > 0);
  });

  it('all default platforms exist in PLATFORMS map', () => {
    const platforms = DEFAULT_PLATFORMS.split(',');
    for (const id of platforms) {
      assert.ok(PLATFORMS.has(id), `Default platform ${id} not found in PLATFORMS map`);
    }
  });

  it('includes copy for clipboard support', () => {
    assert.ok(DEFAULT_PLATFORMS.includes('copy'));
  });

  it('includes email', () => {
    assert.ok(DEFAULT_PLATFORMS.includes('email'));
  });
});

describe('URL encoding', () => {
  it('encodes special characters in URL', () => {
    const opts = { ...testOpts, url: 'https://example.com/path?a=1&b=2' };
    const url = PLATFORMS.get('x').buildUrl(opts);
    assert.ok(url.includes('https%3A%2F%2Fexample.com%2Fpath%3Fa%3D1%26b%3D2'));
  });

  it('encodes special characters in title', () => {
    const opts = { ...testOpts, title: 'Title with "quotes" & <tags>' };
    const url = PLATFORMS.get('x').buildUrl(opts);
    assert.ok(url.includes('Title%20with%20%22quotes%22%20%26%20%3Ctags%3E'));
  });
});
