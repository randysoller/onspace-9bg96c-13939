/**
 * useStrumPatternAudio — plays a strum pattern at the current metronome BPM.
 *
 * Architecture:
 * - Reads BPM from metronomeStore (non-reactive snapshot to avoid mid-play drift)
 * - Calculates eighth-note duration: (60000ms / BPM) / 2
 * - Schedules per-slot setTimeout callbacks for each non-rest slot
 * - Fires playChord() at each active strum position
 * - Updates currentSlotIdx state for synchronized SVG highlighting
 * - Loops through all 8 slots, then calls onComplete (optional)
 * - Optional 4-beat count-in: fires 4 metronome clicks before pattern starts
 *   Count-in is skipped on loop repeats (skipCountIn flag)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useMetronomeStore } from '@/stores/metronomeStore';
import {
  getSingletonContext,
  createSingletonContext,
  createPluck,
  getNoteFrequency,
} from '@/lib/audio/shared-singleton';
import type { ChordData } from '@/types/chord';
import type { StrumSlot } from '@/components/features/StrumPatternDiagram';

interface UseStrumPatternAudioOptions {
  onComplete?: () => void;
  countInEnabled?: boolean;
}

export function useStrumPatternAudio({ onComplete, countInEnabled = false }: UseStrumPatternAudioOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlotIdx, setCurrentSlotIdx] = useState(-1);
  // Tracks whether we're in the count-in phase (for UI feedback if needed)
  const [isCountingIn, setIsCountingIn] = useState(false);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const selectedChordRef = useRef<ChordData | null>(null);
  const isPlayingRef = useRef(false);
  // Ref so scheduled callbacks always see the latest value without stale closure
  const countInEnabledRef = useRef(countInEnabled);
  useEffect(() => { countInEnabledRef.current = countInEnabled; }, [countInEnabled]);

  const stopPlayback = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsCountingIn(false);
    setCurrentSlotIdx(-1);
  }, []);

  const setSelectedChord = useCallback((chord: ChordData | null) => {
    selectedChordRef.current = chord;
  }, []);

  // Internal helper that fires a single short click tone
  const fireClick = useCallback((audioCtx: AudioContext, isAccent: boolean) => {
    const clickGain = audioCtx.createGain();
    clickGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
    clickGain.connect(audioCtx.destination);
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = isAccent ? 1200 : 900;
    osc.connect(clickGain);
    osc.start(audioCtx.currentTime + 0.01);
    osc.stop(audioCtx.currentTime + 0.065);
  }, []);

  /**
   * playPattern — primary entry point.
   * skipCountIn: true when called from loop repeat so the 4-beat intro
   * doesn't fire between each loop cycle.
   */
  const playPattern = useCallback((notation: StrumSlot[], skipCountIn = false) => {
    if (isPlayingRef.current) {
      stopPlayback();
      return;
    }

    // Snapshot BPM at play time — don't re-read during playback
    const bpm = useMetronomeStore.getState().bpm;
    const beatMs = 60_000 / bpm;
    const eighthMs = beatMs / 2;

    // ── Acquire / resume AudioContext ────────────────────────────────────────
    let ctx: AudioContext;
    const existing = getSingletonContext();
    if (!existing || existing.state !== 'running') {
      ctx = createSingletonContext();
    } else {
      ctx = existing;
    }

    const scheduleStrums = (audioCtx: AudioContext) => {
      isPlayingRef.current = true;
      setIsPlaying(true);

      // Ensure we have exactly 8 slots
      const slots: StrumSlot[] = [...notation];
      while (slots.length < 8) slots.push('_');

      const totalMs = eighthMs * 8;

      // ── Count-in: 4 quarter-note clicks before pattern starts ─────────────
      // Fires only when countInEnabled and this is not a loop repeat
      const shouldCountIn = countInEnabledRef.current && !skipCountIn;
      const countInOffsetMs = shouldCountIn ? beatMs * 4 : 0;

      if (shouldCountIn) {
        setIsCountingIn(true);
        for (let beat = 0; beat < 4; beat++) {
          const delayMs = beat * beatMs;
          const clickTimer = setTimeout(() => {
            if (!isPlayingRef.current) return;
            fireClick(audioCtx, beat === 0); // accent on beat 1
          }, delayMs);
          timeoutsRef.current.push(clickTimer);
        }
        // Clear count-in state once pattern begins
        const clearCountInTimer = setTimeout(() => {
          setIsCountingIn(false);
        }, countInOffsetMs);
        timeoutsRef.current.push(clearCountInTimer);
      }

      // ── Pattern slots — offset by count-in duration ───────────────────────
      slots.forEach((slot, i) => {
        const delayMs = countInOffsetMs + i * eighthMs;

        // Visual highlight
        const visualTimer = setTimeout(() => {
          if (!isPlayingRef.current) return;
          setCurrentSlotIdx(slot !== '_' ? i : -1);
        }, delayMs);
        timeoutsRef.current.push(visualTimer);

        if (slot === '_') return;

        // Audio fires only for active slots — no ongoing metronome clicks
        const audioTimer = setTimeout(() => {
          if (!isPlayingRef.current) return;
          const chord = selectedChordRef.current;
          if (!chord) return;

          const masterGain = audioCtx.createGain();
          masterGain.gain.value = 2.5;
          masterGain.connect(audioCtx.destination);

          const now = audioCtx.currentTime + 0.02;
          const strumOffset = slot === 'DU' ? 0.03 : 0.035;

          let strumIdx = 0;
          for (let s = 0; s < 6; s++) {
            const fret = chord.frets[s];
            if (fret === -1) continue;
            const freq = getNoteFrequency(s, fret);
            const vol = 0.25 - s * 0.01;
            createPluck(audioCtx, freq, now + strumIdx * strumOffset, 1.8, vol, masterGain);
            strumIdx++;
          }

          // DU slot: add up-strum half an eighth-note later
          if (slot === 'DU') {
            const upOffset = eighthMs * 0.5 / 1000;
            setTimeout(() => {
              if (!isPlayingRef.current) return;
              const upGain = audioCtx.createGain();
              upGain.gain.value = 1.8;
              upGain.connect(audioCtx.destination);
              const upNow = audioCtx.currentTime + 0.02;
              for (let s = 5; s >= 2; s--) {
                const fret = chord.frets[s];
                if (fret === -1) continue;
                const freq = getNoteFrequency(s, fret);
                createPluck(audioCtx, freq, upNow + (5 - s) * 0.02, 1.4, 0.15, upGain);
              }
            }, upOffset * 1000);
          }
        }, delayMs);
        timeoutsRef.current.push(audioTimer);
      });

      // Reset after pattern completes
      const doneTimer = setTimeout(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setCurrentSlotIdx(-1);
        onComplete?.();
      }, countInOffsetMs + totalMs + 100);
      timeoutsRef.current.push(doneTimer);
    };

    if (ctx.state === 'running') {
      scheduleStrums(ctx);
    } else {
      ctx.resume().then(() => scheduleStrums(ctx)).catch(console.error);
    }
  }, [stopPlayback, onComplete, fireClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      isPlayingRef.current = false;
    };
  }, []);

  return {
    isPlaying,
    isCountingIn,
    currentSlotIdx,
    playPattern,
    stopPlayback,
    setSelectedChord,
  };
}
