/**
 * Auth Service
 * JWT token generation and verification
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../lib/errors.js';

/**
 * Generate access token
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */
export function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */
export function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      type: 'refresh'
    },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

/**
 * Generate both tokens
 * @param {Object} user - User object
 * @returns {{accessToken: string, refreshToken: string}}
 */
export function generateTokens(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
}

/**
 * Verify and decode token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {UnauthorizedError} If token is invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    }
    throw new UnauthorizedError('Invalid token');
  }
}

/**
 * Verify access token specifically
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {UnauthorizedError} If token is invalid or not an access token
 */
export function verifyAccessToken(token) {
  const payload = verifyToken(token);
  if (payload.type !== 'access') {
    throw new UnauthorizedError('Invalid token type');
  }
  return payload;
}

/**
 * Verify refresh token specifically
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {UnauthorizedError} If token is invalid or not a refresh token
 */
export function verifyRefreshToken(token) {
  const payload = verifyToken(token);
  if (payload.type !== 'refresh') {
    throw new UnauthorizedError('Invalid token type');
  }
  return payload;
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export function extractToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}