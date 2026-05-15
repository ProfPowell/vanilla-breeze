/**
 * Unit tests for src/lib/data-toggle.js — pure attribute-flip logic.
 *
 * No DOM. Covers spec parsing (attribute / class:name shorthand),
 * value cycling per mode (boolean / aria-two-state / custom on/off).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseToggleSpec,
  nextValue,
  isBooleanAttr,
  isAriaTwoState,
} from '../../src/lib/data-toggle.js';

describe('parseToggleSpec', () => {
  it('parses a plain attribute name', () => {
    assert.deepEqual(parseToggleSpec('hidden'), { kind: 'attr', name: 'hidden' });
    assert.deepEqual(parseToggleSpec('aria-expanded'), { kind: 'attr', name: 'aria-expanded' });
    assert.deepEqual(parseToggleSpec('data-state'), { kind: 'attr', name: 'data-state' });
  });

  it('parses class:name shorthand', () => {
    assert.deepEqual(parseToggleSpec('class:open'), { kind: 'class', name: 'open' });
    assert.deepEqual(parseToggleSpec('class:is-active'), { kind: 'class', name: 'is-active' });
  });

  it('returns null for empty input', () => {
    assert.equal(parseToggleSpec(''), null);
    assert.equal(parseToggleSpec(null), null);
    assert.equal(parseToggleSpec(undefined), null);
  });
});

describe('isBooleanAttr', () => {
  it('recognizes the standard boolean attributes', () => {
    for (const a of ['hidden', 'disabled', 'open', 'checked', 'readonly']) {
      assert.equal(isBooleanAttr(a), true, a);
    }
  });
  it('rejects ARIA two-state attrs (those carry true/false strings)', () => {
    assert.equal(isBooleanAttr('aria-pressed'), false);
    assert.equal(isBooleanAttr('aria-expanded'), false);
  });
  it('rejects data-* and arbitrary attrs', () => {
    assert.equal(isBooleanAttr('data-state'), false);
    assert.equal(isBooleanAttr('foo'), false);
  });
});

describe('isAriaTwoState', () => {
  it('matches aria-pressed / aria-expanded / aria-selected / aria-checked', () => {
    assert.equal(isAriaTwoState('aria-pressed'), true);
    assert.equal(isAriaTwoState('aria-expanded'), true);
    assert.equal(isAriaTwoState('aria-selected'), true);
    assert.equal(isAriaTwoState('aria-checked'), true);
  });
  it('rejects non-ARIA + non-boolean ARIA', () => {
    assert.equal(isAriaTwoState('aria-label'), false);
    assert.equal(isAriaTwoState('hidden'), false);
  });
});

describe('nextValue — boolean mode (presence)', () => {
  it('flips: present → absent', () => {
    assert.deepEqual(nextValue({ kind: 'attr', name: 'hidden' }, true, {}), { present: false });
  });
  it('flips: absent → present (empty string value)', () => {
    assert.deepEqual(nextValue({ kind: 'attr', name: 'hidden' }, false, {}), { present: true, value: '' });
  });
});

describe('nextValue — ARIA two-state', () => {
  it('flips "true" ↔ "false" via the value', () => {
    assert.deepEqual(
      nextValue({ kind: 'attr', name: 'aria-pressed' }, 'true', {}),
      { present: true, value: 'false' },
    );
    assert.deepEqual(
      nextValue({ kind: 'attr', name: 'aria-pressed' }, 'false', {}),
      { present: true, value: 'true' },
    );
  });
  it('treats null/missing as "false" → flips to "true"', () => {
    assert.deepEqual(
      nextValue({ kind: 'attr', name: 'aria-pressed' }, null, {}),
      { present: true, value: 'true' },
    );
  });
});

describe('nextValue — custom on/off', () => {
  it('cycles between explicit on/off values', () => {
    const opts = { on: 'open', off: 'closed' };
    assert.deepEqual(
      nextValue({ kind: 'attr', name: 'data-state' }, 'closed', opts),
      { present: true, value: 'open' },
    );
    assert.deepEqual(
      nextValue({ kind: 'attr', name: 'data-state' }, 'open', opts),
      { present: true, value: 'closed' },
    );
  });
  it('starts at "on" when current value is unset / unrecognized', () => {
    const opts = { on: 'open', off: 'closed' };
    assert.deepEqual(
      nextValue({ kind: 'attr', name: 'data-state' }, null, opts),
      { present: true, value: 'open' },
    );
    assert.deepEqual(
      nextValue({ kind: 'attr', name: 'data-state' }, 'weird', opts),
      { present: true, value: 'open' },
    );
  });
});

describe('nextValue — class mode', () => {
  it('returns presence flip; engine toggles classList', () => {
    assert.deepEqual(nextValue({ kind: 'class', name: 'open' }, true, {}),  { present: false });
    assert.deepEqual(nextValue({ kind: 'class', name: 'open' }, false, {}), { present: true });
  });
});
