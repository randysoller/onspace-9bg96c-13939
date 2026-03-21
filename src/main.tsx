import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './stores/authStore'; // Initialize auth state
import { useSettingsSync } from './hooks/useSettingsSync';
import { useOfflineSync } from './hooks/useOfflineSync';

function AppWrapper() {
  useSettingsSync();
  const { isOnline, isSyncing, queuedItems } = useOfflineSync();

  useEffect(() => {
    if (!isOnline) {
      console.log('🔴 Offline mode - changes will be synced when connection is restored');
    } else if (queuedItems > 0) {
      console.log(`🔄 Syncing ${queuedItems} queued items...`);
    } else {
      console.log('✅ All changes synced');
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
