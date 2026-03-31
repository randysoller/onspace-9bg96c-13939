import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CustomChordData,
  FretMarker,
  DotShape,
  DEFAULT_DOT_COLOR,
  createBlankChord,
  customToLibraryChord,
} from '@/types/customChord';
import type { ChordType, ChordCategory, ChordData } from '@/types/chord';

// ─── Serialization ────────────────────────────────────────────────────────────

interface SerializedCustomChord {
  id: string;
  name: string;
  symbol: string;
  baseFret: number;
  numFrets: number;
  mutedStrings: number[];
  openStrings: number[];
  openDiamonds: number[];
  markers: FretMarker[];
  barres: { fret: number; fromString: number; toString: number; color: string }[];
  chordType?: ChordType;
  chordCategory?: ChordCategory;
  sourceChordId?: string;
  createdAt: number;
  updatedAt: number;
}

function serialize(chord: CustomChordData): SerializedCustomChord {
  return {
    ...chord,
    mutedStrings: Array.from(chord.mutedStrings),
    openStrings: Array.from(chord.openStrings),
    openDiamonds: Array.from(chord.openDiamonds),
    markers: chord.markers.map(m => ({ ...m })),
    barres: chord.barres.map(b => ({ ...b })),
  };
}

function deserialize(data: SerializedCustomChord): CustomChordData {
  return {
    ...data,
    mutedStrings: new Set<number>(data.mutedStrings ?? []),
    openStrings: new Set<number>(data.openStrings ?? []),
    openDiamonds: new Set<number>(data.openDiamonds ?? []),
    markers: (data.markers ?? []).map(m => ({ ...m })),
    barres: (data.barres ?? []).map(b => ({ ...b })),
  };
}

function deepCopyChord(chord: CustomChordData): CustomChordData {
  return {
    ...chord,
    mutedStrings: new Set(chord.mutedStrings),
    openStrings: new Set(chord.openStrings),
    openDiamonds: new Set(chord.openDiamonds),
    markers: chord.markers.map(m => ({ ...m })),
    barres: chord.barres.map(b => ({ ...b })),
  };
}

// ─── Hidden Chords ────────────────────────────────────────────────────────────

