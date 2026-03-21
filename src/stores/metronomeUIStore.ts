import { create } from 'zustand';

interface MetronomeUIState {
  isOpen: boolean;
  openMetronome: () => void;
  closeMetronome: () => void;
  toggleMetronome: () => void;
}

export const useMetronomeUIStore = create<MetronomeUIState>((set) => ({
  isOpen: false,
  openMetronome: () => set({ isOpen: true }),
  closeMetronome: () => set({ isOpen: false }),
  toggleMetronome: () => set((state) => ({ isOpen: !state.isOpen })),
}));
