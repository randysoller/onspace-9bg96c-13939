/**
 * strumVaultStore — persists Strum Pattern Vault filter state across navigation.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type RhythmTypeFilter =
  | 'all'
  | 'quarter-notes'
  | 'quarters-eighths'
  | 'sixteenths'
  | 'half-whole';

export type StyleFilter =
  | 'all'
  | 'Rock'
  | 'Pop'
  | 'Folk'
  | 'Country'
  | 'Blues'
  | 'Jazz'
  | 'Latin'
  | 'Funk'
  | 'R&B';

interface StrumVaultState {
  rhythmType: RhythmTypeFilter;
  style: StyleFilter;
  setRhythmType: (v: RhythmTypeFilter) => void;
  setStyle: (v: StyleFilter) => void;
  reset: () => void;
}

export const useStrumVaultStore = create<StrumVaultState>()(
  persist(
    (set) => ({
      rhythmType: 'all',
      style: 'all',
      setRhythmType: (v) => set({ rhythmType: v }),
      setStyle: (v) => set({ style: v }),
      reset: () => set({ rhythmType: 'all', style: 'all' }),
    }),
    {
      name: 'guitar-growth-strum-vault',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
