import { supabase } from '@/lib/supabase';

export interface UserPresetData {
  user_id: string;
  name: string;
  filters: {
    chordIds: string[];
  };
  settings?: Record<string, any>;
}

export const presetsApi = {
  async getUserPresets(userId: string) {
    const { data, error } = await supabase
      .from('user_presets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createPreset(preset: UserPresetData) {
    const { data, error } = await supabase
      .from('user_presets')
      .insert(preset)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePreset(id: string, updates: { name?: string; filters?: any; settings?: any }) {
    const { data, error } = await supabase
      .from('user_presets')
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

  async deletePreset(id: string) {
    const { error } = await supabase
      .from('user_presets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};
