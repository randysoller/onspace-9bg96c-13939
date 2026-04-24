
import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChordSymbol } from '@/components/features/ChordSymbol';
import { useNavigate } from 'react-router-dom';
import {
  Guitar, Search, Sliders, Bookmark, Music, BarChart3, Move,
  Volume2, Library, Save, Heart,
  Package, ChevronDown, ChevronRight, Star, Sparkles, Zap,
  CheckCircle2, Pencil, X, MapPin, ChevronLeft,
} from 'lucide-react';
import { isAdmin } from '@/lib/admin';
import { CHORD_DATABASE } from '@/constants/chords-index';
import type { ChordData, ChordType, BarreRoot } from '@/types/chord';
import { CHORD_TYPE_LABELS } from '@/types/chord';
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

// ─── Module-level constants (allocated once, never reallocated) ────────────────

const REVERSED_STRINGS = ['e', 'B', 'G', 'D', 'A', 'E'];

// Moved out of component — was recreated on every render
const TYPE_FILTER_ORDER: ChordType[] = [
  'major', 'minor', 'augmented', 'slash', 'diminished', 'sus2', 'sus4', '7sus4',
  'major6', 'minor6', 'maj6add9',
  'major7', 'maj7sharp11', 'dominant7', 'minor7', 'aug7', 'halfDim7', 'dim7',
  'dom7b5', 'dom7sharp9', 'dom7b9', 'dom7sharp5sharp9', 'aug7b9', 'minmaj7',
  'add9',
  'major9', '9th', 'minor9',
  'major11', '11th', 'minor11',
  'major13', '13th', 'minor13',
];

// Moved out of component — was recreated on every render
const ROOT_STRING_OPTIONS: { value: BarreRoot; label: string }[] = [
  { value: 6, label: '6th String' },
  { value: 5, label: '5th String' },
  { value: 4, label: '4th String' },
];

// CHORD_PACKS: static data moved out. Icons are now component references
// rendered at call site, so no JSX elements are recreated each render.
interface ChordPackDef {
  id: string;
  title: string;
  description: string;
  IconComponent: React.ElementType;
  accentColor: string;
  badgeColor: string;
  iconBg: string;
  saveBtnColor: string;
  loadBtnColor: string;
}

// Chord interval formulas — allocated once at module level, never reallocated per render
const CHORD_TYPE_FORMULAS: Record<ChordType, string> = {
  major:              '1 3 5',
  minor:              '1 ♭3 5',
  augmented:          '1 3 ♯5',
  slash:              'x / y',
  diminished:         '1 ♭3 ♭5',
  sus2:               '1 2 5',
  sus4:               '1 4 5',
  '7sus4':            '1 4 5 ♭7',
  major6:             '1 3 5 6',
  minor6:             '1 ♭3 5 6',
  maj6add9:           '1 3 5 6 9',
  major7:             '1 3 5 7',
  maj7sharp11:        '1 3 5 7 ♯11',
  dominant7:          '1 3 5 ♭7',
  minor7:             '1 ♭3 5 ♭7',
  aug7:               '1 3 ♯5 ♭7',
  halfDim7:           '1 ♭3 ♭5 ♭7',
  dim7:               '1 ♭3 ♭5 ♭♭7',
  dom7b5:             '1 3 ♭5 ♭7',
  dom7sharp9:         '1 3 5 ♭7 ♯9',
  dom7b9:             '1 3 5 ♭7 ♭9',
  dom7sharp5sharp9:   '1 3 ♯5 ♭7 ♯9',
  aug7b9:             '1 3 ♯5 ♭7 ♭9',
  minmaj7:            '1 ♭3 5 7',
  add9:               '1 3 5 9',
  major9:             '1 3 5 7 9',
  '9th':              '1 3 5 ♭7 9',
  minor9:             '1 ♭3 5 ♭7 9',
  major11:            '1 3 5 7 9 11',
  '11th':             '1 3 5 ♭7 9 11',
  minor11:            '1 ♭3 5 ♭7 9 11',
  major13:            '1 3 5 7 9 11 13',
  '13th':             '1 3 5 ♭7 9 11 13',
  minor13:            '1 ♭3 5 ♭7 9 11 13',
};

