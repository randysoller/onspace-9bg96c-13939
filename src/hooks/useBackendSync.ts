import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCustomChordStore } from '@/stores/customChordStore';

/**
 * Hook to sync user data from Supabase when authenticated.
 * Presets are localStorage-only; custom chords are synced from Supabase.
 */
export const useBackendSync = () => {
  const { user, loading } = useAuthStore();
  const syncFromSupabase = useCustomChordStore(s => s.syncFromSupabase);

  useEffect(() => {
    if (!loading && user && typeof syncFromSupabase === 'function') {
      syncFromSupabase();
    }
  }, [user, loading]);
};
