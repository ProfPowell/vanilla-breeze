/**
 * POST /api/analytics/events — buffered event queue.
 *
 * The Layer-4 sessionStorage buffer flushes batched events on visibility
 * change and pagehide. Each envelope in the batch is stored as a row in
 * `hits` (same table as direct Analytics.track() calls — keeps the event
 * catalog unified at query time).
 *
 * Body shape: `{ site, events: [envelope, envelope, ...] }`.
 */

import { getDB, sanitizePath, stringifyProps, noContent } from '../../_lib/sanitize.js';

export async function onRequestPost({ request, env, waitUntil }) {
  const db = getDB(env);
  if (!db) return noContent();

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.events) || body.events.length === 0) {
    return new Response(null, { status: 400 });
  }

  const siteId  = String(body.site ?? 'default').slice(0, 64);
  const country = request.cf?.country ?? 'XX';
  const now = Date.now();

  const stmt = db.prepare(
    `INSERT INTO hits
       (site_id, event_name, path, referrer, country, is_unique, props,
        persona, activity, topic, content, stage, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
  );

  const rows = body.events.slice(0, 50).map((e) => {
    const tx = e.context ?? {};
    return stmt.bind(
      siteId,
      String(e.name ?? 'unknown').slice(0, 128),
      sanitizePath(e.path ?? '/'),
      typeof e.referrer === 'string' ? e.referrer.slice(0, 512) : '',
      country,
      stringifyProps(e.props),
      tx.persona ?? null,
      tx.activity ?? null,
      tx.topic ?? null,
      tx.content ?? null,
      tx.stage ?? null,
      e.ts ?? now,
    );
  });

  try {
    waitUntil(db.batch(rows));
  } catch (err) {
    console.error('[analytics/events] batch failed', err?.message ?? err);
  }
  return noContent();
}
