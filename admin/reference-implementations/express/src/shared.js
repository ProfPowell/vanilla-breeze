/**
 * Shared helpers — error envelope, id generator, async route wrapper.
 */

import { randomUUID } from 'node:crypto';

/** Standard error envelope per /docs/concepts/service-contracts/. */
export function err(res, status, code, message) {
  res.status(status).json({ error: code, message, status });
}

export function newId(prefix) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

/**
 * Wrap an async handler so thrown errors land in the Express error
 * middleware instead of crashing the process.
 */
export function wrap(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
