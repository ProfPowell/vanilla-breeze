/**
 * Health Check Handlers
 * Liveness and readiness probes
 */

import { db } from '../../db/client.js';

/**
 * Basic liveness check
 */
export function healthHandler(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}

/**
 * Readiness check with dependency verification
 */
export async function readyHandler(req, res) {
  const checks = {
    database: false
  };

  try {
    await db.query('SELECT 1');
    checks.database = true;
  } catch (error) {
    // Database not ready
  }

  const allReady = Object.values(checks).every(Boolean);
  const status = allReady ? 200 : 503;

  res.status(status).json({
    status: allReady ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString()
  });
}
