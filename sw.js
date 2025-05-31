// sw.js
const CACHE_NAME = "xdl-cache-dynamic";
const urlsToCache = [
  "/",
  "/index.html",
  "/js/home.min.js",
  "/public/icons/icon-192.png",
  "/public/icons/icon-512.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);

        // Fetch each URL individually and filter out failures
        const fetchPromises = urlsToCache.map(async (url) => {
          try {
            const response = await fetch(url, { redirect: "follow" });
            if (!response.ok) {
              throw new Error(`Request failed with status ${response.status}`);
            }
            return { url, response };
          } catch (error) {
            return null; // Return null for failed fetches
          }
        });

        const results = await Promise.all(fetchPromises);
        const successfulResponses = results.filter((result) => result !== null);

        if (successfulResponses.length === 0) {
          throw new Error("No resources could be cached");
        }

        // Cache only the successful responses
        await Promise.all(
          successfulResponses.map(({ url, response }) =>
            cache.put(url, response)
          )
        );

        await self.skipWaiting();
      } catch (error) {}
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
      // Delete cached root route (/) if it exists
      const cache = await caches.open(CACHE_NAME);
      await cache.delete("/");
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Always fetch from network for the root route (/) to respect redirects
  if (requestUrl.pathname === "/") {
    caches.match("/index.html").then((cachedResponse) => {
      if (cachedResponse) {
        event.respondWith(cachedResponse);
      } else {
        event.respondWith(fetch(event.request, { redirect: "follow" }));
      }
    });
    return;
  }

  // Respond only to requests for URLs in urlsToCache
  if (urlsToCache.some((url) => requestUrl.pathname.includes(url))) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request, { redirect: "follow" })
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {
              const responseToCache = networkResponse.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => caches.match("/index.html"));
      })
    );
  } else {
    // Use browser's fetch for all other requests
    event.respondWith(fetch(event.request));
  }
});

importScripts("./firebase-messaging-sw.js");
