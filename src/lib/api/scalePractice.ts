import { supabase } from '@/lib/supabase';

export interface ScalePracticeSession {
  id: string;
  user_id: string;
  scale_name: string;
  scale_type: string;
  duration_seconds?: number;
  notes_played: number;
  accuracy: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
}

export const scalePracticeApi = {
  async createSession(session: Omit<ScalePracticeSession, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('scale_practice_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data as ScalePracticeSession;
  },

  async getUserSessions(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('scale_practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as ScalePracticeSession[];
  },

  async getScaleStats(userId: string, scaleName: string) {
    const { data, error } = await supabase
      .from('scale_practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('scale_name', scaleName);
    
    if (error) throw error;
    
    const sessions = data as ScalePracticeSession[];
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
    const totalNotesPlayed = sessions.reduce((sum, s) => sum + s.notes_played, 0);

    return {
      totalSessions,
      avgAccuracy,
      totalNotesPlayed,
      lastPracticed: sessions[0].started_at,
    };
  },
};
