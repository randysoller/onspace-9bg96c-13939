import { useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';
import { useAudioStore } from '@/stores/audioStore';

// Mobile detection utility
const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Context age threshold for background maintenance (30 minutes).
// Note: sleep/navigation recovery no longer depends on resume() — instead,
// playChord() recreates the context fresh inside the user gesture if it
// finds the context non-running. A freshly constructed AudioContext inside
// a tap gesture always starts in 'running' state on iOS Safari.
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

  // createFreshContext: builds a brand-new AudioContext and records its birth time.
  // MUST be called synchronously inside a user gesture (tap/click) so iOS Safari
  // starts the context in 'running' state without needing resume().
  //
  // CRITICAL: We null out ctxRef BEFORE calling close(), then construct the new
  // context. This eliminates the window where iOS sees two concurrent AudioContexts,
  // which caused it to suspend the new one even inside a user gesture.
  const createFreshContext = useCallback(() => {
    stopCurrent();

    // Step 1: Capture and immediately release the old context reference.
    // Setting ctxRef to null BEFORE close() ensures iOS does not see two
    // live contexts simultaneously when the new one is constructed.
    const oldCtx = ctxRef.current;
    ctxRef.current = null;

    // Step 2: Kick off async close in the background. We no longer hold a
    // reference to it, so iOS treats it as released before step 3 runs.
    if (oldCtx && oldCtx.state !== 'closed') {
      oldCtx.close().catch(() => {});
    }

    // Step 3: Create brand-new context. We are still synchronously inside the
    // user gesture here, and iOS sees zero live contexts, so it starts this
    // one in 'running' state unconditionally.
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    contextCreatedAtRef.current = Date.now();
    console.log('🎵 Fresh AudioContext created inside user gesture:', {
      state: ctx.state,
      sampleRate: ctx.sampleRate,
      platform: isMobileBrowser ? 'mobile' : 'desktop',
    });
    return ctx;
  }, [stopCurrent]);

  const getContext = useCallback(() => {
    const now = Date.now();
    const contextAge = now - contextCreatedAtRef.current;

    // Retire extremely old contexts (30+ min). Safety valve only —
    // the primary sleep/navigation recovery path lives inside playChord().
    if (contextAge > CONTEXT_MAX_AGE_MS && ctxRef.current && ctxRef.current.state !== 'closed') {
      console.log('⏰ AudioContext lifetime exceeded 30 min — will recreate on next play');
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }

    // Return the existing running context if healthy.
    if (ctxRef.current && ctxRef.current.state === 'running') {
      return ctxRef.current;
    }

    // No context yet — create one. If it starts suspended (pre-gesture), that
    // is fine; playChord() will replace it with a fresh one inside the gesture.
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
      contextCreatedAtRef.current = Date.now();
      console.log('🎵 AudioContext created (pre-gesture or background):', {
        state: ctxRef.current.state,
        sampleRate: ctxRef.current.sampleRate,
      });
    }

    return ctxRef.current;
  }, []);

  const playChord = useCallback((chord: ChordData) => {
    const masterVol = getEffectiveVolume();

    if (!Number.isFinite(masterVol)) {
      console.error('❌ ChordAudio: invalid volume:', masterVol);
      return;
    }

    // ── Core fix: gesture-boundary context acquisition ──────────────────────
    //
    // Problem: iOS Safari suspends the AudioContext when the screen locks.
    // The visibilitychange-based resume() fails because iOS does not classify
    // that event as a user gesture. Any attempt to call resume() outside a
    // direct tap/click is silently rejected, leaving the context suspended.
    // Once suspended via non-gesture code, subsequent resume() calls on that
    // same context can also fail because iOS tracks the "tried outside gesture"
    // state per-context.
    //
    // Solution: when we detect a non-running context INSIDE a confirmed user
    // gesture (this function is always called from a button tap), discard the
    // old context and create a brand-new AudioContext. iOS always starts a new
    // AudioContext in 'running' state when constructed inside a user gesture —
    // no resume() needed, no race condition possible.
    //
    // stopCurrent() is called inside createFreshContext() so we don't double-call it.
    let ctx: AudioContext;
    const existing = getContext();

    if (!existing || existing.state !== 'running') {
      // Non-running context found inside a user gesture → replace it entirely.
      console.log('🔄 Non-running context detected inside gesture — creating fresh context. State was:', existing?.state ?? 'null');
      ctx = createFreshContext();
    } else {
      // Healthy running context — just clear previous oscillators.
      stopCurrent();
      ctx = existing;
    }

    if (!ctx || ctx.state === 'closed') {
      console.error('❌ Cannot play chord — AudioContext unavailable');
      return;
    }

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

      // A fresh context's currentTime starts at 0 and is live immediately.
      // A resumed context's currentTime is also live post-resume.
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

    // By this point, ctx is either:
    //   a) A brand-new context (state: 'running') — schedule immediately
    //   b) An existing running context — schedule immediately
    // There is no suspended-context branch because we replaced it above.
    if (ctx.state === 'running') {
      scheduleOscillators(ctx);
    } else {
      // Edge case: new context started suspended (extremely strict browser policy).
      // Attempt resume as a last resort — we're still inside the gesture.
      ctx.resume()
        .then(() => scheduleOscillators(ctx))
        .catch((err) => console.error('❌ resume() on fresh context failed:', err));
    }
  }, [getContext, createFreshContext, stopCurrent, getEffectiveVolume]);

  // Page Visibility API: Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const state = ctxRef.current?.state ?? 'null';
        console.log('👁️ Tab visible - context state:', state);

        // Pre-emptively close and null out the suspended context here so that
        // when the user taps Play, createFreshContext() sees ctxRef = null and
        // constructs a new AudioContext with zero overlap — eliminating the
        // dual-context race that causes iOS to suspend the replacement.
        //
        // We do NOT call resume() here (not a user gesture on iOS).
        // We do NOT call stopCurrent() here — oscillators from the last play
        // have already finished by the time the screen wakes.
        if (ctxRef.current && ctxRef.current.state !== 'running') {
          const staleCtx = ctxRef.current;
          ctxRef.current = null;
          contextCreatedAtRef.current = 0;
          staleCtx.close().catch(() => {});
          console.log('🗑️ Stale suspended context pre-emptively released on wake — next play will create fresh context');
        }

        lastPlaybackAtRef.current = Date.now();
      } else if (document.visibilityState === 'hidden') {
        console.log('🙈 Tab hidden - context will suspend on iOS');
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
