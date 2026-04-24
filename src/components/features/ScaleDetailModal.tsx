/**
 * ScaleDetailModal
 *
 * Visual design mirrors ChordDetailModal:
 *   • bg-zinc-950 card, border-[3px] border-cyan-500/40
 *   • Title bar INSIDE each card: root·scale name (21px) + card title (15px) + X
 *   • 3-card horizontal carousel with CSS scroll-snap-type: x mandatory
 *     → browser guarantees snap-to-center on every swipe; zero Framer Motion
 *       driver conflict; works with both touch swipe and pointer drag
 *   • 32px peek on each side; progress dots at card bottom; arrow nav
 *   • Each card scrolls vertically to fit all 5 pattern diagrams
 *   • Finger legend rendered in scrollable content above Pattern I (Finger card only)
 *   • Fretboard rendering: HorizontalScaleFretboard (dark bg, SVGChordDiagram dot style)
 *
 * Carousel snap architecture:
 *   • Single horizontally-scrollable container (overflow-x: scroll, scroll-snap-type: x mandatory)
 *   • Each card has scroll-snap-align: center
 *   • Arrow buttons + dot buttons call scrollTo({ behavior: 'smooth' })
 *   • onScroll handler tracks activeCard for dot indicators and disabled states
 *   • Eliminates the Framer Motion animate/drag conflict that caused the "hang"
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

/** px of adjacent card visible on each side */
const PEEK = 32;

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

  // scrollRef: the horizontally-scrollable snap container
  const scrollRef  = useRef<HTMLDivElement>(null);
  // wrapRef: outer div used to measure available width
  const wrapRef    = useRef<HTMLDivElement>(null);
  const rafRef     = useRef<number | null>(null);
  // Prevent onScroll from fighting programmatic scrollTo
  const scrollingRef = useRef(false);

  // Hide fixed app header while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const header = document.querySelector('header') as HTMLElement | null;
    if (header) header.style.visibility = 'hidden';
    return () => { if (header) header.style.visibility = ''; };
  }, [isOpen]);

  // Measure card width: full container minus peek on each side
  useEffect(() => {
    if (!isOpen) return;
    const measure = () => {
      if (wrapRef.current) {
        const vw = wrapRef.current.offsetWidth;
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

  // Reset to card 0 when scale or root changes
  useEffect(() => {
    setActiveCard(0);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [scale.id, rootNote]);

  // Programmatic scroll to a given card index
  const scrollToCard = useCallback((idx: number) => {
    if (!scrollRef.current || cardWidth === 0) return;
    const clamped = Math.max(0, Math.min(CARD_DEFS.length - 1, idx));
    setActiveCard(clamped);
    scrollingRef.current = true;
    // Each card occupies (cardWidth + gap). With scroll-snap-align:center and
    // padding-inline:PEEK, card i centers at scrollLeft = i * (cardWidth + gap)
    // where gap matches the CSS gap value (10px).
    scrollRef.current.scrollTo({ left: clamped * (cardWidth + 10), behavior: 'smooth' });
    // Release the guard after the smooth scroll settles (~400ms)
    setTimeout(() => { scrollingRef.current = false; }, 450);
  }, [cardWidth]);

  const goNext = useCallback(() => scrollToCard(activeCard + 1), [activeCard, scrollToCard]);
  const goPrev = useCallback(() => scrollToCard(activeCard - 1), [activeCard, scrollToCard]);

  // Derive activeCard from scroll position so progress dots stay in sync
  // after a native touch swipe (the user didn't use the buttons)
  const handleScroll = useCallback(() => {
    if (scrollingRef.current || !scrollRef.current || cardWidth === 0) return;
    const idx = Math.round(scrollRef.current.scrollLeft / (cardWidth + 10));
    const clamped = Math.max(0, Math.min(CARD_DEFS.length - 1, idx));
    setActiveCard(clamped);
  }, [cardWidth]);

  const rootSem  = NOTE_TO_SEMITONE[rootNote] ?? 0;
  const patterns = resolvePatterns(scale, rootNote);

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
        className="fixed inset-0 z-[100] flex flex-col lg:items-center lg:justify-center"
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
          className="flex flex-col w-full h-full lg:w-[50vw] lg:max-w-3xl lg:h-[70vh] lg:rounded-2xl lg:overflow-hidden lg:shadow-2xl lg:shadow-black/60"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
        >
          {/* ── Carousel wrapper (position:relative for circle arrow overlays) ── */}
          <div ref={wrapRef} className="flex-1 relative min-h-0 overflow-hidden">

            {/* ── Circle arrow overlays — vertically centred, z-above the track ── */}
            {cardWidth > 0 && (
              <>
                <button
                  onClick={goPrev}
                  disabled={activeCard === 0}
                  aria-label="Previous card"
                  className="
                    absolute left-1 top-1/2 -translate-y-1/2 z-20
                    w-9 h-9 rounded-full
                    bg-zinc-900/80 backdrop-blur-sm
                    border-2 border-cyan-500/60
                    flex items-center justify-center
                    text-cyan-400 hover:text-white hover:border-cyan-400
                    disabled:opacity-20 disabled:cursor-not-allowed
                    transition-all duration-150
                    shadow-lg shadow-black/40
                  "
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  disabled={activeCard === CARD_DEFS.length - 1}
                  aria-label="Next card"
                  className="
                    absolute right-1 top-1/2 -translate-y-1/2 z-20
                    w-9 h-9 rounded-full
                    bg-zinc-900/80 backdrop-blur-sm
                    border-2 border-cyan-500/60
                    flex items-center justify-center
                    text-cyan-400 hover:text-white hover:border-cyan-400
                    disabled:opacity-20 disabled:cursor-not-allowed
                    transition-all duration-150
                    shadow-lg shadow-black/40
                  "
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {cardWidth > 0 ? (
              /*
               * ── CSS scroll-snap carousel track ────────────────────────────
               * scroll-snap-type: x mandatory  → browser enforces snap after EVERY
               *   swipe/drag release; no partial positions possible
               * scroll-snap-align: center on each card → cards snap to horizontal center
               * padding-inline: PEEK  → adjacent cards peek by PEEK px each side
               * gap: 10px  → gap between cards (matches scrollToCard calculation)
               * scrollbar-width: none  → hidden scrollbar
               */
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex h-full"
                style={{
                  overflowX: 'scroll',
                  overflowY: 'hidden',
                  scrollSnapType: 'x mandatory',
                  scrollBehavior: 'auto',  // smooth is handled by scrollTo({behavior:'smooth'})
                  WebkitOverflowScrolling: 'touch',
                  paddingInline: PEEK,
                  gap: 10,
                  // Hide scrollbar cross-browser
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <style>{`
                  .sdm-track::-webkit-scrollbar { display: none; }
                `}</style>

                {CARD_DEFS.map((cardDef, cardIdx) => {
                  const isActive = cardIdx === activeCard;

                  return (
                    <div
                      key={cardDef.id}
                      className="flex-shrink-0 flex flex-col rounded-xl bg-zinc-950 border-[3px] border-cyan-500/40 shadow-2xl shadow-cyan-500/10 overflow-hidden"
                      style={{
                        width: cardWidth,
                        minWidth: cardWidth,
                        scrollSnapAlign: 'center',
                        opacity: isActive ? 1 : 0.45,
                        transform: isActive ? 'scale(1)' : 'scale(0.97)',
                        transition: 'opacity 0.2s, transform 0.2s',
                      }}
                    >
                      {/* ── Card title bar ─────────────────────────────────── */}
                      <div className="flex-shrink-0 bg-zinc-900 border-b border-cyan-500/30 px-3 pt-3 pb-2.5">
                        {/* Top row: title text + X */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            {/* Line 1: root + scale name — 21px, cyan */}
                            <p className="text-[21px] font-bold text-cyan-400 leading-tight tracking-tight truncate">
                              {rootNote} {scale.name}
                            </p>
                            {/* Line 2: card title — 15px, white */}
                            <p className="text-[15px] font-bold text-white leading-tight mt-0.5">
                              {cardDef.title}
                            </p>
                            {'subtitle' in cardDef && cardDef.subtitle && (
                              <p className="text-[10px] text-zinc-500 font-medium leading-snug mt-1">
                                {cardDef.subtitle}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={onClose}
                            className="flex-shrink-0 text-zinc-400 hover:text-white transition-colors mt-0.5"
                            aria-label="Close modal"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* ── Progress dots — centered below title, above content ── */}
                        <div className="flex justify-center items-center gap-1.5 mt-2.5">
                          {CARD_DEFS.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              onClick={() => scrollToCard(dotIdx)}
                              className="p-0 bg-transparent border-0 flex items-center justify-center"
                              style={{ lineHeight: 0 }}
                              aria-label={`Go to ${CARD_DEFS[dotIdx].title}`}
                            >
                              <span
                                className={`rounded-full block transition-all duration-200 ${
                                  dotIdx === activeCard ? 'bg-cyan-500' : 'bg-zinc-600'
                                }`}
                                style={dotIdx === activeCard ? { width: 8, height: 8 } : { width: 6, height: 6 }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── Scrollable pattern content ────────────────────── */}
                      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
                        <div className="px-3 pt-3 pb-2 space-y-3">

                          {/* Finger legend — only on Finger card, above Pattern I */}
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
                              {/* Cyan diamond = Root — inline after Pinky */}
                              <div className="flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                                  <polygon points="7,1 13,7 7,13 1,7" fill="#06b6d4" />
                                </svg>
                                <span className="text-[11px] text-zinc-400 font-medium">Root</span>
                              </div>
                            </div>
                          )}

                          {/* ── Symbol legend — moved here (below finger legend on Finger card, */}
                          {/* top of content on Notes/Intervals cards); removed from bottom    */}
                          <div className="pb-1 border-b border-zinc-800/50">
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

                          <div className="h-2" />
                        </div>
                      </div>

                      {/* ── Card footer: prev / progress dots / next ──────── */}
                      <div className="flex-shrink-0 border-t border-zinc-800/50 px-3 py-2.5 flex items-center justify-between gap-2 bg-zinc-950">
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

                        {/* Spacer — dots removed from footer, now live in title bar */}
                        <div className="flex-1" />

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
                    </div>
                  );
                })}
              </div>
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
