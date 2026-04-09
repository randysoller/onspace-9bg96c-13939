/**
 * Chord Setup Page — Complete practice configuration UI
 *
 * Features:
 * - Hero section with background image
 * - Sticky filter bar: two-row pill layout (matching ChordLibrary)
 *   Row 1: All / Open / Barre / Movable category pills
 *   Row 2: Type / Root / Position / Favs dropdown pills
 * - Preset dropdown with drag-and-drop reordering
 * - Desktop dropdowns vs mobile bottom sheets
 * - Active filter pills
 * - Practice summary card
 * - Start practice button with gradient and shimmer
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePracticeStore } from '@/stores/practiceStore';
import type { PositionFilter } from '@/stores/practiceStore';
import { usePresetStore } from '@/stores/presetStore';
import { CATEGORY_LABELS, CHORD_TYPE_LABELS, BARRE_ROOT_LABELS } from '@/types/chord';
import type { ChordCategory, ChordType, BarreRoot } from '@/types/chord';
import {
  Play,
  Music,
  AlertCircle,
  ChevronDown,
  X,
  Layers,
  Guitar,
  Grip,
  Music2,
  Check,
  Bookmark,
  Heart,
  MapPin,
} from 'lucide-react';

import PresetDropdown from '@/components/features/PresetDropdown';
import { useChordFavoritesStore } from '@/stores/chordFavoritesStore';
import heroImg from '@/assets/hero-guitar.jpg';

// ============================================================================
// CONSTANTS
// ============================================================================

const ALL_CATEGORIES: ChordCategory[] = ['open', 'barre', 'movable'];
const BARRE_ROOTS: BarreRoot[] = [6, 5, 4];
const ALL_CHORD_TYPES: ChordType[] = [
  'major', 'minor', 'augmented', 'slash', 'diminished',
  'sus2', 'sus4', '7sus4', 'major6', 'minor6', 'maj6add9',
  'major7', 'maj7sharp11', 'dominant7', 'minor7', 'aug7', 'halfDim7', 'dim7',
  'dom7b5', 'dom7sharp9', 'dom7b9', 'dom7sharp5sharp9', 'aug7sharp9', 'aug7b9',
  'add9',
  'major9', '9th', 'minor9',
  'major11', '11th', 'minor11',
  'major13', '13th', 'minor13',
];

interface TypeGroup {
  label: string;
  types: ChordType[];
  subgroups?: { label: string; types: ChordType[] }[];
}

const TYPE_GROUPS: TypeGroup[] = [
  { label: 'Basic', types: ['major', 'minor', 'augmented', 'diminished', 'sus2', 'sus4', '7sus4', 'major6', 'minor6', 'maj6add9', 'slash'] },
  { label: '7th Chords', types: ['major7', 'maj7sharp11', 'dominant7', 'minor7', 'aug7', 'halfDim7', 'dim7', 'dom7b5', 'dom7sharp9', 'dom7b9', 'dom7sharp5sharp9', 'aug7sharp9', 'aug7b9'] },
  {
    label: 'Extended',
    types: ['add9', 'major9', '9th', 'minor9', 'major11', '11th', 'minor11', 'major13', '13th', 'minor13'],
    subgroups: [
      { label: '9th Chords', types: ['add9', 'major9', '9th', 'minor9'] },
      { label: '11th Chords', types: ['major11', '11th', 'minor11'] },
      { label: '13th Chords', types: ['major13', '13th', 'minor13'] },
    ],
  },
];

const CATEGORY_ICONS: Record<ChordCategory, React.ReactNode> = {
  open: <Guitar className="size-3.5" />,
  barre: <Grip className="size-3.5" />,
  movable: <Music2 className="size-3.5" />,
  custom: null,
};

const CATEGORY_DESCRIPTIONS: Record<ChordCategory, string> = {
  open: 'Uses open strings for resonant tones',
  barre: 'Full barre shapes across the neck',
  movable: 'Voicings that shift to any position',
  custom: '',
};

const ROOT_STRING_OPTIONS: { value: BarreRoot; label: string }[] = [
  { value: 6, label: '6th String (Low E)' },
  { value: 5, label: '5th String (A)' },
  { value: 4, label: '4th String (D)' },
];

// ============================================================================
// CHECKBOX ICON COMPONENT
// ============================================================================

function CheckboxIcon({
  checked,
  color = 'primary',
}: {
  checked: boolean;
  color?: 'primary' | 'emerald' | 'purple' | 'yellow';
}) {
  const colorMap = {
    primary: { bg: 'bg-[hsl(var(--color-primary))]', border: 'border-[hsl(var(--color-primary))]' },
    emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-500' },
    yellow: { bg: 'bg-yellow-400', border: 'border-yellow-400' },
  };
  const colors = colorMap[color];
  return (
    <div
      className={`size-5 rounded border flex items-center justify-center shrink-0 ${
        checked ? `${colors.bg} ${colors.border}` : 'border-[hsl(var(--border-default))]'
      }`}
    >
      {checked && <Check className="size-3 text-white" />}
    </div>
  );
}

// ============================================================================
// SHEET CONTENT COMPONENTS (used by both desktop dropdowns and mobile sheets)
// ============================================================================

function CategorySheetContent({
  categories,
  barreRoots,
  onToggleCategory,
  onClearCategories,
  onToggleBarreRoot,
  onClearBarreRoots,
  isMobile,
}: {
  categories: Set<ChordCategory>;
  barreRoots: Set<BarreRoot>;
  onToggleCategory: (cat: ChordCategory) => void;
  onClearCategories: () => void;
  onToggleBarreRoot: (root: BarreRoot) => void;
  onClearBarreRoots: () => void;
  isMobile?: boolean;
}) {
  const py = isMobile ? 'py-3.5' : 'py-2.5';
  const textSize = isMobile ? 'text-base' : 'text-sm';
  const showRootSection = categories.has('barre') || categories.has('movable');
  return (
    <div>
      <button
        onClick={onClearCategories}
        className={`w-full flex items-center gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors`}
      >
        <CheckboxIcon checked={categories.size === 0} color="emerald" />
        <span className={`font-display font-semibold ${textSize} text-[hsl(var(--text-default))]`}>All Shapes</span>
      </button>
      {ALL_CATEGORIES.map((cat) => {
        const catColor = cat === 'open'
          ? { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-400', cbColor: 'emerald' as const }
          : cat === 'barre'
          ? { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'text-purple-400', cbColor: 'purple' as const }
          : cat === 'movable'
          ? { bg: 'bg-yellow-400/10', text: 'text-yellow-300', icon: 'text-yellow-300', cbColor: 'yellow' as const }
          : { bg: 'bg-zinc-800/30', text: 'text-[hsl(var(--text-default))]', icon: 'text-[hsl(var(--text-subtle))]', cbColor: 'primary' as const };
        const isSelected = categories.has(cat);
        return (
          <button
            key={cat}
            onClick={() => onToggleCategory(cat)}
            className={`w-full flex items-start gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors ${isSelected ? catColor.bg : ''}`}
          >
            <CheckboxIcon checked={isSelected} color={catColor.cbColor} />
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={catColor.icon}>{CATEGORY_ICONS[cat]}</span>
              <span className={`font-body font-medium ${textSize} ${catColor.text}`}>
                {CATEGORY_LABELS[cat].replace(' Chords', '')}
              </span>
            </div>
            <p className="text-xs text-[hsl(var(--text-muted))] leading-snug">
              {CATEGORY_DESCRIPTIONS[cat]}
            </p>
          </button>
        );
      })}
      {showRootSection && (
        <div className="mt-4 px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-body font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">ROOT STRING</span>
            {barreRoots.size > 0 && (
              <button onClick={onClearBarreRoots} className="text-xs font-body text-[hsl(var(--text-subtle))] hover:text-[hsl(var(--text-default))] underline underline-offset-2">
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {BARRE_ROOTS.map((root) => (
              <button
                key={root}
                onClick={() => onToggleBarreRoot(root)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-body font-medium transition-colors border ${
                  barreRoots.has(root)
                    ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                    : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] border-transparent'
                }`}
              >
                {BARRE_ROOT_LABELS[root].replace('Root ', '')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TypeSheetContent({
  chordTypes,
  onToggleType,
  onToggleAll,
  onToggleGroup,
  isMobile,
}: {
  chordTypes: Set<ChordType>;
  onToggleType: (type: ChordType) => void;
  onToggleAll: () => void;
  onToggleGroup: (types: ChordType[]) => void;
  isMobile?: boolean;
}) {
  const py = isMobile ? 'py-3.5' : 'py-2.5';
  const textSize = isMobile ? 'text-base' : 'text-sm';
  return (
    <div>
      <button
        onClick={onToggleAll}
        className={`w-full flex items-center gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors`}
      >
        <CheckboxIcon checked={chordTypes.size === ALL_CHORD_TYPES.length} color="emerald" />
        <span className={`font-display font-semibold ${textSize} text-[hsl(var(--text-default))]`}>All Types</span>
      </button>
      {TYPE_GROUPS.map((group) => {
        const allSelected = group.types.every((t) => chordTypes.has(t));
        const someSelected = group.types.some((t) => chordTypes.has(t));
        return (
          <div key={group.label}>
            <button
              onClick={() => onToggleGroup(group.types)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[hsl(var(--bg-overlay))] transition-colors mt-2"
            >
              <div className={`size-5 rounded border flex items-center justify-center shrink-0 ${
                allSelected ? 'bg-emerald-500 border-emerald-500'
                : someSelected ? 'border-emerald-500 bg-emerald-500/30'
                : 'border-[hsl(var(--border-default))]'
              }`}>
                {allSelected ? <Check className="size-3 text-white" />
                  : someSelected ? <div className="size-2 bg-emerald-500 rounded-sm" />
                  : null}
              </div>
              <span className="font-display text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-widest">
                {group.label}
              </span>
            </button>
            {!group.subgroups && group.types.map((type) => (
              <button
                key={type}
                onClick={() => onToggleType(type)}
                className={`w-full flex items-center gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors ${chordTypes.has(type) ? 'bg-emerald-500/8' : ''}`}
              >
                <CheckboxIcon checked={chordTypes.has(type)} color="emerald" />
                <span className={`font-body font-medium ${textSize} text-[hsl(var(--text-default))]`}>{CHORD_TYPE_LABELS[type]}</span>
              </button>
            ))}
            {group.subgroups && group.subgroups.map((sub) => {
              const subAll = sub.types.every((t) => chordTypes.has(t));
              const subSome = sub.types.some((t) => chordTypes.has(t));
              return (
                <div key={sub.label}>
                  <button
                    onClick={() => onToggleGroup(sub.types)}
                    className="w-full flex items-center gap-3 pl-8 pr-4 py-1.5 hover:bg-[hsl(var(--bg-overlay))] transition-colors mt-1"
                  >
                    <div className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                      subAll ? 'bg-emerald-500/70 border-emerald-500/70'
                      : subSome ? 'border-emerald-500/60 bg-emerald-500/20'
                      : 'border-[hsl(var(--border-subtle))]'
                    }`}>
                      {subAll ? <Check className="size-2.5 text-white" />
                        : subSome ? <div className="size-1.5 bg-emerald-500/80 rounded-sm" />
                        : null}
                    </div>
                    <span className="font-display text-[10px] font-semibold text-[hsl(var(--text-muted)/0.7)] uppercase tracking-widest">
                      {sub.label}
                    </span>
                  </button>
                  {sub.types.map((type) => (
                    <button
                      key={type}
                      onClick={() => onToggleType(type)}
                      className={`w-full flex items-center gap-3 pl-10 pr-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors ${chordTypes.has(type) ? 'bg-emerald-500/8' : ''}`}
                    >
                      <CheckboxIcon checked={chordTypes.has(type)} color="emerald" />
                      <span className={`font-body font-medium ${textSize} text-[hsl(var(--text-default))]`}>{CHORD_TYPE_LABELS[type]}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChordSetup() {
  const navigate = useNavigate();

  const {
    categories, chordTypes, barreRoots, filterPositions,
    activePresetId, showFavoritesOnly,
    toggleCategory, clearCategories,
    toggleChordType, clearChordTypes,
    toggleBarreRoot, clearBarreRoots,
    togglePosition, clearPositions,
    setActivePreset, setShowFavoritesOnly,
    startPractice, getAvailableCount,
  } = usePracticeStore();

  const { favoriteIds } = useChordFavoritesStore();
  const favoriteCount = favoriteIds.size;

  const presetStore = usePresetStore();
  const presets = presetStore.presets;

  type SheetId = 'type' | 'root' | 'position' | null;
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);

  // Refs for desktop dropdowns
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const rootDropdownRef = useRef<HTMLDivElement>(null);
  const positionDropdownRef = useRef<HTMLDivElement>(null);

  // ── Available chord count ─────────────────────────────────────────────────
  const availableCount = useMemo(
    () => getAvailableCount(),
    [showFavoritesOnly, favoriteIds.size, categories.size, chordTypes.size,
     barreRoots.size, filterPositions.size,
     activePresetId, presets.length, getAvailableCount]
  );

  const activePreset = presets.find((p) => p.id === activePresetId);
  const isPresetMode = !!activePreset;

  const toggleSheet = (id: SheetId) => setActiveSheet(activeSheet === id ? null : id);

  const handleStart = () => {
    if (availableCount === 0) return;
    startPractice();
    navigate('/practice');
  };

  const handleActivatePreset = (id: string) => {
    setActivePreset(activePresetId === id ? null : id);
  };

  const handleDeletePreset = (id: string) => {
    presetStore.removePreset(id);
    if (activePresetId === id) setActivePreset(null);
  };

  const handleToggleAllTypes = () => {
    if (chordTypes.size === ALL_CHORD_TYPES.length) {
      clearChordTypes();
    } else {
      for (const t of ALL_CHORD_TYPES) {
        if (!chordTypes.has(t)) toggleChordType(t);
      }
    }
  };

  const handleToggleGroup = (types: ChordType[]) => {
    const allSelected = types.every((t) => chordTypes.has(t));
    for (const t of types) {
      if (allSelected ? chordTypes.has(t) : !chordTypes.has(t)) toggleChordType(t);
    }
  };

  const clearAll = () => {
    clearCategories(); clearChordTypes(); clearBarreRoots(); clearPositions();
    setActivePreset(null); setShowFavoritesOnly(false);
  };

  // Outside-click closes desktop dropdowns
  useEffect(() => {
    if (!activeSheet || typeof window === 'undefined') return;
    if (window.innerWidth < 640) return;
    const refs: Record<string, React.RefObject<HTMLDivElement>> = {
      type: typeDropdownRef, root: rootDropdownRef, position: positionDropdownRef,
    };
    const handleClickOutside = (e: MouseEvent) => {
      const ref = refs[activeSheet];
      if (ref?.current && !ref.current.contains(e.target as Node)) setActiveSheet(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSheet]);

  // Body scroll lock on mobile sheets
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!activeSheet || window.innerWidth >= 640) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [activeSheet]);

  // ── Pill shared classes ──────────────────────────────────────────────────────
  const basePill = 'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all active:scale-95';
  const inactivePill = 'border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))]';

  return (
    <div className="stage-gradient min-h-[calc(100vh-58px)]">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Guitar fretboard" className="size-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--bg-base)/0.3)] via-[hsl(var(--bg-base)/0.7)] to-[hsl(var(--bg-base))]" />
        </div>
        <div className="relative px-4 sm:px-6 py-10 sm:py-16 md:py-24 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/8 px-4 py-1.5 mb-6">
            <Music className="size-3.5 text-emerald-500" />
            <span className="text-xs font-body font-medium text-emerald-500">Guitar Chord Trainer</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-extrabold leading-tight text-balance">
            <span className="text-[hsl(var(--text-default))]">Master Every Chord.</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">One Fret at a Time.</span>
          </h1>
          <p className="mt-3 sm:mt-5 font-body text-sm sm:text-base md:text-lg text-[hsl(var(--text-subtle))] max-w-xl mx-auto text-pretty">
            Challenge yourself with timed chord reveals. Pick a category, set your timer, and test how well you know your fretboard.
          </p>
        </div>
      </div>

      {/* ── Setup Section ── */}
      <div className="px-3 sm:px-6 pb-12 sm:pb-16 mt-2 sm:-mt-4">
        <div className="max-w-5xl mx-auto">

          {/* ── Sticky Filter Bar ── */}
          <div className="sticky top-[3.5rem] z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 pt-3 pb-2 bg-[hsl(var(--bg-base)/0.92)] backdrop-blur-md border-b border-[hsl(var(--border-subtle)/0.5)] mb-4 sm:mb-6 space-y-2 transition-opacity duration-200">
            <PresetDropdown
              presets={presets}
              activePresetId={activePresetId}
              onActivate={handleActivatePreset}
              onDeactivate={() => setActivePreset(null)}
              onDelete={handleDeletePreset}
              onReorder={presetStore.reorderPreset}
            />

            {activePreset && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
                <Bookmark className="size-3.5 text-emerald-500 fill-current shrink-0" />
                <span className="text-sm font-body font-medium text-emerald-500 truncate">
                  Using preset: <span className="font-display font-bold">{activePreset.name}</span>
                </span>
                <button onClick={() => setActivePreset(null)} className="ml-auto shrink-0 text-xs font-body text-emerald-500 hover:underline">
                  Use filters
                </button>
              </div>
            )}

            {/* Filter Pills — two static rows */}
            <div className={isPresetMode ? 'opacity-40 pointer-events-none' : ''}>

              {/* Row 1: All + Category pills */}
              <div className="flex gap-1.5 flex-wrap mb-1.5">
                <button
                  onClick={clearAll}
                  className={`${basePill} ${
                    categories.size === 0 && chordTypes.size === 0 && barreRoots.size === 0 && filterPositions.size === 0 && !showFavoritesOnly
                      ? 'bg-[hsl(var(--color-primary))] text-white border-[hsl(var(--color-primary))]'
                      : inactivePill
                  }`}
                >
                  All
                </button>

                <button
                  onClick={() => toggleCategory('open')}
                  className={`${basePill} ${
                    categories.has('open') ? 'bg-emerald-500 text-white border-emerald-500' : inactivePill
                  }`}
                >
                  <Guitar className="size-3" />
                  Open
                </button>

                <button
                  onClick={() => toggleCategory('barre')}
                  className={`${basePill} ${
                    categories.has('barre') ? 'bg-purple-500 text-white border-purple-500' : inactivePill
                  }`}
                >
                  <Grip className="size-3" />
                  Barre
                </button>

                <button
                  onClick={() => toggleCategory('movable')}
                  className={`${basePill} ${
                    categories.has('movable') ? 'bg-yellow-400 text-zinc-950 border-yellow-400' : inactivePill
                  }`}
                >
                  <Music2 className="size-3" />
                  Movable
                </button>
              </div>

              {/* Row 2: Type, Root, Position, Favs */}
              <div className="flex gap-1.5 flex-wrap">

                {/* Type Chip */}
                <div className="relative" ref={typeDropdownRef}>
                  <button
                    onClick={() => toggleSheet('type')}
                    className={`${basePill} ${
                      chordTypes.size > 0
                        ? 'bg-[hsl(var(--color-primary)/0.2)] text-[hsl(var(--color-primary))] border-[hsl(var(--color-primary)/0.5)]'
                        : inactivePill
                    }`}
                  >
                    <Layers className="size-3" />
                    {chordTypes.size > 0
                      ? chordTypes.size === 1 ? CHORD_TYPE_LABELS[[...chordTypes][0]] : `${chordTypes.size} Types`
                      : 'Type'}
                    <ChevronDown className={`size-3 transition-transform duration-200 ${activeSheet === 'type' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {activeSheet === 'type' && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="hidden sm:block absolute left-0 top-full mt-2 w-72 rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                      >
                        <TypeSheetContent chordTypes={chordTypes} onToggleType={toggleChordType} onToggleAll={handleToggleAllTypes} onToggleGroup={handleToggleGroup} isMobile={false} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Root String Chip */}
                <div className="relative" ref={rootDropdownRef}>
                  <button
                    onClick={() => toggleSheet('root')}
                    className={`${basePill} ${
                      barreRoots.size > 0
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
                        : inactivePill
                    }`}
                  >
                    <Guitar className="size-3" />
                    {barreRoots.size > 0 ? [...barreRoots].map(r => `${r}th`).join(', ') : 'Root'}
                    <ChevronDown className={`size-3 transition-transform duration-200 ${activeSheet === 'root' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {activeSheet === 'root' && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="hidden sm:block absolute left-0 top-full mt-2 w-52 rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] shadow-2xl shadow-black/50 overflow-hidden z-50"
                      >
                        <div className="px-3 pt-2.5 pb-1">
                          <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Root Note String</p>
                        </div>
                        {ROOT_STRING_OPTIONS.map(({ value, label }) => {
                          const isActive = barreRoots.has(value);
                          return (
                            <button
                              key={value}
                              onClick={() => toggleBarreRoot(value)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                                isActive ? 'text-indigo-400 bg-indigo-500/15' : 'text-[hsl(var(--text-default))] hover:bg-[hsl(var(--bg-overlay))]'
                              }`}
                            >
                              <span>{label}</span>
                              {isActive && (
                                <svg className="size-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                        {barreRoots.size > 0 && (
                          <>
                            <div className="mx-3 border-t border-[hsl(var(--border-subtle))]" />
                            <button
                              onClick={() => { clearBarreRoots(); setActiveSheet(null); }}
                              className="w-full text-left px-3 py-2 text-[10px] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-subtle))] transition-colors"
                            >
                              Clear root filter
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Position Chip */}
                <div className="relative" ref={positionDropdownRef}>
                  <button
                    onClick={() => toggleSheet('position')}
                    className={`${basePill} ${
                      filterPositions.size > 0
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/50'
                        : inactivePill
                    }`}
                  >
                    <MapPin className="size-3" />
                    {filterPositions.size > 0
                      ? filterPositions.size === 1
                        ? { open: 'Open', low: 'Low', mid: 'Mid', high: 'High' }[[...filterPositions][0]]
                        : `${filterPositions.size} Positions`
                      : 'Position'}
                    <ChevronDown className={`size-3 transition-transform duration-200 ${activeSheet === 'position' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {activeSheet === 'position' && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="hidden sm:block absolute left-0 top-full mt-2 w-56 rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] shadow-2xl shadow-black/50 overflow-hidden z-50"
                      >
                        <div className="px-3 pt-2.5 pb-1">
                          <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Neck Position</p>
                        </div>
                        {([
                          { value: 'open' as PositionFilter, label: 'Open', sub: 'Open string chords' },
                          { value: 'low' as PositionFilter, label: 'Low', sub: 'Frets 1–4' },
                          { value: 'mid' as PositionFilter, label: 'Mid', sub: 'Frets 5–8' },
                          { value: 'high' as PositionFilter, label: 'High', sub: 'Frets 9–12' },
                        ]).map(({ value, label, sub }) => {
                          const isActive = filterPositions.has(value);
                          return (
                            <button
                              key={value}
                              onClick={() => togglePosition(value)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold transition-colors ${
                                isActive ? 'text-sky-400 bg-sky-500/15' : 'text-[hsl(var(--text-default))] hover:bg-[hsl(var(--bg-overlay))]'
                              }`}
                            >
                              <div>
                                <div>{label}</div>
                                <div className="text-[10px] font-normal text-[hsl(var(--text-muted))]">{sub}</div>
                              </div>
                              {isActive && (
                                <svg className="size-3.5 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                        {filterPositions.size > 0 && (
                          <>
                            <div className="mx-3 border-t border-[hsl(var(--border-subtle))]" />
                            <button
                              onClick={() => { clearPositions(); setActiveSheet(null); }}
                              className="w-full text-left px-3 py-2 text-[10px] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-subtle))] transition-colors"
                            >
                              Clear position filter
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Favorites Chip */}
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`${basePill} ${
                    showFavoritesOnly
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                      : `${inactivePill} hover:text-rose-400 hover:border-rose-500/30`
                  }`}
                >
                  <Heart className={`size-3 ${showFavoritesOnly ? 'fill-rose-400' : ''}`} />
                  Favs
                  {favoriteCount > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      showFavoritesOnly ? 'bg-rose-500/30' : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-muted))]'
                    }`}>
                      {favoriteCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Active Filter Badge Row + Chord Count ── */}
          <div className="mb-4 sm:mb-6">

            {/* Active filter badges */}
            {!isPresetMode && (categories.size > 0 || chordTypes.size > 0 || barreRoots.size > 0 || filterPositions.size > 0 || showFavoritesOnly) && (
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {showFavoritesOnly && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 rounded-full text-[10px] font-body font-semibold text-rose-300">
                    <Heart className="size-2.5 fill-current" />
                    Favorites
                    <button onClick={() => setShowFavoritesOnly(false)} className="hover:text-white transition-colors"><X className="size-2.5" /></button>
                  </span>
                )}
                {[...categories].map((cat) => (
                  <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-body font-semibold text-zinc-300">
                    {CATEGORY_LABELS[cat].replace(' Chords', '')}
                    <button onClick={() => toggleCategory(cat)} className="hover:text-white transition-colors"><X className="size-2.5" /></button>
                  </span>
                ))}
                {chordTypes.size > 0 && chordTypes.size <= 3 ? (
                  [...chordTypes].map((type) => (
                    <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-body font-semibold text-amber-300">
                      {CHORD_TYPE_LABELS[type]}
                      <button onClick={() => toggleChordType(type)} className="hover:text-white transition-colors"><X className="size-2.5" /></button>
                    </span>
                  ))
                ) : chordTypes.size > 3 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-body font-semibold text-amber-300">
                    {chordTypes.size} types
                    <button onClick={clearChordTypes} className="hover:text-white transition-colors"><X className="size-2.5" /></button>
                  </span>
                ) : null}
                {[...barreRoots].map((root) => (
                  <span key={root} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-body font-semibold text-indigo-300">
                    Root {root}th
                    <button onClick={() => toggleBarreRoot(root)} className="hover:text-white transition-colors"><X className="size-2.5" /></button>
                  </span>
                ))}
                {[...filterPositions].map((pos) => (
                  <span key={pos} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/20 border border-sky-500/30 rounded-full text-[10px] font-body font-semibold text-sky-300">
                    {{ open: 'Open', low: 'Low (1–4)', mid: 'Mid (5–8)', high: 'High (9–12)' }[pos]}
                    <button onClick={() => togglePosition(pos)} className="hover:text-white transition-colors"><X className="size-2.5" /></button>
                  </span>
                ))}
                <button onClick={clearAll} className="text-[10px] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--semantic-error))] underline underline-offset-2 transition-colors">
                  Clear all
                </button>
              </div>
            )}

            {/* Active preset badge */}
            {activePreset && (
              <div className="flex items-center gap-1.5 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] font-body font-semibold text-emerald-300">
                  <Bookmark className="size-2.5 fill-current" />
                  {activePreset.name}
                  <button onClick={() => setActivePreset(null)} className="hover:text-white transition-colors"><X className="size-2.5" /></button>
                </span>
              </div>
            )}

            {/* Chord count */}
            <div className="text-sm font-body text-[hsl(var(--text-subtle))]">
              <span className="text-emerald-500 font-display font-bold">{availableCount}</span>{' '}
              chord{availableCount !== 1 ? 's' : ''} available
            </div>
          </div>

          {/* ── Practice Summary Card ── */}
          <div className="max-w-md mx-auto lg:max-w-lg">
            <div className="relative rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="absolute top-0 left-0 w-full h-[3px] rounded-t-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600/30" />
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <Play className="size-4 text-emerald-500" />
                </div>
                <h2 className="font-display text-base sm:text-lg font-semibold uppercase tracking-wider text-[hsl(var(--text-default))]">
                  Ready to Practice
                </h2>
              </div>

              <div className="space-y-3">
                {showFavoritesOnly && !isPresetMode && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[hsl(var(--text-subtle))]">Filter</span>
                    <span className="text-rose-400 font-medium flex items-center gap-1.5">
                      <Heart className="size-3.5 fill-rose-400" />Favorites only
                    </span>
                  </div>
                )}
                {isPresetMode ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--text-subtle))]">Preset</span>
                      <span className="text-[hsl(var(--text-default))] font-medium flex items-center gap-1.5">
                        <Bookmark className="size-3.5 text-[hsl(var(--color-primary))] fill-current" />
                        {activePreset?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--text-subtle))]">Chords in preset</span>
                      <span className="text-[hsl(var(--text-default))] font-medium">{activePreset?.chordIds.length ?? 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--text-subtle))]">Category</span>
                      <span className="text-[hsl(var(--text-default))] font-medium">
                        {categories.size === 0 ? 'All Chords'
                          : categories.size === 1 ? CATEGORY_LABELS[[...categories][0]]
                          : [...categories].map((c) => CATEGORY_LABELS[c].replace(' Chords', '')).join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--text-subtle))]">Type</span>
                      <span className="text-[hsl(var(--text-default))] font-medium">
                        {chordTypes.size === 0 ? 'All Types'
                          : chordTypes.size <= 3 ? [...chordTypes].map((t) => CHORD_TYPE_LABELS[t]).join(', ')
                          : `${chordTypes.size} types`}
                      </span>
                    </div>
                    {barreRoots.size > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[hsl(var(--text-subtle))]">Root String</span>
                        <span className="text-[hsl(var(--text-default))] font-medium">
                          {[...barreRoots].map((r) => `${r}th`).join(', ')}
                        </span>
                      </div>
                    )}
                    {filterPositions.size > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[hsl(var(--text-subtle))]">Position</span>
                        <span className="text-[hsl(var(--text-default))] font-medium">
                          {[...filterPositions].map(p => ({ open: 'Open', low: 'Low (1–4)', mid: 'Mid (5–8)', high: 'High (9–12)' }[p])).join(', ')}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="h-px bg-[hsl(var(--border-subtle))]" />

              <div className="flex items-baseline gap-2">
                <span className="text-sm font-body text-[hsl(var(--text-subtle))]">Available chords:</span>
                <span className={`font-display font-bold text-lg ${availableCount > 0 ? 'text-emerald-500' : 'text-[hsl(var(--semantic-error))]'}`}>
                  {availableCount}
                </span>
              </div>

              {availableCount === 0 && (
                <div className="rounded-lg bg-[hsl(var(--semantic-error)/0.1)] border border-[hsl(var(--semantic-error)/0.2)] p-3 flex gap-2">
                  <AlertCircle className="size-4 text-[hsl(var(--semantic-error))] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-[hsl(var(--text-subtle))] leading-relaxed">
                    {isPresetMode
                      ? 'This preset has no chords available. Try selecting a different preset or use manual filters.'
                      : 'No chords match your current filters. Try adjusting your selections above to include more chords.'}
                  </div>
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={availableCount === 0}
                className={`w-full relative h-12 flex items-center justify-center rounded-xl font-display font-bold text-lg text-black transition-all overflow-hidden
                  ${availableCount === 0
                    ? 'bg-[hsl(var(--bg-muted))] text-[hsl(var(--text-muted))] cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 hover:scale-[1.01] active:scale-100 shadow-xl shadow-emerald-500/20'
                  }`}
              >
                {availableCount > 0 && (
                  <div className="absolute inset-0 z-0 opacity-0 animate-shimmer bg-[linear-gradient(110deg,#000103_45%,#1e2631_55%,#000103_65%)] bg-[length:200%_100%]" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Play className="size-5 fill-black" />
                  Start Practice
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Sheets ── */}
      <AnimatePresence>
        {activeSheet && typeof window !== 'undefined' && window.innerWidth < 640 && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-[hsl(var(--bg-base))] flex flex-col pt-safe-top"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border-default))]">
              <h2 className="font-display font-bold text-xl text-[hsl(var(--text-default))]">
                {activeSheet === 'type' ? 'Select Chord Type'
                  : activeSheet === 'root' ? 'Select Root String'
                  : activeSheet === 'position' ? 'Select Neck Position'
                  : ''}
              </h2>
              <button onClick={() => setActiveSheet(null)} className="p-2 -mr-2 rounded-full hover:bg-[hsl(var(--bg-overlay))]">
                <X className="size-6 text-[hsl(var(--text-subtle))]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-safe-bottom">
              {activeSheet === 'type' && (
                <TypeSheetContent chordTypes={chordTypes} onToggleType={toggleChordType} onToggleAll={handleToggleAllTypes} onToggleGroup={handleToggleGroup} isMobile={true} />
              )}
              {activeSheet === 'root' && (
                <CategorySheetContent
                  categories={categories}
                  barreRoots={barreRoots}
                  onToggleCategory={toggleCategory}
                  onClearCategories={clearCategories}
                  onToggleBarreRoot={(root) => { toggleBarreRoot(root); setActiveSheet(null); }}
                  onClearBarreRoots={() => { clearBarreRoots(); setActiveSheet(null); }}
                  isMobile={true}
                />
              )}
              {activeSheet === 'position' && (
                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest mb-3">Neck Position</p>
                  {([
                    { value: 'open' as PositionFilter, label: 'Open', sub: 'Open string chords' },
                    { value: 'low' as PositionFilter, label: 'Low', sub: 'Frets 1–4' },
                    { value: 'mid' as PositionFilter, label: 'Mid', sub: 'Frets 5–8' },
                    { value: 'high' as PositionFilter, label: 'High', sub: 'Frets 9–12' },
                  ]).map(({ value, label, sub }) => {
                    const isActive = filterPositions.has(value);
                    return (
                      <button
                        key={value}
                        onClick={() => { togglePosition(value); setActiveSheet(null); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-base font-semibold transition-colors rounded-lg mb-2 ${
                          isActive ? 'text-sky-400 bg-sky-500/15' : 'text-[hsl(var(--text-default))] hover:bg-[hsl(var(--bg-overlay))]'
                        }`}
                      >
                        <div>
                          <div>{label}</div>
                          <div className="text-xs font-normal text-[hsl(var(--text-muted))]">{sub}</div>
                        </div>
                        {isActive && (
                          <svg className="size-4 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                  {filterPositions.size > 0 && (
                    <button
                      onClick={() => { clearPositions(); setActiveSheet(null); }}
                      className="w-full text-center px-3 py-2 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-subtle))] transition-colors mt-2"
                    >
                      Clear position filter
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
