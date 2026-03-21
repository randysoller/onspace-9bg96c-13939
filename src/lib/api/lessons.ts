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
  async getAllLessons(skillLevel?: string) {
    let query = supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (skillLevel) {
      query = query.eq('skill_level', skillLevel);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Lesson[];
  },

  async getLesson(lessonId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();
    
    if (error) throw error;
    return data as Lesson;
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

  async getUserLesson(userId: string, lessonId: string) {
    const { data, error } = await supabase
      .from('user_lessons')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as UserLesson | null;
  },

  async startLesson(userId: string, lessonId: string) {
    const existing = await this.getUserLesson(userId, lessonId);
    
    if (existing) {
      return this.updateLessonProgress(userId, lessonId, 'in_progress', 0);
    }

    const { data, error } = await supabase
      .from('user_lessons')
      .insert({
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

  async updateLessonProgress(
    userId: string,
    lessonId: string,
    status: 'not_started' | 'in_progress' | 'completed',
    progressPercent: number
  ) {
    const { data, error } = await supabase
      .from('user_lessons')
      .update({
        status,
        progress_percent: progressPercent,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserLesson;
  },

  async getRecommendedLessons(userId: string, skillLevel: 'beginner' | 'intermediate' | 'advanced') {
    const userLessons = await this.getUserLessons(userId);
    const completedIds = new Set(
      userLessons.filter(ul => ul.status === 'completed').map(ul => ul.lesson_id)
    );

    const allLessons = await this.getAllLessons(skillLevel);
    
    // Filter to lessons not yet completed
    return allLessons.filter(l => !completedIds.has(l.id));
  },
};
