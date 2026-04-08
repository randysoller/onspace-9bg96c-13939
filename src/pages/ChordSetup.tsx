/**
 * Chord Setup Page — Complete practice configuration UI
 *
 * Features:
 * - Hero section with background image
 * - Sticky filter bar: two-row pill layout (matching ChordLibrary)
 *   Row 1: All / Open / Barre / Movable category pills
 *   Row 2: Key / Type / Root / Favs dropdown pills
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
import { usePresetStore } from '@/stores/presetStore';
import { CATEGORY_LABELS, CHORD_TYPE_LABELS, BARRE_ROOT_LABELS } from '@/types/chord';
import type { ChordCategory, ChordType, BarreRoot } from '@/types/chord';
import { KEY_SIGNATURES } from '@/constants/scales';
import type { KeySignature } from '@/constants/scales';
import {
  Play,
  Music,
  AlertCircle,
  ChevronDown,
  X,
  KeyRound,
  Layers,
  Guitar,
  Grip,
  Music2,
  Check,
  Bookmark,
  Heart,
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
  'sus2', 'sus4', 'major6', 'minor6',
  'major7', 'dominant7', 'minor7', 'aug7', 'halfDim7', 'dim7', 'add9',
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
  { label: 'Basic', types: ['major', 'minor', 'augmented', 'diminished', 'sus2', 'sus4', 'major6', 'minor6', 'slash'] },
  { label: '7th Chords', types: ['major7', 'dominant7', 'minor7', 'aug7', 'halfDim7', 'dim7'] },
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

function KeySheetContent({
  keyFilter,
  onSelect,
  isMobile,
}: {
  keyFilter: KeySignature | null;
  onSelect: (ks: KeySignature | null) => void;
  isMobile?: boolean;
}) {
  const py = isMobile ? 'py-3.5' : 'py-2.5';
  const textSize = isMobile ? 'text-base' : 'text-sm';
  return (
    <div>
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors`}
      >
        <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          keyFilter === null ? 'border-emerald-500 bg-emerald-500' : 'border-[hsl(var(--border-default))]'
        }`}>
          {keyFilter === null && <Check className="size-3 text-white" />}
        </div>
        <span className={`font-display font-semibold ${textSize} text-[hsl(var(--text-default))]`}>All Keys</span>
      </button>
      <div className="h-px bg-[hsl(var(--border-subtle))] my-1" />
      {KEY_SIGNATURES.map((ks) => (
        <button
          key={ks.display}
          onClick={() => onSelect(ks)}
          className={`w-full flex items-center gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors`}
        >
          <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            keyFilter?.display === ks.display ? 'border-emerald-500 bg-emerald-500' : 'border-[hsl(var(--border-default))]'
          }`}>
            {keyFilter?.display === ks.display && <Check className="size-3 text-white" />}
          </div>
          <div className="flex-1 flex items-baseline gap-2">
            <span className={`font-display font-bold ${textSize} text-[hsl(var(--text-default))] min-w-[36px]`}>{ks.display}</span>
            <span className="font-body text-xs text-[hsl(var(--text-subtle))]">Major</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-body text-xs text-[hsl(var(--text-muted))]">
              {ks.count === 0 ? 'no sharps or flats' : `${ks.count}${ks.type === 'sharp' ? '♯' : '♭'}`}
            </span>
            <span className="font-body text-[10px] text-[hsl(var(--text-subtle))] text-right min-w-[60px]">
              {ks.notes.join(' ')}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

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
    categories, chordTypes, barreRoots, keyFilter,
    activePresetId, showFavoritesOnly,
    toggleCategory, clearCategories,
    toggleChordType, clearChordTypes,
    toggleBarreRoot, clearBarreRoots,
    setKeyFilter, setActivePreset, setShowFavoritesOnly,
    startPractice, getAvailableCount,
  } = usePracticeStore();

  const { favoriteIds } = useChordFavoritesStore();
  const favoriteCount = favoriteIds.size;

  const presetStore = usePresetStore();
  const presets = presetStore.presets;

  type SheetId = 'key' | 'type' | 'root' | null;
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);

  // Refs for desktop dropdowns (category is now direct pills — no dropdown ref needed)
  const keyDropdownRef  = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const rootDropdownRef = useRef<HTMLDivElement>(null);

  const availableCount = useMemo(() => getAvailableCount(), [
    showFavoritesOnly, favoriteIds, categories, chordTypes,
    barreRoots, keyFilter, activePresetId, presets, getAvailableCount,
  ]);

  const activePreset = presets.find((p) => p.id === activePresetId);
  const hasBorreOrMovable = categories.has('barre') || categories.has('movable');
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
    clearCategories(); clearChordTypes(); clearBarreRoots();
    setKeyFilter(null); setActivePreset(null); setShowFavoritesOnly(false);
  };

  // Outside-click closes desktop dropdowns
  useEffect(() => {
    if (!activeSheet || typeof window === 'undefined') return;
    if (window.innerWidth < 640) return;
    const refs: Record<string, React.RefObject<HTMLDivElement>> = {
      key: keyDropdownRef, type: typeDropdownRef, root: rootDropdownRef,
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

            {/* Filter Pills — two static rows, no scroll */}
            <div className={isPresetMode ? 'opacity-40 pointer-events-none' : ''}>

              {/* Row 1: All + Category pills */}
              <div className="flex gap-1.5 flex-wrap mb-1.5">
                <button
                  onClick={clearAll}
                  className={`${basePill} ${
                    categories.size === 0 && chordTypes.size === 0 && barreRoots.size === 0 && !keyFilter && !showFavoritesOnly
                      ? 'bg-[hsl(var(--color-primary))] text-white border-[hsl(var(--color-primary))]'
                      : inactivePill
                  }`}
                >
                  All
                </button>

                <button
                  onClick={() => toggleCategory('open')}
                  className={`${basePill} ${
                    categories.has('open')
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : inactivePill
                  }`}
                >
                  <Guitar className="size-3" />
                  Open
                </button>

                <button
                  onClick={() => toggleCategory('barre')}
                  className={`${basePill} ${
                    categories.has('barre')
                      ? 'bg-purple-500 text-white border-purple-500'
                      : inactivePill
                  }`}
                >
                  <Grip className="size-3" />
                  Barre
                </button>

                <button
                  onClick={() => toggleCategory('movable')}
                  className={`${basePill} ${
                    categories.has('movable')
                      ? 'bg-yellow-400 text-zinc-950 border-yellow-400'
                      : inactivePill
                  }`}
                >
                  <Music2 className="size-3" />
                  Movable
                </button>
              </div>

              {/* Row 2: Key, Type, Root, Favs */}
              <div className="flex gap-1.5 flex-wrap">

                {/* Key Chip */}
                <div className="relative" ref={keyDropdownRef}>
                  <button
                    onClick={() => toggleSheet('key')}
                    className={`${basePill} ${
                      keyFilter
                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50'
                        : inactivePill
                    }`}
                  >
                    <KeyRound className="size-3" />
                    {keyFilter ? `${keyFilter.display} Major` : 'Key'}
                    <ChevronDown className={`size-3 transition-transform duration-200 ${activeSheet === 'key' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {activeSheet === 'key' && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="hidden sm:block absolute left-0 top-full mt-2 w-80 rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                      >
                        <KeySheetContent keyFilter={keyFilter} onSelect={(ks) => { setKeyFilter(ks); setActiveSheet(null); }} isMobile={false} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

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

          {/* ── Active Filter Pills + Chord Count ── */}
          <div className="mb-4 sm:mb-6">
            <div className="text-sm font-body text-[hsl(var(--text-subtle))] mb-3">
              <span className="text-emerald-500 font-display font-bold">{availableCount}</span>{' '}
              chord{availableCount !== 1 ? 's' : ''} available
            </div>

            {(activePreset || keyFilter || categories.size > 0 || chordTypes.size > 0 || barreRoots.size > 0 || showFavoritesOnly) && (
              <div className="flex flex-wrap items-center gap-2">
                {activePreset && (
                  <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-emerald-500/12 border border-emerald-500/25 text-emerald-500">
                    <Bookmark className="size-3 fill-current" />
                    <span>{activePreset.name}</span>
                    <button onClick={() => setActivePreset(null)} className="hover:opacity-70"><X className="size-3" /></button>
                  </div>
                )}
                {!isPresetMode && (
                  <>
                    {showFavoritesOnly && (
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-rose-500/12 border border-rose-500/25 text-rose-400">
                        <Heart className="size-3 fill-current" /><span>Favorites</span>
                        <button onClick={() => setShowFavoritesOnly(false)} className="hover:opacity-70"><X className="size-3" /></button>
                      </div>
                    )}
                    {keyFilter && (
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-emerald-500/12 border border-emerald-500/25 text-emerald-500">
                        <span>{keyFilter.display} Major</span>
                        <button onClick={() => setKeyFilter(null)} className="hover:opacity-70"><X className="size-3" /></button>
                      </div>
                    )}
                    {[...categories].map((cat) => {
                      const catPill = cat === 'open' ? 'bg-emerald-500/12 border-emerald-500/25 text-emerald-500'
                        : cat === 'barre' ? 'bg-purple-500/12 border-purple-500/25 text-purple-400'
                        : cat === 'movable' ? 'bg-yellow-400/12 border-yellow-400/25 text-yellow-300'
                        : 'bg-zinc-500/12 border-zinc-500/25 text-zinc-400';
                      return (
                        <div key={cat} className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium border ${catPill}`}>
                          <span>{CATEGORY_LABELS[cat].replace(' Chords', '')}</span>
                          <button onClick={() => toggleCategory(cat)} className="hover:opacity-70"><X className="size-3" /></button>
                        </div>
                      );
                    })}
                    {chordTypes.size > 0 && chordTypes.size <= 3 ? (
                      [...chordTypes].map((type) => (
                        <div key={type} className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-emerald-500/12 border border-emerald-500/25 text-emerald-500">
                          <span>{CHORD_TYPE_LABELS[type]}</span>
                          <button onClick={() => toggleChordType(type)} className="hover:opacity-70"><X className="size-3" /></button>
                        </div>
                      ))
                    ) : chordTypes.size > 3 ? (
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-emerald-500/12 border border-emerald-500/25 text-emerald-500">
                        <span>{chordTypes.size} types</span>
                        <button onClick={clearChordTypes} className="hover:opacity-70"><X className="size-3" /></button>
                      </div>
                    ) : null}
                    {[...barreRoots].map((root) => (
                      <div key={root} className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-indigo-500/12 border border-indigo-500/25 text-indigo-400">
                        <span>Root {root}th</span>
                        <button onClick={() => toggleBarreRoot(root)} className="hover:opacity-70"><X className="size-3" /></button>
                      </div>
                    ))}
                  </>
                )}
                <button onClick={clearAll} className="text-[11px] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--semantic-error))] underline underline-offset-2">
                  Clear all
                </button>
              </div>
            )}
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
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--text-subtle))]">Key</span>
                      <span className="text-[hsl(var(--text-default))] font-medium">
                        {keyFilter ? `${keyFilter.display} Major` : 'All'}
                      </span>
                    </div>
                    {hasBorreOrMovable && barreRoots.size > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[hsl(var(--text-subtle))]">Root String</span>
                        <span className="text-[hsl(var(--text-default))] font-medium">
                          {[...barreRoots].map((r) => `${r}th`).join(', ')}
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
                className={`group/btn relative w-full flex items-center justify-center gap-3 rounded-xl py-4 font-display text-lg font-bold tracking-wide uppercase overflow-hidden transition-all duration-200 ${
                  availableCount > 0
                    ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.4),0_0_80px_rgba(16,185,129,0.15)] active:scale-[0.97]'
                    : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-muted))] cursor-not-allowed'
                }`}
              >
                {availableCount > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                )}
                <Play className="size-5 group-hover/btn:scale-110 transition-transform" />
                <span>START PRACTICE</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Sheets ── */}
      <AnimatePresence>
        {activeSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveSheet(null)}
              className="sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key={activeSheet}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 36 }}
              className="sm:hidden fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl border-t border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] shadow-2xl max-h-[75vh] flex flex-col"
            >
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 rounded-full bg-[hsl(var(--border-default))]" />
              </div>
              <div className="px-4 pb-3 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-[hsl(var(--text-default))]">
                  {activeSheet === 'key' ? 'Select Key' : activeSheet === 'root' ? 'Root String' : 'Chord Type'}
                </h3>
                <div className="flex items-center gap-2">
                  {activeSheet === 'type' && chordTypes.size > 0 && (
                    <button onClick={clearChordTypes} className="text-xs font-body text-[hsl(var(--text-subtle))] hover:text-[hsl(var(--text-default))] underline underline-offset-2">Clear</button>
                  )}
                  {activeSheet === 'root' && barreRoots.size > 0 && (
                    <button onClick={clearBarreRoots} className="text-xs font-body text-[hsl(var(--text-subtle))] hover:text-[hsl(var(--text-default))] underline underline-offset-2">Clear</button>
                  )}
                  <button onClick={() => setActiveSheet(null)} className="size-7 flex items-center justify-center text-[hsl(var(--text-subtle))] hover:text-[hsl(var(--text-default))] transition-colors">
                    <X className="size-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-1 pb-8">
                {activeSheet === 'key' && (
                  <KeySheetContent keyFilter={keyFilter} onSelect={(ks) => { setKeyFilter(ks); setActiveSheet(null); }} isMobile={true} />
                )}
                {activeSheet === 'type' && (
                  <TypeSheetContent chordTypes={chordTypes} onToggleType={toggleChordType} onToggleAll={handleToggleAllTypes} onToggleGroup={handleToggleGroup} isMobile={true} />
                )}
                {activeSheet === 'root' && (
                  <div>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[10px] font-body font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">Root Note String</p>
                    </div>
                    {ROOT_STRING_OPTIONS.map(({ value, label }) => {
                      const isActive = barreRoots.has(value);
                      return (
                        <button
                          key={value}
                          onClick={() => toggleBarreRoot(value)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-base font-body font-medium transition-colors ${
                            isActive ? 'text-indigo-400 bg-indigo-500/15' : 'text-[hsl(var(--text-default))] hover:bg-[hsl(var(--bg-overlay))]'
                          }`}
                        >
                          <div className={`size-5 rounded border flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-indigo-500 border-indigo-500' : 'border-[hsl(var(--border-default))]'
                          }`}>
                            {isActive && <Check className="size-3 text-white" />}
                          </div>
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-surface))]">
                <button onClick={() => setActiveSheet(null)} className="w-full rounded-xl bg-emerald-500 text-white py-3 text-base font-display font-bold">
                  Show Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
