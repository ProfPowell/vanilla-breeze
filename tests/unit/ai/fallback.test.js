/**
 * Unit tests for src/lib/ai/fallback.js
 *
 * Run with: node --test tests/unit/ai/fallback.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  expandFallbackURL, capContent, usesContentToken, MAX_CONTENT_CHARS,
} from '../../../src/lib/ai/fallback.js';

describe('expandFallbackURL', () => {
  it('returns empty string for empty templates', () => {
    assert.equal(expandFallbackURL('', { prompt: 'x' }), '');
    assert.equal(expandFallbackURL(null, { prompt: 'x' }), '');
    assert.equal(expandFallbackURL(undefined, { prompt: 'x' }), '');
  });

  it('substitutes the four supported tokens', () => {
    const out = expandFallbackURL(
      'https://x.example/?p={prompt}&u={url}&t={title}&c={content}',
      { prompt: 'hi', url: 'https://a/', title: 'Page', content: 'body' },
    );
    assert.equal(
      out,
      'https://x.example/?p=hi&u=https%3A%2F%2Fa%2F&t=Page&c=body',
    );
  });

  it('URL-encodes values to keep templates safe', () => {
    const out = expandFallbackURL('https://x/?q={prompt}', {
      prompt: 'hello & "world" /<>?',
    });
    assert.match(out, /q=hello%20%26%20%22world%22%20%2F%3C%3E%3F$/);
  });

  it('encodes unicode and newlines', () => {
    const out = expandFallbackURL('mailto:?body={prompt}', {
      prompt: 'café\nline 2',
    });
    assert.equal(out, 'mailto:?body=caf%C3%A9%0Aline%202');
  });

  it('substitutes missing tokens with empty string', () => {
    const out = expandFallbackURL('https://x/?p={prompt}&u={url}&t={title}', {
      prompt: 'q',
    });
    // url + title default to '' when neither caller-provided nor in a browser
    assert.match(out, /^https:\/\/x\/\?p=q&u=[^&]*&t=/);
  });

  it('leaves unknown tokens untouched', () => {
    const out = expandFallbackURL('https://x/?p={prompt}&z={mystery}', {
      prompt: 'hi',
    });
    assert.equal(out, 'https://x/?p=hi&z={mystery}');
  });

  it('expands the same token multiple times', () => {
    const out = expandFallbackURL('{prompt}-{prompt}', { prompt: 'a' });
    assert.equal(out, 'a-a');
  });
});

describe('{content} capping', () => {
  it('caps {content} to MAX_CONTENT_CHARS by default, then encodes it', () => {
    const long = 'word '.repeat(1000);
    const out = expandFallbackURL('https://x/?c={content}', { content: long });
    const decoded = decodeURIComponent(out.slice('https://x/?c='.length));
    assert.ok(decoded.length <= MAX_CONTENT_CHARS, `got ${decoded.length}`);
    assert.ok(decoded.endsWith('…'));
  });

  it('honours a custom contentLimit', () => {
    const out = expandFallbackURL('{content}', { content: 'abcdefghij' }, { contentLimit: 5 });
    assert.equal(decodeURIComponent(out), 'abcd…');
  });

  it('leaves short content intact', () => {
    assert.equal(expandFallbackURL('{content}', { content: 'a b&c' }), 'a%20b%26c');
  });
});

describe('capContent', () => {
  it('cuts at a word boundary near the limit', () => {
    assert.equal(capContent('alpha beta gamma delta epsilon', 25), 'alpha beta gamma delta…');
  });

  it('hard-cuts when no nearby word boundary exists', () => {
    assert.equal(capContent('abcdefghijkl', 6), 'abcde…');
  });

  it('treats nullish as empty', () => {
    assert.equal(capContent(null), '');
  });
});

describe('usesContentToken', () => {
  it('detects the token', () => {
    assert.equal(usesContentToken('https://x/?q={prompt}&c={content}'), true);
    assert.equal(usesContentToken('https://x/?q={prompt}'), false);
    assert.equal(usesContentToken(null), false);
  });
});
