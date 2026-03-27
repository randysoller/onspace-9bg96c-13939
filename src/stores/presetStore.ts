/**
 * Preset Store — ChordPreset CRUD with localStorage persistence and drag-reorder
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChordPreset {
  id: string;              // 'preset-{timestamp}'
  name: string;
  chordIds: string[];
  createdAt: number;
}

interface PresetState {
  presets: ChordPreset[];
  addPreset: (name: string, chordIds: string[]) => string;
  removePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
  reorderPreset: (fromIndex: number, toIndex: number) => void;
  getPreset: (id: string) => ChordPreset | undefined;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: [],
      
      addPreset: (name, chordIds) => {
        const id = `preset-${Date.now()}`;
        const newPreset: ChordPreset = {
          id,
          name,
          chordIds,
          createdAt: Date.now(),
        };
        
        set((state) => ({
          presets: [...state.presets, newPreset],
        }));
        
        // Force-sync to localStorage immediately
        try {
          const current = JSON.parse(localStorage.getItem('fretmaster-presets') || '{"state":{"presets":[]}}');
          current.state.presets = [...(current.state?.presets ?? []), newPreset];
          localStorage.setItem('fretmaster-presets', JSON.stringify(current));
        } catch (err) {
          console.error('Failed to force-sync preset to localStorage:', err);
        }
        
        return id;
      },
      
      removePreset: (id) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        }));
      },
      
      renamePreset: (id, name) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, name } : p
          ),
        }));
      },
      
      reorderPreset: (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;
        
        set((state) => {
          const presets = [...state.presets];
          if (fromIndex < 0 || fromIndex >= presets.length) return state;
          if (toIndex < 0 || toIndex >= presets.length) return state;
          
          const [moved] = presets.splice(fromIndex, 1);
          presets.splice(toIndex, 0, moved);
          
          return { presets };
        });
      },
      
      getPreset: (id) => {
        return get().presets.find((p) => p.id === id);
      },
    }),
    {
      name: 'fretmaster-presets',
      partialize: (state) => ({ presets: state.presets }),
      merge: (persisted: any, current) => ({
        ...current,
        presets: (persisted as any)?.presets ?? [],
      }),
    }
  )
);
