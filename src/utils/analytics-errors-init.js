/**
 * Analytics — runtime error capture.
 *
 * Auto-initialising module. Reports uncaught errors and unhandled
 * promise rejections via the standard analytics pipeline so they land
 * in the same hits table as everything else.
 *
 * Spec: admin/plans/analytics/analytics-spec.md Tier-3 events
 *   error.js_runtime         — window 'error' events
 *   error.unhandled_promise  — window 'unhandledrejection' events
 *
 * Keep payloads small: truncate messages and only keep the basename of
 * the source URL. Stack traces are intentionally omitted from the
 * first cut — adding them significantly increases payload size and
 * most production setups prefer a separate error-reporting stack
 * (Sentry, Rollbar, etc.) for detailed diagnostics.
 */

import { Analytics } from '../lib/analytics.js';

const MAX_MESSAGE = 200;

/** Strip everything but the filename from a URL-like string. */
function sourceBasename(url) {
  if (typeof url !== 'string' || !url) return '';
  try {
    const u = new URL(url, location.origin);
    const last = u.pathname.split('/').pop();
    return last || u.pathname;
  } catch {
    return url.split('/').pop() ?? url;
  }
}

function truncate(s) {
  if (typeof s !== 'string') return String(s ?? '').slice(0, MAX_MESSAGE);
  return s.length > MAX_MESSAGE ? s.slice(0, MAX_MESSAGE) : s;
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    // Skip resource-load errors (e.target instanceof Element) — those are
    // noise and surface in the Network tab anyway.
    if (e.target && e.target !== window) return;
    Analytics.track('error.js_runtime', {
      message: truncate(e.message),
      source:  sourceBasename(e.filename),
      line:    e.lineno ?? 0,
      col:     e.colno ?? 0,
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const message = reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : JSON.stringify(reason ?? null);
    Analytics.track('error.unhandled_promise', {
      message: truncate(message),
    });
  });
}
