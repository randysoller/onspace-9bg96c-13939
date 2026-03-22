import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MetronomeSound = 'click' | 'woodBlock' | 'hiHat' | 'sideStick' | 'voice';
export type SubdivisionType = 'quarter' | 'eighth' | 'sixteenth';

interface MetronomeStore {
  isPlaying: boolean;
  bpm: number;
  beatsPerMeasure: number;
  noteValue: number;
  currentBeat: number;
  soundType: MetronomeSound;
  accentFirstBeat: boolean;
  subdivision: SubdivisionType;
  
  setIsPlaying: (playing: boolean) => void;
  setBpm: (bpm: number) => void;
  setBeatsPerMeasure: (beats: number) => void;
  setTimeSignature: (beats: number, noteValue: number) => void;
  setCurrentBeat: (beat: number) => void;
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
      soundType: 'click',
      accentFirstBeat: true,
      subdivision: 'quarter',
      
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(250, bpm)) }),
      setBeatsPerMeasure: (beats) => set({ beatsPerMeasure: beats }),
      setTimeSignature: (beats, noteValue) => set({ beatsPerMeasure: beats, noteValue }),
      setCurrentBeat: (beat) => set({ currentBeat: beat }),
      setSoundType: (sound) => set({ soundType: sound }),
      setAccentFirstBeat: (accent) => set({ accentFirstBeat: accent }),
      setSubdivision: (subdivision) => set({ subdivision }),
      incrementBeat: () => set((state) => ({
        currentBeat: (state.currentBeat + 1) % state.beatsPerMeasure
      })),
    }),
    {
      name: 'fretmaster-metronome',
    }
  )
);
