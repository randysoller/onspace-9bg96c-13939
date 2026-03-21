import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePracticeStore } from '@/stores/practiceStore';
import { useAudioStore } from '@/stores/audioStore';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';
import { usePracticeHistoryStore } from '@/stores/practiceHistoryStore';
import { useChordAudio } from '@/hooks/useChordAudio';
import { useChordDetection } from '@/hooks/useChordDetection';
import { useSessionStats } from '@/hooks/useSessionStats';
import { AdvancedDetectionPanel } from '@/components/features/AdvancedDetectionPanel';
import { BeatSyncPanel } from '@/components/features/BeatSyncPanel';
import { 
  ArrowLeft, 
  Sliders, 
  Mic, 
  Volume2, 
  Eye, 
  ChevronRight, 
  SkipBack, 
  RotateCcw, 
  BarChart3,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];

export default function Practice() {
  const navigate = useNavigate();
  const { practiceChords, currentChordIndex, showDiagrams, nextChord, previousChord } = usePracticeStore();
  const { chordVolume, setChordVolume } = useAudioStore();
  const { sensitivity, setSensitivity, advancedEnabled, advancedValues } = useDetectionSettingsStore();
  const { addSession } = usePracticeHistoryStore();
  const { playChord } = useChordAudio();
  const { startSession, recordAttempt, resetChordTimer, endSession, getSummary, showSummary, dismissSummary } = useSessionStats();
  
  const [isRevealed, setIsRevealed] = useState(false);
  const [diagramsOn, setDiagramsOn] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);

  const currentChord = practiceChords[currentChordIndex];

  const { isListening, result, startListening, stopListening } = useChordDetection({
    targetChord: currentChord,
    sensitivity,
    autoStart: false,
    advancedSettings: advancedEnabled ? advancedValues : null,
    onCorrect: () => {
      setIsRevealed(true);
      if (sessionActive && currentChord) {
        recordAttempt(
          `${currentChord.root}${currentChord.type !== 'major' ? currentChord.type : ''}`,
          `${currentChord.root} ${currentChord.category}`,
          'correct'
        );
      }
    },
  });

  useEffect(() => {
    if (!sessionActive) {
      startSession();
      setSessionActive(true);
    }
  }, []);

  const handleNext = () => {
    if (sessionActive && currentChord && !isRevealed) {
      recordAttempt(
        `${currentChord.root}${currentChord.type !== 'major' ? currentChord.type : ''}`,
        `${currentChord.root} ${currentChord.category}`,
        'skipped'
      );
    }
    setIsRevealed(false);
    resetChordTimer();
    nextChord();
  };

  const handlePrevious = () => {
    setIsRevealed(false);
    resetChordTimer();
    previousChord();
  };

  const handleReveal = () => {
    setIsRevealed(true);
    if (currentChord) {
      playChord(currentChord);
    }
  };

  const handleEndSession = () => {
    stopListening();
    endSession();
    const summary = getSummary();
    addSession({
      date: Date.now(),
      mode: 'single',
      totalCorrect: summary.totalCorrect,
      totalSkipped: summary.totalSkipped,
      accuracyRate: summary.accuracyRate,
      avgResponseTimeMs: summary.avgResponseTimeMs,
      fastestTimeMs: summary.fastestTimeMs,
      totalDurationMs: summary.totalDurationMs,
      attempts: summary.attempts,
      chords: practiceChords.map(c => `${c.root}${c.type !== 'major' ? c.type : ''}`),
    });
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!currentChord) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No chords to practice</h2>
          <button
            onClick={() => navigate('/')}
            className="text-amber-500 hover:text-amber-400"
          >
            Go back to setup
          </button>
        </div>
      </div>
    );
  }

  const rootStringIndex = currentChord.rootString !== undefined ? currentChord.rootString : -1;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top Control Bar */}
      <div className="border-b border-zinc-800 bg-black px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 transition-colors">
                All Chords
              </button>
              <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 transition-colors">
                All Types
              </button>
            </div>

            {/* Chord Diagram Toggle */}
            <button
              onClick={() => setDiagramsOn(!diagramsOn)}
              className={`px-3 py-1.5 rounded flex items-center gap-2 text-xs font-semibold transition-all ${
                diagramsOn 
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Chord Diagram {diagramsOn ? 'On' : 'Off'}
              <div className={`w-8 h-4 rounded-full relative transition-colors ${
                diagramsOn ? 'bg-emerald-500' : 'bg-zinc-600'
              }`}>
                <div className={`absolute w-3 h-3 bg-white rounded-full top-0.5 transition-transform ${
                  diagramsOn ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </div>
            </button>

            {/* Mic Icon */}
            <button 
              onClick={toggleMic}
              className={`p-2 rounded transition-colors ${
                isListening 
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500' 
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              <Mic className={`w-4 h-4 ${
                isListening ? 'text-emerald-500 animate-pulse' : 'text-zinc-400'
              }`} />
            </button>

            {/* Volume Slider */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-zinc-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={chordVolume * 100}
                onChange={(e) => setChordVolume(Number(e.target.value) / 100)}
                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isListening && !result && (
              <div className="flex items-center gap-2 text-emerald-500 text-sm">
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-3 bg-emerald-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-0.5 h-3 bg-emerald-500 animate-pulse" style={{ animationDelay: '100ms' }} />
                  <div className="w-0.5 h-3 bg-emerald-500 animate-pulse" style={{ animationDelay: '200ms' }} />
                </div>
                <span className="font-medium">Listening — play the chord</span>
              </div>
            )}
            {result === 'correct' && (
              <div className="flex items-center gap-2 text-emerald-500 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold">Correct!</span>
              </div>
            )}
            {result === 'wrong' && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <XCircle className="w-4 h-4" />
                <span className="font-bold">Try again</span>
              </div>
            )}
            {!isListening && !result && (
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <Mic className="w-4 h-4" />
                <span className="font-medium">Mic off — click mic to enable</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 text-zinc-500" />
              <span className="text-xs text-zinc-500 uppercase tracking-wide">Mic Sensitivity</span>
              <input
                type="range"
                min="1"
                max="10"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-32 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />
              <span className="text-amber-500 font-bold text-sm">{sensitivity}</span>
              <span className="text-zinc-600 text-xs">Balanced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Panels */}
      <div className="border-b border-zinc-800 px-4 py-4 space-y-3">
        <AdvancedDetectionPanel />
        <BeatSyncPanel />
      </div>

      {/* Main Chord Display */}
      <div className="flex items-center justify-center min-h-[calc(100vh-300px)] py-12">
        <div className="text-center">
          {/* Chord Name */}
          <div className="mb-8">
            <div className="text-8xl font-black text-white mb-2">
              {currentChord.root}{currentChord.type === 'major' ? '' : currentChord.type === 'minor' ? 'm' : currentChord.type === 'm7' ? 'm7' : currentChord.type === 'maj7' ? 'maj7' : currentChord.type}
            </div>
            <div className="text-lg text-zinc-500">
              {currentChord.root} {currentChord.type === 'major' ? 'Major' : currentChord.type === 'minor' ? 'Minor' : currentChord.type === '7' ? 'Dominant 7th' : currentChord.type === 'maj7' ? 'Major 7th' : currentChord.type === 'm7' ? 'Minor 7th' : currentChord.type === 'sus4' ? 'Suspended 4th' : currentChord.type === 'sus2' ? 'Suspended 2nd' : currentChord.type}
            </div>
          </div>

          {/* Chord Diagram & Tablature */}
          {diagramsOn && isRevealed && (
            <div className="flex items-center justify-center gap-6">
              {/* Chord Diagram */}
              <div className="relative">
                <svg width="240" height="300" viewBox="0 0 240 300" className="select-none">
                  {/* Base Fret Indicator (2fr) */}
                  <text x="10" y="70" className="text-xs fill-zinc-500">2fr</text>

                  {/* Muted strings at top */}
                  {currentChord.frets.map((fret, idx) => {
                    if (fret === -1) {
                      return (
                        <g key={`muted-${idx}`}>
                          <line
                            x1={60 + idx * 30 - 4}
                            y1={36}
                            x2={60 + idx * 30 + 4}
                            y2={44}
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-zinc-500"
                          />
                          <line
                            x1={60 + idx * 30 + 4}
                            y1={36}
                            x2={60 + idx * 30 - 4}
                            y2={44}
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-zinc-500"
                          />
                        </g>
                      );
                    } else if (fret === 0) {
                      return (
                        <circle
                          key={`open-${idx}`}
                          cx={60 + idx * 30}
                          cy={40}
                          r="6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-zinc-400"
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Nut */}
                  <rect x="45" y="60" width="150" height="4" fill="currentColor" className="text-zinc-200" />

                  {/* Frets */}
                  {[1, 2, 3, 4].map((fret) => (
                    <line
                      key={`fret-${fret}`}
                      x1="45"
                      y1={60 + fret * 50}
                      x2="195"
                      y2={60 + fret * 50}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-zinc-200"
                    />
                  ))}

                  {/* Strings */}
                  {[0, 1, 2, 3, 4, 5].map((string) => (
                    <line
                      key={`string-${string}`}
                      x1={60 + string * 30}
                      y1="60"
                      x2={60 + string * 30}
                      y2="260"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-zinc-200"
                    />
                  ))}

                  {/* Finger dots */}
                  {currentChord.frets.map((fret, stringIdx) => {
                    if (fret > 0) {
                      const isRoot = stringIdx === rootStringIndex;
                      const fingerNum = currentChord.fingers?.[stringIdx];

                      if (isRoot) {
                        return (
                          <g key={`dot-${stringIdx}`}>
                            <path
                              d={`M ${60 + stringIdx * 30} ${60 + (fret - 0.5) * 50 - 13} 
                                  L ${60 + stringIdx * 30 + 13} ${60 + (fret - 0.5) * 50} 
                                  L ${60 + stringIdx * 30} ${60 + (fret - 0.5) * 50 + 13} 
                                  L ${60 + stringIdx * 30 - 13} ${60 + (fret - 0.5) * 50} Z`}
                              fill="currentColor"
                              className="text-cyan-500"
                            />
                            {fingerNum && fingerNum > 0 && (
                              <text
                                x={60 + stringIdx * 30}
                                y={60 + (fret - 0.5) * 50 + 1}
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
                              cx={60 + stringIdx * 30}
                              cy={60 + (fret - 0.5) * 50}
                              r="14"
                              fill="currentColor"
                              className="text-amber-500"
                            />
                            {fingerNum && fingerNum > 0 && (
                              <text
                                x={60 + stringIdx * 30}
                                y={60 + (fret - 0.5) * 50 + 1}
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
              <div className="bg-white rounded-lg px-4 py-3 text-sm font-mono shadow-xl">
                {currentChord.frets.map((fret, idx) => (
                  <div key={idx} className="flex gap-2.5 items-center py-1">
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
          )}

          {!isRevealed && diagramsOn && (
            <div className="text-zinc-600 text-sm">
              <div className="mb-2">🙈</div>
              Diagram hidden<br />
              Hit reveal to display diagram
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Session Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Accuracy</span>
                <span className="text-2xl font-bold text-emerald-500">{getSummary().accuracyRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Correct</span>
                <span className="text-lg font-bold text-white">{getSummary().totalCorrect}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Skipped</span>
                <span className="text-lg font-bold text-zinc-500">{getSummary().totalSkipped}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Avg Response</span>
                <span className="text-lg font-bold text-amber-500">{(getSummary().avgResponseTimeMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Total Time</span>
                <span className="text-lg font-bold text-white">{(getSummary().totalDurationMs / 1000 / 60).toFixed(1)}m</span>
              </div>
            </div>
            <button
              onClick={() => {
                dismissSummary();
                navigate('/');
              }}
              className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 px-4 py-4">
        <div className="flex items-center justify-center gap-3">
          <button 
            onClick={handlePrevious}
            disabled={currentChordIndex === 0}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipBack className="w-5 h-5 text-zinc-400" />
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-zinc-400" />
          </button>
          
          <button 
            onClick={handleEndSession}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-zinc-400" />
          </button>

          <button
            onClick={handleReveal}
            disabled={isRevealed}
            className="flex-1 max-w-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-500 font-bold py-4 px-8 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-5 h-5" />
            Reveal
          </button>

          <button
            onClick={handleNext}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold py-4 px-8 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
