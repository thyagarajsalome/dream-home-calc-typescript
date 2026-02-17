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
  // This is a "network-first" strategy.
  event.respondWith(
    fetch(event.request).catch(() => {
      // If the network request fails (e.g., offline),
      // try to find a match in the cache.
      return caches.match(event.request).then((response) => {
        // If a response is found in the cache, return it.
        // Otherwise, return a basic offline response to prevent crashing.
        
        return (
          response ||
          new Response("You are offline and this resource is not cached.", {
            status: 404,
            headers: { "Content-Type": "text/plain" },
          })
        );
      });
    })
  );
});
