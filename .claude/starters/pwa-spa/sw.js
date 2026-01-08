/**
 * Service Worker
 * Provides offline support and caching
 */

const CACHE_NAME = '{{PROJECT_NAME}}-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/src/styles/main.css',
  '/src/app/main.js',
  '/images/favicon.svg'
];

/**
 * Install event - precache assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

/**
 * Activate event - clean old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch event - network first, cache fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests
  if (request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Try cache
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }

        return new Response('Offline', { status: 503 });
      })
  );
});
