/**
 * Item Queries
 * SQL queries for item CRUD operations
 */

export const findById = `
  SELECT id, user_id, name, description, status, metadata, created_at, updated_at
  FROM items
  WHERE id = $1
`;

export const findByIdAndUser = `
  SELECT id, user_id, name, description, status, metadata, created_at, updated_at
  FROM items
  WHERE id = $1 AND user_id = $2
`;

export const create = `
  INSERT INTO items (user_id, name, description, status, metadata)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id, user_id, name, description, status, metadata, created_at, updated_at
`;

export const update = `
  UPDATE items
  SET name = COALESCE($3, name),
      description = COALESCE($4, description),
      status = COALESCE($5, status),
      metadata = COALESCE($6, metadata)
  WHERE id = $1 AND user_id = $2
  RETURNING id, user_id, name, description, status, metadata, created_at, updated_at
`;

export const remove = `
  DELETE FROM items
  WHERE id = $1 AND user_id = $2
`;

export const listByUser = `
  SELECT id, user_id, name, description, status, metadata, created_at, updated_at
  FROM items
  WHERE user_id = $1
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3
`;

export const countByUser = `
  SELECT COUNT(*) as total
  FROM items
  WHERE user_id = $1
`;

export const listByUserAndStatus = `
  SELECT id, user_id, name, description, status, metadata, created_at, updated_at
  FROM items
  WHERE user_id = $1 AND status = $2
  ORDER BY created_at DESC
  LIMIT $3 OFFSET $4
`;

export const countByUserAndStatus = `
  SELECT COUNT(*) as total
  FROM items
  WHERE user_id = $1 AND status = $2
`;
