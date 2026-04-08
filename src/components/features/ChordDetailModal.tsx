import { X, Hand, Edit, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { ChordData } from '@/types/chord';
import { SVGChordDiagram } from '@/components/features/SVGChordDiagram';
import type { CustomChordData } from '@/types/customChord';

interface ChordDetailModalProps {
  chord: ChordData;
  isOpen: boolean;
  onClose: () => void;
  onPlay?: () => void;
  onEdit?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  currentIndex?: number;
  totalChords?: number;
}

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];
const REVERSED_STRINGS = ['e', 'B', 'G', 'D', 'A', 'E']; // High to low for tablature display
const FINGER_NAMES = ['', 'Index', 'Middle', 'Ring', 'Pinky'];

export default function ChordDetailModal({
  chord,
  isOpen,
  onClose,
  onPlay,
  onEdit,
  onNext,
  onPrevious,
  currentIndex = 0,
  totalChords = 0,
}: ChordDetailModalProps) {
  const canGoNext = currentIndex < totalChords - 1;
  const canGoPrevious = currentIndex > 0;

  // Hide the fixed header so the modal card isn't clipped on mobile
  useEffect(() => {
    if (!isOpen) return;
    const header = document.querySelector('header') as HTMLElement | null;
    if (header) header.style.visibility = 'hidden';
    return () => {
      if (header) header.style.visibility = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate which strings are muted, open, or fretted
  const stringStates = chord.frets.map((fret, idx) => {
    if (fret === -1) return { state: 'muted', fret: -1, finger: null };
    if (fret === 0) return { state: 'open', fret: 0, finger: null };
    
    // Find finger number for this string
    const fingerIndex = chord.fingers?.[idx] || null;
    return { state: 'fretted', fret, finger: fingerIndex };
  });

  // Extract root note from chord name (e.g., "C Major" -> "C", "A#" -> "A#")
  const extractRoot = (chordName: string): string => {
    const match = chordName.match(/^([A-G][#b]?)/);
    return match ? match[1] : 'C';
  };
  
  const rootNote = extractRoot(chord.name);
  
  // Determine if string is root note (A string for A Major, etc.)
  const rootStringIndex = chord.rootNoteString !== undefined ? chord.rootNoteString : 
    STRINGS.findIndex(s => s.toLowerCase() === rootNote.toLowerCase());

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pt-4 pb-16">
        <div className="bg-zinc-950 border-2 border-cyan-500/40 rounded-xl w-full max-w-sm shadow-2xl shadow-cyan-500/10 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
          {/* Header */}
          <div className="p-3 pb-2 border-b border-zinc-800/50 flex-shrink-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-5xl font-black text-white">
                  {chord.symbol}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded ${
                      chord.category === 'open'    ? 'bg-emerald-500/15 text-emerald-400'
                      : chord.category === 'barre'   ? 'bg-purple-500/15 text-purple-400'
                      : chord.category === 'movable' ? 'bg-yellow-400/15 text-yellow-300'
                      : 'bg-zinc-800/60 text-zinc-300'
                    }`}>
                      {chord.category}
                    </span>
                    <span className="px-2.5 py-0.5 bg-zinc-800/60 text-zinc-300 text-[10px] font-semibold uppercase tracking-wide rounded">
                      {chord.type}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors -mt-1 -mr-1 p-1"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
            <div className="text-zinc-400 text-sm">
              {chord.name}
            </div>
          </div>

          {/* Diagram Section */}
          <div className="p-3 flex gap-3 items-start flex-shrink-0">
            {/* Diagram + tab shifted right so the high-E string edge tracks the play button's right edge */}
            <div className="flex gap-3 items-start ml-auto flex-shrink-0">
            <div className="flex-shrink-0">
              {(chord as any).isCustom ? (
                <SVGChordDiagram
                  isCustom
                  chord={{
                    id: chord.id,
                    name: chord.name,
                    symbol: chord.symbol,
                    baseFret: chord.baseFret,
                    numFrets: (chord as any).numFrets ?? 5,
                    markers: (chord as any).customMarkers ?? [],
                    barres: (chord as any).customBarres ?? [],
                    mutedStrings: new Set<number>((chord as any).customMutedStrings ?? []),
                    openStrings: new Set<number>((chord as any).customOpenStrings ?? []),
                    openDiamonds: new Set<number>((chord as any).customOpenDiamonds ?? []),
                    chordType: chord.type,
                    chordCategory: chord.category,
                    sourceChordId: (chord as any).sourceChordId,
                    createdAt: 0,
                    updatedAt: 0,
                  } as CustomChordData}
                  size="lg"
                  libraryMode
                />
              ) : (
                <SVGChordDiagram chord={chord} size="lg" />
              )}
            </div>

            {/* Tablature Notation */}
            <div className="bg-white rounded-lg px-3 py-2 pb-3 text-base font-mono shadow-lg flex-shrink-0 self-start mt-9 mr-1">
              {[...chord.frets].reverse().map((fret, idx) => (
                <div key={idx} className="flex gap-1 items-center py-0.5">
                  <span className="text-zinc-800 font-bold w-3">{REVERSED_STRINGS[idx]}</span>
                  <span className="text-zinc-400">—</span>
                  <span className="text-zinc-900 font-bold w-4 text-center">
                    {fret === -1 ? 'x' : fret === 0 ? '0' : fret}
                  </span>
                  <span className="text-zinc-400">—</span>
                </div>
              ))}
              {/* Tab Label */}
              <div className="text-center text-black font-bold mt-2" style={{ fontSize: '18px' }}>
                Tab
              </div>
            </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-3 pb-1 flex flex-col items-center gap-2 flex-shrink-0">
            <button
              onClick={onPlay}
              className="w-[52px] h-[52px] bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg flex items-center justify-center transition-colors active:scale-95 border border-amber-500/25"
            >
              <Volume2 className="w-8 h-8 stroke-[2.5]" />
            </button>
            {/* FIX #6: Only show Edit button if onEdit handler is provided */}
            {onEdit && (
              <button
                onClick={onEdit}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {/* Pagination */}
          {totalChords > 0 && (
            <div className="px-3 pb-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <button
                  onClick={onPrevious}
                  disabled={!canGoPrevious}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous chord"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                
                <div className="text-center text-sm text-zinc-400">
                  <span className="font-bold text-white">{currentIndex + 1}</span> / {totalChords}
                </div>
                
                <button
                  onClick={onNext}
                  disabled={!canGoNext}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next chord"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Finger Positions */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 mb-1 text-zinc-500 text-xs font-semibold uppercase tracking-wide bg-zinc-950 py-1 z-10">
              <Hand className="w-4 h-4" />
              Finger Positions
            </div>

            <div className="space-y-0.5">
              {[...stringStates].reverse().map((state, reversedIdx) => {
                const idx = stringStates.length - 1 - reversedIdx; // Original index (5, 4, 3, 2, 1, 0)
                const stringName = STRINGS[idx]; // e, B, G, D, A, E (high to low)
                const stringNumber = reversedIdx + 1; // 1st, 2nd, 3rd, 4th, 5th, 6th string
                const isRoot = idx === rootStringIndex;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 border-b border-zinc-800/50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-sm font-medium w-12">
                        {stringName} ({stringNumber}th)
                      </span>
                      {isRoot && (
                        <div className="w-2 h-2 rotate-45 bg-cyan-500" />
                      )}
                    </div>

                    {state.state === 'muted' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-600 text-sm">Muted</span>
                        <span className="text-zinc-700 text-sm w-12 text-right">—</span>
                      </div>
                    ) : state.state === 'open' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-500 text-sm font-semibold">Open</span>
                        <span className="text-zinc-700 text-sm w-12 text-right">—</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-white text-sm">Fret {state.fret}</span>
                        <span className="text-zinc-500 text-sm w-12 text-right">
                          {state.finger ? FINGER_NAMES[state.finger] : '—'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
