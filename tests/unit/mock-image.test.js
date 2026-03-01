/**
 * Unit tests for mock-image URL utility
 *
 * Run with: node --test tests/unit/mock-image.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------- imageUrl (replicated from source) ----------

function imageUrl(options = {}) {
  const {
    service = 'picsum',
    width = 400,
    height = 300,
    seed,
    text,
    bg,
    color,
  } = options;

  if (service === 'placehold') {
    const params = new URLSearchParams();
    if (text) params.set('text', text);
    if (color) params.set('color', color);
    const query = params.toString();
    const base = bg
      ? `https://placehold.co/${width}x${height}/${bg}`
      : `https://placehold.co/${width}x${height}`;
    return query ? `${base}?${query}` : base;
  }

  if (seed != null) {
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
  }
  return `https://picsum.photos/${width}/${height}`;
}

// ---------- Tests ----------

describe('imageUrl — picsum (default)', () => {
  it('returns picsum URL with defaults', () => {
    assert.equal(imageUrl(), 'https://picsum.photos/400/300');
  });

  it('respects width and height', () => {
    assert.equal(imageUrl({ width: 800, height: 600 }), 'https://picsum.photos/800/600');
  });

  it('includes seed when provided', () => {
    assert.equal(
      imageUrl({ width: 400, height: 300, seed: 42 }),
      'https://picsum.photos/seed/42/400/300'
    );
  });

  it('encodes seed with special characters', () => {
    const url = imageUrl({ seed: 'hello world' });
    assert.ok(url.includes('hello%20world'));
  });
});

describe('imageUrl — placehold', () => {
  it('returns placehold.co URL', () => {
    assert.equal(
      imageUrl({ service: 'placehold', width: 400, height: 300 }),
      'https://placehold.co/400x300'
    );
  });

  it('includes text parameter', () => {
    const url = imageUrl({ service: 'placehold', width: 400, height: 300, text: 'Hero' });
    assert.ok(url.includes('text=Hero'));
  });

  it('includes background color in path', () => {
    const url = imageUrl({ service: 'placehold', width: 400, height: 300, bg: 'f3f4f6' });
    assert.equal(url, 'https://placehold.co/400x300/f3f4f6');
  });

  it('includes bg + text', () => {
    const url = imageUrl({ service: 'placehold', width: 400, height: 300, bg: 'ccc', text: 'Test' });
    assert.equal(url, 'https://placehold.co/400x300/ccc?text=Test');
  });

  it('includes color parameter', () => {
    const url = imageUrl({ service: 'placehold', width: 400, height: 300, color: '333' });
    assert.ok(url.includes('color=333'));
  });
});
