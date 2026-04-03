import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  CustomChordData,
  FretMarker,
  DotShape,
  DEFAULT_DOT_COLOR,
  createBlankChord,
  customToLibraryChord,
} from '@/types/customChord';
import type { ChordType, ChordCategory, ChordData } from '@/types/chord';

// ─── Storage Key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'fretmaster-custom-chords-v3';
const HIDDEN_KEY  = 'fretmaster-hidden-chords';
const OLD_KEY_V2  = 'fretmaster-custom-chords-v2';
const OLD_KEY_V1  = 'fretmaster-custom-chords';

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

function serializeChord(chord: CustomChordData): SerializedCustomChord {
  return {
    id: chord.id,
    name: chord.name,
    symbol: chord.symbol,
    baseFret: chord.baseFret,
    numFrets: chord.numFrets,
    mutedStrings: Array.from(chord.mutedStrings),
    openStrings: Array.from(chord.openStrings),
    openDiamonds: Array.from(chord.openDiamonds),
    markers: chord.markers.map(m => ({ ...m })),
    barres: chord.barres.map(b => ({ ...b })),
    chordType: chord.chordType,
    chordCategory: chord.chordCategory,
    sourceChordId: chord.sourceChordId,
    createdAt: chord.createdAt,
    updatedAt: chord.updatedAt,
  };
}

function deserializeChord(data: SerializedCustomChord): CustomChordData {
  return {
    id: data.id,
    name: data.name,
    symbol: data.symbol,
    baseFret: data.baseFret ?? 1,
    numFrets: data.numFrets ?? 5,
    mutedStrings: new Set<number>(Array.isArray(data.mutedStrings) ? data.mutedStrings : []),
    openStrings: new Set<number>(Array.isArray(data.openStrings) ? data.openStrings : []),
    openDiamonds: new Set<number>(Array.isArray(data.openDiamonds) ? data.openDiamonds : []),
    markers: Array.isArray(data.markers) ? data.markers.map(m => ({ ...m })) : [],
    barres: Array.isArray(data.barres) ? data.barres.map(b => ({ ...b })) : [],
    chordType: data.chordType,
    chordCategory: data.chordCategory,
    sourceChordId: data.sourceChordId,
    createdAt: data.createdAt ?? Date.now(),
    updatedAt: data.updatedAt ?? Date.now(),
  };
}

// ─── Local Persistence (localStorage cache) ───────────────────────────────────
// localStorage is a fast local cache only. It is origin-scoped, so it can't be
// relied on for cross-session persistence across different preview URLs.
// Supabase is the authoritative, origin-agnostic store.

function saveCustomChords(chords: CustomChordData[]): void {
  try {
    const serialized: SerializedCustomChord[] = chords.map(serializeChord);
    const json = JSON.stringify(serialized);
    localStorage.setItem(STORAGE_KEY, json);
    console.log(
      `[FretMaster] localStorage cache updated: ${chords.length} chord(s) at origin ${window.location.origin}`
    );
  } catch (err) {
    console.error('[FretMaster] localStorage write failed (quota/private mode):', err);
  }
}

function loadCustomChords(): CustomChordData[] {
  // Try v3 key first
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: SerializedCustomChord[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const chords = parsed.map(deserializeChord);
        console.log(`[FretMaster] Loaded ${chords.length} chord(s) from localStorage cache`);
        return chords;
      }
    }
  } catch (err) {
    console.error('[FretMaster] Failed to load from v3 key:', err);
  }

  // Try v2 key (Zustand persist format: { state: { customChords: [...] }, version: 0 })
  try {
    const raw = localStorage.getItem(OLD_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw);
      const chordsRaw: SerializedCustomChord[] | undefined =
        parsed?.state?.customChords ?? parsed?.customChords;
      if (Array.isArray(chordsRaw) && chordsRaw.length > 0) {
        const chords = chordsRaw.map(deserializeChord);
        console.log(`[FretMaster] Migrated ${chords.length} chord(s) from v2 key`);
        saveCustomChords(chords);
        localStorage.removeItem(OLD_KEY_V2);
        return chords;
      }
    }
  } catch (err) {
    console.error('[FretMaster] Failed to migrate from v2 key:', err);
  }

  // Try v1 key (raw array)
  try {
    const raw = localStorage.getItem(OLD_KEY_V1);
    if (raw) {
      const parsed: SerializedCustomChord[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const chords = parsed.map(deserializeChord);
        console.log(`[FretMaster] Migrated ${chords.length} chord(s) from v1 key`);
        saveCustomChords(chords);
        localStorage.removeItem(OLD_KEY_V1);
        return chords;
      }
    }
  } catch (err) {
    console.error('[FretMaster] Failed to migrate from v1 key:', err);
  }

  console.log('[FretMaster] No localStorage cache — Supabase sync will load chords after auth');
  return [];
}

