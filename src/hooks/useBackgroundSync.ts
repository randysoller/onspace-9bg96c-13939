/**
 * Background sync hook for offline-first capabilities
 * Syncs queued operations when connection is restored
 */

import { useState, useEffect } from 'react';
import { indexedDB } from '@/lib/indexeddb';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 5000; // 5 seconds

export function useBackgroundSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('Connection restored - syncing queued operations');
      syncQueuedOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Connection lost - entering offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncQueuedOperations = async () => {
    // Prevent multiple simultaneous syncs
    if (isSyncing) {
      logger.warn('Sync already in progress, skipping');
      return;
    }
    
    // Check retry limit
    if (retryCount >= MAX_RETRY_COUNT) {
      logger.warn(`Max retry count (${MAX_RETRY_COUNT}) reached, stopping sync attempts`);
      toast.error('Sync failed multiple times. Please check your connection.');
      return;
    }
    
    setIsSyncing(true);
    
    try {
      const unsyncedActions = await indexedDB.getUnsyncedActions();
      
      if (unsyncedActions.length === 0) {
        logger.info('No queued operations to sync');
        setIsSyncing(false);
        setRetryCount(0); // Reset retry count on success
        return;
      }

      logger.info(`Syncing ${unsyncedActions.length} queued operations (attempt ${retryCount + 1}/${MAX_RETRY_COUNT})`);
      let successCount = 0;
      let errorCount = 0;

      for (const action of unsyncedActions) {
        try {
          // Execute the queued operation
          if (action.type === 'create') {
            const { error } = await supabase.from(action.storeName).insert(action.data);
            if (error) throw error;
          } else if (action.type === 'update') {
            const { error } = await supabase.from(action.storeName)
              .update(action.data)
              .eq('id', action.data.id);
            if (error) throw error;
          } else if (action.type === 'delete') {
            const { error } = await supabase.from(action.storeName)
              .delete()
              .eq('id', action.data.id);
            if (error) throw error;
          }

          // Mark as synced
          await indexedDB.markActionSynced(action.id);
          successCount++;
        } catch (error) {
          logger.error('Failed to sync operation', { action, error });
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Synced ${successCount} operations`);
        setRetryCount(0); // Reset retry count on partial success
      }
      if (errorCount > 0) {
        setRetryCount(prev => prev + 1);
        
        // Retry after delay if under limit
        if (retryCount + 1 < MAX_RETRY_COUNT) {
          setTimeout(() => syncQueuedOperations(), RETRY_DELAY);
          toast.error(`Failed to sync ${errorCount} operations. Retrying...`);
        } else {
          toast.error(`Failed to sync ${errorCount} operations. Max retries reached.`);
        }
      }
    } catch (error) {
      logger.error('Background sync failed', error);
      setRetryCount(prev => prev + 1);
      
      if (retryCount + 1 < MAX_RETRY_COUNT) {
        setTimeout(() => syncQueuedOperations(), RETRY_DELAY);
        toast.error('Sync failed - retrying...');
      } else {
        toast.error('Sync failed. Please try again later.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    isOnline,
    retryCount,
    syncNow: syncQueuedOperations,
    resetRetryCount: () => setRetryCount(0),
  };
}
