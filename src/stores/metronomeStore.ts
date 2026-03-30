import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createShallowSelector } from '@/hooks/useZustandSelector';

export type MetronomeSound = 'click' | 'woodBlock' | 'hiHat' | 'sideStick' | 'voiceCount';
export type SubdivisionType = 'quarter' | 'eighth' | 'sixteenth';
export type SyncUnit = 'beats' | 'measures';

interface MetronomeStore {
  isPlaying: boolean;
  bpm: number;
  beatsPerMeasure: number;
  noteValue: number;
  currentBeat: number;
  subdivisionCounter: number;
  soundType: MetronomeSound;
  accentFirstBeat: boolean;
  subdivision: SubdivisionType;
  
  // Beat-sync functionality
  syncEnabled: boolean;
  syncUnit: SyncUnit;
  beatsPerChord: number;              // 1-32
  autoRevealBeforeAdvance: boolean;
  beatsUntilAdvance: number;
  beatsSinceChordChange: number;
  
  // Count-in functionality
  isCountingIn: boolean;
  countInBeat: number;                // 1-based current count-in beat
  countInTotal: number;               // Total count-in beats
  countInMeasures: number;            // 1, 2, or 4
  
  setIsPlaying: (playing: boolean) => void;
  setBpm: (bpm: number) => void;
  setBeatsPerMeasure: (beats: number) => void;
  setTimeSignature: (beats: number, noteValue: number) => void;
  setCurrentBeat: (beat: number) => void;
  setSubdivisionCounter: (counter: number) => void;
  setSoundType: (sound: MetronomeSound) => void;
  setAccentFirstBeat: (accent: boolean) => void;
  setSubdivision: (subdivision: SubdivisionType) => void;
  incrementBeat: () => void;
  
  // Beat-sync actions
  setSyncEnabled: (enabled: boolean) => void;
  setSyncUnit: (unit: SyncUnit) => void;
  setBeatsPerChord: (beats: number) => void;
  setAutoRevealBeforeAdvance: (enabled: boolean) => void;
  resetBeatCounter: () => void;
  
  // Count-in actions
  setCountInMeasures: (measures: number) => void;
  startCountIn: () => void;
  stop: () => void;
}

