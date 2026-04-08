import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Guitar, Search, Sliders, Bookmark, Music, BarChart3, Move,
  Volume2, Library, MousePointer, Save, Heart, Edit,
  Package, ChevronDown, ChevronRight, Star, Sparkles, Zap,
  CheckCircle2, Pencil, X, KeyRound, MapPin,
} from 'lucide-react';
import { CHORD_DATABASE } from '@/constants/chords';
import type { ChordData, ChordType, BarreRoot } from '@/types/chord';
import { CHORD_TYPE_LABELS } from '@/types/chord';
import type { KeySignature } from '@/constants/scales';
import { KEY_SIGNATURES, NOTE_NAMES } from '@/constants/scales';
import type { PositionFilter } from '@/stores/chordLibraryStore';
import ChordDetailModal from '@/components/features/ChordDetailModal';
import { SVGChordDiagram } from '@/components/features/SVGChordDiagram';
import { useChordAudio } from '@/hooks/useChordAudio';
import { usePresetStore } from '@/stores/presetStore';
import { useChordLibraryStore } from '@/stores/chordLibraryStore';
import { useCustomChordStore } from '@/stores/customChordStore';
import { useChordFavoritesStore } from '@/stores/chordFavoritesStore';
import { customToLibraryChord } from '@/types/customChord';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

const REVERSED_STRINGS = ['e', 'B', 'G', 'D', 'A', 'E'];

// ─── ChordCard ─────────────────────────────────────────────────────────────────

interface ChordCardProps {
  chord: ChordData & { isCustom?: boolean };
  isSelected: boolean;
  isFavorited: boolean;
  onToggleSelect: () => void;
  onToggleFavorite: () => void;
  onClick: () => void;
}

