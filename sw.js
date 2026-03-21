/* ==========================================
   PulseGrowth Service Worker (PWA)
   ------------------------------------------
   - Precache app shell
   - Versioned cache
   - Network-first for navigation
   - Stale-while-revalidate for same-origin assets
   ========================================== */

const CACHE_NAME = "pulsegrowth-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./src/css/app.css",
  "./src/js/i18n.js",
  "./src/js/app.js"
];

/**
 * INSTALL
 * Cache core assets and activate immediately.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    })()
  );
});

/**
 * ACTIVATE
 * Remove old caches and take control of open clients.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );

      await self.clients.claim();
    })()
  );
});

/**
 * FETCH
 *
 * 1) Navigation requests (pages): network-first
 *    - Good for app updates
 *    - Falls back to cached index when offline
 *
 * 2) Same-origin GET assets: stale-while-revalidate
 *    - Returns cached asset fast
 *    - Updates cache in background
 *
 * 3) Everything else: let browser handle it
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // 1) HTML navigation
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);

          // Refresh cached index for offline use
          const cache = await caches.open(CACHE_NAME);
          await cache.put("./index.html", networkResponse.clone());

          return networkResponse;
        } catch (err) {
          const cached =
            (await caches.match("./index.html")) ||
            (await caches.match("./")) ||
            (await caches.match("/index.html"));

          if (cached) return cached;

          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        }
      })()
    );
    return;
  }

  // 2) Same-origin assets (icons, manifest, css/js if embedded externally later)
  if (isSameOrigin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        const networkPromise = fetch(request)
          .then(async (networkResponse) => {
            if (
              networkResponse &&
              networkResponse.ok &&
              (networkResponse.type === "basic" || networkResponse.type === "default")
            ) {
              await cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => null);

        // stale-while-revalidate
        if (cachedResponse) {
          event.waitUntil(networkPromise);
          return cachedResponse;
        }

        const networkResponse = await networkPromise;
        if (networkResponse) return networkResponse;

        return new Response("", { status: 404, statusText: "Not Found" });
      })()
    );
  }
});