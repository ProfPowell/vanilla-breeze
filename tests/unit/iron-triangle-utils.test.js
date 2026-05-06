/**
 * Unit tests for src/web-components/iron-triangle/_capacity.js
 *
 * Pure functions — no DOM needed. Covers default formula, formula
 * text, stable JSON serialization, and FNV-1a hash determinism.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  relativeMagnitudes,
  stretchFactors,
  triangleVertices,
  formatTimeSummary,
  formatCostSummary,
  formatScopeSummary,
  formatQualitySummary,
} from '../../src/web-components/iron-triangle/_triangle-geometry.js';
import {
  defaultFormula,
  defaultFormulaText,
  fnv1a,
  stableStringify,
  triangleHash,
} from '../../src/web-components/iron-triangle/_capacity.js';

describe('defaultFormula', () => {
  it('multiplies sprintCount × sprintWeeks × FTE × focus and ceils', () => {
    // 3 sprints × 2 weeks × 1 FTE × 0.6 = 3.6 → 4
    assert.equal(defaultFormula({ sprintCount: 3, sprintWeeks: 2 }, { teamFTE: 1 }, 0.6), 4);
  });

  it('falls back to sprintWeeks when sprintCount missing', () => {
    // 4 weeks × 2 FTE × 0.5 = 4
    assert.equal(defaultFormula({ sprintWeeks: 4 }, { teamFTE: 2 }, 0.5), 4);
  });

  it('returns 0 when any factor is missing or zero', () => {
    assert.equal(defaultFormula({}, { teamFTE: 1 }, 0.6), 0);
    assert.equal(defaultFormula({ sprintWeeks: 4 }, {}, 0.6), 0);
    assert.equal(defaultFormula({ sprintWeeks: 4 }, { teamFTE: 1 }, 0), 0);
  });

  it('clamps focus factor to 0..1', () => {
    // focus 1.5 clamps to 1; 5 weeks × 1 FTE × 1 = 5
    assert.equal(defaultFormula({ sprintWeeks: 5 }, { teamFTE: 1 }, 1.5), 5);
    // negative focus clamps to 0 → returns 0
    assert.equal(defaultFormula({ sprintWeeks: 5 }, { teamFTE: 1 }, -1), 0);
  });

  it('coerces string inputs without exploding', () => {
    assert.equal(defaultFormula({ sprintWeeks: '6' }, { teamFTE: '1' }, '0.5'), 3);
  });
});

describe('defaultFormulaText', () => {
  it('describes computation when inputs valid', () => {
    const text = defaultFormulaText({ sprintCount: 3, sprintWeeks: 2 }, { teamFTE: 1 }, 0.6);
    assert.match(text, /3 × 2wk = 6wk/);
    assert.match(text, /1 FTE/);
    assert.match(text, /0\.6/);
    assert.match(text, /4 points/);
  });

  it('asks for missing inputs when capacity is 0', () => {
    const text = defaultFormulaText({}, {}, 0.6);
    assert.match(text, /Set sprint length/);
  });
});

describe('stableStringify', () => {
  it('produces identical output regardless of key insertion order', () => {
    const a = { time: { sprintWeeks: 2, sprintCount: 3 }, cost: { teamFTE: 1 } };
    const b = { cost: { teamFTE: 1 }, time: { sprintCount: 3, sprintWeeks: 2 } };
    assert.equal(stableStringify(a), stableStringify(b));
  });

  it('handles nested arrays and primitives', () => {
    assert.equal(stableStringify([1, 'a', null, true]), '[1,"a",null,true]');
    assert.equal(stableStringify(null), 'null');
  });
});

describe('fnv1a + triangleHash', () => {
  it('is deterministic and short', () => {
    const h1 = fnv1a('hello');
    const h2 = fnv1a('hello');
    assert.equal(h1, h2);
    assert.match(h1, /^[0-9a-z]+$/);
  });

  it('produces same hash regardless of property order', () => {
    const a = triangleHash({ time: { sprintWeeks: 2 }, cost: { teamFTE: 1 }, scope: {} });
    const b = triangleHash({ scope: {}, cost: { teamFTE: 1 }, time: { sprintWeeks: 2 } });
    assert.equal(a, b);
  });

  it('produces different hash when a value changes', () => {
    const a = triangleHash({ time: { sprintWeeks: 2 }, cost: { teamFTE: 1 }, scope: {} });
    const b = triangleHash({ time: { sprintWeeks: 3 }, cost: { teamFTE: 1 }, scope: {} });
    assert.notEqual(a, b);
  });
});

// ── Triangle viz geometry ──────────────────────────────────────────

describe('relativeMagnitudes', () => {
  it('reduces each constraint to a comparable scalar', () => {
    const m = relativeMagnitudes({
      time: { sprintWeeks: 2, sprintCount: 3 },
      cost: { teamFTE: 1, hoursPerWeek: 40 },
      scope: { mustHaveCount: 4, shouldHaveCount: 2 },
    });
    assert.equal(m.t, 6);   // 3 * 2 weeks
    assert.equal(m.c, 40);  // 1 FTE * 40 hr/wk
    assert.equal(m.s, 5);   // 4 + 0.5*2
  });

  it('treats blanks as defaults (sprint counts default to 1, FTE to 0)', () => {
    const m = relativeMagnitudes({});
    assert.equal(m.t, 1);
    assert.equal(m.c, 0);
    assert.equal(m.s, 0);
  });
});

describe('stretchFactors', () => {
  it('returns equilateral 1.0 for all-zero magnitudes', () => {
    const fs = stretchFactors({ t: 0, c: 0, s: 0 });
    assert.deepEqual(fs, { time: 1, cost: 1, scope: 1 });
  });

  it('caps stretch at 1.45 for the largest magnitude', () => {
    const fs = stretchFactors({ t: 100, c: 1, s: 1 });
    assert.ok(fs.time <= 1.45 + 1e-6);
    assert.ok(fs.time >= 1.45 - 1e-6);
  });

  it('floors at 0.55 for non-positive magnitudes when others are positive', () => {
    const fs = stretchFactors({ t: 100, c: 100, s: 0 });
    assert.ok(fs.scope <= 0.55 + 1e-6 && fs.scope >= 0.55 - 1e-6);
  });

  it('produces equal factors when magnitudes are equal', () => {
    const fs = stretchFactors({ t: 10, c: 10, s: 10 });
    assert.equal(fs.time, fs.cost);
    assert.equal(fs.cost, fs.scope);
  });
});

describe('triangleVertices', () => {
  it('places SCOPE at top, TIME bottom-left, COST bottom-right', () => {
    const v = triangleVertices({
      time:  { sprintWeeks: 1, sprintCount: 1 },
      cost:  { teamFTE: 1 },
      scope: { mustHaveCount: 1 },
    }, 100);
    assert.ok(v.scope.y < 0, 'SCOPE should be above origin (negative y in SVG)');
    assert.ok(v.time.x < 0,  'TIME should be left of origin');
    assert.ok(v.cost.x > 0,  'COST should be right of origin');
    assert.ok(v.time.y > 0,  'TIME should be below origin');
    assert.ok(v.cost.y > 0,  'COST should be below origin');
  });

  it('produces a symmetric equilateral when magnitudes are equal', () => {
    // Equal magnitudes → equal stretch factors → bottom corners share y
    const v = triangleVertices({
      time:  { sprintWeeks: 1, sprintCount: 10 },           // t = 10
      cost:  { teamFTE: 0.25, hoursPerWeek: 40 },           // c = 10
      scope: { mustHaveCount: 10 },                         // s = 10
    }, 100);
    assert.ok(Math.abs(v.time.y - v.cost.y) < 1e-6);
    assert.ok(Math.abs(Math.abs(v.time.x) - v.cost.x) < 1e-6);
  });

  it('stretches a vertex outward when its constraint grows in isolation', () => {
    // Hold time + scope at the largest equal magnitude; COST starts
    // small (small stretch factor) and grows toward the cap (1.45).
    const small = triangleVertices({
      time:  { sprintWeeks: 1, sprintCount: 100 },     // t = 100 (max)
      cost:  { teamFTE: 0.1, hoursPerWeek: 40 },       // c = 4
      scope: { mustHaveCount: 100 },                   // s = 100
    }, 100);
    const large = triangleVertices({
      time:  { sprintWeeks: 1, sprintCount: 100 },     // t = 100
      cost:  { teamFTE: 2.5, hoursPerWeek: 40 },       // c = 100
      scope: { mustHaveCount: 100 },                   // s = 100
    }, 100);
    const dist = ({ x, y }) => Math.hypot(x, y);
    assert.ok(dist(large.cost) > dist(small.cost),
      'COST vertex should stretch outward as cost magnitude grows');
  });

  it('keeps every vertex within [0.55*radius, 1.45*radius] of origin', () => {
    const v = triangleVertices({
      time: { sprintWeeks: 100, sprintCount: 100 },
      cost: { teamFTE: 0 },
      scope: { mustHaveCount: 100 },
    }, 100);
    for (const k of ['time', 'cost', 'scope']) {
      const d = Math.hypot(v[k].x, v[k].y);
      assert.ok(d >= 55  - 1e-6, `${k} below floor: ${d}`);
      assert.ok(d <= 145 + 1e-6, `${k} above ceiling: ${d}`);
    }
  });

  it('returns a non-degenerate triangle for any input', () => {
    const v = triangleVertices({}, 100);
    // Three distinct vertices — pairwise distance > 0
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    assert.ok(d(v.time, v.cost)  > 10);
    assert.ok(d(v.cost, v.scope) > 10);
    assert.ok(d(v.scope, v.time) > 10);
  });
});

// ── Vertex summary formatters ──────────────────────────────────────

describe('formatTimeSummary', () => {
  it('combines sprintCount × sprintWeeks into total weeks', () => {
    assert.equal(formatTimeSummary({ sprintCount: 3, sprintWeeks: 2 }), '6 weeks (3 × 2wk)');
  });

  it('uses singular when only one sprint of one week', () => {
    assert.equal(formatTimeSummary({ sprintCount: 1, sprintWeeks: 1 }), '1 week');
  });

  it('falls back to deadline when sprints are unset', () => {
    assert.equal(formatTimeSummary({ deadline: '2026-12-31' }), 'until 2026-12-31');
  });

  it('returns "TBD" when nothing is set', () => {
    assert.equal(formatTimeSummary({}), 'TBD');
  });
});

describe('formatCostSummary', () => {
  it('combines FTE and budget tier with a separator', () => {
    assert.equal(formatCostSummary({ teamFTE: 2, budgetTier: 'small' }), '2 FTE · small');
  });

  it('drops missing fields gracefully', () => {
    assert.equal(formatCostSummary({ teamFTE: 1 }), '1 FTE');
    assert.equal(formatCostSummary({ budgetTier: 'medium' }), 'medium');
  });

  it('returns "TBD" when nothing is set', () => {
    assert.equal(formatCostSummary({}), 'TBD');
  });
});

describe('formatScopeSummary', () => {
  it('combines must and should counts', () => {
    assert.equal(formatScopeSummary({ mustHaveCount: 5, shouldHaveCount: 3 }), '5 must · 3 should');
  });

  it('handles a single category', () => {
    assert.equal(formatScopeSummary({ mustHaveCount: 5 }), '5 must-have');
    assert.equal(formatScopeSummary({ shouldHaveCount: 3 }), '3 should-have');
  });

  it('returns "TBD" when nothing is set', () => {
    assert.equal(formatScopeSummary({}), 'TBD');
  });
});

describe('formatQualitySummary', () => {
  it('returns the trimmed input when present', () => {
    assert.equal(formatQualitySummary('3 critical: perf, sec, a11y'), '3 critical: perf, sec, a11y');
  });

  it('returns the TBD fallback for empty / nullish', () => {
    assert.equal(formatQualitySummary(''), 'TBD — click to set');
    assert.equal(formatQualitySummary(null), 'TBD — click to set');
    assert.equal(formatQualitySummary('   '), 'TBD — click to set');
  });
});