// ─── Supabase Sync ────────────────────────────────────────────────────────────
// We store the full serialized chord in the `notes` jsonb column (as a JSON
// string in a 1-element array). The row is identified by a namespaced key in the
// `name` column: `__fmid__<chord.id>`. This allows safe upsert on (user_id,name).

const SUPABASE_NAME_PREFIX = '__fmid__';

async function pushChordToSupabase(chord: CustomChordData, userId: string): Promise<void> {
  const serialized = serializeChord(chord);
  const nameKey = `${SUPABASE_NAME_PREFIX}${chord.id}`;

  const { error } = await supabase
    .from('custom_chords')
    .upsert(
      {
        user_id: userId,
        name: nameKey,
        frets: serialized.mutedStrings,   // repurposed — real data lives in notes
        fingers: serialized.openStrings,
        notes: [JSON.stringify(serialized)],
        chord_type: chord.chordCategory ?? 'custom',
      },
      { onConflict: 'user_id,name' }
    );

  if (error) {
    console.error(`[FretMaster] Supabase push failed for "${chord.symbol}":`, error.message);
  } else {
    console.log(`[FretMaster] ✅ Supabase upsert OK: "${chord.symbol}"`);
  }
}

async function deleteChordFromSupabase(chordId: string, userId: string): Promise<void> {
  const nameKey = `${SUPABASE_NAME_PREFIX}${chordId}`;
  const { error } = await supabase
    .from('custom_chords')
    .delete()
    .eq('user_id', userId)
    .eq('name', nameKey);
  if (error) {
    console.error('[FretMaster] Supabase delete failed:', error.message);
  }
}

async function fetchChordsFromSupabase(userId: string): Promise<CustomChordData[]> {
  const { data, error } = await supabase
    .from('custom_chords')
    .select('*')
    .eq('user_id', userId)
    .like('name', `${SUPABASE_NAME_PREFIX}%`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[FretMaster] Supabase fetch failed:', error.message);
    return [];
  }

  const chords: CustomChordData[] = [];
  for (const row of data ?? []) {
    try {
      const notesArr = row.notes as string[] | null;
      if (!notesArr || notesArr.length === 0) continue;
      const serialized: SerializedCustomChord = JSON.parse(notesArr[0]);
      chords.push(deserializeChord(serialized));
    } catch (e) {
      console.warn('[FretMaster] Failed to parse Supabase row:', row.id, e);
    }
  }
  console.log(`[FretMaster] ✅ Fetched ${chords.length} chord(s) from Supabase`);
  return chords;
}

// ─── Hidden Chords ────────────────────────────────────────────────────────────

function loadHiddenChords(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveHiddenChords(ids: Set<string>): void {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids]));
  } catch {}
}

// ─── Deep Copy ────────────────────────────────────────────────────────────────

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

// ─── Store Interface ──────────────────────────────────────────────────────────

// ─── Sync Status ─────────────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed';

interface CustomChordStore {
  customChords: CustomChordData[];
  currentChord: CustomChordData;
  selectedColor: string;
  selectedShape: DotShape;
  selectedFinger: number;
  customLabel: string;
  isEditing: boolean;
  hiddenStandardChords: Set<string>;

  // Sync status — updated by syncFromSupabase
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;   // epoch ms of last successful sync

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

