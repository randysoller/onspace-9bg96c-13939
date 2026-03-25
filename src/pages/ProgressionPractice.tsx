import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, SkipForward, ChevronRight, Save } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { progressionPracticeApi } from '@/lib/api/progressionPractice';
import { toast } from 'sonner';

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];

// Mock progression data - in real app this would come from store
const mockProgression = {
  key: 'C',
  scale: 'Major Scale',
  chords: [
    {
      root: 'C',
      type: 'major',
      category: 'Major',
      frets: [-1, 3, 2, 0, 1, 0],
      fingers: [0, 3, 2, 0, 1, 0],
      rootString: 4
    },
    {
      root: 'F',
      type: 'major',
      category: 'Major',
      frets: [-1, -1, 3, 2, 1, 1],
      fingers: [0, 0, 3, 2, 1, 1],
      rootString: 3
    },
    {
      root: 'G',
      type: 'major',
      category: 'Major',
      frets: [3, 2, 0, 0, 0, 3],
      fingers: [2, 1, 0, 0, 0, 3],
      rootString: 0
    },
    {
      root: 'C',
      type: 'major',
      category: 'Major',
      frets: [-1, 3, 2, 0, 1, 0],
      fingers: [0, 3, 2, 0, 1, 0],
      rootString: 4
    }
  ],
  romanNumerals: ['I', 'IV', 'V', 'I']
};

