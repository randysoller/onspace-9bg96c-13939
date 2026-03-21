import { create } from 'zustand';
import { ChordRoot, ChordData } from '@/types/chord';

interface PracticeFilters {
  types?: string[];
  keys?: ChordRoot[];
  category?: string;
}

interface PracticeSettings {
  selectedRoots: ChordRoot[];
  selectedCategories: string[];
  selectedTypes: string[];
  interval: number;
  playSound: boolean;
  showDiagrams: boolean;
  metronomeEnabled: boolean;
}

interface PracticeStore extends PracticeSettings {
  isPracticing: boolean;
  currentChordIndex: number;
  practiceChords: ChordData[];
  
  setSelectedRoots: (roots: ChordRoot[]) => void;
  setSelectedCategories: (categories: string[]) => void;
  setSelectedTypes: (types: string[]) => void;
  setInterval: (interval: number) => void;
  setPlaySound: (play: boolean) => void;
  setShowDiagrams: (show: boolean) => void;
  setMetronomeEnabled: (enabled: boolean) => void;
  
  startPractice: () => void;
  stopPractice: () => void;
  nextChord: () => void;
  previousChord: () => void;
  setPracticeChords: (chords: ChordData[]) => void;
  setFilters: (filters: PracticeFilters) => void;
}

export const usePracticeStore = create<PracticeStore>((set) => ({
  selectedRoots: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  selectedCategories: [],
  selectedTypes: [],
  interval: 5,
  playSound: true,
  showDiagrams: true,
  metronomeEnabled: false,
  isPracticing: false,
  currentChordIndex: 0,
  practiceChords: [],
  
  setSelectedRoots: (roots) => set({ selectedRoots: roots }),
  setSelectedCategories: (categories) => set({ selectedCategories: categories }),
  setSelectedTypes: (types) => set({ selectedTypes: types }),
  setInterval: (interval) => set({ interval }),
  setPlaySound: (play) => set({ playSound: play }),
  setShowDiagrams: (show) => set({ showDiagrams: show }),
  setMetronomeEnabled: (enabled) => set({ metronomeEnabled: enabled }),
  
  startPractice: () => set({ isPracticing: true, currentChordIndex: 0 }),
  stopPractice: () => set({ isPracticing: false, currentChordIndex: 0 }),
  nextChord: () => set((state) => ({ 
    currentChordIndex: (state.currentChordIndex + 1) % state.practiceChords.length 
  })),
  previousChord: () => set((state) => ({
    currentChordIndex: state.currentChordIndex === 0 ? state.practiceChords.length - 1 : state.currentChordIndex - 1
  })),
  setPracticeChords: (chords) => set({ practiceChords: chords }),
  setFilters: (filters) => set({ 
    selectedTypes: filters.types || [],
    selectedRoots: filters.keys || [],
    selectedCategories: filters.category ? [filters.category] : [] 
  }),
}));
