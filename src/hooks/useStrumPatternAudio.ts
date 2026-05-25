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
}

export function useStrumPatternAudio({ onComplete }: UseStrumPatternAudioOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlotIdx, setCurrentSlotIdx] = useState(-1);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const selectedChordRef = useRef<ChordData | null>(null);
  const isPlayingRef = useRef(false);

  const stopPlayback = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentSlotIdx(-1);
  }, []);

  const setSelectedChord = useCallback((chord: ChordData | null) => {
    selectedChordRef.current = chord;
  }, []);

  const playPattern = useCallback((notation: StrumSlot[]) => {
    if (isPlayingRef.current) {
      stopPlayback();
      return;
    }

    // Snapshot BPM at play time — don't re-read during playback
    const bpm = useMetronomeStore.getState().bpm;
    const beatMs = (60_000 / bpm);
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

      // Total pattern duration + a tiny buffer before resetting
      const totalMs = eighthMs * 8;

      slots.forEach((slot, i) => {
        const delayMs = i * eighthMs;

        // Visual highlight fires for every slot (including rest — dims immediately)
        const visualTimer = setTimeout(() => {
          if (!isPlayingRef.current) return;
          setCurrentSlotIdx(slot !== '_' ? i : -1);
        }, delayMs);
        timeoutsRef.current.push(visualTimer);

        if (slot === '_') return;

        // Audio fires only for active slots
        const audioTimer = setTimeout(() => {
          if (!isPlayingRef.current) return;
          const chord = selectedChordRef.current;
          if (!chord) return;

          // Strum the chord — same createPluck call used by useChordAudio
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

          // For DU slots — add the up-strum (downward strum order reversed)
          if (slot === 'DU') {
            const upOffset = eighthMs * 0.5 / 1000; // half an eighth later
            setTimeout(() => {
              if (!isPlayingRef.current) return;
              const upGain = audioCtx.createGain();
              upGain.gain.value = 1.8;
              upGain.connect(audioCtx.destination);
              const upNow = audioCtx.currentTime + 0.02;
              // Up-strum: reverse order, fewer strings
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
      }, totalMs + 100);
      timeoutsRef.current.push(doneTimer);
    };

    if (ctx.state === 'running') {
      scheduleStrums(ctx);
    } else {
      ctx.resume().then(() => scheduleStrums(ctx)).catch(console.error);
    }
  }, [stopPlayback, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      isPlayingRef.current = false;
    };
  }, []);

  return {
    isPlaying,
    currentSlotIdx,
    playPattern,
    stopPlayback,
    setSelectedChord,
  };
}
