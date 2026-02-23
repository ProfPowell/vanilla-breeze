/**
 * Vanilla Breeze Service Worker
 *
 * Caching strategy:
 *   - Install: precache from build-injected manifest
 *   - Theme CSS (/cdn/themes/*.css): stale-while-revalidate
 *   - Optional modules (/cdn/vanilla-breeze-*.css|js): stale-while-revalidate
 *   - Activate: prune all caches not matching current version
 *   - Message channel: GET_STATUS, CLEAR_CACHE, SKIP_WAITING
 *
 * Opt-in only — consumers must register via:
 *   <meta name="vb-service-worker" content="true">
 *   or: window.__VB_SERVICE_WORKER = true
 */

/* global __VB_VERSION__, __VB_PRECACHE__ */

const CACHE_NAME = `vb-${typeof __VB_VERSION__ !== 'undefined' ? __VB_VERSION__ : 'dev'}`;
const PRECACHE_URLS = typeof __VB_PRECACHE__ !== 'undefined' ? __VB_PRECACHE__ : [
  '/cdn/vanilla-breeze-core.css',
  '/cdn/vanilla-breeze-core.js',
  '/cdn/themes/manifest.json',
];

// Patterns that use stale-while-revalidate
const SWR_PATTERNS = [
  /\/cdn\/themes\/[^/]+\.css$/,
  /\/cdn\/vanilla-breeze-[^/]+\.(css|js)$/,
  /\/cdn\/components\/[^/]+\.js$/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('vb-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSWR = SWR_PATTERNS.some(p => p.test(url.pathname));
  if (!isSWR) return;

  event.respondWith(staleWhileRevalidate(event.request));
});

/**
 * Message handler for client communication
 *
 * Supported messages:
 *   GET_STATUS  → { version, cacheName, cachedURLs }
 *   CLEAR_CACHE → { cleared: true }
 *   SKIP_WAITING → calls self.skipWaiting()
 */
self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  if (type === 'GET_STATUS') {
    handleGetStatus(event);
  } else if (type === 'CLEAR_CACHE') {
    handleClearCache(event);
  } else if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function handleGetStatus(event) {
  const version = typeof __VB_VERSION__ !== 'undefined' ? __VB_VERSION__ : 'dev';
  const cacheNames = (await caches.keys()).filter(k => k.startsWith('vb-'));
  let cachedURLs = [];

  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    cachedURLs = keys.map(req => new URL(req.url).pathname);
  } catch { /* empty cache */ }

  event.ports[0]?.postMessage({ version, cacheName: CACHE_NAME, cacheNames, cachedURLs });
}

async function handleClearCache(event) {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k.startsWith('vb-')).map(k => caches.delete(k)));
  event.ports[0]?.postMessage({ cleared: true });
}

/**
 * Stale-while-revalidate: return cached immediately, fetch fresh in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
