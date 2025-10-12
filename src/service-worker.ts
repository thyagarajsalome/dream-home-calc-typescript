// Very small offline-first service-worker skeleton. Vite will output service-worker.js
// when you copy this to public/service-worker.js or integrate with Workbox for production.

self.addEventListener("install", (event: any) => {
  console.log("Service Worker installing.");
  self.skipWaiting();
});

self.addEventListener("activate", (event: any) => {
  console.log("Service Worker activating.");
});

self.addEventListener("fetch", (event: any) => {
  // Basic network-first for navigation, otherwise try cache fallback (simplified)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
