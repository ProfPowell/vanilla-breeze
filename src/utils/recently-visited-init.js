/**
 * recently-visited-init: Sitewide reader-history tracker.
 *
 * Runs on every page where the VB autoload bundle is present. Writes
 * { url, title, ts } to localStorage under `vb:recently-visited` so
 * that <recently-visited> on any page (or future surface) can render
 * the reader's history. Pure client-side, never sent to a backend.
 *
 * Reader sovereignty:
 *   - Reads `vb:recently-visited:paused` from localStorage; if "1",
 *     skips the write entirely.
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
    /* quota exceeded or private mode — silently drop. The reader's
       history is best-effort, not a contract. */
  }
}

/**
 * Record the current page in history. Idempotent within a single
 * pageview: if the same URL is already at the top, skip.
 */
function trackCurrent() {
  if (isPaused() || isOptedOut()) return;

  /* Skip non-content URLs that can't be meaningfully restored as a
     "recently visited" entry. */
  if (location.protocol === 'file:' || location.protocol === 'about:') return;

  const url = location.pathname + location.search;
  const title = (document.title || '').trim();
  if (!title) return; /* untitled scratch pages — skip */

  const ts = Date.now();
  const existing = read();

  /* Already at top with the same URL? Nothing to do. */
  if (existing[0]?.url === url) return;

  const filtered = existing.filter((e) => e.url !== url);
  filtered.unshift({ url, title, ts });
  write(filtered.slice(0, MAX_ENTRIES));
}

/* Track once when this script runs. The autoload bundle imports us
   after DOMContentLoaded, so document.title is reliable. Also re-track
   on bfcache restore (back/forward navigations) so a page that was
   previously "current" gets its timestamp refreshed if revisited. */
trackCurrent();
window.addEventListener('pageshow', (event) => {
  if (event.persisted) trackCurrent();
});

/* Public surface for components / tests. Same names <recently-visited>
   uses internally so they read the same store. */
export { STORAGE_KEY, PAUSE_KEY, MAX_ENTRIES, isPaused, read, write };
