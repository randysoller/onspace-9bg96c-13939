import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChordPreset {
  id: string;
  name: string;
  chordIds: string[];
  createdAt: number;
}

interface PresetState {
  presets: ChordPreset[];
  activePreset: string | null;
  addPreset: (name: string, chordIds: string[]) => string;
  removePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
  reorderPreset: (fromIndex: number, toIndex: number) => void;
  getPreset: (id: string) => ChordPreset | undefined;
  setActivePreset: (id: string | null) => void;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: [],
      activePreset: null,

      addPreset: (name, chordIds) => {
        const id = `preset-${Date.now()}`;
        const newPreset: ChordPreset = { id, name, chordIds, createdAt: Date.now() };
        set((s) => ({
          presets: [...s.presets, newPreset],
        }));
        return id;
      },

      removePreset: (id) =>
        set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),

      renamePreset: (id, name) =>
        set((s) => ({
          presets: s.presets.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

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
    }),
    {
      name: 'fretmaster-presets',
    }
  )
);