function loadHiddenChords(): Set<string> {
  try {
    const raw = localStorage.getItem('fretmaster-hidden-chords');
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveHiddenChords(ids: Set<string>) {
  try {
    localStorage.setItem('fretmaster-hidden-chords', JSON.stringify([...ids]));
  } catch {}
}

// ─── Old Storage Migration ────────────────────────────────────────────────────

function migrateOldStorage(): CustomChordData[] {
  try {
    const raw = localStorage.getItem('fretmaster-custom-chords');
    if (!raw) return [];
    const parsed: SerializedCustomChord[] = JSON.parse(raw);
    return parsed.map(deserialize);
  } catch {
    return [];
  }
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface CustomChordStore {
  customChords: CustomChordData[];
  currentChord: CustomChordData;
  selectedColor: string;
  selectedShape: DotShape;
  selectedFinger: number;
  customLabel: string;
  isEditing: boolean;
  hiddenStandardChords: Set<string>;

  // Marker actions
  addMarker: (fret: number, string: number) => void;
  addMarkerDirect: (fret: number, string: number, finger: number, label: string) => void;
  removeMarker: (fret: number, string: number) => void;
  toggleMarker: (fret: number, string: number) => void;
  moveMarker: (fromFret: number, fromString: number, toFret: number, toString: number) => void;
  updateMarkerFinger: (fret: number, string: number, finger: number, label: string) => void;

  // String status actions
  toggleMutedString: (stringIdx: number) => void;
  toggleOpenString: (stringIdx: number) => void;
  toggleOpenDiamond: (stringIdx: number) => void;

  // Barre actions
  addBarre: (fret: number, fromString: number, toString: number) => void;
  addBarreFromStrings: (fret: number, strings: number[]) => void;
  removeBarre: (fret: number) => void;
  removeBarreByKey: (fret: number, fromString: number, toString: number) => void;

  // Chord metadata actions
  setName: (name: string) => void;
  setSymbol: (symbol: string) => void;
  setBaseFret: (fret: number) => void;
  setNumFrets: (num: number) => void;
  setChordType: (type: ChordType) => void;
  setChordCategory: (category: ChordCategory) => void;

  // Appearance actions
  setSelectedColor: (color: string) => void;
  setSelectedShape: (shape: DotShape) => void;
  setSelectedFinger: (finger: number) => void;
  setCustomLabel: (label: string) => void;

  // Save and delete actions
  saveChord: () => void;
  deleteChord: (id: string) => void;
  deleteFromLibrary: () => void;

  // Edit actions
  editChord: (id: string) => void;
  editStandardChord: (chord: ChordData) => void;
  newChord: () => void;
  clearFretboard: () => void;

  // Hidden chords
  hideStandardChord: (id: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCustomChordStore = create<CustomChordStore>()(
  persist(
    (set, get) => ({
      customChords: [],
      currentChord: createBlankChord(),
      selectedColor: DEFAULT_DOT_COLOR,
      selectedShape: 'circle' as DotShape,
      selectedFinger: 0,
      customLabel: '',
      isEditing: false,
      hiddenStandardChords: loadHiddenChords(),

      // ── Marker Actions ──────────────────────────────────────────────────────

      addMarker: (fret, stringIdx) => {
        const { selectedColor, selectedShape, selectedFinger, customLabel } = get();
        set(state => {
          const markers = state.currentChord.markers.filter(
            m => !(m.fret === fret && m.string === stringIdx)
          );
          markers.push({ fret, string: stringIdx, finger: selectedFinger, color: selectedColor, shape: selectedShape, label: customLabel });
          const openStrings = new Set(state.currentChord.openStrings);
          const mutedStrings = new Set(state.currentChord.mutedStrings);
          openStrings.delete(stringIdx);
          mutedStrings.delete(stringIdx);
          return { currentChord: { ...state.currentChord, markers, openStrings, mutedStrings } };
        });
      },

      addMarkerDirect: (fret, stringIdx, finger, label) => {
        const { selectedColor, selectedShape } = get();
        set(state => {
          const markers = state.currentChord.markers.filter(
            m => !(m.fret === fret && m.string === stringIdx)
          );
          markers.push({ fret, string: stringIdx, finger, color: selectedColor, shape: selectedShape, label });
          const openStrings = new Set(state.currentChord.openStrings);
          const mutedStrings = new Set(state.currentChord.mutedStrings);
          openStrings.delete(stringIdx);
          mutedStrings.delete(stringIdx);
          return { currentChord: { ...state.currentChord, markers, openStrings, mutedStrings } };
        });
      },

      removeMarker: (fret, stringIdx) => {
        set(state => ({
          currentChord: {
            ...state.currentChord,
            markers: state.currentChord.markers.filter(
              m => !(m.fret === fret && m.string === stringIdx)
            ),
          },
        }));
      },

      toggleMarker: (fret, stringIdx) => {
        const { currentChord } = get();
        const exists = currentChord.markers.some(m => m.fret === fret && m.string === stringIdx);
        if (exists) {
          get().removeMarker(fret, stringIdx);
        } else {
          get().addMarker(fret, stringIdx);
        }
      },

      moveMarker: (fromFret, fromString, toFret, toString) => {
        set(state => {
          const markers = state.currentChord.markers;
          const markerIdx = markers.findIndex(m => m.fret === fromFret && m.string === fromString);
          if (markerIdx === -1) return state;
          // Check if target is occupied
          const targetOccupied = markers.some(m => m.fret === toFret && m.string === toString);
          if (targetOccupied) return state;

          const newMarkers = markers.map((m, i) =>
            i === markerIdx ? { ...m, fret: toFret, string: toString } : m
          );
          const openStrings = new Set(state.currentChord.openStrings);
          const mutedStrings = new Set(state.currentChord.mutedStrings);
          openStrings.delete(toString);
          mutedStrings.delete(toString);
          return { currentChord: { ...state.currentChord, markers: newMarkers, openStrings, mutedStrings } };
        });
      },

      updateMarkerFinger: (fret, stringIdx, finger, label) => {
        set(state => ({
          currentChord: {
            ...state.currentChord,
            markers: state.currentChord.markers.map(m =>
              m.fret === fret && m.string === stringIdx ? { ...m, finger, label } : m
            ),
          },
        }));
      },

      // ── String Status Actions ───────────────────────────────────────────────

      toggleMutedString: (stringIdx) => {
        set(state => {
          const mutedStrings = new Set(state.currentChord.mutedStrings);
          const openStrings = new Set(state.currentChord.openStrings);
          const openDiamonds = new Set(state.currentChord.openDiamonds);
          let markers = state.currentChord.markers;

          if (mutedStrings.has(stringIdx)) {
            // Un-mute
            mutedStrings.delete(stringIdx);
          } else {
            // Mute: add to muted, remove from open/diamond, remove markers on that string
            mutedStrings.add(stringIdx);
            openStrings.delete(stringIdx);
            openDiamonds.delete(stringIdx);
            markers = markers.filter(m => m.string !== stringIdx);
          }
          return { currentChord: { ...state.currentChord, mutedStrings, openStrings, openDiamonds, markers } };
        });
      },

      toggleOpenString: (stringIdx) => {
        set(state => {
          const openStrings = new Set(state.currentChord.openStrings);
          const openDiamonds = new Set(state.currentChord.openDiamonds);
          const mutedStrings = new Set(state.currentChord.mutedStrings);
          let markers = state.currentChord.markers;

          if (openStrings.has(stringIdx)) {
            // Un-open
            openStrings.delete(stringIdx);
            openDiamonds.delete(stringIdx);
          } else {
            // Open: add to open, remove from muted, remove markers on that string
            openStrings.add(stringIdx);
            mutedStrings.delete(stringIdx);
            markers = markers.filter(m => m.string !== stringIdx);
          }
          return { currentChord: { ...state.currentChord, openStrings, openDiamonds, mutedStrings, markers } };
        });
      },

      toggleOpenDiamond: (stringIdx) => {
        set(state => {
          const openDiamonds = new Set(state.currentChord.openDiamonds);
          if (openDiamonds.has(stringIdx)) {
            openDiamonds.delete(stringIdx);
          } else {
            openDiamonds.add(stringIdx);
          }
          return { currentChord: { ...state.currentChord, openDiamonds } };
        });
      },

      // ── Barre Actions ───────────────────────────────────────────────────────

      addBarre: (fret, fromString, toString) => {
        const { selectedColor } = get();
        set(state => {
          const barres = state.currentChord.barres.filter(b => b.fret !== fret);
          barres.push({ fret, fromString, toString, color: selectedColor });
          return { currentChord: { ...state.currentChord, barres } };
        });
      },

      addBarreFromStrings: (fret, strings) => {
        if (strings.length < 2) return;
        const sorted = [...strings].sort((a, b) => a - b);
        const fromString = sorted[0];
        const toString = sorted[sorted.length - 1];
        set(state => {
          // Check if identical barre already exists
          const alreadyExists = state.currentChord.barres.some(
            b => b.fret === fret && b.fromString === fromString && b.toString === toString
          );
          if (alreadyExists) return state;
          const barres = [...state.currentChord.barres, { fret, fromString, toString, color: 'hsl(38 75% 52%)' }];
          return { currentChord: { ...state.currentChord, barres } };
        });
      },

      removeBarre: (fret) => {
        set(state => ({
          currentChord: {
            ...state.currentChord,
            barres: state.currentChord.barres.filter(b => b.fret !== fret),
          },
        }));
      },

      removeBarreByKey: (fret, fromString, toString) => {
        set(state => ({
          currentChord: {
            ...state.currentChord,
            barres: state.currentChord.barres.filter(
              b => !(b.fret === fret && b.fromString === fromString && b.toString === toString)
            ),
          },
        }));
      },

      // ── Chord Metadata Actions ──────────────────────────────────────────────

      setName: (name) =>
        set(state => ({ currentChord: { ...state.currentChord, name } })),

      setSymbol: (symbol) =>
        set(state => ({ currentChord: { ...state.currentChord, symbol } })),

      setBaseFret: (fret) =>
        set(state => ({ currentChord: { ...state.currentChord, baseFret: Math.max(1, Math.min(24, fret)) } })),

      setNumFrets: (num) =>
        set(state => ({ currentChord: { ...state.currentChord, numFrets: Math.max(3, Math.min(7, num)) } })),

      setChordType: (type) =>
        set(state => ({ currentChord: { ...state.currentChord, chordType: type } })),

      setChordCategory: (category) =>
        set(state => ({ currentChord: { ...state.currentChord, chordCategory: category } })),

      // ── Appearance Actions ──────────────────────────────────────────────────

      setSelectedColor: (color) => set({ selectedColor: color }),
      setSelectedShape: (shape) => set({ selectedShape: shape }),
      setSelectedFinger: (finger) => set({ selectedFinger: finger }),
      setCustomLabel: (label) => set({ customLabel: label }),

      // ── Save and Delete Actions ─────────────────────────────────────────────

      saveChord: () => {
        const state = get();
        const { currentChord, isEditing } = state;
        if (!currentChord.name.trim() || !currentChord.symbol.trim()) return;

        const saved: CustomChordData = {
          ...deepCopyChord(currentChord),
          updatedAt: Date.now(),
        };

        let customChords: CustomChordData[];
        if (isEditing) {
          const idxById = state.customChords.findIndex(c => c.id === saved.id);
          if (idxById !== -1) {
            customChords = state.customChords.map((c, i) => i === idxById ? saved : c);
          } else if (saved.sourceChordId) {
            const idxBySrc = state.customChords.findIndex(c => c.sourceChordId === saved.sourceChordId);
            if (idxBySrc !== -1) {
              customChords = state.customChords.map((c, i) => i === idxBySrc ? saved : c);
            } else {
              customChords = [...state.customChords, saved];
            }
          } else {
            customChords = [...state.customChords, saved];
          }
        } else {
          customChords = [...state.customChords, saved];
        }

        console.log(`[FretMaster] Chord saved. ID: ${saved.id} Total custom chords: ${customChords.length}`);
        set({ customChords, currentChord: createBlankChord(), isEditing: false });
      },

      deleteChord: (id) => {
        set(state => {
          const customChords = state.customChords.filter(c => c.id !== id);
          const reset = state.currentChord.id === id
            ? { currentChord: createBlankChord(), isEditing: false }
            : {};
          return { customChords, ...reset };
        });
      },

      deleteFromLibrary: () => {
        const state = get();
        if (state.isEditing) {
          const chord = state.currentChord;
          const customChords = state.customChords.filter(c => c.id !== chord.id);
          const hiddenStandardChords = new Set(state.hiddenStandardChords);
          if (chord.sourceChordId) {
            hiddenStandardChords.add(chord.sourceChordId);
            saveHiddenChords(hiddenStandardChords);
          }
          set({ customChords, hiddenStandardChords, currentChord: createBlankChord(), isEditing: false });
        } else if (state.currentChord.sourceChordId) {
          const hiddenStandardChords = new Set(state.hiddenStandardChords);
          hiddenStandardChords.add(state.currentChord.sourceChordId);
          saveHiddenChords(hiddenStandardChords);
          set({ hiddenStandardChords, currentChord: createBlankChord() });
        }
      },

      // ── Edit Actions ────────────────────────────────────────────────────────

      editChord: (id) => {
        const state = get();
        const chord = state.customChords.find(c => c.id === id);
        if (chord) {
          set({ currentChord: deepCopyChord(chord), isEditing: true });
        } else {
          console.warn(`[FretMaster] editChord: chord with id ${id} not found`);
        }
      },

      editStandardChord: (chord: ChordData) => {
        const state = get();

        // Check for existing replacement
        const existingReplacement = state.customChords.find(c => c.sourceChordId === chord.id);
        if (existingReplacement) {
          set({ currentChord: deepCopyChord(existingReplacement), isEditing: true });
          return;
        }

        // Convert standard chord to custom format
        const markers: FretMarker[] = [];
        const mutedStrings = new Set<number>();
        const openStrings = new Set<number>();
        const openDiamonds = new Set<number>();

        // Calculate baseFret and numFrets
        const frettedValues = chord.frets.filter(f => f > 0);
        const minFret = frettedValues.length > 0 ? Math.min(...frettedValues) : 1;
        const maxFret = frettedValues.length > 0 ? Math.max(...frettedValues) : 1;
        const baseFret = chord.baseFret > 1 ? chord.baseFret : (minFret > 3 ? minFret : 1);
        const numFrets = Math.max(5, maxFret - baseFret + 2);

        // Process each string
        for (let i = 0; i < 6; i++) {
          const fret = chord.frets[i];
          if (fret === -1) {
            mutedStrings.add(i);
          } else if (fret === 0) {
            openStrings.add(i);
            if (i === chord.rootNoteString) {
              openDiamonds.add(i);
            }
          } else {
            const relativeFret = fret - baseFret + 1;
            const isRoot = i === chord.rootNoteString;
            markers.push({
              fret: relativeFret,
              string: i,
              finger: chord.fingers[i],
              color: isRoot ? 'hsl(200 80% 62%)' : 'hsl(38 75% 52%)',
              shape: isRoot ? 'diamond' : 'circle',
              label: '',
            });
          }
        }

        // Convert barres
        const barres: CustomChordData['barres'] = [];
        if (chord.barres && chord.barres.length > 0) {
          for (const barreFret of chord.barres) {
            const relativeFret = barreFret - baseFret + 1;
            const barreStrings = chord.frets
              .map((f, idx) => ({ f, idx }))
              .filter(x => x.f === barreFret)
              .map(x => x.idx);
            if (barreStrings.length >= 2) {
              barres.push({
                fret: relativeFret,
                fromString: Math.min(...barreStrings),
                toString: Math.max(...barreStrings),
                color: 'hsl(38 75% 52%)',
              });
            }
          }
        }

        const customChord: CustomChordData = {
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: chord.name,
          symbol: chord.symbol,
          baseFret,
          numFrets: Math.min(numFrets, 7),
          mutedStrings,
          openStrings,
          openDiamonds,
          markers,
          barres,
          chordType: chord.type,
          chordCategory: chord.category === 'custom' ? 'open' : chord.category,
          sourceChordId: chord.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set({ currentChord: customChord, isEditing: true });
      },

      newChord: () => {
        set({ currentChord: createBlankChord(), isEditing: false });
      },

      clearFretboard: () => {
        set(state => ({
          currentChord: {
            ...state.currentChord,
            markers: [],
            barres: [],
            mutedStrings: new Set(),
            openStrings: new Set(),
            openDiamonds: new Set(),
          },
        }));
      },

      // ── Hidden Chords ───────────────────────────────────────────────────────

      hideStandardChord: (id) => {
        set(state => {
          const hiddenStandardChords = new Set(state.hiddenStandardChords);
          hiddenStandardChords.add(id);
          saveHiddenChords(hiddenStandardChords);
          return { hiddenStandardChords };
        });
      },
    }),
    {
      name: 'fretmaster-custom-chords-v2',
      partialize: (state) => ({
        customChords: state.customChords.map(serialize),
      }),
      merge: (persisted: any, current) => {
        let chords: CustomChordData[] = [];

        if (persisted?.customChords?.length > 0) {
          chords = persisted.customChords.map(deserialize);
        } else {
          // Fall back to old manual key for migration
          chords = migrateOldStorage();
          if (chords.length > 0) {
            localStorage.removeItem('fretmaster-custom-chords');
          }
        }

        return { ...current, customChords: chords };
      },
    }
  )
);

// Re-export customToLibraryChord for convenience
export { customToLibraryChord };
