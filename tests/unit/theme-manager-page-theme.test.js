/**
 * Unit tests for the pure helpers behind "a theme the page sets":
 * mergeThemeTokens, resolveInitialBrand with data-theme-source="site",
 * pageModeFrom and effectiveModeFor.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  mergeThemeTokens,
  resolveInitialBrand,
  pageModeFrom,
  effectiveModeFor,
} from '../../src/lib/theme-manager.js';

describe('mergeThemeTokens', () => {
  it('keeps ids it did not write', () => {
    assert.equal(mergeThemeTokens('swiss vp-site', 'swiss', 'swiss'), 'swiss vp-site');
    assert.equal(mergeThemeTokens('swiss vp-site', 'swiss', 'cyber'), 'cyber vp-site');
    assert.equal(mergeThemeTokens('swiss vp-site a11y-large-text', 'swiss', 'default'), 'vp-site a11y-large-text');
    assert.equal(mergeThemeTokens('', '', 'cyber'), 'cyber');
    assert.equal(mergeThemeTokens('a11y-dyslexia', '', 'default'), 'a11y-dyslexia');
  });
});

describe('resolveInitialBrand with data-theme-source="site"', () => {
  it('the page brand beats a stored brand', () => {
    assert.equal(resolveInitialBrand({ brand: 'cyber' }, 'swiss vp-site', 'site'), 'swiss');
  });
  it('without the attribute a stored brand still wins (unchanged)', () => {
    assert.equal(resolveInitialBrand({ brand: 'cyber' }, 'swiss vp-site', null), 'cyber');
  });
  it('site source with nothing pinned falls back as before', () => {
    assert.equal(resolveInitialBrand({ brand: 'cyber' }, '', 'site'), 'cyber');
  });
});

describe('page data-mode', () => {
  it('pageModeFrom keeps only light/dark', () => {
    assert.equal(pageModeFrom('dark'), 'dark');
    assert.equal(pageModeFrom('auto'), null);
    assert.equal(pageModeFrom(null), null);
  });
  it('a page mode beats the stored mode; none falls back to it', () => {
    assert.equal(effectiveModeFor('light', 'dark', false), 'dark');
    assert.equal(effectiveModeFor('dark', null, false), 'dark');
    assert.equal(effectiveModeFor('auto', null, true), 'dark');
    assert.equal(effectiveModeFor('auto', null, false), 'light');
  });
});
