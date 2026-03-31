import { useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';
import { useAudioStore } from '@/stores/audioStore';

// ─── MODULE-LEVEL SINGLETON ──────────────────────────────────────────────────
//
// ROOT CAUSE of "works once, breaks after sleep/navigation":
//   useChordAudio was called per-component-mount, storing the AudioContext in a
//   useRef. On unmount the ref was NOT closed (by design) but the ref itself was
//   lost, orphaning the AudioContext. iOS Safari counts orphaned contexts against
//   its concurrent-context limit. On the next mount a new AudioContext was created,
//   iOS saw 2 live contexts simultaneously and suspended the new one — even inside
//   a user gesture. The pattern repeats on every sleep/navigation cycle.
//
// FIX: One AudioContext for the entire page session, stored at module scope.
//   - Zero orphaned contexts between component mounts/unmounts
//   - iOS always sees ≤ 1 AudioContext → never auto-suspends on creation
//   - Still recreated inside a user gesture when found non-running (sleep recovery)
//
// ────────────────────────────────────────────────────────────────────────────

// Standard guitar tuning frequencies (E2, A2, D3, G3, B3, E4)
const STRING_FREQUENCIES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
const SEMITONE_RATIO = Math.pow(2, 1 / 12);

// Singleton state — lives for the lifetime of the browser tab
let _ctx: AudioContext | null = null;
let _ctxCreatedAt = 0;
const CONTEXT_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes — retire truly stale contexts

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
): OscillatorNode[] {
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
  mainGain.gain.linearRampToValueAtTime(volume * 0.45, startTime + 0.008);
  mainGain.gain.exponentialRampToValueAtTime(volume * 0.18, startTime + 0.12);
  mainGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  // Harmonic gain envelope (shorter)
  const harmonicGain = ctx.createGain();
  harmonicGain.gain.setValueAtTime(0, startTime);
  harmonicGain.gain.linearRampToValueAtTime(volume * 0.08, startTime + 0.005);
  harmonicGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.5);

  // Sub gain envelope
  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0, startTime);
  subGain.gain.linearRampToValueAtTime(volume * 0.12, startTime + 0.01);
  subGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);

  // Low-pass filter — softens tone, sweeps down over time
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(frequency * 6, 5000), startTime);
  filter.frequency.exponentialRampToValueAtTime(
    Math.min(frequency * 2, 2000),
    startTime + duration * 0.4,
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

// ─── SINGLETON CONTEXT MANAGEMENT ────────────────────────────────────────────

/**
 * Returns the singleton AudioContext if it is healthy (running, not too old).
 * Returns null if the caller should create a fresh one.
 * Must NOT create a new context here — that must happen inside a user gesture.
 */
function getSingletonContext(): AudioContext | null {
  if (!_ctx) return null;
  if (_ctx.state === 'closed') {
    _ctx = null;
    return null;
  }
  // Retire truly ancient contexts (30+ min) — rare but keeps things tidy
  if (Date.now() - _ctxCreatedAt > CONTEXT_MAX_AGE_MS) {
    _ctx.close().catch(() => {});
    _ctx = null;
    return null;
  }
  if (_ctx.state === 'running') return _ctx;
  // Suspended — caller (inside gesture) will replace it
  return _ctx;
}

/**
 * Creates a brand-new singleton AudioContext.
 * MUST be called synchronously inside a user gesture so iOS starts it 'running'.
 * Closes the old singleton first (synchronously releases the reference so iOS
 * sees zero live contexts before the new one is constructed).
 */
function createSingletonContext(): AudioContext {
  // Release old reference BEFORE close() so iOS doesn't see two contexts
  const old = _ctx;
  _ctx = null;
  if (old && old.state !== 'closed') {
    old.close().catch(() => {});
  }

  const ctx = new AudioContext();
  _ctx = ctx;
  _ctxCreatedAt = Date.now();
  console.log('🎵 Singleton AudioContext created:', {
    state: ctx.state,
    sampleRate: ctx.sampleRate,
  });
  return ctx;
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

export function useChordAudio() {
  const activeOscillators = useRef<OscillatorNode[]>([]);
  const activeGainNodes = useRef<GainNode[]>([]);
  const getEffectiveVolume = useAudioStore((s) => s.getEffectiveVolume);

  const stopCurrent = useCallback(() => {
    activeOscillators.current.forEach((osc) => {
      try { osc.stop(); osc.disconnect(); } catch { /* already stopped */ }
    });
    activeOscillators.current = [];

    activeGainNodes.current.forEach((gain) => {
      try { gain.disconnect(); } catch { /* already disconnected */ }
    });
    activeGainNodes.current = [];
  }, []);

  const playChord = useCallback((chord: ChordData) => {
    const masterVol = getEffectiveVolume();
    if (!Number.isFinite(masterVol)) {
      console.error('❌ ChordAudio: invalid volume:', masterVol);
      return;
    }

    // Stop any currently playing notes
    stopCurrent();

    // ── Context acquisition (always inside a user gesture tap) ────────────────
    //
    // getSingletonContext() returns the module-level AudioContext.
    // Because it's a singleton (not recreated on component remount), iOS never
    // accumulates orphaned contexts — eliminating the concurrent-context limit
    // that caused new contexts to start suspended.
    //
    // If the singleton is non-running (suspended after sleep), we replace it
    // here, synchronously within the tap gesture, so iOS starts the replacement
    // in 'running' state without needing resume().
    let ctx: AudioContext;
    const existing = getSingletonContext();

    if (!existing || existing.state !== 'running') {
      console.log('🔄 Replacing non-running singleton context. Was:', existing?.state ?? 'null');
      ctx = createSingletonContext();
    } else {
      ctx = existing;
    }

    if (ctx.state === 'closed') {
      console.error('❌ Cannot play — AudioContext closed immediately after creation');
      return;
    }

    const scheduleOscillators = (audioCtx: AudioContext) => {
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = Math.pow(masterVol, 1.2) * 3.5;
      masterGain.connect(audioCtx.destination);
      activeGainNodes.current.push(masterGain);

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
        console.log('✅ Chord scheduled — ctx state:', audioCtx.state, '| notes:', allOscs.length / 3);
      } catch (err) {
        console.error('❌ Oscillator creation failed:', err);
        allOscs.forEach((osc) => { try { osc.stop(); osc.disconnect(); } catch { /* ignore */ } });
      }
    };

    if (ctx.state === 'running') {
      scheduleOscillators(ctx);
    } else {
      // Last resort: fresh context still somehow suspended (extremely unusual)
      ctx.resume()
        .then(() => scheduleOscillators(ctx))
        .catch((err) => console.error('❌ resume() on fresh singleton failed:', err));
    }
  }, [getEffectiveVolume, stopCurrent]);

  // ── Visibility handler: pre-emptively close suspended singleton on wake ─────
  //
  // When the screen wakes, if the singleton is suspended, close and null it now
  // so that the NEXT playChord() call finds null → createSingletonContext() →
  // one clean new context inside the gesture. Doing this here (not in playChord)
  // avoids the close() being async-in-flight when the new context is constructed.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const state = _ctx?.state ?? 'null';
        console.log('👁️ Visible — singleton context state:', state);
        if (_ctx && _ctx.state !== 'running') {
          const stale = _ctx;
          _ctx = null;
          _ctxCreatedAt = 0;
          stale.close().catch(() => {});
          console.log('🗑️ Stale singleton released on wake — next play creates fresh context');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Do NOT close the singleton on unmount — it must survive navigation
      // so the next mount finds a healthy running context instead of null.
      // The singleton is only closed on page unload or explicit recreation.
      stopCurrent();
    };
  }, [stopCurrent]);

  return { playChord, stopCurrent };
}
