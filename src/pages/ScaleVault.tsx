import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Waves, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { SCALE_VAULT_DEFINITIONS, type ScaleVaultCategory } from '@/constants/scales';

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

// Semitone offset for each root
const ROOT_OFFSET: Record<RootNote, number> = {
  C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11,
};

// Chromatic note names (sharps)
const CHROMATIC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

// ── Helper ─────────────────────────────────────────────────────────────────

/** Return the scale note names for a given root and interval array */
function getScaleNotes(root: RootNote, intervals: readonly number[]): string[] {
  const offset = ROOT_OFFSET[root];
  return intervals.map((i) => CHROMATIC[(offset + i) % 12]);
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ScaleVault() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<ScaleVaultCategory | null>(null);
  const [selectedRoot, setSelectedRoot] = useState<RootNote>('C');

  // Filtered scales
  const visibleScales = useMemo(() => {
    if (!selectedCategory) return SCALE_VAULT_DEFINITIONS;
    return SCALE_VAULT_DEFINITIONS.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  // Count per category (for badge numbers on chips)
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
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-sm border-b border-zinc-800/60">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-3 py-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-shrink-0 w-9 h-9 rounded-lg bg-zinc-800/80 flex items-center justify-center hover:bg-zinc-700 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-300" />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
                <Waves className="w-4 h-4 text-white" strokeWidth={2.3} />
              </div>
              <div className="min-w-0">
                <h1 className="text-[17px] font-bold text-white leading-none">Scale Vault</h1>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-none">Solo in any key</p>
                <p className="text-[13px] text-cyan-400 mt-0.5 leading-none">Press Scale Card to See Patterns</p>
              </div>
            </div>
            <span className="flex-shrink-0 text-[11px] font-semibold text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded-full">
              {visibleScales.length} scale{visibleScales.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl">
        {/* ── Root note selector ── */}
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-1">Root Note</p>
          <div
            className="flex gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {ROOT_NOTES.map((note) => {
              const isActive = selectedRoot === note;
              return (
                <button
                  key={note}
                  onClick={() => setSelectedRoot(note)}
                  className={`flex-shrink-0 min-w-[40px] h-9 rounded-lg text-[13px] font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {note}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Category filter chips ── */}
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-1">Category</p>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* All chip */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold transition-all ${
                selectedCategory === null
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              All
              <span className={`text-[10px] font-bold ${selectedCategory === null ? 'text-white/70' : 'text-zinc-600'}`}>
                {SCALE_VAULT_DEFINITIONS.length}
              </span>
            </button>

            {CATEGORY_ORDER.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(isActive ? null : cat)}
                  className={`flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                      : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                  <span className={`text-[10px] font-bold ${isActive ? 'text-white/70' : 'text-zinc-600'}`}>
                    {categoryCounts[cat] ?? 0}
                  </span>
                  {isActive && (
                    <X className="w-3 h-3 ml-0.5 opacity-70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scale cards grid ── */}
        <div className="mt-5 space-y-2">
          {visibleScales.map((scale, idx) => {
            const notes = getScaleNotes(selectedRoot, scale.intervals);
            const hasAltNames = scale.altNames && scale.altNames.length > 0;

            return (
              <motion.div
                key={scale.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.025 }}
                className="bg-zinc-900/50 border border-zinc-800 border-l-4 rounded-xl px-4 py-3.5 hover:bg-zinc-800/40 transition-colors"
                style={{ borderLeftColor: '#06b6d4' }}
              >
                {/* Scale name + category badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-bold text-white leading-snug">{scale.name}</p>

                    {/* ── altNames subtitle — rendered only when present ── */}
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

                {/* Interval numbers */}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  {scale.intervals.map((interval, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span
                        className="text-[13px] font-bold w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: i === 0 ? '#06b6d4' : 'rgba(6,182,212,0.10)',
                          color: i === 0 ? '#ffffff' : '#06b6d4',
                        }}
                      >
                        {notes[i]}
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-0.5">{interval}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
