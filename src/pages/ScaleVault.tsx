import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Waves } from 'lucide-react';
import { motion } from 'framer-motion';
import { SCALE_VAULT_DEFINITIONS, type ScaleVaultCategory } from '@/constants/scales';
import { Note, Interval } from '@tonaljs/tonal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

/**
 * Return the scale note names for a given root and interval semitone array.
 * Uses Tonal.js Note.transpose + Interval.fromSemitones for accuracy,
 * then strips the octave number from the result (e.g. "C#4" → "C#").
 */
function getScaleNotes(root: RootNote, intervals: readonly number[]): string[] {
  return intervals.map((semitones) => {
    const transposed = Note.transpose(`${root}4`, Interval.fromSemitones(semitones));
    // Strip octave digit — Note.transpose returns e.g. "F#4", we want "F#"
    return transposed.replace(/\d+$/, '');
  });
}

// ── Step pattern label (semitone difference → step name) ──────────────────
// Only differences 1, 2, 3 appear across all 39 scale entries.
// Fallback renders the raw number for any future additions.
function getStepLabel(diff: number): string {
  if (diff === 1) return 'H';
  if (diff === 2) return 'W';
  if (diff === 3) return 'A2';
  return String(diff);
}

// ── Scale degree formula lookup (semitones → scale degree label) ──────────
// Uses standard guitar education convention: b5 for tritone, b6 for aug5, etc.
const SEMITONE_TO_DEGREE: Record<number, string> = {
  0: '1',   1: 'b2',  2: '2',   3: 'b3',
  4: '3',   5: '4',   6: 'b5',  7: '5',
  8: 'b6',  9: '6',  10: 'b7', 11: '7',
};

// ── Per-scale overrides for semitone → degree label ───────────────────────
// Lydian-family scales use #4 for semitone 6 (raised 4th), not b5.
const SCALE_DEGREE_OVERRIDES: Partial<Record<string, Partial<Record<number, string>>>> = {
  'lydian':                   { 6: '#4' },
  'lydian-augmented':         { 6: '#4' },
  'lydian-dominant':          { 6: '#4' },
  'lydian-flat3':             { 6: '#4' },
  'lydian-sharp2':            { 6: '#4' },
  'lydian-sharp2-sharp6':     { 6: '#4' },
  'lydian-augmented-sharp2':  { 6: '#4' },
  // Dorian #4: semitone 6 is the raised 4th degree (#4), not b5
  'dorian-sharp4':            { 6: '#4' },
};

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
      <div>
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
          <p className="text-[14px] font-bold uppercase tracking-widest text-zinc-400 mb-2 px-1">Root Note</p>
          <div className="grid grid-cols-6 gap-1.5">
            {ROOT_NOTES.map((note) => {
              const isActive = selectedRoot === note;
              return (
                <button
                  key={note}
                  onClick={() => setSelectedRoot(note)}
                  className={`h-10 rounded-lg text-[17px] font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {note}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Category filter dropdown ── */}
        <div className="mt-4">
          <p className="text-[14px] font-bold uppercase tracking-widest text-zinc-400 mb-2 px-1">Category</p>
          <Select
            value={selectedCategory ?? 'all'}
            onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v as ScaleVaultCategory)}
          >
            <SelectTrigger className="w-full h-11 bg-zinc-800/80 border-zinc-700 text-white text-[16px] font-semibold rounded-xl focus:ring-cyan-500 focus:border-cyan-500">
              <SelectValue placeholder="All scales" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
              <SelectItem value="all" className="text-[15px] text-zinc-200 focus:bg-zinc-700 focus:text-white">
                All ({SCALE_VAULT_DEFINITIONS.length})
              </SelectItem>
              {CATEGORY_ORDER.map((cat) => (
                <SelectItem
                  key={cat}
                  value={cat}
                  className="text-[15px] text-zinc-200 focus:bg-zinc-700 focus:text-white"
                >
                  {CATEGORY_LABELS[cat]} ({categoryCounts[cat] ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Step pattern legend ── */}
        {/* Fret counts: W=2 frets (whole step/2 semitones), H=1 fret (half step/1 semitone), A2=3 frets (aug 2nd/3 semitones) */}
        <p className="mt-3 text-[12px] text-zinc-500 leading-none px-1">
          W = Whole Step (2 frets)&nbsp;&nbsp;·&nbsp;&nbsp;H = Half Step (1 fret)&nbsp;&nbsp;·&nbsp;&nbsp;A2 = Aug 2nd (3 frets)
        </p>

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
                className="bg-zinc-900/50 border border-zinc-800 border-l-4 rounded-xl px-4 pt-3 pb-8 hover:bg-zinc-800/40 transition-colors"
                style={{ borderLeftColor: '#06b6d4' }}
              >
                {/* Scale name + category badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[24px] font-bold text-white leading-snug">{scale.name}</p>

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
                      <span className="text-[17px] text-zinc-200 mt-0.5 font-medium">{SCALE_DEGREE_OVERRIDES[scale.id]?.[interval] ?? SEMITONE_TO_DEGREE[interval] ?? String(interval)}</span>
                    </div>
                  ))}
                </div>

                {/* Step pattern row — N-1 labels centered between consecutive note chips */}
                {/* pl-[21px] = half chip (18px) + half gap (3px) aligns each label between chip centers */}
                <div className="flex items-center gap-1.5 mt-1.5 pl-[21px] flex-wrap">
                  {scale.intervals.slice(1).map((val, i) => (
                    <span
                      key={i}
                      className="w-9 text-center text-[13px] text-zinc-300 font-medium"
                    >
                      {getStepLabel(val - scale.intervals[i])}
                    </span>
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
