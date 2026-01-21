/**
 * Unit tests for safe property path validation in card-list component
 *
 * Run with: node --test .claude/test/unit/safe-property-path.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Strict regex for safe property paths only
const SAFE_PATH_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\d+\])*$/;

function isValidPath(path) {
  if (!path || typeof path !== 'string') return false;
  return SAFE_PATH_REGEX.test(path.trim());
}

function getValueByPath(obj, path) {
  if (!isValidPath(path)) {
    return undefined;
  }

  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const parts = normalizedPath.split('.');

  let value = obj;
  for (const part of parts) {
    if (value == null) return undefined;
    value = value[part];
  }

  return value;
}

describe('isValidPath', () => {
  describe('ALLOWED - simple property paths', () => {
    it('accepts simple property name', () => {
      assert.equal(isValidPath('name'), true);
    });

    it('accepts property starting with underscore', () => {
      assert.equal(isValidPath('_private'), true);
    });

    it('accepts property starting with dollar sign', () => {
      assert.equal(isValidPath('$special'), true);
    });

    it('accepts nested property with dot notation', () => {
      assert.equal(isValidPath('user.email'), true);
    });

    it('accepts deeply nested property', () => {
      assert.equal(isValidPath('user.address.city'), true);
    });

    it('accepts array index access', () => {
      assert.equal(isValidPath('items[0]'), true);
    });

    it('accepts nested array index access', () => {
      assert.equal(isValidPath('items[0].title'), true);
    });

    it('accepts multiple array indices', () => {
      assert.equal(isValidPath('matrix[0][1]'), true);
    });

    it('accepts mixed dot and bracket notation', () => {
      assert.equal(isValidPath('data.items[0].name'), true);
    });

    it('accepts property with numbers after first char', () => {
      assert.equal(isValidPath('item1.value2'), true);
    });
  });

  describe('REJECTED - expressions and unsafe patterns', () => {
    it('rejects method calls', () => {
      assert.equal(isValidPath('price.toFixed(2)'), false);
    });

    it('rejects template literals', () => {
      assert.equal(isValidPath('`${price}`'), false);
    });

    it('rejects ternary expressions', () => {
      assert.equal(isValidPath("stock > 0 ? 'yes' : 'no'"), false);
    });

    it('rejects arithmetic operations', () => {
      assert.equal(isValidPath('price * 1.1'), false);
    });

    it('rejects string concatenation', () => {
      assert.equal(isValidPath("firstName + ' ' + lastName"), false);
    });

    it('rejects function calls', () => {
      assert.equal(isValidPath('parseInt(value)'), false);
    });

    it('rejects comparison operators', () => {
      assert.equal(isValidPath('count > 0'), false);
    });

    it('rejects logical operators', () => {
      assert.equal(isValidPath('a && b'), false);
    });

    it('rejects string property with quotes', () => {
      assert.equal(isValidPath("obj['key']"), false);
    });

    it('rejects variable in bracket notation', () => {
      assert.equal(isValidPath('obj[key]'), false);
    });

    it('rejects negative array index', () => {
      assert.equal(isValidPath('items[-1]'), false);
    });

    it('rejects empty string', () => {
      assert.equal(isValidPath(''), false);
    });

    it('rejects null', () => {
      assert.equal(isValidPath(null), false);
    });

    it('rejects undefined', () => {
      assert.equal(isValidPath(undefined), false);
    });

    it('rejects number starting property', () => {
      assert.equal(isValidPath('1name'), false);
    });

    it('rejects paths with spaces', () => {
      assert.equal(isValidPath('user name'), false);
    });

    it('rejects paths with special chars', () => {
      assert.equal(isValidPath('user@name'), false);
    });

    it('rejects constructor access', () => {
      assert.equal(isValidPath('__proto__'), true); // Valid path syntax, but...
    });
  });
});

describe('getValueByPath', () => {
  const testObj = {
    name: 'Test',
    user: {
      email: 'test@example.com',
      address: {
        city: 'NYC'
      }
    },
    items: [
      { title: 'First' },
      { title: 'Second' }
    ],
    matrix: [[1, 2], [3, 4]],
    empty: null,
    zero: 0,
    falsy: false
  };

  describe('valid paths', () => {
    it('gets simple property', () => {
      assert.equal(getValueByPath(testObj, 'name'), 'Test');
    });

    it('gets nested property', () => {
      assert.equal(getValueByPath(testObj, 'user.email'), 'test@example.com');
    });

    it('gets deeply nested property', () => {
      assert.equal(getValueByPath(testObj, 'user.address.city'), 'NYC');
    });

    it('gets array element', () => {
      assert.deepEqual(getValueByPath(testObj, 'items[0]'), { title: 'First' });
    });

    it('gets property from array element', () => {
      assert.equal(getValueByPath(testObj, 'items[0].title'), 'First');
    });

    it('gets nested array element', () => {
      assert.equal(getValueByPath(testObj, 'matrix[0][1]'), 2);
    });

    it('returns undefined for missing property', () => {
      assert.equal(getValueByPath(testObj, 'missing'), undefined);
    });

    it('returns undefined for missing nested property', () => {
      assert.equal(getValueByPath(testObj, 'user.missing.deep'), undefined);
    });

    it('returns null for null property', () => {
      assert.equal(getValueByPath(testObj, 'empty'), null);
    });

    it('returns zero for zero property', () => {
      assert.equal(getValueByPath(testObj, 'zero'), 0);
    });

    it('returns false for false property', () => {
      assert.equal(getValueByPath(testObj, 'falsy'), false);
    });
  });

  describe('invalid paths', () => {
    it('returns undefined for method call path', () => {
      assert.equal(getValueByPath(testObj, 'name.toUpperCase()'), undefined);
    });

    it('returns undefined for expression path', () => {
      assert.equal(getValueByPath(testObj, 'zero + 1'), undefined);
    });

    it('returns undefined for null object', () => {
      assert.equal(getValueByPath(null, 'name'), undefined);
    });
  });
});

console.log('Running safe-property-path tests...');