// Heimdall PWA Service Worker
const CACHE_NAME = 'heimdall-v1';

// Static assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Install — pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate — delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always pass through API calls, auth requests, and cross-origin requests
  if (
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin ||
    request.method !== 'GET'
  ) {
    return;
  }

  // For navigation requests (page loads) — network first, fall back to cached index
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then((cached) => cached || fetch(request))
      )
    );
    return;
  }

  // For static assets — cache first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
        return response;
      });
    })
  );
});
