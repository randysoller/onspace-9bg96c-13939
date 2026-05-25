/**
 * strumVaultStore — persists Strum Pattern Vault filter + selection state across navigation.
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
  // ── Filters ──────────────────────────────────────────────────────────────
  rhythmType: RhythmTypeFilter;
  style: StyleFilter;
  setRhythmType: (v: RhythmTypeFilter) => void;
  setStyle: (v: StyleFilter) => void;
  reset: () => void;

  // ── Selection ────────────────────────────────────────────────────────────
  selectedPatternIds: string[];
  togglePatternSelection: (id: string) => void;
  setSelectedPatternIds: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useStrumVaultStore = create<StrumVaultState>()(
  persist(
    (set, get) => ({
      // ── Filter defaults ───────────────────────────────────────────────────
      rhythmType: 'all',
      style: 'all',
      setRhythmType: (v) => set({ rhythmType: v }),
      setStyle: (v) => set({ style: v }),
      reset: () => set({ rhythmType: 'all', style: 'all' }),

      // ── Selection defaults ────────────────────────────────────────────────
      selectedPatternIds: [],
      togglePatternSelection: (id) => {
        const current = get().selectedPatternIds;
        if (current.includes(id)) {
          set({ selectedPatternIds: current.filter(x => x !== id) });
        } else {
          set({ selectedPatternIds: [...current, id] });
        }
      },
      setSelectedPatternIds: (ids) => set({ selectedPatternIds: ids }),
      clearSelection: () => set({ selectedPatternIds: [] }),
    }),
    {
      name: 'guitar-growth-strum-vault',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist filters — selection resets on page reload intentionally
      partialize: (state) => ({
        rhythmType: state.rhythmType,
        style: state.style,
      }),
    }
  )
);
