import { supabase } from '@/lib/supabase';

export interface PracticeSessionData {
  user_id: string;
  started_at: string;
  ended_at: string;
  total_chords: number;
  correct_chords: number;
  accuracy: number;
  duration_seconds: number;
  practice_mode: string;
}

export interface PracticeEntryData {
  session_id: string;
  chord_name: string;
  was_correct: boolean;
  time_to_detect_ms?: number;
  detected_notes?: string[];
  expected_notes?: string[];
}

export const practiceApi = {
  async createSession(sessionData: PracticeSessionData) {
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createEntries(entries: PracticeEntryData[]) {
    const { data, error } = await supabase
      .from('practice_entries')
      .insert(entries)
      .select();
    
    if (error) throw error;
    return data;
  },

  async getUserSessions(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async getSessionEntries(sessionId: string) {
    const { data, error } = await supabase
      .from('practice_entries')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getUserStats(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_sessions, total_chords_practiced, average_accuracy')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUserStats(userId: string, stats: {
    total_sessions: number;
    total_chords_practiced: number;
    average_accuracy: number;
  }) {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...stats,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (error) throw error;
  },
};