export default function ProgressionPractice() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const [showDiagram, setShowDiagram] = useState(true);
  const [sessionStartTime] = useState(new Date());
  const [completedCycles, setCompletedCycles] = useState(0);
  const [chordHistory, setChordHistory] = useState<{ chord: string; position: number; roman: string; timestamp: Date }[]>([]);

  const currentChord = mockProgression.chords[currentChordIndex];
  const currentRoman = mockProgression.romanNumerals[currentChordIndex];
  const rootStringIndex = currentChord.rootString !== undefined ? currentChord.rootString : -1;

  const handleNext = () => {
    // Track this chord in history
    const chord = mockProgression.chords[currentChordIndex];
    const roman = mockProgression.romanNumerals[currentChordIndex];
    setChordHistory(prev => [...prev, {
      chord: `${chord.root}${chord.type !== 'major' ? chord.type : ''}`,
      position: currentChordIndex + 1,
      roman,
      timestamp: new Date(),
    }]);

    if (currentChordIndex < mockProgression.chords.length - 1) {
      setCurrentChordIndex(currentChordIndex + 1);
      setProgress(0);
    } else {
      // Completed a full cycle
      setCompletedCycles(prev => prev + 1);
      setCurrentChordIndex(0);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setCurrentChordIndex(0);
    setProgress(0);
    setIsPlaying(false);
    setChordHistory([]);
  };

  const handleSaveAndExit = async () => {
    if (!user) {
      toast.error('Please sign in to save your progress');
      navigate('/');
      return;
    }

    try {
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);

      // Create progression session
      const session = await progressionPracticeApi.createSession({
        user_id: user.id,
        progression_name: `${mockProgression.romanNumerals.join('-')} in ${mockProgression.key}`,
        key: mockProgression.key,
        scale: mockProgression.scale,
        total_chords: mockProgression.chords.length,
        completed_cycles: completedCycles,
        duration_seconds: durationSeconds,
        started_at: sessionStartTime.toISOString(),
        ended_at: endTime.toISOString(),
      });

      // Create progression entries if any chords were played
      if (chordHistory.length > 0) {
        await progressionPracticeApi.createEntries(
          chordHistory.map(h => ({
            session_id: session.id,
            chord_name: h.chord,
            chord_position: h.position,
            roman_numeral: h.roman,
          }))
        );
      }

      toast.success(`Progression session saved! ${completedCycles} cycle${completedCycles !== 1 ? 's' : ''} completed`);
      navigate('/');
    } catch (err) {
      console.error('Failed to save progression session:', err);
      toast.error('Failed to save session');
      navigate('/');
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 40);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentChordIndex]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-black px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/progression-setup')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="text-center">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">Progression Practice</div>
            <div className="text-sm font-bold text-purple-500">{mockProgression.key} {mockProgression.scale}</div>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-zinc-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Progression Overview */}
      <div className="border-b border-zinc-800 bg-zinc-900/30 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            {mockProgression.chords.map((chord, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentChordIndex(idx)}
                  className={`relative px-6 py-3 rounded-lg border-2 transition-all ${
                    idx === currentChordIndex
                      ? 'bg-purple-500 border-purple-500 text-white font-bold scale-110'
                      : 'bg-zinc-900 border-zinc-700 text-white hover:border-purple-500/50'
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">{mockProgression.romanNumerals[idx]}</div>
                  <div className="text-lg font-bold">
                    {chord.root}
                    {chord.type !== 'major' ? chord.type : ''}
                  </div>
                  {idx === currentChordIndex && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-300 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
                {idx < mockProgression.chords.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chord Display */}
      <div className="flex items-center justify-center min-h-[calc(100vh-350px)] py-12">
        <div className="text-center">
          {/* Roman Numeral & Chord Name */}
          <div className="mb-8">
            <div className="text-6xl font-black text-purple-500 mb-2">
              {currentRoman}
            </div>
            <div className="text-9xl font-black text-white mb-3">
              {currentChord.root}
              {currentChord.type !== 'major' ? currentChord.type : ''}
            </div>
            <div className="text-xl text-zinc-500">
              {currentChord.root} {currentChord.category}
            </div>
            <div className="mt-4 text-sm text-zinc-600">
              Chord {currentChordIndex + 1} of {mockProgression.chords.length}
            </div>
          </div>

          {/* Chord Diagram & Tablature */}
          {showDiagram && (
            <div className="flex items-center justify-center gap-8">
              {/* Chord Diagram */}
              <div className="relative">
                <svg width="260" height="330" viewBox="0 0 260 330" className="select-none">
                  {/* Muted/Open strings at top */}
                  {currentChord.frets.map((fret, idx) => {
                    const isRoot = idx === rootStringIndex;
                    if (fret === -1) {
                      // Muted string - gray X, same size as open circles
                      return (
                        <text
                          key={`muted-${idx}`}
                          x={70 + idx * 32}
                          y={51}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#71717a"
                          className="font-bold"
                          style={{ fontSize: '29px' }}
                        >
                          ✕
                        </text>
                      );
                    } else if (fret === 0) {
                      if (isRoot) {
                        // Open root note - blue diamond border
                        return (
                          <path
                            key={`open-${idx}`}
                            d={`M ${70 + idx * 32} ${51 - 9} 
                                L ${70 + idx * 32 + 9} ${51} 
                                L ${70 + idx * 32} ${51 + 9} 
                                L ${70 + idx * 32 - 9} ${51} Z`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="text-cyan-500"
                          />
                        );
                      } else {
                        // Open - orange circle border
                        return (
                          <circle
                            key={`open-${idx}`}
                            cx={70 + idx * 32}
                            cy={51}
                            r="6.3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="text-amber-500"
                          />
                        );
                      }
                    }
                    return null;
                  })}

                  {/* Nut */}
                  <rect x="54" y="75" width="160" height="4" fill="currentColor" className="text-zinc-200" />

                  {/* Frets */}
                  {[1, 2, 3, 4].map((fret) => (
                    <line
                      key={`fret-${fret}`}
                      x1="54"
                      y1={75 + fret * 55}
                      x2="214"
                      y2={75 + fret * 55}
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-zinc-200"
                    />
                  ))}

                  {/* Strings */}
                  {[0, 1, 2, 3, 4, 5].map((string) => (
                    <line
                      key={`string-${string}`}
                      x1={70 + string * 32}
                      y1="75"
                      x2={70 + string * 32}
                      y2="295"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-zinc-200"
                    />
                  ))}

                  {/* Finger positions */}
                  {currentChord.frets.map((fret, stringIdx) => {
                    if (fret > 0) {
                      const isRoot = stringIdx === rootStringIndex;
                      const fingerNum = currentChord.fingers?.[stringIdx];

                      if (isRoot) {
                        return (
                          <g key={`dot-${stringIdx}`}>
                            <path
                              d={`M ${70 + stringIdx * 32} ${75 + (fret - 0.5) * 55 - 14} 
                                  L ${70 + stringIdx * 32 + 14} ${75 + (fret - 0.5) * 55} 
                                  L ${70 + stringIdx * 32} ${75 + (fret - 0.5) * 55 + 14} 
                                  L ${70 + stringIdx * 32 - 14} ${75 + (fret - 0.5) * 55} Z`}
                              fill="currentColor"
                              className="text-cyan-500"
                            />
                            {fingerNum && fingerNum > 0 && (
                              <text
                                x={70 + stringIdx * 32}
                                y={75 + (fret - 0.5) * 55 + 1}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-white text-base font-black"
                              >
                                {fingerNum}
                              </text>
                            )}
                          </g>
                        );
                      } else {
                        return (
                          <g key={`dot-${stringIdx}`}>
                            <circle
                              cx={70 + stringIdx * 32}
                              cy={75 + (fret - 0.5) * 55}
                              r="15"
                              fill="currentColor"
                              className="text-amber-500"
                            />
                            {fingerNum && fingerNum > 0 && (
                              <text
                                x={70 + stringIdx * 32}
                                y={75 + (fret - 0.5) * 55 + 1}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-white text-base font-black"
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
                </svg>
              </div>

              {/* Tablature */}
              <div className="bg-white rounded-xl px-5 py-4 shadow-2xl">
                {currentChord.frets.map((fret, idx) => (
                  <div key={idx} className="flex gap-3 items-center py-1.5">
                    <span className="text-zinc-800 font-bold w-3 text-sm">{STRINGS[idx]}</span>
                    <span className="text-zinc-400">—</span>
                    <span className="text-zinc-900 font-bold w-4 text-center text-base">
                      {fret === -1 ? 'x' : fret === 0 ? '0' : fret}
                    </span>
                    <span className="text-zinc-400">—</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Chord Preview */}
          {currentChordIndex < mockProgression.chords.length - 1 && (
            <div className="mt-12 text-center">
              <div className="text-xs text-zinc-600 uppercase tracking-wide mb-2">Next Chord</div>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <div className="text-sm text-purple-500 font-bold">
                  {mockProgression.romanNumerals[currentChordIndex + 1]}
                </div>
                <div className="text-2xl font-bold">
                  {mockProgression.chords[currentChordIndex + 1].root}
                  {mockProgression.chords[currentChordIndex + 1].type !== 'major' 
                    ? mockProgression.chords[currentChordIndex + 1].type 
                    : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="fixed bottom-20 left-0 right-0 bg-black border-t border-zinc-800 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Stats Summary */}
          <div className="flex items-center justify-center gap-6 mb-3 text-xs text-zinc-500">
            <div>
              <span className="text-purple-500 font-bold">{completedCycles}</span> cycle{completedCycles !== 1 ? 's' : ''} completed
            </div>
            <div>
              <span className="text-purple-500 font-bold">{chordHistory.length}</span> chord{chordHistory.length !== 1 ? 's' : ''} played
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleReset}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-zinc-400" />
            </button>

            <button
              onClick={togglePlay}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" fill="currentColor" />
                  <span className="text-sm">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" fill="currentColor" />
                  <span className="text-sm">Play</span>
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              className="p-2.5 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
            >
              <SkipForward className="w-4 h-4 text-white" />
            </button>

            {user && (
              <button
                onClick={handleSaveAndExit}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors ml-2"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm">Save & Exit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