const CHORD_PACKS: ChordPackDef[] = [
  {
    id: 'first-song-starter',
    title: 'First Song Starter Pack',
    description: 'The essential open chords every beginner needs to play their first real song.',
    IconComponent: Star,
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
    IconComponent: Sparkles,
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
    IconComponent: Zap,
    accentColor: 'from-purple-500 to-indigo-500',
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    iconBg: 'bg-purple-500/15 text-purple-400',
    saveBtnColor: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30',
    loadBtnColor: 'bg-purple-500 hover:bg-purple-600 text-white',
  },
];

// ─── ChordCard ─────────────────────────────────────────────────────────────────

interface ChordCardProps {
  chord: ChordData & { isCustom?: boolean };
  isSelected: boolean;
  isFavorited: boolean;
  onToggleSelect: () => void;
  onToggleFavorite: () => void;
  onClick: () => void;
}

// memo() prevents re-renders when parent re-renders but this card's props are unchanged.
// Combined with useCallback handlers in the parent, most cards skip re-renders on filter changes.
const ChordCard = memo(function ChordCard({ chord, isSelected, isFavorited, onToggleSelect, onToggleFavorite, onClick }: ChordCardProps) {
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
            <ChordSymbol symbol={chord.symbol} />
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

        {/* Chord Diagram */}
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
});

// ─── ChordLibrary Page ─────────────────────────────────────────────────────────

