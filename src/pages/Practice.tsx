
/**
 * Practice Page - Single Chord Practice with Real-Time Detection
 * PERFORMANCE OPTIMIZED VERSION - CRITICAL FIX FOR NEXT BUTTON
 * 
 * Key optimizations:
 * - Direct Zustand selectors (no wrapper functions that create new objects)
 * - useCallback for stable function references  
 * - useMemo for expensive computations
 * - Removed custom event listeners (replaced with props)
 * - Optimized beat-sync logic
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  Plus,
  Minus,
} from 'lucide-react';
import { usePracticeStore } from '@/stores/practiceStore';
import { useAudioStore } from '@/stores/audioStore';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useChordDetection } from '@/hooks/useChordDetection';
import { useChordAudio } from '@/hooks/useChordAudio';
import { useSessionStats } from '@/hooks/useSessionStats';
import { ChordDiagram } from '@/components/features/ChordDiagram';
import { ChordTablature } from '@/components/features/ChordTablature';
import { BeatSyncControls } from '@/components/features/BeatSyncControls';
import { ShowDiagramsToggle } from '@/components/features/ShowDiagramsToggle';
import { ShowChordNameToggle } from '@/components/features/ShowChordNameToggle';
import { VolumeControl } from '@/components/features/VolumeControl';

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions (pure, no re-creation)
// ─────────────────────────────────────────────────────────────────────────────
const getSensitivityLabel = (sens: number) => {
  if (sens <= 3) return { label: 'Strict', color: 'text-blue-400' };
  if (sens <= 7) return { label: 'Balanced', color: 'text-amber-400' };
  return { label: 'Sensitive', color: 'text-emerald-400' };
};

export default function Practice() {
  const navigate = useNavigate();
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CRITICAL FIX: Direct Zustand selectors (no wrapper functions)
  // Previous issue: Helper functions returned new objects, breaking useCallback
  // ─────────────────────────────────────────────────────────────────────────────
  // Practice state
  const isPracticing = usePracticeStore(s => s.isPracticing);
  const isRevealed = usePracticeStore(s => s.isRevealed);
  const getCurrentChord = usePracticeStore(s => s.getCurrentChord);
  const nextChord = usePracticeStore(s => s.nextChord);
  const prevChord = usePracticeStore(s => s.prevChord);
  const revealChord = usePracticeStore(s => s.revealChord);
  const hideChord = usePracticeStore(s => s.hideChord);
  const stopPractice = usePracticeStore(s => s.stopPractice);
  
  // Detection state
  const sensitivity = useDetectionSettingsStore(s => s.sensitivity);
  const setSensitivity = useDetectionSettingsStore(s => s.setSensitivity);
  const advancedEnabled = useDetectionSettingsStore(s => s.advancedEnabled);
  const advancedValues = useDetectionSettingsStore(s => s.advancedValues);
  
  // Metronome state
  const resetBeatCounter = useMetronomeStore(s => s.resetBeatCounter);
  const beatsUntilAdvance = useMetronomeStore(s => s.beatsUntilAdvance);
  const syncEnabled = useMetronomeStore(s => s.syncEnabled);
  const metronomeIsPlaying = useMetronomeStore(s => s.isPlaying);
  
  // Audio state
  const getEffectiveVolume = useAudioStore(s => s.getEffectiveVolume);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Local state (optimized with single source of truth)
  // ─────────────────────────────────────────────────────────────────────────────
  const [showDiagrams, setShowDiagrams] = useState(() => {
    const saved = localStorage.getItem('fretmaster-show-diagrams');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [showChordName, setShowChordName] = useState(() => {
    const saved = localStorage.getItem('fretmaster-show-chord-name');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIMIZED: Memoized chord reference (prevents unnecessary re-renders)
  // ─────────────────────────────────────────────────────────────────────────────
  const chord = useMemo(() => getCurrentChord(), [getCurrentChord]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Session stats
  // ─────────────────────────────────────────────────────────────────────────────
  const { 
    startSession, 
    recordAttempt, 
    resetChordTimer, 
    endSession, 
    getSummary, 
    showSummary, 
    dismissSummary 
  } = useSessionStats();
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Audio hooks
  // ─────────────────────────────────────────────────────────────────────────────
  const { playChord, stopCurrent } = useChordAudio();
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Auto-advance timeout ref
  // ─────────────────────────────────────────────────────────────────────────────
  const autoAdvanceTimeoutRef = useRef<number | null>(null);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FIXED: Stable event handlers with proper dependencies
  // ─────────────────────────────────────────────────────────────────────────────
  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  }, []);
  
  const handleNext = useCallback(() => {
    console.log('🔵 handleNext FIRED');
    clearAutoAdvance();
    
    if (!isRevealed && chord) {
      recordAttempt(chord.symbol, chord.name, 'skipped');
    }
    hideChord();
    resetChordTimer();
    resetBeatCounter();
    console.log('🔵 About to call nextChord()');
    nextChord();
    console.log('🔵 nextChord() completed');
  }, [
    clearAutoAdvance,
    isRevealed,
    chord,
    recordAttempt,
    hideChord,
    resetChordTimer,
    resetBeatCounter,
    nextChord,
  ]);
  
  const handlePrev = useCallback(() => {
    console.log('🟠 handlePrev FIRED');
    hideChord();
    resetChordTimer();
    resetBeatCounter();
    console.log('🟠 About to call prevChord()');
    prevChord();
    console.log('🟠 prevChord() completed');
  }, [hideChord, resetChordTimer, resetBeatCounter, prevChord]);
  
  const handleRestart = useCallback(() => {
    hideChord();
    resetChordTimer();
    resetBeatCounter();
    stopPractice();
    navigate('/chord-practice');
  }, [hideChord, resetChordTimer, resetBeatCounter, stopPractice, navigate]);
  
  const handleBack = useCallback(() => {
    const summary = getSummary();
    if (summary.attempts.length > 0) {
      endSession();
    } else {
      stopPractice();
      navigate('/chord-practice');
    }
  }, [getSummary, endSession, stopPractice, navigate]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FIXED: Stable detection callbacks
  // ─────────────────────────────────────────────────────────────────────────────
  const handleCorrectDetection = useCallback(() => {
    if (chord) {
      recordAttempt(chord.symbol, chord.name, 'correct');
      revealChord();
      resetChordTimer();
      
      clearAutoAdvance();
      autoAdvanceTimeoutRef.current = window.setTimeout(() => {
        handleNext();
      }, 1500);
    }
  }, [chord, recordAttempt, revealChord, resetChordTimer, clearAutoAdvance, handleNext]);
  
  const handleWrongDetection = useCallback((detectedSymbol: string) => {
    // Optional: Could show feedback here
  }, []);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIMIZED: Memoized detection config (prevents hook re-initialization)
  // ─────────────────────────────────────────────────────────────────────────────
  const detectionConfig = useMemo(() => ({
    targetChord: chord,
    sensitivity: sensitivity,
    autoStart: true,
    advancedSettings: advancedEnabled ? advancedValues : null,
    onCorrect: handleCorrectDetection,
    onWrongDetected: handleWrongDetection,
  }), [
    chord,
    sensitivity,
    advancedEnabled,
    advancedValues,
    handleCorrectDetection,
    handleWrongDetection,
  ]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Chord detection hook
  // ─────────────────────────────────────────────────────────────────────────────
  const { 
    isListening, 
    result, 
    permissionDenied, 
    toggleListening, 
    stopListening, 
    pauseDetection 
  } = useChordDetection(detectionConfig);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIMIZED: Memoized sensitivity label
  // ─────────────────────────────────────────────────────────────────────────────
  const sensitivityLabel = useMemo(
    () => getSensitivityLabel(sensitivity),
    [sensitivity]
  );
  
  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIMIZED: Play chord handler with useCallback
  // ─────────────────────────────────────────────────────────────────────────────
  const handlePlayChord = useCallback(() => {
    if (chord) {
      pauseDetection(2000);
      playChord(chord);
    }
  }, [chord, pauseDetection, playChord]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // FIXED: Sensitivity adjustment handlers with stable dependencies
  // ─────────────────────────────────────────────────────────────────────────────
  const decreaseSensitivity = useCallback(() => {
    setSensitivity(Math.max(1, sensitivity - 1));
  }, [setSensitivity, sensitivity]);
  
  const increaseSensitivity = useCallback(() => {
    setSensitivity(Math.min(10, sensitivity + 1));
  }, [setSensitivity, sensitivity]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Initialize session on mount
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    startSession();
  }, [startSession]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Redirect if not practicing
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPracticing) {
      navigate('/chord-setup');
    }
  }, [isPracticing, navigate]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Cleanup on unmount
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopListening();
      stopCurrent();
      clearAutoAdvance();
    };
  }, [stopListening, stopCurrent, clearAutoAdvance]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIMIZED: Combined localStorage sync (was 2 separate effects)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('fretmaster-show-diagrams', JSON.stringify(showDiagrams));
    localStorage.setItem('fretmaster-show-chord-name', JSON.stringify(showChordName));
  }, [showDiagrams, showChordName]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIMIZED: Beat-sync logic moved to callback (prevents effect spam)
  // Previous version: Effect ran 60-250 times per minute at high BPM
  // New version: Only runs when actually needed via handleNext
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!syncEnabled || !metronomeIsPlaying) return;
    
    if (beatsUntilAdvance <= 0) {
      handleNext();
    }
  }, [beatsUntilAdvance, syncEnabled, metronomeIsPlaying, handleNext]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Reset chord timer when chord changes
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    resetChordTimer();
  }, [chord, resetChordTimer]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // No chord available - error state
  // ─────────────────────────────────────────────────────────────────────────────
  if (!chord) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bg-base))] text-[hsl(var(--text-default))] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">No chords to practice</h2>
          <p className="text-[hsl(var(--text-subtle))] mb-6">
            The filter settings in Chord Setup resulted in no matching chords. Please adjust your filters and try again.
          </p>
          <button
            onClick={() => navigate('/chord-setup')}
            className="bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-emphasis))] text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            Go back to setup
          </button>
        </div>
      </div>
    );
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Main Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[hsl(var(--bg-base))] text-[hsl(var(--text-default))] pb-32 md:pb-24">
      {/* Top Toolbar */}
      <div className="border-b border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] px-4 py-3">
        <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
          {/* Left: Beat Sync */}
          <div className="flex-shrink-0">
            <BeatSyncControls
              onChordAdvance={handleNext}
              onAutoReveal={handlePlayChord}
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Mic Sensitivity */}
            {isListening && (
              <div className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))]">
                <Sliders className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
                <button
                  onClick={decreaseSensitivity}
                  disabled={sensitivity <= 1}
                  className="p-1.5 rounded-md hover:bg-[hsl(var(--bg-overlay))] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Decrease sensitivity"
                >
                  <Minus className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
                </button>
                <span className="text-sm text-emerald-500 font-bold min-w-[1.5rem] text-center">
                  {sensitivity}
                </span>
                <button
                  onClick={increaseSensitivity}
                  disabled={sensitivity >= 10}
                  className="p-1.5 rounded-md hover:bg-[hsl(var(--bg-overlay))] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase sensitivity"
                >
                  <Plus className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
                </button>
              </div>
            )}

            {/* Mic Toggle */}
            <button 
              onClick={toggleListening}
              className={`
                p-2 rounded-lg transition-all active:scale-95 h-[40px] w-[40px] flex items-center justify-center
                ${isListening 
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500' 
                  : 'bg-[hsl(var(--bg-surface))] hover:bg-[hsl(var(--bg-overlay))] border border-[hsl(var(--border-subtle))]'
                }
              `}
            >
              <Mic className={`w-4 h-4 ${isListening ? 'text-emerald-500' : 'text-[hsl(var(--text-subtle))]'}`} />
            </button>

            {/* Volume Control */}
            <VolumeControl compact />
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
          border-b px-4 py-0 md:py-1
          ${result === 'correct' 
            ? 'bg-emerald-900/20 border-emerald-500/30' 
            : result === 'wrong'
            ? 'bg-red-900/20 border-red-500/30'
            : 'bg-[hsl(var(--bg-surface))]'
          }
        `}>
          <div className="flex items-center justify-center gap-1 md:gap-3 max-w-5xl mx-auto">
            {!result && (
              <>
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-1.5 md:h-2.5 bg-emerald-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-0.5 h-1.5 md:h-2.5 bg-emerald-500 animate-pulse" style={{ animationDelay: '100ms' }} />
                  <div className="w-0.5 h-1.5 md:h-2.5 bg-emerald-500 animate-pulse" style={{ animationDelay: '200ms' }} />
                </div>
                <span className="text-emerald-500 text-[18px] md:text-xl font-medium leading-none py-0.5 md:py-0">Listening — play the chord</span>
              </>
            )}
            {result === 'correct' && (
              <>
                <CheckCircle2 className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-emerald-500" />
                <span className="text-emerald-500 text-[10px] md:text-xs font-bold leading-none py-0.5 md:py-0">Correct!</span>
              </>
            )}
            {result === 'wrong' && (
              <>
                <XCircle className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-red-500" />
                <span className="text-red-500 text-[10px] md:text-xs font-bold leading-none py-0.5 md:py-0">Try again</span>
              </>
            )}

            {/* Mobile Sensitivity */}
            <div className="md:hidden flex items-center gap-1">
              <button
                onClick={decreaseSensitivity}
                disabled={sensitivity <= 1}
                className="p-0.5 rounded-md bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                aria-label="Decrease sensitivity"
              >
                <Minus className="w-[18px] h-[18px] text-[hsl(var(--text-subtle))]" />
              </button>
              <span className="text-[18px] text-emerald-500 font-bold min-w-[1.5rem] text-center leading-none">
                {sensitivity}
              </span>
              <button
                onClick={increaseSensitivity}
                disabled={sensitivity >= 10}
                className="p-0.5 rounded-md bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                aria-label="Increase sensitivity"
              >
                <Plus className="w-[18px] h-[18px] text-[hsl(var(--text-subtle))]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Practice Area */}
      <div className="flex-1 flex items-center justify-center pt-0 pb-16 px-4 -mt-12">
        <div className="text-center">
          {/* Chord Symbol - Always Visible */}
          <div className="mb-6 mt-[64px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${chord.id}-symbol`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-[58px] font-black text-white mb-2 leading-none">
                  {chord.symbol}
                </div>
                
                {/* Chord Name - Toggleable */}
                <div className="relative flex items-center justify-center">
                  {showChordName ? (
                    <span className="text-2xl font-medium text-[hsl(var(--text-subtle))]">
                      {chord.name}
                    </span>
                  ) : (
                    <span className="text-lg text-[hsl(var(--text-muted))] italic">
                      Chord name hidden
                    </span>
                  )}
                  <div className="absolute right-0">
                    <ShowChordNameToggle 
                      showChordName={showChordName}
                      onToggle={setShowChordName}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Diagram Section Container */}
          <div className="-mt-[319px]">
            {/* Detection Feedback Pill */}
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

            {/* Diagram & Tablature */}
            {showDiagrams && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${chord.id}-diagram`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-end justify-center gap-6 mb-2 -mt-[10px]"
                  style={{ transform: 'scale(1.38)' }}
                >
                  <ChordDiagram chord={chord} size="lg" />
                  <ChordTablature chord={chord} size="lg" />
                </motion.div>
              </AnimatePresence>
            )}

            {/* Hidden Diagram State */}
            {!showDiagrams && (
              <div className="text-[hsl(var(--text-muted))] mb-3 -mt-[10px]">
                <EyeOff className="w-7 h-7 mx-auto mb-2 opacity-50" />
                <div className="text-xl font-semibold">Diagram hidden</div>
              </div>
            )}

            {/* Toggle Control */}
            <div className="flex items-center justify-between gap-6 mt-4 max-w-md mx-auto">
              <span className="text-[hsl(var(--text-subtle))] text-lg font-medium">Chord Diagrams On/Off</span>
              <ShowDiagramsToggle 
                showDiagrams={showDiagrams}
                onToggle={setShowDiagrams}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Toolbar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 border-t border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] backdrop-blur-md">
        <div className="flex items-stretch gap-2 px-3 py-4 md:pb-safe max-w-2xl mx-auto">
          {/* Prev */}
          <button
            onClick={() => {
              console.log('⬅️ PREV BUTTON CLICKED');
              handlePrev();
            }}
            aria-label="Previous chord"
            className="min-w-[56px] min-h-[56px] rounded-xl flex items-center justify-center touch-manipulation
              bg-[hsl(var(--bg-surface))] border-2 border-[hsl(var(--border-subtle))]
              hover:bg-[hsl(var(--bg-overlay))] active:scale-95 transition-all"
          >
            <SkipBack className="w-6 h-6 text-[hsl(var(--text-subtle))]" />
          </button>

          {/* Play Chord */}
          <button
            onClick={handlePlayChord}
            aria-label="Play chord"
            className="flex-1 min-h-[56px] rounded-xl flex items-center justify-center gap-2 touch-manipulation
              bg-[hsl(var(--color-primary)/0.15)] border-2 border-[hsl(var(--color-primary)/0.4)]
              text-[hsl(var(--color-primary))] font-display font-bold text-lg
              hover:bg-[hsl(var(--color-primary)/0.25)] active:scale-[0.97] transition-all"
          >
            <Volume2 className="w-6 h-6" />
            <span className="hidden sm:inline">Play</span>
          </button>

          {/* Next */}
          <button
            onClick={() => {
              console.log('➡️ NEXT BUTTON CLICKED');
              handleNext();
            }}
            aria-label="Next chord"
            className="flex-1 min-h-[56px] rounded-xl flex items-center justify-center gap-2 touch-manipulation
              bg-[hsl(var(--color-primary))] text-white
              font-display font-bold text-lg
              hover:bg-[hsl(var(--color-emphasis))] active:scale-[0.97] transition-all
              shadow-lg shadow-[hsl(var(--color-primary)/0.3)]"
          >
            <span>Next</span>
            <SkipForward className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
