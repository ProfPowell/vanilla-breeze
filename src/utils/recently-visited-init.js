/**
 * recently-visited-init: Opt-in reader-history tracker.
 *
 * Records page navigations and in-page hash changes to localStorage under
 * `vb:recently-visited`, for the <recently-visited> lens to render. Nothing
 * is ever sent anywhere.
 *
 * Tracking is OPT-IN. A page is recorded only when
 *   - it carries `<meta name="vb:track-history" content="on">` (put it in the
 *     site-wide head to record every page), or
 *   - a `<recently-visited>` element is on the page,
 * and never when
 *   - `<html data-vb-no-track>` is set (site-wide, shared with analytics),
 *   - `<meta name="vb:no-track-history">` is present (per page), or
 *   - the reader paused tracking (`vb:recently-visited:paused` = "1").
 *
 * Privacy defaults:
 *   - Query strings are stripped. `<meta name="vb:track-history-params"
 *     content="q page">` allowlists parameters to keep (space or comma
 *     separated).
 *   - Entries expire after 30 days (TTL_MS); expired and malformed records are
 *     pruned on every read and write.
 *   - History is capped at MAX_ENTRIES (100).
 *   - Only same-origin http(s) paths are stored or returned; a leading `//`
 *     (or `/\`) is collapsed to `/` so a crafted `https://site//evil.example/`
 *     URL can never become an off-site link.
 *
 * Same-tab listeners are told about every write through a
 * `recently-visited:change` event on `window` (detail `{ key }`); other tabs
 * get the native `storage` event.
 */

const STORAGE_KEY = 'vb:recently-visited';
const PAUSE_KEY = 'vb:recently-visited:paused';
const SHOW_ANCHORS_KEY = 'vb:recently-visited:show-anchors';
const CHANGE_EVENT = 'recently-visited:change';
const MAX_ENTRIES = 100;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** @param {string} name */
function metaContent(name) {
  const el = document.querySelector(`meta[name="${name}"]`);
  return el ? (el.getAttribute('content') ?? '') : null;
}

/**
 * True when this page may be recorded (opt-in present, no opt-out).
 * @returns {boolean}
 */
function isEnabled() {
  if (typeof document === 'undefined') return false;
  if (document.documentElement.hasAttribute('data-vb-no-track')) return false;
  if (metaContent('vb:no-track-history') !== null) return false;
  if ((metaContent('vb:track-history') ?? '').trim().toLowerCase() === 'on') return true;
  return document.querySelector('recently-visited') !== null;
}

function isPaused() {
  try {
    return localStorage.getItem(PAUSE_KEY) === '1';
  } catch {
    return false;
  }
}

function isShowingAnchors() {
  try {
    return localStorage.getItem(SHOW_ANCHORS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Query parameters the page allows to be stored (empty = strip all).
 * @returns {Set<string>}
 */
function allowedParams() {
  const raw = metaContent('vb:track-history-params') || '';
  return new Set(raw.split(/[\s,]+/).filter(Boolean));
}

/**
 * Normalise a stored or current URL to a same-origin `path[?query]`.
 * Returns null for anything that is not a same-origin http(s) URL.
 *
 * @param {unknown} input
 * @param {Set<string> | null} [allow] Params to keep; null keeps the query as is.
 * @returns {string | null}
 */
function toEntryUrl(input, allow = null) {
  if (typeof input !== 'string') return null;
  const raw = input.trim().replace(/^[\\/]{2,}/, '/');
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw, location.origin);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.origin !== location.origin) return null;
  const path = url.pathname.replace(/^\/{2,}/, '/');
  let search = url.search;
  if (allow) {
    const kept = new URLSearchParams();
    for (const [k, v] of url.searchParams) if (allow.has(k)) kept.append(k, v);
    const qs = kept.toString();
    search = qs ? `?${qs}` : '';
  }
  return path + search;
}

/**
 * The current page as it would be stored.
 * @returns {string | null}
 */
function currentUrl() {
  return toEntryUrl(location.pathname + location.search, allowedParams());
}

/**
 * Validate and prune records: drop malformed, off-origin and expired ones.
 * @param {unknown} list
 * @param {number} [now]
 * @returns {Array<{ url: string, hash: string, title: string, hashTitle: string, ts: number }>}
 */
function prune(list, now = Date.now()) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const e of list) {
    if (!e || typeof e !== 'object') continue;
    const ts = Number(e.ts);
    /* Expired, or implausibly far in the future (clock skew is tolerated). */
    if (!Number.isFinite(ts) || Math.abs(now - ts) > TTL_MS) continue;
    const url = toEntryUrl(e.url);
    if (!url) continue;
    const hash = typeof e.hash === 'string' && e.hash.startsWith('#') && e.hash.length > 1 ? e.hash : '';
    out.push({
      url,
      hash,
      title: typeof e.title === 'string' ? e.title : '',
      hashTitle: hash && typeof e.hashTitle === 'string' ? e.hashTitle : '',
      ts,
    });
  }
  return out;
}

