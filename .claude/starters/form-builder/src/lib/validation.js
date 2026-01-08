/**
 * Form Validation Library
 * @module lib/validation
 */

/**
 * Built-in validation rules
 */
const rules = {
  required: (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  minLength: (value, min) => {
    if (!value) return true; // Let required handle empty
    return String(value).length >= min;
  },

  maxLength: (value, max) => {
    if (!value) return true;
    return String(value).length <= max;
  },

  min: (value, min) => {
    if (value === null || value === undefined || value === '') return true;
    return Number(value) >= min;
  },

  max: (value, max) => {
    if (value === null || value === undefined || value === '') return true;
    return Number(value) <= max;
  },

  pattern: (value, pattern) => {
    if (!value) return true;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return regex.test(String(value));
  },

  email: (value) => {
    if (!value) return true;
    // RFC 5322 simplified
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
  },

  url: (value) => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  phone: (value) => {
    if (!value) return true;
    // Accepts various phone formats
    return /^[\d\s\-+()]{7,20}$/.test(String(value));
  },

  date: (value) => {
    if (!value) return true;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  minDate: (value, minDate) => {
    if (!value) return true;
    return new Date(value) >= new Date(minDate);
  },

  maxDate: (value, maxDate) => {
    if (!value) return true;
    return new Date(value) <= new Date(maxDate);
  },

  fileSize: (file, maxBytes) => {
    if (!file) return true;
    if (Array.isArray(file)) {
      return file.every(f => f.size <= maxBytes);
    }
    return file.size <= maxBytes;
  },

  fileType: (file, allowedTypes) => {
    if (!file) return true;
    const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    if (Array.isArray(file)) {
      return file.every(f => types.some(t => f.type.match(t)));
    }
    return types.some(t => file.type.match(t));
  }
};

/**
 * Error messages for validation rules
 */
const messages = {
  required: 'This field is required',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must be no more than ${max} characters`,
  min: (min) => `Must be at least ${min}`,
  max: (max) => `Must be no more than ${max}`,
  pattern: 'Invalid format',
  email: 'Please enter a valid email address',
  url: 'Please enter a valid URL',
  phone: 'Please enter a valid phone number',
  date: 'Please enter a valid date',
  minDate: (min) => `Date must be on or after ${min}`,
  maxDate: (max) => `Date must be on or before ${max}`,
  fileSize: (max) => `File must be smaller than ${formatBytes(max)}`,
  fileType: (types) => `Allowed file types: ${types.join(', ')}`
};

/**
 * Format bytes to human readable
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate a single field
 * @param {Object} field - Field schema
 * @param {*} value - Field value
 * @returns {string|null} Error message or null if valid
 */
export function validateField(field, value) {
  // Required check
  if (field.required && !rules.required(value)) {
    return field.messages?.required || messages.required;
  }

  // Skip other validations if empty and not required
  if (!rules.required(value) && !field.required) {
    return null;
  }

  // Type-specific validation
  if (field.type === 'email' && !rules.email(value)) {
    return field.messages?.email || messages.email;
  }

  if (field.type === 'url' && !rules.url(value)) {
    return field.messages?.url || messages.url;
  }

  if (field.type === 'tel' && !rules.phone(value)) {
    return field.messages?.phone || messages.phone;
  }

  // Custom validation rules
  const validation = field.validation || {};

  if (validation.minLength && !rules.minLength(value, validation.minLength)) {
    return field.messages?.minLength || messages.minLength(validation.minLength);
  }

  if (validation.maxLength && !rules.maxLength(value, validation.maxLength)) {
    return field.messages?.maxLength || messages.maxLength(validation.maxLength);
  }

  if (validation.min !== undefined && !rules.min(value, validation.min)) {
    return field.messages?.min || messages.min(validation.min);
  }

  if (validation.max !== undefined && !rules.max(value, validation.max)) {
    return field.messages?.max || messages.max(validation.max);
  }

  if (validation.pattern && !rules.pattern(value, validation.pattern)) {
    return field.messages?.pattern || validation.patternMessage || messages.pattern;
  }

  // File validations
  if (field.type === 'file') {
    if (validation.maxSize && !rules.fileSize(value, validation.maxSize)) {
      return field.messages?.fileSize || messages.fileSize(validation.maxSize);
    }

    if (validation.accept && !rules.fileType(value, validation.accept)) {
      return field.messages?.fileType || messages.fileType(validation.accept);
    }
  }

  // Custom validator function
  if (typeof validation.custom === 'function') {
    const result = validation.custom(value, field);
    if (result !== true) {
      return result || 'Validation failed';
    }
  }

  return null;
}

/**
 * Validate entire form
 * @param {Object} schema - Form schema
 * @param {Object} data - Form data
 * @returns {{valid: boolean, errors: Object}}
 */
export function validateForm(schema, data) {
  const errors = {};

  for (const field of schema.fields) {
    // Skip hidden or conditionally hidden fields
    if (field.showWhen) {
      const { evaluateCondition } = require('./conditions.js');
      if (!evaluateCondition(field.showWhen, data)) {
        continue;
      }
    }

    const error = validateField(field, data[field.name]);
    if (error) {
      errors[field.name] = error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Add custom validation rule
 * @param {string} name - Rule name
 * @param {Function} validator - Validator function
 * @param {string|Function} message - Error message
 */
export function addRule(name, validator, message) {
  rules[name] = validator;
  messages[name] = message;
}

export { rules, messages };