import { supabase } from '@/lib/supabase';

export interface OfflineSyncQueueItem {
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
    return data as OfflineSyncQueueItem;
  },

  async getUnsyncedItems(userId: string) {
    const { data, error } = await supabase
      .from('offline_sync_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('synced', false)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as OfflineSyncQueueItem[];
  },

  async markSynced(itemId: string) {
    const { error } = await supabase
      .from('offline_sync_queue')
      .update({
        synced: true,
        synced_at: new Date().toISOString(),
      })
      .eq('id', itemId);
    
    if (error) throw error;
  },

  async incrementAttempts(itemId: string) {
    const { data: item } = await supabase
      .from('offline_sync_queue')
      .select('sync_attempts')
      .eq('id', itemId)
      .single();

    if (!item) return;

    const { error } = await supabase
      .from('offline_sync_queue')
      .update({
        sync_attempts: item.sync_attempts + 1,
        last_sync_attempt: new Date().toISOString(),
      })
      .eq('id', itemId);
    
    if (error) throw error;
  },

  async deleteItem(itemId: string) {
    const { error } = await supabase
      .from('offline_sync_queue')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
  },

  async processSyncQueue(userId: string) {
    const items = await this.getUnsyncedItems(userId);
    
    for (const item of items) {
      try {
        // Process based on data_type
        switch (item.data_type) {
          case 'practice_session':
            const { practiceApi } = await import('./practice');
            await practiceApi.createSession(item.payload);
            break;
          case 'chord_mastery':
            const { chordMasteryApi } = await import('./chordMastery');
            await chordMasteryApi.updateChordMastery(
              item.payload.user_id,
              item.payload.chord_name,
              item.payload.was_correct,
              item.payload.time_ms
            );
            break;
          case 'goal_progress':
            const { goalsApi } = await import('./goals');
            await goalsApi.updateGoalProgress(
              item.payload.goal_id,
              item.payload.increment
            );
            break;
          default:
            console.warn('Unknown data type:', item.data_type);
        }

        await this.markSynced(item.id);
      } catch (err) {
        console.error('Failed to sync item:', item.id, err);
        await this.incrementAttempts(item.id);
        
        // Delete if too many failed attempts
        if (item.sync_attempts >= 5) {
          await this.deleteItem(item.id);
        }
      }
    }
  },
};
