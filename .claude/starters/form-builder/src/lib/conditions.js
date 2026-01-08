/**
 * Conditional Logic Library
 * Evaluate field visibility conditions
 * @module lib/conditions
 */

/**
 * Condition operators
 */
const operators = {
  equals: (fieldValue, conditionValue) => {
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(conditionValue);
    }
    return fieldValue === conditionValue;
  },

  notEquals: (fieldValue, conditionValue) => {
    return !operators.equals(fieldValue, conditionValue);
  },

  contains: (fieldValue, conditionValue) => {
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(conditionValue);
    }
    if (typeof fieldValue === 'string') {
      return fieldValue.includes(conditionValue);
    }
    return false;
  },

  notContains: (fieldValue, conditionValue) => {
    return !operators.contains(fieldValue, conditionValue);
  },

  startsWith: (fieldValue, conditionValue) => {
    return String(fieldValue).startsWith(conditionValue);
  },

  endsWith: (fieldValue, conditionValue) => {
    return String(fieldValue).endsWith(conditionValue);
  },

  greaterThan: (fieldValue, conditionValue) => {
    return Number(fieldValue) > Number(conditionValue);
  },

  greaterThanOrEqual: (fieldValue, conditionValue) => {
    return Number(fieldValue) >= Number(conditionValue);
  },

  lessThan: (fieldValue, conditionValue) => {
    return Number(fieldValue) < Number(conditionValue);
  },

  lessThanOrEqual: (fieldValue, conditionValue) => {
    return Number(fieldValue) <= Number(conditionValue);
  },

  isEmpty: (fieldValue) => {
    if (fieldValue === null || fieldValue === undefined) return true;
    if (typeof fieldValue === 'string') return fieldValue.trim() === '';
    if (Array.isArray(fieldValue)) return fieldValue.length === 0;
    return false;
  },

  isNotEmpty: (fieldValue) => {
    return !operators.isEmpty(fieldValue);
  },

  matches: (fieldValue, pattern) => {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return regex.test(String(fieldValue));
  },

  isChecked: (fieldValue) => {
    return fieldValue === true || fieldValue === 'true' || fieldValue === '1';
  },

  isUnchecked: (fieldValue) => {
    return !operators.isChecked(fieldValue);
  }
};

/**
 * Evaluate a single condition
 * @param {Object} condition - Condition object
 * @param {Object} data - Form data
 * @returns {boolean}
 */
function evaluateSingleCondition(condition, data) {
  const fieldValue = data[condition.field];
  const operator = operators[condition.operator];

  if (!operator) {
    console.warn(`Unknown operator: ${condition.operator}`);
    return true;
  }

  return operator(fieldValue, condition.value);
}

/**
 * Evaluate a condition or group of conditions
 * @param {Object} condition - Condition configuration
 * @param {Object} data - Form data
 * @returns {boolean}
 */
export function evaluateCondition(condition, data) {
  if (!condition) return true;

  // Compound condition with 'and' or 'or'
  if (condition.operator === 'and' && condition.conditions) {
    return condition.conditions.every(c => evaluateCondition(c, data));
  }

  if (condition.operator === 'or' && condition.conditions) {
    return condition.conditions.some(c => evaluateCondition(c, data));
  }

  // Single condition
  if (condition.field && condition.operator) {
    return evaluateSingleCondition(condition, data);
  }

  // Invalid condition
  console.warn('Invalid condition:', condition);
  return true;
}

/**
 * Get all field dependencies from conditions
 * @param {Object} condition - Condition configuration
 * @returns {string[]} Field names
 */
export function getConditionDependencies(condition) {
  if (!condition) return [];

  const dependencies = [];

  if (condition.field) {
    dependencies.push(condition.field);
  }

  if (condition.conditions) {
    condition.conditions.forEach(c => {
      dependencies.push(...getConditionDependencies(c));
    });
  }

  return [...new Set(dependencies)];
}

/**
 * Create a condition object
 * @param {string} field - Field name
 * @param {string} operator - Operator name
 * @param {*} value - Condition value
 * @returns {Object}
 */
export function createCondition(field, operator, value) {
  return { field, operator, value };
}

/**
 * Create an AND group
 * @param {...Object} conditions - Conditions to combine
 * @returns {Object}
 */
export function and(...conditions) {
  return { operator: 'and', conditions };
}

/**
 * Create an OR group
 * @param {...Object} conditions - Conditions to combine
 * @returns {Object}
 */
export function or(...conditions) {
  return { operator: 'or', conditions };
}

export { operators };