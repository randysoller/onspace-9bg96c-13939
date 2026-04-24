/**
 * ScaleDetailModal
 *
 * Visual design mirrors ChordDetailModal:
 *   • bg-zinc-950 card, border-2 border-cyan-500/40
 *   • Title bar INSIDE each card: root·scale name + card title (both 15px) + X
 *   • 3-card horizontal swipe carousel (Finger Patterns / Note Names / Interval Patterns)
 *   • 40px peek on each side; progress dots at card bottom; arrow nav
 *   • Each card scrolls vertically to fit all 5 pattern diagrams
 *   • Finger legend ("1=Index…") rendered in scrollable content above Pattern I (Finger card only)
 *   • Fretboard rendering: HorizontalScaleFretboard (dark bg, SVGChordDiagram dot style)
 *
 * Data source:
 *   • Major, Natural Minor, Major Pentatonic, Minor Pentatonic → hard-coded 5-position CAGED patterns
 *   • All other scales → algorithmic box-position generator
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScaleVaultEntry } from '@/constants/scales';
import HorizontalScaleFretboard, { type FretDot } from './HorizontalScaleFretboard';
import {
  getMajorScalePatterns,
  getMinorScalePatterns,
  getMajorPentPatterns,
  getMinorPentPatterns,
  type ResolvedPattern,
} from '@/constants/scalePatterns';

// ── Music-theory helpers ───────────────────────────────────────────────────────

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

/** string 0 = high e, string 5 = low E  (open semitones from C mod 12) */
const OPEN_STRING_SEM = [4, 11, 7, 2, 9, 4]; // e B G D A E

const SEMITONE_TO_DEGREE: Record<number, string> = {
  0: '1', 1: 'b2', 2: '2',  3: 'b3',
  4: '3', 5: '4',  6: 'b5', 7: '5',
  8: 'b6', 9: '6', 10: 'b7', 11: '7',
};

const SCALE_DEGREE_OVERRIDES: Partial<Record<string, Partial<Record<number, string>>>> = {
  'lydian': { 6: '#4' }, 'lydian-augmented': { 6: '#4' },
  'lydian-dominant': { 6: '#4' }, 'lydian-flat3': { 6: '#4' },
  'lydian-sharp2': { 6: '#4' }, 'lydian-sharp2-sharp6': { 6: '#4' },
  'lydian-augmented-sharp2': { 6: '#4' }, 'dorian-sharp4': { 6: '#4' },
};

const NOTE_NAMES_CHROM = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// ── Algorithmic box-position generator (fallback for non-hardcoded scales) ────

interface BoxDot {
  string: number;
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
  const intervalSet = new Set(intervals);

  const anchors: number[] = [];
  OPEN_STRING_SEM.forEach((openSem) => {
    for (let fret = 0; fret <= 15; fret++) {
      if ((openSem + fret) % 12 === rootSem) {
        anchors.push(Math.max(0, fret - 1));
        break;
      }
    }
  });

  anchors.sort((a, b) => a - b);
  const dedup: number[] = [];
  anchors.forEach((f) => {
    if (dedup.length === 0 || f - dedup[dedup.length - 1] > 2) dedup.push(f);
  });
  while (dedup.length < 5) dedup.push((dedup[dedup.length - 1] ?? 0) + 3);

  return dedup.slice(0, 5).map((startFret, posIdx) => {
    const dots: BoxDot[] = [];
    OPEN_STRING_SEM.forEach((openSem, strIdx) => {
      for (let fret = startFret; fret <= startFret + 4; fret++) {
        const noteSem = (openSem + fret) % 12;
        const interval = (noteSem - rootSem + 12) % 12;
        if (intervalSet.has(interval)) {
          dots.push({ string: strIdx, fret, interval, isRoot: interval === 0 });
        }
      }
    });
    const label = `Position ${posIdx + 1}${startFret === 0 ? ' — Open' : ` — Fret ${startFret}`}`;
    return { startFret, dots, label };
  });
}

// ── Label builders ─────────────────────────────────────────────────────────────

function noteLabel(interval: number, rootSem: number): string {
  return NOTE_NAMES_CHROM[(rootSem + interval) % 12] ?? '?';
}

function degreeLabel(interval: number, scaleId: string): string {
  return SCALE_DEGREE_OVERRIDES[scaleId]?.[interval] ?? SEMITONE_TO_DEGREE[interval] ?? String(interval);
}

// ── Card metadata ──────────────────────────────────────────────────────────────

