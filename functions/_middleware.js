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
 */
export async function onRequest(context) {
  const { request, next, env } = context;

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
