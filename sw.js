// Service worker for the "Pelada de Sexta" app.
// Bump CACHE_NAME whenever the app files change, so the new
// version gets fetched and old caches get cleaned up.
var CACHE_NAME = 'pelada-sexta-v2';

var PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
             .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Cache-first for the app shell, falling back to network,
// and updating the cache in the background when online.
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var networkFetch = fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function() {
        // Offline and not cached: for a navigation request,
        // fall back to the cached app shell so the app still opens.
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return cached;
      });

      return cached || networkFetch;
    })
  );
});
