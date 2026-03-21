import { supabase } from '@/lib/supabase';

export interface CustomChordData {
  user_id: string;
  name: string;
  frets: number[];
  fingers?: number[];
  notes?: string[];
  chord_type?: string;
}

export const customChordsApi = {
  async getUserChords(userId: string) {
    const { data, error } = await supabase
      .from('custom_chords')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createChord(chord: CustomChordData) {
    const { data, error } = await supabase
      .from('custom_chords')
      .insert(chord)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateChord(id: string, updates: Partial<CustomChordData>) {
    const { data, error } = await supabase
      .from('custom_chords')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteChord(id: string) {
    const { error } = await supabase
      .from('custom_chords')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};
