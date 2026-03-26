/**
 * Practice Page - Single Chord Practice with Real-Time Detection
 * 
 * Main practice interface with:
 * - Chord display with SVG diagram + tablature
 * - Real-time microphone detection
 * - Session statistics tracking
 * - Audio playback (chord + reference tone)
 * - Fixed bottom toolbar navigation
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Mic, 
  MicOff,
  Volume2, 
  Eye, 
  EyeOff, 
  Headphones,
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  BarChart3,
  Sliders,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { usePracticeStore } from '@/stores/practiceStore';
import { useAudioStore } from '@/stores/audioStore';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';
import { useChordDetection } from '@/hooks/useChordDetection';
import { useChordAudio } from '@/hooks/useChordAudio';
import { useSessionStats } from '@/hooks/useSessionStats';
import { ChordDiagram } from '@/components/features/ChordDiagram';
import { ChordTablature } from '@/components/features/ChordTablature';

export default function Practice() {
  const navigate = useNavigate();
  
  // Store state
  const { 
    isPracticing,
    isRevealed,
    getCurrentChord,
    nextChord,
    prevChord,
    revealChord,
    hideChord,
    stopPractice,
  } = usePracticeStore();
  
  const { volume, muted, setVolume, toggleMute, getEffectiveVolume } = useAudioStore();
  const { sensitivity, setSensitivity, advancedEnabled, advancedValues } = useDetectionSettingsStore();
  
  // Local state
  const [showDiagrams, setShowDiagrams] = useState(() => {
    const saved = localStorage.getItem('fretmaster-show-diagrams');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Get current chord
  const chord = getCurrentChord();
  
  // Session stats
  const { 
    startSession, 
    recordAttempt, 
    resetChordTimer, 
    endSession, 
    getSummary, 
    showSummary, 
    dismissSummary 
  } = useSessionStats();
  
  // Audio hooks
  const { playChord, stopCurrent } = useChordAudio();
  
  // Chord detection
  console.log('🎯 Practice page rendering with chord:', chord ? `${chord.root}${chord.type}` : 'null');
  console.log('🎤 Detection settings:', { sensitivity, advancedEnabled, advancedValues });
  
  const { 
    isListening, 
    result, 
    permissionDenied, 
    toggleListening, 
    stopListening, 
    pauseDetection 
  } = useChordDetection({
    targetChord: chord,
    sensitivity,
    autoStart: true,
    advancedSettings: advancedEnabled ? advancedValues : null,
    onCorrect: () => {
      console.log('✅ Correct chord detected!');
      if (chord) {
        const chordSymbol = `${chord.root}${chord.type !== 'major' ? chord.type : ''}`;
        const chordName = `${chord.root} ${chord.category}`;
        recordAttempt(chordSymbol, chordName, 'correct');
        revealChord();
        resetChordTimer();
      }
    },
    onWrongDetected: (detectedSymbol) => {
      console.log('❌ Wrong chord detected:', detectedSymbol);
    },
  });
  
  console.log('🔍 Detection state:', { isListening, result, permissionDenied });
  
  // Initialize session on mount
  useEffect(() => {
    startSession();
  }, [startSession]);
  
  // Redirect if not practicing
  useEffect(() => {
    if (!isPracticing) {
      navigate('/chord-practice');
    }
  }, [isPracticing, navigate]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopCurrent();
    };
  }, [stopListening, stopCurrent]);
  
  // Save show diagrams preference
  useEffect(() => {
    localStorage.setItem('fretmaster-show-diagrams', JSON.stringify(showDiagrams));
  }, [showDiagrams]);
  
  // Reset chord timer when chord changes
  useEffect(() => {
    resetChordTimer();
  }, [chord, resetChordTimer]);
  
  if (!chord) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bg-base))] text-[hsl(var(--text-default))] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No chords to practice</h2>
          <button
            onClick={() => navigate('/chord-practice')}
            className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-emphasis))]"
          >
            Go back to setup
          </button>
        </div>
      </div>
    );
  }
  
  const handleReveal = () => {
    revealChord();
    pauseDetection(2000);
    playChord(chord);
  };
  
  const handlePlayAgain = () => {
    pauseDetection(2000);
    playChord(chord);
  };
  
  const handleNext = () => {
    if (!isRevealed) {
      const chordSymbol = `${chord.root}${chord.type !== 'major' ? chord.type : ''}`;
      const chordName = `${chord.root} ${chord.category}`;
      recordAttempt(chordSymbol, chordName, 'skipped');
    }
    hideChord();
    resetChordTimer();
    nextChord();
  };
  
  const handlePrev = () => {
    hideChord();
    resetChordTimer();
    prevChord();
  };
  
  const handleRestart = () => {
    hideChord();
    resetChordTimer();
    stopPractice();
    navigate('/chord-practice');
  };
  
  const handleBack = () => {
    const summary = getSummary();
    if (summary.attempts.length > 0) {
      endSession();
    } else {
      stopListening();
      stopPractice();
      navigate('/chord-practice');
    }
  };
  
  const getSensitivityLabel = (sens: number) => {
    if (sens <= 3) return { label: 'Strict', color: 'text-blue-400' };
    if (sens <= 7) return { label: 'Balanced', color: 'text-amber-400' };
    return { label: 'Sensitive', color: 'text-emerald-400' };
  };
  
  const sensitivityLabel = getSensitivityLabel(sensitivity);
  
  return (
    <div className="min-h-screen bg-[hsl(var(--bg-base))] text-[hsl(var(--text-default))] pb-24">
      {/* Top Bar */}
      <div className="border-b border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] px-4 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[hsl(var(--text-subtle))] hover:text-[hsl(var(--text-default))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-display">Back</span>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Show Diagrams Toggle */}
            <button
              onClick={() => setShowDiagrams(!showDiagrams)}
              className={`
                px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold transition-all
                active:scale-95
                ${showDiagrams 
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40' 
                  : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] border border-[hsl(var(--border-subtle))]'
                }
              `}
            >
              {showDiagrams ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Chord Diagram {showDiagrams ? 'On' : 'Off'}</span>
              <div className={`
                w-8 h-[18px] rounded-full relative transition-colors
                ${showDiagrams ? 'bg-emerald-500' : 'bg-zinc-600'}
              `}>
                <div className={`
                  absolute w-[14px] h-[14px] bg-white rounded-full top-0.5 transition-transform
                  ${showDiagrams ? 'translate-x-4' : 'translate-x-0.5'}
                `} />
              </div>
            </button>

            {/* Mic Toggle */}
            <button 
              onClick={toggleListening}
              className={`
                p-2 rounded-lg transition-all active:scale-95
                ${isListening 
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500' 
                  : 'bg-[hsl(var(--bg-surface))] hover:bg-[hsl(var(--bg-overlay))] border border-[hsl(var(--border-subtle))]'
                }
              `}
            >
              <Mic className={`w-4 h-4 ${isListening ? 'text-emerald-500 animate-pulse' : 'text-[hsl(var(--text-subtle))]'}`} />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-1.5 hover:bg-[hsl(var(--bg-surface))] rounded transition-colors"
              >
                {muted ? (
                  <MicOff className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                ) : volume > 0.5 ? (
                  <Volume2 className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-[hsl(var(--bg-surface))] rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[hsl(var(--color-primary))]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Permission Denied Banner */}
      {permissionDenied && (
        <div className="bg-red-900/20 border-b border-red-500/30 px-4 py-3">
          <div className="flex items-center gap-2 text-red-500 text-sm max-w-5xl mx-auto">
            <MicOff className="w-4 h-4" />
            <span className="font-medium">Microphone access denied — please allow in browser settings and refresh</span>
          </div>
        </div>
      )}

      {/* Listening Status Bar */}
      {isListening && (
        <div className={`
          border-b px-4 py-3
          ${result === 'correct' 
            ? 'bg-emerald-900/20 border-emerald-500/30' 
            : result === 'wrong'
            ? 'bg-red-900/20 border-red-500/30'
            : 'bg-[hsl(var(--bg-surface))]'
          }
        `}>
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              {!result && (
                <>
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-3 bg-emerald-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-0.5 h-3 bg-emerald-500 animate-pulse" style={{ animationDelay: '100ms' }} />
                    <div className="w-0.5 h-3 bg-emerald-500 animate-pulse" style={{ animationDelay: '200ms' }} />
                  </div>
                  <span className="text-emerald-500 text-sm font-medium">Listening — play the chord</span>
                </>
              )}
              {result === 'correct' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 text-sm font-bold">Correct!</span>
                </>
              )}
              {result === 'wrong' && (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 text-sm font-bold">Try again</span>
                </>
              )}
            </div>

            {/* Sensitivity Slider */}
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 text-[hsl(var(--text-muted))]" />
              <span className="text-xs text-[hsl(var(--text-subtle))] uppercase tracking-wide hidden sm:inline">
                Mic Sensitivity
              </span>
              <input
                type="range"
                min="1"
                max="10"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-28 h-1 bg-[hsl(var(--bg-surface))] rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[hsl(var(--color-primary))]"
              />
              <span className="text-[hsl(var(--color-primary))] font-bold text-sm min-w-[1.5rem] text-center">
                {sensitivity}
              </span>
              <span className={`text-xs font-medium ${sensitivityLabel.color}`}>
                {sensitivityLabel.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Practice Area */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          {/* Detection Feedback Pill */}
          <div className="min-h-[40px] mb-4 flex items-center justify-center">
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7, y: -6 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-none"
                >
                  <div className={`
                    px-7 py-2 rounded-2xl backdrop-blur-md border-2
                    ${result === 'correct'
                      ? 'bg-[hsl(142_71%_45%/0.15)] border-[hsl(142_71%_45%/0.5)]'
                      : 'bg-[hsl(0_84%_60%/0.15)] border-[hsl(0_84%_60%/0.5)]'
                    }
                  `}>
                    <span className={`
                      font-display text-2xl font-extrabold uppercase tracking-wider
                      ${result === 'correct'
                        ? 'text-emerald-500'
                        : 'text-red-500'
                      }
                    `}
                      style={{
                        textShadow: result === 'correct'
                          ? '0 0 20px hsl(142 71% 45% / 0.5)'
                          : '0 0 20px hsl(0 84% 60% / 0.5)'
                      }}
                    >
                      {result === 'correct' ? 'Correct' : 'Wrong'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chord Symbol */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${chord.id}-symbol`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <div className="text-8xl font-black text-white mb-2">
                {chord.root}{chord.type === 'major' ? '' : chord.type}
              </div>
              <div className="text-lg text-[hsl(var(--text-subtle))]">
                {chord.root} {chord.type === 'major' ? 'Major' : chord.type}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Diagram & Tablature */}
          {showDiagrams && isRevealed && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${chord.id}-diagram`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-6"
              >
                <ChordDiagram chord={chord} size="lg" />
                <ChordTablature chord={chord} size="md" />
              </motion.div>
            </AnimatePresence>
          )}

          {/* Hidden Diagram State */}
          {!isRevealed && showDiagrams && (
            <div className="text-[hsl(var(--text-muted))] text-sm">
              <div className="mb-2">🙈</div>
              <div>Diagram hidden</div>
              <div className="text-xs">Hit reveal to display diagram</div>
            </div>
          )}

          {!showDiagrams && (
            <div className="text-[hsl(var(--text-muted))] text-sm">
              <EyeOff className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <div>Diagram hidden</div>
              <div className="text-xs">Play by ear or toggle diagrams on</div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated)/0.95)] backdrop-blur-md">
        <div className="flex items-stretch gap-2 px-3 py-3 max-w-2xl mx-auto">
          {/* Prev */}
          <button
            onClick={handlePrev}
            className="size-12 rounded-xl flex items-center justify-center
              bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))]
              hover:bg-[hsl(var(--bg-overlay))] active:scale-95 transition-all"
          >
            <SkipBack className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
          </button>

          {/* Restart */}
          <button
            onClick={handleRestart}
            className="size-12 rounded-xl flex items-center justify-center
              bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))]
              hover:bg-[hsl(var(--bg-overlay))] active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
          </button>

          {/* History */}
          <button
            onClick={() => navigate('/history')}
            className="size-12 rounded-xl flex items-center justify-center
              bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))]
              hover:bg-[hsl(var(--bg-overlay))] active:scale-95 transition-all"
          >
            <BarChart3 className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
          </button>

          {/* Reveal / Play Again */}
          {!isRevealed ? (
            <button
              onClick={handleReveal}
              className="flex-1 min-h-[48px] rounded-xl flex items-center justify-center gap-2
                bg-[hsl(var(--color-primary)/0.15)] border border-[hsl(var(--color-primary)/0.3)]
                text-[hsl(var(--color-primary))] font-display font-bold
                hover:bg-[hsl(var(--color-primary)/0.25)] active:scale-[0.97] transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Reveal</span>
            </button>
          ) : (
            <>
              <button
                onClick={handlePlayAgain}
                className="flex-1 min-h-[48px] rounded-xl flex items-center justify-center gap-2
                  bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))]
                  text-[hsl(var(--text-default))] font-display font-semibold
                  hover:bg-[hsl(var(--bg-overlay))] active:scale-[0.97] transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Play Again</span>
              </button>

              <button
                onClick={handlePlayAgain}
                className="size-12 rounded-xl flex items-center justify-center
                  bg-[hsl(var(--color-emphasis)/0.15)] border border-[hsl(var(--color-emphasis)/0.3)]
                  text-[hsl(var(--color-emphasis))]
                  hover:bg-[hsl(var(--color-emphasis)/0.25)] active:scale-95 transition-all"
              >
                <Headphones className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Next */}
          <button
            onClick={handleNext}
            className="flex-1 min-h-[48px] rounded-xl flex items-center justify-center gap-2
              bg-[hsl(var(--color-primary))] text-[hsl(var(--bg-base))]
              font-display font-bold
              hover:bg-[hsl(var(--color-emphasis))] active:scale-[0.97] transition-all
              shadow-lg shadow-[hsl(var(--color-primary)/0.2)]"
          >
            <span>Next</span>
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
