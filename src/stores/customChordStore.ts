import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CustomChordData } from '@/types/customChord';

interface CustomChordStore {
  customChords: CustomChordData[];
  
  addCustomChord: (chord: CustomChordData) => void;
  updateCustomChord: (id: string, chord: Partial<CustomChordData>) => void;
  deleteCustomChord: (id: string) => void;
  getCustomChord: (id: string) => CustomChordData | undefined;
}

export const useCustomChordStore = create<CustomChordStore>()(
  persist(
    (set, get) => ({
      customChords: [],
      
      addCustomChord: (chord) => set((state) => ({
        customChords: [...state.customChords, chord]
      })),
      
      updateCustomChord: (id, updates) => set((state) => ({
        customChords: state.customChords.map((chord) =>
          chord.id === id ? { ...chord, ...updates, updatedAt: Date.now() } : chord
        )
      })),
      
      deleteCustomChord: (id) => set((state) => ({
        customChords: state.customChords.filter((chord) => chord.id !== id)
      })),
      
      getCustomChord: (id) => {
        return get().customChords.find((chord) => chord.id === id);
      },
    }),
    {
      name: 'fretmaster-custom-chords',
    }
  )
);
