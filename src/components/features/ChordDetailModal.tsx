import { X, Hand, Edit, Volume2 } from 'lucide-react';
import { ChordData } from '@/types/chord';

interface ChordDetailModalProps {
  chord: ChordData;
  isOpen: boolean;
  onClose: () => void;
  onPlay?: () => void;
  onEdit?: () => void;
  currentIndex?: number;
  totalChords?: number;
}

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];
const FINGER_NAMES = ['', 'Index', 'Middle', 'Ring', 'Pinky'];

export default function ChordDetailModal({
  chord,
  isOpen,
  onClose,
  onPlay,
  onEdit,
  currentIndex = 0,
  totalChords = 0,
}: ChordDetailModalProps) {
  if (!isOpen) return null;

  // Calculate which strings are muted, open, or fretted
  const stringStates = chord.frets.map((fret, idx) => {
    if (fret === -1) return { state: 'muted', fret: -1, finger: null };
    if (fret === 0) return { state: 'open', fret: 0, finger: null };
    
    // Find finger number for this string
    const fingerIndex = chord.fingers?.[idx] || null;
    return { state: 'fretted', fret, finger: fingerIndex };
  });

  // Determine if string is root note (A string for A Major, etc.)
  const rootStringIndex = chord.rootString !== undefined ? chord.rootString : 
    STRINGS.findIndex(s => s.toLowerCase() === chord.root.toLowerCase());

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-950 border-2 border-cyan-500/40 rounded-xl w-full max-w-sm shadow-2xl shadow-cyan-500/10 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-zinc-800/50">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-5xl font-black text-white">
                  {chord.root}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <span className="px-2.5 py-0.5 bg-zinc-800/60 text-zinc-300 text-[10px] font-semibold uppercase tracking-wide rounded">
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
                className="text-zinc-500 hover:text-white transition-colors -mt-1 -mr-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-zinc-400 text-sm">
              {chord.root} {chord.type}
            </div>
          </div>

          {/* Diagram Section */}
          <div className="p-6 flex gap-4">
            {/* Chord Diagram */}
            <div className="flex-1">
              <svg width="160" height="200" viewBox="0 0 160 200" className="select-none">
                {/* Nut (thick top line) */}
                <rect x="20" y="20" width="120" height="4" fill="currentColor" className="text-zinc-600" />

                {/* Fret lines */}
                {[1, 2, 3, 4].map((fret) => (
                  <line
                    key={`fret-${fret}`}
                    x1="20"
                    y1={20 + fret * 35}
                    x2="140"
                    y2={20 + fret * 35}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-zinc-600"
                  />
                ))}

                {/* String lines */}
                {[0, 1, 2, 3, 4, 5].map((string) => (
                  <line
                    key={`string-${string}`}
                    x1={20 + string * 24}
                    y1="20"
                    x2={20 + string * 24}
                    y2="160"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-zinc-600"
                  />
                ))}

                {/* Muted/Open markers above nut */}
                {chord.frets.map((fret, idx) => {
                  if (fret === -1) {
                    // Muted - X
                    return (
                      <text
                        key={`marker-${idx}`}
                        x={20 + idx * 24}
                        y="12"
                        textAnchor="middle"
                        className="text-zinc-500 text-xs font-bold"
                      >
                        ✕
                      </text>
                    );
                  } else if (fret === 0) {
                    // Open - circle
                    return (
                      <circle
                        key={`marker-${idx}`}
                        cx={20 + idx * 24}
                        cy={8}
                        r="5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-zinc-500"
                      />
                    );
                  }
                  return null;
                })}

                {/* Finger dots */}
                {chord.frets.map((fret, stringIdx) => {
                  if (fret > 0) {
                    const isRoot = stringIdx === rootStringIndex;
                    const fingerNum = chord.fingers?.[stringIdx];

                    if (isRoot) {
                      // Root note - blue diamond
                      return (
                        <g key={`dot-${stringIdx}`}>
                          <path
                            d={`M ${20 + stringIdx * 24} ${20 + (fret - 0.5) * 35 - 8} 
                                L ${20 + stringIdx * 24 + 8} ${20 + (fret - 0.5) * 35} 
                                L ${20 + stringIdx * 24} ${20 + (fret - 0.5) * 35 + 8} 
                                L ${20 + stringIdx * 24 - 8} ${20 + (fret - 0.5) * 35} Z`}
                            fill="currentColor"
                            className="text-cyan-500"
                          />
                        </g>
                      );
                    } else {
                      // Regular finger dot - orange circle with number
                      return (
                        <g key={`dot-${stringIdx}`}>
                          <circle
                            cx={20 + stringIdx * 24}
                            cy={20 + (fret - 0.5) * 35}
                            r="10"
                            fill="currentColor"
                            className="text-amber-500"
                          />
                          {fingerNum && (
                            <text
                              x={20 + stringIdx * 24}
                              y={20 + (fret - 0.5) * 35 + 1}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-zinc-950 text-sm font-black"
                            >
                              {fingerNum}
                            </text>
                          )}
                        </g>
                      );
                    }
                  }
                  return null;
                })}

                {/* Barres */}
                {chord.barres?.map((barreFret, barreIdx) => {
                  const stringsOnBarre = chord.frets
                    .map((f, idx) => (f === barreFret ? idx : -1))
                    .filter(idx => idx !== -1);
                  
                  if (stringsOnBarre.length < 2) return null;
                  
                  const minString = Math.min(...stringsOnBarre);
                  const maxString = Math.max(...stringsOnBarre);

                  return (
                    <line
                      key={`barre-${barreIdx}`}
                      x1={20 + minString * 24}
                      y1={20 + (barreFret - 0.5) * 35}
                      x2={20 + maxString * 24}
                      y2={20 + (barreFret - 0.5) * 35}
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="text-amber-500"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Tablature Notation */}
            <div className="bg-white rounded-lg px-3 py-2 text-xs font-mono self-start shadow-lg">
              {chord.frets.map((fret, idx) => (
                <div key={idx} className="flex gap-2 items-center py-0.5">
                  <span className="text-zinc-800 font-bold w-3">{STRINGS[idx]}</span>
                  <span className="text-zinc-400">—</span>
                  <span className="text-zinc-900 font-bold w-3 text-center">
                    {fret === -1 ? 'x' : fret === 0 ? '0' : fret}
                  </span>
                  <span className="text-zinc-400">—</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-4 flex items-center gap-3">
            <button
              onClick={onPlay}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              Play
            </button>
            <button
              onClick={onEdit}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>

          {/* Pagination */}
          {totalChords > 0 && (
            <div className="px-6 pb-3 text-center text-xs text-zinc-500">
              {currentIndex + 1} / {totalChords}
            </div>
          )}

          {/* Finger Positions */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-2 mb-3 text-zinc-500 text-xs font-semibold uppercase tracking-wide">
              <Hand className="w-4 h-4" />
              Finger Positions
            </div>

            <div className="space-y-1">
              {stringStates.map((state, idx) => {
                const stringName = STRINGS[idx];
                const stringNumber = 6 - idx;
                const isRoot = idx === rootStringIndex;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0"
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
