/**
 * Service Worker for handling push notifications and background tasks
 */

const CACHE_NAME = 'fretmaster-v1';

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

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});
