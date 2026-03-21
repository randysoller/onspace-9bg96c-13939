import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  period: 'all_time' | 'weekly' | 'monthly';
  rank: number;
  total_sessions: number;
  total_chords: number;
  average_accuracy: number;
  total_points: number;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    avatar_url?: string;
  };
}

export const leaderboardApi = {
  async getLeaderboard(period: 'all_time' | 'weekly' | 'monthly' = 'all_time', limit = 100) {
    const { data, error } = await supabase
      .from('leaderboard_cache')
      .select(`
        *,
        profile:profiles(username, avatar_url)
      `)
      .eq('period', period)
      .order('rank', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data as LeaderboardEntry[];
  },

  async getUserRank(userId: string, period: 'all_time' | 'weekly' | 'monthly' = 'all_time') {
    const { data, error } = await supabase
      .from('leaderboard_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('period', period)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as LeaderboardEntry | null;
  },

  async refreshLeaderboard(period: 'all_time' | 'weekly' | 'monthly' = 'all_time') {
    // This would typically be done via a scheduled Edge Function
    // For now, we'll calculate it on-demand from practice_sessions
    
    let dateFilter = '';
    if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = weekAgo.toISOString();
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = monthAgo.toISOString();
    }

    // Get all users with their session stats
    const { data: sessions, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('user_id, total_chords, correct_chords, accuracy')
      .gte('created_at', dateFilter || '1970-01-01');

    if (sessionsError) throw sessionsError;

    // Aggregate by user
    const userStats = new Map<string, { sessions: number; chords: number; totalAccuracy: number }>();

    sessions?.forEach(session => {
      const existing = userStats.get(session.user_id) || { sessions: 0, chords: 0, totalAccuracy: 0 };
      userStats.set(session.user_id, {
        sessions: existing.sessions + 1,
        chords: existing.chords + session.total_chords,
        totalAccuracy: existing.totalAccuracy + Number(session.accuracy),
      });
    });

    // Calculate rankings
    const rankings = Array.from(userStats.entries()).map(([user_id, stats]) => ({
      user_id,
      period,
      total_sessions: stats.sessions,
      total_chords: stats.chords,
      average_accuracy: stats.totalAccuracy / stats.sessions,
      total_points: Math.floor(stats.chords * (stats.totalAccuracy / stats.sessions) / 10),
    }));

    rankings.sort((a, b) => b.total_points - a.total_points);

    // Add ranks
    const rankedEntries = rankings.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    // Upsert to leaderboard_cache
    if (rankedEntries.length > 0) {
      const { error } = await supabase
        .from('leaderboard_cache')
        .upsert(rankedEntries, { onConflict: 'user_id,period' });

      if (error) throw error;
    }

    return rankedEntries;
  },
};
