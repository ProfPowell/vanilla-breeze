/**
 * GET /api/analytics/stats — dashboard aggregate snapshot.
 *
 * Returns a small JSON blob suitable for a single-page dashboard. Query
 * parameters:
 *   site    site_id filter (default: 'vb-docs')
 *   window  24h | 7d | 30d — defaults to 24h
 *
 * This is the MVP query set. Add more roll-ups as the dashboard grows.
 */

import { getDB, json } from '../../_lib/sanitize.js';

const WINDOWS = {
  '24h': 24 * 60 * 60 * 1000,
  '7d':   7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

export async function onRequestGet({ request, env }) {
  const db = getDB(env);
  if (!db) {
    return json({
      ok: false,
      error: 'D1 binding is not configured on this Pages project (expected `DB` or `vanilla_breeze_analytics`).',
      hint: 'See functions/api/analytics/README.md for setup steps.',
    }, { status: 503 });
  }

  const url = new URL(request.url);
  const site = url.searchParams.get('site') ?? 'vb-docs';
  const windowKey = url.searchParams.get('window') ?? '24h';
  const since = Date.now() - (WINDOWS[windowKey] ?? WINDOWS['24h']);

  let results;
  try {
    results = await Promise.all([
    db.prepare(
      `SELECT COUNT(*) AS hits,
              SUM(is_unique) AS uniques,
              SUM(CASE WHEN event_name = 'page.view' THEN 1 ELSE 0 END) AS page_views,
              SUM(CASE WHEN event_name <> 'page.view' THEN 1 ELSE 0 END) AS events
         FROM hits
        WHERE site_id = ?1 AND created_at > ?2`
    ).bind(site, since).first(),

    db.prepare(
      `SELECT path, COUNT(*) AS views, SUM(is_unique) AS uniques
         FROM hits
        WHERE site_id = ?1 AND created_at > ?2 AND event_name = 'page.view'
        GROUP BY path ORDER BY views DESC LIMIT 10`
    ).bind(site, since).all(),

    db.prepare(
      `SELECT event_name AS name, COUNT(*) AS count
         FROM hits
        WHERE site_id = ?1 AND created_at > ?2 AND event_name <> 'page.view'
        GROUP BY event_name ORDER BY count DESC LIMIT 15`
    ).bind(site, since).all(),

    db.prepare(
      `SELECT referrer, COUNT(*) AS views
         FROM hits
        WHERE site_id = ?1 AND created_at > ?2
          AND referrer IS NOT NULL AND referrer <> ''
        GROUP BY referrer ORDER BY views DESC LIMIT 10`
    ).bind(site, since).all(),

    db.prepare(
      `SELECT country, COUNT(*) AS views
         FROM hits
        WHERE site_id = ?1 AND created_at > ?2
          AND country IS NOT NULL AND country <> 'XX'
        GROUP BY country ORDER BY views DESC LIMIT 10`
    ).bind(site, since).all(),

    db.prepare(
      `SELECT to_domain, COUNT(*) AS clicks
         FROM clicks
        WHERE site_id = ?1 AND created_at > ?2
        GROUP BY to_domain ORDER BY clicks DESC LIMIT 10`
    ).bind(site, since).all(),

      db.prepare(
        `SELECT event_name, path, created_at
           FROM hits
          WHERE site_id = ?1 AND created_at > ?2
          ORDER BY created_at DESC LIMIT 20`
      ).bind(site, since).all(),

      // Web Vitals — rating breakdown per metric.
      db.prepare(
        `SELECT event_name,
                COALESCE(json_extract(props, '$.rating'), 'unknown') AS rating,
                COUNT(*) AS count,
                AVG(CAST(json_extract(props, '$.value') AS REAL)) AS avg_value
           FROM hits
          WHERE site_id = ?1 AND created_at > ?2
            AND event_name LIKE 'perf.%'
          GROUP BY event_name, rating
          ORDER BY event_name, rating`
      ).bind(site, since).all(),

      // Recent errors — most recent first.
      db.prepare(
        `SELECT event_name,
                json_extract(props, '$.message') AS message,
                json_extract(props, '$.source')  AS source,
                json_extract(props, '$.line')    AS line,
                path,
                created_at
           FROM hits
          WHERE site_id = ?1 AND created_at > ?2
            AND event_name LIKE 'error.%'
          ORDER BY created_at DESC LIMIT 10`
      ).bind(site, since).all(),
    ]);
  } catch (err) {
    const msg = err?.message ?? String(err);
    const missingTable = /no such table/i.test(msg);
    return json({
      ok: false,
      error: missingTable
        ? 'D1 tables not found. Apply migrations: `npx wrangler d1 migrations apply vanilla-breeze-analytics --remote`.'
        : `D1 query failed: ${msg}`,
      hint: 'See functions/api/analytics/README.md for setup steps.',
    }, { status: 503 });
  }

  const [totals, topPages, topEvents, topReferrers, topCountries, topClicks, recent, vitals, errors] = results;

  return json({
    ok: true,
    site,
    window: windowKey,
    since,
    totals: {
      hits:       totals?.hits ?? 0,
      uniques:    totals?.uniques ?? 0,
      pageViews:  totals?.page_views ?? 0,
      events:     totals?.events ?? 0,
    },
    topPages:     topPages?.results ?? [],
    topEvents:    topEvents?.results ?? [],
    topReferrers: topReferrers?.results ?? [],
    topCountries: topCountries?.results ?? [],
    topClicks:    topClicks?.results ?? [],
    recent:       recent?.results ?? [],
    vitals:       vitals?.results ?? [],
    errors:       errors?.results ?? [],
  });
}
