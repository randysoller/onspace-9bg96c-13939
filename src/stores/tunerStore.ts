import { create } from 'zustand';

export type TuningPreset = 'standard' | 'dropD' | 'openG' | 'dadgad' | 'halfStep' | 'fullStep';

export const TUNING_PRESETS: Record<TuningPreset, { name: string; notes: string[] }> = {
  standard: { name: 'Standard (E A D G B E)', notes: ['E', 'A', 'D', 'G', 'B', 'E'] },
  dropD: { name: 'Drop D (D A D G B E)', notes: ['D', 'A', 'D', 'G', 'B', 'E'] },
  openG: { name: 'Open G (D G D G B D)', notes: ['D', 'G', 'D', 'G', 'B', 'D'] },
  dadgad: { name: 'DADGAD', notes: ['D', 'A', 'D', 'G', 'A', 'D'] },
  halfStep: { name: 'Half Step Down', notes: ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'] },
  fullStep: { name: 'Full Step Down', notes: ['D', 'G', 'C', 'F', 'A', 'D'] },
};

interface TunerStore {
  isActive: boolean;
  currentNote: string;
  currentFrequency: number;
  centOffset: number;
  tuning: TuningPreset;
  targetString: number;
  
  setIsActive: (active: boolean) => void;
  setCurrentNote: (note: string) => void;
  setCurrentFrequency: (freq: number) => void;
  setCentOffset: (offset: number) => void;
  setTuning: (tuning: TuningPreset) => void;
  setTargetString: (stringNum: number) => void;
}

export const useTunerStore = create<TunerStore>((set) => ({
  isActive: false,
  currentNote: '',
  currentFrequency: 0,
  centOffset: 0,
  tuning: 'standard',
  targetString: 0,
  
  setIsActive: (active) => set({ isActive: active }),
  setCurrentNote: (note) => set({ currentNote: note }),
  setCurrentFrequency: (freq) => set({ currentFrequency: freq }),
  setCentOffset: (offset) => set({ centOffset: offset }),
  setTuning: (tuning) => set({ tuning }),
  setTargetString: (stringNum) => set({ targetString: stringNum }),
}));
