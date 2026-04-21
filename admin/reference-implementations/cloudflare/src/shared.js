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
