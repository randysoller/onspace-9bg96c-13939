/**
 * useScalePatternAudio
 *
 * Plays a single CAGED scale pattern ascending then descending at a given BPM,
 * using the same guitar pluck timbre as useChordAudio (shared AudioContext singleton).
 *
 * Usage:
 *   const { playPattern, stop, isPlaying, playingIdx } = useScalePatternAudio();
 *   playPattern(dots, bpm, patternIndex);
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import {
  getSingletonContext,
  createSingletonContext,
  createPluck,
  getNoteFrequency,
  markContextStaleOnWake,
} from '@/lib/audio/shared-singleton';
import { useAudioStore } from '@/stores/audioStore';
import { detectDeviceCapabilities } from '@/lib/audio/device-detection';

export interface PatternDot {
  string: number;   // 0 = high e, 5 = low E
  fret: number;     // 0 = open string
  isRoot?: boolean;
  isOpenString?: boolean;
}

export function useScalePatternAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  const stopFlagRef = useRef(false);
  const activeOscsRef = useRef<OscillatorNode[]>([]);
  const activeGainsRef = useRef<GainNode[]>([]);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getEffectiveVolume = useAudioStore((s) => s.getEffectiveVolume);

  /** Stop all scheduled notes and cancel pending timeouts. */
  const stop = useCallback(() => {
    stopFlagRef.current = true;
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    playTimeoutRef.current = null;

    activeOscsRef.current.forEach((osc) => {
      try { osc.stop(); osc.disconnect(); } catch { /* already stopped */ }
    });
    activeOscsRef.current = [];

    activeGainsRef.current.forEach((g) => {
      try { g.disconnect(); } catch { /* already disconnected */ }
    });
    activeGainsRef.current = [];

    setIsPlaying(false);
    setPlayingIdx(null);
  }, []);

  /**
   * Play a CAGED pattern ascending then descending.
   *
   * @param dots       - Array of fretboard dots for this pattern
   * @param bpm        - Notes per minute (default 90)
   * @param patternIdx - Index 0–4, used to track which button is active
   */
  const playPattern = useCallback((
    dots: PatternDot[],
    bpm: number = 90,
    patternIdx: number,
  ) => {
    // Stop any current playback first
    stop();

    // ── Context acquisition (inside user gesture) ─────────────────────────
    let ctx: AudioContext;
    const existing = getSingletonContext();
    if (!existing || existing.state !== 'running') {
      ctx = createSingletonContext();
    } else {
      ctx = existing;
    }
    if (ctx.state === 'closed') return;

    // ── Volume ────────────────────────────────────────────────────────────
    const masterVol = getEffectiveVolume();
    if (!Number.isFinite(masterVol)) return;

    const isMobile = detectDeviceCapabilities().isMobile;
    const gainMultiplier = isMobile ? 6.0 : 3.5;
    const masterGain = ctx.createGain();
    masterGain.gain.value = Math.pow(masterVol, 1.2) * gainMultiplier;
    masterGain.connect(ctx.destination);
    activeGainsRef.current.push(masterGain);

    // ── Sort dots by absolute pitch (ascending) ───────────────────────────
    // string 5 (low E) = lowest frequency; string 0 (high e) = highest.
    // For each dot: pitch = STRING_FREQUENCIES[string] * SEMITONE_RATIO^fret
    // We sort ascending by frequency for the "up" run.
    const sorted = [...dots].sort((a, b) => {
      const freqA = getNoteFrequency(a.string, a.fret);
      const freqB = getNoteFrequency(b.string, b.fret);
      return freqA - freqB;
    });

    // Ascending (low → high) + descending (high → low, excluding the top note to avoid repeat)
    const sequence = [
      ...sorted,
      ...[...sorted].reverse().slice(1),
    ];

    // ── Schedule all notes using Web Audio API clock ──────────────────────
    const beatDuration = 60 / bpm;          // seconds per note
    const noteDuration = beatDuration * 0.85; // slight articulation gap
    const now = ctx.currentTime + 0.05;

    const allOscs: OscillatorNode[] = [];

    try {
      sequence.forEach((dot, i) => {
        const freq = getNoteFrequency(dot.string, dot.fret);
        const startTime = now + i * beatDuration;
        // Consistent pluck volume — slightly louder than chord strum per-string vol
        const oscs = createPluck(ctx, freq, startTime, noteDuration, 0.28, masterGain);
        allOscs.push(...oscs);
      });
    } catch (err) {
      console.error('❌ ScalePatternAudio: oscillator creation failed:', err);
      allOscs.forEach((osc) => { try { osc.stop(); osc.disconnect(); } catch { /* ignore */ } });
      stop();
      return;
    }

    activeOscsRef.current = allOscs;

    // ── State tracking ────────────────────────────────────────────────────
    stopFlagRef.current = false;
    setIsPlaying(true);
    setPlayingIdx(patternIdx);

    // Auto-reset state when playback finishes
    const totalDuration = sequence.length * beatDuration + noteDuration;
    playTimeoutRef.current = setTimeout(() => {
      if (!stopFlagRef.current) {
        setIsPlaying(false);
        setPlayingIdx(null);
      }
    }, (totalDuration + 0.1) * 1000);
  }, [getEffectiveVolume, stop]);

  // Cleanup on unmount + wake handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markContextStaleOnWake();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stop();
    };
  }, [stop]);

  return { playPattern, stop, isPlaying, playingIdx };
}
