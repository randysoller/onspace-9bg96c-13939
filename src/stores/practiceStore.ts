import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { ChordRoot, ChordData } from '@/types/chord';
import { createShallowSelector } from '@/hooks/useZustandSelector';

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

// Base store
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

// Optimized selectors to prevent unnecessary re-renders
export const useShallowPracticeStore = createShallowSelector(usePracticeStore);

// Specific selectors for common use cases
export const usePracticeFilters = () => usePracticeStore(
  state => ({ 
    selectedRoots: state.selectedRoots, 
    selectedCategories: state.selectedCategories,
    selectedTypes: state.selectedTypes 
  }),
  shallow
);

export const usePracticeSettings = () => usePracticeStore(
  state => ({ 
    interval: state.interval,
    playSound: state.playSound,
    showDiagrams: state.showDiagrams,
    metronomeEnabled: state.metronomeEnabled
  }),
  shallow
);

export const usePracticeState = () => usePracticeStore(
  state => ({ 
    isPracticing: state.isPracticing,
    currentChordIndex: state.currentChordIndex,
    practiceChords: state.practiceChords
  }),
  shallow
);

export const usePracticeActions = () => usePracticeStore(
  state => ({
    startPractice: state.startPractice,
    stopPractice: state.stopPractice,
    nextChord: state.nextChord,
    previousChord: state.previousChord,
    setPracticeChords: state.setPracticeChords,
    setFilters: state.setFilters,
    setSelectedRoots: state.setSelectedRoots,
    setSelectedCategories: state.setSelectedCategories,
    setSelectedTypes: state.setSelectedTypes,
    setInterval: state.setInterval,
    setPlaySound: state.setPlaySound,
    setShowDiagrams: state.setShowDiagrams,
    setMetronomeEnabled: state.setMetronomeEnabled,
  }),
  shallow
);
