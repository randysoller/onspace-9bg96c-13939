import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CustomChordData, FretMarker, DEFAULT_DOT_COLOR, DEFAULT_ROOT_COLOR } from '@/types/customChord';
import type { ChordData } from '@/types/chord';
import { useNavigate } from 'react-router-dom';

interface CustomChordStore {
  customChords: CustomChordData[];
  hiddenStandardChords: Set<string>;
  
  addCustomChord: (chord: CustomChordData) => void;
  updateCustomChord: (id: string, chord: Partial<CustomChordData>) => void;
  deleteCustomChord: (id: string) => void;
  getCustomChord: (id: string) => CustomChordData | undefined;
  editChord: (id: string) => void;
  editStandardChord: (chord: ChordData) => void;
  hideStandardChord: (id: string) => void;
  loadHiddenChords: () => void;
  saveHiddenChords: () => void;
}

// Serialize CustomChordData for localStorage (convert Sets to arrays)
function serializeCustomChord(chord: CustomChordData): any {
  return {
    ...chord,
    mutedStrings: Array.from(chord.mutedStrings),
    openStrings: Array.from(chord.openStrings),
    openDiamonds: Array.from(chord.openDiamonds),
  };
}

// Deserialize CustomChordData from localStorage (convert arrays to Sets)
function deserializeCustomChord(data: any): CustomChordData {
  return {
    ...data,
    mutedStrings: new Set(data.mutedStrings || []),
    openStrings: new Set(data.openStrings || []),
    openDiamonds: new Set(data.openDiamonds || []),
  };
}

export const useCustomChordStore = create<CustomChordStore>()(
  persist(
    (set, get) => {
      // Load hidden chords from separate localStorage key on init
      const hiddenChords = (() => {
        try {
          const raw = localStorage.getItem('fretmaster-hidden-chords');
          return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
        } catch {
          return new Set<string>();
        }
      })();

      return {
        customChords: [],
        hiddenStandardChords: hiddenChords,

        addCustomChord: (chord) =>
          set((state) => ({
            customChords: [...state.customChords, chord],
          })),

        updateCustomChord: (id, updates) =>
          set((state) => ({
            customChords: state.customChords.map((chord) =>
              chord.id === id ? { ...chord, ...updates, updatedAt: Date.now() } : chord
            ),
          })),

        deleteCustomChord: (id) =>
          set((state) => ({
            customChords: state.customChords.filter((chord) => chord.id !== id),
          })),

        getCustomChord: (id) => {
          return get().customChords.find((chord) => chord.id === id);
        },

        editChord: (id) => {
          // This is called from external components via navigation
          // The actual navigation happens in the calling component
        },

        editStandardChord: (chord) => {
          // Check if custom version already exists
          const existing = get().customChords.find((c) => c.sourceChordId === chord.id);
          if (existing) {
            // Load existing custom version
            return;
          }

          // Convert standard chord to CustomChordData
          const frettedValues = chord.frets.filter((f) => f > 0);
          const baseFret = frettedValues.length > 0 ? Math.min(...frettedValues) : 1;
          const maxFret = frettedValues.length > 0 ? Math.max(...frettedValues) : 1;
          const numFrets = Math.min(7, Math.max(5, maxFret - baseFret + 2));

          const mutedStrings = new Set<number>();
          const openStrings = new Set<number>();
          const openDiamonds = new Set<number>();
          const markers: FretMarker[] = [];

          chord.frets.forEach((fret, stringIdx) => {
            if (fret === -1) {
              mutedStrings.add(stringIdx);
            } else if (fret === 0) {
              openStrings.add(stringIdx);
              if (stringIdx === chord.rootNoteString) {
                openDiamonds.add(stringIdx);
              }
            } else {
              const isRoot = stringIdx === chord.rootNoteString;
              markers.push({
                fret: fret - baseFret + 1,
                string: stringIdx,
                finger: chord.fingers[stringIdx] || 0,
                color: isRoot ? DEFAULT_ROOT_COLOR : DEFAULT_DOT_COLOR,
                shape: isRoot ? 'diamond' : 'circle',
                label: '',
              });
            }
          });

          const barres =
            chord.barres?.map((absoluteFret) => {
              const stringsOnBarre = chord.frets
                .map((f, idx) => (f === absoluteFret ? idx : -1))
                .filter((idx) => idx !== -1);
              const minString = Math.min(...stringsOnBarre);
              const maxString = Math.max(...stringsOnBarre);
              return {
                fret: absoluteFret - baseFret + 1,
                fromString: minString,
                toString: maxString,
                color: DEFAULT_DOT_COLOR,
              };
            }) || [];

          const customChord: CustomChordData = {
            id: `custom-${Date.now()}`,
            name: chord.name,
            symbol: chord.symbol,
            baseFret,
            numFrets,
            mutedStrings,
            openStrings,
            openDiamonds,
            markers,
            barres,
            chordType: chord.type,
            chordCategory: chord.category,
            sourceChordId: chord.id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          // Don't add to store here - let editor handle it
          // Just prep the data for editor
        },

        hideStandardChord: (id) =>
          set((state) => {
            const next = new Set(state.hiddenStandardChords);
            next.add(id);
            get().saveHiddenChords();
            return { hiddenStandardChords: next };
          }),

        loadHiddenChords: () => {
          try {
            const raw = localStorage.getItem('fretmaster-hidden-chords');
            if (raw) {
              const hidden = new Set<string>(JSON.parse(raw));
              set({ hiddenStandardChords: hidden });
            }
          } catch {}
        },

        saveHiddenChords: () => {
          const { hiddenStandardChords } = get();
          localStorage.setItem('fretmaster-hidden-chords', JSON.stringify(Array.from(hiddenStandardChords)));
        },
      };
    },
    {
      name: 'fretmaster-custom-chords-v2',
      partialize: (state) => ({
        customChords: state.customChords.map(serializeCustomChord),
      }),
      merge: (persisted: any, current) => ({
        ...current,
        customChords: persisted?.customChords?.map(deserializeCustomChord) || [],
      }),
    }
  )
);
