/**
 * Unit tests for highlights-init utility
 *
 * Tests pure logic functions (FNV-1a hash, ID generation, offset calculations).
 * DOM-dependent behavior (CSS Highlight API, toolbar) is tested via Playwright.
 *
 * Run with: node --test tests/unit/highlights.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------- FNV-1a hash (copied from source for unit testing) ----------

function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

// ---------- Storage key logic (replicated from source) ----------

const STORAGE_PREFIX = 'vb-highlights:';

function resolveStorageKey(datasetValue, pathname) {
  const suffix = (datasetValue && datasetValue !== '') ? datasetValue : pathname;
  return STORAGE_PREFIX + suffix;
}

// ---------- Envelope validation (replicated from source) ----------

function validateEnvelope(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data.highlights || !Array.isArray(data.highlights)) return null;
    return data;
  } catch {
    return null;
  }
}

// ---------- Tests ----------

describe('fnv1a', () => {
  it('returns consistent hashes for the same input', () => {
    const hash1 = fnv1a('hello world');
    const hash2 = fnv1a('hello world');
    assert.equal(hash1, hash2);
  });

  it('returns different hashes for different inputs', () => {
    const hash1 = fnv1a('hello world');
    const hash2 = fnv1a('hello world!');
    assert.notEqual(hash1, hash2);
  });

  it('returns a base-36 string', () => {
    const hash = fnv1a('test string');
    assert.match(hash, /^[0-9a-z]+$/);
  });

  it('handles empty string', () => {
    const hash = fnv1a('');
    assert.ok(hash.length > 0);
  });

  it('handles unicode', () => {
    const hash = fnv1a('café ☕');
    assert.ok(hash.length > 0);
    assert.equal(hash, fnv1a('café ☕'));
  });
});

describe('resolveStorageKey', () => {
  it('uses pathname as default suffix', () => {
    const key = resolveStorageKey('', '/docs/article/');
    assert.equal(key, 'vb-highlights:/docs/article/');
  });

  it('uses explicit value when provided', () => {
    const key = resolveStorageKey('my-notes', '/docs/article/');
    assert.equal(key, 'vb-highlights:my-notes');
  });

  it('uses pathname when value is empty string', () => {
    const key = resolveStorageKey('', '/page/');
    assert.equal(key, 'vb-highlights:/page/');
  });

  it('handles undefined value (boolean attribute)', () => {
    const key = resolveStorageKey(undefined, '/page/');
    assert.equal(key, 'vb-highlights:/page/');
  });
});

describe('validateEnvelope', () => {
  it('parses valid envelope', () => {
    const envelope = JSON.stringify({
      version: 1,
      contentHash: 'abc123',
      highlights: [{ id: 'hn-test', startOffset: 0, endOffset: 5 }],
    });
    const result = validateEnvelope(envelope);
    assert.ok(result);
    assert.equal(result.highlights.length, 1);
  });

  it('rejects missing highlights array', () => {
    const result = validateEnvelope(JSON.stringify({ version: 1 }));
    assert.equal(result, null);
  });

  it('rejects non-array highlights', () => {
    const result = validateEnvelope(JSON.stringify({ highlights: 'not-array' }));
    assert.equal(result, null);
  });

  it('rejects invalid JSON', () => {
    const result = validateEnvelope('not json');
    assert.equal(result, null);
  });

  it('rejects empty string', () => {
    const result = validateEnvelope('');
    assert.equal(result, null);
  });
});

describe('highlight data shape', () => {
  it('validates required fields', () => {
    const highlight = {
      id: 'hn-a1b2c3',
      startOffset: 245,
      endOffset: 312,
      text: 'highlighted phrase',
      color: 'yellow',
      note: '',
      created: Date.now(),
    };

    assert.ok(highlight.id.startsWith('hn-'));
    assert.ok(typeof highlight.startOffset === 'number');
    assert.ok(typeof highlight.endOffset === 'number');
    assert.ok(highlight.endOffset > highlight.startOffset);
    assert.ok(typeof highlight.text === 'string');
    assert.ok(typeof highlight.color === 'string');
    assert.ok(typeof highlight.note === 'string');
    assert.ok(typeof highlight.created === 'number');
  });

  it('exports and imports roundtrip', () => {
    const highlights = [
      { id: 'hn-001', startOffset: 0, endOffset: 10, text: 'hello', color: 'yellow', note: 'test', created: 1 },
      { id: 'hn-002', startOffset: 20, endOffset: 30, text: 'world', color: 'green', note: '', created: 2 },
    ];

    const exported = JSON.stringify({ version: 1, highlights });
    const imported = JSON.parse(exported);

    assert.equal(imported.version, 1);
    assert.equal(imported.highlights.length, 2);
    assert.deepEqual(imported.highlights[0], highlights[0]);
    assert.deepEqual(imported.highlights[1], highlights[1]);
  });
});

describe('color parsing', () => {
  const DEFAULT_COLORS = ['yellow', 'green', 'blue', 'pink'];

  function parseColors(attr) {
    return attr
      ? attr.split(',').map(c => c.trim()).filter(Boolean)
      : [...DEFAULT_COLORS];
  }

  it('uses defaults when no attribute', () => {
    assert.deepEqual(parseColors(undefined), DEFAULT_COLORS);
    assert.deepEqual(parseColors(null), DEFAULT_COLORS);
    assert.deepEqual(parseColors(''), DEFAULT_COLORS);
  });

  it('parses comma-separated colors', () => {
    assert.deepEqual(parseColors('red,orange,teal'), ['red', 'orange', 'teal']);
  });

  it('trims whitespace', () => {
    assert.deepEqual(parseColors(' red , orange , teal '), ['red', 'orange', 'teal']);
  });

  it('filters empty strings', () => {
    assert.deepEqual(parseColors('red,,blue,'), ['red', 'blue']);
  });
});
