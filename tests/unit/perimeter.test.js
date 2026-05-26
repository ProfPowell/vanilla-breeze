import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { roundedRectPerimeter } from '../../src/lib/perimeter.js';

describe('roundedRectPerimeter', () => {
  it('sharp rectangle is 2(w+h)', () => {
    assert.equal(roundedRectPerimeter({ width: 100, height: 50, radius: 0 }), 300);
  });
  it('rounded rect uses 2w+2h-8r+2πr', () => {
    const L = roundedRectPerimeter({ width: 100, height: 100, radius: 10 });
    assert.ok(Math.abs(L - (400 - 80 + 2 * Math.PI * 10)) < 1e-9);
  });
  it('clamps radius to half the shorter side', () => {
    const L = roundedRectPerimeter({ width: 100, height: 40, radius: 999 });
    assert.ok(Math.abs(L - (280 - 160 + 2 * Math.PI * 20)) < 1e-9);
  });
  it('inset shrinks the box; degenerate size → 0', () => {
    assert.equal(roundedRectPerimeter({ width: 10, height: 10, radius: 0, inset: 5 }), 0);
  });
});
