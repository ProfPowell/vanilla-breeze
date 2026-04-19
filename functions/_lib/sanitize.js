/**
 * Shared path / URL helpers for analytics ingest.
 */

/**
 * Resolve the D1 binding regardless of what it was named in wrangler.toml
 * or the Cloudflare dashboard. Accepts either the short `DB` or the
 * descriptive `vanilla_breeze_analytics` variable name.
 */
export function getDB(env) {
  return env?.vanilla_breeze_analytics ?? env?.DB ?? null;
}

const MAX_PATH = 512;
const MAX_DOMAIN = 253;

/** Normalise a path string: trim whitespace, cap length, strip control chars. */
export function sanitizePath(raw) {
  if (typeof raw !== 'string') return '';
  // Keep only a leading slash + printable chars; cap at MAX_PATH.
  const cleaned = raw.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  const path = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  return path.length > MAX_PATH ? path.slice(0, MAX_PATH) : path;
}

/** Extract the hostname from a URL string, or return the string trimmed + capped. */
export function extractDomain(raw) {
  if (typeof raw !== 'string' || !raw) return '';
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return url.hostname.slice(0, MAX_DOMAIN).toLowerCase();
  } catch {
    return raw.trim().slice(0, MAX_DOMAIN).toLowerCase();
  }
}

/** Stringify a props object for storage. Drops non-JSON values silently. */
export function stringifyProps(props) {
  if (!props || typeof props !== 'object') return null;
  try {
    const str = JSON.stringify(props);
    return str && str !== '{}' ? str : null;
  } catch {
    return null;
  }
}

/** Generic 204 response used by every ingest endpoint on success. */
export function noContent() {
  return new Response(null, { status: 204 });
}

/** JSON response helper with cache-disabling headers. */
export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      ...(init.headers ?? {}),
    },
  });
}
