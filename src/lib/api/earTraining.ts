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

  async getSessionStats(userId: string, exerciseType?: string) {
    let query = supabase
      .from('ear_training_sessions')
      .select('*')
      .eq('user_id', userId);

    if (exerciseType) {
      query = query.eq('exercise_type', exerciseType);
    }

    const { data, error } = await query;
    if (error) throw error;

    const sessions = data as EarTrainingSession[];
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
    const totalQuestions = sessions.reduce((sum, s) => sum + s.total_questions, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correct_answers, 0);

    return {
      totalSessions,
      avgAccuracy,
      totalQuestions,
      totalCorrect,
      lastPracticed: sessions[0].started_at,
    };
  },
};
