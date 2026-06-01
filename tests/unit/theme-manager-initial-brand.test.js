/**
 * Unit tests for ThemeManager.resolveInitialBrand() — the init()-time decision
 * of which brand to apply.
 *
 * Regression for the theme-showcase bug: a page that pins its theme via
 * `<html data-theme="…">` (e.g. journal/art-deco showcases) was getting that
 * attribute clobbered by the default on init() for visitors with no saved
 * preference. The fix: honor the page-pinned brand when nothing is stored,
 * while still letting a stored user preference win.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { resolveInitialBrand } from '../../src/lib/theme-manager.js';

describe('resolveInitialBrand', () => {
  it('honors a page-pinned data-theme when there is no stored preference', () => {
    assert.equal(resolveInitialBrand(null, 'journal'), 'journal');
    assert.equal(resolveInitialBrand(null, 'art-deco'), 'art-deco');
  });

  it('ignores a11y suffixes and picks the brand token from data-theme', () => {
    assert.equal(resolveInitialBrand(null, 'journal a11y-high-contrast'), 'journal');
    assert.equal(resolveInitialBrand(null, 'a11y-large-text journal'), 'journal');
  });

  it('falls back to the default brand when nothing is pinned or stored', () => {
    assert.equal(resolveInitialBrand(null, ''), 'default');
    assert.equal(resolveInitialBrand(null, undefined), 'default');
    assert.equal(resolveInitialBrand(null, 'a11y-high-contrast'), 'default');
  });

  it('lets a stored preference win over a page-pinned data-theme (conservative)', () => {
    assert.equal(resolveInitialBrand({ brand: 'cyber' }, 'journal'), 'cyber');
    // Stored "default" (user reset) still wins — we do not override an explicit choice.
    assert.equal(resolveInitialBrand({ brand: 'default' }, 'journal'), 'default');
  });

  it('falls back to default when a stored preference lacks a brand', () => {
    assert.equal(resolveInitialBrand({ mode: 'dark' }, 'journal'), 'default');
  });
});
