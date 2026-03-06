const CACHE_NAME = "dream-home-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // IGNORE cross-origin requests (like Supabase API) and non-GET requests (like POST)
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return; 
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        return response || new Response("Offline", { status: 503 });
      });
    })
  );
});