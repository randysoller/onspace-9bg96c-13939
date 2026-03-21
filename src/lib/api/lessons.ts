import { supabase } from '@/lib/supabase';

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  lesson_type: 'chords' | 'scales' | 'theory' | 'technique';
  order_index: number;
  content: any;
  prerequisites?: string[];
  estimated_time_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface UserLesson {
  id: string;
  user_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percent: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  lesson?: Lesson;
}

export const lessonsApi = {
  async getAllLessons() {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data as Lesson[];
  },

  async getLessonsBySkillLevel(skillLevel: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('skill_level', skillLevel)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data as Lesson[];
  },

  async getUserLessons(userId: string) {
    const { data, error } = await supabase
      .from('user_lessons')
      .select(`
        *,
        lesson:lessons(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as UserLesson[];
  },

  async startLesson(userId: string, lessonId: string) {
    const { data, error } = await supabase
      .from('user_lessons')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        status: 'in_progress',
        progress_percent: 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as UserLesson;
  },

  async updateProgress(userId: string, lessonId: string, progressPercent: number) {
    const status = progressPercent >= 100 ? 'completed' : 'in_progress';
    const completed_at = progressPercent >= 100 ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from('user_lessons')
      .update({
        progress_percent: progressPercent,
        status,
        completed_at,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserLesson;
  },
};
