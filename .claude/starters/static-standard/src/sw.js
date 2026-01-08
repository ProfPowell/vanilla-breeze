/**
 * Service Worker
 * Provides offline support and caching strategies
 */

const CACHE_VERSION = 'app-cache-v1.0.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/errors/offline.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/images/favicon.svg',
  '/assets/images/logo.svg'
];

/**
 * Install event - precache essential assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Install complete');
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_VERSION)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activate complete');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - handle requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(handleFetch(request));
});

/**
 * Handle fetch with appropriate strategy
 */
async function handleFetch(request) {
  const url = new URL(request.url);

  // HTML pages - network first with offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    return networkFirstWithOfflineFallback(request);
  }

  // Static assets (CSS, JS, images) - cache first
  if (isStaticAsset(url.pathname)) {
    return cacheFirst(request);
  }

  // Default - network first
  return networkFirst(request);
}

/**
 * Check if path is a static asset
 */
function isStaticAsset(pathname) {
  return /\.(css|js|png|jpg|jpeg|gif|svg|webp|avif|woff2?|ttf|eot)$/i.test(pathname);
}

/**
 * Network first with offline fallback for HTML
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Return offline page as fallback
    return caches.match('/errors/offline.html');
  }
}

/**
 * Cache first strategy for static assets
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

/**
 * Network first strategy
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Network error', { status: 503 });
  }
}
