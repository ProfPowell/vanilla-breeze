/**
 * recently-visited-init: Sitewide reader-history tracker.
 *
 * Runs on every page where the VB autoload bundle is present. Records
 * every page navigation AND every in-page hash change to localStorage
 * under `vb:recently-visited`. Tracking is unconditional (data fidelity);
 * the <recently-visited> renderer decides whether anchor entries are
 * surfaced in the UI via the `vb:recently-visited:show-anchors` flag.
 *
 * Reader sovereignty:
 *   - `vb:recently-visited:paused` = "1" suspends recording entirely.
 *   - `<meta name="vb:no-track-history">` opts a single page out.
 *   - History is capped at MAX_ENTRIES (100) so localStorage doesn't bloat.
 *
 * Why a separate init: the <recently-visited> component used to track
 * inside its own connectedCallback, which only fired on pages that
 * embedded the component. Site-wide tracking belongs in the autoload
 * surface, not the renderer.
 */

const STORAGE_KEY = 'vb:recently-visited';
const PAUSE_KEY = 'vb:recently-visited:paused';
const SHOW_ANCHORS_KEY = 'vb:recently-visited:show-anchors';
const MAX_ENTRIES = 100;

function isPaused() {
  try {
    return localStorage.getItem(PAUSE_KEY) === '1';
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
 * Resolve a human-readable label for the current hash, if any. Falls
 * back to the slug when no element matches the hash id.
 */
function resolveHashTitle(hash) {
  if (!hash) return '';
  const id = hash.slice(1);
  if (!id) return '';
  let target = null;
  try { target = document.getElementById(id); } catch { /* invalid id selector */ }
  if (target) return (target.textContent || '').trim().slice(0, 80) || id;
  return id;
}

/**
 * Record the current location. Always writes both the page and (when
 * present) the hash. The renderer decides whether to surface anchor
 * entries — tracking is unconditional so the data is there if/when the
 * reader wants it.
 */
function trackCurrent() {
  if (isPaused() || isOptedOut()) return;

  if (location.protocol === 'file:' || location.protocol === 'about:') return;

  const url = location.pathname + location.search;
  const hash = location.hash;
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

/* Track once when this script runs, on bfcache restore, and on every
   in-page hash change. The renderer's show-anchors flag is irrelevant
   to tracking — it only controls visibility. */
trackCurrent();
window.addEventListener('pageshow', (event) => {
  if (event.persisted) trackCurrent();
});
window.addEventListener('hashchange', trackCurrent);

/* Public surface for components / tests. */
export {
  STORAGE_KEY,
  PAUSE_KEY,
  SHOW_ANCHORS_KEY,
  MAX_ENTRIES,
  isPaused,
  read,
  write,
};
