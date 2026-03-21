import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { offlineSyncApi } from '@/lib/api/offlineSync';

export const useOfflineSync = () => {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queuedItems, setQueuedItems] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        syncQueue();
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online
    if (isOnline && user) {
      loadQueuedItems();
      syncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, isOnline]);

  const loadQueuedItems = async () => {
    if (!user) return;

    try {
      const items = await offlineSyncApi.getUnsyncedItems(user.id);
      setQueuedItems(items.length);
    } catch (err) {
      console.error('Failed to load queued items:', err);
    }
  };

  const syncQueue = async () => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    try {
      await offlineSyncApi.processSyncQueue(user.id);
      await loadQueuedItems();
    } catch (err) {
      console.error('Failed to sync queue:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const queueForSync = async (dataType: string, payload: any) => {
    if (!user) return;

    try {
      await offlineSyncApi.queueItem(user.id, dataType, payload);
      await loadQueuedItems();
      
      // Try immediate sync if online
      if (isOnline) {
        syncQueue();
      }
    } catch (err) {
      console.error('Failed to queue item:', err);
    }
  };

  return {
    isOnline,
    isSyncing,
    queuedItems,
    queueForSync,
    syncQueue,
  };
};
