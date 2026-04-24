/**
 * ScaleDetailModal — fullscreen swipe carousel with 3 cards per scale.
 *
 * Cards (in order):
 *   0 — Finger Patterns   (labels: finger numbers 1–4)
 *   1 — Note Names        (labels: note name, e.g. "C", "F#")
 *   2 — Interval Patterns (labels: scale degrees, e.g. "1", "b3", "#4")
 *
 * Each card shows 5 horizontally-stacked fretboard box-position diagrams.
 *
 * Carousel:
 *   • Active card = 95vw, with 40px peek on each side
 *   • Swipe left/right or tap arrows to navigate
 *   • Progress dots + arrow buttons in footer of each card
 *   • X button in modal header AND top-right of each card
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScaleVaultEntry } from '@/constants/scales';
import HorizontalScaleFretboard, { type FretDot } from './HorizontalScaleFretboard';

// ── Music theory helpers ───────────────────────────────────────────────────────

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

/**
 * Open-string semitones from C (mod 12), index 0 = String 1 high e (SVG top).
 * stringIndex 0 = high e, 5 = low E
 */
const OPEN_STRING_SEMITONES = [4, 11, 7, 2, 9, 4]; // e B G D A E

const SEMITONE_TO_DEGREE: Record<number, string> = {
  0: '1',  1: 'b2', 2: '2',  3: 'b3',
  4: '3',  5: '4',  6: 'b5', 7: '5',
  8: 'b6', 9: '6', 10: 'b7', 11: '7',
};

const SCALE_DEGREE_OVERRIDES: Partial<Record<string, Partial<Record<number, string>>>> = {
  'lydian':                  { 6: '#4' },
  'lydian-augmented':        { 6: '#4' },
  'lydian-dominant':         { 6: '#4' },
  'lydian-flat3':            { 6: '#4' },
  'lydian-sharp2':           { 6: '#4' },
  'lydian-sharp2-sharp6':    { 6: '#4' },
  'lydian-augmented-sharp2': { 6: '#4' },
  'dorian-sharp4':           { 6: '#4' },
};

const NOTE_NAMES_CHROMATIC = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// ── Box position generation ────────────────────────────────────────────────────

interface BoxDot {
  stringIndex: number;
  fret: number;          // 0 = open string
  interval: number;      // semitones from root (0–11)
  isRoot: boolean;
}

interface BoxPosition {
  startFret: number;
  dots: BoxDot[];
  label: string;
}

