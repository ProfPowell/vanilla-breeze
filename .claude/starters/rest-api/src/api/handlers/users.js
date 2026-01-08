/**
 * User Handlers
 * User profile endpoints
 */

import * as userService from '../../services/user.js';
import { BadRequestError } from '../../lib/errors.js';

/**
 * GET /api/v1/users/me
 * Get current user profile
 */
export async function getMe(req, res) {
  const user = await userService.findById(req.user.sub);

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  });
}

/**
 * PATCH /api/v1/users/me
 * Update current user profile
 */
export async function updateMe(req, res) {
  const { name, email } = req.body;

  const user = await userService.update(req.user.sub, { name, email });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  });
}

/**
 * PUT /api/v1/users/me/password
 * Change current user password
 */
export async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Current password and new password are required');
  }

  await userService.updatePassword(req.user.sub, currentPassword, newPassword);

  res.json({ message: 'Password updated successfully' });
}