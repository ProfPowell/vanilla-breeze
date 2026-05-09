/**
 * Unit tests for src/lib/ai/fallback.js
 *
 * Run with: node --test tests/unit/ai/fallback.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { expandFallbackURL } from '../../../src/lib/ai/fallback.js';

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
