/**
 * @file Error Handling Middleware
 * @description Global error handler for Express applications
 */

import { logger } from '../../lib/logger.js';
import { config } from '../../config/index.js';
import { AppError } from '../../lib/errors.js';

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {Object} error - Error details
 * @property {string} error.code - Error code
 * @property {string} error.message - Error message
 * @property {unknown} [error.details] - Additional details
 * @property {string} [error.stack] - Stack trace (development only)
 */

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} _next - Next middleware (unused but required for Express error handlers)
 * @returns {void}
 */
export function errorHandler(err, req, res, _next) {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle known errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details })
      }
    });
    return;
  }

  // Handle validation errors (from external libraries)
  if (err.name === 'ValidationError') {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        // @ts-ignore - details may exist on validation errors
        details: err.details
      }
    });
    return;
  }

  // Handle unknown errors
  const isDev = config.env === 'development';

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred',
      ...(isDev && { stack: err.stack })
    }
  });
}
