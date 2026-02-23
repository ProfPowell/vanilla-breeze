/**
 * Vanilla Breeze Service Worker
 *
 * Caching strategy:
 *   - Install: precache core CSS/JS + themes manifest
 *   - Theme CSS (/cdn/themes/*.css): stale-while-revalidate
 *   - Optional modules (/cdn/vanilla-breeze-*.css|js): stale-while-revalidate
 *   - Activate: prune old cache versions
 *
 * Opt-in only — consumers must register via:
 *   <meta name="vb-service-worker" content="true">
 *   or: window.__VB_SERVICE_WORKER = true
 */

const CACHE_VERSION = 'vb-v1';
const PRECACHE_URLS = [
  '/cdn/vanilla-breeze-core.css',
  '/cdn/vanilla-breeze-core.js',
  '/cdn/themes/manifest.json',
];

// Patterns that use stale-while-revalidate
const SWR_PATTERNS = [
  /\/cdn\/themes\/[^/]+\.css$/,
  /\/cdn\/vanilla-breeze-[^/]+\.(css|js)$/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle matching patterns
  const isSWR = SWR_PATTERNS.some(p => p.test(url.pathname));
  if (!isSWR) return;

  event.respondWith(staleWhileRevalidate(event.request));
});

/**
 * Stale-while-revalidate: return cached immediately, fetch fresh in background
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  // Fetch fresh copy in background (don't await)
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached); // Network error — fall back to cached

  // Return cached immediately if available, otherwise wait for fetch
  return cached || fetchPromise;
}
