const CACHE_NAME = "workouts-v2";
const urlsToCache = [
  "/",
  "/categories",
  "/import",
  "/api/graphql",
  // Add critical assets
  "/manifest.json",
];

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching essential resources");
      return cache.addAll(urlsToCache);
    })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle GraphQL API requests - NO CACHING to prevent stale data
  if (url.pathname === "/api/graphql") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          console.log(
            "Service Worker: GraphQL network response received (no caching)"
          );
          return networkResponse;
        })
        .catch(() => {
          console.log("Service Worker: GraphQL network failed");
          return new Response(JSON.stringify({ error: "Network failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        })
    );
    return;
  }

  // Handle page requests with network-first strategy
  if (
    request.method === "GET" &&
    request.headers.get("accept").includes("text/html")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (
    request.method === "GET" &&
    (url.pathname.includes("/_next/static/") ||
      url.pathname.includes("/favicon") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".svg"))
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default: try network first, fallback to cache
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// Handle background sync for offline data
self.addEventListener("sync", (event) => {
  if (event.tag === "workout-sync") {
    console.log("Service Worker: Background sync triggered");
    event.waitUntil(syncWorkoutData());
  }
});

// Sync function for offline data
async function syncWorkoutData() {
  try {
    // This would sync any pending workout data when connection is restored
    console.log("Service Worker: Syncing workout data...");
    // Implementation would depend on your offline data storage strategy
  } catch (error) {
    console.error("Service Worker: Sync failed:", error);
  }
}

// Handle push notifications (for future features)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: data.data,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});

// Handle cache invalidation messages
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    console.log("Service Worker: Clearing cache...");
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              console.log("Service Worker: Deleting cache:", cacheName);
              return caches.delete(cacheName);
            })
          );
        })
        .then(() => {
          console.log("Service Worker: Cache cleared successfully");
          // Notify all clients that cache was cleared
          return self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({ type: "CACHE_CLEARED" });
            });
          });
        })
    );
  }
});
