/**
 * Unit tests for ThemeManager.resolveInitialBrand() — the init()-time decision
 * of which brand to apply — and pinnedBrandFrom().
 *
 * A page that pins its theme via `<html data-theme="…">` (theme-showcase
 * demos, a site built on one theme) owns its default. Two regressions:
 *  - visitors with no saved preference had the pin clobbered by `default`;
 *  - any saved preference — even a mode-only toggle, or a `default` picked
 *    on another page of the same origin — resolved the brand to `default`
 *    and dropped the pin for good (vanilla-breeze-psme).
 * Rule: only a stored preference naming a different, explicit brand replaces
 * the pin.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { resolveInitialBrand, pinnedBrandFrom } from '../../src/lib/theme-manager.js';

describe('pinnedBrandFrom', () => {
  it('returns the brand token, ignoring a11y modifiers', () => {
    assert.equal(pinnedBrandFrom('journal'), 'journal');
    assert.equal(pinnedBrandFrom('journal a11y-high-contrast'), 'journal');
    assert.equal(pinnedBrandFrom('a11y-large-text journal'), 'journal');
  });

  it('returns an empty string when nothing is pinned', () => {
    assert.equal(pinnedBrandFrom(''), '');
    assert.equal(pinnedBrandFrom(undefined), '');
    assert.equal(pinnedBrandFrom('a11y-high-contrast'), '');
  });
});

describe('resolveInitialBrand', () => {
  it('honors a page-pinned data-theme when there is no stored preference', () => {
    assert.equal(resolveInitialBrand(null, 'journal'), 'journal');
    assert.equal(resolveInitialBrand(null, 'art-deco'), 'art-deco');
    assert.equal(resolveInitialBrand(null, 'journal a11y-high-contrast'), 'journal');
  });

  it('falls back to the default brand when nothing is pinned or stored', () => {
    assert.equal(resolveInitialBrand(null, ''), 'default');
    assert.equal(resolveInitialBrand(null, undefined), 'default');
    assert.equal(resolveInitialBrand(null, 'a11y-high-contrast'), 'default');
    assert.equal(resolveInitialBrand({ mode: 'dark' }, ''), 'default');
  });

  it('lets an explicit stored brand win over a page-pinned data-theme', () => {
    assert.equal(resolveInitialBrand({ brand: 'cyber' }, 'journal'), 'cyber');
    assert.equal(resolveInitialBrand({ brand: 'cyber' }, ''), 'cyber');
  });

  it('keeps the pin when the stored preference has no brand (mode-only toggle)', () => {
    assert.equal(resolveInitialBrand({ mode: 'dark' }, 'powell'), 'powell');
  });

  it('keeps the pin when the stored brand is the generic default', () => {
    // A reset, or a pick made on another page of the same origin, means
    // "this page's default" — which is the pin.
    assert.equal(resolveInitialBrand({ brand: 'default' }, 'powell'), 'powell');
    assert.equal(resolveInitialBrand({ brand: 'default' }, ''), 'default');
  });
});
