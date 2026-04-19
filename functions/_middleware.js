/**
 * Cloudflare Pages middleware — HTTP Basic Auth gate.
 *
 * Temporary soft-protection while vanilla-breeze.com is pre-release.
 * Remove this file (or its onRequest export) to make the site public.
 *
 * Credentials: prefers env vars BASIC_AUTH_USER / BASIC_AUTH_PASS,
 * falls back to hardcoded defaults. Set the env vars in the Cloudflare
 * Pages dashboard → Settings → Environment variables to rotate without
 * a code change.
 *
 * Analytics ingest endpoints (`/api/analytics/*`) are exempt from the
 * gate so client beacons can write to D1 while the rest of the site
 * stays protected. Ingest endpoints are write-only / public-by-design
 * and return 204 on success. The dashboard at `/stats/` stays behind
 * the auth gate.
 */
export async function onRequest(context) {
  const { request, next, env } = context;
  const pathname = new URL(request.url).pathname;

  // Bypass ingest endpoints — they accept unauthenticated beacons.
  if (pathname.startsWith('/api/analytics/') && pathname !== '/api/analytics/stats') {
    return next();
  }

  const user = (env && env.BASIC_AUTH_USER) || 'vb';
  const pass = (env && env.BASIC_AUTH_PASS) || 'ucsd';
  const expected = 'Basic ' + btoa(`${user}:${pass}`);

  const provided = request.headers.get('Authorization') || '';
  if (provided === expected) return next();

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="vanilla-breeze", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}