function ChordCard({ chord, isSelected, isFavorited, onToggleSelect, onToggleFavorite, onClick }: ChordCardProps) {
  const { playChord } = useChordAudio();

  return (
    <div
      className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Left column: Checkbox + Play + Favorite stacked */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            className="flex-shrink-0"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-amber-500 border-amber-500'
                : 'border-zinc-700 hover:border-zinc-600'
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>

          {/* Play Button */}
          <button
            onClick={(e) => { e.stopPropagation(); playChord(chord); }}
            className="flex-shrink-0 p-2 bg-zinc-800 hover:bg-amber-500 text-amber-500 hover:text-zinc-950 rounded-lg transition-all group border border-amber-500/25 mt-[0.2in]"
          >
            <Volume2 className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Favorite Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`flex-shrink-0 p-2 rounded-lg transition-all border ${
              isFavorited
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
                : 'bg-zinc-800 border-zinc-700 text-zinc-600 hover:text-rose-400 hover:border-rose-500/40'
            }`}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-400 stroke-rose-400' : ''}`} />
          </button>
        </div>

        {/* Chord Info */}
        <div className="flex-1 min-w-0 py-2">
          <div className="text-3xl font-black text-white mb-0.5">
            {chord.symbol}
          </div>
          <div className={`text-xs uppercase tracking-wide mb-1 ${
            chord.category === 'open' ? 'text-emerald-400'
            : chord.category === 'barre' ? 'text-purple-400'
            : chord.category === 'movable' ? 'text-yellow-300'
            : 'text-zinc-400'
          }`}>
            {chord.category === 'open' ? 'Open'
              : chord.category === 'barre' ? 'Barre'
              : chord.category === 'movable' ? 'Movable'
              : 'Custom'}
          </div>
          <div className="text-sm text-zinc-400">
            {chord.name}
          </div>
        </div>

          {/* Chord Diagram — SVGChordDiagram handles both standard and custom */}
        <div className="flex-shrink-0">
          {(chord as any).isCustom ? (
            <SVGChordDiagram
              isCustom
              chord={{
                id: chord.id,
                name: chord.name,
                symbol: chord.symbol,
                baseFret: chord.baseFret,
                numFrets: (chord as any).numFrets ?? 5,
                markers: (chord as any).customMarkers ?? [],
                barres: (chord as any).customBarres ?? [],
                mutedStrings: new Set<number>((chord as any).customMutedStrings ?? []),
                openStrings: new Set<number>((chord as any).customOpenStrings ?? []),
                openDiamonds: new Set<number>((chord as any).customOpenDiamonds ?? []),
                chordType: chord.type,
                chordCategory: chord.category,
                sourceChordId: (chord as any).sourceChordId,
                createdAt: 0,
                updatedAt: 0,
              }}
              size="sm"
              libraryMode
            />
          ) : (
            <SVGChordDiagram chord={chord} size="sm" />
          )}
        </div>

        {/* Tablature */}
        <div className="bg-white rounded-md px-2.5 py-2 text-[10px] font-mono self-start shadow-lg flex-shrink-0">
          {[...chord.frets].reverse().map((fret, idx) => (
            <div key={idx} className="flex gap-1.5 items-center py-[1px]">
              <span className="text-zinc-800 font-bold w-2">{REVERSED_STRINGS[idx]}</span>
              <span className="text-zinc-400">—</span>
              <span className="text-zinc-900 font-bold w-2.5 text-center text-xs">
                {fret === -1 ? 'x' : fret === 0 ? '0' : fret}
              </span>
              <span className="text-zinc-400">—</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ChordLibrary Page ─────────────────────────────────────────────────────────

export default function ChordLibrary() {
  const navigate = useNavigate();

  // ── Persistent state via Zustand store (survives navigation) ─────────────────
  const {
    searchQuery,
    setSearchQuery,
    selectedChordIds,
    setSelectedChordIds,
    toggleChordSelection: storeToggleChordSelection,
    filterCategories,
    toggleCategory: storeToggleCategory,
    clearCategories: storeClearCategories,
    filterTypes,
    setFilterTypes,
    filterBarreRoots,
    toggleType: storeToggleType,
    toggleBarreRoot: storeToggleBarreRoot,
    clearBarreRoots: storeClearBarreRoots,
    filterPositions,
    togglePosition: storeTogglePosition,
    clearPositions: storeClearPositions,
    filterKey,
    setFilterKey,
    activeLibraryPresetId,
    setActiveLibraryPreset,
    savedScrollY,
    setSavedScrollY,
  } = useChordLibraryStore();

  // Type filter order — matches ChordEditor's EDITABLE_TYPES list
  const TYPE_FILTER_ORDER: ChordType[] = [
    'major', 'minor', 'augmented', 'slash', 'diminished', 'sus2', 'sus4', 'major6', 'minor6',
    'major7', 'dominant7', 'minor7', 'aug7', 'halfDim7', 'dim7', 'add9',
    'major9', '9th', 'minor9',
    'major11', '11th', 'minor11',
    'major13', '13th', 'minor13',
  ];

  // Derived mutable set from persisted array
  const selectedChords = useMemo(() => new Set(selectedChordIds), [selectedChordIds]);

  // ── Local-only state (intentionally resets each visit) ───────────────────────
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [detailModalChord, setDetailModalChord] = useState<(ChordData & { isCustom?: boolean }) | null>(null);
  const [detailModalIndex, setDetailModalIndex] = useState(0);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(activeLibraryPresetId);
  const [packAssignments, setPackAssignments] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem('fretmaster_pack_assignments');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // ── Scroll restoration ───────────────────────────────────────────────────────
  const lastScrollY = useRef(0);
  const restoredRef = useRef(false);

  const getScrollEl = () => document.getElementById('main-content');

  useEffect(() => {
    const el = getScrollEl();
    if (!el) return;
    const handleScroll = () => {
      lastScrollY.current = el.scrollTop;
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      setSavedScrollY(lastScrollY.current);
    };
  }, [setSavedScrollY]);

  useEffect(() => {
    if (!savedScrollY || restoredRef.current) return;
    restoredRef.current = true;
    const el = getScrollEl();
    if (!el) return;
    el.scrollTop = savedScrollY;
  }, [savedScrollY]);

  // ── Scroll to top when any filter changes (so user sees updated count + list) ─
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const el = getScrollEl();
    if (el) el.scrollTop = 0;
  }, [filterCategories, filterTypes, filterBarreRoots, filterPositions, filterKey?.noteName, showFavoritesOnly]);

  const { presets: userPresets, addPreset } = usePresetStore();

  // ── Custom chord store — subscribed so memo re-runs on syncFromSupabase ───────
  const { editStandardChord, editChord, customChords, hiddenStandardChords, syncFromSupabase, syncStatus, lastSyncedAt } = useCustomChordStore();
  const user = useAuthStore(s => s.user);

  // Manual sync button — lets user force-pull from Supabase if library looks stale
  const handleManualSync = async () => {
    if (!user?.id) { toast.error('Sign in to sync your chords'); return; }
    await syncFromSupabase(user.id);
    if (useCustomChordStore.getState().syncStatus === 'synced') {
      toast.success('Library synced from cloud');
    } else {
      toast.error('Sync failed — check your connection');
    }
  };

  // Format last-synced timestamp as a short relative string
  const syncTimeLabel = lastSyncedAt
    ? (() => {
        const diffMs = Date.now() - lastSyncedAt;
        const diffMin = Math.floor(diffMs / 60_000);
        if (diffMin < 1) return 'just now';
        if (diffMin === 1) return '1 min ago';
        if (diffMin < 60) return `${diffMin} min ago`;
        const diffHr = Math.floor(diffMin / 60);
        return diffHr === 1 ? '1 hr ago' : `${diffHr} hr ago`;
      })()
    : null;

  const { favoriteIds, toggleFavorite } = useChordFavoritesStore();
  const { playChord } = useChordAudio();

  // ── Effective chord list ─────────────────────────────────────────────────────
  // Built directly from subscribed Zustand values (not getState() snapshot) so
  // this memo re-runs correctly whenever syncFromSupabase updates the store.
  const allChords = useMemo(() => {
    const replacedIds = new Set(
      customChords.filter(c => c.sourceChordId).map(c => c.sourceChordId!)
    );
    const standardChords = CHORD_DATABASE.filter(
      c => !replacedIds.has(c.id) && !hiddenStandardChords.has(c.id)
    );
    const converted = customChords.map(customToLibraryChord);
    return [...standardChords, ...converted];
  }, [customChords, hiddenStandardChords]);

  // ── Filtered chord list ──────────────────────────────────────────────────────
  const filteredChords = useMemo(() => {
    // Key filter: same major-scale matching as practiceStore
    // Pre-compute scaleNotes ONCE per memo execution (not per-chord)
    const keyRootIdx = filterKey ? NOTE_NAMES.indexOf(filterKey.noteName as string) : -1;
    const majorIntervals = [0, 2, 4, 5, 7, 9, 11];
    const scaleNotes = keyRootIdx >= 0
      ? new Set(majorIntervals.map((i) => (keyRootIdx + i) % 12))
      : null;
    const noteBase: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

    const result = allChords.filter((chord) => {
      const searchMatch =
        !searchQuery ||
        chord.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chord.name.toLowerCase().includes(searchQuery.toLowerCase());

      const categoryMatch =
        filterCategories.length === 0 ||
        filterCategories.includes(chord.category as any);

      const typeMatch =
        filterTypes.length === 0 || filterTypes.includes(chord.type as ChordType);

      const favoriteMatch = !showFavoritesOnly || favoriteIds.has(chord.id);

      // Root string filter
      const rootStringMatch =
        filterBarreRoots.length === 0 ||
        (() => {
          const stringNumber = (6 - chord.rootNoteString) as BarreRoot;
          return filterBarreRoots.includes(stringNumber);
        })();

      // Position filter (neck position range)
      let positionMatch = true;
      if (filterPositions.length > 0) {
        positionMatch = false;
        for (const pos of filterPositions) {
          if (pos === 'open' && chord.category === 'open') { positionMatch = true; break; }
          if (pos === 'low' && chord.category !== 'open' && chord.baseFret >= 1 && chord.baseFret <= 4) { positionMatch = true; break; }
          if (pos === 'mid' && chord.baseFret >= 5 && chord.baseFret <= 8) { positionMatch = true; break; }
          if (pos === 'high' && chord.baseFret >= 9 && chord.baseFret <= 12) { positionMatch = true; break; }
        }
      }

      // Key filter
      let keyMatch = true;
      if (scaleNotes) {
        const match = chord.symbol.match(/^([A-G])([#b]?)/);
        if (match) {
          let semitone = noteBase[match[1]] ?? -1;
          if (match[2] === '#') semitone = (semitone + 1) % 12;
          if (match[2] === 'b') semitone = (semitone + 11) % 12;
          keyMatch = semitone >= 0 && scaleNotes.has(semitone);
        } else {
          keyMatch = false;
        }
      }

      return searchMatch && categoryMatch && typeMatch && favoriteMatch && rootStringMatch && positionMatch && keyMatch;
    });
    return result;
  // filterKey?.noteName (primitive string) ensures value-based comparison — prevents stale
  // reference equality issues when the same KeySignature object is stored across re-renders.
  }, [allChords, searchQuery, filterCategories, filterTypes, filterBarreRoots, filterPositions, filterKey?.noteName ?? '', showFavoritesOnly, favoriteIds]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const toggleCategoryFilter = (category: string) => {
    storeToggleCategory(category as any);
  };

  const toggleChordSelection = (id: string) => {
    storeToggleChordSelection(id);
  };

  const handleChordClick = (chord: ChordData & { isCustom?: boolean }, index: number) => {
    setDetailModalChord(chord);
    setDetailModalIndex(index);
  };

  const handleNextChord = () => {
    if (detailModalIndex < filteredChords.length - 1) {
      const next = detailModalIndex + 1;
      setDetailModalIndex(next);
      setDetailModalChord(filteredChords[next] as ChordData & { isCustom?: boolean });
    }
  };

  const handlePreviousChord = () => {
    if (detailModalIndex > 0) {
      const prev = detailModalIndex - 1;
      setDetailModalIndex(prev);
      setDetailModalChord(filteredChords[prev] as ChordData & { isCustom?: boolean });
    }
  };

  const handleEdit = (chord: ChordData & { isCustom?: boolean }) => {
    if (chord.isCustom) {
      editChord(chord.id);
    } else {
      editStandardChord(chord);
    }
    navigate('/editor');
  };

  const handleEditPackSlot = (packId: string) => {
    const assigned = packAssignments[packId];
    if (assigned && assigned.length > 0) {
      setSelectedChordIds(assigned);
    }
    setEditingPackId(packId);
    setShowPresetMenu(false);
    const packTitle = CHORD_PACKS.find((p) => p.id === packId)?.title ?? packId;
    toast.success(`Editing "${packTitle}" — adjust chords then open the dropdown to re-save`);
  };

  const handleSaveToPackSlot = (packId: string) => {
    if (selectedChords.size === 0) {
      toast.error('Select at least one chord first');
      return;
    }
    const updated = { ...packAssignments, [packId]: Array.from(selectedChords) };
    setPackAssignments(updated);
    localStorage.setItem('fretmaster_pack_assignments', JSON.stringify(updated));
    const packTitle = CHORD_PACKS.find((p) => p.id === packId)?.title ?? packId;
    if (editingPackId === packId) setEditingPackId(null);
    setSelectedChordIds([]);
    toast.success(`${selectedChords.size} chords saved to "${packTitle}"`);
  };

  const handleLoadPackSlot = (packId: string) => {
    const chords = packAssignments[packId];
    if (!chords || chords.length === 0) return;
    setSelectedChordIds(chords);
    setSelectedPreset(packId);
    setActiveLibraryPreset(packId);
    setShowPresetMenu(false);
    toast.success(`Loaded ${chords.length} chords from pack`);
  };

  const handleClearPackSlot = (packId: string) => {
    const updated = { ...packAssignments };
    delete updated[packId];
    setPackAssignments(updated);
    localStorage.setItem('fretmaster_pack_assignments', JSON.stringify(updated));
    if (selectedPreset === packId) { setSelectedPreset(null); setActiveLibraryPreset(null); }
    if (editingPackId === packId) setEditingPackId(null);
    toast.success('Pack cleared');
  };

  const handleCreatePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    if (selectedChords.size === 0) {
      toast.error('Please select at least one chord');
      return;
    }
    addPreset(newPresetName, Array.from(selectedChords));
    toast.success(`Preset "${newPresetName}" created with ${selectedChords.size} chords`);
    setNewPresetName('');
    setShowPresetMenu(false);
    setSelectedChordIds([]);
  };

  const handleLoadPreset = (presetName: string) => {
    const preset = userPresets.find((p) => p.name === presetName);
    if (preset) {
      setSelectedChordIds(preset.chordIds);
      setSelectedPreset(presetName);
      setActiveLibraryPreset(preset.id);
      setShowPresetMenu(false);
      toast.success(`Loaded preset "${presetName}" with ${preset.chordIds.length} chords`);
    }
  };

  const favoriteCount = favoriteIds.size;

  // Root string options
  const ROOT_STRING_OPTIONS: { value: BarreRoot; label: string }[] = [
    { value: 6, label: '6th String' },
    { value: 5, label: '5th String' },
    { value: 4, label: '4th String' },
  ];

  const [showRootMenu, setShowRootMenu] = useState(false);
  const rootMenuRef = useRef<HTMLDivElement>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const [showPositionMenu, setShowPositionMenu] = useState(false);
  const positionMenuRef = useRef<HTMLDivElement>(null);
  const [showKeyMenu, setShowKeyMenu] = useState(false);
  const keyMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rootMenuRef.current && !rootMenuRef.current.contains(e.target as Node)) {
        setShowRootMenu(false);
      }
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
        setShowTypeMenu(false);
      }
      if (positionMenuRef.current && !positionMenuRef.current.contains(e.target as Node)) {
        setShowPositionMenu(false);
      }
      if (keyMenuRef.current && !keyMenuRef.current.contains(e.target as Node)) {
        setShowKeyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Chord Pack definitions ──────────────────────────────────────────────────
  const CHORD_PACKS = [
    {
      id: 'first-song-starter',
      title: 'First Song Starter Pack',
      description: 'The essential open chords every beginner needs to play their first real song.',
      icon: <Star className="w-4 h-4" />,
      accentColor: 'from-amber-500 to-orange-500',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      iconBg: 'bg-amber-500/15 text-amber-400',
      saveBtnColor: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30',
      loadBtnColor: 'bg-amber-500 hover:bg-amber-600 text-zinc-950',
    },
    {
      id: 'open-chord-essentials',
      title: 'Open Chord Essentials',
      description: 'Master the foundational open chord shapes that power hundreds of popular songs.',
      icon: <Sparkles className="w-4 h-4" />,
      accentColor: 'from-emerald-500 to-teal-500',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
      saveBtnColor: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30',
      loadBtnColor: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    },
    {
      id: 'power-chord-builder',
      title: 'Power Chord Builder',
      description: 'Rock-ready movable shapes that unlock the entire fretboard once mastered.',
      icon: <Zap className="w-4 h-4" />,
      accentColor: 'from-purple-500 to-indigo-500',
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
      iconBg: 'bg-purple-500/15 text-purple-400',
      saveBtnColor: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30',
      loadBtnColor: 'bg-purple-500 hover:bg-purple-600 text-white',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Guitar className="w-7 h-7 text-amber-500" />
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-1">Chord Library</h1>
              <p className="text-sm text-zinc-500">
                Browse all chord diagrams — tap the checkbox to select chords for a practice preset
              </p>
            </div>
            {/* Sync status badge + manual sync — visible when logged in */}
            {user && (
              <button
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing'}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
                  "
                style={{
                  // Dynamic colours via inline style to avoid Tailwind purge issues with dynamic class names
                  ...(syncStatus === 'synced'
                    ? { color: '#4ade80', borderColor: 'rgba(74,222,128,0.35)', background: 'rgba(74,222,128,0.08)' }
                    : syncStatus === 'failed'
                    ? { color: '#fbbf24', borderColor: 'rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.08)' }
                    : syncStatus === 'syncing'
                    ? { color: '#a1a1aa', borderColor: 'rgba(161,161,170,0.25)', background: 'rgba(161,161,170,0.05)' }
                    : { color: '#71717a', borderColor: 'rgba(113,113,122,0.25)', background: 'transparent' }),
                }}
                aria-label={
                  syncStatus === 'synced' ? `Synced ${syncTimeLabel ?? ''}. Click to sync again.`
                  : syncStatus === 'failed' ? 'Sync failed. Click to retry.'
                  : syncStatus === 'syncing' ? 'Syncing…'
                  : 'Click to sync from cloud'
                }
              >
                {syncStatus === 'syncing' && (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {syncStatus === 'synced' && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {syncStatus === 'failed' && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                )}
                {(syncStatus === 'idle' || syncStatus === 'failed') && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span>
                  {syncStatus === 'syncing' && 'Syncing…'}
                  {syncStatus === 'synced' && (syncTimeLabel ? `Synced ${syncTimeLabel}` : 'Synced')}
                  {syncStatus === 'failed' && 'Sync failed — retry'}
                  {syncStatus === 'idle' && 'Sync'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Edit Pack Banner */}
        {editingPackId && (() => {
          const pack = CHORD_PACKS.find((p) => p.id === editingPackId);
          return pack ? (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
              <Pencil className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-400">Editing Pack</p>
                <p className="text-sm font-bold text-white truncate">{pack.title}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-amber-400/80">{selectedChords.size} selected</span>
                <button
                  onClick={() => setEditingPackId(null)}
                  className="text-amber-400/60 hover:text-amber-400 transition-colors"
                  aria-label="Cancel editing"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null;
        })()}

        {/* Preset Dropdown */}
        <div className="mb-4 relative">
          <button
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            className={`w-full border rounded-lg px-4 py-3 flex items-center justify-between transition-colors ${
              showPresetMenu
                ? 'bg-zinc-900 border-zinc-700'
                : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-zinc-200">
                {selectedPreset || 'Choose a Chord Pack'}
              </span>
              {selectedChords.size > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  {selectedChords.size} selected
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${
                showPresetMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showPresetMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 z-10 overflow-hidden">
              
              <div className="p-3 border-b border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">
                  Curated Packs
                </div>
                <div className="space-y-2">
                  {CHORD_PACKS.map((pack) => {
                    const assigned = packAssignments[pack.id];
                    const isPopulated = assigned && assigned.length > 0;
                    const isActive = selectedPreset === pack.id;
                    return (
                      <div
                        key={pack.id}
                        onClick={() => isPopulated && handleLoadPackSlot(pack.id)}
                        className={`relative flex items-center gap-3 bg-zinc-950 border rounded-lg p-3 overflow-hidden transition-all ${
                          isPopulated
                            ? isActive
                              ? 'border-amber-500/50 cursor-pointer'
                              : 'border-zinc-700 hover:border-zinc-600 cursor-pointer'
                            : 'border-zinc-800 cursor-default'
                        }`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg bg-gradient-to-b ${pack.accentColor}`} />
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ml-1 ${pack.iconBg}`}>
                          {pack.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{pack.title}</span>
                            {isPopulated ? (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-zinc-800 text-zinc-300 border-zinc-700">
                                {assigned.length} chords
                              </span>
                            ) : (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${pack.badgeColor}`}>
                                Empty
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{pack.description}</p>
                        </div>
                        {isPopulated ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isActive && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditPackSlot(pack.id); }}
                              className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                              aria-label={`Edit ${pack.title}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleClearPackSlot(pack.id); }}
                              className="text-zinc-600 hover:text-zinc-400 text-[10px] underline underline-offset-2 transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 border-b border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">
                  Save Selected Chords to a Pack
                </div>
                {selectedChords.size === 0 ? (
                  <p className="text-xs text-zinc-600 px-1 mb-3">
                    Select chords from the list below, then tap a pack slot to save them.
                  </p>
                ) : editingPackId ? (
                  <p className="text-xs text-amber-400 px-1 mb-3 font-medium">
                    {selectedChords.size} chord{selectedChords.size !== 1 ? 's' : ''} selected — tap the pack below to update:
                  </p>
                ) : (
                  <p className="text-xs text-emerald-400 px-1 mb-3 font-medium">
                    {selectedChords.size} chord{selectedChords.size !== 1 ? 's' : ''} selected — choose a pack slot:
                  </p>
                )}
                <div className="space-y-2 mb-3">
                  {CHORD_PACKS.map((pack) => {
                    const assigned = packAssignments[pack.id];
                    const isPopulated = assigned && assigned.length > 0;
                    return (
                      <button
                        key={pack.id}
                        onClick={() => handleSaveToPackSlot(pack.id)}
                        disabled={selectedChords.size === 0}
                        className={`w-full relative flex items-center gap-3 border rounded-lg px-3 py-2.5 overflow-hidden transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          editingPackId === pack.id
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                            : selectedChords.size > 0
                            ? `${pack.saveBtnColor} border`
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg bg-gradient-to-b ${pack.accentColor}`} />
                        <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ml-1 ${pack.iconBg}`}>
                          <span className="scale-75">{pack.icon}</span>
                        </div>
                        <span className="flex-1 text-left text-xs font-semibold">{pack.title}</span>
                        {isPopulated && (
                          <span className="text-[10px] text-zinc-400 shrink-0">{assigned.length} saved</span>
                        )}
                        <Save className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">or name your own</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Custom preset name..."
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    onClick={handleCreatePreset}
                    disabled={!newPresetName.trim() || selectedChords.size === 0}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {userPresets && userPresets.length > 0 ? (
                <div className="p-3">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-2">Saved Presets</div>
                  <div className="space-y-1">
                    {userPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleLoadPreset(preset.name)}
                        className="w-full text-left flex items-center justify-between px-3 py-2.5 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-3.5 h-3.5 text-zinc-600" />
                          <span className="text-sm text-white font-medium">{preset.name}</span>
                        </div>
                        <span className="text-xs text-zinc-500">{preset.chordIds?.length || 0} chords</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 text-center">
                  <p className="text-xs text-zinc-600">No saved presets yet — select chords and save above</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Search chords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
          <button className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 hover:bg-zinc-900 transition-colors">
            <Sliders className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Filter Pills — two static rows, no scroll */}
        <div className="mb-4">
          {/* Row 1: All + Category */}
          <div className="flex gap-1.5 flex-wrap mb-1.5">
            <button
              onClick={() => { storeClearCategories(); setFilterTypes([]); storeClearBarreRoots(); storeClearPositions(); setFilterKey(null); setShowFavoritesOnly(false); }}
              className={`px-3 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap transition-all ${
                filterCategories.length === 0 && filterTypes.length === 0 && filterBarreRoots.length === 0 && filterPositions.length === 0 && !filterKey && !showFavoritesOnly
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => toggleCategoryFilter('open')}
              className={`px-3 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 ${
                filterCategories.includes('open')
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Music className="w-3 h-3" />
              Open
            </button>
            <button
              onClick={() => toggleCategoryFilter('barre')}
              className={`px-3 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all ${
                filterCategories.includes('barre')
                  ? 'bg-purple-500 text-white'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              Barre
            </button>
            <button
              onClick={() => toggleCategoryFilter('movable')}
              className={`px-3 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all ${
                filterCategories.includes('movable')
                  ? 'bg-yellow-400 text-zinc-950'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Move className="w-3 h-3" />
              Movable
            </button>

          </div>

          {/* Row 2: Type, Root, Favs */}
          <div className="flex gap-1.5 flex-wrap">
            {/* Type filter — multi-select dropdown pill */}
            <div className="relative" ref={typeMenuRef}>
              <button
                onClick={() => setShowTypeMenu((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  filterTypes.length > 0
                    ? 'bg-amber-500 text-zinc-950 border border-amber-500'
                    : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <Music className="w-3 h-3" />
                {filterTypes.length > 0
                  ? filterTypes.length === 1
                    ? CHORD_TYPE_LABELS[filterTypes[0]]
                    : `${filterTypes.length} Types`
                  : 'Type'}
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${
                  showTypeMenu ? 'rotate-180' : ''
                }`} />
              </button>

              {showTypeMenu && (
                <div className="absolute top-full left-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 z-20 min-w-[200px] overflow-hidden">
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Chord Type</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {TYPE_FILTER_ORDER.map((type) => {
                      const isActive = filterTypes.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => storeToggleType(type)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold transition-colors ${
                            isActive
                              ? 'text-amber-300 bg-amber-500/15'
                              : 'text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <span>{CHORD_TYPE_LABELS[type]}</span>
                          {isActive && (
                            <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {filterTypes.length > 0 && (
                    <>
                      <div className="mx-3 border-t border-zinc-800" />
                      <button
                        onClick={() => { setFilterTypes([]); setShowTypeMenu(false); }}
                        className="w-full text-left px-3 py-2 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        Clear type filter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Root String filter — custom dropdown pill */}
            <div className="relative" ref={rootMenuRef}>
              <button
                onClick={() => setShowRootMenu((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  filterBarreRoots.length > 0
                    ? 'bg-indigo-500 text-white border border-indigo-500'
                    : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <Guitar className="w-3 h-3" />
                {filterBarreRoots.length > 0
                  ? filterBarreRoots.map(r => `${r}th`).join(', ')
                  : 'Root'}
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${
                  showRootMenu ? 'rotate-180' : ''
                }`} />
              </button>

              {showRootMenu && (
                <div className="absolute top-full left-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 z-20 min-w-[160px] overflow-hidden">
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Root Note String</p>
                  </div>
                  {ROOT_STRING_OPTIONS.map(({ value, label }) => {
                    const isActive = filterBarreRoots.includes(value);
                    return (
                      <button
                        key={value}
                        onClick={() => storeToggleBarreRoot(value)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                          isActive
                            ? 'text-indigo-300 bg-indigo-500/15'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <span>{label}</span>
                        {isActive && (
                          <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                  {filterBarreRoots.length > 0 && (
                    <>
                      <div className="mx-3 border-t border-zinc-800" />
                      <button
                        onClick={() => { storeClearBarreRoots(); setShowRootMenu(false); }}
                        className="w-full text-left px-3 py-2 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        Clear root filter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all ${
                showFavoritesOnly
                  ? 'bg-rose-500 text-white'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-rose-500/40 hover:text-rose-400'
              }`}
            >
              <Heart className={`w-3 h-3 ${showFavoritesOnly ? 'fill-white' : ''}`} />
              Favs
              {favoriteCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  showFavoritesOnly ? 'bg-white/20' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {favoriteCount}
                </span>
              )}
            </button>

            {/* Position filter — multi-select dropdown pill */}
            <div className="relative" ref={positionMenuRef}>
              <button
                onClick={() => setShowPositionMenu((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  filterPositions.length > 0
                    ? 'bg-sky-500 text-white border border-sky-500'
                    : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <MapPin className="w-3 h-3" />
                {filterPositions.length > 0
                  ? filterPositions.length === 1
                    ? { open: 'Open', low: 'Low', mid: 'Mid', high: 'High' }[filterPositions[0]]
                    : `${filterPositions.length} Positions`
                  : 'Position'}
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${
                  showPositionMenu ? 'rotate-180' : ''
                }`} />
              </button>

              {showPositionMenu && (
                <div className="absolute top-full left-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 z-20 min-w-[180px] overflow-hidden">
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Neck Position</p>
                  </div>
                  {([
                    { value: 'open' as PositionFilter, label: 'Open', sub: 'Open string chords' },
                    { value: 'low' as PositionFilter, label: 'Low', sub: 'Frets 1–4' },
                    { value: 'mid' as PositionFilter, label: 'Mid', sub: 'Frets 5–8' },
                    { value: 'high' as PositionFilter, label: 'High', sub: 'Frets 9–12' },
                  ]).map(({ value, label, sub }) => {
                    const isActive = filterPositions.includes(value);
                    return (
                      <button
                        key={value}
                        onClick={() => storeTogglePosition(value)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                          isActive ? 'text-sky-300 bg-sky-500/15' : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div>
                          <div>{label}</div>
                          <div className="text-[10px] font-normal text-zinc-500">{sub}</div>
                        </div>
                        {isActive && (
                          <svg className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                  {filterPositions.length > 0 && (
                    <>
                      <div className="mx-3 border-t border-zinc-800" />
                      <button
                        onClick={() => { storeClearPositions(); setShowPositionMenu(false); }}
                        className="w-full text-left px-3 py-2 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        Clear position filter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Key filter — single-select dropdown pill */}
            <div className="relative" ref={keyMenuRef}>
              <button
                onClick={() => setShowKeyMenu((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  filterKey
                    ? 'bg-emerald-500 text-white border border-emerald-500'
                    : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <KeyRound className="w-3 h-3" />
                {filterKey ? `${filterKey.display} Major` : 'Key'}
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${
                  showKeyMenu ? 'rotate-180' : ''
                }`} />
              </button>

              {showKeyMenu && (
                <div className="absolute top-full right-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 z-20 w-72 max-h-72 overflow-y-auto">
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Major Key</p>
                  </div>
                  <button
                    onClick={() => { setFilterKey(null); setShowKeyMenu(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                      !filterKey ? 'text-emerald-300 bg-emerald-500/15' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span>All Keys</span>
                    {!filterKey && (
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="mx-3 border-t border-zinc-800" />
                  {KEY_SIGNATURES.map((ks) => {
                    const isActive = filterKey?.display === ks.display;
                    return (
                      <button
                        key={ks.display}
                        onClick={() => { setFilterKey(ks); setShowKeyMenu(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                          isActive ? 'text-emerald-300 bg-emerald-500/15' : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold min-w-[32px]">{ks.display}</span>
                          <span className="text-[10px] font-normal text-zinc-500">
                            {ks.count === 0 ? 'no ♯/♭' : `${ks.count}${ks.type === 'sharp' ? '♯' : '♭'}`}
                          </span>
                        </div>
                        {isActive && (
                          <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active filter summary badges */}
          {(filterBarreRoots.length > 0 || filterCategories.length > 0 || filterTypes.length > 0 || filterPositions.length > 0 || filterKey || showFavoritesOnly) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {filterCategories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-semibold text-zinc-300">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  <button onClick={() => toggleCategoryFilter(cat)} className="hover:text-white transition-colors"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              {filterTypes.map(type => (
                <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-semibold text-amber-300">
                  {CHORD_TYPE_LABELS[type]}
                  <button onClick={() => storeToggleType(type)} className="hover:text-white transition-colors"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              {filterBarreRoots.map(r => (
                <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-semibold text-indigo-300">
                  Root {r}th
                  <button onClick={() => storeToggleBarreRoot(r)} className="hover:text-white transition-colors"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              {filterPositions.map(pos => (
                <span key={pos} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/20 border border-sky-500/30 rounded-full text-[10px] font-semibold text-sky-300">
                  {{ open: 'Open', low: 'Low (1–4)', mid: 'Mid (5–8)', high: 'High (9–12)' }[pos]}
                  <button onClick={() => storeTogglePosition(pos)} className="hover:text-white transition-colors"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              {filterKey && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] font-semibold text-emerald-300">
                  {filterKey.display} Major
                  <button onClick={() => setFilterKey(null)} className="hover:text-white transition-colors"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {showFavoritesOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 rounded-full text-[10px] font-semibold text-rose-300">
                  Favorites
                  <button onClick={() => setShowFavoritesOnly(false)} className="hover:text-white transition-colors"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count & Legend */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-amber-500 font-bold">{filteredChords.length}</span>
            <span className="text-zinc-500"> chords</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-zinc-500">Finger Position</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rotate-45 bg-cyan-500" />
              <span className="text-zinc-500">Root Note</span>
            </div>
          </div>
        </div>

        {/* Chord List */}
        <div className="space-y-3">
          {filteredChords.map((chord, index) => (
            <ChordCard
              key={chord.id}
              chord={chord as ChordData & { isCustom?: boolean }}
              isSelected={selectedChords.has(chord.id)}
              isFavorited={favoriteIds.has(chord.id)}
              onToggleSelect={() => toggleChordSelection(chord.id)}
              onToggleFavorite={() => toggleFavorite(chord.id)}
              onClick={() => handleChordClick(chord as ChordData & { isCustom?: boolean }, index)}
            />
          ))}
        </div>

        {filteredChords.length === 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full mb-4">
                {showFavoritesOnly
                  ? <Heart className="w-10 h-10 text-rose-500" />
                  : <Library className="w-10 h-10 text-blue-500" />}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {showFavoritesOnly ? 'No Favorites Yet' : 'No Chords Found'}
              </h3>
              <p className="text-zinc-400 max-w-md mx-auto mb-6">
                {showFavoritesOnly
                  ? 'Tap the heart icon on any chord card to add it to your favorites.'
                  : 'Try adjusting your search or filters to find chords.'}
              </p>
            </div>
            {!showFavoritesOnly && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-left">
                  <div className="flex items-start gap-3">
                    <Search className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-white mb-1">Search by Name</div>
                      <div className="text-xs text-zinc-400">Type chord names like "Am", "G7", or "Cmaj7" to find specific chords quickly</div>
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-left">
                  <div className="flex items-start gap-3">
                    <MousePointer className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-white mb-1">Filter by Type</div>
                      <div className="text-xs text-zinc-400">Use Open, Barre, or Movable filters to narrow down chord variations</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chord Detail Modal */}
      {detailModalChord && (
        <ChordDetailModal
          chord={detailModalChord}
          isOpen={!!detailModalChord}
          onClose={() => setDetailModalChord(null)}
          onPlay={() => playChord(detailModalChord)}
          onEdit={() => handleEdit(detailModalChord)}
          onNext={handleNextChord}
          onPrevious={handlePreviousChord}
          currentIndex={detailModalIndex}
          totalChords={filteredChords.length}
        />
      )}
    </div>
  );
}
