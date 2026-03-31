/**
 * Chord Setup Page — Complete practice configuration UI
 * 
 * Features:
 * - Hero section with background image
 * - Sticky filter bar with 3 multi-axis filter chips (Key, Category, Type)
 * - Preset dropdown with drag-and-drop reordering
 * - Desktop dropdowns vs mobile bottom sheets
 * - Contextual root string sub-filter
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
  Shapes,
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
  'major',
  'minor',
  'augmented',
  'slash',
  'diminished',
  'suspended',
  'major7',
  'dominant7',
  'minor7',
  'aug7',
  'halfDim7',
  'dim7',
  '9th',
  '11th',
  '13th',
];

const TYPE_GROUPS: { label: string; types: ChordType[] }[] = [
  { label: 'Basic', types: ['major', 'minor', 'augmented', 'diminished', 'suspended', 'slash'] },
  { label: '7th Chords', types: ['major7', 'dominant7', 'minor7', 'aug7', 'halfDim7', 'dim7'] },
  { label: 'Extended', types: ['9th', '11th', '13th'] },
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

// ============================================================================
// CHECKBOX ICON COMPONENT
// ============================================================================

function CheckboxIcon({
  checked,
  color = 'primary',
}: {
  checked: boolean;
  color?: 'primary' | 'emerald';
}) {
  const colorMap = {
    primary: { bg: 'bg-[hsl(var(--color-primary))]', border: 'border-[hsl(var(--color-primary))]' },
    emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500' },
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
// INTERNAL SHEET CONTENT COMPONENTS
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
      {/* All Keys Row */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors`}
      >
        <div
          className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            keyFilter === null
              ? 'border-emerald-500 bg-emerald-500'
              : 'border-[hsl(var(--border-default))]'
          }`}
        >
          {keyFilter === null && <Check className="size-3 text-white" />}
        </div>
        <span className={`font-display font-semibold ${textSize} text-[hsl(var(--text-default))]`}>
          All Keys
        </span>
      </button>
      
      {/* Separator */}
      <div className="h-px bg-[hsl(var(--border-subtle))] my-1" />
      
      {/* Key Signature Rows */}
      {KEY_SIGNATURES.map((ks) => (
        <button
          key={ks.display}
          onClick={() => onSelect(ks)}
          className={`w-full flex items-center gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors`}
        >
          <div
            className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              keyFilter?.display === ks.display
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-[hsl(var(--border-default))]'
            }`}
          >
            {keyFilter?.display === ks.display && <Check className="size-3 text-white" />}
          </div>
          <div className="flex-1 flex items-baseline gap-2">
            <span className={`font-display font-bold ${textSize} text-[hsl(var(--text-default))] min-w-[36px]`}>
              {ks.display}
            </span>
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
      {/* All Shapes Row */}
      <button
        onClick={onClearCategories}
        className={`w-full flex items-center gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors`}
      >
        <CheckboxIcon checked={categories.size === 0} color="emerald" />
        <span className={`font-display font-semibold ${textSize} text-[hsl(var(--text-default))]`}>
          All Shapes
        </span>
      </button>
      
      {/* Category Rows */}
      {ALL_CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onToggleCategory(cat)}
          className={`w-full flex items-start gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors ${
            categories.has(cat) ? 'bg-emerald-500/8' : ''
          }`}
        >
          <CheckboxIcon checked={categories.has(cat)} color="emerald" />
          <div className="flex items-center gap-2 flex-shrink-0">
            {CATEGORY_ICONS[cat]}
            <span className={`font-body font-medium ${textSize} text-[hsl(var(--text-default))]`}>
              {CATEGORY_LABELS[cat].replace(' Chords', '')}
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--text-muted))] leading-snug">
            {CATEGORY_DESCRIPTIONS[cat]}
          </p>
        </button>
      ))}
      
      {/* Root String Section */}
      {showRootSection && (
        <div className="mt-4 px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-body font-bold text-[hsl(var(--text-muted))] uppercase tracking-widest">
              ROOT STRING
            </span>
            {barreRoots.size > 0 && (
              <button
                onClick={onClearBarreRoots}
                className="text-xs font-body text-[hsl(var(--text-subtle))] hover:text-[hsl(var(--text-default))] underline underline-offset-2"
              >
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
      {/* All Types Row */}
      <button
        onClick={onToggleAll}
        className={`w-full flex items-center gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors`}
      >
        <CheckboxIcon checked={chordTypes.size === ALL_CHORD_TYPES.length} color="emerald" />
        <span className={`font-display font-semibold ${textSize} text-[hsl(var(--text-default))]`}>
          All Types
        </span>
      </button>
      
      {/* Grouped Type Rows */}
      {TYPE_GROUPS.map((group) => {
        const allSelected = group.types.every((t) => chordTypes.has(t));
        const someSelected = group.types.some((t) => chordTypes.has(t));
        
        return (
          <div key={group.label}>
            {/* Group Header */}
            <button
              onClick={() => onToggleGroup(group.types)}
              className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-[hsl(var(--bg-overlay))] transition-colors mt-2`}
            >
              <div
                className={`size-5 rounded border flex items-center justify-center shrink-0 ${
                  allSelected
                    ? 'bg-emerald-500 border-emerald-500'
                    : someSelected
                    ? 'border-emerald-500 bg-emerald-500/30'
                    : 'border-[hsl(var(--border-default))]'
                }`}
              >
                {allSelected ? (
                  <Check className="size-3 text-white" />
                ) : someSelected ? (
                  <div className="size-2 bg-emerald-500 rounded-sm" />
                ) : null}
              </div>
              <span className="font-display text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-widest">
                {group.label}
              </span>
            </button>
            
            {/* Individual Type Rows */}
            {group.types.map((type) => (
              <button
                key={type}
                onClick={() => onToggleType(type)}
                className={`w-full flex items-center gap-3 px-4 ${py} hover:bg-[hsl(var(--bg-overlay))] transition-colors ${
                  chordTypes.has(type) ? 'bg-emerald-500/8' : ''
                }`}
              >
                <CheckboxIcon checked={chordTypes.has(type)} color="emerald" />
                <span className={`font-body font-medium ${textSize} text-[hsl(var(--text-default))]`}>
                  {CHORD_TYPE_LABELS[type]}
                </span>
              </button>
            ))}
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
  
  // Zustand stores
  const {
    categories,
    chordTypes,
    barreRoots,
    keyFilter,
    activePresetId,
    showFavoritesOnly,
    toggleCategory,
    clearCategories,
    toggleChordType,
    clearChordTypes,
    toggleBarreRoot,
    clearBarreRoots,
    setKeyFilter,
    setActivePreset,
    setShowFavoritesOnly,
    startPractice,
    getAvailableCount,
  } = usePracticeStore();

  const { favoriteIds } = useChordFavoritesStore();
  const favoriteCount = favoriteIds.size;
  
  const presetStore = usePresetStore();
  const presets = presetStore.presets;
  
  // Local state
  type SheetId = 'key' | 'category' | 'type' | null;
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  
  // Refs for desktop dropdowns
  const keyDropdownRef = useRef<HTMLDivElement>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  
  // Computed values
  const availableCount = useMemo(() => getAvailableCount(), [
    showFavoritesOnly,
    favoriteIds,
    categories,
    chordTypes,
    barreRoots,
    keyFilter,
    activePresetId,
    presets,
    getAvailableCount,
  ]);
  
  const activePreset = presets.find((p) => p.id === activePresetId);
  const hasBorreOrMovable = categories.has('barre') || categories.has('movable');
  const isPresetMode = !!activePreset;
  
  // Filter summaries
  const getKeySummary = () => (keyFilter ? `${keyFilter.display} Major` : 'Chords in a Key');
  
  const getCatSummary = () => {
    if (categories.size === 0) return 'All Shapes';
    if (categories.size === 1)
      return CATEGORY_LABELS[[...categories][0]].replace(' Chords', '');
    return `${categories.size} shapes`;
  };
  
  const getTypeSummary = () => {
    if (chordTypes.size === 0) return 'All Types';
    if (chordTypes.size === 1) return CHORD_TYPE_LABELS[[...chordTypes][0]];
    return `${chordTypes.size} types`;
  };
  
  const getTypeSummaryMobile = () => {
    if (chordTypes.size === 0) return 'Types';
    return `${chordTypes.size} types`;
  };
  
  // Handlers
  const toggleSheet = (id: SheetId) => {
    setActiveSheet(activeSheet === id ? null : id);
  };
  
  const handleStart = () => {
    if (availableCount === 0) return;
    startPractice();
    navigate('/practice');
  };
  
  const handleActivatePreset = (id: string) => {
    if (activePresetId === id) {
      setActivePreset(null);
    } else {
      setActivePreset(id);
    }
  };
  
  const handleDeletePreset = (id: string) => {
    presetStore.removePreset(id);
    if (activePresetId === id) {
      setActivePreset(null);
    }
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
    if (allSelected) {
      for (const t of types) {
        if (chordTypes.has(t)) toggleChordType(t);
      }
    } else {
      for (const t of types) {
        if (!chordTypes.has(t)) toggleChordType(t);
      }
    }
  };
  
  const clearAll = () => {
    clearCategories();
    clearChordTypes();
    clearBarreRoots();
    setKeyFilter(null);
    setActivePreset(null);
    setShowFavoritesOnly(false);
  };
  
  // Outside-click close (desktop only)
  useEffect(() => {
    if (!activeSheet || typeof window === 'undefined') return;
    if (window.innerWidth < 640) return; // Mobile uses bottom sheets
    
    const handleClickOutside = (e: MouseEvent) => {
      const refs = {
        key: keyDropdownRef,
        category: catDropdownRef,
        type: typeDropdownRef,
      };
      
      const activeRef = refs[activeSheet];
      if (activeRef && activeRef.current && !activeRef.current.contains(e.target as Node)) {
        setActiveSheet(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSheet]);
  
  // Body scroll lock (mobile only)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!activeSheet || window.innerWidth >= 640) return;
    
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeSheet]);
  
  return (
    <div className="stage-gradient min-h-[calc(100vh-58px)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Guitar fretboard"
            className="size-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--bg-base)/0.3)] via-[hsl(var(--bg-base)/0.7)] to-[hsl(var(--bg-base))]" />
        </div>
        
        {/* Content */}
        <div className="relative px-4 sm:px-6 py-10 sm:py-16 md:py-24 text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/8 px-4 py-1.5 mb-6">
            <Music className="size-3.5 text-emerald-500" />
            <span className="text-xs font-body font-medium text-emerald-500">
              Guitar Chord Trainer
            </span>
          </div>
          
          {/* Title */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-extrabold leading-tight text-balance">
            <span className="text-[hsl(var(--text-default))]">Master Every Chord.</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">One Fret at a Time.</span>
          </h1>
          
          {/* Subtitle */}
          <p className="mt-3 sm:mt-5 font-body text-sm sm:text-base md:text-lg text-[hsl(var(--text-subtle))] max-w-xl mx-auto text-pretty">
            Challenge yourself with timed chord reveals. Pick a category, set your timer, and test
            how well you know your fretboard.
          </p>
        </div>
      </div>
      
      {/* Setup Section */}
      <div className="px-3 sm:px-6 pb-12 sm:pb-16 mt-2 sm:-mt-4">
        <div className="max-w-5xl mx-auto">
          {/* Sticky Filter Bar */}
          <div className="sticky top-[3.5rem] z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 pt-3 pb-2 bg-[hsl(var(--bg-base)/0.92)] backdrop-blur-md border-b border-[hsl(var(--border-subtle)/0.5)] mb-4 sm:mb-6 space-y-2.5 transition-opacity duration-200">
            {/* PresetDropdown */}
            <PresetDropdown
              presets={presets}
              activePresetId={activePresetId}
              onActivate={handleActivatePreset}
              onDeactivate={() => setActivePreset(null)}
              onDelete={handleDeletePreset}
              onReorder={presetStore.reorderPreset}
            />
            
            {/* Active Preset Banner */}
            {activePreset && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 -mt-1 mb-1">
                <Bookmark className="size-3.5 text-emerald-500 fill-current shrink-0" />
                <span className="text-sm font-body font-medium text-emerald-500 truncate">
                  Using preset:{' '}
                  <span className="font-display font-bold">{activePreset.name}</span>
                </span>
                <button
                  onClick={() => setActivePreset(null)}
                  className="ml-auto shrink-0 text-xs font-body text-emerald-500 hover:underline"
                >
                  Use filters
                </button>
              </div>
            )}
            
            {/* Filter Chips Row */}
            <div
              className={`flex items-center gap-2 overflow-x-auto scrollbar-none sm:overflow-visible ${
                isPresetMode ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              {/* Favorites Chip */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-body font-medium transition-all whitespace-nowrap active:scale-95 ${
                  showFavoritesOnly
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                    : 'border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))] hover:text-rose-400 hover:border-rose-500/30'
                }`}
              >
                <Heart className={`size-4 ${showFavoritesOnly ? 'fill-rose-400' : ''}`} />
                <span>Favorites</span>
                {favoriteCount > 0 && (
                  <span className={`flex size-5 rounded-full items-center justify-center text-[10px] font-bold ${
                    showFavoritesOnly
                      ? 'bg-rose-500 text-white'
                      : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-muted))]'
                  }`}>
                    {favoriteCount}
                  </span>
                )}
              </button>

              {/* Key Chip */}
              <div className="relative" ref={keyDropdownRef}>
                <button
                  onClick={() => toggleSheet('key')}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-body font-medium transition-all whitespace-nowrap active:scale-95 ${
                    keyFilter
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500'
                      : activeSheet === 'key'
                      ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-default))]'
                      : 'border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))]'
                  }`}
                >
                  <KeyRound className="size-4" />
                  <span>{getKeySummary()}</span>
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${
                      activeSheet === 'key' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {/* Desktop Dropdown */}
                <AnimatePresence>
                  {activeSheet === 'key' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="hidden sm:block absolute left-0 top-full mt-2 w-80 rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                    >
                      <KeySheetContent
                        keyFilter={keyFilter}
                        onSelect={(ks) => {
                          setKeyFilter(ks);
                          setActiveSheet(null);
                        }}
                        isMobile={false}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Category Chip */}
              <div className="relative" ref={catDropdownRef}>
                <button
                  onClick={() => toggleSheet('category')}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-body font-medium transition-all whitespace-nowrap active:scale-95 ${
                    categories.size > 0
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500'
                      : activeSheet === 'category'
                      ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-default))]'
                      : 'border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))]'
                  }`}
                >
                  <Shapes className="size-4" />
                  <span>{getCatSummary()}</span>
                  {categories.size > 0 && (
                    <span className="hidden sm:flex size-5 rounded-full bg-emerald-500 text-[hsl(var(--bg-base))] items-center justify-center text-[10px] font-bold">
                      {categories.size}
                    </span>
                  )}
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${
                      activeSheet === 'category' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {/* Desktop Dropdown */}
                <AnimatePresence>
                  {activeSheet === 'category' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="hidden sm:block absolute left-0 top-full mt-2 w-72 rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                    >
                      <CategorySheetContent
                        categories={categories}
                        barreRoots={barreRoots}
                        onToggleCategory={toggleCategory}
                        onClearCategories={clearCategories}
                        onToggleBarreRoot={toggleBarreRoot}
                        onClearBarreRoots={clearBarreRoots}
                        isMobile={false}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Type Chip */}
              <div className="relative" ref={typeDropdownRef}>
                <button
                  onClick={() => toggleSheet('type')}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-body font-medium transition-all whitespace-nowrap active:scale-95 ${
                    chordTypes.size > 0
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500'
                      : activeSheet === 'type'
                      ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-default))]'
                      : 'border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))]'
                  }`}
                >
                  <Layers className="size-4" />
                  <span className="hidden sm:inline">{getTypeSummary()}</span>
                  <span className="sm:hidden">{getTypeSummaryMobile()}</span>
                  {chordTypes.size > 0 && (
                    <span className="hidden sm:flex size-5 rounded-full bg-emerald-500 text-[hsl(var(--bg-base))] items-center justify-center text-[10px] font-bold">
                      {chordTypes.size}
                    </span>
                  )}
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${
                      activeSheet === 'type' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {/* Desktop Dropdown */}
                <AnimatePresence>
                  {activeSheet === 'type' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="hidden sm:block absolute left-0 top-full mt-2 w-72 rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                    >
                      <TypeSheetContent
                        chordTypes={chordTypes}
                        onToggleType={toggleChordType}
                        onToggleAll={handleToggleAllTypes}
                        onToggleGroup={handleToggleGroup}
                        isMobile={false}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Contextual Root String Chips */}
            <AnimatePresence>
              {hasBorreOrMovable && !isPresetMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-body font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider">
                      Root:
                    </span>
                    {BARRE_ROOTS.map((root) => (
                      <button
                        key={root}
                        onClick={() => toggleBarreRoot(root)}
                        className={`rounded-full px-3 py-1 text-[12px] sm:text-[11px] font-body font-medium border transition-colors ${
                          barreRoots.has(root)
                            ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                            : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] border-transparent'
                        }`}
                      >
                        {root}th String
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Active Filter Pills and Chord Count */}
          <div className="mb-4 sm:mb-6">
            {/* Chord Count */}
            <div className="text-sm font-body text-[hsl(var(--text-subtle))] mb-3">
              <span className="text-emerald-500 font-display font-bold">
                {availableCount}
              </span>{' '}
              chord{availableCount !== 1 ? 's' : ''} available
            </div>
            
            {/* Pills Container */}
            {(activePreset || keyFilter || categories.size > 0 || chordTypes.size > 0 || barreRoots.size > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Preset Pill */}
                {activePreset && (
                  <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-emerald-500/12 border border-emerald-500/25 text-emerald-500">
                    <Bookmark className="size-3 fill-current" />
                    <span>{activePreset.name}</span>
                    <button onClick={() => setActivePreset(null)} className="hover:opacity-70">
                      <X className="size-3" />
                    </button>
                  </div>
                )}
                
                {!isPresetMode && (
                  <>
                    {/* Favorites Pill */}
                    {showFavoritesOnly && (
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-rose-500/12 border border-rose-500/25 text-rose-400">
                        <Heart className="size-3 fill-current" />
                        <span>Favorites</span>
                        <button onClick={() => setShowFavoritesOnly(false)} className="hover:opacity-70">
                          <X className="size-3" />
                        </button>
                      </div>
                    )}

                    {/* Key Pill */}
                    {keyFilter && (
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-emerald-500/12 border border-emerald-500/25 text-emerald-500">
                        <span>{keyFilter.display} Major</span>
                        <button onClick={() => setKeyFilter(null)} className="hover:opacity-70">
                          <X className="size-3" />
                        </button>
                      </div>
                    )}
                    
                    {/* Category Pills */}
                    {[...categories].map((cat) => (
                      <div
                        key={cat}
                        className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-emerald-500/12 border border-emerald-500/25 text-emerald-500"
                      >
                        <span>{CATEGORY_LABELS[cat].replace(' Chords', '')}</span>
                        <button onClick={() => toggleCategory(cat)} className="hover:opacity-70">
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Type Pills */}
                    {chordTypes.size > 0 && chordTypes.size <= 3 ? (
                      [...chordTypes].map((type) => (
                        <div
                          key={type}
                          className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-emerald-500/12 border border-emerald-500/25 text-emerald-500"
                        >
                          <span>{CHORD_TYPE_LABELS[type]}</span>
                          <button onClick={() => toggleChordType(type)} className="hover:opacity-70">
                            <X className="size-3" />
                          </button>
                        </div>
                      ))
                    ) : chordTypes.size > 3 ? (
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-emerald-500/12 border border-emerald-500/25 text-emerald-500">
                        <span>{chordTypes.size} types</span>
                        <button onClick={clearChordTypes} className="hover:opacity-70">
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : null}
                    
                    {/* Root String Pills */}
                    {[...barreRoots].map((root) => (
                      <div
                        key={root}
                        className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium bg-emerald-500/12 border border-emerald-500/25 text-emerald-500"
                      >
                        <span>Root {root}th</span>
                        <button onClick={() => toggleBarreRoot(root)} className="hover:opacity-70">
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
                
                {/* Clear All */}
                <button
                  onClick={clearAll}
                  className="text-[11px] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--semantic-error))] underline underline-offset-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          
          {/* Practice Summary Card */}
          <div className="max-w-md mx-auto lg:max-w-lg">
            <div className="relative rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Accent bar */}
              <div className="absolute top-0 left-0 w-full h-[3px] rounded-t-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600/30" />
              
              {/* Header */}
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <Play className="size-4 text-emerald-500" />
                </div>
                <h2 className="font-display text-base sm:text-lg font-semibold uppercase tracking-wider text-[hsl(var(--text-default))]">
                  Ready to Practice
                </h2>
              </div>
              
              {/* Summary Rows */}
              <div className="space-y-3">
                {showFavoritesOnly && !isPresetMode && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[hsl(var(--text-subtle))]">Filter</span>
                    <span className="text-rose-400 font-medium flex items-center gap-1.5">
                      <Heart className="size-3.5 fill-rose-400" />
                      Favorites only
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
                      <span className="text-[hsl(var(--text-default))] font-medium">
                        {activePreset?.chordIds.length ?? 0}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--text-subtle))]">Category</span>
                      <span className="text-[hsl(var(--text-default))] font-medium">
                        {categories.size === 0
                          ? 'All Chords'
                          : categories.size === 1
                          ? CATEGORY_LABELS[[...categories][0]]
                          : [...categories]
                              .map((c) => CATEGORY_LABELS[c].replace(' Chords', ''))
                              .join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--text-subtle))]">Type</span>
                      <span className="text-[hsl(var(--text-default))] font-medium">
                        {chordTypes.size === 0
                          ? 'All Types'
                          : chordTypes.size <= 3
                          ? [...chordTypes].map((t) => CHORD_TYPE_LABELS[t]).join(', ')
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
              
              {/* Divider */}
              <div className="h-px bg-[hsl(var(--border-subtle))]" />
              
              {/* Available Chords Count */}
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-body text-[hsl(var(--text-subtle))]">
                  Available chords:
                </span>
                <span
                  className={`font-display font-bold text-lg ${
                    availableCount > 0
                      ? 'text-emerald-500'
                      : 'text-[hsl(var(--semantic-error))]'
                  }`}
                >
                  {availableCount}
                </span>
              </div>
              
              {/* Zero Chords Warning */}
              {availableCount === 0 && (
                <div className="rounded-lg bg-[hsl(var(--semantic-error)/0.1)] border border-[hsl(var(--semantic-error)/0.2)] p-3 flex gap-2">
                  <AlertCircle className="size-4 text-[hsl(var(--semantic-error))] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-[hsl(var(--text-subtle))] leading-relaxed">
                    {isPresetMode ? (
                      <span>
                        This preset has no chords available. Try selecting a different preset or use
                        manual filters.
                      </span>
                    ) : (
                      <span>
                        No chords match your current filters. Try adjusting your selections above to
                        include more chords.
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Start Practice Button */}
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
      
      {/* Mobile Bottom Sheets */}
      <AnimatePresence>
        {activeSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveSheet(null)}
              className="sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Sheet */}
            <motion.div
              key={activeSheet}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 36 }}
              className="sm:hidden fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl border-t border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] shadow-2xl max-h-[75vh] flex flex-col"
            >
              {/* Drag Indicator */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 rounded-full bg-[hsl(var(--border-default))]" />
              </div>
              
              {/* Header */}
              <div className="px-4 pb-3 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-[hsl(var(--text-default))]">
                  {activeSheet === 'key'
                    ? 'Select Key'
                    : activeSheet === 'category'
                    ? 'Shape Category'
                    : 'Chord Type'}
                </h3>
                <div className="flex items-center gap-2">
                  {activeSheet === 'category' && categories.size > 0 && (
                    <button
                      onClick={clearCategories}
                      className="text-xs font-body text-[hsl(var(--text-subtle))] hover:text-[hsl(var(--text-default))] underline underline-offset-2"
                    >
                      Clear
                    </button>
                  )}
                  {activeSheet === 'type' && chordTypes.size > 0 && (
                    <button
                      onClick={clearChordTypes}
                      className="text-xs font-body text-[hsl(var(--text-subtle))] hover:text-[hsl(var(--text-default))] underline underline-offset-2"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setActiveSheet(null)}
                    className="size-7 flex items-center justify-center text-[hsl(var(--text-subtle))] hover:text-[hsl(var(--text-default))] transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
              
              {/* Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-1 pb-8">
                {activeSheet === 'key' && (
                  <KeySheetContent
                    keyFilter={keyFilter}
                    onSelect={(ks) => {
                      setKeyFilter(ks);
                      setActiveSheet(null);
                    }}
                    isMobile={true}
                  />
                )}
                {activeSheet === 'category' && (
                  <CategorySheetContent
                    categories={categories}
                    barreRoots={barreRoots}
                    onToggleCategory={toggleCategory}
                    onClearCategories={clearCategories}
                    onToggleBarreRoot={toggleBarreRoot}
                    onClearBarreRoots={clearBarreRoots}
                    isMobile={true}
                  />
                )}
                {activeSheet === 'type' && (
                  <TypeSheetContent
                    chordTypes={chordTypes}
                    onToggleType={toggleChordType}
                    onToggleAll={handleToggleAllTypes}
                    onToggleGroup={handleToggleGroup}
                    isMobile={true}
                  />
                )}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-3 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-surface))]">
                <button
                  onClick={() => setActiveSheet(null)}
                  className="w-full rounded-xl bg-emerald-500 text-white py-3 text-base font-display font-bold"
                >
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
