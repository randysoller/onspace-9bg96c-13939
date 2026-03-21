import { supabase } from '@/lib/supabase';

export interface UserSettings {
  id: string;
  user_id: string;
  metronome_bpm: number;
  metronome_sound: string;
  metronome_time_signature: string;
  metronome_volume: number;
  tuner_calibration: number;
  tuner_auto_listen: boolean;
  detection_sensitivity: number;
  detection_noise_gate: number;
  chord_volume: number;
  reference_tone_volume: number;
  show_diagrams: boolean;
  auto_advance: boolean;
  skill_level: string;
  created_at: string;
  updated_at: string;
}

export const settingsApi = {
  async getUserSettings(userId: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as UserSettings | null;
  },

  async syncSettings(userId: string, settings: Partial<UserSettings>) {
    const existing = await this.getUserSettings(userId);

    if (existing) {
      const { data, error } = await supabase
        .from('user_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data as UserSettings;
    } else {
      const { data, error } = await supabase
        .from('user_settings')
        .insert({ ...settings, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      return data as UserSettings;
    }
  },
};
