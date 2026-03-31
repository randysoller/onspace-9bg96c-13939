/**
 * Practice Store — Chord filtering, selection, and navigation
 * Persists filter state to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CHORD_DATABASE } from '@/constants/chords';
import type { ChordData, ChordCategory, ChordType, BarreRoot } from '@/types/chord';
import type { KeySignature } from '@/constants/scales';
import { NOTE_NAMES } from '@/constants/scales';
import { useCustomChordStore } from './customChordStore';
import { usePresetStore } from './presetStore';
import { customToLibraryChord } from '@/types/customChord';

export type TimerDuration = 0 | 2 | 5 | 10;

interface PracticeState {
  // Filter state
  categories: Set<ChordCategory>;
  chordTypes: Set<ChordType>;
  barreRoots: Set<BarreRoot>;
  keyFilter: KeySignature | null;
  activePresetId: string | null;
  timerDuration: TimerDuration;
  
  // Practice session state
  currentIndex: number;
  isRevealed: boolean;
  isPracticing: boolean;
  practiceChords: ChordData[];
  totalPracticed: number;
  
  // Actions
  toggleCategory: (cat: ChordCategory) => void;
  clearCategories: () => void;
  toggleChordType: (type: ChordType) => void;
  clearChordTypes: () => void;
  toggleBarreRoot: (root: BarreRoot) => void;
  clearBarreRoots: () => void;
  setKeyFilter: (ks: KeySignature | null) => void;
  setActivePreset: (id: string | null) => void;
  setTimerDuration: (duration: TimerDuration) => void;
  
  startPractice: () => void;
  stopPractice: () => void;
  nextChord: () => void;
  prevChord: () => void;
  revealChord: () => void;
  hideChord: () => void;
  getCurrentChord: () => ChordData | null;
  getAvailableCount: () => number;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get effective chords (standard + custom)
function getEffectiveChords(): ChordData[] {
  const { customChords, hiddenStandardChords } = useCustomChordStore.getState();
  
  // Custom chords that replace a standard chord
  const replacedIds = new Set(customChords.filter((c) => c.sourceChordId).map((c) => c.sourceChordId!));
  
  // Standard chords excluding replaced and hidden ones
  const standardChords = CHORD_DATABASE.filter(
    (c) => !replacedIds.has(c.id) && !hiddenStandardChords.has(c.id)
  );
  
  // Convert custom chords to ChordData format
  const converted = customChords.map(customToLibraryChord);
  
  return [...standardChords, ...converted];
}

// Get chord root semitone
function getChordRootSemitone(symbol: string): number {
  const match = symbol.match(/^([A-G])([#b]?)/);
  if (!match) return -1;
  
  const noteBase: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  };
  
  let semitone = noteBase[match[1]] ?? -1;
  if (match[2] === '#') semitone = (semitone + 1) % 12;
  if (match[2] === 'b') semitone = (semitone + 11) % 12;
  
  return semitone;
}

// Filter chords based on current settings
function filterChords(
  categories: Set<ChordCategory>,
  types: Set<ChordType>,
  barreRoots: Set<BarreRoot>,
  keyFilter: KeySignature | null
): ChordData[] {
  const allCats = categories.size === 0 || categories.size === 3;
  const allRoots = barreRoots.size === 0 || barreRoots.size === 3;
  
  return getEffectiveChords().filter((chord) => {
    // Category filter
    const matchCategory = allCats || categories.has(chord.category);
    
    // Type filter
    const matchType = types.size === 0 || types.has(chord.type);
    
    // Root string filter (only applies when barre/movable selected or all categories shown)
    const hasRootFilter = categories.has('barre') || categories.has('movable') || allCats;
    const matchRoot =
      allRoots || !hasRootFilter || !chord.rootString || barreRoots.has(chord.rootString);
    
    // Key filter (major scale matching)
    let matchKey = true;
    if (keyFilter) {
      const rootIdx = NOTE_NAMES.indexOf(keyFilter.noteName);
      const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
      const scaleNotes = new Set(majorIntervals.map((i) => (rootIdx + i) % 12));
      const chordRoot = getChordRootSemitone(chord.symbol);
      matchKey = chordRoot >= 0 && scaleNotes.has(chordRoot);
    }
    
    return matchCategory && matchType && matchRoot && matchKey;
  });
}

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set, get) => ({
      // Initial filter state
      categories: new Set<ChordCategory>(),
      chordTypes: new Set<ChordType>(),
      barreRoots: new Set<BarreRoot>(),
      keyFilter: null,
      activePresetId: null,
      timerDuration: 0,
      
      // Initial practice state
      currentIndex: 0,
      isRevealed: false,
      isPracticing: false,
      practiceChords: [],
      totalPracticed: 0,
      
      toggleCategory: (cat) => {
        set((state) => {
          const categories = new Set(state.categories);
          
          if (categories.has(cat)) {
            categories.delete(cat);
          } else {
            categories.add(cat);
          }
          
          // Clear barreRoots if neither barre nor movable is selected and not all 3 selected
          const hasBorreOrMovable = categories.has('barre') || categories.has('movable');
          const isAllSelected = categories.size === 3;
          const shouldClearRoots = !hasBorreOrMovable && !isAllSelected;
          
          return {
            categories,
            barreRoots: shouldClearRoots ? new Set<BarreRoot>() : state.barreRoots,
            activePresetId: null,
          };
        });
      },
      
      clearCategories: () => {
        set({
          categories: new Set<ChordCategory>(),
          barreRoots: new Set<BarreRoot>(),
          activePresetId: null,
        });
      },
      
      toggleChordType: (type) => {
        set((state) => {
          const chordTypes = new Set(state.chordTypes);
          
          if (chordTypes.has(type)) {
            chordTypes.delete(type);
          } else {
            chordTypes.add(type);
          }
          
          return { chordTypes, activePresetId: null };
        });
      },
      
      clearChordTypes: () => {
        set({ chordTypes: new Set<ChordType>(), activePresetId: null });
      },
      
      toggleBarreRoot: (root) => {
        set((state) => {
          const barreRoots = new Set(state.barreRoots);
          
          if (barreRoots.has(root)) {
            barreRoots.delete(root);
          } else {
            barreRoots.add(root);
          }
          
          return { barreRoots, activePresetId: null };
        });
      },
      
      clearBarreRoots: () => {
        set({ barreRoots: new Set<BarreRoot>(), activePresetId: null });
      },
      
      setKeyFilter: (ks) => {
        set({ keyFilter: ks, activePresetId: null });
      },
      
      setActivePreset: (id) => {
        set({ activePresetId: id });
      },
      
      setTimerDuration: (duration) => {
        set({ timerDuration: duration });
      },
      
      startPractice: () => {
        const state = get();
        let filtered: ChordData[];
        
        // If activePresetId is set, use preset chords
        if (state.activePresetId) {
          const preset = usePresetStore.getState().presets.find((p) => p.id === state.activePresetId);
          if (preset) {
            const idSet = new Set(preset.chordIds);
            filtered = getEffectiveChords().filter((c) => idSet.has(c.id));
          } else {
            filtered = [];
          }
        } else {
          // Otherwise, use manual filters
          filtered = filterChords(state.categories, state.chordTypes, state.barreRoots, state.keyFilter);
        }
        
        const shuffled = shuffleArray(filtered);
        
        set({
          isPracticing: true,
          practiceChords: shuffled,
          currentIndex: 0,
          isRevealed: false,
          totalPracticed: 0,
        });
      },
      
      stopPractice: () => {
        set({
          isPracticing: false,
          isRevealed: false,
        });
      },
      
      nextChord: () => {
        const state = get();
        const nextIndex = state.currentIndex + 1;
        
        // If past end, reshuffle entire array and reset to 0 (infinite loop)
        if (nextIndex >= state.practiceChords.length) {
          const reshuffled = shuffleArray(state.practiceChords);
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
      
      getAvailableCount: () => {
        const state = get();
        
        if (state.activePresetId) {
          const preset = usePresetStore.getState().presets.find((p) => p.id === state.activePresetId);
          if (preset) {
            const idSet = new Set(preset.chordIds);
            return getEffectiveChords().filter((c) => idSet.has(c.id)).length;
          }
          return 0;
        }
        
        return filterChords(state.categories, state.chordTypes, state.barreRoots, state.keyFilter).length;
      },
    }),
    {
      name: 'fretmaster-practice-filters',
      partialize: (state) => ({
        categories: [...state.categories] as ChordCategory[],
        chordTypes: [...state.chordTypes] as ChordType[],
        barreRoots: [...state.barreRoots] as BarreRoot[],
        keyFilter: state.keyFilter,
        timerDuration: state.timerDuration,
        activePresetId: state.activePresetId,
      }),
      merge: (persisted: any, current) => ({
        ...current,
        ...(persisted
          ? {
              categories: new Set<ChordCategory>(persisted.categories ?? []),
              chordTypes: new Set<ChordType>(persisted.chordTypes ?? []),
              barreRoots: new Set<BarreRoot>(persisted.barreRoots ?? []),
              keyFilter: persisted.keyFilter ?? null,
              timerDuration: persisted.timerDuration ?? 0,
              activePresetId: persisted.activePresetId ?? null,
            }
          : {}),
      }),
    }
  )
);
