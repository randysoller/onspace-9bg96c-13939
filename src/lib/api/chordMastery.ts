import { supabase } from '@/lib/supabase';

export interface ChordMastery {
  id: string;
  user_id: string;
  chord_name: string;
  total_attempts: number;
  successful_attempts: number;
  accuracy: number;
  avg_detection_time_ms: number;
  fastest_time_ms?: number;
  last_practiced?: string;
  mastery_level: 'beginner' | 'intermediate' | 'advanced' | 'master';
  created_at: string;
  updated_at: string;
}

export const chordMasteryApi = {
  async getUserChordMastery(userId: string) {
    const { data, error } = await supabase
      .from('chord_mastery')
      .select('*')
      .eq('user_id', userId)
      .order('accuracy', { ascending: false });
    
    if (error) throw error;
    return data as ChordMastery[];
  },

  async updateChordMastery(userId: string, chordName: string, wasCorrect: boolean, detectionTimeMs?: number) {
    // Get existing mastery record
    const { data: existing } = await supabase
      .from('chord_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('chord_name', chordName)
      .single();

    if (!existing) {
      // Create new record
      const accuracy = wasCorrect ? 100 : 0;
      const masteryLevel = accuracy >= 90 ? 'master' : accuracy >= 75 ? 'advanced' : accuracy >= 50 ? 'intermediate' : 'beginner';

      const { data, error } = await supabase
        .from('chord_mastery')
        .insert({
          user_id: userId,
          chord_name: chordName,
          total_attempts: 1,
          successful_attempts: wasCorrect ? 1 : 0,
          accuracy,
          avg_detection_time_ms: detectionTimeMs || 0,
          fastest_time_ms: wasCorrect && detectionTimeMs ? detectionTimeMs : null,
          last_practiced: new Date().toISOString(),
          mastery_level: masteryLevel,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Update existing record
    const newTotalAttempts = existing.total_attempts + 1;
    const newSuccessfulAttempts = existing.successful_attempts + (wasCorrect ? 1 : 0);
    const newAccuracy = (newSuccessfulAttempts / newTotalAttempts) * 100;

    const newAvgTime = detectionTimeMs
      ? ((existing.avg_detection_time_ms * existing.total_attempts) + detectionTimeMs) / newTotalAttempts
      : existing.avg_detection_time_ms;

    const newFastestTime = wasCorrect && detectionTimeMs
      ? Math.min(existing.fastest_time_ms || Infinity, detectionTimeMs)
      : existing.fastest_time_ms;

    const masteryLevel = newAccuracy >= 90 ? 'master' : newAccuracy >= 75 ? 'advanced' : newAccuracy >= 50 ? 'intermediate' : 'beginner';

    const { data, error } = await supabase
      .from('chord_mastery')
      .update({
        total_attempts: newTotalAttempts,
        successful_attempts: newSuccessfulAttempts,
        accuracy: newAccuracy,
        avg_detection_time_ms: newAvgTime,
        fastest_time_ms: newFastestTime,
        last_practiced: new Date().toISOString(),
        mastery_level: masteryLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getWeakestChords(userId: string, limit = 5) {
    const { data, error } = await supabase
      .from('chord_mastery')
      .select('*')
      .eq('user_id', userId)
      .order('accuracy', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data as ChordMastery[];
  },
};
