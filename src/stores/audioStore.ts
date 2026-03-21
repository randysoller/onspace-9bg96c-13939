import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioStore {
  masterVolume: number;
  chordVolume: number;
  metronomeVolume: number;
  tunerVolume: number;
  
  setMasterVolume: (volume: number) => void;
  setChordVolume: (volume: number) => void;
  setMetronomeVolume: (volume: number) => void;
  setTunerVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      masterVolume: 0.7,
      chordVolume: 0.8,
      metronomeVolume: 0.6,
      tunerVolume: 0.5,
      
      setMasterVolume: (volume) => set({ masterVolume: volume }),
      setChordVolume: (volume) => set({ chordVolume: volume }),
      setMetronomeVolume: (volume) => set({ metronomeVolume: volume }),
      setTunerVolume: (volume) => set({ tunerVolume: volume }),
    }),
    {
      name: 'fretmaster-audio-settings',
    }
  )
);
