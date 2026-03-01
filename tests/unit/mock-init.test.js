/**
 * Unit tests for mock-init utility
 *
 * Tests pure logic functions (SVG generation, dimension resolution, XML escaping).
 * DOM-dependent behavior (MutationObserver, element enhancement) is tested via Playwright.
 *
 * Run with: node --test tests/unit/mock-init.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------- escapeXml (replicated from source) ----------

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------- placeholderSvg (replicated from source) ----------

function placeholderSvg(w, h, label) {
  const fontSize = Math.min(Math.max(w / 15, 12), 32);
  const cx = w / 2;
  const cy = h / 2;
  const safeLabel = label ? escapeXml(label) : '';

  const textEl = safeLabel
    ? `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="${fontSize}" fill="#6b7280">${safeLabel}</text>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f3f4f6"/><line x1="0" y1="0" x2="${w}" y2="${h}" stroke="#d1d5db"/><line x1="${w}" y1="0" x2="0" y2="${h}" stroke="#d1d5db"/>${textEl}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ---------- getDimensions logic (replicated) ----------

const PRESETS = {
  hero:      { w: 1200, h: 400 },
  card:      { w: 400,  h: 225 },
  avatar:    { w: 48,   h: 48 },
  product:   { w: 400,  h: 400 },
  thumbnail: { w: 150,  h: 150 },
  logo:      { w: 200,  h: 50 },
  og:        { w: 1200, h: 630 },
  banner:    { w: 728,  h: 90 },
};

function getDimensions(mockValue, widthAttr, heightAttr) {
  const preset = PRESETS[mockValue];
  const w = Number(widthAttr) || preset?.w || 400;
  const h = Number(heightAttr) || preset?.h || 300;
  return { w, h };
}

// ---------- Tests ----------

describe('escapeXml', () => {
  it('escapes ampersands', () => {
    assert.equal(escapeXml('A & B'), 'A &amp; B');
  });

  it('escapes angle brackets', () => {
    assert.equal(escapeXml('<img>'), '&lt;img&gt;');
  });

  it('escapes double quotes', () => {
    assert.equal(escapeXml('"hello"'), '&quot;hello&quot;');
  });

  it('handles clean strings', () => {
    assert.equal(escapeXml('Hello World'), 'Hello World');
  });

  it('handles empty string', () => {
    assert.equal(escapeXml(''), '');
  });
});

describe('placeholderSvg', () => {
  it('returns a data URI starting with data:image/svg+xml', () => {
    const result = placeholderSvg(400, 300, 'Test');
    assert.ok(result.startsWith('data:image/svg+xml,'));
  });

  it('includes width and height in the SVG', () => {
    const result = decodeURIComponent(placeholderSvg(400, 300, 'Test'));
    assert.ok(result.includes('width="400"'));
    assert.ok(result.includes('height="300"'));
  });

  it('includes the label text', () => {
    const result = decodeURIComponent(placeholderSvg(400, 300, 'Hero Image'));
    assert.ok(result.includes('Hero Image'));
  });

  it('escapes XML characters in label', () => {
    const result = decodeURIComponent(placeholderSvg(400, 300, 'A & B'));
    assert.ok(result.includes('A &amp; B'));
  });

  it('omits text element when label is empty', () => {
    const result = decodeURIComponent(placeholderSvg(400, 300, ''));
    assert.ok(!result.includes('<text'));
  });

  it('includes X-pattern diagonal lines', () => {
    const result = decodeURIComponent(placeholderSvg(400, 300, 'Test'));
    assert.ok(result.includes('<line'));
  });

  it('clamps font size between 12 and 32', () => {
    // Very small: w=50, w/15 = 3.33 → clamp to 12
    const small = decodeURIComponent(placeholderSvg(50, 50, 'X'));
    assert.ok(small.includes('font-size="12"'));

    // Very large: w=1200, w/15 = 80 → clamp to 32
    const large = decodeURIComponent(placeholderSvg(1200, 400, 'X'));
    assert.ok(large.includes('font-size="32"'));
  });
});

describe('getDimensions', () => {
  it('uses explicit width and height over preset', () => {
    const { w, h } = getDimensions('card', '800', '600');
    assert.equal(w, 800);
    assert.equal(h, 600);
  });

  it('falls back to preset dimensions', () => {
    const { w, h } = getDimensions('card', null, null);
    assert.equal(w, 400);
    assert.equal(h, 225);
  });

  it('falls back to defaults when no preset match', () => {
    const { w, h } = getDimensions('', null, null);
    assert.equal(w, 400);
    assert.equal(h, 300);
  });

  it('resolves all presets correctly', () => {
    for (const [name, expected] of Object.entries(PRESETS)) {
      const { w, h } = getDimensions(name, null, null);
      assert.equal(w, expected.w, `${name} width`);
      assert.equal(h, expected.h, `${name} height`);
    }
  });

  it('mixes explicit width with preset height', () => {
    const { w, h } = getDimensions('hero', '800', null);
    assert.equal(w, 800);
    assert.equal(h, 400);
  });
});

describe('PRESETS', () => {
  it('has 8 presets defined', () => {
    assert.equal(Object.keys(PRESETS).length, 8);
  });

  it('all presets have positive dimensions', () => {
    for (const [name, { w, h }] of Object.entries(PRESETS)) {
      assert.ok(w > 0, `${name}.w should be positive`);
      assert.ok(h > 0, `${name}.h should be positive`);
    }
  });
});
