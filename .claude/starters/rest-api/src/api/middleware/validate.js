/**
 * @file Validation Middleware
 * @description Express middleware for JSON Schema validation using AJV
 */

import { getSchema, formatErrors } from '../../lib/validator.js';
import { ValidationError, BadRequestError } from '../../lib/errors.js';

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * Create validation middleware for request body
 * @param {string} schemaId - Schema $id (e.g., "api/login", "entities/user.create")
 * @returns {(req: Request, res: Response, next: NextFunction) => void}
 */
export function validateBody(schemaId) {
  const validate = getSchema(schemaId);

  return (req, res, next) => {
    if (!validate(req.body)) {
      const errors = formatErrors(validate.errors || []);
      throw new ValidationError('Request validation failed', errors);
    }
    next();
  };
}

/**
 * Create validation middleware for query parameters
 * @param {string} schemaId - Schema $id
 * @returns {(req: Request, res: Response, next: NextFunction) => void}
 */
export function validateQuery(schemaId) {
  const validate = getSchema(schemaId);

  return (req, res, next) => {
    // Coerce query string values to schema types before validation
    const coerced = coerceQueryParams(
      /** @type {Record<string, string | undefined>} */ (req.query),
      /** @type {JsonSchema | undefined} */ (validate.schema)
    );

    if (!validate(coerced)) {
      const errors = formatErrors(validate.errors || []);
      throw new BadRequestError('Query parameter validation failed', errors);
    }

    // Replace query with coerced and validated values
    // @ts-ignore - Coerced query may contain non-string values
    req.query = coerced;
    next();
  };
}

/**
 * Create validation middleware for path parameters
 * @param {string} schemaId - Schema $id
 * @returns {(req: Request, res: Response, next: NextFunction) => void}
 */
export function validateParams(schemaId) {
  const validate = getSchema(schemaId);

  return (req, res, next) => {
    if (!validate(req.params)) {
      const errors = formatErrors(validate.errors || []);
      throw new BadRequestError('Path parameter validation failed', errors);
    }
    next();
  };
}

/**
 * @typedef {Object} JsonSchema
 * @property {Record<string, {type?: string}>} [properties]
 */

/**
 * Coerce query string values to schema types
 * Query params are always strings, this converts to number/boolean/array as needed
 * @param {Record<string, string | undefined>} query
 * @param {JsonSchema | undefined} schema
 * @returns {Record<string, unknown>}
 */
function coerceQueryParams(query, schema) {
  /** @type {Record<string, unknown>} */
  const result = { ...query };
  const properties = schema?.properties ?? {};

  for (const [key, value] of Object.entries(result)) {
    const propSchema = properties[key];
    if (!propSchema) continue;

    // Skip undefined/null values
    if (value === undefined || value === null) continue;

    // Coerce based on schema type
    if (propSchema.type === 'integer' || propSchema.type === 'number') {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        result[key] = num;
      }
    } else if (propSchema.type === 'boolean') {
      result[key] = value === 'true' || value === '1';
    } else if (propSchema.type === 'array' && typeof value === 'string') {
      result[key] = value.split(',').map((/** @type {string} */ v) => v.trim());
    }
  }

  return result;
}

/**
 * Validate data against a schema (for use in services/handlers)
 * @param {unknown} data - Data to validate
 * @param {string} schemaId - Schema $id
 * @throws {ValidationError} If validation fails
 */
export function validate(data, schemaId) {
  const validateFn = getSchema(schemaId);

  if (!validateFn(data)) {
    const errors = formatErrors(validateFn.errors || []);
    throw new ValidationError('Validation failed', errors);
  }
}
