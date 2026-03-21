import { supabase } from '@/lib/supabase';

export interface PracticeStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
  streak_start_date: string | null;
  created_at: string;
  updated_at: string;
}

export const streaksApi = {
  async getUserStreak(userId: string): Promise<PracticeStreak | null> {
    const { data, error } = await supabase
      .from('practice_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateStreak(userId: string): Promise<PracticeStreak> {
    const today = new Date().toISOString().split('T')[0];
    const streak = await this.getUserStreak(userId);

    if (!streak) {
      // Create new streak
      const { data, error } = await supabase
        .from('practice_streaks')
        .insert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_practice_date: today,
          streak_start_date: today,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Check if already practiced today
    if (streak.last_practice_date === today) {
      return streak;
    }

    const lastDate = new Date(streak.last_practice_date || today);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    let newCurrentStreak = streak.current_streak;
    let newStreakStartDate = streak.streak_start_date;

    if (diffDays === 1) {
      // Consecutive day
      newCurrentStreak += 1;
    } else if (diffDays > 1) {
      // Streak broken
      newCurrentStreak = 1;
      newStreakStartDate = today;
    }

    const newLongestStreak = Math.max(streak.longest_streak, newCurrentStreak);

    const { data, error } = await supabase
      .from('practice_streaks')
      .update({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_practice_date: today,
        streak_start_date: newStreakStartDate,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
