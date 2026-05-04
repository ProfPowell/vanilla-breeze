/**
 * Unit tests for src/web-components/color-picker/_color-utils.js
 *
 * Pure functions — no DOM needed. Exercises the existing hex/rgb/hsl
 * conversions and the new oklch + format-string helpers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  hslToRgb, rgbToHsl, hexToRgb, rgbToHex, hexToHsl, hslToHex,
  rgbToOklch, oklchToRgb, hslToOklch, oklchToHsl,
  formatHex, formatRgb, formatHsl, formatOklch, formatColor,
  clamp,
} from '../../src/web-components/color-picker/_color-utils.js';

describe('color-utils — clamp', () => {
  it('returns the value when in range', () => assert.equal(clamp(5, 0, 10), 5));
  it('clamps below min', () => assert.equal(clamp(-3, 0, 10), 0));
  it('clamps above max', () => assert.equal(clamp(99, 0, 10), 10));
});

describe('color-utils — hex/rgb/hsl round-trip', () => {
  const cases = [
    { hex: '#000000', rgb: { r: 0, g: 0, b: 0 } },
    { hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 } },
    { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 } },
    { hex: '#6366f1', rgb: { r: 99, g: 102, b: 241 } },
    { hex: '#3b82f6', rgb: { r: 59, g: 130, b: 246 } },
  ];

  for (const c of cases) {
    it(`hex ↔ rgb: ${c.hex}`, () => {
      assert.deepEqual(hexToRgb(c.hex), c.rgb);
      assert.equal(rgbToHex(c.rgb.r, c.rgb.g, c.rgb.b), c.hex);
    });

    it(`hsl round-trips through hex: ${c.hex}`, () => {
      const hsl = hexToHsl(c.hex);
      const back = hslToHex(hsl.h, hsl.s, hsl.l);
      // Allow ±2 per channel due to integer rounding
      const a = hexToRgb(back);
      const b = c.rgb;
      assert.ok(Math.abs(a.r - b.r) <= 2, `r off: ${a.r} vs ${b.r}`);
      assert.ok(Math.abs(a.g - b.g) <= 2, `g off: ${a.g} vs ${b.g}`);
      assert.ok(Math.abs(a.b - b.b) <= 2, `b off: ${a.b} vs ${b.b}`);
    });
  }

  it('expands 3-digit hex', () => {
    assert.deepEqual(hexToRgb('#f00'), { r: 255, g: 0, b: 0 });
    assert.deepEqual(hexToRgb('#abc'), { r: 170, g: 187, b: 204 });
  });
});

describe('color-utils — OkLCH conversions', () => {
  it('white is L=1, C=0', () => {
    const ok = rgbToOklch(255, 255, 255);
    assert.ok(Math.abs(ok.L - 1) < 0.01, `L=${ok.L}`);
    assert.ok(ok.C < 0.01, `C=${ok.C}`);
  });

  it('black is L=0, C=0', () => {
    const ok = rgbToOklch(0, 0, 0);
    assert.ok(ok.L < 0.01, `L=${ok.L}`);
    assert.ok(ok.C < 0.01, `C=${ok.C}`);
  });

  it('pure red has hue ~29° (Ottosson reference value)', () => {
    const ok = rgbToOklch(255, 0, 0);
    // Reference: oklch(0.628 0.258 29.23°) for pure sRGB red
    assert.ok(Math.abs(ok.L - 0.628) < 0.01, `L=${ok.L}`);
    assert.ok(Math.abs(ok.C - 0.258) < 0.01, `C=${ok.C}`);
    assert.ok(Math.abs(ok.H - 29.23) < 0.5,  `H=${ok.H}`);
  });

  it('rgb → oklch → rgb round-trips within ±1 channel', () => {
    const samples = [
      [255, 0, 0],
      [99, 102, 241],
      [59, 130, 246],
      [128, 128, 128],
      [10, 200, 50],
    ];
    for (const [r, g, b] of samples) {
      const ok = rgbToOklch(r, g, b);
      const back = oklchToRgb(ok.L, ok.C, ok.H);
      assert.ok(Math.abs(back.r - r) <= 1, `r ${back.r} vs ${r}`);
      assert.ok(Math.abs(back.g - g) <= 1, `g ${back.g} vs ${g}`);
      assert.ok(Math.abs(back.b - b) <= 1, `b ${back.b} vs ${b}`);
    }
  });

  it('hsl ↔ oklch round-trip stays close', () => {
    const samples = [
      { h: 240, s: 80, l: 50 },
      { h: 0,   s: 100, l: 50 },
      { h: 120, s: 60, l: 40 },
    ];
    for (const { h, s, l } of samples) {
      const ok = hslToOklch(h, s, l);
      const back = oklchToHsl(ok.L, ok.C, ok.H);
      assert.ok(Math.abs(back.h - h) <= 1, `h ${back.h} vs ${h}`);
      assert.ok(Math.abs(back.s - s) <= 2, `s ${back.s} vs ${s}`);
      assert.ok(Math.abs(back.l - l) <= 2, `l ${back.l} vs ${l}`);
    }
  });
});

describe('color-utils — CSS format strings', () => {
  it('formatHex returns a #rrggbb string', () => {
    assert.match(formatHex(0, 100, 50), /^#[0-9a-f]{6}$/);
  });

  it('formatRgb uses CSS Color 4 space-separated syntax', () => {
    assert.match(formatRgb(0, 100, 50), /^rgb\(\d+ \d+ \d+\)$/);
  });

  it('formatHsl includes deg and %', () => {
    const out = formatHsl(207, 70, 53);
    assert.equal(out, 'hsl(207deg 70% 53%)');
  });

  it('formatOklch includes %, raw chroma, and deg', () => {
    const out = formatOklch(0, 100, 50);
    // e.g. "oklch(62.8% 0.258 29.2deg)" for pure red
    assert.match(out, /^oklch\(\d+\.\d% \d+\.\d{3} \d+\.\d?deg\)$/);
  });

  it('formatColor dispatches on format', () => {
    assert.equal(formatColor('hex', 207, 70, 53), formatHex(207, 70, 53));
    assert.equal(formatColor('rgb', 207, 70, 53), formatRgb(207, 70, 53));
    assert.equal(formatColor('hsl', 207, 70, 53), formatHsl(207, 70, 53));
    assert.equal(formatColor('oklch', 207, 70, 53), formatOklch(207, 70, 53));
    // Unknown falls back to hex
    assert.equal(formatColor('xyz', 207, 70, 53), formatHex(207, 70, 53));
  });
});
