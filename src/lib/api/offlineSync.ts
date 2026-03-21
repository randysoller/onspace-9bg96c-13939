import { supabase } from '@/lib/supabase';
import { practiceApi } from './practice';
import { chordMasteryApi } from './chordMastery';
import { goalsApi } from './goals';

export interface OfflineSyncItem {
  id: string;
  user_id: string;
  data_type: string;
  payload: any;
  synced: boolean;
  sync_attempts: number;
  last_sync_attempt?: string;
  created_at: string;
  synced_at?: string;
}

export const offlineSyncApi = {
  async queueItem(userId: string, dataType: string, payload: any) {
    const { data, error } = await supabase
      .from('offline_sync_queue')
      .insert({
        user_id: userId,
        data_type: dataType,
        payload,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as OfflineSyncItem;
  },

  async getUnsyncedItems(userId: string) {
    const { data, error } = await supabase
      .from('offline_sync_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('synced', false)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as OfflineSyncItem[];
  },

  async processSyncQueue(userId: string) {
    const items = await this.getUnsyncedItems(userId);

    for (const item of items) {
      try {
        await this.syncItem(item);
        
        // Mark as synced
        await supabase
          .from('offline_sync_queue')
          .update({
            synced: true,
            synced_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      } catch (err) {
        console.error(`Failed to sync item ${item.id}:`, err);
        
        // Increment sync attempts
        await supabase
          .from('offline_sync_queue')
          .update({
            sync_attempts: item.sync_attempts + 1,
            last_sync_attempt: new Date().toISOString(),
          })
          .eq('id', item.id);
      }
    }
  },

  async syncItem(item: OfflineSyncItem) {
    switch (item.data_type) {
      case 'practice_session':
        await practiceApi.saveSession(item.payload);
        break;
      
      case 'chord_mastery':
        await chordMasteryApi.updateChordMastery(
          item.user_id,
          item.payload.chord_name,
          item.payload.was_correct,
          item.payload.detection_time_ms
        );
        break;
      
      case 'goal_progress':
        await goalsApi.updateGoalProgress(item.payload.goal_id, item.payload.progress);
        break;
      
      default:
        console.warn(`Unknown data type: ${item.data_type}`);
    }
  },

  async clearSyncedItems(userId: string) {
    const { error } = await supabase
      .from('offline_sync_queue')
      .delete()
      .eq('user_id', userId)
      .eq('synced', true);
    
    if (error) throw error;
  },
};
