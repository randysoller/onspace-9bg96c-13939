import { create } from 'zustand';
import { ChordRoot } from '@/types/chord';

interface ChordLibraryStore {
  selectedRoot: ChordRoot | null;
  selectedCategory: string | null;
  selectedType: string | null;
  searchQuery: string;
  
  setSelectedRoot: (root: ChordRoot | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedType: (type: string | null) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useChordLibraryStore = create<ChordLibraryStore>((set) => ({
  selectedRoot: null,
  selectedCategory: null,
  selectedType: null,
  searchQuery: '',
  
  setSelectedRoot: (root) => set({ selectedRoot: root }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedType: (type) => set({ selectedType: type }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  resetFilters: () => set({
    selectedRoot: null,
    selectedCategory: null,
    selectedType: null,
    searchQuery: '',
  }),
}));
