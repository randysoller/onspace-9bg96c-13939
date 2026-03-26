/**
 * Practice Store - Chord filtering, selection, and navigation
 * Persists filter state to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CHORD_DATABASE } from '@/constants/chords';
import type { ChordData, ChordCategory, ChordType, KeySignature, BarreRoot } from '@/types/chord';
import { useCustomChordStore } from './customChordStore';

export type TimerDuration = 0 | 2 | 5 | 10;

interface PracticeState {
  // Filters
  categories: Set<ChordCategory>;
  chordTypes: Set<ChordType>;
  timerDuration: TimerDuration;
  barreRoots: Set<BarreRoot>;
  keyFilter: KeySignature | null;
  activePresetId: string | null;
  
  // Practice state
  currentIndex: number;
  isRevealed: boolean;
  isPracticing: boolean;
  practiceChords: ChordData[];
  totalPracticed: number;
  
  // Actions
  setCategories: (categories: Set<ChordCategory>) => void;
  setChordTypes: (types: Set<ChordType>) => void;
  setTimerDuration: (duration: TimerDuration) => void;
  setBarreRoots: (roots: Set<BarreRoot>) => void;
  setKeyFilter: (key: KeySignature | null) => void;
  setActivePresetId: (id: string | null) => void;
  
  startPractice: () => void;
  stopPractice: () => void;
  nextChord: () => void;
  prevChord: () => void;
  revealChord: () => void;
  hideChord: () => void;
  getCurrentChord: () => ChordData | null;
}

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get major scale intervals
function getMajorScaleIntervals(key: KeySignature): Set<number> {
  const rootMap: Record<string, number> = {
    'C': 0, 'G': 7, 'D': 2, 'A': 9, 'E': 4, 'B': 11,
    'F': 5, 'Bb': 10, 'Eb': 3, 'Ab': 8, 'Db': 1, 'Gb': 6
  };
  
  const root = rootMap[key];
  const intervals = [0, 2, 4, 5, 7, 9, 11]; // Major scale pattern
  
  return new Set(intervals.map(i => (root + i) % 12));
}

// Get effective chords (standard + custom)
function getEffectiveChords(): ChordData[] {
  const customChords = useCustomChordStore.getState().chords;
  const customRoots = new Set(customChords.map(c => c.name));
  
  // Filter out standard chords replaced by custom chords
  const standardChords = CHORD_DATABASE.filter(chord => {
    const symbol = `${chord.root}${chord.type}`;
    return !customRoots.has(symbol);
  });
  
  // Convert custom chords to ChordData format
  const convertedCustom: ChordData[] = customChords.map(custom => ({
    id: custom.id,
    root: custom.name.match(/^[A-G][#b]?/)?.[0] || 'C',
    type: custom.name.replace(/^[A-G][#b]?/, '') || 'major',
    category: 'custom',
    frets: custom.frets as [number, number, number, number, number, number],
    fingers: custom.fingers as [number, number, number, number, number, number] | undefined,
    baseFret: 1,
    barres: custom.barres || [],
    isCustom: true,
  } as any));
  
  return [...standardChords, ...convertedCustom];
}

// Filter chords based on current settings
function filterChords(state: Omit<PracticeState, 'startPractice' | 'stopPractice' | 'nextChord' | 'prevChord' | 'revealChord' | 'hideChord' | 'getCurrentChord' | 'setCategories' | 'setChordTypes' | 'setTimerDuration' | 'setBarreRoots' | 'setKeyFilter' | 'setActivePresetId'>): ChordData[] {
  const allChords = getEffectiveChords();
  
  return allChords.filter(chord => {
    // Category filter
    if (state.categories.size > 0 && !state.categories.has(chord.category)) {
      return false;
    }
    
    // Chord type filter
    if (state.chordTypes.size > 0 && !state.chordTypes.has(chord.type)) {
      return false;
    }
    
    // Barre root filter
    if (state.barreRoots.size > 0 && chord.category === 'barre') {
      const rootString = chord.rootString;
      if (rootString === undefined || !state.barreRoots.has(rootString as BarreRoot)) {
        return false;
      }
    }
    
    // Key filter
    if (state.keyFilter) {
      const scaleIntervals = getMajorScaleIntervals(state.keyFilter);
      const rootMap: Record<string, number> = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
        'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
      };
      const chordRootInterval = rootMap[chord.root];
      if (chordRootInterval === undefined || !scaleIntervals.has(chordRootInterval)) {
        return false;
      }
    }
    
    return true;
  });
}

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set, get) => ({
      // Initial filter state
      categories: new Set<ChordCategory>(),
      chordTypes: new Set<ChordType>(),
      timerDuration: 0,
      barreRoots: new Set<BarreRoot>(),
      keyFilter: null,
      activePresetId: null,
      
      // Initial practice state
      currentIndex: 0,
      isRevealed: false,
      isPracticing: false,
      practiceChords: [],
      totalPracticed: 0,
      
      setCategories: (categories) => set({ categories }),
      setChordTypes: (types) => set({ chordTypes: types }),
      setTimerDuration: (duration) => set({ timerDuration: duration }),
      setBarreRoots: (roots) => set({ barreRoots: roots }),
      setKeyFilter: (key) => set({ keyFilter: key }),
      setActivePresetId: (id) => set({ activePresetId: id }),
      
      startPractice: () => {
        const state = get();
        const filtered = filterChords(state);
        const shuffled = shuffle(filtered);
        
        set({
          isPracticing: true,
          practiceChords: shuffled,
          currentIndex: 0,
          isRevealed: false,
        });
      },
      
      stopPractice: () => {
        set({
          isPracticing: false,
          practiceChords: [],
          currentIndex: 0,
          isRevealed: false,
        });
      },
      
      nextChord: () => {
        const state = get();
        const nextIndex = state.currentIndex + 1;
        
        // If past end, reshuffle entire array and reset to 0
        if (nextIndex >= state.practiceChords.length) {
          const reshuffled = shuffle(state.practiceChords);
          set({
            practiceChords: reshuffled,
            currentIndex: 0,
            isRevealed: false,
            totalPracticed: state.totalPracticed + 1,
          });
        } else {
          set({
            currentIndex: nextIndex,
            isRevealed: false,
            totalPracticed: state.totalPracticed + 1,
          });
        }
      },
      
      prevChord: () => {
        const state = get();
        if (state.currentIndex > 0) {
          set({
            currentIndex: state.currentIndex - 1,
            isRevealed: false,
          });
        }
      },
      
      revealChord: () => {
        set({ isRevealed: true });
      },
      
      hideChord: () => {
        set({ isRevealed: false });
      },
      
      getCurrentChord: () => {
        const state = get();
        return state.practiceChords[state.currentIndex] || null;
      },
    }),
    {
      name: 'fretmaster-practice-filters',
      partialize: (state) => ({
        categories: Array.from(state.categories),
        chordTypes: Array.from(state.chordTypes),
        timerDuration: state.timerDuration,
        barreRoots: Array.from(state.barreRoots),
        keyFilter: state.keyFilter,
        activePresetId: state.activePresetId,
      }),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          categories: new Set(persistedState?.categories || []),
          chordTypes: new Set(persistedState?.chordTypes || []),
          barreRoots: new Set(persistedState?.barreRoots || []),
        };
      },
    }
  )
);
