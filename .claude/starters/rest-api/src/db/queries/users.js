/**
 * User Queries
 * SQL queries for user operations
 */

export const findById = `
  SELECT id, email, name, role, created_at, updated_at
  FROM users
  WHERE id = $1
`;

export const findByIdWithPassword = `
  SELECT id, email, password_hash, name, role, created_at, updated_at
  FROM users
  WHERE id = $1
`;

export const findByEmail = `
  SELECT id, email, name, role, created_at, updated_at
  FROM users
  WHERE email = $1
`;

export const findByEmailWithPassword = `
  SELECT id, email, password_hash, name, role, created_at, updated_at
  FROM users
  WHERE email = $1
`;

export const create = `
  INSERT INTO users (email, password_hash, name, role)
  VALUES ($1, $2, $3, $4)
  RETURNING id, email, name, role, created_at, updated_at
`;

export const update = `
  UPDATE users
  SET name = COALESCE($2, name),
      email = COALESCE($3, email)
  WHERE id = $1
  RETURNING id, email, name, role, created_at, updated_at
`;

export const updatePassword = `
  UPDATE users
  SET password_hash = $2
  WHERE id = $1
`;

export const remove = `
  DELETE FROM users
  WHERE id = $1
`;

export const list = `
  SELECT id, email, name, role, created_at, updated_at
  FROM users
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2
`;

export const count = `
  SELECT COUNT(*) as total FROM users
`;
