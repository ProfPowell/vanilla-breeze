// @ts-nocheck -- unit test fakes (getComputedStyle, partial style objects) intentionally diverge from DOM types
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { roundedRectPerimeter } from '../../src/lib/perimeter.js';
import { roundedRectPath } from '../../src/lib/perimeter.js';
import { roundedRectSampler } from '../../src/lib/perimeter.js';
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
import { perimeterPath, perimeterSampler } from '../../src/lib/perimeter.js';
import { roundedRectShape, tracePath, traceLength, traceSampler } from '../../src/lib/perimeter.js';
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

describe('roundedRectShape — asymmetric & elliptical', () => {
  it('per-corner radii emit their own arcs; a zero corner is sharp', () => {
    const shape = roundedRectShape({
      width: 100, height: 100,
      corners: [[10, 10], [20, 20], [0, 0], [30, 30]],
    });
    const d = tracePath(shape);
    assert.match(d, /A10 10 0 0 1/); // TL
    assert.match(d, /A20 20 0 0 1/); // TR
    assert.match(d, /A30 30 0 0 1/); // BL
    assert.ok(!/A0 0/.test(d));      // BR sharp: no zero-radius arc
    assert.match(d, /Z$/);
  });

  it('elliptical corner emits A rx ry and samples onto the ellipse', () => {
    const shape = roundedRectShape({ width: 100, height: 100, corners: [[0, 0], [20, 10], [0, 0], [0, 0]] });
    const d = tracePath(shape);
    assert.match(d, /A20 10 0 0 1/);
    const total = traceLength(shape);
    const topEdgeLen = 100 - 0 - 20; // start (0,0)->(80,0)
    const sampler = traceSampler(shape);
    const [x, y] = sampler((topEdgeLen + 5) / total);
    const e = ((x - 80) / 20) ** 2 + ((y - 10) / 10) ** 2;
    assert.ok(Math.abs(e - 1) < 0.05, `point not on ellipse: e=${e}`);
  });

  it('overlap clamp scales radii so opposite corners do not overlap', () => {
    // 100x100, all corners 80 → top sum 160 > 100 → f = 100/160 = 0.625 → r = 50.
    const d = tracePath(roundedRectShape({ width: 100, height: 100, corners: [[80, 80], [80, 80], [80, 80], [80, 80]] }));
    assert.match(d, /A50 50 0 0 1/);
  });

  it('asymmetric perimeter ≈ straight edges + quarter-arc lengths', () => {
    const L = traceLength(roundedRectShape({ width: 100, height: 100, corners: [[10, 10], [10, 10], [10, 10], [10, 10]] }));
    assert.ok(Math.abs(L - (4 * 80 + 2 * Math.PI * 10)) < 1e-9);
  });
});

import { polygonShape, circleShape, ellipseShape } from '../../src/lib/perimeter.js';
import { insetShape, pathShape } from '../../src/lib/perimeter.js';

describe('polygonShape', () => {
  it('traces a closed triangle with line segments', () => {
    const shape = polygonShape([[0, 0], [100, 0], [50, 100]]);
    const d = tracePath(shape);
    assert.ok(d.startsWith('M0 0'));
    assert.match(d, /Z$/);
    assert.ok(!/A/.test(d)); // no arcs
    const L = traceLength(shape);
    assert.ok(Math.abs(L - (100 + 2 * Math.hypot(50, 100))) < 1e-9);
  });
  it('sampler starts at the first point', () => {
    const s = traceSampler(polygonShape([[0, 0], [100, 0], [50, 100]]));
    assert.deepEqual(s(0).map((v) => Math.round(v)), [0, 0]);
  });
});

describe('circleShape / ellipseShape', () => {
  it('circle length ≈ 2πr and points satisfy the circle equation', () => {
    const shape = circleShape({ cx: 50, cy: 50, r: 50 });
    assert.ok(Math.abs(traceLength(shape) - 2 * Math.PI * 50) < 1e-6);
    const s = traceSampler(shape);
    for (const t of [0, 0.2, 0.5, 0.85]) {
      const [x, y] = s(t);
      assert.ok(Math.abs(Math.hypot(x - 50, y - 50) - 50) < 1e-6);
    }
    assert.deepEqual(s(0).map((v) => Math.round(v)), [50, 0]); // top
  });
  it('ellipse emits A rx ry and samples roughly onto the ellipse', () => {
    const shape = ellipseShape({ cx: 50, cy: 50, rx: 50, ry: 25 });
    assert.match(tracePath(shape), /A50 25 0 0 1/);
    const s = traceSampler(shape);
    const [x, y] = s(0.1);
    const e = ((x - 50) / 50) ** 2 + ((y - 50) / 25) ** 2;
    assert.ok(Math.abs(e - 1) < 0.02);
  });
});

describe('insetShape', () => {
  it('equals roundedRectShape on the inset box, shifted into place', () => {
    const got = tracePath(insetShape({ top: 10, right: 10, bottom: 10, left: 10, corners: [[5, 5], [5, 5], [5, 5], [5, 5]] }, { width: 100, height: 100 }));
    assert.ok(got.startsWith('M15 10'), got);
    assert.match(got, /A5 5 0 0 1/);
  });
});

