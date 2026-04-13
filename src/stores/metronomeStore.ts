import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createShallowSelector } from '@/hooks/useZustandSelector';

export type MetronomeSound = 'click' | 'woodBlock' | 'hiHat' | 'sideStick' | 'voiceCount';
export type SubdivisionType = 'quarter' | 'eighth' | 'sixteenth' | 'triplet';
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
  
  // Swing
  swingEnabled: boolean;
  setSwingEnabled: (enabled: boolean) => void;

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
      
      // Swing default
      swingEnabled: false,

      // Count-in defaults
      isCountingIn: false,
      countInBeat: 0,
      countInTotal: 0,
      countInMeasures: 1,
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(300, bpm)) }),
      setBeatsPerMeasure: (beats) => set({ beatsPerMeasure: beats }),
      setTimeSignature: (beats, noteValue) => set({ beatsPerMeasure: beats, noteValue }),
      setCurrentBeat: (beat) => set({ currentBeat: beat }),
      setSubdivisionCounter: (counter) => set({ subdivisionCounter: counter }),
      setSoundType: (sound) => set({ soundType: sound }),
      setAccentFirstBeat: (accent) => set({ accentFirstBeat: accent }),
      setSubdivision: (subdivision) => set({ subdivision, subdivisionCounter: 0 }),
      setSwingEnabled: (enabled) => set({ swingEnabled: enabled }),
      
      incrementBeat: () => set((state) => {
        // triplet = 3 eighth-note triplets per beat (e.g. for 12/8 feel)
        const subdivisionMultiplier = state.subdivision === 'quarter' ? 1 : state.subdivision === 'eighth' ? 2 : state.subdivision === 'triplet' ? 3 : 4;
        const nextSubdivisionCounter = (state.subdivisionCounter + 1) % subdivisionMultiplier;
        
        // Only act on full beats (when subdivision counter wraps back to 0)
        if (nextSubdivisionCounter !== 0) {
          return { subdivisionCounter: nextSubdivisionCounter };
        }

        const nextBeat = (state.currentBeat + 1) % state.beatsPerMeasure;

        // ── Count-in phase ──────────────────────────────────────────────────
        // While isCountingIn is true, silently tick through the count-in beats.
        // Practice.tsx cannot fire handleNext() during this phase because
        // beatsUntilAdvance is not yet initialized (still at its reset value).
        // When the last count-in beat completes, transition to active sync.
        if (state.isCountingIn) {
          const nextCountInBeat = state.countInBeat + 1;

          if (nextCountInBeat >= state.countInTotal) {
            // Count-in complete → initialize the chord-advance counter
            const totalBeats = state.syncUnit === 'measures'
              ? state.beatsPerChord * state.beatsPerMeasure
              : state.beatsPerChord;
            return {
              subdivisionCounter: 0,
              currentBeat: nextBeat,
              isCountingIn: false,
              countInBeat: 0,
              beatsSinceChordChange: 0,
              beatsUntilAdvance: totalBeats,
            };
          }

          // Still counting in — just advance the count-in beat
          return {
            subdivisionCounter: 0,
            currentBeat: nextBeat,
            countInBeat: nextCountInBeat,
          };
        }

        // ── Active sync phase ───────────────────────────────────────────────
        // Track beats since last chord change; beatsUntilAdvance reaching 0
        // is watched by Practice.tsx useEffect to trigger handleNext().
        if (state.syncEnabled && state.isPlaying) {
          const newBeatsSinceChordChange = state.beatsSinceChordChange + 1;
          const totalBeats = state.syncUnit === 'measures'
            ? state.beatsPerChord * state.beatsPerMeasure
            : state.beatsPerChord;
          const remaining = totalBeats - newBeatsSinceChordChange;

          return {
            subdivisionCounter: 0,
            currentBeat: nextBeat,
            beatsSinceChordChange: newBeatsSinceChordChange,
            // Clamp at 0 so the Practice.tsx useEffect fires exactly once per chord
            beatsUntilAdvance: Math.max(0, remaining),
          };
        }

        return {
          subdivisionCounter: 0,
          currentBeat: nextBeat,
        };
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
        // Calculate count-in duration: countInMeasures × beatsPerMeasure beats.
        // beatsUntilAdvance is intentionally NOT set here — it will be initialized
        // by incrementBeat() the moment the last count-in beat completes, preventing
        // Practice.tsx from firing handleNext() during the count-in window.
        const countInTotal = state.countInMeasures * state.beatsPerMeasure;
        return {
          isPlaying: true,
          syncEnabled: true,
          isCountingIn: true,
          countInBeat: 0,
          countInTotal,
          currentBeat: 0,
          beatsSinceChordChange: 0,
          // Keep beatsUntilAdvance high so the Practice.tsx guard (prevBeatsUntilAdvance > 0)
          // cannot falsely trigger before count-in ends.
          beatsUntilAdvance: countInTotal + 9999,
        };
      }),
      
      stop: () => set({
        isPlaying: false,
        isCountingIn: false,
        countInBeat: 0,
        currentBeat: 0,
        beatsSinceChordChange: 0,
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
        swingEnabled: state.swingEnabled,
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