function generateBoxPositions(rootNote: string, intervals: readonly number[]): BoxPosition[] {
  const rootSem = NOTE_TO_SEMITONE[rootNote] ?? 0;
  const intervalSet = new Set(intervals);

  // Find first occurrence of root on each string → candidate window anchors
  const anchors: number[] = [];
  OPEN_STRING_SEMITONES.forEach((openSem) => {
    for (let fret = 0; fret <= 15; fret++) {
      if ((openSem + fret) % 12 === rootSem) {
        // Window starts 1 fret before root to give approach-note headroom
        anchors.push(Math.max(0, fret - 1));
        break;
      }
    }
  });

  // Sort and deduplicate (collapse anchors within 2 frets of each other)
  anchors.sort((a, b) => a - b);
  const dedup: number[] = [];
  anchors.forEach((fret) => {
    if (dedup.length === 0 || fret - dedup[dedup.length - 1] > 2) {
      dedup.push(fret);
    }
  });

  // Guarantee exactly 5 positions
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
        if (intervalSet.has(interval)) {
          dots.push({
            stringIndex: strIdx,
            fret,
            interval,
            isRoot: interval === 0,
          });
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

// ── Label builders ─────────────────────────────────────────────────────────────

/** Finger number: 1–4 based on fret offset within the 4-fret window. Open string → '0' */
function buildFingerLabel(dot: BoxDot, startFret: number): string {
  if (dot.fret === 0) return '0'; // open string — no finger
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
    subtitle: '1=index  ·  2=middle  ·  3=ring  ·  4=pinky  ·  0=open',
  },
  {
    id: 'notes',
    title: 'Note Names',
    subtitle: 'Note name on each dot  ·  Cyan = root  ·  Amber = scale tone',
  },
  {
    id: 'intervals',
    title: 'Interval Patterns',
    subtitle: 'Scale degrees relative to root  ·  1=root',
  },
];

// ── Layout ────────────────────────────────────────────────────────────────────

const PEEK = 40;   // px of adjacent card visible on each side
const CARD_GAP = 12; // px gap between cards

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
  const rafRef = useRef<number | null>(null);

  // Recompute card width whenever the modal opens or window resizes
  useEffect(() => {
    if (!isOpen) return;

    const measure = () => {
      if (viewportRef.current) {
        const vw = viewportRef.current.offsetWidth;
        // active card width = viewport - 2×PEEK sides - 0 extra gap (gaps are between cards)
        setCardWidth(Math.max(0, vw - PEEK * 2));
      }
    };

    // Defer to next paint so the DOM is fully laid out
    rafRef.current = requestAnimationFrame(() => {
      measure();
    });

    window.addEventListener('resize', measure);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', measure);
    };
  }, [isOpen]);

  // Reset to card 0 on new scale or root
  useEffect(() => {
    setActiveCard(0);
  }, [scale.id, rootNote]);

  const goNext = useCallback(
    () => setActiveCard((c) => Math.min(CARD_DEFS.length - 1, c + 1)),
    []
  );
  const goPrev = useCallback(
    () => setActiveCard((c) => Math.max(0, c - 1)),
    []
  );

  // Drag-end handler: commit swipe if offset > 60px
  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number } }) => {
      if (info.offset.x < -60) goNext();
      else if (info.offset.x > 60) goPrev();
    },
    [goNext, goPrev]
  );

  const rootSem = NOTE_TO_SEMITONE[rootNote] ?? 0;
  const boxPositions = generateBoxPositions(rootNote, scale.intervals);

  // Track translateX: shift left by activeCard × (cardWidth + gap), offset by PEEK
  const trackX = PEEK - activeCard * (cardWidth + CARD_GAP);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="scale-modal-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      >
        <motion.div
          key="scale-modal-content"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="flex flex-col w-full h-full"
        >
          {/* ── Modal header ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 pt-safe pt-5 pb-3 flex-shrink-0">
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
              className="flex-shrink-0 w-11 h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* ── Carousel viewport ─────────────────────────────────────── */}
          {/* overflow-hidden clips adjacent cards; ref used for width measurement */}
          <div ref={viewportRef} className="flex-1 overflow-hidden relative">
            {cardWidth > 0 ? (
              <motion.div
                className="flex absolute inset-y-0"
                style={{ gap: CARD_GAP, left: 0, right: 0 }}
                animate={{ x: trackX }}
                transition={{ type: 'spring', damping: 34, stiffness: 360 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
              >
                {CARD_DEFS.map((card, cardIdx) => {
                  const isActive = cardIdx === activeCard;

                  return (
                    <motion.div
                      key={card.id}
                      className="flex-shrink-0 flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden relative"
                      style={{ width: cardWidth, minWidth: cardWidth }}
                      animate={{ opacity: isActive ? 1 : 0.45, scale: isActive ? 1 : 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Per-card X button (top-right corner) */}
                      <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-zinc-800/90 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                        aria-label="Close modal"
                      >
                        <X className="w-4 h-4 text-zinc-400" />
                      </button>

                      {/* Scrollable fretboard content */}
                      <div className="flex-1 overflow-y-auto overscroll-contain">
                        <div className="px-3 pt-3 pb-2">
                          {/* Subtitle */}
                          <p className="text-[11px] text-zinc-500 font-medium mb-3 px-1 pr-10">
                            {card.subtitle}
                          </p>

                          {/* 5 box position diagrams */}
                          <div className="space-y-3">
                            {boxPositions.map((pos, posIdx) => {
                              const fretDots: FretDot[] = pos.dots.map((dot) => {
                                const isOpenString = dot.fret === 0;
                                let label: string;
                                if (card.id === 'finger') {
                                  label = buildFingerLabel(dot, pos.startFret);
                                } else if (card.id === 'notes') {
                                  label = buildNoteLabel(dot, rootSem);
                                } else {
                                  label = buildDegreeLabel(dot, scale.id);
                                }
                                return {
                                  stringIndex: dot.stringIndex,
                                  fret: dot.fret,
                                  label,
                                  isRoot: dot.isRoot,
                                  isOpenString,
                                };
                              });

                              return (
                                <div
                                  key={posIdx}
                                  className="bg-zinc-950 rounded-xl p-2 border border-zinc-800"
                                >
                                  <HorizontalScaleFretboard
                                    dots={fretDots}
                                    startFret={pos.startFret}
                                    positionLabel={pos.label}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Legend */}
                          <div className="flex items-center gap-4 mt-3 px-1 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <svg width="14" height="14" viewBox="0 0 14 14">
                                <polygon points="7,1 13,7 7,13 1,7" fill="#06b6d4" />
                              </svg>
                              <span className="text-[10px] text-zinc-500">Root (fretted)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg width="14" height="14" viewBox="0 0 14 14">
                                <polygon points="7,1 13,7 7,13 1,7" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
                              </svg>
                              <span className="text-[10px] text-zinc-500">Root (open)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                              <span className="text-[10px] text-zinc-500">Scale (fretted)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500" />
                              <span className="text-[10px] text-zinc-500">Scale (open)</span>
                            </div>
                          </div>

                          <div className="h-4" />
                        </div>
                      </div>

                      {/* ── Card footer: arrows + progress dots ─────────── */}
                      <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900 px-3 py-3 flex items-center justify-between gap-2">
                        {/* Prev arrow */}
                        <button
                          onClick={goPrev}
                          disabled={activeCard === 0}
                          className="flex items-center gap-1 text-zinc-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors min-w-[72px]"
                          aria-label="Previous card"
                        >
                          <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                          <span className="text-[11px] font-semibold leading-tight text-left">
                            {activeCard > 0 ? CARD_DEFS[activeCard - 1].title : ''}
                          </span>
                        </button>

                        {/* Progress dots */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {CARD_DEFS.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              onClick={() => setActiveCard(dotIdx)}
                              className={`rounded-full transition-all duration-200 ${
                                dotIdx === activeCard
                                  ? 'bg-cyan-500 w-6 h-2.5'
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
                          className="flex items-center gap-1 text-zinc-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors justify-end min-w-[72px]"
                          aria-label="Next card"
                        >
                          <span className="text-[11px] font-semibold leading-tight text-right">
                            {activeCard < CARD_DEFS.length - 1 ? CARD_DEFS[activeCard + 1].title : ''}
                          </span>
                          <ChevronRight className="w-5 h-5 flex-shrink-0" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              // Fallback while width is being measured
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
