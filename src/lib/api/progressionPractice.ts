import { supabase } from '@/lib/supabase';

export interface ProgressionSessionData {
  user_id: string;
  progression_name: string;
  key: string;
  scale: string;
  total_chords: number;
  completed_cycles: number;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
}

export interface ProgressionEntryData {
  session_id: string;
  chord_name: string;
  chord_position: number;
  roman_numeral: string;
}

export const progressionPracticeApi = {
  async createSession(sessionData: ProgressionSessionData) {
    const { data, error } = await supabase
      .from('progression_practice_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createEntries(entries: ProgressionEntryData[]) {
    const { data, error } = await supabase
      .from('progression_entries')
      .insert(entries)
      .select();
    
    if (error) throw error;
    return data;
  },

  async getUserSessions(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('progression_practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async getSessionEntries(sessionId: string) {
    const { data, error } = await supabase
      .from('progression_entries')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getProgressionStats(userId: string) {
    const { data, error } = await supabase
      .from('progression_practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Calculate aggregate stats
    const totalSessions = data.length;
    const totalCycles = data.reduce((sum, session) => sum + (session.completed_cycles || 0), 0);
    const totalDuration = data.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);
    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    return {
      totalSessions,
      totalCycles,
      totalDuration,
      avgDuration,
      recentSessions: data.slice(0, 10),
    };
  },
};