export default function ChordLibrary() {
  const navigate = useNavigate();

  // Set browser tab title to match visual rename; restore on unmount
  useEffect(() => {
    document.title = 'Chord Vault | Guitar Growth';
    return () => { document.title = 'Guitar Growth'; };
  }, []);

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
    activeLibraryPresetId,
    setActiveLibraryPreset,
    savedScrollY,
    setSavedScrollY,
  } = useChordLibraryStore();

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
  const filterChangedRef = useRef(false);

  const getScrollEl = useCallback(() => document.getElementById('main-content'), []);

  useEffect(() => {
    const el = getScrollEl();
    if (!el) return;
    const handleScroll = () => { lastScrollY.current = el.scrollTop; };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      setSavedScrollY(lastScrollY.current);
    };
  }, [getScrollEl, setSavedScrollY]);

  useEffect(() => {
    if (!savedScrollY || restoredRef.current || filterChangedRef.current) return;
    restoredRef.current = true;
    const el = getScrollEl();
    if (!el) return;
    el.scrollTop = savedScrollY;
  }, [savedScrollY, getScrollEl]);

  // ── Scroll to top when any filter changes ───────────────────────────────────
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    filterChangedRef.current = true;
    restoredRef.current = true;
    const el = getScrollEl();
    if (el) el.scrollTop = 0;
  }, [filterCategories, filterTypes, filterBarreRoots, filterPositions, showFavoritesOnly, getScrollEl]);

  const { presets: userPresets, addPreset } = usePresetStore();

  // ── Custom chord store ───────────────────────────────────────────────────────
  const { editStandardChord, editChord, customChords, hiddenStandardChords, syncFromSupabase, syncStatus, lastSyncedAt } = useCustomChordStore();
  const user = useAuthStore(s => s.user);

  const handleManualSync = useCallback(async () => {
    if (!user?.id) { toast.error('Sign in to sync your chords'); return; }
    await syncFromSupabase(user.id);
    if (useCustomChordStore.getState().syncStatus === 'synced') {
      toast.success('Library synced from cloud');
    } else {
      toast.error('Sync failed — check your connection');
    }
  }, [user?.id, syncFromSupabase]);

  // Memoized so it doesn't recompute on every render — only when lastSyncedAt changes
  const syncTimeLabel = useMemo(() => {
    if (!lastSyncedAt) return null;
    const diffMs = Date.now() - lastSyncedAt;
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    return diffHr === 1 ? '1 hr ago' : `${diffHr} hr ago`;
  }, [lastSyncedAt]);

  const { favoriteIds, toggleFavorite } = useChordFavoritesStore();
  const { playChord } = useChordAudio();

  // ── Effective chord list ─────────────────────────────────────────────────────
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

  // ── Stable favorite IDs dep ──────────────────────────────────────────────────
  const favoriteIdsDep = useMemo(() => [...favoriteIds].sort().join(','), [favoriteIds]);

  // ── Filtered chord list ──────────────────────────────────────────────────────
  const filteredChords = useMemo(() => {
    return allChords.filter((chord) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!chord.symbol.toLowerCase().includes(q) && !chord.name.toLowerCase().includes(q)) return false;
      }
      if (filterCategories.length > 0 && !filterCategories.includes(chord.category as any)) return false;
      if (filterTypes.length > 0 && !filterTypes.includes(chord.type as ChordType)) return false;
      if (showFavoritesOnly && !favoriteIds.has(chord.id)) return false;
      if (filterBarreRoots.length > 0 && !filterBarreRoots.includes((6 - chord.rootNoteString) as BarreRoot)) return false;
      if (filterPositions.length > 0) {
        const inPos = filterPositions.some(p =>
          (p === 'open' && chord.category === 'open') ||
          (p === 'low' && chord.category !== 'open' && chord.baseFret >= 1 && chord.baseFret <= 4) ||
          (p === 'mid' && chord.baseFret >= 5 && chord.baseFret <= 8) ||
          (p === 'high' && chord.baseFret >= 9 && chord.baseFret <= 12)
        );
        if (!inPos) return false;
      }
      return true;
    });
  }, [allChords, searchQuery, filterCategories, filterTypes, filterBarreRoots, filterPositions,
      showFavoritesOnly, favoriteIdsDep]);

  // ── Stable card callbacks (useCallback prevents new references on every render) ──
  // These are passed to memo'd ChordCard — stable refs mean cards skip re-renders
  // when only unrelated state (modal open, search query, etc.) changes.
  const handleToggleSelect = useCallback((id: string) => {
    storeToggleChordSelection(id);
  }, [storeToggleChordSelection]);

  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id);
  }, [toggleFavorite]);

  const handleChordClick = useCallback((chord: ChordData & { isCustom?: boolean }, index: number) => {
    setDetailModalChord(chord);
    setDetailModalIndex(index);
  }, []);

  // ── Other handlers ───────────────────────────────────────────────────────────

  const toggleCategoryFilter = useCallback((category: string) => {
    storeToggleCategory(category as any);
  }, [storeToggleCategory]);

  const handleNextChord = useCallback(() => {
    setDetailModalIndex(prev => {
      if (prev >= filteredChords.length - 1) return prev;
      const next = prev + 1;
      setDetailModalChord(filteredChords[next] as ChordData & { isCustom?: boolean });
      return next;
    });
  }, [filteredChords]);

  const handlePreviousChord = useCallback(() => {
    setDetailModalIndex(prev => {
      if (prev <= 0) return prev;
      const p = prev - 1;
      setDetailModalChord(filteredChords[p] as ChordData & { isCustom?: boolean });
      return p;
    });
  }, [filteredChords]);

  const handleEdit = useCallback((chord: ChordData & { isCustom?: boolean }) => {
    if (chord.isCustom) {
      editChord(chord.id);
    } else {
      editStandardChord(chord);
    }
    navigate('/editor');
  }, [editChord, editStandardChord, navigate]);

  const handleEditPackSlot = useCallback((packId: string) => {
    setPackAssignments(prev => {
      const assigned = prev[packId];
      if (assigned && assigned.length > 0) setSelectedChordIds(assigned);
      return prev;
    });
    setEditingPackId(packId);
    setShowPresetMenu(false);
    const packTitle = CHORD_PACKS.find((p) => p.id === packId)?.title ?? packId;
    toast.success(`Editing "${packTitle}" — adjust chords then open the dropdown to re-save`);
  }, [setSelectedChordIds]);

  const handleSaveToPackSlot = useCallback((packId: string) => {
    if (selectedChords.size === 0) {
      toast.error('Select at least one chord first');
      return;
    }
    const updated = { ...packAssignments, [packId]: Array.from(selectedChords) };
    setPackAssignments(updated);
    localStorage.setItem('fretmaster_pack_assignments', JSON.stringify(updated));
    const packTitle = CHORD_PACKS.find((p) => p.id === packId)?.title ?? packId;
    setEditingPackId(prev => prev === packId ? null : prev);
    setSelectedChordIds([]);
    toast.success(`${selectedChords.size} chords saved to "${packTitle}"`);
  }, [selectedChords, packAssignments, setSelectedChordIds]);

  const handleLoadPackSlot = useCallback((packId: string) => {
    const chords = packAssignments[packId];
    if (!chords || chords.length === 0) return;
    setSelectedChordIds(chords);
    setSelectedPreset(packId);
    setActiveLibraryPreset(packId);
    setShowPresetMenu(false);
    toast.success(`Loaded ${chords.length} chords from pack`);
  }, [packAssignments, setSelectedChordIds, setActiveLibraryPreset]);

  const handleClearPackSlot = useCallback((packId: string) => {
    setPackAssignments(prev => {
      const updated = { ...prev };
      delete updated[packId];
      localStorage.setItem('fretmaster_pack_assignments', JSON.stringify(updated));
      return updated;
    });
    setSelectedPreset(prev => { if (prev === packId) { setActiveLibraryPreset(null); return null; } return prev; });
    setEditingPackId(prev => prev === packId ? null : prev);
    toast.success('Pack cleared');
  }, [setActiveLibraryPreset]);

  const handleCreatePreset = useCallback(() => {
    if (!newPresetName.trim()) { toast.error('Please enter a preset name'); return; }
    if (selectedChords.size === 0) { toast.error('Please select at least one chord'); return; }
    addPreset(newPresetName, Array.from(selectedChords));
    toast.success(`Preset "${newPresetName}" created with ${selectedChords.size} chords`);
    setNewPresetName('');
    setShowPresetMenu(false);
    setSelectedChordIds([]);
  }, [newPresetName, selectedChords, addPreset, setSelectedChordIds]);

  const handleLoadPreset = useCallback((presetName: string) => {
    const preset = userPresets.find((p) => p.name === presetName);
    if (preset) {
      setSelectedChordIds(preset.chordIds);
      setSelectedPreset(presetName);
      setActiveLibraryPreset(preset.id);
      setShowPresetMenu(false);
      toast.success(`Loaded preset "${presetName}" with ${preset.chordIds.length} chords`);
    }
  }, [userPresets, setSelectedChordIds, setActiveLibraryPreset]);

  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    storeClearCategories();
    setFilterTypes([]);
    storeClearBarreRoots();
    storeClearPositions();
    setShowFavoritesOnly(false);
  }, [setSearchQuery, storeClearCategories, setFilterTypes, storeClearBarreRoots, storeClearPositions]);

  const favoriteCount = favoriteIds.size;

  const [showRootMenu, setShowRootMenu] = useState(false);
  const rootMenuRef = useRef<HTMLDivElement>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const [showPositionMenu, setShowPositionMenu] = useState(false);
  const positionMenuRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* ── Chord Vault header (Scale Vault style) ── */}
        <div className="mb-6">
          <div className="flex items-start gap-3 py-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-shrink-0 w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition-colors mt-0.5"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0 mt-0.5">
                <Guitar className="w-4 h-4 text-white" strokeWidth={2.3} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-[21px] font-bold text-white leading-none">Chord Vault</h1>
                <p className="text-[15px] text-zinc-400 mt-0.5 leading-none">Browse all Chord Diagrams</p>
                <p className="text-[17px] text-amber-400 mt-0.5 leading-none">Press Chord Card for Details</p>
              </div>
            </div>
            <span className="flex-shrink-0 text-[14px] font-semibold text-zinc-100 bg-zinc-700/80 px-2 py-0.5 rounded-full mt-1">
              {filteredChords.length} chord{filteredChords.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Sync button — admin only, below title */}
          {user && isAdmin(user.id) && (
            <button
              onClick={handleManualSync}
              disabled={syncStatus === 'syncing'}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black"
              style={{
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

        {/* ── Edit Pack Banner */}
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
        <div className="mb-4 mt-2 relative">
          <button
            onClick={() => setShowPresetMenu(prev => !prev)}
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
                    const { IconComponent } = pack;
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
                          <IconComponent className="w-4 h-4" />
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
                    const { IconComponent } = pack;
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
                          <IconComponent className="w-3 h-3" />
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
        <div className="mb-4 mt-2 flex gap-2">
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

        {/* Filter Pills — two static rows */}
        <div className="mb-4">
          {/* Row 1: All + Category pills */}
          <div className="grid grid-cols-4 gap-1.5 mb-1.5">
            <button
              onClick={handleClearAllFilters}
              className={`w-full py-3.5 rounded-full font-semibold text-[17px] md:text-[15px] whitespace-nowrap flex items-center justify-center gap-1.5 transition-all ${
                filterCategories.length === 0 && filterTypes.length === 0 && filterBarreRoots.length === 0 && filterPositions.length === 0 && !showFavoritesOnly
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Library className="w-4 h-4 md:w-3 md:h-3" />
              All
            </button>
            <button
              onClick={() => toggleCategoryFilter('open')}
              className={`w-full py-3.5 rounded-full font-semibold text-[17px] md:text-[15px] whitespace-nowrap flex items-center justify-center gap-1.5 transition-all ${
                filterCategories.includes('open')
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Music className="w-4 h-4 md:w-3 md:h-3" />
              Open
            </button>
            <button
              onClick={() => toggleCategoryFilter('barre')}
              className={`w-full py-3.5 rounded-full font-semibold text-[17px] md:text-[15px] whitespace-nowrap flex items-center justify-center gap-1.5 transition-all ${
                filterCategories.includes('barre')
                  ? 'bg-purple-500 text-white'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 md:w-3 md:h-3" />
              Barre
            </button>
            <button
              onClick={() => toggleCategoryFilter('movable')}
              className={`w-full py-3.5 rounded-full font-semibold text-[17px] md:text-[15px] whitespace-nowrap flex items-center justify-center gap-1.5 transition-all ${
                filterCategories.includes('movable')
                  ? 'bg-yellow-400 text-zinc-950'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Move className="w-4 h-4 md:w-3 md:h-3" />
              Movable
            </button>
          </div>

          {/* Row 2: Type, Root, Favs, Position */}
          <div className="grid grid-cols-4 gap-1.5">
            {/* Type filter */}
            <div className="relative" ref={typeMenuRef}>
              <button
                onClick={() => setShowTypeMenu((prev) => !prev)}
                className={`w-full py-3.5 rounded-full font-semibold text-[17px] md:text-[15px] whitespace-nowrap flex items-center justify-center gap-1.5 transition-all ${
                  filterTypes.length > 0
                    ? 'bg-amber-500 text-zinc-950 border border-amber-500'
                    : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <Music className="w-4 h-4 md:w-3 md:h-3" />
                {filterTypes.length > 0
                  ? filterTypes.length === 1
                    ? CHORD_TYPE_LABELS[filterTypes[0]]
                    : `${filterTypes.length} Types`
                  : 'Type'}
                <ChevronDown className={`w-4 h-4 md:w-3 md:h-3 transition-transform duration-150 ${showTypeMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
              {showTypeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 z-20 min-w-[300px] overflow-hidden"
                >
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-base font-bold text-zinc-500 uppercase tracking-widest">Chord Type</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {TYPE_FILTER_ORDER.map((type) => {
                      const isActive = filterTypes.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => storeToggleType(type)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-lg font-semibold transition-colors ${
                            isActive ? 'text-amber-300 bg-amber-500/15' : 'text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{CHORD_TYPE_LABELS[type]}</span>
                            {isActive && (
                              <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="font-mono text-[16px] text-zinc-400 shrink-0 ml-4">{CHORD_TYPE_FORMULAS[type]}</span>
                        </button>
                      );
                    })}
                  </div>
                  {filterTypes.length > 0 && (
                    <>
                      <div className="mx-3 border-t border-zinc-800" />
                      <button
                        onClick={() => { setFilterTypes([]); setShowTypeMenu(false); }}
                        className="w-full text-left px-3 py-2 text-base text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        Clear type filter
                      </button>
                    </>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </div>

            {/* Root String filter */}
            <div className="relative" ref={rootMenuRef}>
              <button
                onClick={() => setShowRootMenu((prev) => !prev)}
                className={`w-full py-3.5 rounded-full font-semibold text-[17px] md:text-[15px] whitespace-nowrap flex items-center justify-center gap-1.5 transition-all ${
                  filterBarreRoots.length > 0
                    ? 'bg-indigo-500 text-white border border-indigo-500'
                    : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <Guitar className="w-4 h-4 md:w-3 md:h-3" />
                {filterBarreRoots.length > 0
                  ? filterBarreRoots.map(r => `${r}th String`).join(', ')
                  : 'Root'}
                <ChevronDown className={`w-4 h-4 md:w-3 md:h-3 transition-transform duration-150 ${showRootMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
              {showRootMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 z-20 min-w-[160px] overflow-hidden"
                >
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-base font-bold text-zinc-500 uppercase tracking-widest">Root Note String</p>
                  </div>
                  {ROOT_STRING_OPTIONS.map(({ value, label }) => {
                    const isActive = filterBarreRoots.includes(value);
                    return (
                      <button
                        key={value}
                        onClick={() => storeToggleBarreRoot(value)}
                        className={`w-full flex items-center justify-start text-left px-3 py-2 text-lg font-semibold transition-colors ${
                          isActive ? 'text-indigo-300 bg-indigo-500/15' : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span>{label}</span>
                          {isActive && (
                            <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {filterBarreRoots.length > 0 && (
                    <>
                      <div className="mx-3 border-t border-zinc-800" />
                      <button
                        onClick={() => { storeClearBarreRoots(); setShowRootMenu(false); }}
                        className="w-full text-left px-3 py-2 text-base text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        Clear root filter
                      </button>
                    </>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </div>

            {/* Position filter */}
            <div className="relative" ref={positionMenuRef}>
              <button
                onClick={() => setShowPositionMenu((prev) => !prev)}
                className={`w-full py-3.5 rounded-full font-semibold text-[17px] md:text-[15px] whitespace-nowrap flex items-center justify-center gap-1.5 transition-all ${
                  filterPositions.length > 0
                    ? 'bg-sky-500 text-white border border-sky-500'
                    : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <MapPin className="w-4 h-4 md:w-3 md:h-3" />
                {filterPositions.length > 0
                  ? filterPositions.length === 1
                    ? { open: 'Open', low: 'Low', mid: 'Mid', high: 'High' }[filterPositions[0]]
                    : `${filterPositions.length} Positions`
                  : 'Position'}
                <ChevronDown className={`w-4 h-4 md:w-3 md:h-3 transition-transform duration-150 ${showPositionMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
              {showPositionMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 z-20 w-max overflow-hidden"
                >
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-base font-bold text-zinc-500 uppercase tracking-widest">Neck Position</p>
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
                        className={`w-full flex items-start justify-start text-left px-3 py-2 text-lg font-semibold transition-colors ${
                          isActive ? 'text-sky-300 bg-sky-500/15' : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="w-full">
                          <div className="flex items-center gap-2">
                            <span>{label}</span>
                            {isActive && (
                              <svg className="w-5 h-5 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="text-base font-normal text-zinc-500">{sub}</div>
                        </div>
                      </button>
                    );
                  })}
                  {filterPositions.length > 0 && (
                    <>
                      <div className="mx-3 border-t border-zinc-800" />
                      <button
                        onClick={() => { storeClearPositions(); setShowPositionMenu(false); }}
                        className="w-full text-left px-3 py-2 text-base text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        Clear position filter
                      </button>
                    </>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </div>

            {/* Favorites filter */}
            <button
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
              className={`w-full py-3.5 rounded-full font-semibold text-[17px] md:text-[15px] whitespace-nowrap flex items-center justify-center gap-1.5 transition-all ${
                showFavoritesOnly
                  ? 'bg-rose-500 text-white'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-rose-500/40 hover:text-rose-400'
              }`}
            >
              <Heart className={`w-4 h-4 md:w-3 md:h-3 ${showFavoritesOnly ? 'fill-white' : ''}`} />
              Favs
              {favoriteCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  showFavoritesOnly ? 'bg-white/20' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {favoriteCount}
                </span>
              )}
            </button>
          </div>

          {/* Active filter summary badges */}
          {(filterBarreRoots.length > 0 || filterCategories.length > 0 || filterTypes.length > 0 || filterPositions.length > 0 || showFavoritesOnly) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {filterCategories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm font-semibold text-zinc-300">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  <button onClick={() => toggleCategoryFilter(cat)} className="hover:text-white transition-colors"><X className="w-7 h-7" /></button>
                </span>
              ))}
              {filterTypes.map(type => (
                <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-sm font-semibold text-amber-300">
                  {CHORD_TYPE_LABELS[type]}
                  <button onClick={() => storeToggleType(type)} className="hover:text-white transition-colors"><X className="w-7 h-7" /></button>
                </span>
              ))}
              {filterBarreRoots.map(r => (
                <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-sm font-semibold text-indigo-300">
                  Root {r}th String
                  <button onClick={() => storeToggleBarreRoot(r)} className="hover:text-white transition-colors"><X className="w-7 h-7" /></button>
                </span>
              ))}
              {filterPositions.map(pos => (
                <span key={pos} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/20 border border-sky-500/30 rounded-full text-sm font-semibold text-sky-300">
                  {{ open: 'Open', low: 'Low (1–4)', mid: 'Mid (5–8)', high: 'High (9–12)' }[pos]}
                  <button onClick={() => storeTogglePosition(pos)} className="hover:text-white transition-colors"><X className="w-7 h-7" /></button>
                </span>
              ))}
              {showFavoritesOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 rounded-full text-sm font-semibold text-rose-300">
                  Favorites
                  <button onClick={() => setShowFavoritesOnly(false)} className="hover:text-white transition-colors"><X className="w-7 h-7" /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Active Filter Warning Banner ──────────────────────────────────── */}
        {(filterCategories.length > 0 || filterTypes.length > 0 || filterBarreRoots.length > 0 || filterPositions.length > 0 || showFavoritesOnly || searchQuery.trim() !== '') && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-400">
                Filters are active — some chords are hidden
              </p>
              <p className="text-[10px] text-amber-300/70 leading-snug mt-0.5">
                {[
                  filterCategories.length > 0 && `Category: ${filterCategories.join(', ')}`,
                  filterTypes.length > 0 && `${filterTypes.length} type${filterTypes.length > 1 ? 's' : ''} selected`,
                  filterBarreRoots.length > 0 && `Root: ${filterBarreRoots.map(r => `${r}th String`).join(', ')}`,
                  filterPositions.length > 0 && `Position: ${filterPositions.join(', ')}`,
                  showFavoritesOnly && 'Favorites only',
                  searchQuery.trim() && `Search: "${searchQuery.trim()}"`,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button
              onClick={handleClearAllFilters}
              className="flex-shrink-0 text-xs font-bold text-amber-400 hover:text-white bg-amber-500/20 hover:bg-amber-500/40 px-2.5 py-1 rounded-md transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Results Count & Legend */}
        <div className="mb-4">
          {/* Row 1: chord count right-aligned */}
          <div className="flex justify-end mb-1">
            <div className="text-sm flex items-center gap-2">
              <span className="text-amber-500 font-bold text-base">{filteredChords.length}</span>
              <span className="text-zinc-500"> chord{filteredChords.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          {/* Row 2: legend left-aligned */}
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
              onToggleSelect={() => handleToggleSelect(chord.id)}
              onToggleFavorite={() => handleToggleFavorite(chord.id)}
              onClick={() => handleChordClick(chord as ChordData & { isCustom?: boolean }, index)}
            />
          ))}
        </div>

        {filteredChords.length === 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full">
                <Library className="w-9 h-9 text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Chords Found</h3>
            <p className="text-zinc-500 mb-6">
              Try adjusting your search query or filters.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleClearAllFilters}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => navigate('/editor')}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Pencil className="w-4 h-4" /> Create Custom Chord
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Modal for Chord Detail View */}
        {detailModalChord && (
          <ChordDetailModal
            chord={detailModalChord}
            isOpen={true}
            onClose={() => setDetailModalChord(null)}
            onNext={handleNextChord}
            onPrevious={handlePreviousChord}
            onPlay={() => playChord(detailModalChord)}
            onEdit={() => handleEdit(detailModalChord)}
            currentIndex={detailModalIndex}
            totalChords={filteredChords.length}
          />
        )}
      </div>
    </div>
  );
}
