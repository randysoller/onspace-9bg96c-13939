/**
 * Practice Page - Single Chord Practice with Real-Time Detection
 * 
 * ROOT CAUSE FIX: chord was derived via useMemo(() => getCurrentChord(), [getCurrentChord])
 * but getCurrentChord is a store method that changes reference every render → unstable memoization
 * → handleNext/handlePrev constantly recreated → detectionConfig rebuilt → hook restarts
 * → component in constant churn, swallowing click events.
 *
 * FIX: Subscribe directly to practiceChords + currentIndex to compute chord as stable derived state.
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff,
  Volume2, 
  EyeOff, 
  SkipBack, 
  SkipForward, 
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

const getSensitivityLabel = (sens: number) => {
  if (sens <= 3) return { label: 'Strict', color: 'text-blue-400' };
  if (sens <= 7) return { label: 'Balanced', color: 'text-amber-400' };
  return { label: 'Sensitive', color: 'text-emerald-400' };
};

export default function Practice() {
  const navigate = useNavigate();

  // ─── DIRECT STORE SUBSCRIPTIONS ──────────────────────────────────────────────
  // Subscribe to the raw data, not getter functions.
  // This is the root-cause fix: chord is now stable derived state.
  const practiceChords = usePracticeStore(s => s.practiceChords);
  const currentIndex   = usePracticeStore(s => s.currentIndex);
  const isPracticing   = usePracticeStore(s => s.isPracticing);
  const isRevealed     = usePracticeStore(s => s.isRevealed);
  const nextChord      = usePracticeStore(s => s.nextChord);
  const prevChord      = usePracticeStore(s => s.prevChord);
  const revealChord    = usePracticeStore(s => s.revealChord);
  const hideChord      = usePracticeStore(s => s.hideChord);
  const stopPractice   = usePracticeStore(s => s.stopPractice);

  // Derive chord directly — stable when index/array don't change
  const chord = practiceChords[currentIndex] ?? null;

  // Detection settings
  const sensitivity     = useDetectionSettingsStore(s => s.sensitivity);
  const setSensitivity  = useDetectionSettingsStore(s => s.setSensitivity);
  const advancedEnabled = useDetectionSettingsStore(s => s.advancedEnabled);
  const advancedValues  = useDetectionSettingsStore(s => s.advancedValues);

  // Metronome
  const resetBeatCounter  = useMetronomeStore(s => s.resetBeatCounter);
  const beatsUntilAdvance = useMetronomeStore(s => s.beatsUntilAdvance);
  const syncEnabled       = useMetronomeStore(s => s.syncEnabled);
  const metronomeIsPlaying = useMetronomeStore(s => s.isPlaying);

  // ─── LOCAL STATE ─────────────────────────────────────────────────────────────
  const [showDiagrams, setShowDiagrams] = useState(() => {
    try {
      const saved = localStorage.getItem('fretmaster-show-diagrams');
      return saved !== null ? (JSON.parse(saved) === true) : true;
    } catch {
      return true;
    }
  });

  const [showChordName, setShowChordName] = useState(() => {
    try {
      const saved = localStorage.getItem('fretmaster-show-chord-name');
      return saved !== null ? (JSON.parse(saved) === true) : true;
    } catch {
      return true;
    }
  });

  // ─── SESSION STATS ────────────────────────────────────────────────────────────
  const { startSession, recordAttempt, resetChordTimer, endSession, getSummary } = useSessionStats();

  // ─── AUDIO ───────────────────────────────────────────────────────────────────
  const { playChord, stopCurrent } = useChordAudio();

  // ─── AUTO-ADVANCE ─────────────────────────────────────────────────────────────
  const autoAdvanceRef = useRef<number | null>(null);

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, []);

  // ─── NAV HANDLERS ────────────────────────────────────────────────────────────
  // These now only depend on stable store action references + primitives,
  // so they won't be recreated on every render.
  const handleNext = useCallback(() => {
    clearAutoAdvance();
    hideChord();
    resetChordTimer();
    resetBeatCounter();
    nextChord();
  }, [clearAutoAdvance, hideChord, resetChordTimer, resetBeatCounter, nextChord]);

  const handlePrev = useCallback(() => {
    clearAutoAdvance();
    hideChord();
    resetChordTimer();
    resetBeatCounter();
    prevChord();
  }, [clearAutoAdvance, hideChord, resetChordTimer, resetBeatCounter, prevChord]);

  const handleBack = useCallback(() => {
    const summary = getSummary();
    if (summary.attempts.length > 0) {
      endSession();
    } else {
      stopPractice();
      navigate('/chord-setup');
    }
  }, [getSummary, endSession, stopPractice, navigate]);

  // ─── DETECTION CALLBACKS ─────────────────────────────────────────────────────
  // Use a ref for chord so the detection callbacks never need to be recreated
  const chordRef = useRef(chord);
  useEffect(() => { chordRef.current = chord; }, [chord]);

  const handleCorrectDetection = useCallback(() => {
    const c = chordRef.current;
    if (c) {
      recordAttempt(c.symbol, c.name, 'correct');
      revealChord();
      resetChordTimer();
      clearAutoAdvance();
      autoAdvanceRef.current = window.setTimeout(handleNext, 1500);
    }
  }, [recordAttempt, revealChord, resetChordTimer, clearAutoAdvance, handleNext]);

  const handleWrongDetection = useCallback((_detectedSymbol: string) => {
    // future: show wrong detection feedback
  }, []);

  // ─── DETECTION CONFIG ─────────────────────────────────────────────────────────
  // Stable: only rebuilds when chord id, sensitivity, or advanced settings change
  const detectionConfig = useMemo(() => ({
    targetChord: chord,
    sensitivity,
    autoStart: true,
    advancedSettings: advancedEnabled ? advancedValues : null,
    onCorrect: handleCorrectDetection,
    onWrongDetected: handleWrongDetection,
  }), [
    chord?.id,           // only re-run when the chord actually changes (by id)
    sensitivity,
    advancedEnabled,
    advancedValues,
    handleCorrectDetection,
    handleWrongDetection,
  ]);

  const {
    isListening,
    result,
    permissionDenied,
    toggleListening,
    stopListening,
    pauseDetection,
  } = useChordDetection(detectionConfig);

  // ─── PLAY CHORD ───────────────────────────────────────────────────────────────
  const handlePlayChord = useCallback(() => {
    const c = chordRef.current;
    if (c) {
      pauseDetection(2000);
      playChord(c);
    }
  }, [pauseDetection, playChord]);

  // ─── SENSITIVITY ─────────────────────────────────────────────────────────────
  const decreaseSensitivity = useCallback(() => setSensitivity(Math.max(1, sensitivity - 1)), [setSensitivity, sensitivity]);
  const increaseSensitivity = useCallback(() => setSensitivity(Math.min(10, sensitivity + 1)), [setSensitivity, sensitivity]);
  const sensitivityLabel = useMemo(() => getSensitivityLabel(sensitivity), [sensitivity]);

  // ─── EFFECTS ─────────────────────────────────────────────────────────────────
  useEffect(() => { startSession(); }, [startSession]);

  useEffect(() => {
    if (!isPracticing) navigate('/chord-setup');
  }, [isPracticing, navigate]);

  useEffect(() => {
    return () => { stopListening(); stopCurrent(); clearAutoAdvance(); };
  }, [stopListening, stopCurrent, clearAutoAdvance]);

  useEffect(() => {
    try {
      localStorage.setItem('fretmaster-show-diagrams', showDiagrams ? 'true' : 'false');
      localStorage.setItem('fretmaster-show-chord-name', showChordName ? 'true' : 'false');
    } catch {
      // localStorage write failure (e.g. private mode quota) — silently ignore
    }
  }, [showDiagrams, showChordName]);

  useEffect(() => {
    if (syncEnabled && metronomeIsPlaying && beatsUntilAdvance <= 0) {
      handleNext();
    }
  }, [beatsUntilAdvance, syncEnabled, metronomeIsPlaying, handleNext]);

  useEffect(() => { resetChordTimer(); }, [chord?.id, resetChordTimer]);

  // ─── EMPTY STATE ─────────────────────────────────────────────────────────────
  if (!chord) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bg-base))] text-[hsl(var(--text-default))] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">No chords to practice</h2>
          <p className="text-[hsl(var(--text-subtle))] mb-6">
            The filter settings resulted in no matching chords. Adjust your filters and try again.
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

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[hsl(var(--bg-base))] text-[hsl(var(--text-default))] pb-[calc(64px+env(safe-area-inset-bottom))]">

      {/* ── Top Toolbar ── */}
      <div className="border-b border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] px-4 py-3">
        <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex-shrink-0">
            <BeatSyncControls onChordAdvance={handleNext} onAutoReveal={handlePlayChord} />
          </div>
          <div className="flex items-center gap-3">
            {isListening && (
              <div className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))]">
                <Sliders className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
                <button onClick={decreaseSensitivity} disabled={sensitivity <= 1}
                  className="p-1.5 rounded-md hover:bg-[hsl(var(--bg-overlay))] active:scale-95 transition-all disabled:opacity-30"
                  aria-label="Decrease sensitivity">
                  <Minus className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
                </button>
                <span className="text-sm text-emerald-500 font-bold min-w-[1.5rem] text-center">{sensitivity}</span>
                <button onClick={increaseSensitivity} disabled={sensitivity >= 10}
                  className="p-1.5 rounded-md hover:bg-[hsl(var(--bg-overlay))] active:scale-95 transition-all disabled:opacity-30"
                  aria-label="Increase sensitivity">
                  <Plus className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
                </button>
              </div>
            )}
            <button onClick={toggleListening}
              className={`p-2 rounded-lg transition-all active:scale-95 h-[40px] w-[40px] flex items-center justify-center
                ${isListening
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500'
                  : 'bg-[hsl(var(--bg-surface))] hover:bg-[hsl(var(--bg-overlay))] border border-[hsl(var(--border-subtle))]'
                }`}>
              <Mic className={`w-4 h-4 ${isListening ? 'text-emerald-500' : 'text-[hsl(var(--text-subtle))]'}`} />
            </button>
            <VolumeControl compact />
          </div>
        </div>
      </div>

      {/* ── Permission Denied ── */}
      {permissionDenied && (
        <div className="bg-red-900/20 border-b border-red-500/30 px-4 py-3">
          <div className="flex items-center gap-2 text-red-500 text-sm max-w-5xl mx-auto">
            <MicOff className="w-4 h-4" />
            <span className="font-medium">Microphone access denied — allow in browser settings and refresh</span>
          </div>
        </div>
      )}

      {/* ── Listening Status ── */}
      {isListening && (
        <div className={`border-b px-4 py-0 md:py-1 ${
          result === 'correct' ? 'bg-emerald-900/20 border-emerald-500/30'
          : result === 'wrong'  ? 'bg-red-900/20 border-red-500/30'
          : 'bg-[hsl(var(--bg-surface))]'
        }`}>
          <div className="flex items-center justify-center gap-1 md:gap-3 max-w-5xl mx-auto">
            {!result && (
              <>
                <div className="flex gap-0.5">
                  {[0,100,200].map(d => (
                    <div key={d} className="w-0.5 h-1.5 md:h-2.5 bg-emerald-500 animate-pulse" style={{ animationDelay: `${d}ms` }} />
                  ))}
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
            <div className="md:hidden flex items-center gap-1">
              <button onClick={decreaseSensitivity} disabled={sensitivity <= 1}
                className="p-0.5 rounded-md bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))] active:scale-95 transition-all disabled:opacity-30 touch-manipulation">
                <Minus className="w-[18px] h-[18px] text-[hsl(var(--text-subtle))]" />
              </button>
              <span className="text-[18px] text-emerald-500 font-bold min-w-[1.5rem] text-center leading-none">{sensitivity}</span>
              <button onClick={increaseSensitivity} disabled={sensitivity >= 10}
                className="p-0.5 rounded-md bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))] active:scale-95 transition-all disabled:opacity-30 touch-manipulation">
                <Plus className="w-[18px] h-[18px] text-[hsl(var(--text-subtle))]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex items-center justify-center pt-0 pb-16 px-4 -mt-12">
        <div className="text-center">

          {/* Chord Symbol */}
          <div className="mb-6 mt-[64px]">
            <AnimatePresence mode="wait">
              <motion.div key={`${chord.id}-symbol`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}>
                <div className="text-[58px] font-black text-white mb-2 leading-none">{chord.symbol}</div>
                <div className="relative flex items-center justify-center">
                  {showChordName
                    ? <span className="text-2xl font-medium text-[hsl(var(--text-subtle))]">{chord.name}</span>
                    : <span className="text-lg text-[hsl(var(--text-muted))] italic">Chord name hidden</span>
                  }
                  <div className="absolute right-0">
                    <ShowChordNameToggle showChordName={showChordName} onToggle={setShowChordName} />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Diagram Section */}
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
                    className="pointer-events-none">
                    <div className={`px-7 py-2 rounded-2xl backdrop-blur-md border-2 ${
                      result === 'correct'
                        ? 'bg-[hsl(142_71%_45%/0.15)] border-[hsl(142_71%_45%/0.5)]'
                        : 'bg-[hsl(0_84%_60%/0.15)] border-[hsl(0_84%_60%/0.5)]'
                    }`}>
                      <span className={`font-display text-2xl font-extrabold uppercase tracking-wider ${
                        result === 'correct' ? 'text-emerald-500' : 'text-red-500'
                      }`}
                        style={{ textShadow: result === 'correct'
                          ? '0 0 20px hsl(142 71% 45% / 0.5)'
                          : '0 0 20px hsl(0 84% 60% / 0.5)' }}>
                        {result === 'correct' ? 'Correct' : 'Wrong'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Diagram & Tablature */}
            {showDiagrams ? (
              <AnimatePresence mode="wait">
                <motion.div key={`${chord.id}-diagram`}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-end justify-center gap-6 mb-2 -mt-[10px]"
                  style={{ transform: 'scale(1.38)' }}>
                  <ChordDiagram chord={chord} size="lg" />
                  <ChordTablature chord={chord} size="lg" />
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-[hsl(var(--text-muted))] mb-3 -mt-[10px]">
                <EyeOff className="w-7 h-7 mx-auto mb-2 opacity-50" />
                <div className="text-xl font-semibold">Diagram hidden</div>
              </div>
            )}

            {/* Diagram Toggle */}
            <div className="flex items-center justify-between gap-6 mt-4 max-w-md mx-auto">
              <span className="text-[hsl(var(--text-subtle))] text-lg font-medium">Chord Diagrams On/Off</span>
              <ShowDiagramsToggle showDiagrams={showDiagrams} onToggle={setShowDiagrams} />
            </div>

            {/* ── Inline Navigation Buttons ── */}
            <div className="flex items-stretch gap-3 mt-8 max-w-md mx-auto px-1">

              {/* Prev */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous chord"
                style={{ minWidth: 48, minHeight: 48, touchAction: 'manipulation', cursor: 'pointer' }}
                className="rounded-xl flex items-center justify-center
                  bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))]
                  hover:bg-[hsl(var(--bg-overlay))] hover:border-[hsl(var(--border-default))]
                  active:scale-95 transition-all"
              >
                <SkipBack className="w-5 h-5 text-[hsl(var(--text-subtle))]" />
              </button>

              {/* Play */}
              <button
                type="button"
                onClick={handlePlayChord}
                aria-label="Play chord"
                style={{ minHeight: 48, touchAction: 'manipulation', cursor: 'pointer', flex: 1 }}
                className="rounded-xl flex items-center justify-center gap-1.5
                  bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))]
                  text-[hsl(var(--color-primary))] font-semibold text-lg
                  hover:bg-[hsl(var(--color-primary)/0.12)] hover:border-[hsl(var(--color-primary)/0.4)]
                  active:scale-[0.97] transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <span>Play</span>
              </button>

              {/* Next */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next chord"
                style={{ minHeight: 48, touchAction: 'manipulation', cursor: 'pointer', flex: 1 }}
                className="rounded-xl flex items-center justify-center gap-1.5
                  bg-[hsl(var(--color-primary))] text-white font-semibold text-lg
                  hover:bg-[hsl(var(--color-emphasis))] active:scale-[0.97] transition-all
                  shadow-md shadow-[hsl(var(--color-primary)/0.25)]"
              >
                <span>Next</span>
                <SkipForward className="w-4 h-4" />
              </button>

            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
