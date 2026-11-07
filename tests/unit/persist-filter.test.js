/**
 * isPersistable() — the shared privacy filter behind data-autosave and
 * data-wizard-persist (src/utils/_persist-filter.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPersistable } from '../../src/utils/_persist-filter.js';

/**
 * Minimal element stand-in.
 * @param {string} localName
 * @param {Record<string, string>} [attrs]
 * @param {{ ignoredAncestor?: boolean }} [opts]
 */
function el(localName, attrs = {}, opts = {}) {
  return /** @type {any} */ ({
    localName,
    type: localName === 'input' ? (attrs.type ?? 'text') : undefined,
    getAttribute: (n) => (n in attrs ? attrs[n] : null),
    hasAttribute: (n) => n in attrs,
    closest: (sel) => (sel === '[data-autosave-ignore]' && (opts.ignoredAncestor || 'data-autosave-ignore' in attrs) ? {} : null),
  });
}

test('ordinary value controls are persistable', () => {
  for (const type of ['text', 'email', 'search', 'checkbox', 'radio', 'number', 'date', 'range', 'color']) {
    assert.equal(isPersistable(el('input', { type })), true, type);
  }
  assert.equal(isPersistable(el('textarea')), true);
  assert.equal(isPersistable(el('select')), true);
  assert.equal(isPersistable(el('combo-box')), true, 'form-associated custom element');
});

test('password, hidden and file inputs are never persisted', () => {
  for (const type of ['password', 'hidden', 'file']) {
    assert.equal(isPersistable(el('input', { type })), false, type);
  }
});

test('buttons and non-value elements are never persisted', () => {
  assert.equal(isPersistable(el('button')), false);
  for (const type of ['submit', 'button', 'reset', 'image']) {
    assert.equal(isPersistable(el('input', { type })), false, type);
  }
  assert.equal(isPersistable(el('fieldset')), false);
  assert.equal(isPersistable(el('output')), false);
  assert.equal(isPersistable(el('object')), false);
});

test('autocomplete="off" and secret autocomplete tokens are skipped', () => {
  assert.equal(isPersistable(el('input', { autocomplete: 'off' })), false);
  assert.equal(isPersistable(el('input', { autocomplete: 'OFF' })), false);
  for (const token of ['cc-number', 'cc-csc', 'cc-exp', 'cc-exp-month', 'cc-exp-year', 'one-time-code', 'new-password', 'current-password']) {
    assert.equal(isPersistable(el('input', { autocomplete: token })), false, token);
  }
  assert.equal(isPersistable(el('input', { autocomplete: 'section-pay billing cc-number' })), false, 'token in a list');
  assert.equal(isPersistable(el('input', { autocomplete: 'email' })), true);
  assert.equal(isPersistable(el('input', { autocomplete: 'cc-name' })), true, 'cardholder name is not a secret');
});

test('data-autosave-ignore on the control or an ancestor opts out', () => {
  assert.equal(isPersistable(el('input', { 'data-autosave-ignore': '' })), false);
  assert.equal(isPersistable(el('textarea', {}, { ignoredAncestor: true })), false);
});

test('null-safe', () => {
  assert.equal(isPersistable(null), false);
  assert.equal(isPersistable(undefined), false);
});
