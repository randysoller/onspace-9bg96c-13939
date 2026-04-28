import { useMemo, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Check, Waves } from 'lucide-react';
import { motion } from 'framer-motion';
import { SCALE_VAULT_DEFINITIONS, type ScaleVaultCategory, type ScaleVaultEntry } from '@/constants/scales';
import { Note, Interval } from '@tonaljs/tonal';
import { useScaleVaultStore } from '@/stores/scaleVaultStore';
import ScaleDetailModal from '@/components/features/ScaleDetailModal';

// ── Category metadata ──────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ScaleVaultCategory, string> = {
  'diatonic': 'Diatonic',
  'pentatonic': 'Pentatonic',
  'blues': 'Blues',
  'major-scale-mode': 'Major Scale Mode',
  'harmonic-minor': 'Harmonic Minor',
  'melodic-minor': 'Melodic Minor',
  'harmonic-major': 'Harmonic Major',
  'double-harmonic': 'Double Harmonic',
};

// Ordered for filter chip display
const CATEGORY_ORDER: ScaleVaultCategory[] = [
  'diatonic',
  'pentatonic',
  'blues',
  'major-scale-mode',
  'harmonic-minor',
  'melodic-minor',
  'harmonic-major',
  'double-harmonic',
];

// Root notes for the root selector
const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
type RootNote = (typeof ROOT_NOTES)[number];

// ── Helper ─────────────────────────────────────────────────────────────────

function getScaleNotes(root: RootNote, intervals: readonly number[]): string[] {
  return intervals.map((semitones) => {
    const transposed = Note.transpose(`${root}4`, Interval.fromSemitones(semitones));
    return transposed.replace(/\d+$/, '');
  });
}

function getStepLabel(diff: number): string {
  if (diff === 1) return 'H';
  if (diff === 2) return 'W';
  if (diff === 3) return 'A2';
  return String(diff);
}

const SEMITONE_TO_DEGREE: Record<number, string> = {
  0: '1',   1: 'b2',  2: '2',   3: 'b3',
  4: '3',   5: '4',   6: 'b5',  7: '5',
  8: 'b6',  9: '6',  10: 'b7', 11: '7',
};

const SCALE_DEGREE_OVERRIDES: Partial<Record<string, Partial<Record<number, string>>>> = {
  'lydian':                   { 6: '#4' },
  'lydian-augmented':         { 6: '#4' },
  'lydian-dominant':          { 6: '#4' },
  'lydian-flat3':             { 6: '#4' },
  'lydian-sharp2':            { 6: '#4' },
  'lydian-sharp2-sharp6':     { 6: '#4' },
  'lydian-augmented-sharp2':  { 6: '#4' },
  'dorian-sharp4':            { 6: '#4' },
};

// ── Shared dropdown item style — matches Pattern Isolator exactly ──────────
// selected:   border-l-4 border-cyan-500, text-white,   Check w-7 h-7 text-cyan-400
// unselected: no left border,             text-zinc-300, no check

// ── Component ──────────────────────────────────────────────────────────────

