import { useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';
import { useAudioStore } from '@/stores/audioStore';

// Mobile detection utility
const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Context age threshold: only recreate a context that has been alive for a very
// long time (30 minutes). Navigation gaps and sleep cycles are handled by
// resume() in the visibility handler — NOT by destroying and recreating the
// context (recreation produces a new suspended context on iOS/Android that
// races with its own async close and produces silent playback).
const CONTEXT_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

// Standard guitar tuning frequencies (E2, A2, D3, G3, B3, E4)
const STRING_FREQUENCIES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
const SEMITONE_RATIO = Math.pow(2, 1 / 12);

function getNoteFrequency(stringIndex: number, fret: number): number {
  return STRING_FREQUENCIES[stringIndex] * Math.pow(SEMITONE_RATIO, fret);
}

function createPluck(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number,
  outputNode: AudioNode,
) {
  // Oscillator 1: Main tone — triangle wave for warm guitar-like timbre
  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(frequency, startTime);

  // Oscillator 2: Harmonic layer — quiet sine at octave above for brightness
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frequency * 2, startTime);

  // Oscillator 3: Sub harmonic — sine at half frequency for body
  const osc3 = ctx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(frequency * 0.5, startTime);

  // Main gain envelope (pluck shape)
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, startTime);
  mainGain.gain.linearRampToValueAtTime(volume * 0.45, startTime + 0.008);       // 8ms attack
  mainGain.gain.exponentialRampToValueAtTime(volume * 0.18, startTime + 0.12);    // 120ms decay
  mainGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);        // fade to silence

  // Harmonic gain envelope (shorter)
  const harmonicGain = ctx.createGain();
  harmonicGain.gain.setValueAtTime(0, startTime);
  harmonicGain.gain.linearRampToValueAtTime(volume * 0.08, startTime + 0.005);   // 5ms attack
  harmonicGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.5); // dies at half duration

  // Sub gain envelope
  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0, startTime);
  subGain.gain.linearRampToValueAtTime(volume * 0.12, startTime + 0.01);         // 10ms attack
  subGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);   // dies at 70% duration

  // Low-pass filter — softens tone, sweeps down over time
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(frequency * 6, 5000), startTime);
  filter.frequency.exponentialRampToValueAtTime(
    Math.min(frequency * 2, 2000),
    startTime + duration * 0.4
  );
  filter.Q.setValueAtTime(1.2, startTime);

  // Routing: all oscillators → individual gains → shared filter → output
  osc1.connect(mainGain);
  osc2.connect(harmonicGain);
  osc3.connect(subGain);

  mainGain.connect(filter);
  harmonicGain.connect(filter);
  subGain.connect(filter);

  filter.connect(outputNode);

  osc1.start(startTime);
  osc2.start(startTime);
  osc3.start(startTime);
  osc1.stop(startTime + duration + 0.05);
  osc2.stop(startTime + duration + 0.05);
  osc3.stop(startTime + duration + 0.05);

  return [osc1, osc2, osc3];
}

