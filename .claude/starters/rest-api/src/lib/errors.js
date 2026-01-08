/**
 * @file Custom Error Classes
 * @description Application-specific error types for consistent error handling
 */

/**
 * @typedef {Object} ValidationDetail
 * @property {string} path - JSON path to the invalid field
 * @property {string} message - Human-readable error message
 * @property {string} keyword - Validation keyword that failed
 */

/**
 * Base application error class
 * @extends Error
 */
export class AppError extends Error {
  /** @type {number} */
  statusCode;
  /** @type {string} */
  code;
  /** @type {unknown} */
  details;

  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Application error code
   * @param {unknown} [details] - Additional error details
   */
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * 404 Not Found error
 * @extends AppError
 */
export class NotFoundError extends AppError {
  /**
   * @param {string} [message] - Error message
   */
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * 400 Bad Request error
 * @extends AppError
 */
export class BadRequestError extends AppError {
  /**
   * @param {string} [message] - Error message
   * @param {unknown} [details] - Additional error details
   */
  constructor(message = 'Bad request', details = null) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

/**
 * 401 Unauthorized error
 * @extends AppError
 */
export class UnauthorizedError extends AppError {
  /**
   * @param {string} [message] - Error message
   */
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 Forbidden error
 * @extends AppError
 */
export class ForbiddenError extends AppError {
  /**
   * @param {string} [message] - Error message
   */
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * 409 Conflict error
 * @extends AppError
 */
export class ConflictError extends AppError {
  /**
   * @param {string} [message] - Error message
   */
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * 422 Validation error
 * @extends AppError
 */
export class ValidationError extends AppError {
  /**
   * @param {string} [message] - Error message
   * @param {ValidationDetail[] | null} [details] - Validation error details
   */
  constructor(message = 'Validation failed', details = null) {
    super(message, 422, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}
