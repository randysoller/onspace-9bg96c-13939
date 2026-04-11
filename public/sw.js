/**
 * Service Worker for handling push notifications, background tasks, and offline caching
 */

const CACHE_NAME = 'fretmaster-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install service worker and cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

// Fetch with network-first strategy for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API calls
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  // Network-first for development/preview, cache-first for production
  const isPreview = url.hostname.includes('localhost') || url.hostname.includes('onspace') || url.hostname.includes('127.0.0.1');
  
  if (isPreview) {
    // Network-first for preview - always get fresh content
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
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
  } else {
    // Network-first for production — always serve latest JS/CSS bundles.
    // Falls back to cache only when the user is genuinely offline.
    // This prevents mobile devices from serving stale cached bundles.
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
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
  }
});
});

// Background sync for queued operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncQueuedOperations());
  }
});

async function syncQueuedOperations() {
  // This will be triggered by the background sync hook
  console.log('Background sync triggered');
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'practice') {
    // Open practice page
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.action === 'snooze') {
    // Snooze for 1 hour
    console.log('Notification snoozed');
  } else {
    // Default click - open app
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Handle push notification
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || '🎸 FretMaster Practice Reminder';
  const options = {
    body: data.body || 'Time to practice your chords!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'practice-reminder',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});


