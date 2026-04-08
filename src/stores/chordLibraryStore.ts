import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChordCategory, ChordType, BarreRoot } from '@/types/chord';
import type { KeySignature } from '@/constants/scales';

export type PositionFilter = 'open' | 'low' | 'mid' | 'high';

interface ChordLibraryState {
  filterCategories: ChordCategory[];
  filterTypes: ChordType[];
  filterBarreRoots: BarreRoot[];
  filterPositions: PositionFilter[];
  filterKey: KeySignature | null;
  searchQuery: string;
  activeLibraryPresetId: string | null;
  selectedChordIds: string[];
  savedScrollY: number;
  
  toggleCategory: (cat: ChordCategory) => void;
  clearCategories: () => void;
  toggleType: (type: ChordType) => void;
  setFilterTypes: (types: ChordType[]) => void;
  clearTypes: () => void;
  toggleBarreRoot: (root: BarreRoot) => void;
  clearBarreRoots: () => void;
  togglePosition: (pos: PositionFilter) => void;
  clearPositions: () => void;
  setFilterKey: (ks: KeySignature | null) => void;
  setSearchQuery: (q: string) => void;
  setActiveLibraryPreset: (id: string | null) => void;
  toggleChordSelection: (id: string) => void;
  setSelectedChordIds: (ids: string[]) => void;
  clearSelectedChords: () => void;
  setSavedScrollY: (y: number) => void;
  clearAll: () => void;
}

export const useChordLibraryStore = create<ChordLibraryState>()(
  persist(
    (set) => ({
      filterCategories: [],
      filterTypes: [],
      filterBarreRoots: [],
      filterPositions: [],
      filterKey: null,
      searchQuery: '',
      activeLibraryPresetId: null,
      selectedChordIds: [],
      savedScrollY: 0,

      toggleCategory: (cat) =>
        set((state) => {
          const has = state.filterCategories.includes(cat);
          const next = has
            ? state.filterCategories.filter((c) => c !== cat)
            : [...state.filterCategories, cat];

          // Side effect: if neither barre nor movable remain, clear root filter
          const hasBarre = next.includes('barre');
          const hasMovable = next.includes('movable');
          const clearRoots = !hasBarre && !hasMovable;

          return {
            filterCategories: next,
            filterBarreRoots: clearRoots ? [] : state.filterBarreRoots,
          };
        }),

      clearCategories: () =>
        set({
          filterCategories: [],
          filterBarreRoots: [],
        }),

      toggleType: (type) =>
        set((state) => {
          const has = state.filterTypes.includes(type);
          return {
            filterTypes: has
              ? state.filterTypes.filter((t) => t !== type)
              : [...state.filterTypes, type],
          };
        }),

      setFilterTypes: (types) => set({ filterTypes: types }),

      clearTypes: () => set({ filterTypes: [] }),

      toggleBarreRoot: (root) =>
        set((state) => {
          const has = state.filterBarreRoots.includes(root);
          return {
            filterBarreRoots: has
              ? state.filterBarreRoots.filter((r) => r !== root)
              : [...state.filterBarreRoots, root],
          };
        }),

      clearBarreRoots: () => set({ filterBarreRoots: [] }),

      togglePosition: (pos) =>
        set((state) => {
          const has = state.filterPositions.includes(pos);
          return {
            filterPositions: has
              ? state.filterPositions.filter((p) => p !== pos)
              : [...state.filterPositions, pos],
          };
        }),

      clearPositions: () => set({ filterPositions: [] }),

      setFilterKey: (ks) => set({ filterKey: ks }),

      setSearchQuery: (q) => set({ searchQuery: q }),

      setActiveLibraryPreset: (id) => set({ activeLibraryPresetId: id }),

      toggleChordSelection: (id) =>
        set((state) => {
          const has = state.selectedChordIds.includes(id);
          return {
            selectedChordIds: has
              ? state.selectedChordIds.filter((cid) => cid !== id)
              : [...state.selectedChordIds, id],
          };
        }),

      setSelectedChordIds: (ids) => set({ selectedChordIds: ids }),

      clearSelectedChords: () => set({ selectedChordIds: [] }),

      setSavedScrollY: (y) => set({ savedScrollY: y }),

      clearAll: () =>
        set({
          filterCategories: [],
          filterTypes: [],
          filterBarreRoots: [],
          filterPositions: [],
          filterKey: null,
          searchQuery: '',
          activeLibraryPresetId: null,
        }),
    }),
    {
      name: 'fretmaster-chord-library-filters',
      partialize: (state) => ({
        filterCategories: state.filterCategories,
        filterTypes: state.filterTypes,
        filterBarreRoots: state.filterBarreRoots,
        filterPositions: state.filterPositions,
        filterKey: state.filterKey,
        searchQuery: state.searchQuery,
        activeLibraryPresetId: state.activeLibraryPresetId,
        selectedChordIds: state.selectedChordIds,
        savedScrollY: state.savedScrollY,
      }),
      merge: (persisted: any, current) => ({
        ...current,
        ...(persisted
          ? {
              filterCategories: persisted.filterCategories ?? [],
              filterTypes: persisted.filterTypes ?? [],
              filterBarreRoots: persisted.filterBarreRoots ?? [],
              filterPositions: persisted.filterPositions ?? [],
              filterKey: persisted.filterKey ?? null,
              searchQuery: persisted.searchQuery ?? '',
              activeLibraryPresetId: persisted.activeLibraryPresetId ?? null,
              selectedChordIds: persisted.selectedChordIds ?? [],
              savedScrollY: persisted.savedScrollY ?? 0,
            }
          : {}),
      }),
    }
  )
);
