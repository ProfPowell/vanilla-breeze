/**
 * Daily hash for visitor uniqueness — Cloudflare Pages Functions.
 *
 * Computes a per-day, per-site hash that expires at UTC midnight when the
 * salt rotates. Used to set `is_unique=1` on the first hit of the day
 * without storing any persistent identifier.
 *
 * Privacy guarantees:
 *   - Salt rotates daily. Yesterday's hashes cannot be recomputed.
 *   - Salt is per-site (via site_id as hash input).
 *   - The hash is checked and used; neither the hash nor its inputs are
 *     stored. The `daily_uniques` row holds the hash only long enough to
 *     detect a same-day repeat, then is truncated at rotation.
 *
 * Two-level hash (Fathom + OpenPanel pattern):
 *   L1 = SHA-256(ip | ua | siteId | dailySalt)
 *   L2 = SHA-256(L1 | screenWidth)
 */

import { getDB } from './sanitize.js';

const encoder = new TextEncoder();

async function sha256Hex(input) {
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return [...new Uint8Array(buf)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function utcDay() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC
}

/** Read today's salt, seeding a new one if absent. Race-safe via INSERT OR IGNORE. */
async function getDailySalt(env) {
  const db = getDB(env);
  const day = utcDay();
  const existing = await db
    .prepare('SELECT salt FROM daily_salts WHERE day = ?1')
    .bind(day)
    .first();
  if (existing?.salt) return existing.salt;

  const salt = crypto.randomUUID();
  await db
    .prepare('INSERT OR IGNORE INTO daily_salts (day, salt) VALUES (?1, ?2)')
    .bind(day, salt)
    .run();

  // Re-read — if two Workers raced to seed the day, the loser picks up
  // the winner's salt instead of using its own stale value.
  const confirmed = await db
    .prepare('SELECT salt FROM daily_salts WHERE day = ?1')
    .bind(day)
    .first();
  return confirmed.salt;
}

/**
 * Determine whether this is the first hit today for this visitor.
 *
 * @param {{ DB: D1Database }} env
 * @param {string} siteId
 * @param {string} ip
 * @param {string} ua
 * @param {number} screenWidth
 * @returns {Promise<boolean>} true if this is the first hit today
 */
export async function checkUnique(env, siteId, ip, ua, screenWidth) {
  const db = getDB(env);
  const salt = await getDailySalt(env);
  const level1 = await sha256Hex(`${ip}|${ua}|${siteId}|${salt}`);
  const level2 = await sha256Hex(`${level1}|${screenWidth || 0}`);

  // `INSERT OR IGNORE` + checking `meta.changes` is the race-safe
  // "first hit?" signal. D1 serialises writes per database, so concurrent
  // Workers hitting the same hash still produce a single winner.
  const result = await db
    .prepare('INSERT OR IGNORE INTO daily_uniques (day_hash) VALUES (?1)')
    .bind(level2)
    .run();

  return (result?.meta?.changes ?? 0) > 0;
}
