import { supabase } from '@/lib/supabase';

export interface ChallengeSession {
  id: string;
  user_id: string;
  challenge_type: 'timed' | 'blind' | 'speed_run';
  target_chords?: number;
  time_limit_seconds?: number;
  total_chords: number;
  correct_chords: number;
  accuracy: number;
  duration_seconds?: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
}

export const challengesApi = {
  async createSession(session: Omit<ChallengeSession, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('challenge_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data as ChallengeSession;
  },

  async getUserSessions(userId: string, challengeType?: string, limit = 20) {
    let query = supabase
      .from('challenge_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (challengeType) {
      query = query.eq('challenge_type', challengeType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ChallengeSession[];
  },

  async getChallengeLeaderboard(challengeType: string, limit = 10) {
    const { data, error } = await supabase
      .from('challenge_sessions')
      .select(`
        *,
        profile:profiles(username)
      `)
      .eq('challenge_type', challengeType)
      .order('accuracy', { ascending: false })
      .order('duration_seconds', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data as (ChallengeSession & { profile: { username: string } })[];
  },
};
