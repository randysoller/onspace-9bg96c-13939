/**
 * ChordDisplay
 *
 * Encapsulates the scaled diagram + tablature section of the Practice page:
 *   - Detection feedback pill (Correct / Wrong)
 *   - Chord diagram & tablature (CSS scale-compensated layout)
 *   - Diagrams On/Off toggle
 *   - Prev / Play / Next navigation buttons
 *
 * Layout note: the negative/positive margin offsets (-mt-[319px], mt-[336px], etc.)
 * are intentional compensations for `transform: scale(2.156)` on the diagram wrapper.
 * CSS transforms don't affect layout flow — the element still occupies its original
 * (pre-scale) bounding box — so these manual offsets correct the resulting visual gap.
 * If the scale factor changes, recalculate: offset ≈ (scale - 1) × original_height / 2.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, SkipBack, SkipForward } from 'lucide-react';
import { ChordDiagram } from '@/components/features/ChordDiagram';
import { ChordTablature } from '@/components/features/ChordTablature';
import { ShowDiagramsToggle } from '@/components/features/ShowDiagramsToggle';
import type { ChordData } from '@/types/chord';

interface ChordDisplayProps {
  chord: ChordData;
  showDiagrams: boolean;
  result: 'correct' | 'wrong' | null;
  onToggleDiagrams: (value: boolean) => void;
  onPrev: () => void;
  onPlay: () => void;
  onNext: () => void;
}

function ChordDisplayBase({
  chord,
  showDiagrams,
  result,
  onToggleDiagrams,
  onPrev,
  onPlay,
  onNext,
}: ChordDisplayProps) {
  return (
    <div className="-mt-[319px]">

      {/* ── Detection Feedback Pill ── */}
      <div className="min-h-[60px] mb-[2px] mt-[336px] flex items-center justify-center">
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none"
            >
              <div className={`px-7 py-2 rounded-2xl backdrop-blur-md border-2 ${
                result === 'correct'
                  ? 'bg-[hsl(142_71%_45%/0.15)] border-[hsl(142_71%_45%/0.5)]'
                  : 'bg-[hsl(0_84%_60%/0.15)] border-[hsl(0_84%_60%/0.5)]'
              }`}>
                <span
                  className={`font-display text-2xl font-extrabold uppercase tracking-wider ${
                    result === 'correct' ? 'text-emerald-500' : 'text-red-500'
                  }`}
                  style={{
                    textShadow: result === 'correct'
                      ? '0 0 20px hsl(142 71% 45% / 0.5)'
                      : '0 0 20px hsl(0 84% 60% / 0.5)',
                  }}
                >
                  {result === 'correct' ? 'Correct' : 'Wrong'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Diagram & Tablature ──
           Always in the DOM; `invisible` preserves layout space so nothing
           shifts when the user toggles diagrams off.
      */}
      <div className={!showDiagrams ? 'invisible' : ''}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${chord.id}-diagram`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex items-end justify-center gap-6 mb-2 -mt-[10px]"
            style={{ transform: 'scale(2.156)', overflow: 'visible' }}
          >
            <ChordDiagram chord={chord} size="lg" />
            <ChordTablature chord={chord} size="lg" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Legend + Diagrams On/Off Toggle ──
           Legend is absolutely centered in the row so it adds zero height.
           md:hidden keeps it mobile-only where diagram real estate is scarce.
           The toggle stays right-0 as before.
      */}
      <div className="relative flex items-center justify-center h-9 mt-16">
        <span className="text-[hsl(var(--text-subtle))] text-lg font-medium">Diagrams On/Off</span>

        {/* Mobile-only legend — centered, non-interactive overlay */}
        <div className="md:hidden absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-4">
            {/* Orange circle — finger position */}
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="6" fill="hsl(38 90% 56%)" />
              </svg>
              <span className="text-[11px] font-body font-medium text-[hsl(var(--text-subtle))] leading-none">
                Finger Position
              </span>
            </div>
            {/* Blue diamond — root note */}
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <polygon points="6,0 12,6 6,12 0,6" fill="hsl(200 80% 55%)" />
              </svg>
              <span className="text-[11px] font-body font-medium text-[hsl(var(--text-subtle))] leading-none">
                Root Note
              </span>
            </div>
          </div>
        </div>

        <div className="absolute right-0">
          <ShowDiagramsToggle showDiagrams={showDiagrams} onToggle={onToggleDiagrams} />
        </div>
      </div>

      {/* ── Inline Navigation Buttons ── */}
      <div className="flex items-stretch gap-3 mt-8 max-w-md mx-auto px-1">

        {/* Prev */}
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous chord"
          style={{ minWidth: 48, minHeight: 48, touchAction: 'manipulation', cursor: 'pointer' }}
          className="rounded-xl flex items-center justify-center
            bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))]
            hover:bg-[hsl(var(--bg-overlay))] hover:border-[hsl(var(--border-default))]
            active:scale-95 transition-all"
        >
          <SkipBack className="w-5 h-5 text-[hsl(var(--text-subtle))]" />
        </button>

        {/* Play */}
        <button
          type="button"
          onClick={onPlay}
          aria-label="Play chord"
          style={{ minHeight: 48, touchAction: 'manipulation', cursor: 'pointer', flex: 1 }}
          className="rounded-xl flex items-center justify-center gap-1.5
            bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))]
            text-[hsl(var(--color-primary))] font-semibold text-base
            hover:bg-[hsl(var(--color-primary)/0.12)] hover:border-[hsl(var(--color-primary)/0.4)]
            active:scale-[0.97] transition-all"
        >
          <Volume2 className="w-4 h-4" />
          <span>Play</span>
        </button>

        {/* Next */}
        <button
          type="button"
          onClick={onNext}
          aria-label="Next chord"
          style={{ minHeight: 48, touchAction: 'manipulation', cursor: 'pointer', flex: 1 }}
          className="rounded-xl flex items-center justify-center gap-1.5
            bg-[hsl(var(--color-primary))] text-white font-semibold text-base
            hover:bg-[hsl(var(--color-emphasis))] active:scale-[0.97] transition-all
            shadow-md shadow-[hsl(var(--color-primary)/0.25)]"
        >
          <span>Next</span>
          <SkipForward className="w-4 h-4" />
        </button>

      </div>

    </div>
  );
}

export const ChordDisplay = memo(ChordDisplayBase);
