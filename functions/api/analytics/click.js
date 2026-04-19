/**
 * POST /api/analytics/click — outbound link click.
 *
 * Accepts two content types:
 *   - `text/ping`           → browser-native ping (Chromium/Safari)
 *   - `application/json`    → sendBeacon fallback (Firefox/Brave)
 *
 * The `ping` spec sends no body but guarantees the `Ping-From` and
 * `Ping-To` headers and a query string in the target URL. The beacon
 * fallback sends a JSON envelope matching the analytics module output.
 *
 * Dedup between the two channels is done at query time, not write time —
 * D1 writes are cheap and cross-Worker transactions would be racy.
 */

import { getDB, sanitizePath, extractDomain, noContent } from '../../_lib/sanitize.js';

export async function onRequestPost({ request, env, waitUntil }) {
  const db = getDB(env);
  if (!db) return noContent();

  const contentType = request.headers.get('content-type') ?? '';

  let site = 'default';
  let fromPage = '/';
  let toDomain = '';
  let href = null;

  if (contentType.startsWith('text/ping')) {
    const url = new URL(request.url);
    site     = (url.searchParams.get('site') ?? 'default').slice(0, 64);
    fromPage = sanitizePath(url.searchParams.get('from') ?? request.headers.get('ping-from') ?? '/');
    toDomain = extractDomain(request.headers.get('ping-to') ?? '');
    href     = request.headers.get('ping-to') ?? null;
  } else if (contentType.startsWith('application/json')) {
    const body = await request.json().catch(() => null);
    if (!body) return new Response(null, { status: 400 });
    site     = String(body.site ?? body.s ?? 'default').slice(0, 64);
    fromPage = sanitizePath(body.path ?? body.from ?? '/');
    toDomain = extractDomain(body.props?.to ?? body.to ?? '');
    href     = body.props?.href ?? body.href ?? null;
  } else {
    return new Response(null, { status: 415 });
  }

  if (!toDomain) return noContent();

  try {
    waitUntil(db.prepare(
      `INSERT INTO clicks (site_id, from_page, to_domain, href, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    ).bind(
      site,
      fromPage,
      toDomain,
      href ? String(href).slice(0, 2048) : null,
      Date.now(),
    ).run());
  } catch (err) {
    console.error('[analytics/click] insert failed', err?.message ?? err);
  }

  return noContent();
}
