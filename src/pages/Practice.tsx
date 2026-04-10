
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
  Sliders,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { usePracticeStore } from '@/stores/practiceStore';
import { ChordSymbol } from '@/components/features/ChordSymbol';
import { useDetectionSettingsStore } from '@/stores/detectionSettingsStore';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useChordDetection } from '@/hooks/useChordDetection';
import { useChordAudio } from '@/hooks/useChordAudio';
import { useSessionStats } from '@/hooks/useSessionStats';
import { ChordDisplay } from '@/components/features/ChordDisplay';
import { BeatSyncControls } from '@/components/features/BeatSyncControls';
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
  const resetBeatCounter   = useMetronomeStore(s => s.resetBeatCounter);
  const beatsUntilAdvance  = useMetronomeStore(s => s.beatsUntilAdvance);
  const syncEnabled        = useMetronomeStore(s => s.syncEnabled);
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
  }), [chord, sensitivity, advancedEnabled, advancedValues, handleCorrectDetection, handleWrongDetection]);

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
  // Use functional updater form so these callbacks don't need `sensitivity` in their deps —
  // they only recreate when `setSensitivity` changes (i.e. never, store actions are stable).
  const decreaseSensitivity = useCallback(() => setSensitivity(Math.max(1, sensitivity - 1)), [setSensitivity, sensitivity]);
  const increaseSensitivity = useCallback(() => setSensitivity(Math.min(10, sensitivity + 1)), [setSensitivity, sensitivity]);
  // getSensitivityLabel is a trivial lookup — memoizing it costs more than just calling it.
  const sensitivityLabel = getSensitivityLabel(sensitivity);

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

  // Beat-sync chord advance: fires when the metronome has counted enough beats.
  // beatsUntilAdvance hits 0 in incrementBeat(); resetBeatCounter() (called inside
  // handleNext → resetBeatCounter) resets it so this effect won't fire again until
  // the next cycle completes.
  const prevBeatsUntilAdvance = useRef<number>(Infinity);
  useEffect(() => {
    if (
      syncEnabled &&
      metronomeIsPlaying &&
      beatsUntilAdvance === 0 &&
      prevBeatsUntilAdvance.current > 0
    ) {
      handleNext();
    }
    prevBeatsUntilAdvance.current = beatsUntilAdvance;
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
        {/* relative container: BeatSyncControls is absolutely pinned to the left so its
             width never participates in the flex layout and cannot push the right-side controls.
             pointer-events-none on the wrapper + pointer-events-auto on the child ensures the
             absolute box does NOT intercept touches outside its visible 56px header area —
             critical on mobile where the chord diagram overlaps this region visually. */}
        <div className="relative flex items-center justify-end max-w-5xl mx-auto min-h-[40px]">
          <div className="absolute left-0 pointer-events-none">
            <div className="pointer-events-auto">
              <BeatSyncControls onChordAdvance={handleNext} onAutoReveal={handlePlayChord} />
            </div>
          </div>
          {/* The missing closing div tag has been added here */}
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

      {/* ── Listening Status ──
           Fixed min-h ensures bar height never changes between listening/correct/wrong
           states, preventing layout shifts in the content below.
      */}
      {isListening && (
        <div className={`border-b px-4 py-1 md:py-1 min-h-[40px] md:min-h-[46px] flex items-center ${
          result === 'correct' ? 'bg-emerald-900/20 border-emerald-500/30'
          : result === 'wrong'  ? 'bg-red-900/20 border-red-500/30'
          : 'bg-[hsl(var(--bg-surface))]'
        }`}>
          {/* Mobile: left = status text, right = sensitivity controls */}
          <div className="w-full flex items-center justify-between gap-2 max-w-5xl mx-auto md:justify-center md:gap-3">

            {/* Status text */}
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
              {!result && (
                <>
                  <div className="flex gap-0.5 shrink-0">
                    {[0, 100, 200].map(d => (
                      <div key={d} className="w-0.5 h-2 md:h-2.5 bg-emerald-500 animate-pulse" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  <span className="text-emerald-500 text-base md:text-xl font-medium leading-normal truncate">
                    <span className="md:hidden">Listening —</span>
                    <span className="hidden md:inline">Listening — play the chord</span>
                  </span>
                </>
              )}
              {result === 'correct' && (
                <>
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 shrink-0" />
                  <span className="text-emerald-500 text-base md:text-xl font-bold leading-normal">Correct!</span>
                </>
              )}
              {result === 'wrong' && (
                <>
                  <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 shrink-0" />
                  <span className="text-red-500 text-base md:text-xl font-bold leading-normal">Try again</span>
                </>
              )}
            </div>

            {/* Mobile sensitivity controls — right-aligned */}
            <div className="md:hidden flex items-center gap-1.5 shrink-0">
              <span className="text-base text-emerald-500 font-medium leading-none">Mic Sensitivity</span>
              <button
                onTouchStart={e => { e.preventDefault(); if (sensitivity > 1) decreaseSensitivity(); }}
                onClick={decreaseSensitivity}
                disabled={sensitivity <= 1}
                aria-label="Decrease sensitivity"
                style={{ minWidth: 52, minHeight: 52, touchAction: 'manipulation', userSelect: 'none' }}
                className="rounded-lg bg-[hsl(var(--bg-overlay))] border border-[hsl(var(--border-subtle))] flex items-center justify-center active:scale-95 transition-all disabled:opacity-30">
                <Minus className="w-6 h-6 text-[hsl(var(--text-default))]" />
              </button>
              <span className="text-lg text-emerald-500 font-bold min-w-[2rem] text-center leading-none">{sensitivity}</span>
              <button
                onTouchStart={e => { e.preventDefault(); if (sensitivity < 10) increaseSensitivity(); }}
                onClick={increaseSensitivity}
                disabled={sensitivity >= 10}
                aria-label="Increase sensitivity"
                style={{ minWidth: 52, minHeight: 52, touchAction: 'manipulation', userSelect: 'none' }}
                className="rounded-lg bg-[hsl(var(--bg-overlay))] border border-[hsl(var(--border-subtle))] flex items-center justify-center active:scale-95 transition-all disabled:opacity-30">
                <Plus className="w-6 h-6 text-[hsl(var(--text-default))]" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex items-center justify-center pt-0 pb-16 px-4 -mt-12">
        <div className="text-center">

          {/* Chord Symbol + Name */}
          <div className="mb-6 mt-[64px]">
            <AnimatePresence mode="wait">
              <motion.div key={`${chord.id}-symbol`}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}>
                <div className="text-[58px] font-black text-white mb-2 leading-none"><ChordSymbol symbol={chord.symbol} /></div>
                <div className="relative flex items-center justify-center h-9">
                  {showChordName ? (
                    <span className="text-2xl font-medium text-[hsl(var(--text-subtle))]">
                      {chord.name}
                    </span>
                  ) : (
                    <span className="text-base font-medium text-[hsl(var(--text-muted))] italic tracking-wide">
                      Chord name hidden
                    </span>
                  )}
                  <div className="absolute right-0">
                    <ShowChordNameToggle showChordName={showChordName} onToggle={setShowChordName} />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Diagram section — extracted to ChordDisplay for testability and separation of concerns */}
          <ChordDisplay
            chord={chord}
            showDiagrams={showDiagrams}
            result={result}
            onToggleDiagrams={setShowDiagrams}
            onPrev={handlePrev}
            onPlay={handlePlayChord}
            onNext={handleNext}
          />

        </div>
      </div>

    </div>
  );
}
