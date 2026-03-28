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

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Link2Off, Play, Square, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { useMetronomeStore } from '@/stores/metronomeStore';

interface BeatSyncControlsProps {
  onChordAdvance?: () => void;
  onAutoReveal?: () => void;
}

export function BeatSyncControls({ onChordAdvance, onAutoReveal }: BeatSyncControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
    isCountingIn,
    countInBeat,
    countInMeasures,
    setIsPlaying,
    setSyncEnabled,
    setSyncUnit,
    setBeatsPerChord,
    setAutoRevealBeforeAdvance,
    setCountInMeasures,
    startCountIn,
    stop: stopMetronome,
  } = useMetronomeStore();

  const handleStartStop = () => {
    if (isPlaying) {
      stopMetronome();
    } else if (syncEnabled) {
      startCountIn();
    } else {
      setIsPlaying(true);
    }
  };

  const incrementCount = () => {
    setBeatsPerChord(Math.min(32, beatsPerChord + 1));
  };

  const decrementCount = () => {
    setBeatsPerChord(Math.max(1, beatsPerChord - 1));
  };

  const getSummaryText = () => {
    if (!syncEnabled) return 'Disabled';
    const unit = syncUnit === 'beats' ? 'beat' : 'measure';
    const plural = beatsPerChord === 1 ? '' : 's';
    return `Every ${beatsPerChord} ${unit}${plural}`;
  };

  return (
    <>
      {/* Count-In Visual Overlay */}
      <AnimatePresence>
        {isCountingIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[hsl(var(--bg-base)/0.4)] backdrop-blur-sm pointer-events-none"
          >
            <AnimatePresence mode="wait">
              {countInBeat <= countInMeasures * beatsPerMeasure ? (
                <motion.div
                  key={`beat-${countInBeat}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  <div
                    className="font-black text-red-500"
                    style={{
                      fontSize: 'clamp(10rem, 20vw, 14rem)',
                      lineHeight: 1,
                      textShadow: '0 0 40px hsl(0 84% 60% / 0.5)',
                    }}
                  >
                    {countInBeat}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center"
                >
                  <div
                    className="font-black text-emerald-500"
                    style={{
                      fontSize: 'clamp(8rem, 18vw, 12rem)',
                      lineHeight: 1,
                      textShadow: '0 0 40px hsl(142 71% 45% / 0.5)',
                    }}
                  >
                    START
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat Sync Panel */}
      <div className="border border-[hsl(var(--border-subtle))] rounded-xl bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm overflow-hidden">
        {/* Header Row */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border-subtle))]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSyncEnabled(!syncEnabled)}
              className="p-2 hover:bg-[hsl(var(--bg-surface))] rounded-lg transition-colors"
            >
              {syncEnabled ? (
                <Link2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <Link2Off className="w-5 h-5 text-[hsl(var(--text-muted))]" />
              )}
            </button>
            
            <div>
              <div className="font-display font-semibold text-[hsl(var(--text-default))]">
                Beat Sync
              </div>
              <div className="text-xs text-[hsl(var(--text-subtle))]">
                {getSummaryText()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Start/Stop Button */}
            <button
              onClick={handleStartStop}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2 font-display font-semibold text-sm
                transition-all active:scale-95
                ${isPlaying
                  ? 'bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 hover:bg-emerald-500/30'
                }
              `}
            >
              {isPlaying ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </>
              )}
            </button>

            {/* Expand/Collapse Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-[hsl(var(--bg-surface))] rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Controls */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
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

                {/* Auto-Reveal Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--bg-surface))]">
                  <div>
                    <div className="font-display font-semibold text-sm text-[hsl(var(--text-default))]">
                      Auto-reveal before advancing
                    </div>
                    <div className="text-xs text-[hsl(var(--text-subtle))]">
                      Show chord 2 beats early
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoRevealBeforeAdvance(!autoRevealBeforeAdvance)}
                    className={`
                      w-12 h-7 rounded-full relative transition-colors
                      ${autoRevealBeforeAdvance ? 'bg-emerald-500' : 'bg-zinc-600'}
                    `}
                  >
                    <div
                      className={`
                        absolute w-5 h-5 bg-white rounded-full top-1 transition-transform
                        ${autoRevealBeforeAdvance ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
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
