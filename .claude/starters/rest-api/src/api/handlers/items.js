/**
 * Item Handlers
 * CRUD endpoints for items resource
 */

import * as itemService from '../../services/item.js';
import { BadRequestError } from '../../lib/errors.js';

/**
 * GET /api/v1/items
 * List items for current user
 */
export async function list(req, res) {
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  const offset = parseInt(req.query.offset || '0', 10);
  const status = req.query.status || null;

  const { items, total } = await itemService.listForUser(req.user.sub, {
    limit,
    offset,
    status
  });

  res.json({
    items,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + items.length < total
    }
  });
}

/**
 * GET /api/v1/items/:id
 * Get single item by ID
 */
export async function get(req, res) {
  const item = await itemService.findByIdForUser(req.params.id, req.user.sub);

  res.json(item);
}

/**
 * POST /api/v1/items
 * Create a new item
 */
export async function create(req, res) {
  const { name, description, status, metadata } = req.body;

  if (!name) {
    throw new BadRequestError('Name is required');
  }

  const item = await itemService.create(req.user.sub, {
    name,
    description,
    status,
    metadata
  });

  res.status(201).json(item);
}

/**
 * PATCH /api/v1/items/:id
 * Update an item
 */
export async function update(req, res) {
  const { name, description, status, metadata } = req.body;

  const item = await itemService.update(req.params.id, req.user.sub, {
    name,
    description,
    status,
    metadata
  });

  res.json(item);
}

/**
 * DELETE /api/v1/items/:id
 * Delete an item
 */
export async function remove(req, res) {
  await itemService.remove(req.params.id, req.user.sub);

  res.status(204).send();
}