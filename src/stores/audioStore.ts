import { create } from 'zustand';

const STORAGE_KEY = 'fretmaster-audio';

interface AudioSettings {
  volume: number;  // 0–1 (global audio: chords, reference tones)
  muted: boolean;
  metronomeVolume: number;  // 0–1 (metronome-specific volume)
}

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : 0.7,
        muted: typeof parsed.muted === 'boolean' ? parsed.muted : false,
        metronomeVolume: typeof parsed.metronomeVolume === 'number' ? Math.max(0, Math.min(1, parsed.metronomeVolume)) : 0.95,
      };
    }
  } catch {
    // ignore
  }
  return { volume: 0.7, muted: false, metronomeVolume: 0.95 };
}

function persist(settings: AudioSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface AudioStore extends AudioSettings {
  setVolume: (v: number) => void;
  toggleMute: () => void;
  getEffectiveVolume: () => number;
  setMetronomeVolume: (v: number) => void;
}

export const useAudioStore = create<AudioStore>((set, get) => {
  const initial = loadSettings();
  return {
    ...initial,

    setVolume: (volume) => {
      const clamped = Math.max(0, Math.min(1, volume));
      set({ volume: clamped, muted: clamped === 0 });
      persist({ volume: clamped, muted: clamped === 0, metronomeVolume: get().metronomeVolume });
    },

    toggleMute: () => {
      const next = !get().muted;
      set({ muted: next });
      persist({ volume: get().volume, muted: next, metronomeVolume: get().metronomeVolume });
    },

    getEffectiveVolume: () => {
      const { volume, muted } = get();
      return muted ? 0 : volume;
    },

    setMetronomeVolume: (metronomeVolume) => {
      const clamped = Math.max(0, Math.min(1, metronomeVolume));
      set({ metronomeVolume: clamped });
      persist({ volume: get().volume, muted: get().muted, metronomeVolume: clamped });
    },
  };
});