export function useChordAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const contextCreatedAtRef = useRef<number>(0);
  const lastPlaybackAtRef = useRef<number>(0);
  const activeOscillators = useRef<OscillatorNode[]>([]);
  const activeGainNodes = useRef<GainNode[]>([]);  // Track all gain nodes for cleanup
  const getEffectiveVolume = useAudioStore((s) => s.getEffectiveVolume);

  const stopCurrent = useCallback(() => {
    // CRITICAL: Disconnect ALL nodes before stopping to prevent resource leaks
    activeOscillators.current.forEach((osc) => {
      try { 
        osc.stop(); 
        osc.disconnect();  // Explicitly disconnect from audio graph
      } catch { /* already stopped */ }
    });
    activeOscillators.current = [];
    
    // Disconnect all gain nodes
    activeGainNodes.current.forEach((gain) => {
      try { 
        gain.disconnect(); 
      } catch { /* already disconnected */ }
    });
    activeGainNodes.current = [];
    
    console.log('🧹 Cleaned up all audio nodes');
  }, []);

  const getContext = useCallback(() => {
    const now = Date.now();
    const contextAge = now - contextCreatedAtRef.current;

    // Only destroy and recreate after 30 minutes of total lifetime.
    // Do NOT use timeSinceLastPlayback as a stale signal — after sleep or
    // navigation that gap always exceeds any short threshold, and the brand-new
    // AudioContext also starts suspended on iOS/Android, causing the same
    // silent-playback race we were trying to avoid.
    if (contextAge > CONTEXT_MAX_AGE_MS && ctxRef.current && ctxRef.current.state !== 'closed') {
      console.log('⏰ AudioContext lifetime exceeded 30 min — recreating');
      stopCurrent();
      const oldContext = ctxRef.current;
      ctxRef.current = null;
      oldContext.close().catch(() => {});
    }

    // If suspended, resume in-place — the audio graph is still intact.
    // Recreating would produce another suspended context AND race with the
    // async close of the old one, both of which cause silent playback.
    if (ctxRef.current && ctxRef.current.state === 'suspended') {
      console.log('⏸️ AudioContext suspended — resuming in-place');
      ctxRef.current.resume().catch(() => {});
      // Return the existing context immediately; oscillators scheduled with
      // a future startTime (ctx.currentTime + 0.05s) will play once resumed.
      return ctxRef.current;
    }

    // Create a fresh context only when there is none or it has been closed.
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
      contextCreatedAtRef.current = Date.now();
      console.log('🎵 AudioContext created:', {
        state: ctxRef.current.state,
        sampleRate: ctxRef.current.sampleRate,
        platform: isMobileBrowser ? 'mobile' : 'desktop',
      });
      // New context may start suspended on mobile — kick off resume immediately.
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().catch(() => {});
      }
    }

    return ctxRef.current;
  }, [stopCurrent]);

  const playChord = useCallback((chord: ChordData) => {
    const masterVol = getEffectiveVolume();

    if (!Number.isFinite(masterVol)) {
      console.error('❌ ChordAudio: invalid volume:', masterVol);
      return;
    }

    stopCurrent();

    // getContext() is called synchronously to stay within the iOS/Android user-gesture
    // token. If the context is suspended it calls resume() immediately (also sync),
    // which is sufficient for the browser to accept the gesture association.
    const ctx = getContext();
    if (!ctx || ctx.state === 'closed') {
      console.error('❌ Cannot play chord — AudioContext unavailable or closed');
      return;
    }

    // ── Cause #3 fix ────────────────────────────────────────────────────────
    // On mobile, ctx.currentTime is FROZEN while the context is suspended.
    // Scheduling oscillators with startTime = frozenTime + 0.05s means those
    // events are already in the past once the context actually resumes, so the
    // audio engine silently discards them — producing no sound.
    //
    // Fix: await the resume Promise before reading ctx.currentTime.
    // The async continuation still executes within the same user-gesture token
    // because resume() was kicked off synchronously above; iOS/Android honour
    // this and don't revoke the gesture permission across the microtask boundary.
    const scheduleOscillators = (audioCtx: AudioContext) => {
      if (!Number.isFinite(audioCtx.currentTime)) {
        console.error('❌ AudioContext has invalid currentTime:', audioCtx.currentTime);
        return;
      }

      lastPlaybackAtRef.current = Date.now();

      // Master gain — v^1.2 * 3.5 boost curve (prevents clipping)
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = Math.pow(masterVol, 1.2) * 3.5;
      masterGain.connect(audioCtx.destination);
      activeGainNodes.current.push(masterGain);

      // Read currentTime AFTER resume so the clock reflects the live position
      const now = audioCtx.currentTime + 0.05;
      const allOscs: OscillatorNode[] = [];

      try {
        let strumIndex = 0;
        for (let i = 0; i < 6; i++) {
          const fret = chord.frets[i];
          if (fret === -1) continue;
          const freq = getNoteFrequency(i, fret);
          const vol = 0.3 - i * 0.015;
          const oscs = createPluck(audioCtx, freq, now + strumIndex * 0.035, 2.5, vol, masterGain);
          allOscs.push(...oscs);
          strumIndex++;
        }
        activeOscillators.current = allOscs;
        console.log('✅ Chord scheduled — context state:', audioCtx.state, '| oscillators:', allOscs.length);
      } catch (err) {
        console.error('❌ Oscillator creation failed:', err);
        allOscs.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch {/* ignore */} });
      }
    };

    if (ctx.state === 'suspended') {
      // Await the resume so currentTime is live before we schedule.
      ctx.resume()
        .then(() => scheduleOscillators(ctx))
        .catch((err) => console.error('❌ resume() failed:', err));
    } else {
      // Context is already running — schedule immediately.
      scheduleOscillators(ctx);
    }
  }, [getContext, stopCurrent, getEffectiveVolume]);

  // Page Visibility API: Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab visible - context state:', ctxRef.current?.state);
        // Proactively resume a suspended context when the page becomes visible.
        // Browsers allow resume() in visibilitychange without a direct user gesture,
        // so the context is already running by the time the user taps Play.
        // Also reset the last-playback timestamp so the stale-context check does
        // NOT force an unnecessary recreation (recreation + async close races with
        // the new context's first use and is the primary cause of silent playback
        // after returning from sleep or another page on iOS/Android).
        if (ctxRef.current && ctxRef.current.state === 'suspended') {
          ctxRef.current.resume().catch(() => {
            // Resume may still fail on very strict browsers; getContext() will
            // handle the fallback recreation on the next playChord() call.
          });
        }
        // Mark as "just played" so timeSinceLastPlayback stays below the
        // stale threshold and getContext() doesn't discard a healthy context.
        lastPlaybackAtRef.current = Date.now();
      } else if (document.visibilityState === 'hidden') {
        console.log('🙈 Tab hidden - context will likely suspend');
        // Do NOT zero lastPlaybackAtRef here. Zeroing it causes the stale check
        // in getContext() to always trigger on the next playback (timeSinceLastPlayback
        // = now - 0 = huge), forcing an AudioContext recreation whose async close
        // races with oscillator creation and produces silent playback on mobile.
        // The contextAge arm of the stale check is sufficient for genuine staleness.
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // CRITICAL FIX: Don't close context on cleanup - it prevents playback after remount
      // Just stop active oscillators
      console.log('🧹 useChordAudio cleanup - stopping oscillators but keeping context alive');
      stopCurrent();
      // Context will be closed when browser tab/window actually closes
    };
  }, [stopCurrent]);

  return { playChord, stopCurrent };
}
