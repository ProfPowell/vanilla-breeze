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
  pinnedBrandFrom,
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

describe('edge cases', () => {
  it('a page mode beats an explicit opposite preference', () => {
    assert.equal(effectiveModeFor('dark', 'light', true), 'light');
  });
  it('pageModeFrom ignores an empty value', () => {
    assert.equal(pageModeFrom(''), null);
  });
  it('replaces the token a boot script wrote, not a stale pin (I1 shape)', () => {
    assert.equal(mergeThemeTokens('cyber', 'cyber', 'swiss'), 'swiss');
    assert.equal(mergeThemeTokens('cyber vp-site', 'cyber', 'swiss'), 'swiss vp-site');
  });
  it('a managed token absent from the live value changes nothing else', () => {
    assert.equal(mergeThemeTokens('vp-site', 'swiss', 'cyber'), 'cyber vp-site');
  });
});

describe('site pages: the first token is the brand (M2)', () => {
  it('default is a valid first token', () => {
    assert.equal(pinnedBrandFrom('default vp-site', 'site'), 'default');
    assert.equal(resolveInitialBrand({ brand: 'cyber' }, 'default vp-site', 'site'), 'default');
  });
  it('without the source, a lone extra id is still taken as the brand (unchanged)', () => {
    assert.equal(pinnedBrandFrom('vp-site'), 'vp-site');
  });
  it('an a11y first token is not a brand', () => {
    assert.equal(pinnedBrandFrom('a11y-large-text swiss', 'site'), '');
  });
  it('keepDefault writes default first so extra ids are not read as the brand', () => {
    assert.equal(mergeThemeTokens('swiss vp-site', 'swiss', 'default', true), 'default vp-site');
    assert.equal(mergeThemeTokens('default vp-site', 'default', 'default', true), 'default vp-site');
    assert.equal(mergeThemeTokens('swiss', 'swiss', 'default', true), '');
  });
  it('boot output re-read by the manager round-trips', () => {
    const booted = mergeThemeTokens('swiss vp-site a11y-dyslexia', 'swiss', 'swiss', true);
    assert.equal(booted, 'swiss vp-site a11y-dyslexia');
    assert.equal(pinnedBrandFrom(booted, 'site'), 'swiss');
  });
});
