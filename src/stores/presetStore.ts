import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { presetsApi } from '@/lib/api/presets';
import { useAuthStore } from './authStore';

export interface ChordPreset {
  id: string;
  name: string;
  chordIds: string[];
  createdAt: number;
}

interface PresetState {
  presets: ChordPreset[];
  activePreset: string | null;
  syncing: boolean;
  addPreset: (name: string, chordIds: string[]) => Promise<string>;
  removePreset: (id: string) => Promise<void>;
  renamePreset: (id: string, name: string) => Promise<void>;
  reorderPreset: (fromIndex: number, toIndex: number) => void;
  getPreset: (id: string) => ChordPreset | undefined;
  setActivePreset: (id: string | null) => void;
  loadPresetsFromBackend: () => Promise<void>;
  setSyncing: (syncing: boolean) => void;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: [],
      activePreset: null,
      syncing: false,

      addPreset: async (name, chordIds) => {
        const id = `preset-${Date.now()}`;
        const newPreset: ChordPreset = { id, name, chordIds, createdAt: Date.now() };
        
        set((s) => ({
          presets: [...s.presets, newPreset],
        }));

        // Sync to backend if logged in
        const { user } = useAuthStore.getState();
        if (user) {
          try {
            const backendPreset = await presetsApi.createPreset({
              user_id: user.id,
              name,
              filters: { chordIds },
            });
            
            // Update with backend ID
            set((s) => ({
              presets: s.presets.map(p => 
                p.id === id ? { ...p, id: backendPreset.id } : p
              ),
            }));
            
            return backendPreset.id;
          } catch (err) {
            console.error('Failed to sync preset to backend:', err);
          }
        }
        
        return id;
      },

      removePreset: async (id) => {
        set((s) => ({ presets: s.presets.filter((p) => p.id !== id) }));
        
        // Delete from backend if logged in
        const { user } = useAuthStore.getState();
        if (user) {
          try {
            await presetsApi.deletePreset(id);
          } catch (err) {
            console.error('Failed to delete preset from backend:', err);
          }
        }
      },

      renamePreset: async (id, name) => {
        set((s) => ({
          presets: s.presets.map((p) => (p.id === id ? { ...p, name } : p)),
        }));
        
        // Update on backend if logged in
        const { user } = useAuthStore.getState();
        if (user) {
          try {
            await presetsApi.updatePreset(id, { name });
          } catch (err) {
            console.error('Failed to update preset on backend:', err);
          }
        }
      },

      reorderPreset: (fromIndex, toIndex) =>
        set((s) => {
          if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= s.presets.length || toIndex >= s.presets.length) return s;
          const next = [...s.presets];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return { presets: next };
        }),

      getPreset: (id) => get().presets.find((p) => p.id === id),
      
      setActivePreset: (id) => set({ activePreset: id }),

      loadPresetsFromBackend: async () => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        set({ syncing: true });
        try {
          const backendPresets = await presetsApi.getUserPresets(user.id);
          
          const presets: ChordPreset[] = backendPresets.map(p => ({
            id: p.id,
            name: p.name,
            chordIds: p.filters.chordIds || [],
            createdAt: new Date(p.created_at).getTime(),
          }));
          
          set({ presets, syncing: false });
        } catch (err) {
          console.error('Failed to load presets from backend:', err);
          set({ syncing: false });
        }
      },

      setSyncing: (syncing) => set({ syncing }),
    }),
    {
      name: 'fretmaster-presets',
    }
  )
);
