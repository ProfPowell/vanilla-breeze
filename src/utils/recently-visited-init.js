/**
 * recently-visited-init: Sitewide reader-history tracker.
 *
 * Runs on every page where the VB autoload bundle is present. Writes
 * { url, hash, title, hashTitle, ts } to localStorage under
 * `vb:recently-visited` so that <recently-visited> on any page can
 * render the reader's history. Pure client-side, never sent to a backend.
 *
 * Reader sovereignty:
 *   - Reads `vb:recently-visited:paused` from localStorage; if "1",
 *     skips the write entirely.
 *   - Reads `vb:recently-visited:track-anchors`; when "1", hash
 *     navigations are recorded as separate entries; otherwise only the
 *     base pathname+search is tracked. Default OFF — anchors are noisy.
 *   - Honors opt-out per-page via <meta name="vb:no-track-history">.
 *   - Caps the stored list at MAX_ENTRIES so localStorage doesn't bloat.
 *
 * Why a separate init: the <recently-visited> component used to track
 * inside its own connectedCallback, which only fired on pages that
 * embedded the component. Site-wide tracking belongs in the autoload
 * surface, not the renderer.
 */

const STORAGE_KEY = 'vb:recently-visited';
const PAUSE_KEY = 'vb:recently-visited:paused';
const TRACK_ANCHORS_KEY = 'vb:recently-visited:track-anchors';
const MAX_ENTRIES = 100;

function isPaused() {
  try {
    return localStorage.getItem(PAUSE_KEY) === '1';
  } catch {
    return false;
  }
}

function isAnchorMode() {
  try {
    return localStorage.getItem(TRACK_ANCHORS_KEY) === '1';
  } catch {
    return false;
  }
}

function isOptedOut() {
  return !!document.querySelector('meta[name="vb:no-track-history"]');
}

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota exceeded or private mode — silently drop. */
  }
}

/**
 * Resolve the human-readable label for the current hash, if any. Falls
 * back to the slug when no element matches the hash id.
 */
function resolveHashTitle(hash) {
  if (!hash) return '';
  const id = hash.slice(1);
  if (!id) return '';
  let target = null;
  try { target = document.getElementById(id); } catch { /* invalid selector */ }
  if (target) return (target.textContent || '').trim().slice(0, 80) || id;
  return id;
}

/**
 * Record the current page (and optionally hash) in history. Idempotent
 * within a single pageview: if the same (url, hash) pair is already at
 * the top, skip.
 */
function trackCurrent() {
  if (isPaused() || isOptedOut()) return;

  if (location.protocol === 'file:' || location.protocol === 'about:') return;

  const url = location.pathname + location.search;
  const hash = isAnchorMode() ? location.hash : '';
  const title = (document.title || '').trim();
  if (!title) return; /* untitled scratch pages — skip */

  const hashTitle = resolveHashTitle(hash);
  const ts = Date.now();
  const existing = read();

  const key = url + hash;
  const topKey = existing[0] ? existing[0].url + (existing[0].hash || '') : '';
  if (topKey === key) return; /* already at top */

  const filtered = existing.filter((e) => (e.url + (e.hash || '')) !== key);
  filtered.unshift({ url, hash, title, hashTitle, ts });
  write(filtered.slice(0, MAX_ENTRIES));
}

/* Track once when this script runs. */
trackCurrent();

/* Re-track on bfcache restore so a page that was previously "current"
   gets its timestamp refreshed if revisited via back/forward. */
window.addEventListener('pageshow', (event) => {
  if (event.persisted) trackCurrent();
});

/* Track hash navigations only when anchor mode is on. The check happens
   on every hashchange so the user can flip the toggle and have it take
   effect immediately. */
window.addEventListener('hashchange', () => {
  if (isAnchorMode()) trackCurrent();
});

/* Public surface for components / tests. */
export {
  STORAGE_KEY,
  PAUSE_KEY,
  TRACK_ANCHORS_KEY,
  MAX_ENTRIES,
  isPaused,
  isAnchorMode,
  read,
  write,
};
