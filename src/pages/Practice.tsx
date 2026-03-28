
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
import { VolumeControl } from '@/components/features/VolumeControl';

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
  
  const { getEffectiveVolume } = useAudioStore();
  const { sensitivity, setSensitivity, advancedEnabled, advancedValues } = useDetectionSettingsStore();
  const { resetBeatCounter, beatsUntilAdvance, syncEnabled, isPlaying: metronomeIsPlaying } = useMetronomeStore();
  
  // Local state
  const [showDiagrams, setShowDiagrams] = useState(() => {
    const saved = localStorage.getItem('fretmaster-show-diagrams');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Get current chord
  const chord = getCurrentChord();
  
  // DEBUG: Log chord and practice state
  console.log('🎸 Practice page render:', {
    isPracticing,
    chordExists: !!chord,
    chord: chord ? `${chord.root}${chord.type}` : 'null',
    chordId: chord?.id,
    currentIndex: usePracticeStore.getState().currentIndex,
    totalPracticeChords: usePracticeStore.getState().practiceChords.length,
  });
  
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
  
  // Auto-advance timeout ref
  const autoAdvanceTimeoutRef = useRef<number | null>(null);
  
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
      console.log('✅ Correct chord detected in Practice page!');
      if (chord) {
        recordAttempt(chord.symbol, chord.name, 'correct');
        revealChord();
        resetChordTimer();
        
        // Auto-advance to next chord after 1.5 seconds
        console.log('⏱️ Setting auto-advance timer for 1.5 seconds...');
        if (autoAdvanceTimeoutRef.current) {
          clearTimeout(autoAdvanceTimeoutRef.current);
        }
        autoAdvanceTimeoutRef.current = window.setTimeout(() => {
          console.log('⏭️ Auto-advancing to next chord...');
          handleNext();
          autoAdvanceTimeoutRef.current = null;
        }, 1500);
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
      navigate('/chord-setup');
    }
  }, [isPracticing, navigate]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopCurrent();
      // Clear auto-advance timeout
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
    };
  }, [stopListening, stopCurrent]);
  
  // Listen for show diagrams changes from toggle component
  useEffect(() => {
    const handleDiagramsChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ showDiagrams: boolean }>;
      setShowDiagrams(customEvent.detail.showDiagrams);
    };

    window.addEventListener('show-diagrams-changed', handleDiagramsChange);
    return () => window.removeEventListener('show-diagrams-changed', handleDiagramsChange);
  }, []);
  
  // Save show diagrams preference when it changes
  useEffect(() => {
    localStorage.setItem('fretmaster-show-diagrams', JSON.stringify(showDiagrams));
  }, [showDiagrams]);
  
  // Beat-sync chord advance handler
  useEffect(() => {
    if (!syncEnabled || !metronomeIsPlaying) return;
    
    // Check if it's time to advance
    if (beatsUntilAdvance <= 0) {
      handleNext();
    }
  }, [beatsUntilAdvance, syncEnabled, metronomeIsPlaying]);
  
  // Reset chord timer when chord changes
  useEffect(() => {
    resetChordTimer();
  }, [chord, resetChordTimer]);
  
  if (!chord) {
    // DEBUG: Log why there's no chord
    const state = usePracticeStore.getState();
    console.error('❌ No chord available!', {
      isPracticing: state.isPracticing,
      practiceChords: state.practiceChords.length,
      currentIndex: state.currentIndex,
      categories: Array.from(state.categories),
      chordTypes: Array.from(state.chordTypes),
      keyFilter: state.keyFilter,
    });
    
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
    // Clear any pending auto-advance
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    
    if (!isRevealed) {
      recordAttempt(chord.symbol, chord.name, 'skipped');
    }
    hideChord();
    resetChordTimer();
    resetBeatCounter();
    nextChord();
  };
  
  const handlePrev = () => {
    hideChord();
    resetChordTimer();
    resetBeatCounter();
    prevChord();
  };
  
  const handleRestart = () => {
    hideChord();
    resetChordTimer();
    resetBeatCounter();
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
    <div className="min-h-screen bg-[hsl(var(--bg-base))] text-[hsl(var(--text-default))] pb-32 md:pb-24">
      {/* Top Toolbar */}
      <div className="border-b border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] px-4 py-3">
        <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
          {/* Left: Beat Sync (collapsed by default) */}
          <div className="flex-shrink-0">
            <BeatSyncControls
              onChordAdvance={handleNext}
              onAutoReveal={handleReveal}
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Mic Sensitivity */}
            {isListening && (
              <div className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))]">
                <Sliders className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
                <button
                  onClick={() => setSensitivity(Math.max(1, sensitivity - 1))}
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
                  onClick={() => setSensitivity(Math.min(10, sensitivity + 1))}
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
          border-b px-4 py-2.5
          ${result === 'correct' 
            ? 'bg-emerald-900/20 border-emerald-500/30' 
            : result === 'wrong'
            ? 'bg-red-900/20 border-red-500/30'
            : 'bg-[hsl(var(--bg-surface))]'
          }
        `}>
          <div className="flex items-center justify-center gap-3 max-w-5xl mx-auto">
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

            {/* Mobile Sensitivity (show on small screens) */}
            <div className="md:hidden flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
              <button
                onClick={() => setSensitivity(Math.max(1, sensitivity - 1))}
                disabled={sensitivity <= 1}
                className="p-2 rounded-md bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                aria-label="Decrease sensitivity"
              >
                <Minus className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
              </button>
              <span className="text-sm text-emerald-500 font-bold min-w-[1.5rem] text-center">
                {sensitivity}
              </span>
              <button
                onClick={() => setSensitivity(Math.min(10, sensitivity + 1))}
                disabled={sensitivity >= 10}
                className="p-2 rounded-md bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                aria-label="Increase sensitivity"
              >
                <Plus className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Practice Area */}
      <div className="flex-1 flex items-center justify-center pt-0 pb-12 px-4 -mt-8">
        <div className="text-center">
          {/* Chord Name - Always Visible */}
          <div className="mb-6 mt-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${chord.id}-symbol`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-6xl font-black text-white mb-2 leading-none">
                  {chord.symbol}
                </div>
                <div className="text-2xl font-medium text-[hsl(var(--text-subtle))]">
                  {chord.name}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Diagram Section Container - Moved up */}
          <div className="-mt-[152px]">
          {/* Detection Feedback Pill - Positioned between name and diagram */}
          <div className="min-h-[60px] mb-6 mt-[134px] flex items-center justify-center">
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

          {/* Diagram & Tablature - Show when toggle is ON */}
          {showDiagrams && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${chord.id}-diagram`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-6 mb-3"
              >
                <ChordDiagram chord={chord} size="lg" />
                <ChordTablature chord={chord} size="md" />
              </motion.div>
            </AnimatePresence>
          )}

          {/* Hidden Diagram State - Show when toggle is OFF */}
          {!showDiagrams && (
            <div className="text-[hsl(var(--text-muted))] mb-3">
              <EyeOff className="w-7 h-7 mx-auto mb-3 opacity-50" />
              <div className="text-xl font-semibold">Diagram hidden</div>
            </div>
          )}

          {/* Toggle Control - Always Visible, Below Diagram */}
          <div className="flex items-center justify-center gap-3 mt-10">
            <span className="text-[hsl(var(--text-subtle))] text-lg font-medium">Chord Diagrams On/Off</span>
            <ShowDiagramsToggle />
          </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Toolbar - Always Visible on Mobile, Above Tab Bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 border-t border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] backdrop-blur-md">
        <div className="flex items-stretch gap-2 px-3 py-4 md:pb-safe max-w-2xl mx-auto">
          {/* Prev */}
          <button
            onClick={handlePrev}
            aria-label="Previous chord"
            className="min-w-[56px] min-h-[56px] rounded-xl flex items-center justify-center touch-manipulation
              bg-[hsl(var(--bg-surface))] border-2 border-[hsl(var(--border-subtle))]
              hover:bg-[hsl(var(--bg-overlay))] active:scale-95 transition-all"
          >
            <SkipBack className="w-6 h-6 text-[hsl(var(--text-subtle))]" />
          </button>

          {/* Reveal / Play Again */}
          {!isRevealed ? (
            <button
              onClick={handleReveal}
              aria-label="Reveal chord"
              className="flex-1 min-h-[56px] rounded-xl flex items-center justify-center gap-2 touch-manipulation
                bg-[hsl(var(--color-primary)/0.15)] border-2 border-[hsl(var(--color-primary)/0.4)]
                text-[hsl(var(--color-primary))] font-display font-bold text-lg
                hover:bg-[hsl(var(--color-primary)/0.25)] active:scale-[0.97] transition-all"
            >
              <Eye className="w-6 h-6" />
              <span className="hidden sm:inline">Reveal</span>
            </button>
          ) : (
            <button
              onClick={handlePlayAgain}
              aria-label="Play chord"
              className="flex-1 min-h-[56px] rounded-xl flex items-center justify-center gap-2 touch-manipulation
                bg-[hsl(var(--bg-surface))] border-2 border-[hsl(var(--border-subtle))]
                text-[hsl(var(--text-default))] font-display font-bold text-lg
                hover:bg-[hsl(var(--bg-overlay))] active:scale-[0.97] transition-all"
            >
              <Volume2 className="w-6 h-6" />
              <span className="hidden sm:inline">Play</span>
            </button>
          )}

          {/* Next - Always Visible, Prominent */}
          <button
            onClick={handleNext}
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
