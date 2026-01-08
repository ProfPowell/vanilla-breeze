/**
 * @file Authentication Middleware
 * @description JWT token verification and role-based authorization
 */

import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { UnauthorizedError, ForbiddenError } from '../../lib/errors.js';

/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * @typedef {Object} JwtPayload
 * @property {string} sub - Subject (user ID)
 * @property {string} [role] - User role
 * @property {number} [iat] - Issued at timestamp
 * @property {number} [exp] - Expiration timestamp
 */

/**
 * @typedef {Request & { user?: JwtPayload }} AuthenticatedRequest
 */

/**
 * Verify JWT token and attach user to request
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Next middleware
 * @returns {void}
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing authentication token');
  }

  const token = authHeader.slice(7);

  try {
    const payload = /** @type {JwtPayload} */ (jwt.verify(token, config.jwt.secret));
    // @ts-ignore - Adding user property to request
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    }
    throw new UnauthorizedError('Invalid token');
  }
}

/**
 * Check if user has required role(s)
 * @param {...string} roles - Required roles
 * @returns {(req: AuthenticatedRequest, res: Response, next: NextFunction) => void}
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
}
