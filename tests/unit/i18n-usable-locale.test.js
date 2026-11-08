/**
 * Unit tests for usableLocale() in src/lib/i18n.js
 *
 * Every Intl constructor throws RangeError on a malformed tag, so a
 * component that hands an author's lang straight to Intl dies mid-render.
 * usableLocale() passes valid tags through untouched and swaps anything
 * else for a fallback that Intl is guaranteed to accept.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { usableLocale } from '../../src/lib/i18n.js';

describe('i18n — usableLocale', () => {
  for (const tag of ['en-US', 'ja', 'fa-IR', 'zz', 'ja-JP-u-ca-japanese']) {
    it(`passes "${tag}" through unchanged`, () => {
      assert.equal(usableLocale(tag), tag);
    });
  }

  for (const tag of ['en_US', 'ja_JP', 'en-US-', '日本語', '', undefined, null]) {
    it(`replaces ${JSON.stringify(tag) ?? 'undefined'} with en-US`, () => {
      assert.equal(usableLocale(tag), 'en-US');
    });
  }

  it('uses a valid custom fallback', () => {
    assert.equal(usableLocale('en_US', 'de'), 'de');
  });

  it('ignores an invalid fallback', () => {
    assert.equal(usableLocale('en_US', 'de_DE'), 'en-US');
  });

  it('always returns something Intl accepts', () => {
    for (const tag of ['en_US', 'ja_JP', 'en-US-', '日本語', '', 'en-US', 'zz']) {
      assert.doesNotThrow(() => new Intl.DateTimeFormat(usableLocale(tag)));
    }
  });
});
