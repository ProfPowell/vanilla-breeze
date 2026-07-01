// tests/unit/icon-url.test.js
// Run with: node --test tests/unit/icon-url.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildIconUrl, resolveIconSet, resolveIconBase } from '../../src/lib/icon-url.js';

// Minimal DOM stand-ins (project does not use jsdom).
const el = (attrs = {}, ancestorSet) => ({
  getAttribute: (k) => (k in attrs ? attrs[k] : null),
  closest: (sel) => (sel === '[data-icon-set]' && ancestorSet
    ? { getAttribute: () => ancestorSet } : null),
});
const doc = (iconSet, iconPath) => ({ documentElement: { dataset: { iconSet, iconPath } } });

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
});
