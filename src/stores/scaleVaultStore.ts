/**
 * scaleVaultStore — persists Scale Vault filter state across navigation.
 * Uses sessionStorage so state survives back/forward navigation within the tab
 * but resets when the tab is closed.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ScaleVaultCategory } from '@/constants/scales';

interface ScaleVaultState {
  selectedCategory: ScaleVaultCategory | null;
  /** Root note stored as string ('C', 'C#', 'Eb', etc.) — cast to RootNote at usage site */
  selectedRoot: string;
  setSelectedCategory: (cat: ScaleVaultCategory | null) => void;
  setSelectedRoot: (root: string) => void;
}

export const useScaleVaultStore = create<ScaleVaultState>()(
  persist(
    (set) => ({
      selectedCategory: null,
      selectedRoot: 'C',
      setSelectedCategory: (cat) => set({ selectedCategory: cat }),
      setSelectedRoot: (root) => set({ selectedRoot: root }),
    }),
    {
      name: 'guitar-growth-scale-vault',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
