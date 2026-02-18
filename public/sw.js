// public/sw.js
const CACHE_NAME = "dream-home-v2";

// Install event - skip waiting to force update
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate event - claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
           // Delete ALL old caches to remove Firebase files
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});