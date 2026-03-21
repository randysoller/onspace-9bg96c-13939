import { supabase } from '@/lib/supabase';

export interface PracticeGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  goal_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  target_type: 'chords' | 'accuracy' | 'sessions' | 'minutes';
  target_value: number;
  current_value: number;
  deadline?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const goalsApi = {
  async getUserGoals(userId: string) {
    const { data, error } = await supabase
      .from('practice_goals')
      .select('*')
      .eq('user_id', userId)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as PracticeGoal[];
  },

  async createGoal(goal: Omit<PracticeGoal, 'id' | 'current_value' | 'completed' | 'completed_at' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('practice_goals')
      .insert(goal)
      .select()
      .single();
    
    if (error) throw error;
    return data as PracticeGoal;
  },

  async updateGoalProgress(goalId: string, increment: number) {
    const { data: goal } = await supabase
      .from('practice_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (!goal) return;

    const newValue = goal.current_value + increment;
    const isCompleted = newValue >= goal.target_value;

    const { data, error } = await supabase
      .from('practice_goals')
      .update({
        current_value: newValue,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as PracticeGoal;
  },

  async deleteGoal(goalId: string) {
    const { error } = await supabase
      .from('practice_goals')
      .delete()
      .eq('id', goalId);
    
    if (error) throw error;
  },
};
