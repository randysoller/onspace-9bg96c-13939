import { supabase } from '@/lib/supabase';

export interface EarTrainingSession {
  id: string;
  user_id: string;
  exercise_type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  avg_response_time_ms?: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
}

export const earTrainingApi = {
  async createSession(session: Omit<EarTrainingSession, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('ear_training_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data as EarTrainingSession;
  },

  async getUserSessions(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('ear_training_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as EarTrainingSession[];
  },

  async getExerciseStats(userId: string, exerciseType: string) {
    const { data, error } = await supabase
      .from('ear_training_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_type', exerciseType);
    
    if (error) throw error;
    
    const sessions = data as EarTrainingSession[];
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
    const avgResponseTime = sessions.reduce((sum, s) => sum + (s.avg_response_time_ms || 0), 0) / totalSessions;

    return {
      totalSessions,
      avgAccuracy,
      avgResponseTime,
      lastPracticed: sessions[0].started_at,
    };
  },
};