const CARD_DEFS = [
  {
    id: 'finger',
    title: 'Finger Patterns',
    // subtitle rendered below title bar, above Pattern I in scrollable content
  },
  {
    id: 'notes',
    title: 'Note Names',
    subtitle: 'Note name on each dot  ·  Cyan = root  ·  Amber = scale tone',
  },
  {
    id: 'intervals',
    title: 'Interval Patterns',
    subtitle: 'Scale degrees relative to root  ·  1 = root',
  },
];

// ── Layout constants ───────────────────────────────────────────────────────────

const PEEK     = 40;   // px of adjacent card visible each side
const CARD_GAP = 12;

// ── Pattern resolver ───────────────────────────────────────────────────────────

interface DisplayPattern {
  label: string;
  startFret: number;
  dots: Array<{
    string: number;
    fret: number;
    finger: number;
    isRoot: boolean;
    isOpenString: boolean;
    interval: number;
  }>;
}

const HARDCODED_RESOLVERS: Partial<Record<string, (root: string) => ResolvedPattern[]>> = {
  'major':            getMajorScalePatterns,
  'minor':            getMinorScalePatterns,
  'major-pentatonic': getMajorPentPatterns,
  'minor-pentatonic': getMinorPentPatterns,
};

function resolvePatterns(scale: ScaleVaultEntry, rootNote: string): DisplayPattern[] {
  const hardcodedResolver = HARDCODED_RESOLVERS[scale.id];
  if (hardcodedResolver) {
    return hardcodedResolver(rootNote).map((p: ResolvedPattern) => ({
      label: p.label,
      startFret: p.baseFret,
      dots: p.dots.map((d) => ({
        string: d.string,
        fret: d.fret,
        finger: d.finger,
        isRoot: d.isRoot,
        isOpenString: d.isOpenString,
        interval: (() => {
          const rootSem = NOTE_TO_SEMITONE[rootNote] ?? 0;
          const openSem = OPEN_STRING_SEM[d.string] ?? 0;
          return ((openSem + d.fret - rootSem) % 12 + 12) % 12;
        })(),
      })),
    }));
  }

  return generateBoxPositions(rootNote, scale.intervals).map((pos) => ({
    label: pos.label,
    startFret: pos.startFret,
    dots: pos.dots.map((d) => ({
      string: d.string,
      fret: d.fret,
      finger: Math.min(4, Math.max(1, d.fret === 0 ? 0 : d.fret - pos.startFret + 1)),
      isRoot: d.isRoot,
      isOpenString: d.fret === 0,
      interval: d.interval,
    })),
  }));
}

// ── Component ──────────────────────────────────────────────────────────────────

