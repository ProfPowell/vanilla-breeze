/**
 * POST /api/analytics/hit — page views and named events.
 *
 * Body shape (see src/lib/analytics.js buildEnvelope):
 *   {
 *     name:     'page.view' | 'form.submit_valid' | ...,
 *     ts:       number,
 *     site:     string,
 *     path:     string,
 *     referrer: string,
 *     context:  { persona?, activity?, topic?, content?, stage?, ... },
 *     props:    object
 *   }
 *
 * Response: 204 on success, 400 on malformed body.
 */

import { checkUnique } from '../../_lib/daily-hash.js';
import { getDB, sanitizePath, stringifyProps, noContent } from '../../_lib/sanitize.js';

export async function onRequestPost({ request, env, waitUntil }) {
  const db = getDB(env);
  if (!db) return noContent(); // binding missing — swallow silently

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || !body.name) {
    return new Response(null, { status: 400 });
  }

  const siteId  = String(body.site ?? 'default').slice(0, 64);
  const path    = sanitizePath(body.path);
  const ref     = typeof body.referrer === 'string' ? body.referrer.slice(0, 512) : '';
  const country = request.cf?.country ?? 'XX';
  const ua      = request.headers.get('user-agent') ?? '';
  const ip      = request.headers.get('cf-connecting-ip') ?? '';

  const eventName = String(body.name).slice(0, 128);
  const isPageView = eventName === 'page.view';
  const screenWidth = Number(body.props?.screenWidth ?? body.context?.screenWidth ?? 0);
  const tx = body.context ?? {};
  const props = stringifyProps(body.props);

  try {
    // `is_unique` belongs to the *visit*, not to individual events. Only
    // check uniqueness on page.view rows — otherwise the first named event
    // of the day (e.g. a theme-picker extension_toggle fired on mount)
    // steals the `is_unique=1` flag from the subsequent page.view row.
    const isUnique = isPageView
      ? await checkUnique(env, siteId, ip, ua, screenWidth)
      : false;

    const insert = db.prepare(
      `INSERT INTO hits
         (site_id, event_name, path, referrer, country, is_unique, props,
          persona, activity, topic, content, stage, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
    ).bind(
      siteId,
      eventName,
      path,
      ref,
      country,
      isUnique ? 1 : 0,
      props,
      tx.persona ?? null,
      tx.activity ?? null,
      tx.topic ?? null,
      tx.content ?? null,
      tx.stage ?? null,
      Date.now(),
    );

    waitUntil(insert.run());
  } catch (err) {
    // Log for Cloudflare Workers observability; never fail the beacon.
    // A common cause pre-migration: "no such table: hits" / "daily_salts".
    console.error('[analytics/hit] insert failed', err?.message ?? err);
  }
  return noContent();
}
