import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MetronomeSound = 'click' | 'woodBlock' | 'hiHat' | 'sideStick' | 'voice' | 'voiceCount';
export type SubdivisionType = 'quarter' | 'eighth' | 'sixteenth';

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
}

export const useMetronomeStore = create<MetronomeStore>()(
  persist(
    (set) => ({
      isPlaying: false,
      bpm: 120,
      beatsPerMeasure: 4,
      noteValue: 4,
      currentBeat: 0,
      subdivisionCounter: 0,
      soundType: 'click',
      accentFirstBeat: true,
      subdivision: 'quarter',
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(250, bpm)) }),
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
          return {
            subdivisionCounter: 0,
            currentBeat: (state.currentBeat + 1) % state.beatsPerMeasure
          };
        } else {
          return {
            subdivisionCounter: nextSubdivisionCounter
          };
        }
      }),
    }),
    {
      name: 'fretmaster-metronome',
    }
  )
);
