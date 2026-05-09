/**
 * Chrome built-in AI availability + provider resolution.
 *
 * Wraps `Summarizer.availability()` / `LanguageModel.availability()` etc.
 * with feature-detection so callers don't special-case browsers without the
 * API at all (today's Safari and Firefox).
 *
 * `resolveProvider` is the single source of truth for the fallback order
 * shared across every `<ai-*>` component:
 *
 *   local Chrome API → inline endpoint → external deep-link → unavailable.
 */

/** Availability states reported by the Chrome AI APIs. */
const LOCAL_STATES = ['available', 'downloadable', 'downloading'];

/**
 * @typedef {'available'|'downloadable'|'downloading'|'unavailable'|'unsupported'} AvailabilityState
 */

/**
 * Probe the named global Chrome AI API.
 *
 * @param {string} apiName  e.g. 'Summarizer', 'LanguageModel', 'Translator'
 * @returns {Promise<{ state: AvailabilityState, error?: Error }>}
 */
export async function checkAvailability(apiName) {
  const scope = /** @type {any} */ (typeof globalThis !== 'undefined' ? globalThis : null);
  if (!scope || !(apiName in scope)) {
    return { state: 'unsupported' };
  }
  try {
    const api = scope[apiName];
    if (!api || typeof api.availability !== 'function') {
      return { state: 'unsupported' };
    }
    const raw = await api.availability();
    if (raw === 'available' || raw === 'downloadable' || raw === 'downloading' || raw === 'unavailable') {
      return { state: raw };
    }
    return { state: 'unsupported' };
  } catch (error) {
    return { state: 'unsupported', error: /** @type {Error} */ (error) };
  }
}

/**
 * Pick which provider should serve a request, given availability + config.
 *
 * @param {object} args
 * @param {AvailabilityState} args.availability  From `checkAvailability`.
 * @param {string} [args.endpoint]               Inline-fallback HTTP URL.
 * @param {string} [args.fallbackURL]            External deep-link template.
 * @returns {'local'|'endpoint'|'deep-link'|'unavailable'}
 */
export function resolveProvider({ availability, endpoint, fallbackURL }) {
  if (LOCAL_STATES.includes(availability)) return 'local';
  if (endpoint) return 'endpoint';
  if (fallbackURL) return 'deep-link';
  return 'unavailable';
}