/**
 * Stored history, most recent first, already pruned.
 * @returns {ReturnType<typeof prune>}
 */
function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? prune(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

/** @param {string} key */
function notify(key) {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
}

/** @param {unknown[]} entries */
function write(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prune(entries).slice(0, MAX_ENTRIES)));
  } catch {
    /* quota exceeded or private mode — silently drop. */
  }
  notify(STORAGE_KEY);
}

/**
 * @param {string} key
 * @param {boolean} on
 */
function setFlag(key, on) {
  try {
    if (on) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
  } catch { /* private mode */ }
  notify(key);
}

/** @param {boolean} on */
function setPaused(on) { setFlag(PAUSE_KEY, on); }

/** @param {boolean} on */
function setShowAnchors(on) { setFlag(SHOW_ANCHORS_KEY, on); }

/**
 * Resolve a human-readable label for the current hash, if any. Falls
 * back to the slug when no element matches the hash id.
 * @param {string} hash
 */
function resolveHashTitle(hash) {
  if (!hash) return '';
  let id = hash.slice(1);
  try { id = decodeURIComponent(id); } catch { /* keep raw */ }
  if (!id) return '';
  const target = document.getElementById(id);
  if (target) return (target.textContent || '').trim().slice(0, 80) || id;
  return id;
}

/**
 * Record the current location (page + hash) when tracking is enabled.
 * The renderer decides whether anchor entries are shown.
 * @returns {boolean} true when a record was written
 */
function trackCurrent() {
  if (!isEnabled() || isPaused()) return false;
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return false;

  const url = currentUrl();
  if (!url) return false;
  const hash = location.hash.length > 1 ? location.hash : '';
  const title = (document.title || '').trim();
  if (!title) return false; /* untitled scratch pages — skip */

  const existing = read();
  const key = url + hash;
  const top = existing[0];
  if (top && top.url + top.hash === key) return false; /* already at top */

  const filtered = existing.filter((e) => e.url + e.hash !== key);
  filtered.unshift({ url, hash, title, hashTitle: resolveHashTitle(hash), ts: Date.now() });
  write(filtered);
  return true;
}

/* Track once when this script runs, on bfcache restore, and on every
   in-page hash change. trackCurrent() checks the opt-in on each call, so a
   <recently-visited> added later (or a meta) still takes effect.

   Guarded per document so a second evaluation of this module (it is imported
   by several bundles and by the component chunk, and demos may load it raw)
   does not double-track the visit or stack duplicate listeners. */
const _docEl = typeof document !== 'undefined' ? document.documentElement : null;

if (_docEl && !_docEl.hasAttribute('data-vb-recently-visited-init')) {
  _docEl.setAttribute('data-vb-recently-visited-init', '');

  trackCurrent();
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) trackCurrent();
  });
  window.addEventListener('hashchange', trackCurrent);
}

/* Public surface for the component / tests. */
export {
  STORAGE_KEY,
  PAUSE_KEY,
  SHOW_ANCHORS_KEY,
  CHANGE_EVENT,
  MAX_ENTRIES,
  TTL_MS,
  isEnabled,
  isPaused,
  isShowingAnchors,
  allowedParams,
  toEntryUrl,
  currentUrl,
  prune,
  read,
  write,
  setPaused,
  setShowAnchors,
  trackCurrent,
};
