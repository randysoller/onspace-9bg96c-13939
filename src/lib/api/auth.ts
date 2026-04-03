import { supabase } from '@/lib/supabase';

export const authApi = {
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    if (error) {
      // Supabase returns 422 user_already_exists when the email is taken
      if (
        error.message?.toLowerCase().includes('already registered') ||
        (error as any)?.code === 'user_already_exists'
      ) {
        const e = new Error('An account with this email already exists. Please sign in instead.');
        (e as any).code = 'user_already_exists';
        throw e;
      }
      throw error;
    }
    // If email confirmation is disabled in Supabase (recommended for dev),
    // a session is returned immediately. If confirmation is still enabled,
    // data.session will be null and we surface a friendly message.
    if (!data.session) {
      throw new Error('Check your email to confirm your account, then sign in.');
    }
    return data.user;
  },

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      // Surface a clear message for wrong password / unrecognised credentials
      if (
        error.message?.toLowerCase().includes('invalid login credentials') ||
        (error as any)?.code === 'invalid_credentials'
      ) {
        const e = new Error('Incorrect email or password. Use "Forgot password?" to reset it.');
        (e as any).code = 'invalid_credentials';
        throw e;
      }
      throw error;
    }
    return data.user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?view=update-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },
};
