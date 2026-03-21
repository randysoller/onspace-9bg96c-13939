import { supabase } from '@/lib/supabase';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export const achievementsApi = {
  async getAllAchievements() {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: true });
    
    if (error) throw error;
    return data as Achievement[];
  },

  async getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    
    if (error) throw error;
    return data as UserAchievement[];
  },

  async checkAndAwardAchievements(userId: string) {
    // Get user stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_sessions, total_chords_practiced, average_accuracy')
      .eq('id', userId)
      .single();

    if (!profile) return [];

    // Get user's current achievements
    const userAchievements = await this.getUserAchievements(userId);
    const earnedCodes = new Set(userAchievements.map(ua => ua.achievement?.code));

    // Get all achievements
    const allAchievements = await this.getAllAchievements();

    // Check which achievements should be awarded
    const toAward: Achievement[] = [];

    for (const achievement of allAchievements) {
      if (earnedCodes.has(achievement.code)) continue;

      let shouldAward = false;

      switch (achievement.requirement_type) {
        case 'total_chords':
          shouldAward = profile.total_chords_practiced >= achievement.requirement_value;
          break;
        case 'accuracy':
          shouldAward = profile.average_accuracy >= achievement.requirement_value;
          break;
        case 'sessions':
          shouldAward = profile.total_sessions >= achievement.requirement_value;
          break;
      }

      if (shouldAward) {
        toAward.push(achievement);
      }
    }

    // Award achievements
    if (toAward.length > 0) {
      const { error } = await supabase
        .from('user_achievements')
        .insert(
          toAward.map(a => ({
            user_id: userId,
            achievement_id: a.id,
          }))
        );

      if (error) throw error;
    }

    return toAward;
  },
};
