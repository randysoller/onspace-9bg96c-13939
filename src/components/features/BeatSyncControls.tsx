/**
 * Beat Sync Controls Component
 * 
 * Comprehensive panel for metronome beat-sync with:
 * - Start/Stop button (always visible)
 * - Sync unit toggle (Beats vs Measures)
 * - Count control (1-32 beats/measures)
 * - Auto-reveal toggle
 * - Count-in length selector (1/2/4 bars)
 * - Count-in visual overlay (fullscreen with beat numbers)
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useMetronomeStore } from '@/stores/metronomeStore';

interface BeatSyncControlsProps {
  onChordAdvance?: () => void;
  onAutoReveal?: () => void;
}

export function BeatSyncControls({ onChordAdvance, onAutoReveal }: BeatSyncControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rapidIncrement, setRapidIncrement] = useState<'up' | 'down' | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rapidIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    isPlaying,
    bpm,
    beatsPerMeasure,
    currentBeat,
    syncEnabled,
    syncUnit,
    beatsPerChord,
    autoRevealBeforeAdvance,
    beatsUntilAdvance,
    setIsPlaying,
    setBpm,
    setSyncEnabled,
    setSyncUnit,
    setBeatsPerChord,
    setAutoRevealBeforeAdvance,
    setCountInMeasures,
    countInMeasures,
    startCountIn,
    stop: stopMetronome,
  } = useMetronomeStore();

  const handleStartStop = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      // startCountIn() enables sync and starts playing in one atomic store update
      startCountIn();
    }
  };

  const handleToggleSync = () => {
    if (isPlaying) stopMetronome();
    setSyncEnabled(!syncEnabled);
  };

  const incrementCount = () => {
    setBeatsPerChord(Math.min(32, beatsPerChord + 1));
  };

  const decrementCount = () => {
    setBeatsPerChord(Math.max(1, beatsPerChord - 1));
  };

  const incrementBPM = () => {
    const newValue = Math.min(250, bpm + 1);
    setBpm(newValue);
  };

  const decrementBPM = () => {
    const newValue = Math.max(20, bpm - 1);
    setBpm(newValue);
  };

  const handleBPMButtonPress = (direction: 'up' | 'down') => {
    // Immediate single increment
    if (direction === 'up') {
      incrementBPM();
    } else {
      decrementBPM();
    }
    
    // After 2 seconds, start rapid increment
    holdTimeoutRef.current = setTimeout(() => {
      setRapidIncrement(direction);
    }, 2000);
  };

  const handleBPMButtonRelease = () => {
    // Clear timeout if released before 2 seconds
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    
    // Stop rapid increment
    setRapidIncrement(null);
  };

  // Handle rapid increment
  useEffect(() => {
    if (!rapidIncrement) return;
    
    rapidIntervalRef.current = setInterval(() => {
      if (rapidIncrement === 'up') {
        incrementBPM();
      } else {
        decrementBPM();
      }
    }, 100); // 10 increments per second
    
    return () => {
      if (rapidIntervalRef.current) {
        clearInterval(rapidIntervalRef.current);
        rapidIntervalRef.current = null;
      }
    };
  }, [rapidIncrement, bpm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (rapidIntervalRef.current) clearInterval(rapidIntervalRef.current);
    };
  }, []);

  const getSummaryText = () => {
    if (!syncEnabled) return '';
    const unit = syncUnit === 'beats' ? 'beat' : 'measure';
    const plural = beatsPerChord === 1 ? '' : 's';
    return `Every ${beatsPerChord} ${unit}${plural}`;
  };

  return (
    <>
      {/* Beat Sync Panel */}
      <div className="relative border border-[hsl(var(--border-subtle))] rounded-lg bg-[hsl(var(--bg-surface))] overflow-visible w-[283px] h-[56px] flex flex-col">
        {/* Header Row — all children must fit within w-[260px] h-[56px] */}
        <div className="flex items-center gap-2 px-2.5 h-full overflow-hidden">

          {/* On/Off toggle */}
          <button
            onClick={handleToggleSync}
            aria-label={syncEnabled ? 'Disable beat sync' : 'Enable beat sync'}
            title={syncEnabled ? 'Beat sync ON — click to disable' : 'Beat sync OFF — click to enable'}
            className={`flex-shrink-0 px-2 py-1 rounded-lg border transition-all active:scale-95 text-xs font-bold min-w-[36px] ${
              syncEnabled
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-[hsl(var(--bg-overlay))] border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-subtle))]'
            }`}
          >
            {syncEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Label + status — grows to fill remaining space */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[hsl(var(--text-default))] leading-none truncate">
              Beat Sync
            </div>
            <div className={`text-[11px] leading-none mt-0.5 truncate ${
              syncEnabled ? 'text-emerald-400' : 'text-[hsl(var(--text-muted))]'
            }`}>
              {syncEnabled ? getSummaryText() : 'Off'}
            </div>
          </div>

          {/* Start / Stop button */}
          <button
            onClick={handleStartStop}
            className={`flex-shrink-0 px-2.5 py-1 rounded flex items-center gap-1 font-semibold text-xs
              transition-all active:scale-95
              ${
                isPlaying
                  ? 'bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
          >
            {isPlaying ? (
              <><Square className="w-3 h-3" /><span>Stop</span></>
            ) : (
              <><Play className="w-3 h-3" /><span>Start</span></>
            )}
          </button>

          {/* Expand / Collapse chevron */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-0.5 hover:bg-[hsl(var(--bg-elevated))] rounded transition-colors"
          >
            {isExpanded
              ? <ChevronUp   className="w-4 h-4 text-[hsl(var(--text-subtle))]" strokeWidth={2.5} />
              : <ChevronDown className="w-4 h-4 text-[hsl(var(--text-subtle))]" strokeWidth={2.5} />}
          </button>

        </div>

        {/* Expanded Controls */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 mt-1 overflow-hidden z-[60] border border-[hsl(var(--border-subtle))] rounded-lg bg-[hsl(var(--bg-surface))] shadow-xl"
            >
              <div className="p-4 space-y-4">
                {/* Sync Unit Toggle */}
                <div>
                  <label className="text-xs uppercase tracking-wide text-[hsl(var(--text-muted))] mb-2 block">
                    Count By
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSyncUnit('beats')}
                      className={`
                        flex-1 py-2 px-4 rounded-lg text-sm font-display font-semibold transition-all
                        ${syncUnit === 'beats'
                          ? 'bg-[hsl(var(--color-primary))] text-white'
                          : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))]'
                        }
                      `}
                    >
                      Beats
                    </button>
                    <button
                      onClick={() => setSyncUnit('measures')}
                      className={`
                        flex-1 py-2 px-4 rounded-lg text-sm font-display font-semibold transition-all
                        ${syncUnit === 'measures'
                          ? 'bg-[hsl(var(--color-primary))] text-white'
                          : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))]'
                        }
                      `}
                    >
                      Measures
                    </button>
                  </div>
                </div>

                {/* Count Control */}
                <div>
                  <label className="text-xs uppercase tracking-wide text-[hsl(var(--text-muted))] mb-2 block">
                    Advance every
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={decrementCount}
                      disabled={beatsPerChord <= 1}
                      className="p-2 rounded-lg bg-[hsl(var(--bg-surface))] hover:bg-[hsl(var(--bg-overlay))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-black text-[hsl(var(--color-primary))]">
                        {beatsPerChord}
                      </div>
                      <div className="text-xs text-[hsl(var(--text-subtle))]">
                        {syncUnit === 'beats' ? 'beat' : 'measure'}{beatsPerChord === 1 ? '' : 's'}
                      </div>
                    </div>
                    
                    <button
                      onClick={incrementCount}
                      disabled={beatsPerChord >= 32}
                      className="p-2 rounded-lg bg-[hsl(var(--bg-surface))] hover:bg-[hsl(var(--bg-overlay))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* BPM Control */}
                <div>
                  <label className="text-xs uppercase tracking-wide text-[hsl(var(--text-muted))] mb-2 block">
                    Metronome BPM
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onMouseDown={() => handleBPMButtonPress('down')}
                      onMouseUp={handleBPMButtonRelease}
                      onMouseLeave={handleBPMButtonRelease}
                      onTouchStart={() => handleBPMButtonPress('down')}
                      onTouchEnd={handleBPMButtonRelease}
                      disabled={bpm <= 20}
                      className="p-2 rounded-lg bg-[hsl(var(--bg-surface))] hover:bg-[hsl(var(--bg-overlay))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-black text-[hsl(var(--color-primary))]">
                        {bpm}
                      </div>
                      <div className="text-xs text-[hsl(var(--text-subtle))]">
                        BPM {/* Current value: {bpm} */}
                      </div>
                    </div>
                    
                    <button
                      onMouseDown={() => handleBPMButtonPress('up')}
                      onMouseUp={handleBPMButtonRelease}
                      onMouseLeave={handleBPMButtonRelease}
                      onTouchStart={() => handleBPMButtonPress('up')}
                      onTouchEnd={handleBPMButtonRelease}
                      disabled={bpm >= 250}
                      className="p-2 rounded-lg bg-[hsl(var(--bg-surface))] hover:bg-[hsl(var(--bg-overlay))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick BPM Buttons */}
                <div>
                  <label className="text-xs uppercase tracking-wide text-[hsl(var(--text-muted))] mb-2 block">
                    Quick BPM
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[40, 80, 160, 200].map((quickBpm) => (
                      <button
                        key={quickBpm}
                        onClick={() => setBpm(quickBpm)}
                        className={`
                          py-2 rounded-lg font-semibold text-sm transition-all
                          ${
                            bpm === quickBpm
                              ? 'bg-amber-500 text-zinc-950'
                              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                          }
                        `}
                      >
                        {quickBpm}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Count-In Length */}
                <div>
                  <label className="text-xs uppercase tracking-wide text-[hsl(var(--text-muted))] mb-2 block">
                    Count-In Length
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 4].map((bars) => (
                      <button
                        key={bars}
                        onClick={() => setCountInMeasures(bars)}
                        className={`
                          flex-1 py-2 px-4 rounded-lg text-sm font-display font-semibold transition-all
                          ${countInMeasures === bars
                            ? 'bg-[hsl(var(--color-primary))] text-white'
                            : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))]'
                          }
                        `}
                      >
                        {bars} {bars === 1 ? 'bar' : 'bars'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Text */}
                {syncEnabled && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-sm text-emerald-500">
                      {autoRevealBeforeAdvance && (
                        <div className="mb-1">
                          ✓ Chord will auto-reveal 2 beats before advancing
                        </div>
                      )}
                      <div>
                        ✓ New chord every {beatsPerChord} {syncUnit === 'beats' ? 'beat' : 'measure'}
                        {beatsPerChord === 1 ? '' : 's'}
                      </div>
                      <div>
                        ✓ {countInMeasures}-bar count-in before first chord
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
