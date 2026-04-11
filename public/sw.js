/**
 * Service Worker for handling push notifications, background tasks, and offline caching
 * v4 — fixed orphan }); syntax error that prevented v3 from ever installing on mobile
 */

const CACHE_NAME = 'fretmaster-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install service worker and cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing fretmaster-v4...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Take control immediately — don't wait for old SW to finish
  self.skipWaiting();
});

// Activate service worker and clean up ALL old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating fretmaster-v4 — purging old caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Old caches purged. Claiming all clients.');
      return clients.claim();
    })
  );
});

// Fetch — network-first for everything (API, preview, and production)
// This guarantees mobile always gets the latest JS/CSS bundles.
// Cache is used only as an offline fallback.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST, etc.)
  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Network-first for Supabase API calls
  if (url.hostname.includes('supabase')) {
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
            return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        })
    );
    return;
  }

  // Network-first for ALL other requests (preview AND production).
  // This is the key fix: mobile production URLs now always get fresh bundles.
  // Cache only serves as offline fallback.
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
});

// Background sync for queued operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncQueuedOperations());
  }
});

async function syncQueuedOperations() {
  console.log('[SW] Background sync triggered');
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'practice') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.action === 'snooze') {
    console.log('[SW] Notification snoozed');
  } else {
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
