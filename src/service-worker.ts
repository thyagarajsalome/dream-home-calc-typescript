// A simple, offline-first service worker.

self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
  // Skip waiting to activate the new service worker immediately.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating.");
});

self.addEventListener("fetch", (event) => {
  // Basic network-first strategy: try to fetch from the network,
  // and if that fails, fall back to the cache.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
