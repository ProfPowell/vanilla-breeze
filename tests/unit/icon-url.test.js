// tests/unit/icon-url.test.js
// Run with: node --test tests/unit/icon-url.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildIconUrl, resolveIconSet, resolveIconBase } from '../../src/lib/icon-url.js';

// Minimal DOM stand-ins (project does not use jsdom); cast to the DOM types the
// functions expect — these mocks intentionally implement only what's exercised.
const el = (attrs = {}, ancestorSet) => /** @type {any} */ ({
  getAttribute: (k) => (k in attrs ? attrs[k] : null),
  closest: (sel) => (sel === '[data-icon-set]' && ancestorSet
    ? { getAttribute: () => ancestorSet } : null),
});
const doc = (iconSet, iconPath) => /** @type {any} */ ({ documentElement: { dataset: { iconSet, iconPath } } });

describe('icon-url', () => {
  it('builds the SVG url from base/set/name', () => {
    assert.equal(
      buildIconUrl({ basePath: '/cdn/icons', set: 'lucide', name: 'star' }),
      '/cdn/icons/lucide/star.svg'
    );
  });

  it('resolves set from element attr first', () => {
    assert.equal(resolveIconSet(el({ 'data-icon-set': 'phosphor' }), doc('tabler')), 'phosphor');
  });

  it('resolves set from ancestor when element has none', () => {
    assert.equal(resolveIconSet(el({}, 'mage'), doc('tabler')), 'mage');
  });

  it('falls back to global data-icon-set, then lucide', () => {
    assert.equal(resolveIconSet(el({}), doc('tabler')), 'tabler');
    assert.equal(resolveIconSet(el({}), doc(undefined)), 'lucide');
  });

  it('resolves base path from data-icon-path or default', () => {
    assert.equal(resolveIconBase(doc(undefined, '/vb/cdn/icons')), '/vb/cdn/icons');
    assert.equal(resolveIconBase(doc(undefined, undefined)), '/cdn/icons');
  });

  it('makes the derived base absolute against the document, so CSS resolves it the same way', () => {
    const d = doc(undefined, undefined);
    d.baseURI = 'https://example.test/app/page.html';
    assert.equal(resolveIconBase(d), 'https://example.test/cdn/icons');
  });

  it('follows the bundle that is running (CDN or subpath install)', () => {
    const g = /** @type {any} */ (globalThis);
    g.window = { __VB_THEME_BASE: 'https://unpkg.com/vanilla-breeze@1.0.0/dist/cdn/' };
    try {
      const d = doc(undefined, undefined);
      d.baseURI = 'https://example.test/';
      assert.equal(resolveIconBase(d), 'https://unpkg.com/vanilla-breeze@1.0.0/dist/cdn/icons');
      assert.equal(resolveIconBase(doc(undefined, '/own/icons')), '/own/icons');
    } finally {
      delete g.window;
    }
  });
});
