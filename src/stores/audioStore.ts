import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createShallowSelector } from '@/hooks/useZustandSelector';

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

// Base store
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

// Optimized selectors to prevent unnecessary re-renders
export const useShallowAudioStore = createShallowSelector(useAudioStore);

// Specific selectors for common use cases
export const useAudioVolumes = () => useAudioStore(
  state => ({ 
    masterVolume: state.masterVolume,
    chordVolume: state.chordVolume,
    metronomeVolume: state.metronomeVolume,
    tunerVolume: state.tunerVolume
  }),
  shallow
);

export const useAudioActions = () => useAudioStore(
  state => ({
    setMasterVolume: state.setMasterVolume,
    setChordVolume: state.setChordVolume,
    setMetronomeVolume: state.setMetronomeVolume,
    setTunerVolume: state.setTunerVolume,
  }),
  shallow
);
