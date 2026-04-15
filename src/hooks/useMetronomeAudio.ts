/**
 * Custom hook for metronome audio engine with voice counting
 * Handles beat scheduling, percussion sound generation, and voice synthesis
 * Uses Web Audio API for precise timing with adaptive latency compensation
 * 
 * @example
 * ```tsx
 * function MetronomeControls() {
 *   const { isPlaying, bpm, setIsPlaying, setBpm } = useMetronomeStore();
 *   useMetronomeAudio(); // Initialize metronome audio engine
 * 
 *   return (
 *     <div>
 *       <button onClick={() => setIsPlaying(!isPlaying)}>
 *         {isPlaying ? 'Stop' : 'Start'}
 *       </button>
 *       <input 
 *         type="range" 
 *         min={20} 
 *         max={250} 
 *         value={bpm} 
 *         onChange={(e) => setBpm(Number(e.target.value))}
 *       />
 *       <span>{bpm} BPM</span>
 *     </div>
 *   );
 * }
 * ```
 * 
 * Features:
 * - 4 percussion sounds: click, wood block, hi-hat, side stick
 * - Voice counting with adaptive latency compensation
 * - Multiple time signatures: 2/4, 3/4, 4/4, 12/8
 * - Subdivisions: quarter, eighth, sixteenth notes
 * - Accent patterns on downbeats
 * - Tempo range: 20-250 BPM
 * - Mobile-optimized timing
 * 
 * State Management:
 * - Reads from metronomeStore via Zustand for current state
 * - Auto-starts/stops based on isPlaying state
 * - Resets on BPM or subdivision changes
 * 
 * Performance Optimizations:
 * - Memoized volume calculations to prevent recalculation on every render
 * - Direct store access via getState() to avoid stale closures
 * - Interval-based scheduling for consistent timing
 * 
 * @returns Object with playClick function for manual beat triggering
 * @returns playClick - Function to play a single beat (isAccent: boolean, beatNumber?: number)
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useAudioStore } from '@/stores/audioStore';
import { useVoiceSynthesisLatency } from './useVoiceSynthesisLatency';
import { useWakeLock } from './useWakeLock';
import type { SoundGeneratorFunction } from '@/types/audio';
import {
  generateClickSound,
  generateWoodBlockSound,
  generateHiHatSound,
  generateSideStickSound,
} from '@/lib/audio/metronome-sounds';

interface UseMetronomeAudioReturn {
  playClick: (isAccent?: boolean, beatNumber?: number) => void;
}

export const useMetronomeAudio = (): UseMetronomeAudioReturn => {
  const { 
    isPlaying, 
    bpm, 
    soundType, 
    subdivision,
    swingEnabled,
    incrementBeat,
    setCurrentBeat,
    setSubdivisionCounter,
  } = useMetronomeStore();
  
  const { metronomeVolume, muted } = useAudioStore();

  // Prevent the screen from dimming/sleeping while the metronome is playing
  useWakeLock(isPlaying);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  // Recursive timeout ref for swing scheduling
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Voice synthesis latency compensation
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const { speakNumber } = useVoiceSynthesisLatency({ isMobile });

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Page Lifecycle Recovery: resume AudioContext when the user returns to the tab.
    // Mirrors the same fix applied to the tuner — RAF/interval scheduling continues
    // but ctx.currentTime is frozen while suspended, so sounds land in the past.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      audioContextRef.current?.close();
    };
  }, []);

  // Memoize expensive volume calculations to avoid recalculating on every render
  const volumeMultiplier = useMemo(() => {
    // Use metronome-specific volume (independent of global audio volume)
    return metronomeVolume ?? 0.8;
  }, [metronomeVolume]);

  const playClick = useCallback((isAccent: boolean = false, beatNumber?: number): void => {
    const context = audioContextRef.current;
    if (!context) return;

    // Browser auto-suspends AudioContext after ~10s with no output.
    // When suspended, ctx.currentTime is frozen — all scheduled sounds are
    // placed in the past and silently dropped. Resume before every sound so
    // the first beat after idle gap plays immediately on the next tick.
    if (context.state === 'suspended') {
      context.resume().catch(() => {});
      return; // skip this beat; scheduler will fire again on the next interval tick
    }

    const now = context.currentTime;
    const baseVolume = volumeMultiplier;
    const volume = isAccent ? baseVolume * 1.0 : baseVolume * 0.80;

    // Handle voice counting
    if (soundType === 'voiceCount' && beatNumber !== undefined) {
      speakNumber(beatNumber, context, now);
      return;
    }

    // Handle percussion sounds
    switch (soundType) {
      case 'click':
        generateClickSound(context, isAccent, volume, now);
        break;
      case 'woodBlock':
        generateWoodBlockSound(context, isAccent, volume, now);
        break;
      case 'hiHat':
        generateHiHatSound(context, isAccent, volume, now);
        break;
      case 'sideStick':
        generateSideStickSound(context, isAccent, volume, now);
        break;
    }
  }, [soundType, volumeMultiplier, speakNumber]);

  // Helper: determine if the current store state calls for an accent on this beat
  const computeIsAccent = (state: ReturnType<typeof useMetronomeStore.getState>): boolean => {
    if (!state.accentFirstBeat) return false;
    if (state.subdivision === 'eighth' || state.subdivision === 'sixteenth') {
      return state.subdivisionCounter === 0;
    }
    if (state.beatsPerMeasure === 5) return state.currentBeat === 0 || state.currentBeat === 2;
    if (state.beatsPerMeasure === 6) return state.currentBeat % 3 === 0;
    if (state.beatsPerMeasure === 7) return state.currentBeat === 0 || state.currentBeat === 4;
    if (state.beatsPerMeasure === 12) return state.currentBeat % 3 === 0;
    return state.currentBeat === 0;
  };

  useEffect(() => {
    if (isPlaying) {
      const context = audioContextRef.current;
      if (!context) return;

      // Reset beat and timing
      setCurrentBeat(0);
      setSubdivisionCounter(0);

      // Play initial beat immediately (beat 1, currentBeat = 0)
      const initialState = useMetronomeStore.getState();
      const isInitialAccent = computeIsAccent(initialState);
      playClick(isInitialAccent, initialState.currentBeat + 1);

      // ── Swing mode: recursive setTimeout with alternating long/short delays ──
      // Only applies when subdivision is 'eighth' and swingEnabled is true.
      // Dotted-eighth = 2/3 of beat; sixteenth = 1/3 of beat (2:1 swing ratio).
      if (swingEnabled && subdivision === 'eighth') {
        const beatMs = (60 / bpm) * 1000;
        const longMs = beatMs * (2 / 3);   // dotted-eighth (first of pair)
        const shortMs = beatMs * (1 / 3);  // sixteenth (second of pair — delayed)

        // isLongNext alternates: after beat 1 (just played), next delay is long
        let isLongNext = true;

        const scheduleNext = () => {
          const delay = isLongNext ? longMs : shortMs;
          isLongNext = !isLongNext;

          timeoutRef.current = setTimeout(() => {
            incrementBeat();
            const state = useMetronomeStore.getState();
            playClick(computeIsAccent(state), state.currentBeat + 1);
            scheduleNext();
          }, delay);
        };

        scheduleNext();
      } else {
        // ── Normal mode: fixed setInterval ───────────────────────────────────
        let subdivisionMultiplier = 1;
        if (subdivision === 'eighth') subdivisionMultiplier = 2;
        if (subdivision === 'sixteenth') subdivisionMultiplier = 4;
        const intervalMs = (60 / (bpm * subdivisionMultiplier)) * 1000;

        intervalRef.current = window.setInterval(() => {
          incrementBeat();
          const state = useMetronomeStore.getState();
          playClick(computeIsAccent(state), state.currentBeat + 1);
        }, intervalMs);
      }
    } else {
      // Stop: clear both interval and timeout
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setCurrentBeat(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isPlaying, bpm, subdivision, swingEnabled, playClick]);

  return {
    playClick,
  };
};
