import { useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';
import { useAudioStore } from '@/stores/audioStore';

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
  const activeOscillators = useRef<OscillatorNode[]>([]);
  const getEffectiveVolume = useAudioStore((s) => s.getEffectiveVolume);

  const getContext = useCallback(async () => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
      console.log('🎵 AudioContext created:', {
        state: ctxRef.current.state,
        sampleRate: ctxRef.current.sampleRate,
      });
    }
    
    // CRITICAL FIX: Await resume if suspended
    if (ctxRef.current.state === 'suspended') {
      console.log('⏸️ AudioContext suspended, resuming...');
      try {
        await ctxRef.current.resume();
        console.log('✅ AudioContext resumed successfully');
      } catch (err) {
        console.error('❌ Failed to resume AudioContext:', err);
        throw new Error('Audio playback unavailable - context resume failed');
      }
    }
    
    return ctxRef.current;
  }, []);

  const stopCurrent = useCallback(() => {
    activeOscillators.current.forEach((osc) => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    activeOscillators.current = [];
  }, []);

  const playChord = useCallback(async (chord: ChordData) => {
    const masterVol = getEffectiveVolume();
    if (masterVol === 0) return;   // muted — skip playback entirely

    stopCurrent();
    
    // CRITICAL FIX: Await context initialization and resume
    let ctx: AudioContext;
    try {
      ctx = await getContext();
    } catch (err) {
      console.error('❌ Cannot play chord - AudioContext unavailable:', err);
      return;
    }

    // Master gain: applies volume with boost curve
    // Formula: v^1.2 * 7.93 (+2 dB from previous 6.3)
    const masterGain = ctx.createGain();
    const gain = Math.pow(masterVol, 1.2) * 7.93;
    masterGain.gain.value = gain;
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime + 0.05;     // 50ms lookahead
    const strumDelay = 0.035;                // 35ms between strings
    const noteDuration = 2.5;                // 2.5 second ring-out
    const allOscs: OscillatorNode[] = [];

    // Strum low E to high E (index 0 → 5)
    let strumIndex = 0;
    for (let i = 0; i < 6; i++) {
      const fret = chord.frets[i];
      if (fret === -1) continue;             // muted string — skip

      const freq = getNoteFrequency(i, fret);
      // Bass strings slightly louder: 0.3 - (stringIndex * 0.015)
      const vol = 0.3 - i * 0.015;
      const startTime = now + strumIndex * strumDelay;
      const oscs = createPluck(ctx, freq, startTime, noteDuration, vol, masterGain);
      allOscs.push(...oscs);
      strumIndex++;
    }

    activeOscillators.current = allOscs;
  }, [getContext, stopCurrent, getEffectiveVolume]);

  // Page Visibility API: Resume AudioContext when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && ctxRef.current) {
        if (ctxRef.current.state === 'suspended') {
          console.log('👁️ Tab visible - resuming AudioContext...');
          ctxRef.current.resume()
            .then(() => console.log('✅ AudioContext resumed on visibility change'))
            .catch((err) => console.error('❌ Failed to resume on visibility change:', err));
        }
      } else if (document.visibilityState === 'hidden') {
        console.log('🙈 Tab hidden - AudioContext may suspend');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Cleanup: Stop all oscillators and close context
      stopCurrent();
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close();
      }
    };
  }, [stopCurrent]);

  return { playChord, stopCurrent };
}