interface ScaleDetailModalProps {
  scale: ScaleVaultEntry;
  rootNote: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ScaleDetailModal({ scale, rootNote, isOpen, onClose }: ScaleDetailModalProps) {
  const [activeCard, setActiveCard] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Hide fixed app header while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const header = document.querySelector('header') as HTMLElement | null;
    if (header) header.style.visibility = 'hidden';
    return () => { if (header) header.style.visibility = ''; };
  }, [isOpen]);

  // Measure card width after paint (full viewport minus peek zones)
  useEffect(() => {
    if (!isOpen) return;
    const measure = () => {
      if (viewportRef.current) {
        const vw = viewportRef.current.offsetWidth;
        setCardWidth(Math.max(0, vw - PEEK * 2));
      }
    };
    rafRef.current = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', measure);
    };
  }, [isOpen]);

  // Reset carousel to card 0 when scale or root changes
  useEffect(() => { setActiveCard(0); }, [scale.id, rootNote]);

  const goNext = useCallback(() => setActiveCard((c) => Math.min(CARD_DEFS.length - 1, c + 1)), []);
  const goPrev = useCallback(() => setActiveCard((c) => Math.max(0, c - 1)), []);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number } }) => {
      if (info.offset.x < -60) goNext();
      else if (info.offset.x > 60) goPrev();
    },
    [goNext, goPrev],
  );

  const rootSem  = NOTE_TO_SEMITONE[rootNote] ?? 0;
  const patterns = resolvePatterns(scale, rootNote);
  // trackX: first card starts at PEEK; each subsequent card shifts left by (cardWidth + gap)
  const trackX   = PEEK - activeCard * (cardWidth + CARD_GAP);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Full-screen backdrop */}
      <motion.div
        key="sdm-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[100] flex flex-col"
        style={{
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        <motion.div
          key="sdm-content"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="flex flex-col w-full h-full"
        >
          {/*
           * NO global modal header — title bar lives inside each carousel card.
           * Carousel viewport takes the full screen height.
           */}

          {/* ── Carousel viewport ─────────────────────────────────────────── */}
          <div
            ref={viewportRef}
            className="flex-1 overflow-hidden relative min-h-0 pt-safe"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
          >
            {cardWidth > 0 ? (
              <motion.div
                className="flex absolute inset-y-0"
                style={{ gap: CARD_GAP, left: 0 }}
                animate={{ x: trackX }}
                transition={{ type: 'spring', damping: 34, stiffness: 360 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
              >
                {CARD_DEFS.map((cardDef, cardIdx) => {
                  const isActive = cardIdx === activeCard;

                  return (
                    <motion.div
                      key={cardDef.id}
                      className="flex-shrink-0 flex flex-col h-full rounded-xl bg-zinc-950 border-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/10 overflow-hidden relative"
                      style={{ width: cardWidth, minWidth: cardWidth }}
                      animate={{ opacity: isActive ? 1 : 0.45, scale: isActive ? 1 : 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/*
                       * ── Card title bar (replaces removed global header) ────────
                       * Both lines rendered at text-[15px] — same size, per spec.
                       * Background is bg-zinc-900 to visually separate from content.
                       */}
                      <div className="flex-shrink-0 bg-zinc-900 border-b border-cyan-500/30 px-3 pt-3 pb-2.5 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {/* Line 1: root + scale name — 15px, cyan accent */}
                          <p className="text-[15px] font-bold text-cyan-400 leading-tight tracking-tight truncate">
                            {rootNote} {scale.name}
                          </p>
                          {/* Line 2: card title — 15px, white */}
                          <p className="text-[15px] font-bold text-white leading-tight mt-0.5">
                            {cardDef.title}
                          </p>
                          {/* Subtitle for Notes and Intervals cards */}
                          {'subtitle' in cardDef && cardDef.subtitle && (
                            <p className="text-[10px] text-zinc-500 font-medium leading-snug mt-1">
                              {cardDef.subtitle}
                            </p>
                          )}
                        </div>
                        {/* X close button — top-right of title bar */}
                        <button
                          onClick={onClose}
                          className="flex-shrink-0 text-zinc-400 hover:text-white transition-colors mt-0.5"
                          aria-label="Close modal"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* ── Scrollable pattern content ─────────────────────────── */}
                      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
                        <div className="px-3 pt-3 pb-2 space-y-3">

                          {/*
                           * Finger legend — only on Finger card, above Pattern I.
                           * Moved OUT of the title bar subtitle into the content area.
                           */}
                          {cardDef.id === 'finger' && (
                            <div className="flex items-center gap-3 flex-wrap px-0.5 pb-1">
                              {[
                                { num: '1', name: 'Index' },
                                { num: '2', name: 'Middle' },
                                { num: '3', name: 'Ring' },
                                { num: '4', name: 'Pinky' },
                              ].map(({ num, name }) => (
                                <div key={num} className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-black text-white leading-none">{num}</span>
                                  </div>
                                  <span className="text-[11px] text-zinc-400 font-medium">{name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 5 pattern diagrams */}
                          {patterns.map((pos, posIdx) => {
                            const fretDots: FretDot[] = pos.dots.map((dot) => {
                              let label: string;
                              if (cardDef.id === 'finger') {
                                label = dot.isOpenString ? '0' : String(dot.finger);
                              } else if (cardDef.id === 'notes') {
                                label = noteLabel(dot.interval, rootSem);
                              } else {
                                label = degreeLabel(dot.interval, scale.id);
                              }
                              return {
                                string: dot.string,
                                fret: dot.fret,
                                label,
                                isRoot: dot.isRoot,
                                isOpenString: dot.isOpenString,
                              };
                            });

                            return (
                              <div key={posIdx} className="border border-zinc-800 rounded-lg p-2 bg-zinc-900/40">
                                <HorizontalScaleFretboard
                                  dots={fretDots}
                                  startFret={pos.startFret}
                                  positionLabel={pos.label}
                                />
                              </div>
                            );
                          })}

                          {/* Symbol legend — root/scale dot key at the bottom */}
                          <div className="pt-1 pb-1 border-t border-zinc-800/50">
                            <div className="flex items-center gap-4 px-0.5 flex-wrap">
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
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-[10px] text-zinc-500">Scale (fretted)</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full border-2 border-amber-500" />
                                <span className="text-[10px] text-zinc-500">Scale (open)</span>
                              </div>
                            </div>
                          </div>

                          <div className="h-2" />
                        </div>
                      </div>

                      {/* ── Card footer: prev / progress dots / next ───────────── */}
                      <div className="flex-shrink-0 border-t border-zinc-800/50 px-3 py-2.5 flex items-center justify-between gap-2 bg-zinc-950">
                        {/* Prev */}
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

                        {/* Next */}
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
