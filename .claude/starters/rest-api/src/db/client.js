/**
 * @file Database Client
 * @description PostgreSQL connection pool with query helpers
 */

// @ts-ignore - pg default export typing issue
import pg from 'pg';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

const { Pool } = pg;

/**
 * @typedef {import('pg').QueryResult<any>} QueryResult
 * @typedef {import('pg').PoolClient} PoolClient
 */

/** @type {pg.Pool} */
const pool = new Pool({
  connectionString: config.db.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Execute a query
 * @template T
 * @param {string} sql - SQL query
 * @param {unknown[]} [params] - Query parameters
 * @returns {Promise<pg.QueryResult<T>>} Query result
 */
async function query(sql, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(sql, params);
    logger.debug({
      query: sql.slice(0, 100),
      duration: Date.now() - start,
      rows: result.rowCount
    });
    return result;
  } catch (error) {
    logger.error({ query: sql, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Execute a transaction
 * @template T
 * @param {(client: PoolClient) => Promise<T>} fn - Function receiving client
 * @returns {Promise<T>} Transaction result
 */
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * @typedef {Object} DbClient
 * @property {typeof query} query - Execute a query
 * @property {typeof transaction} transaction - Execute a transaction
 * @property {pg.Pool} pool - Connection pool
 */

/** @type {DbClient} */
export const db = {
  query,
  transaction,
  pool
};