// Base store
export const useMetronomeStore = create<MetronomeStore>()(  
  persist(
    (set, get) => ({
      isPlaying: false,
      bpm: 120,
      beatsPerMeasure: 4,
      noteValue: 4,
      currentBeat: 0,
      subdivisionCounter: 0,
      soundType: 'click',
      accentFirstBeat: true,
      subdivision: 'quarter',
      
      // Beat-sync defaults
      syncEnabled: false,
      syncUnit: 'beats',
      beatsPerChord: 4,
      autoRevealBeforeAdvance: true,
      beatsUntilAdvance: 4,
      beatsSinceChordChange: 0,
      
      // Count-in defaults
      isCountingIn: false,
      countInBeat: 0,
      countInTotal: 0,
      countInMeasures: 1,
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(260, bpm)) }),
      setBeatsPerMeasure: (beats) => set({ beatsPerMeasure: beats }),
      setTimeSignature: (beats, noteValue) => set({ beatsPerMeasure: beats, noteValue }),
      setCurrentBeat: (beat) => set({ currentBeat: beat }),
      setSubdivisionCounter: (counter) => set({ subdivisionCounter: counter }),
      setSoundType: (sound) => set({ soundType: sound }),
      setAccentFirstBeat: (accent) => set({ accentFirstBeat: accent }),
      setSubdivision: (subdivision) => set({ subdivision, subdivisionCounter: 0 }),
      
      incrementBeat: () => set((state) => {
        const subdivisionMultiplier = state.subdivision === 'quarter' ? 1 : state.subdivision === 'eighth' ? 2 : 4;
        const nextSubdivisionCounter = (state.subdivisionCounter + 1) % subdivisionMultiplier;
        
        // Only increment the beat number when subdivision counter wraps to 0
        if (nextSubdivisionCounter === 0) {
          const nextBeat = (state.currentBeat + 1) % state.beatsPerMeasure;
          
          // Beat-sync logic
          if (state.syncEnabled && !state.isCountingIn) {
            const newBeatsSinceChordChange = state.beatsSinceChordChange + 1;
            const totalBeats = state.syncUnit === 'measures' 
              ? state.beatsPerChord * state.beatsPerMeasure 
              : state.beatsPerChord;
            const remaining = totalBeats - newBeatsSinceChordChange;
            
            return {
              subdivisionCounter: 0,
              currentBeat: nextBeat,
              beatsSinceChordChange: newBeatsSinceChordChange,
              beatsUntilAdvance: remaining,
            };
          }
          
          return {
            subdivisionCounter: 0,
            currentBeat: nextBeat,
          };
        } else {
          return {
            subdivisionCounter: nextSubdivisionCounter
          };
        }
      }),
      
      // Beat-sync actions
      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
      setSyncUnit: (unit) => set({ syncUnit: unit }),
      setBeatsPerChord: (beats) => set({ beatsPerChord: Math.max(1, Math.min(32, beats)) }),
      setAutoRevealBeforeAdvance: (enabled) => set({ autoRevealBeforeAdvance: enabled }),
      
      resetBeatCounter: () => set((state) => {
        const totalBeats = state.syncUnit === 'measures' 
          ? state.beatsPerChord * state.beatsPerMeasure 
          : state.beatsPerChord;
        return {
          beatsSinceChordChange: 0,
          beatsUntilAdvance: totalBeats,
        };
      }),
      
      // Count-in actions
      setCountInMeasures: (measures) => set({ countInMeasures: measures }),
      
      startCountIn: () => set((state) => {
        const total = state.countInMeasures * state.beatsPerMeasure;
        return {
          isCountingIn: true,
          countInBeat: 1,
          countInTotal: total,
          isPlaying: true,
          syncEnabled: true,
          currentBeat: 0,
          beatsSinceChordChange: 0,
        };
      }),
      
      stop: () => set({
        isPlaying: false,
        isCountingIn: false,
        countInBeat: 0,
        currentBeat: 0,
      }),
    }),
    {
      name: 'fretmaster-metronome',
      partialize: (state) => ({
        bpm: state.bpm,
        beatsPerMeasure: state.beatsPerMeasure,
        noteValue: state.noteValue,
        soundType: state.soundType,
        accentFirstBeat: state.accentFirstBeat,
        subdivision: state.subdivision,
        syncEnabled: state.syncEnabled,
        syncUnit: state.syncUnit,
        beatsPerChord: state.beatsPerChord,
        autoRevealBeforeAdvance: state.autoRevealBeforeAdvance,
        countInMeasures: state.countInMeasures,
      }),
    }
  )
);

// Optimized selectors to prevent unnecessary re-renders
export const useShallowMetronomeStore = createShallowSelector(useMetronomeStore);

// Specific selectors for common use cases
export const useMetronomePlayback = () => useMetronomeStore(
  state => ({ 
    isPlaying: state.isPlaying,
    bpm: state.bpm,
    soundType: state.soundType
  }),
  shallow
);

export const useMetronomeBeats = () => useMetronomeStore(
  state => ({ 
    beatsPerMeasure: state.beatsPerMeasure,
    noteValue: state.noteValue,
    currentBeat: state.currentBeat,
    subdivisionCounter: state.subdivisionCounter
  }),
  shallow
);

export const useMetronomeSettings = () => useMetronomeStore(
  state => ({ 
    accentFirstBeat: state.accentFirstBeat,
    subdivision: state.subdivision
  }),
  shallow
);

export const useMetronomeActions = () => useMetronomeStore(
  state => ({
    setIsPlaying: state.setIsPlaying,
    setBpm: state.setBpm,
    setBeatsPerMeasure: state.setBeatsPerMeasure,
    setTimeSignature: state.setTimeSignature,
    setCurrentBeat: state.setCurrentBeat,
    setSubdivisionCounter: state.setSubdivisionCounter,
    setSoundType: state.setSoundType,
    setAccentFirstBeat: state.setAccentFirstBeat,
    setSubdivision: state.setSubdivision,
    incrementBeat: state.incrementBeat,
  }),
  shallow
);
