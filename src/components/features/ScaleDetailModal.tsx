/**
 * ScaleDetailModal — fullscreen swipe carousel with 3 cards per scale.
 *
 * Cards (in order):
 *   0 — Finger Patterns  (dots labeled with finger numbers 1–4)
 *   1 — Note Names       (dots labeled with note name, e.g. "C", "F#")
 *   2 — Interval Patterns (dots labeled with scale degree, e.g. "1", "b3", "#4")
 *
 * Each card contains 5 horizontal fretboard diagrams (5 box positions).
 * Swipe left/right or tap arrows to move between cards.
 * Progress dots at the bottom of each card.
 * Adjacent cards peek 40px on each side.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScaleVaultEntry } from '@/constants/scales';
import HorizontalScaleFretboard from './HorizontalScaleFretboard';

// ── Music theory helpers ───────────────────────────────────────────────────────

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

/**
 * Open-string semitones from C (mod 12).
 * Index 0 = String 1 (high e), index 5 = String 6 (low E).
 * Matches HorizontalScaleFretboard: stringIndex 0 renders at SVG top (high e).
 */
const OPEN_STRING_SEMITONES = [4, 11, 7, 2, 9, 4]; // e B G D A E (high to low)

const SEMITONE_TO_DEGREE: Record<number, string> = {
  0: '1', 1: 'b2', 2: '2', 3: 'b3',
  4: '3', 5: '4', 6: 'b5', 7: '5',
  8: 'b6', 9: '6', 10: 'b7', 11: '7',
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

const NOTE_NAMES_CHROMATIC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// ── Box position generation ────────────────────────────────────────────────────

interface BoxDot {
  stringIndex: number;
  fret: number;
  interval: number;
  isRoot: boolean;
}

interface BoxPosition {
  startFret: number;
  dots: BoxDot[];
  label: string;
}

function generateBoxPositions(rootNote: string, intervals: readonly number[]): BoxPosition[] {
  const rootSem = NOTE_TO_SEMITONE[rootNote] ?? 0;
  const intervalsArr = [...intervals];

  // Find first root-note fret on each string → anchor for each position window
  const anchors: number[] = [];
  OPEN_STRING_SEMITONES.forEach((openSem) => {
    for (let fret = 0; fret <= 15; fret++) {
      if ((openSem + fret) % 12 === rootSem) {
        // Window starts 1 fret before root (gives room for approach tones below root)
        anchors.push(Math.max(0, fret - 1));
        break;
      }
    }
  });

  // Sort and deduplicate anchors within 2 frets of each other (same position)
  anchors.sort((a, b) => a - b);
  const dedup: number[] = [];
  anchors.forEach((fret) => {
    if (dedup.length === 0 || fret - dedup[dedup.length - 1] > 2) {
      dedup.push(fret);
    }
  });

  // Guarantee exactly 5 positions by appending +12 offsets if needed
  while (dedup.length < 5) {
    dedup.push((dedup[dedup.length - 1] ?? 0) + 3);
  }

  return dedup.slice(0, 5).map((startFret, posIdx) => {
    const endFret = startFret + 4;
    const dots: BoxDot[] = [];

    OPEN_STRING_SEMITONES.forEach((openSem, strIdx) => {
      for (let fret = startFret; fret <= endFret; fret++) {
        const noteSem = (openSem + fret) % 12;
        const interval = (noteSem - rootSem + 12) % 12;
        if (intervalsArr.includes(interval)) {
          dots.push({ stringIndex: strIdx, fret, interval, isRoot: interval === 0 });
        }
      }
    });

    return {
      startFret,
      dots,
      label: `Position ${posIdx + 1}${startFret === 0 ? ' — Open' : ` — Fret ${startFret}`}`,
    };
  });
}

// ── Label builders per card type ──────────────────────────────────────────────

function buildFingerLabel(dot: BoxDot, startFret: number): string {
  return String(Math.min(4, Math.max(1, dot.fret - startFret + 1)));
}

function buildNoteLabel(dot: BoxDot, rootSem: number): string {
  return NOTE_NAMES_CHROMATIC[(rootSem + dot.interval) % 12] ?? '?';
}

function buildDegreeLabel(dot: BoxDot, scaleId: string): string {
  return (
    SCALE_DEGREE_OVERRIDES[scaleId]?.[dot.interval] ??
    SEMITONE_TO_DEGREE[dot.interval] ??
    String(dot.interval)
  );
}

// ── Card metadata ─────────────────────────────────────────────────────────────

const CARD_DEFS = [
  {
    id: 'finger',
    title: 'Finger Patterns',
    subtitle: '1 = index  ·  2 = middle  ·  3 = ring  ·  4 = pinky',
  },
  {
    id: 'notes',
    title: 'Note Names',
    subtitle: 'Note name shown on each fretboard dot',
  },
  {
    id: 'intervals',
    title: 'Interval Patterns',
    subtitle: 'Scale degrees relative to the root note',
  },
];

// ── Layout constants ──────────────────────────────────────────────────────────

const PEEK = 40; // px of adjacent cards visible on each side
const GAP = 12;  // px gap between cards

// ── Component ─────────────────────────────────────────────────────────────────

interface ScaleDetailModalProps {
  scale: ScaleVaultEntry;
  rootNote: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ScaleDetailModal({
  scale,
  rootNote,
  isOpen,
  onClose,
}: ScaleDetailModalProps) {
  const [activeCard, setActiveCard] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const rootSem = NOTE_TO_SEMITONE[rootNote] ?? 0;
  const boxPositions = generateBoxPositions(rootNote, scale.intervals);

  // Measure viewport width → compute card pixel width
  useEffect(() => {
    const measure = () => {
      if (viewportRef.current) {
        // card width = viewport inner width - (2 * PEEK) - (2 * GAP side padding)
        const vw = viewportRef.current.offsetWidth;
        setCardWidth(vw - 2 * PEEK - GAP * 0);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen]);

  // Reset to card 0 when a different scale is opened
  useEffect(() => { setActiveCard(0); }, [scale.id, rootNote]);

  const goNext = useCallback(() => setActiveCard((c) => Math.min(CARD_DEFS.length - 1, c + 1)), []);
  const goPrev = useCallback(() => setActiveCard((c) => Math.max(0, c - 1)), []);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number } }) => {
      if (info.offset.x < -60) goNext();
      else if (info.offset.x > 60) goPrev();
    },
    [goNext, goPrev]
  );

  if (!isOpen) return null;

  // Track translateX: move left by (activeCard * (cardWidth + GAP))
  // Initial track offset = PEEK (so first card aligns correctly)
  const trackX = cardWidth > 0 ? PEEK - activeCard * (cardWidth + GAP) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="scale-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-black/92 z-50 flex flex-col"
          style={{ WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            key="scale-modal-content"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="flex flex-col w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 pt-5 pb-3 flex-shrink-0">
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-500 leading-none">
                  {rootNote} · {scale.name}
                </p>
                <h2 className="text-[20px] font-bold text-white leading-snug mt-0.5">
                  {CARD_DEFS[activeCard].title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                aria-label="Close scale detail"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* ── Carousel viewport ──────────────────────────────────────── */}
            <div
              ref={viewportRef}
              className="flex-1 overflow-hidden relative"
            >
              {cardWidth > 0 && (
                <motion.div
                  className="flex h-full absolute top-0"
                  style={{ gap: GAP, left: 0 }}
                  animate={{ x: trackX }}
                  transition={{ type: 'spring', damping: 32, stiffness: 340 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.12}
                  onDragEnd={handleDragEnd}
                >
                  {CARD_DEFS.map((card, cardIdx) => (
                    <motion.div
                      key={card.id}
                      className="flex-shrink-0 flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden"
                      style={{ width: cardWidth, minWidth: cardWidth }}
                      animate={{
                        opacity: cardIdx === activeCard ? 1 : 0.5,
                        scale: cardIdx === activeCard ? 1 : 0.97,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Scrollable fretboard area */}
                      <div className="flex-1 overflow-y-auto overscroll-contain">
                        <div className="px-3 pt-3 pb-2">
                          {/* Card subtitle */}
                          <p className="text-[11px] text-zinc-500 font-medium mb-3 px-1">
                            {card.subtitle}
                          </p>

                          {/* 5 box position diagrams */}
                          <div className="space-y-3">
                            {boxPositions.map((pos, posIdx) => {
                              const dots = pos.dots.map((dot) => ({
                                stringIndex: dot.stringIndex,
                                fret: dot.fret,
                                isRoot: dot.isRoot,
                                label:
                                  card.id === 'finger'
                                    ? buildFingerLabel(dot, pos.startFret)
                                    : card.id === 'notes'
                                    ? buildNoteLabel(dot, rootSem)
                                    : buildDegreeLabel(dot, scale.id),
                              }));

                              return (
                                <div
                                  key={posIdx}
                                  className="bg-zinc-950 rounded-xl p-3 border border-zinc-800"
                                >
                                  <HorizontalScaleFretboard
                                    dots={dots}
                                    startFret={pos.startFret}
                                    positionLabel={pos.label}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          <div className="h-4" />
                        </div>
                      </div>

                      {/* ── Card footer: progress dots + arrows ─────────── */}
                      <div className="flex-shrink-0 bg-zinc-900 border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
                        {/* Prev arrow */}
                        <button
                          onClick={goPrev}
                          disabled={activeCard === 0}
                          className="flex items-center gap-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          style={{ minWidth: 80 }}
                          aria-label="Previous card"
                        >
                          <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                          <span className="text-[10px] font-semibold truncate">
                            {activeCard > 0 ? CARD_DEFS[activeCard - 1].title : ''}
                          </span>
                        </button>

                        {/* Progress dots */}
                        <div className="flex items-center gap-2">
                          {CARD_DEFS.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              onClick={() => setActiveCard(dotIdx)}
                              className={`rounded-full transition-all duration-250 ${
                                dotIdx === activeCard
                                  ? 'bg-cyan-500 w-5 h-2.5'
                                  : 'bg-zinc-600 hover:bg-zinc-500 w-2.5 h-2.5'
                              }`}
                              aria-label={`Go to ${CARD_DEFS[dotIdx].title}`}
                            />
                          ))}
                        </div>

                        {/* Next arrow */}
                        <button
                          onClick={goNext}
                          disabled={activeCard === CARD_DEFS.length - 1}
                          className="flex items-center gap-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors justify-end"
                          style={{ minWidth: 80 }}
                          aria-label="Next card"
                        >
                          <span className="text-[10px] font-semibold truncate text-right">
                            {activeCard < CARD_DEFS.length - 1 ? CARD_DEFS[activeCard + 1].title : ''}
                          </span>
                          <ChevronRight className="w-4 h-4 flex-shrink-0" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
