// public/sw.js
const CACHE_NAME = "dream-home-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // 1. Bypass Service Worker for non-GET requests (Sign-in, Save Project, etc.)
  if (event.request.method !== "GET") return;

  // 2. Bypass Service Worker for external API calls (Supabase/Razorpay)
  if (event.request.url.includes("supabase.co") || event.request.url.includes("razorpay.com")) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cachedResponse = await caches.match(event.request);
      // Only return the cached response if it exists, otherwise let it fail naturally
      if (cachedResponse) return cachedResponse;
      
      // If offline and no cache, you could optionally return an offline page here
      throw new Error("Offline and no cache available");
    })
  );
});