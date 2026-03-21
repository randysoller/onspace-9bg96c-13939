import { supabase } from '@/lib/supabase';

export interface UserSettings {
  id: string;
  user_id: string;
  // Metronome settings
  metronome_bpm: number;
  metronome_sound: string;
  metronome_time_signature: string;
  metronome_volume: number;
  // Tuner settings
  tuner_calibration: number;
  tuner_auto_listen: boolean;
  // Detection settings
  detection_sensitivity: number;
  detection_noise_gate: number;
  // Audio settings
  chord_volume: number;
  reference_tone_volume: number;
  // Practice settings
  show_diagrams: boolean;
  auto_advance: boolean;
  // Skill level
  skill_level: 'beginner' | 'intermediate' | 'advanced';
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

  async createSettings(settings: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('user_settings')
      .insert(settings)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserSettings;
  },

  async updateSettings(userId: string, updates: Partial<UserSettings>) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserSettings;
  },

  async syncSettings(userId: string, localSettings: Partial<UserSettings>) {
    const existing = await this.getUserSettings(userId);
    
    if (!existing) {
      return this.createSettings({
        user_id: userId,
        ...localSettings,
      } as any);
    } else {
      return this.updateSettings(userId, localSettings);
    }
  },
};
