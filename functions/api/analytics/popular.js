/**
 * GET /api/analytics/popular — most-visited pages for <popularity-index>.
 *
 * Query parameters (all optional):
 *   site    site_id filter (default: 'vb-docs')
 *   window  24h | 7d | 30d — same keys as /api/analytics/stats (default 7d)
 *   limit   1–50 rows (default 10)
 *
 * Response: { ok: true, site, window, pages: [{ url, views }] }
 *
 * Built on the same D1 `hits` aggregate as the stats dashboard's topPages
 * (page.view rows grouped by path). Unlike /stats this endpoint is public
 * and feeds a visitor-facing widget, so failures return a generic error
 * body — D1 messages are never echoed to the client.
 */

import { getDB, json } from '../../_lib/sanitize.js';

export const WINDOWS = {
  '24h': 24 * 60 * 60 * 1000,
  '7d':   7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const DEFAULT_WINDOW = '7d';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * Normalise the query string into a validated request.
 * @param {URLSearchParams} params
 */
export function parsePopularQuery(params) {
  const site = (params.get('site') || 'vb-docs').slice(0, 64);
  const rawWindow = params.get('window');
  const windowKey = rawWindow && Object.hasOwn(WINDOWS, rawWindow) ? rawWindow : DEFAULT_WINDOW;
  const n = Number.parseInt(params.get('limit') ?? '', 10);
  const limit = Number.isFinite(n) ? Math.min(MAX_LIMIT, Math.max(1, n)) : DEFAULT_LIMIT;
  return { site, windowKey, limit };
}

export async function onRequestGet({ request, env }) {
  const unavailable = () => json({ ok: false, error: 'unavailable' }, { status: 503 });

  const db = getDB(env);
  if (!db) return unavailable();

  const { site, windowKey, limit } = parsePopularQuery(new URL(request.url).searchParams);
  const since = Date.now() - WINDOWS[windowKey];

  let rows;
  try {
    rows = await db.prepare(
      `SELECT path AS url, COUNT(*) AS views
         FROM hits
        WHERE site_id = ?1 AND created_at > ?2 AND event_name = 'page.view'
        GROUP BY path ORDER BY views DESC LIMIT ?3`
    ).bind(site, since, limit).all();
  } catch (err) {
    console.error('[analytics/popular] query failed:', err?.message ?? err);
    return unavailable();
  }

  const pages = (rows?.results ?? [])
    .filter((r) => typeof r?.url === 'string' && r.url.startsWith('/') && !r.url.startsWith('//'))
    .map((r) => ({ url: r.url, views: Number(r.views) || 0 }));

  return json({ ok: true, site, window: windowKey, pages });
}
