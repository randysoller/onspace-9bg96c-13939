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
  createKarplusPluck,
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
  /**
   * Index of the currently-sounding note within the frequency-sorted ascending
   * sequence (0 = lowest pitch dot, N-1 = highest).  Pingpongs up then back
   * down during playback so callers can highlight the active dot.
   */
  const [currentNoteIdx, setCurrentNoteIdx] = useState<number | null>(null);

  const stopFlagRef = useRef(false);
  // AudioBufferSourceNode[] when using Karplus-Strong; OscillatorNode[] for createPluck
  const activeOscsRef = useRef<(OscillatorNode | AudioBufferSourceNode)[]>([]);
  const activeGainsRef = useRef<GainNode[]>([]);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Per-note highlight timeouts — cleared on stop()
  const noteTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const getEffectiveVolume = useAudioStore((s) => s.getEffectiveVolume);

  /** Stop all scheduled notes and cancel pending timeouts. */
  const stop = useCallback(() => {
    stopFlagRef.current = true;
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    playTimeoutRef.current = null;

    // Clear all per-note highlight timeouts
    noteTimeoutsRef.current.forEach((t) => clearTimeout(t));
    noteTimeoutsRef.current = [];

    activeOscsRef.current.forEach((node) => {
      try { node.stop(); node.disconnect(); } catch { /* already stopped */ }
    });
    activeOscsRef.current = [];

    activeGainsRef.current.forEach((g) => {
      try { g.disconnect(); } catch { /* already disconnected */ }
    });
    activeGainsRef.current = [];

    setIsPlaying(false);
    setPlayingIdx(null);
    setCurrentNoteIdx(null);
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
      // ScaleDetailModal uses string 0 = high e, 5 = low E.
      // shared-singleton STRING_FREQUENCIES uses 0 = low E, 5 = high e.
      // Reverse the index so pitch sorting is correct.
      const freqA = getNoteFrequency(5 - a.string, a.fret);
      const freqB = getNoteFrequency(5 - b.string, b.fret);
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

    const allOscs: (OscillatorNode | AudioBufferSourceNode)[] = [];

    try {
      sequence.forEach((dot, i) => {
        const freq = getNoteFrequency(5 - dot.string, dot.fret); // reverse: ScaleDetailModal 0=high-e → singleton 0=low-E
        const startTime = now + i * beatDuration;
        // Karplus-Strong pluck — realistic pick transient + string resonance decay
        const oscs = createKarplusPluck(ctx, freq, startTime, noteDuration, 0.28, masterGain);
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
    setCurrentNoteIdx(0); // start highlight at first note

    // ── Per-note highlight timeouts ───────────────────────────────────────
    // For each note in the full sequence (asc + desc), compute which index
    // within the ascending half it maps to so both tab and fretboard can
    // highlight the matching dot.  Ascending: idx = i.  Descending: idx pingpongs
    // back down: idx = 2*(N-1) - i  (where N = sorted.length).
    const N = sorted.length;
    const highlightTimeouts: ReturnType<typeof setTimeout>[] = [];
    sequence.forEach((_dot, i) => {
      // Map sequence position to ascending-sort index
      const ascIdx = i < N ? i : 2 * (N - 1) - i;
      const delayMs = i * beatDuration * 1000 + 50; // +50 ms to align with audio onset
      const t = setTimeout(() => {
        if (!stopFlagRef.current) setCurrentNoteIdx(ascIdx);
      }, delayMs);
      highlightTimeouts.push(t);
    });
    noteTimeoutsRef.current = highlightTimeouts;

    // Auto-reset state when playback finishes
    const totalDuration = sequence.length * beatDuration + noteDuration;
    playTimeoutRef.current = setTimeout(() => {
      if (!stopFlagRef.current) {
        setIsPlaying(false);
        setPlayingIdx(null);
        setCurrentNoteIdx(null);
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

  return { playPattern, stop, isPlaying, playingIdx, currentNoteIdx };
}
