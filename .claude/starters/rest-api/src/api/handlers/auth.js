/**
 * Auth Handlers
 * Authentication endpoints
 */

import * as userService from '../../services/user.js';
import * as authService from '../../services/auth.js';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
export async function register(req, res) {
  const { email, password, name } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }

  const user = await userService.create({ email, password, name });
  const tokens = authService.generateTokens(user);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    ...tokens
  });
}

/**
 * POST /api/v1/auth/login
 * Authenticate user and return tokens
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }

  // Find user with password
  const user = await userService.findByEmailWithPassword(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const valid = await userService.validateUserPassword(user, password);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate tokens
  const tokens = authService.generateTokens(user);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    ...tokens
  });
}

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
export async function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required');
  }

  // Verify refresh token
  const payload = authService.verifyRefreshToken(refreshToken);

  // Get user
  const user = await userService.findById(payload.sub);

  // Generate new tokens
  const tokens = authService.generateTokens(user);

  res.json(tokens);
}

/**
 * POST /api/v1/auth/logout
 * Logout user (client should discard tokens)
 */
export function logout(req, res) {
  // In a stateless JWT setup, logout is handled client-side
  // For stateful sessions, you would invalidate the session here
  res.json({ message: 'Logged out successfully' });
}

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
export async function me(req, res) {
  const user = await userService.findById(req.user.sub);

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.created_at
  });
}
