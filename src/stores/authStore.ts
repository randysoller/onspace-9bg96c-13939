import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/types/auth';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

function mapSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username: user.user_metadata?.username || user.user_metadata?.full_name || user.email!.split('@')[0],
    avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: (user) => set({ user, loading: false }),
  logout: () => set({ user: null, loading: false }),
  setLoading: (loading) => set({ loading }),
}));

/**
 * Initialize auth state — must be called AFTER createRoot().render() in main.tsx
 * so React's hook dispatcher is ready before any Supabase callbacks fire.
 * Running these calls at module-load time (top-level) races with React init
 * and causes "dispatcher is null" errors in BrowserRouter.
 */
export function initAuth(): void {
  let mounted = true;

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (mounted && session?.user) {
      useAuthStore.getState().login(mapSupabaseUser(session.user));
    }
    if (mounted) {
      useAuthStore.getState().setLoading(false);
    }
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        useAuthStore.getState().login(mapSupabaseUser(session.user));
        useAuthStore.getState().setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        useAuthStore.getState().logout();
        useAuthStore.getState().setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        useAuthStore.getState().login(mapSupabaseUser(session.user));
      }
    }
  );

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      mounted = false;
      subscription.unsubscribe();
    });
  }
}
