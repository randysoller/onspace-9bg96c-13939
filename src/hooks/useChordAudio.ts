import { useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';
import { useAudioStore } from '@/stores/audioStore';
import { detectDeviceCapabilities } from '@/lib/audio/device-detection';
import {
  getSingletonContext,
  createSingletonContext,
  createPluck,
  getNoteFrequency,
  markContextStaleOnWake,
} from '@/lib/audio/shared-singleton';

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
// FIX: One AudioContext for the entire page session, stored at module scope
//   inside shared-singleton.ts — shared with useScalePatternAudio.
//   - Zero orphaned contexts between component mounts/unmounts
//   - iOS always sees ≤ 1 AudioContext → never auto-suspends on creation
//   - Still recreated inside a user gesture when found non-running (sleep recovery)
//
// ────────────────────────────────────────────────────────────────────────────

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
      const isMobile = detectDeviceCapabilities().isMobile;
      const gainMultiplier = isMobile ? 6.0 : 3.5;
      masterGain.gain.value = Math.pow(masterVol, 1.2) * gainMultiplier;
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
      ctx.resume()
        .then(() => scheduleOscillators(ctx))
        .catch((err) => console.error('❌ resume() on fresh singleton failed:', err));
    }
  }, [getEffectiveVolume, stopCurrent]);

  // ── Visibility handler: pre-emptively close suspended singleton on wake ─────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const existing = getSingletonContext();
        console.log('👁️ Visible — singleton context state:', existing?.state ?? 'null');
        markContextStaleOnWake();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopCurrent();
    };
  }, [stopCurrent]);

  return { playChord, stopCurrent };
}