describe('pathShape', () => {
  it('traces a closed straight-line triangle', () => {
    const shape = pathShape('M0 0 L100 0 L100 100 Z');
    const d = tracePath(shape);
    assert.ok(d.startsWith('M0 0'));
    assert.match(d, /Z$/);
    const L = traceLength(shape);
    assert.ok(Math.abs(L - (100 + 100 + Math.hypot(100, 100))) < 1e-9);
  });
  it('flattens a cubic and measures a sane length', () => {
    const shape = pathShape('M0 0 C10 0 20 0 30 0');
    assert.ok(Math.abs(traceLength(shape) - 30) < 1e-6);
  });
  it('handles relative commands', () => {
    const shape = pathShape('M10 10 l10 0 l0 10 z');
    const s = traceSampler(shape);
    assert.deepEqual(s(0).map((v) => Math.round(v)), [10, 10]);
    assert.ok(Math.abs(traceLength(shape) - (10 + 10 + Math.hypot(10, 10))) < 1e-9);
  });
});

import { shapeShape } from '../../src/lib/perimeter.js';

describe('shapeShape', () => {
  it('matches the equivalent pathShape for a straight triangle', () => {
    const viaShape = shapeShape([
      { verb: 'from', to: [0, 0] },
      { verb: 'line', to: [100, 0] },
      { verb: 'line', to: [100, 100] },
      { verb: 'close' },
    ]);
    const viaPath = pathShape('M0 0 L100 0 L100 100 Z');
    assert.equal(tracePath(viaShape), tracePath(viaPath));
    assert.ok(Math.abs(traceLength(viaShape) - traceLength(viaPath)) < 1e-9);
  });
  it('supports hline/vline and a cubic curve', () => {
    const shape = shapeShape([
      { verb: 'from', to: [0, 0] },
      { verb: 'hline', x: 100 },
      { verb: 'curve', to: [100, 100], via: [[100, 33], [100, 66]] },
      { verb: 'vline', y: 0 },
      { verb: 'close' },
    ]);
    const d = tracePath(shape);
    assert.ok(d.startsWith('M0 0'));
    assert.match(d, /C100 33 100 66 100 100/);
    assert.match(d, /Z$/);
  });
});

import { parseClipPath } from '../../src/lib/perimeter.js';

describe('parseClipPath', () => {
  it('returns null for none', () => {
    assert.equal(parseClipPath('none', { width: 100, height: 100 }), null);
  });
  it('parses polygon with %', () => {
    const shape = parseClipPath('polygon(0% 0%, 100% 0%, 50% 100%)', { width: 100, height: 100 });
    assert.equal(tracePath(shape), tracePath(polygonShape([[0, 0], [100, 0], [50, 100]])));
  });
  it('parses circle at center', () => {
    const shape = parseClipPath('circle(40px at 50% 50%)', { width: 100, height: 100 });
    assert.ok(Math.abs(traceLength(shape) - 2 * Math.PI * 40) < 1e-6);
  });
  it('parses inset with round', () => {
    const shape = parseClipPath('inset(10px round 5px)', { width: 100, height: 100 });
    assert.ok(tracePath(shape).startsWith('M15 10'));
  });
});

describe('DOM wrappers — shape detection', () => {
  afterEach(() => { delete globalThis.getComputedStyle; });
  it('perimeterPath traces clip-path polygon when present', () => {
    globalThis.getComputedStyle = () => ({ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' });
    const host = { getBoundingClientRect: () => ({ width: 100, height: 100 }) };
    assert.equal(perimeterPath(host), tracePath(polygonShape([[0, 0], [100, 0], [50, 100]])));
  });
  it('perimeterPath reads per-corner radii when no clip-path', () => {
    globalThis.getComputedStyle = () => ({
      clipPath: 'none',
      borderTopLeftRadius: '10px 20px',
      borderTopRightRadius: '0px',
      borderBottomRightRadius: '0px',
      borderBottomLeftRadius: '0px',
    });
    const host = { getBoundingClientRect: () => ({ width: 100, height: 100 }) };
    assert.match(perimeterPath(host), /A10 20 0 0 1/);
  });
});

describe('perimeter Phase 2 — review fixes', () => {
  afterEach(() => { delete globalThis.getComputedStyle; });

  it('a corner with one zero radius component (via inset) is square, with correct length', () => {
    const shape = roundedRectShape({ width: 100, height: 100, corners: [[5, 10], [0, 0], [0, 0], [0, 0]], inset: 5 });
    assert.deepEqual(shape.start.map((v) => Math.round(v)), [5, 5]);
    const d = tracePath(shape);
    assert.ok(!/A/.test(d), d);
    assert.ok(Math.abs(traceLength(shape) - 360) < 1e-9, String(traceLength(shape)));
  });

  it('tracePath keeps a trailing line that does NOT return to start (open path)', () => {
    const open = pathShape('M0 0 L100 0 L100 100');
    assert.equal(tracePath(open), 'M0 0H100V100Z');
  });

  it('circle() with a closest-side keyword radius defaults to half the shorter side', () => {
    const shape = parseClipPath('circle(closest-side at 50% 50%)', { width: 100, height: 60 });
    assert.ok(Math.abs(traceLength(shape) - 2 * Math.PI * 30) < 1e-6, String(traceLength(shape)));
  });

  it('inset() round expands multi-value border-radius shorthand per corner', () => {
    const shape = parseClipPath('inset(0px round 10px 20px)', { width: 200, height: 200 });
    const d = tracePath(shape);
    assert.match(d, /A10 10 0 0 1/);
    assert.match(d, /A20 20 0 0 1/);
  });
});
