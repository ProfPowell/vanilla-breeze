/**
 * Shared condition language for data-show-when and data-wizard-if
 * (src/lib/form-conditions.js): both separators, negation, && / ||.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCondition, conditionFields } from '../../src/lib/form-conditions.js';

const term = (name, value, negate = false) => ({ name, value, negate });

test('bare name and !name', () => {
  assert.deepEqual(parseCondition('newsletter'), [[term('newsletter', null)]]);
  assert.deepEqual(parseCondition('!newsletter'), [[term('newsletter', null, true)]]);
});

test('= and : are interchangeable', () => {
  assert.deepEqual(parseCondition('type=business'), [[term('type', 'business')]]);
  assert.deepEqual(parseCondition('type:business'), [[term('type', 'business')]]);
});

test('not-equals forms', () => {
  assert.deepEqual(parseCondition('plan!=free'), [[term('plan', 'free', true)]]);
  assert.deepEqual(parseCondition('plan:!free'), [[term('plan', 'free', true)]]);
  assert.deepEqual(parseCondition('plan=!free'), [[term('plan', 'free', true)]]);
});

test('value keeps later separators', () => {
  assert.deepEqual(parseCondition('time=10:30'), [[term('time', '10:30')]]);
});

test('&& binds tighter than ||', () => {
  assert.deepEqual(parseCondition('a:x && b:y || c:z'), [
    [term('a', 'x'), term('b', 'y')],
    [term('c', 'z')],
  ]);
});

test('empty condition parses to nothing', () => {
  assert.deepEqual(parseCondition(''), []);
});

test('conditionFields lists referenced names', () => {
  assert.deepEqual([...conditionFields('role=admin && !agree || plan:pro')], ['role', 'agree', 'plan']);
});
