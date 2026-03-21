import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePresetStore } from '@/stores/presetStore';

/**
 * Hook to load user data from backend when authenticated
 */
export const useBackendSync = () => {
  const { user, loading } = useAuthStore();
  const { loadPresetsFromBackend } = usePresetStore();

  useEffect(() => {
    if (!loading && user) {
      // Load presets from backend
      loadPresetsFromBackend();
    }
  }, [user, loading]);
};
