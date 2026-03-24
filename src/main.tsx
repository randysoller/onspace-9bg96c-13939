import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './stores/authStore'; // Initialize auth state
import { useSettingsSync } from './hooks/useSettingsSync';
import { useOfflineSync } from './hooks/useOfflineSync';
import { logger } from './lib/logger';

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        logger.info('Service Worker registered', { scope: registration.scope });
      })
      .catch((error) => {
        logger.error('Service Worker registration failed', error);
      });
  });
}

function AppWrapper() {
  useSettingsSync();
  const { isOnline, isSyncing, queuedItems } = useOfflineSync();

  useEffect(() => {
    if (!isOnline) {
      logger.warn('Offline mode - changes will be synced when connection is restored');
    } else if (queuedItems > 0) {
      logger.info(`Syncing ${queuedItems} queued items...`);
    } else {
      logger.info('All changes synced');
    }
  }, [isOnline, queuedItems]);

  return (
    <>
      <App />
      {!isOnline && (
        <div className="fixed bottom-4 left-4 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm font-medium z-50">
          Offline Mode
        </div>
      )}
      {isOnline && isSyncing && (
        <div className="fixed bottom-4 left-4 bg-blue-500/90 text-white px-4 py-2 rounded-lg text-sm font-medium z-50">
          Syncing... ({queuedItems} items)
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);
