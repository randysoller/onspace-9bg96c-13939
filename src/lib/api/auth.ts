import { supabase } from '@/lib/supabase';

export const authApi = {
  async sendOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Always redirect back to the current app origin so the magic-link
        // email never points to localhost or a stale Supabase Site URL setting.
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  },

  async verifyOtpAndSetPassword(email: string, token: string, password: string, username: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;

    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password,
      data: { username },
    });
    if (updateError) throw updateError;
    
    return updateData.user;
  },

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },
};
