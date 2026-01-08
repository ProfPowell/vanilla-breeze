/**
 * @file Validator Module
 * @description AJV-based JSON Schema validation with schema registry
 */

// @ts-ignore - AJV default export typing issue
import Ajv from 'ajv';
// @ts-ignore - AJV formats default export typing issue
import addFormats from 'ajv-formats';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {import('ajv').ValidateFunction} ValidateFunction
 * @typedef {import('ajv').ErrorObject} ErrorObject
 */

/**
 * Create configured AJV instance with all schemas loaded
 */
function createValidator() {
  const ajv = new Ajv({
    allErrors: true,           // Report all errors, not just first
    removeAdditional: 'all',   // Strip unknown properties (security)
    useDefaults: true,         // Apply default values from schema
    coerceTypes: false,        // Strict typing - no coercion
    strict: true               // Strict mode for schema validation
  });

  // Add standard formats (email, uri, date-time, uuid, etc.)
  addFormats(ajv);

  // Add custom formats
  addCustomFormats(ajv);

  // Load all schemas from /schemas directory
  loadSchemas(ajv);

  return ajv;
}

/**
 * Add project-specific format validators
 * @param {Ajv} ajv
 */
function addCustomFormats(ajv) {
  // Phone number (E.164 format)
  ajv.addFormat('phone', {
    type: 'string',
    validate: (x) => /^\+[1-9]\d{1,14}$/.test(x)
  });

  // URL-safe slug
  ajv.addFormat('slug', {
    type: 'string',
    validate: (x) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x)
  });
}

/**
 * Load all schemas from /schemas directory
 * @param {Ajv} ajv
 */
function loadSchemas(ajv) {
  const schemasDir = join(__dirname, '../../schemas');

  try {
    loadSchemasRecursive(ajv, schemasDir);
  } catch (err) {
    // Schemas directory may not exist yet
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

/**
 * Recursively load schemas from directory
 * @param {Ajv} ajv
 * @param {string} dir
 */
function loadSchemasRecursive(ajv, dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);

    if (statSync(fullPath).isDirectory()) {
      loadSchemasRecursive(ajv, fullPath);
    } else if (entry.endsWith('.schema.json')) {
      const schema = JSON.parse(readFileSync(fullPath, 'utf-8'));
      if (schema.$id) {
        ajv.addSchema(schema);
      }
    }
  }
}

/** @type {Ajv | null} */
let validatorInstance = null;

/**
 * Get shared validator instance (compile once at startup)
 * @returns {Ajv}
 */
export function getValidator() {
  if (!validatorInstance) {
    validatorInstance = createValidator();
  }
  return validatorInstance;
}

/**
 * Get a compiled validator function for a schema
 * @param {string} schemaId - Schema $id (e.g., "api/login", "entities/user.create")
 * @returns {ValidateFunction}
 * @throws {Error} If schema not found
 */
export function getSchema(schemaId) {
  const ajv = getValidator();
  const validate = ajv.getSchema(schemaId);

  if (!validate) {
    throw new Error(`Schema not found: ${schemaId}`);
  }

  return validate;
}

/**
 * Format AJV errors to human-readable messages
 * @param {ErrorObject[]} errors
 * @returns {Array<{path: string, message: string, keyword: string}>}
 */
export function formatErrors(errors) {
  return errors.map(error => ({
    path: error.instancePath || '/',
    message: getErrorMessage(error),
    keyword: error.keyword
  }));
}

/**
 * Generate human-readable error message from AJV error
 * @param {ErrorObject} error
 * @returns {string}
 */
function getErrorMessage(error) {
  switch (error.keyword) {
    case 'required':
      return `Missing required field: ${error.params.missingProperty}`;
    case 'type':
      return `Expected ${error.params.type}`;
    case 'format':
      return `Invalid ${error.params.format} format`;
    case 'enum':
      return `Must be one of: ${error.params.allowedValues.join(', ')}`;
    case 'minLength':
      return `Must be at least ${error.params.limit} characters`;
    case 'maxLength':
      return `Must be at most ${error.params.limit} characters`;
    case 'minimum':
      return `Must be >= ${error.params.limit}`;
    case 'maximum':
      return `Must be <= ${error.params.limit}`;
    case 'pattern':
      return 'Does not match required pattern';
    case 'additionalProperties':
      return `Unknown field: ${error.params.additionalProperty}`;
    case 'minProperties':
      return 'At least one field is required';
    default:
      return error.message || 'Invalid value';
  }
}
