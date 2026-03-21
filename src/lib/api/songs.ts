import { supabase } from '@/lib/supabase';

export interface Song {
  id: string;
  title: string;
  artist: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  chord_progression: { chord: string; duration: number }[];
  bpm?: number;
  key?: string;
  genre?: string;
  created_by?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSong {
  id: string;
  user_id: string;
  song_id: string;
  is_favorited: boolean;
  is_mastered: boolean;
  practice_count: number;
  best_accuracy: number;
  last_practiced?: string;
  created_at: string;
  updated_at: string;
  song?: Song;
}

export const songsApi = {
  async getAllSongs(difficulty?: string) {
    let query = supabase
      .from('songs')
      .select('*')
      .eq('is_public', true);

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Song[];
  },

  async getUserSongs(userId: string) {
    const { data, error } = await supabase
      .from('user_songs')
      .select(`
        *,
        song:songs(*)
      `)
      .eq('user_id', userId)
      .order('last_practiced', { ascending: false, nullsFirst: false });
    
    if (error) throw error;
    return data as UserSong[];
  },

  async createSong(song: Omit<Song, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('songs')
      .insert(song)
      .select()
      .single();
    
    if (error) throw error;
    return data as Song;
  },

  async updateUserSongProgress(userId: string, songId: string, accuracy: number) {
    const { data: existing } = await supabase
      .from('user_songs')
      .select('*')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .single();

    if (!existing) {
      // Create new record
      const { data, error } = await supabase
        .from('user_songs')
        .insert({
          user_id: userId,
          song_id: songId,
          practice_count: 1,
          best_accuracy: accuracy,
          is_mastered: accuracy >= 90,
          last_practiced: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Update existing record
    const { data, error } = await supabase
      .from('user_songs')
      .update({
        practice_count: existing.practice_count + 1,
        best_accuracy: Math.max(existing.best_accuracy, accuracy),
        is_mastered: Math.max(existing.best_accuracy, accuracy) >= 90,
        last_practiced: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleFavorite(userId: string, songId: string) {
    const { data: existing } = await supabase
      .from('user_songs')
      .select('*')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .single();

    if (!existing) {
      const { data, error } = await supabase
        .from('user_songs')
        .insert({
          user_id: userId,
          song_id: songId,
          is_favorited: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('user_songs')
      .update({
        is_favorited: !existing.is_favorited,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
