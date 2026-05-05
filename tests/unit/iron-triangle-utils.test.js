/**
 * Unit tests for src/web-components/iron-triangle/_capacity.js
 *
 * Pure functions — no DOM needed. Covers default formula, formula
 * text, stable JSON serialization, and FNV-1a hash determinism.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
