/**
 * Unit tests for portrait-url utility
 *
 * Run with: node --test tests/unit/portrait-url.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { portraitUrl, portraitByIndex, PORTRAIT_SIZES, PORTRAIT_CDN } from '../../src/lib/portrait-url.js';

describe('portraitUrl', () => {
  it('returns a jsdelivr CDN URL', () => {
    const url = portraitUrl('Sarah Chen');
    assert.ok(url.startsWith(PORTRAIT_CDN), `Expected CDN prefix, got: ${url}`);
    assert.ok(url.endsWith('.jpg'));
  });

  it('is deterministic — same seed gives same URL', () => {
    assert.equal(portraitUrl('test-seed'), portraitUrl('test-seed'));
    assert.equal(portraitUrl('another', 256), portraitUrl('another', 256));
  });

  it('different seeds give different URLs', () => {
    assert.notEqual(portraitUrl('Alice'), portraitUrl('Bob'));
  });

  it('defaults to 128px size', () => {
    const url = portraitUrl('default-size');
    assert.ok(url.includes('/128/'), `Expected /128/ in URL, got: ${url}`);
  });

  it('snaps to nearest available size', () => {
    assert.ok(portraitUrl('snap', 100).includes('/128/'));
    assert.ok(portraitUrl('snap', 50).includes('/64/'));
    assert.ok(portraitUrl('snap', 33).includes('/32/'));
    assert.ok(portraitUrl('snap', 200).includes('/256/'));
    assert.ok(portraitUrl('snap', 400).includes('/512/'));
  });

  it('uses only male or female paths', () => {
    const urls = new Set();
    for (let i = 0; i < 50; i++) {
      urls.add(portraitUrl(`seed-${i}`));
    }
    for (const url of urls) {
      assert.ok(
        url.includes('/male/') || url.includes('/female/'),
        `Unexpected path: ${url}`
      );
    }
  });

  it('distributes across both sexes', () => {
    let male = 0;
    let female = 0;
    for (let i = 0; i < 200; i++) {
      const url = portraitUrl(`distribution-${i}`);
      if (url.includes('/male/')) male++;
      else female++;
    }
    assert.ok(male > 20, `Expected decent male distribution, got ${male}`);
    assert.ok(female > 20, `Expected decent female distribution, got ${female}`);
  });

  it('index stays in 0–99 range', () => {
    for (let i = 0; i < 100; i++) {
      const url = portraitUrl(`range-${i}`);
      const match = url.match(/\/(\d+)\.jpg$/);
      assert.ok(match, `No index found in: ${url}`);
      const idx = Number(match[1]);
      assert.ok(idx >= 0 && idx <= 99, `Index out of range: ${idx}`);
    }
  });
});

describe('portraitByIndex', () => {
  it('returns female for indices 0–99', () => {
    assert.ok(portraitByIndex(0).includes('/female/'));
    assert.ok(portraitByIndex(50).includes('/female/'));
    assert.ok(portraitByIndex(99).includes('/female/'));
  });

  it('returns male for indices 100–199', () => {
    assert.ok(portraitByIndex(100).includes('/male/'));
    assert.ok(portraitByIndex(150).includes('/male/'));
    assert.ok(portraitByIndex(199).includes('/male/'));
  });

  it('wraps around at 200', () => {
    assert.equal(portraitByIndex(200), portraitByIndex(0));
    assert.equal(portraitByIndex(250), portraitByIndex(50));
  });

  it('handles negative indices', () => {
    const url = portraitByIndex(-1);
    assert.ok(url.startsWith(PORTRAIT_CDN));
    assert.ok(url.endsWith('.jpg'));
  });

  it('respects size parameter', () => {
    assert.ok(portraitByIndex(42, 512).includes('/512/'));
    assert.ok(portraitByIndex(42, 32).includes('/32/'));
  });
});

describe('PORTRAIT_SIZES', () => {
  it('exports the 5 available sizes', () => {
    assert.deepEqual(PORTRAIT_SIZES, [32, 64, 128, 256, 512]);
  });
});
