/**
 * Audio Store - Global volume and mute state
 * Persists to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioState {
  volume: number;        // 0-1
  muted: boolean;
  
  setVolume: (v: number) => void;
  toggleMute: () => void;
  getEffectiveVolume: () => number;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      volume: 0.7,
      muted: false,
      
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      
      toggleMute: () => set((state) => ({ muted: !state.muted })),
      
      getEffectiveVolume: () => {
        const state = get();
        return state.muted ? 0 : state.volume;
      },
    }),
    {
      name: 'fretmaster-audio',
    }
  )
);
