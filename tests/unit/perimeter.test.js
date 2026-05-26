import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { roundedRectPerimeter } from '../../src/lib/perimeter.js';
import { roundedRectPath } from '../../src/lib/perimeter.js';
import { roundedRectSampler } from '../../src/lib/perimeter.js';
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
import { perimeterPath, perimeterSampler } from '../../src/lib/perimeter.js';
import { afterEach } from 'node:test';

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

describe('roundedRectPath', () => {
  it('r=0 is a sharp rectangle (no arcs), closed', () => {
    assert.equal(roundedRectPath({ width: 100, height: 50, radius: 0 }), 'M0 0H100V50H0Z');
  });
  it('r>0 contains arc commands and is closed', () => {
    const d = roundedRectPath({ width: 100, height: 100, radius: 10 });
    assert.match(d, /A10 10 0 0 1/);
    assert.match(d, /Z$/);
    assert.ok(d.startsWith('M10 0'));
  });
  it('applies inset (origin shifts in by inset)', () => {
    assert.equal(roundedRectPath({ width: 100, height: 100, radius: 0, inset: 5 }), 'M5 5H95V95H5Z');
  });
  it('degenerate size → empty path', () => {
    assert.equal(roundedRectPath({ width: 0, height: 10, radius: 0 }), '');
  });
});

describe('roundedRectSampler', () => {
  it('sharp rect: t=0 top-left, clockwise, wraps', () => {
    const s = roundedRectSampler({ width: 100, height: 100, radius: 0 });
    assert.ok(near(s(0)[0], 0) && near(s(0)[1], 0));
    assert.ok(near(s(0.25)[0], 100) && near(s(0.25)[1], 0));
    assert.ok(near(s(0.5)[0], 100) && near(s(0.5)[1], 100));
    assert.ok(near(s(1)[0], s(0)[0]) && near(s(1)[1], s(0)[1]));
  });
  it('rounded: t=0 is the top edge start (r,0)', () => {
    const s = roundedRectSampler({ width: 100, height: 100, radius: 10 });
    assert.ok(near(s(0)[0], 10) && near(s(0)[1], 0));
  });
  it('rounded: a point in the top-right corner arc lies on that arc', () => {
    const r = 10, w = 100, h = 100;
    const s = roundedRectSampler({ width: w, height: h, radius: r });
    const Ltop = w - 2 * r, Lcorner = (Math.PI / 2) * r;
    const L = roundedRectPerimeter({ width: w, height: h, radius: r });
    const [x, y] = s((Ltop + Lcorner / 2) / L);
    assert.ok(near(Math.hypot(x - (w - r), y - r), r, 1e-6));
  });
});

describe('roundedRectPath — rounded + inset + clamp', () => {
  it('rounded rect with inset shifts origin and shrinks radius', () => {
    // inset 5 on 100x100, radius 20 → origin 5, inner 90x90, r = 20-5 = 15
    const d = roundedRectPath({ width: 100, height: 100, radius: 20, inset: 5 });
    assert.ok(d.startsWith('M20 5'));          // ox+r = 5+15 = 20
    assert.match(d, /A15 15 0 0 1/);           // radius shrank to 15
  });
  it('clamps radius to half the shorter side in the path', () => {
    // 100x40 radius 999 → r clamps to 20; arc radius is 20
    const d = roundedRectPath({ width: 100, height: 40, radius: 999 });
    assert.match(d, /A20 20 0 0 1/);
  });
});

describe('roundedRectSampler — clamp', () => {
  it('clamps radius so the sampler still walks the full clamped perimeter', () => {
    const w = 100, h = 40, radius = 999;        // r clamps to 20
    const s = roundedRectSampler({ width: w, height: h, radius });
    // t=0 should be at top edge start (ox+r, oy) = (20, 0)
    const p = s(0);
    assert.ok(Math.abs(p[0] - 20) < 1e-6 && Math.abs(p[1] - 0) < 1e-6);
  });
});

describe('DOM wrappers', () => {
  afterEach(() => { delete globalThis.getComputedStyle; });
  const stubHost = (width, height, radiusPx) => {
    globalThis.getComputedStyle = () => ({ borderTopLeftRadius: `${radiusPx}px` });
    return { getBoundingClientRect: () => ({ width, height }) };
  };
  it('perimeterPath reads host box + uniform radius', () => {
    const host = stubHost(100, 50, 0);
    assert.equal(perimeterPath(host), roundedRectPath({ width: 100, height: 50, radius: 0 }));
  });
  it('perimeterSampler reads host + honors inset', () => {
    const host = stubHost(100, 100, 10);
    assert.deepEqual(perimeterSampler(host, 2)(0.3), roundedRectSampler({ width: 100, height: 100, radius: 10, inset: 2 })(0.3));
  });
});