export default function ScaleVault() {
  const navigate = useNavigate();

  useEffect(() => {
    const el = document.getElementById('main-content');
    if (el) el.scrollTop = 0;
  }, []);

  const { selectedCategory, setSelectedCategory, selectedRoot, setSelectedRoot } = useScaleVaultStore();
  const [modalScale, setModalScale] = useState<ScaleVaultEntry | null>(null);

  // ── Custom dropdown state ─────────────────────────────────────────────────
  const [rootOpen, setRootOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [rootPanelPos, setRootPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [categoryPanelPos, setCategoryPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootBtnRef = useRef<HTMLButtonElement>(null);
  const categoryBtnRef = useRef<HTMLButtonElement>(null);

  const openRootDropdown = () => {
    const rect = rootBtnRef.current?.getBoundingClientRect();
    if (rect) setRootPanelPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setRootOpen((p) => !p);
    setCategoryOpen(false);
  };

  const openCategoryDropdown = () => {
    const rect = categoryBtnRef.current?.getBoundingClientRect();
    if (rect) setCategoryPanelPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setCategoryOpen((p) => !p);
    setRootOpen(false);
  };

  // Filtered scales
  const visibleScales = useMemo(() => {
    if (!selectedCategory) return SCALE_VAULT_DEFINITIONS;
    return SCALE_VAULT_DEFINITIONS.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  // Count per category
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<ScaleVaultCategory, number>> = {};
    for (const s of SCALE_VAULT_DEFINITIONS) {
      counts[s.category] = (counts[s.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      {/* ── Hero header ── */}
      <div>
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-start gap-3 py-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-shrink-0 w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition-colors mt-0.5"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0 mt-0.5">
                <Waves className="w-4 h-4 text-white" strokeWidth={2.3} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-[26px] font-bold text-white leading-none">Scale Vault</h1>
              </div>
            </div>
            <span className="flex-shrink-0 text-[14px] font-semibold text-zinc-100 bg-zinc-700/80 px-2 py-0.5 rounded-full mt-1">
              {visibleScales.length} scale{visibleScales.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl">

        {/* ── Root note selector — custom portal dropdown ── */}
        <div className="mt-5">
          <button
            ref={rootBtnRef}
            onClick={openRootDropdown}
            className="w-full h-11 bg-zinc-800/80 border border-zinc-700 rounded-xl flex items-center justify-between px-3 hover:border-zinc-500 transition-colors"
            aria-haspopup="listbox"
            aria-expanded={rootOpen}
            aria-label="Pick a key or root note"
          >
            <span className="text-cyan-400 text-[19px] font-semibold truncate">Tap to pick a key or root note</span>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {selectedRoot && (
                <span className="text-cyan-300 text-[19px] font-bold">{selectedRoot}</span>
              )}
              <ChevronDown className="w-5 h-5 text-cyan-400" />
            </div>
          </button>
        </div>

        {/* ── Category filter — custom portal dropdown ── */}
        <div className="mt-4">
          <button
            ref={categoryBtnRef}
            onClick={openCategoryDropdown}
            className="w-full h-11 bg-zinc-800/80 border border-zinc-700 rounded-xl flex items-center justify-between px-3 hover:border-zinc-500 transition-colors"
            aria-haspopup="listbox"
            aria-expanded={categoryOpen}
            aria-label="Pick scale category"
          >
            <span className="text-cyan-400 text-[19px] font-semibold truncate">Tap to pick scale category</span>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className="text-cyan-300 text-[19px] font-bold">
                {selectedCategory ? CATEGORY_LABELS[selectedCategory] : 'All'}
              </span>
              <ChevronDown className="w-5 h-5 text-cyan-400" />
            </div>
          </button>
        </div>

        {/* ── Step pattern legend ── */}
        <p className="mt-3 text-[12px] text-zinc-500 leading-none px-1">
          W = Whole Step (2 frets)&nbsp;&nbsp;·&nbsp;&nbsp;H = Half Step (1 fret)&nbsp;&nbsp;·&nbsp;&nbsp;A2 = Aug 2nd (3 frets)
        </p>

        {/* ── Tap hint — directly above first card ── */}
        <p className="mt-4 px-1 text-[21px] font-semibold text-cyan-400 leading-snug">
          Tap Scale Card to See Patterns
        </p>

        {/* ── Scale cards grid ── */}
        <div className="mt-3 space-y-2">
          {visibleScales.map((scale, idx) => {
            const notes = getScaleNotes(selectedRoot as RootNote, scale.intervals);
            const hasAltNames = scale.altNames && scale.altNames.length > 0;

            return (
              <motion.div
                key={scale.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.025 }}
                className="bg-zinc-900/50 border border-zinc-800 border-l-4 rounded-xl px-4 pt-3 pb-8 hover:bg-zinc-800/40 transition-colors cursor-pointer active:scale-[0.99]"
                style={{ borderLeftColor: '#06b6d4' }}
                onClick={() => setModalScale(scale)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[24px] font-bold text-white leading-snug">{scale.name}</p>
                    {hasAltNames && (
                      <p className="text-[13px] text-zinc-300 leading-snug mt-0.5">
                        Also known as: {scale.altNames!.join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-700 text-white whitespace-nowrap mt-0.5">
                    {CATEGORY_LABELS[scale.category]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-[24px] flex-wrap">
                  {scale.intervals.map((interval, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span
                        className="text-[19px] font-bold w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: i === 0 ? '#06b6d4' : 'rgba(6,182,212,0.10)',
                          color: i === 0 ? '#ffffff' : '#06b6d4',
                        }}
                      >
                        {notes[i]}
                      </span>
                      <span className="text-[17px] text-zinc-200 mt-0.5 font-medium">
                        {SCALE_DEGREE_OVERRIDES[scale.id]?.[interval] ?? SEMITONE_TO_DEGREE[interval] ?? String(interval)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 mt-1.5 pl-[21px] flex-wrap">
                  {scale.intervals.slice(1).map((val, i) => (
                    <span key={i} className="w-9 text-center text-[13px] text-zinc-300 font-medium">
                      {getStepLabel(val - scale.intervals[i])}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Scale detail modal */}
      {modalScale && (
        <ScaleDetailModal
          scale={modalScale}
          rootNote={selectedRoot}
          isOpen={true}
          onClose={() => setModalScale(null)}
        />
      )}

      {/* ── Root note portal dropdown ── */}
      {rootOpen && rootPanelPos && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setRootOpen(false)}
          />
          {/* Panel */}
          <div
            className="fixed bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 overflow-y-auto"
            style={{
              zIndex: 9999,
              top: rootPanelPos.top,
              left: rootPanelPos.left,
              width: rootPanelPos.width,
              maxHeight: '60vh',
            }}
          >
            {ROOT_NOTES.map((note) => {
              const isSelected = selectedRoot === note;
              return (
                <button
                  key={note}
                  onClick={() => {
                    setSelectedRoot(note as RootNote);
                    setRootOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[21px] hover:bg-zinc-800 transition-colors ${
                    isSelected
                      ? 'text-white border-l-4 border-cyan-500'
                      : 'text-zinc-300'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{note}</span>
                  {isSelected && <Check className="w-7 h-7 text-cyan-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}

      {/* ── Category portal dropdown ── */}
      {categoryOpen && categoryPanelPos && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setCategoryOpen(false)}
          />
          {/* Panel */}
          <div
            className="fixed bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 overflow-y-auto"
            style={{
              zIndex: 9999,
              top: categoryPanelPos.top,
              left: categoryPanelPos.left,
              width: categoryPanelPos.width,
              maxHeight: '60vh',
            }}
          >
            {/* All option */}
            {(() => {
              const isSelected = !selectedCategory;
              return (
                <button
                  onClick={() => { setSelectedCategory(null); setCategoryOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[21px] hover:bg-zinc-800 transition-colors ${
                    isSelected ? 'text-white border-l-4 border-cyan-500' : 'text-zinc-300'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>All ({SCALE_VAULT_DEFINITIONS.length})</span>
                  {isSelected && <Check className="w-7 h-7 text-cyan-400 flex-shrink-0" />}
                </button>
              );
            })()}
            <div className="h-px bg-zinc-800 mx-2" />
            {CATEGORY_ORDER.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setCategoryOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[21px] hover:bg-zinc-800 transition-colors ${
                    isSelected ? 'text-white border-l-4 border-cyan-500' : 'text-zinc-300'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{CATEGORY_LABELS[cat]} ({categoryCounts[cat] ?? 0})</span>
                  {isSelected && <Check className="w-7 h-7 text-cyan-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
