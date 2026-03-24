/**
 * Background sync hook for offline-first capabilities
 * Syncs queued operations when connection is restored
 */

import { useState, useEffect } from 'react';
import { indexedDB } from '@/lib/indexeddb';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export function useBackgroundSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    setIsSyncing(true);
    
    try {
      const unsyncedActions = await indexedDB.getUnsyncedActions();
      
      if (unsyncedActions.length === 0) {
        logger.info('No queued operations to sync');
        setIsSyncing(false);
        return;
      }

      logger.info(`Syncing ${unsyncedActions.length} queued operations`);
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
      }
      if (errorCount > 0) {
        toast.error(`Failed to sync ${errorCount} operations`);
      }
    } catch (error) {
      logger.error('Background sync failed', error);
      toast.error('Sync failed - will retry later');
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    isOnline,
    syncNow: syncQueuedOperations,
  };
}
