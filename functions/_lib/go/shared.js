/**
 * Shared helpers — JSON responses, error envelope, CORS, body parsing.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(body == null ? '' : JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

/** Standard error envelope per /docs/concepts/service-contracts/. */
export function err(status, code, message) {
  return json({ error: code, message, status }, status);
}

/** Read JSON body — returns `undefined` on parse error so callers can 400. */
export async function readJson(request) {
  const text = await request.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** CORS preflight — always 204. */
export function handlePreflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** Generate a short prefixed id. */
export function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Guard for handlers that need the VB_KV binding. Returns a 503 if the
 * binding is missing — useful before the KV namespace is provisioned in
 * production so visitors see a clean error instead of an internal 500.
 *
 * @returns {Response | null} `null` when KV is bound, otherwise a 503.
 */
export function requireKV(env) {
  if (env?.VB_KV) return null;
  return err(
    503,
    'service_unavailable',
    'VB_KV binding is not configured for this Pages project. See admin/reference-implementations/cloudflare/README.md for setup.',
  );
}