  // Supabase sync — called once after auth resolves
  syncFromSupabase: (userId: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCustomChordStore = create<CustomChordStore>()(
  (set, get) => ({
    // Initialize from localStorage cache immediately (synchronous / fast).
    // Supabase will overwrite this with authoritative data after auth resolves.
    customChords: loadCustomChords(),
    currentChord: createBlankChord(),
    selectedColor: DEFAULT_DOT_COLOR,
    selectedShape: 'circle' as DotShape,
    selectedFinger: 0,
    customLabel: '',
    isEditing: false,
    hiddenStandardChords: loadHiddenChords(),
    syncStatus: 'idle' as SyncStatus,
    lastSyncedAt: null,

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
          mutedStrings.delete(stringIdx);
        } else {
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
          openStrings.delete(stringIdx);
          openDiamonds.delete(stringIdx);
        } else {
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

      // 1. Update localStorage cache (fast, synchronous)
      saveCustomChords(customChords);
      // 2. Update Zustand state
      set({ customChords, currentChord: createBlankChord(), isEditing: false });
      // 3. Push to Supabase (async, fire-and-forget — works across ALL origins)
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          pushChordToSupabase(saved, data.user.id);
        } else {
          console.warn('[FretMaster] Not logged in — chord saved to localStorage only. Log in to sync across devices/URLs.');
        }
      });
    },

    deleteChord: (id) => {
      const state = get();
      const customChords = state.customChords.filter(c => c.id !== id);
      saveCustomChords(customChords);
      const reset = state.currentChord.id === id
        ? { currentChord: createBlankChord(), isEditing: false }
        : {};
      set({ customChords, ...reset });
      // Delete from Supabase (fire-and-forget)
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          deleteChordFromSupabase(id, data.user.id);
        }
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
        saveCustomChords(customChords);
        set({ customChords, hiddenStandardChords, currentChord: createBlankChord(), isEditing: false });
        // Delete from Supabase (fire-and-forget)
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.id) {
            deleteChordFromSupabase(chord.id, data.user.id);
          }
        });
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

      const frettedValues = chord.frets.filter(f => f > 0);
      const minFret = frettedValues.length > 0 ? Math.min(...frettedValues) : 1;
      const maxFret = frettedValues.length > 0 ? Math.max(...frettedValues) : 1;
      const baseFret = chord.baseFret > 1 ? chord.baseFret : (minFret > 3 ? minFret : 1);
      const numFrets = Math.max(5, maxFret - baseFret + 2);

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

    // ── Supabase Sync ───────────────────────────────────────────────────────
    // Called once in App.tsx after auth resolves. Fetches all chords from
    // Supabase (origin-agnostic), merges with any local-only chords (saved
    // while logged out), pushes local-only chords to Supabase, then updates
    // both the store and the localStorage cache so future boots are fast.

    syncFromSupabase: async (userId: string) => {
      console.log(`[FretMaster] Starting Supabase sync for user ${userId}...`);
      set({ syncStatus: 'syncing' });

      try {
        const remoteChords = await fetchChordsFromSupabase(userId);
        const localChords  = get().customChords;

        const remoteById = new Map(remoteChords.map(c => [c.id, c]));

        // Chords only in localStorage — push them to Supabase
        const localOnly = localChords.filter(c => !remoteById.has(c.id));
        if (localOnly.length > 0) {
          console.log(`[FretMaster] Pushing ${localOnly.length} local-only chord(s) to Supabase...`);
          await Promise.all(localOnly.map(c => pushChordToSupabase(c, userId)));
        }

        // Merge: remote is authoritative; local-only chords are appended
        const seen = new Set<string>();
        const merged = [...remoteChords, ...localOnly].filter(c => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });

        saveCustomChords(merged);
        set({ customChords: merged, syncStatus: 'synced', lastSyncedAt: Date.now() });
        console.log(`[FretMaster] Sync complete. ${merged.length} total chord(s).`);
      } catch (err) {
        console.error('[FretMaster] syncFromSupabase error:', err);
        set({ syncStatus: 'failed' });
      }
    },
  })
);

// Re-export customToLibraryChord for convenience
export { customToLibraryChord };
